import bcrypt from 'bcrypt'
import { Router } from 'express'
import {
  GENEROS_VALIDOS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  SETORES_OFICIAIS,
  UNIDADES_OFICIAIS,
  isValidCorporateEmail,
  isValidUuid,
} from '../data/constantes.js'
import prisma from '../db.js'
import {
  invalidateAuthSessionCache,
  requireAuth,
  setAuthSessionCache,
} from '../middleware/requireAuth.js'
import { calcularSegundosTotais, calcularTempoServidor } from '../utils/gameRules.js'
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
  verifySessionToken,
} from '../utils/jwt.js'
import {
  MailConfigurationError,
  MailDeliveryError,
  enviarCodigoRecuperacaoSenha,
  enviarCodigoVerificacaoCadastro,
} from '../utils/mailer.js'
import {
  OTP_EXPIRY_MINUTES,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_PURPOSES,
  OTP_RESEND_COOLDOWN_MS,
  OTP_RESEND_COOLDOWN_SECONDS,
  compararHashOtp,
  gerarCodigoOtp,
  hashCodigoOtp,
  normalizarCodigoOtp,
} from '../utils/otp.js'
import { logSecurityEvent } from '../utils/securityLogger.js'

const router = Router()

// Hash dummy gerado uma única vez no boot para equalizar o tempo de resposta quando o e-mail não existe
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('falavinha-timing-guard-placeholder', 10)

const JOGADOR_SAFE_SELECT = {
  id: true,
  nome: true,
  email: true,
  unidade: true,
  setor: true,
  genero: true,
  criadoEm: true,
}

function validarSenhaForte(senha, { mensagemVazia } = {}) {
  if (typeof senha !== 'string' || !senha.length) {
    return mensagemVazia || `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (senha.length < MIN_PASSWORD_LENGTH || senha.trim().length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (Buffer.byteLength(senha, 'utf8') > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} bytes.`
  }
  return null
}

async function emitirCodigoOtpTx({ tx, jogadorId, email, finalidade, now }) {
  const ultimo = await tx.codigoVerificacao.findFirst({
    where: { jogadorId, finalidade },
    orderBy: { criadoEm: 'desc' },
    select: { id: true, criadoEm: true },
  })

  if (ultimo) {
    const decorridoMs = now.getTime() - ultimo.criadoEm.getTime()
    if (decorridoMs < OTP_RESEND_COOLDOWN_MS) {
      const segundosRestantes = Math.max(
        1,
        Math.ceil((OTP_RESEND_COOLDOWN_MS - decorridoMs) / 1000)
      )
      return { cooldownAtivo: true, segundosRestantes }
    }
  }

  await tx.codigoVerificacao.deleteMany({
    where: { jogadorId, finalidade, consumidoEm: null },
  })

  const codigo = gerarCodigoOtp()
  const codigoHash = hashCodigoOtp({ email, finalidade, codigo })
  const expiraEm = new Date(now.getTime() + OTP_EXPIRY_MS)

  const registro = await tx.codigoVerificacao.create({
    data: {
      jogadorId,
      email,
      finalidade,
      codigoHash,
      maxTentativas: OTP_MAX_ATTEMPTS,
      expiraEm,
    },
    select: { id: true },
  })

  return {
    cooldownAtivo: false,
    registroId: registro.id,
    codigo,
    expiraEm,
  }
}

async function validarEConsumirOtpTx({ tx, jogadorId, email, finalidade, codigoLimpo, now }) {
  const registro = await tx.codigoVerificacao.findFirst({
    where: {
      jogadorId,
      finalidade,
      consumidoEm: null,
    },
    orderBy: { criadoEm: 'desc' },
  })

  if (!registro || registro.expiraEm <= now || registro.tentativas >= registro.maxTentativas) {
    return {
      ok: false,
      reason: 'expired_or_missing',
      erro: 'Código inválido ou expirado. Solicite um novo código.',
    }
  }

  const hashInformado = hashCodigoOtp({ email, finalidade, codigo: codigoLimpo })
  if (!compararHashOtp(registro.codigoHash, hashInformado)) {
    const novasTentativas = registro.tentativas + 1
    const esgotado = novasTentativas >= registro.maxTentativas

    await tx.codigoVerificacao.update({
      where: { id: registro.id },
      data: {
        tentativas: novasTentativas,
        ...(esgotado ? { consumidoEm: now } : {}),
      },
    })

    return {
      ok: false,
      reason: esgotado ? 'max_attempts_reached' : 'invalid_code',
      erro: esgotado
        ? 'Número máximo de tentativas atingido. Solicite um novo código.'
        : `Código incorreto. Você ainda tem ${registro.maxTentativas - novasTentativas} tentativa(s).`,
    }
  }

  const consumido = await tx.codigoVerificacao.updateMany({
    where: { id: registro.id, consumidoEm: null },
    data: { consumidoEm: now },
  })

  if (consumido.count !== 1) {
    return {
      ok: false,
      reason: 'already_consumed',
      erro: 'Este código já foi utilizado. Solicite um novo código.',
    }
  }

  await tx.codigoVerificacao.updateMany({
    where: {
      jogadorId,
      finalidade,
      consumidoEm: null,
    },
    data: { consumidoEm: now },
  })

  return { ok: true }
}

