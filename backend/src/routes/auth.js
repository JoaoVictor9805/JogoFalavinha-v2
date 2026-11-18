import bcrypt from 'bcryptjs'
import { Router } from 'express'
import {
  GENEROS_VALIDOS,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  SETORES_OFICIAIS,
  UNIDADES_OFICIAIS,
  isValidCorporateEmail,
} from '../data/constantes.js'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { clearSessionCookie, setSessionCookie } from '../utils/jwt.js'

const router = Router()

const JOGADOR_SAFE_SELECT = {
  id: true,
  nome: true,
  email: true,
  unidade: true,
  setor: true,
  genero: true,
  criadoEm: true,
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
    },
  })

  // Ao retomar uma partida que já teve cronômetro iniciado, atualiza o marco de sincronização
  // para que o tempo em pausa (aba fechada) não dispare o anti-cheat na próxima resposta.
  if (partida?.cronometroIniciadoEm) {
    return prisma.partida.update({
      where: { id: partida.id },
      data: { ultimoSyncEm: new Date() },
      include: {
        opcoesDesabilitadas: true,
        bloqueios: true,
      },
    })
  }

  return partida
}

/**
 * POST /api/auth/cadastrar
 * Realiza o cadastro do colaborador com validação corporativa, hash bcrypt e sessão via cookie httpOnly.
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

    if (
      typeof senha !== 'string' ||
      senha.trim().length < MIN_PASSWORD_LENGTH ||
      senha.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        erro: `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
      })
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

    const jogadorExistente = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
      select: { id: true },
    })

    if (jogadorExistente) {
      return res.status(409).json({
        erro: 'Este e-mail corporativo já está cadastrado. Faça login para continuar.',
      })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const novoJogador = await prisma.jogador.create({
      data: {
        nome: nomeLimpo,
        email: emailNormalizado,
        unidade: unidadeLimpa,
        setor: setorLimpo,
        genero: generoLimpo,
        senha: senhaHash,
      },
      select: JOGADOR_SAFE_SELECT,
    })

    setSessionCookie(res, novoJogador.id)

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso!',
      jogador: novoJogador,
    })
  } catch (error) {
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

    if (typeof senha !== 'string' || !senha.length) {
      return res.status(400).json({ erro: 'Informe sua senha para entrar.' })
    }

    const emailNormalizado = email.trim().toLowerCase()

    const jogador = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
    })

    if (!jogador) {
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
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.',
      })
    }

    setSessionCookie(res, jogador.id)
    const partidaAtiva = await buscarPartidaAtiva(jogador.id)

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
 * Encerra a sessão limpando o cookie httpOnly.
 */
router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  return res.json({ mensagem: 'Sessão encerrada com sucesso.' })
})

export default router
