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
 * Realiza o cadastro do colaborador com validação corporativa (@falavinha.com.br), hash bcrypt
 * e emissão imediata do cookie httpOnly de sessão.
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
    const existente = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
      select: { id: true },
    })

    if (existente) {
      return res.status(409).json({
        erro: 'Este e-mail corporativo já está cadastrado. Faça login para continuar.',
      })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const jogadorCriado = await prisma.jogador.create({
      data: {
        nome: nomeLimpo,
        email: emailNormalizado,
        unidade: unidadeLimpa,
        setor: setorLimpo,
        genero: generoLimpo,
        senha: senhaHash,
      },
      select: {
        ...JOGADOR_SAFE_SELECT,
        tokenVersion: true,
      },
    })

    const { tokenVersion, ...jogadorPublico } = jogadorCriado
    setSessionCookie(res, jogadorPublico.id, tokenVersion)
    setAuthSessionCache(jogadorPublico.id, tokenVersion)

    logSecurityEvent('REGISTER_SUCCESS', {
      jogadorId: jogadorPublico.id,
      email: jogadorPublico.email,
      ip: req.ip,
    })

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso!',
      jogador: jogadorPublico,
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
 * POST /api/auth/login
 * Realiza o login do colaborador validando hash bcrypt e emitindo cookie httpOnly JWT.
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