async function removerCodigoNaoEnviado(registroId) {
  if (!registroId) return
  try {
    await prisma.codigoVerificacao.deleteMany({ where: { id: registroId } })
  } catch {
    // Ignora falha secundária de limpeza
  }
}

function responderErroEnvioEmail(res, error) {
  if (error instanceof MailConfigurationError || error instanceof MailDeliveryError) {
    return res.status(503).json({ erro: error.message })
  }
  return res.status(500).json({ erro: 'Erro interno ao enviar e-mail de verificação.' })
}

async function buscarPartidaAtiva(jogadorId) {
  const partida = await prisma.partida.findFirst({
    where: {
      jogadorId,
      status: 'EM_ANDAMENTO',
    },
    orderBy: { criadoEm: 'desc' },
    include: {
      opcoesDesabilitadas: true,
      bloqueios: true,
      tentativas: {
        where: { acertou: false },
        select: {
          desafioId: true,
          penalidadeAplicada: true,
        },
      },
    },
  })

  if (!partida) return null

  // Nunca reseta ultimoSyncEm ao retomar (anti-cheat): calcula o tempo contínuo em tempo real no servidor
  if (partida.cronometroIniciadoEm) {
    const segundosReais = calcularTempoServidor({ partida, now: new Date() })
    const segundosTotais = calcularSegundosTotais({
      segundosReais,
      segundosPenalidade: partida.segundosPenalidade,
      segundosBonus: partida.segundosBonus,
    })
    return {
      ...partida,
      segundosReais,
      segundosTotais,
    }
  }

  return partida
}

/**
 * POST /api/auth/cadastrar
 * Inicia o cadastro do colaborador com validação corporativa, hash bcrypt e envio de código OTP de 6 dígitos por e-mail.
 * A sessão só é emitida após a confirmação em POST /api/auth/verificar-email.
 */
