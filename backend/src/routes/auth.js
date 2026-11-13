import { Router } from 'express'
import prisma from '../db.js'

const router = Router()

/**
 * POST /api/auth/cadastrar
 * Realiza o cadastro do colaborador.
 */
router.post('/cadastrar', async (req, res) => {
  try {
    const { nome, email, unidade, setor, senha } = req.body

    if (!nome?.trim() || !email?.trim()) {
      return res.status(400).json({
        erro: 'Nome e e-mail são obrigatórios para o cadastro.',
      })
    }

    const emailNormalizado = email.trim().toLowerCase()

    // Verifica se já existe um jogador cadastrado com este e-mail
    const jogadorExistente = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
    })

    if (jogadorExistente) {
      return res.status(409).json({
        erro: 'Este e-mail corporativo já está cadastrado. Faça login para continuar.',
      })
    }

    const novoJogador = await prisma.jogador.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        unidade: unidade?.trim() || 'Curitiba - Matriz',
        setor: setor?.trim() || 'Geral',
        senha: senha ? String(senha).trim() : null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        unidade: true,
        setor: true,
        criadoEm: true,
      },
    })

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
 * Realiza o login do colaborador pelo e-mail (e senha se cadastrada).
 * Retorna também se o colaborador já possui uma partida em andamento para retomar.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body

    if (!email?.trim()) {
      return res.status(400).json({ erro: 'O e-mail é obrigatório para login.' })
    }

    const emailNormalizado = email.trim().toLowerCase()

    const jogador = await prisma.jogador.findUnique({
      where: { email: emailNormalizado },
      include: {
        partidas: {
          where: { status: 'EM_ANDAMENTO' },
          orderBy: { criadoEm: 'desc' },
          take: 1,
          include: {
            opcoesDesabilitadas: true,
          },
        },
      },
    })

    if (!jogador) {
      return res.status(404).json({
        erro: 'Colaborador não encontrado com este e-mail. Por favor, faça seu cadastro primeiro.',
      })
    }

    // Se o jogador possui senha cadastrada, verifica correspondência
    if (jogador.senha && senha) {
      if (jogador.senha !== String(senha).trim()) {
        return res.status(401).json({ erro: 'Senha incorreta. Tente novamente.' })
      }
    }

    const partidaAtiva = jogador.partidas[0] || null

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      jogador: {
        id: jogador.id,
        nome: jogador.nome,
        email: jogador.email,
        unidade: jogador.unidade,
        setor: jogador.setor,
      },
      partidaEmAndamento: partidaAtiva,
    })
  } catch (error) {
    console.error('[auth/login] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao realizar login.' })
  }
})

export default router