router.post('/cadastrar', async (req, res) => {
  try {
    const { nome, email, unidade, setor, genero, senha } = req.body || {}

    const nomeLimpo = typeof nome === 'string' ? nome.trim() : ''
    if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
      return res.status(400).json({
        erro: 'Informe seu nome completo (entre 2 e 100 caracteres).',
      })
    }

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Utilize um e-mail corporativo válido terminado em @falavinha.com.br.',
      })
    }

    const erroSenha = validarSenhaForte(senha)
    if (erroSenha) {
      return res.status(400).json({ erro: erroSenha })
    }

    const unidadeLimpa = typeof unidade === 'string' ? unidade.trim() : ''
    if (!UNIDADES_OFICIAIS.includes(unidadeLimpa)) {
      return res.status(400).json({
        erro: 'Selecione uma unidade oficial da Falavinha.',
      })
    }

    const setorLimpo = typeof setor === 'string' ? setor.trim() : ''
    if (!SETORES_OFICIAIS.includes(setorLimpo)) {
      return res.status(400).json({
        erro: 'Selecione um setor/departamento oficial.',
      })
    }

    const generoLimpo =
      genero === undefined || genero === null || genero === ''
        ? 'masculino'
        : String(genero).trim().toLowerCase()

    if (!GENEROS_VALIDOS.includes(generoLimpo)) {
      return res.status(400).json({
        erro: 'Gênero inválido. Escolha masculino ou feminino.',
      })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const senhaHash = await bcrypt.hash(senha, 10)
    const now = new Date()

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE email = ${emailNormalizado} FOR UPDATE
      `

      const existente = await tx.jogador.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, emailVerificado: true },
      })

      if (existente?.emailVerificado) {
        return { status: 409, erro: 'Este e-mail corporativo já está cadastrado. Faça login para continuar.' }
      }

      let jogadorId
      let created = false

      if (existente) {
        // Permite sobrescrever cadastro ainda não verificado para impedir bloqueio de e-mail de colega por terceiros
        const atualizado = await tx.jogador.update({
          where: { id: existente.id },
          data: {
            nome: nomeLimpo,
            unidade: unidadeLimpa,
            setor: setorLimpo,
            genero: generoLimpo,
            senha: senhaHash,
            tokenVersion: { increment: 1 },
          },
          select: { id: true },
        })
        jogadorId = atualizado.id
      } else {
        const novo = await tx.jogador.create({
          data: {
            nome: nomeLimpo,
            email: emailNormalizado,
            unidade: unidadeLimpa,
            setor: setorLimpo,
            genero: generoLimpo,
            senha: senhaHash,
            emailVerificado: false,
          },
          select: { id: true },
        })
        jogadorId = novo.id
        created = true
      }

      const otp = await emitirCodigoOtpTx({
        tx,
        jogadorId,
        email: emailNormalizado,
        finalidade: OTP_PURPOSES.CADASTRO,
        now,
      })

      if (otp.cooldownAtivo) {
        return {
          status: 429,
          erro: `Um código já foi enviado recentemente para este e-mail. Aguarde ${otp.segundosRestantes}s antes de solicitar outro.`,
          segundosRestantes: otp.segundosRestantes,
        }
      }

      return {
        status: created ? 201 : 200,
        jogadorId,
        otp,
      }
    })

    if (outcome.erro) {
      return res.status(outcome.status).json({
        erro: outcome.erro,
        ...(outcome.segundosRestantes ? { segundosRestantes: outcome.segundosRestantes } : {}),
      })
    }

    try {
      await enviarCodigoVerificacaoCadastro({
        email: emailNormalizado,
        nome: nomeLimpo,
        codigo: outcome.otp.codigo,
        expiracaoMinutos: OTP_EXPIRY_MINUTES,
      })
    } catch (mailErr) {
      await removerCodigoNaoEnviado(outcome.otp.registroId)
      return responderErroEnvioEmail(res, mailErr)
    }

    logSecurityEvent('EMAIL_VERIFICATION_SENT', {
      jogadorId: outcome.jogadorId,
      email: emailNormalizado,
      ip: req.ip,
    })

    return res.status(outcome.status).json({
      requerVerificacao: true,
      email: emailNormalizado,
      expiraEmMinutos: OTP_EXPIRY_MINUTES,
      cooldownReenvioSegundos: OTP_RESEND_COOLDOWN_SECONDS,
      mensagem: 'Enviamos um código de 6 dígitos para o seu e-mail corporativo.',
    })
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({
        erro: 'Este e-mail corporativo já está cadastrado. Faça login para continuar.',
      })
    }
    console.error('[auth/cadastrar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao realizar cadastro.' })
  }
})

/**
 * POST /api/auth/verificar-email
 * Valida o código OTP de 6 dígitos recebido no e-mail, ativa a conta e emite o cookie httpOnly de sessão.
 */
router.post('/verificar-email', async (req, res) => {
  try {
    const { email, codigo } = req.body || {}

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Informe um e-mail corporativo válido (@falavinha.com.br).',
      })
    }

    const codigoLimpo = normalizarCodigoOtp(codigo)
    if (!codigoLimpo) {
      return res.status(400).json({
        erro: 'Informe o código de verificação de 6 dígitos.',
      })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const now = new Date()

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE email = ${emailNormalizado} FOR UPDATE
      `

      const jogador = await tx.jogador.findUnique({
        where: { email: emailNormalizado },
        select: {
          ...JOGADOR_SAFE_SELECT,
          emailVerificado: true,
          tokenVersion: true,
        },
      })

      if (!jogador) {
        return {
          status: 400,
          reason: 'user_not_found',
          erro: 'Código inválido ou expirado. Solicite um novo código.',
        }
      }

      if (jogador.emailVerificado) {
        return {
          status: 400,
          reason: 'already_verified',
          jogadorId: jogador.id,
          erro: 'Este e-mail já foi verificado. Faça login para continuar.',
        }
      }

      const validacao = await validarEConsumirOtpTx({
        tx,
        jogadorId: jogador.id,
        email: emailNormalizado,
        finalidade: OTP_PURPOSES.CADASTRO,
        codigoLimpo,
        now,
      })

      if (!validacao.ok) {
        return {
          status: 400,
          reason: validacao.reason,
          jogadorId: jogador.id,
          erro: validacao.erro,
        }
      }

      const atualizado = await tx.jogador.update({
        where: { id: jogador.id },
        data: {
          emailVerificado: true,
          emailVerificadoEm: now,
        },
        select: {
          ...JOGADOR_SAFE_SELECT,
          tokenVersion: true,
        },
      })

      return {
        status: 200,
        jogador: atualizado,
      }
    })

    if (outcome.erro) {
      logSecurityEvent('EMAIL_VERIFICATION_FAILED', {
        jogadorId: outcome.jogadorId,
        email: emailNormalizado,
        reason: outcome.reason,
        ip: req.ip,
      })
      return res.status(outcome.status).json({ erro: outcome.erro })
    }

    const { tokenVersion, ...jogadorPublico } = outcome.jogador
    setSessionCookie(res, jogadorPublico.id, tokenVersion)
    setAuthSessionCache(jogadorPublico.id, tokenVersion)

    logSecurityEvent('EMAIL_VERIFIED', {
      jogadorId: jogadorPublico.id,
      email: jogadorPublico.email,
      ip: req.ip,
    })

    return res.json({
      mensagem: 'E-mail verificado e cadastro concluído com sucesso!',
      jogador: jogadorPublico,
    })
  } catch (error) {
    console.error('[auth/verificar-email] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao verificar código.' })
  }
})

/**
 * POST /api/auth/reenviar-codigo-cadastro
 * Reenvia um novo código de confirmação respeitando o intervalo mínimo de 60s.
 */
router.post('/reenviar-codigo-cadastro', async (req, res) => {
  try {
    const { email } = req.body || {}

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Informe um e-mail corporativo válido (@falavinha.com.br).',
      })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const now = new Date()

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE email = ${emailNormalizado} FOR UPDATE
      `

      const jogador = await tx.jogador.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, nome: true, emailVerificado: true },
      })

      if (!jogador || jogador.emailVerificado) {
        return { enviar: false }
      }

      const otp = await emitirCodigoOtpTx({
        tx,
        jogadorId: jogador.id,
        email: emailNormalizado,
        finalidade: OTP_PURPOSES.CADASTRO,
        now,
      })

      if (otp.cooldownAtivo) {
        return {
          status: 429,
          erro: `Aguarde ${otp.segundosRestantes}s antes de solicitar um novo código.`,
          segundosRestantes: otp.segundosRestantes,
        }
      }

      return {
        enviar: true,
        jogadorId: jogador.id,
        nome: jogador.nome,
        otp,
      }
    })

    if (outcome.erro) {
      return res.status(outcome.status).json({
        erro: outcome.erro,
        segundosRestantes: outcome.segundosRestantes,
      })
    }

    if (outcome.enviar) {
      try {
        await enviarCodigoVerificacaoCadastro({
          email: emailNormalizado,
          nome: outcome.nome,
          codigo: outcome.otp.codigo,
          expiracaoMinutos: OTP_EXPIRY_MINUTES,
        })
      } catch (mailErr) {
        await removerCodigoNaoEnviado(outcome.otp.registroId)
        return responderErroEnvioEmail(res, mailErr)
      }

      logSecurityEvent('EMAIL_VERIFICATION_SENT', {
        jogadorId: outcome.jogadorId,
        email: emailNormalizado,
        resend: true,
        ip: req.ip,
      })
    }

    return res.json({
      cooldownReenvioSegundos: OTP_RESEND_COOLDOWN_SECONDS,
      mensagem: 'Se houver um cadastro pendente para este e-mail, um novo código foi enviado.',
    })
  } catch (error) {
    console.error('[auth/reenviar-codigo-cadastro] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao reenviar código.' })
  }
})

/**
 * POST /api/auth/login
 * Realiza o login do colaborador validando hash bcrypt, confirmação de e-mail e emitindo cookie httpOnly JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {}

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Informe um e-mail corporativo válido (@falavinha.com.br).',
      })
    }

    if (typeof senha !== 'string' || !senha.length || Buffer.byteLength(senha, 'utf8') > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ erro: 'Informe sua senha para entrar.' })
    }

    const emailNormalizado = email.trim().toLowerCase()

    const jogador = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
    })

    if (!jogador) {
      await bcrypt.compare(senha, DUMMY_BCRYPT_HASH)
      logSecurityEvent('LOGIN_FAILED', {
        email: emailNormalizado,
        reason: 'user_not_found',
        ip: req.ip,
      })
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.',
      })
    }

    // Garante que apenas senhas devidamente hasheadas com bcrypt sejam aceitas
    const senhaValida =
      typeof jogador.senha === 'string' &&
      jogador.senha.startsWith('$2') &&
      (await bcrypt.compare(senha, jogador.senha))

    if (!senhaValida) {
      logSecurityEvent('LOGIN_FAILED', {
        jogadorId: jogador.id,
        email: emailNormalizado,
        reason: 'invalid_password',
        ip: req.ip,
      })
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.',
      })
    }

    if (!jogador.emailVerificado) {
      logSecurityEvent('LOGIN_BLOCKED_UNVERIFIED', {
        jogadorId: jogador.id,
        email: emailNormalizado,
        ip: req.ip,
      })
      return res.status(403).json({
        erro: 'Seu e-mail corporativo ainda não foi verificado. Confirme o código enviado para continuar.',
        codigoErro: 'EMAIL_NAO_VERIFICADO',
      })
    }

    setSessionCookie(res, jogador.id, jogador.tokenVersion)
    setAuthSessionCache(jogador.id, jogador.tokenVersion)
    const partidaAtiva = await buscarPartidaAtiva(jogador.id)

    logSecurityEvent('LOGIN_SUCCESS', {
      jogadorId: jogador.id,
      email: jogador.email,
      ip: req.ip,
    })

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      jogador: {
        id: jogador.id,
        nome: jogador.nome,
        email: jogador.email,
        unidade: jogador.unidade,
        setor: jogador.setor,
        genero: jogador.genero || 'masculino',
      },
      partidaEmAndamento: partidaAtiva,
    })
  } catch (error) {
    console.error('[auth/login] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao realizar login.' })
  }
})

/**
 * POST /api/auth/esqueci-senha
 * Solicita código de 6 dígitos para recuperação de senha com proteção anti-enumeração de e-mails.
 */
router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body || {}

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Informe um e-mail corporativo válido (@falavinha.com.br).',
      })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const now = new Date()

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE email = ${emailNormalizado} FOR UPDATE
      `

      const jogador = await tx.jogador.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, nome: true, emailVerificado: true },
      })

      if (!jogador || !jogador.emailVerificado) {
        return { enviar: false }
      }

      const otp = await emitirCodigoOtpTx({
        tx,
        jogadorId: jogador.id,
        email: emailNormalizado,
        finalidade: OTP_PURPOSES.RECUPERACAO_SENHA,
        now,
      })

      if (otp.cooldownAtivo) {
        // Mantém resposta neutra para não vazar existência da conta durante o cooldown
        return { enviar: false, cooldownSilencioso: true }
      }

      return {
        enviar: true,
        jogadorId: jogador.id,
        nome: jogador.nome,
        otp,
      }
    })

    if (outcome.enviar) {
      try {
        await enviarCodigoRecuperacaoSenha({
          email: emailNormalizado,
          nome: outcome.nome,
          codigo: outcome.otp.codigo,
          expiracaoMinutos: OTP_EXPIRY_MINUTES,
        })
      } catch (mailErr) {
        await removerCodigoNaoEnviado(outcome.otp.registroId)
        return responderErroEnvioEmail(res, mailErr)
      }

      logSecurityEvent('PASSWORD_RESET_REQUESTED', {
        jogadorId: outcome.jogadorId,
        email: emailNormalizado,
        ip: req.ip,
      })
    }

    return res.json({
      cooldownReenvioSegundos: OTP_RESEND_COOLDOWN_SECONDS,
      expiraEmMinutos: OTP_EXPIRY_MINUTES,
      mensagem:
        'Se este e-mail corporativo estiver cadastrado e verificado, enviaremos um código de recuperação em instantes.',
    })
  } catch (error) {
    console.error('[auth/esqueci-senha] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao solicitar recuperação de senha.' })
  }
})

/**
 * POST /api/auth/redefinir-senha
 * Valida o código de 6 dígitos, redefine a senha com bcrypt e revoga todas as sessões anteriores via tokenVersion.
 */
router.post('/redefinir-senha', async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body || {}

    if (!isValidCorporateEmail(email)) {
      return res.status(400).json({
        erro: 'Informe um e-mail corporativo válido (@falavinha.com.br).',
      })
    }

    const codigoLimpo = normalizarCodigoOtp(codigo)
    if (!codigoLimpo) {
      return res.status(400).json({
        erro: 'Informe o código de recuperação de 6 dígitos.',
      })
    }

    const erroSenha = validarSenhaForte(novaSenha, {
      mensagemVazia: `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
    })
    if (erroSenha) {
      return res.status(400).json({ erro: erroSenha })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10)
    const now = new Date()

    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE email = ${emailNormalizado} FOR UPDATE
      `

      const jogador = await tx.jogador.findUnique({
        where: { email: emailNormalizado },
        select: { id: true, emailVerificado: true },
      })

      if (!jogador || !jogador.emailVerificado) {
        return {
          status: 400,
          reason: 'user_not_found_or_unverified',
          erro: 'Código de recuperação inválido ou expirado.',
        }
      }

      const validacao = await validarEConsumirOtpTx({
        tx,
        jogadorId: jogador.id,
        email: emailNormalizado,
        finalidade: OTP_PURPOSES.RECUPERACAO_SENHA,
        codigoLimpo,
        now,
      })

      if (!validacao.ok) {
        return {
          status: 400,
          reason: validacao.reason,
          jogadorId: jogador.id,
          erro: validacao.erro,
        }
      }

      await tx.jogador.update({
        where: { id: jogador.id },
        data: {
          senha: novaSenhaHash,
          tokenVersion: { increment: 1 },
        },
      })

      return {
        status: 200,
        jogadorId: jogador.id,
      }
    })

    if (outcome.erro) {
      logSecurityEvent('PASSWORD_RESET_FAILED', {
        jogadorId: outcome.jogadorId,
        email: emailNormalizado,
        reason: outcome.reason,
        ip: req.ip,
      })
      return res.status(outcome.status).json({ erro: outcome.erro })
    }

    invalidateAuthSessionCache(outcome.jogadorId)
    logSecurityEvent('PASSWORD_RESET_COMPLETED', {
      jogadorId: outcome.jogadorId,
      email: emailNormalizado,
      ip: req.ip,
    })

    return res.json({
      mensagem: 'Senha redefinida com sucesso! Faça login com sua nova senha.',
    })
  } catch (error) {
    console.error('[auth/redefinir-senha] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao redefinir senha.' })
  }
})

/**
 * GET /api/auth/me
 * Restaura os dados do colaborador autenticado e sua partida em andamento (ex.: após F5).
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const jogador = await prisma.jogador.findUnique({
      where: { id: req.jogadorId },
      select: JOGADOR_SAFE_SELECT,
    })

    if (!jogador) {
      clearSessionCookie(res)
      return res.status(401).json({ erro: 'Sessão inválida. Faça login novamente.' })
    }

    const partidaAtiva = await buscarPartidaAtiva(jogador.id)

    return res.json({
      jogador,
      partidaEmAndamento: partidaAtiva,
    })
  } catch (error) {
    console.error('[auth/me] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao restaurar sessão.' })
  }
})

/**
 * POST /api/auth/logout
 * Encerra a sessão revogando todos os JWTs anteriores via `tokenVersion` e limpando o cookie httpOnly.
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME]
    if (token) {
      try {
        const decoded = verifySessionToken(token)
        if (isValidUuid(decoded?.sub)) {
          await prisma.jogador.updateMany({
            where: { id: decoded.sub },
            data: { tokenVersion: { increment: 1 } },
          })
          invalidateAuthSessionCache(decoded.sub)
          logSecurityEvent('LOGOUT_REVOKED', {
            jogadorId: decoded.sub,
            ip: req.ip,
          })
        }
      } catch {
        // Token já expirado ou inválido: apenas limpa o cookie
      }
    }
  } catch (error) {
    console.error('[auth/logout] Erro ao revogar tokenVersion:', error)
  }

  clearSessionCookie(res)
  return res.json({ mensagem: 'Sessão encerrada com sucesso.' })
})

export default router
