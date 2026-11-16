import { Router } from 'express'
import prisma from '../db.js'
import { formatarDataBrasilia } from '../utils/dateFormatter.js'

const router = Router()

/**
 * POST /api/partidas/iniciar
 * Cria uma nova partida ou recupera a partida em andamento do jogador.
 */
router.post('/iniciar', async (req, res) => {
  try {
    const { jogadorId, forceNew } = req.body

    if (!jogadorId) {
      return res.status(400).json({ erro: 'ID do jogador é obrigatório.' })
    }

    const jogador = await prisma.jogador.findUnique({
      where: { id: jogadorId },
    })

    if (!jogador) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' })
    }

    // Se for solicitado forceNew (ex: Jogar Novamente a partir do Ranking), encerra qualquer partida pendente
    if (forceNew) {
      await prisma.partida.updateMany({
        where: {
          jogadorId,
          status: 'EM_ANDAMENTO',
        },
        data: {
          status: 'CANCELADA',
          finalizadoEm: new Date(),
        },
      })
    }

    // Busca se já existe partida em andamento para este jogador (retomar)
    let partida = null
    if (!forceNew) {
      partida = await prisma.partida.findFirst({
        where: {
          jogadorId,
          status: 'EM_ANDAMENTO',
        },
        include: {
          opcoesDesabilitadas: true,
          jogador: {
            select: { id: true, nome: true, email: true, unidade: true, setor: true, genero: true },
          },
        },
        orderBy: { iniciadoEm: 'desc' },
      })
    }

    // Se não existir partida aberta, cria uma nova
    if (!partida) {
      partida = await prisma.partida.create({
        data: {
          jogadorId,
          status: 'EM_ANDAMENTO',
          etapaAtual: 0,
          membrosConcluidos: [],
          iniciadoEm: new Date(),
        },
        include: {
          opcoesDesabilitadas: true,
          jogador: {
            select: { id: true, nome: true, email: true, unidade: true, setor: true, genero: true },
          },
        },
      })
    }

    return res.json({
      mensagem: 'Partida pronta.',
      partida,
    })
  } catch (error) {
    console.error('[partidas/iniciar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao iniciar partida.' })
  }
})

/**
 * GET /api/partidas/jogador/:jogadorId/historico
 * Retorna todas as tentativas concluídas do colaborador ordenadas, com numeração e recorde.
 */
router.get('/jogador/:jogadorId/historico', async (req, res) => {
  try {
    const { jogadorId } = req.params

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jogadorId)
    if (!isUuid) {
      return res.status(400).json({ erro: 'ID do jogador inválido.' })
    }

    const jogador = await prisma.jogador.findUnique({
      where: { id: jogadorId },
      select: { id: true, nome: true, email: true, unidade: true, setor: true },
    })

    if (!jogador) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' })
    }

    // Busca todas as partidas concluídas ordenadas cronologicamente para numerar 1, 2, 3...
    const partidasConcluidas = await prisma.partida.findMany({
      where: {
        jogadorId: jogador.id,
        status: 'CONCLUIDA',
      },
      orderBy: { iniciadoEm: 'asc' },
      select: {
        id: true,
        iniciadoEm: true,
        finalizadoEm: true,
        segundosReais: true,
        segundosPenalidade: true,
        segundosTotais: true,
        totalErros: true,
        etapaAtual: true,
      },
    })

    // Localiza a melhor partida (menor tempo oficial e desempate por menos erros)
    let melhorPartida = null
    if (partidasConcluidas.length > 0) {
      melhorPartida = [...partidasConcluidas].sort((a, b) => {
        if (a.segundosTotais !== b.segundosTotais) {
          return a.segundosTotais - b.segundosTotais
        }
        return a.totalErros - b.totalErros
      })[0]
    }

    // Mapeia atribuindo número da tentativa de 1 a N
    const tentativasNumeradas = partidasConcluidas.map((p, idx) => ({
      id: p.id,
      tentativaNumero: idx + 1,
      isMelhorTempo: melhorPartida ? p.id === melhorPartida.id : false,
      segundosReais: p.segundosReais,
      segundosPenalidade: p.segundosPenalidade,
      segundosTotais: p.segundosTotais,
      totalErros: p.totalErros,
      completedAt: formatarDataBrasilia(p.finalizadoEm),
      startedAt: formatarDataBrasilia(p.iniciadoEm),
    }))

    // Inverte para exibição visual: tentativa mais recente primeiro
    return res.json({
      jogador,
      totalTentativas: partidasConcluidas.length,
      melhorPartida,
      tentativas: [...tentativasNumeradas].reverse(),
    })
  } catch (error) {
    console.error('[partidas/historico] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar histórico de tentativas.' })
  }
})

/**
 * GET /api/partidas/:id
 * Retorna o estado atual da partida e suas opções desabilitadas.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const partida = await prisma.partida.findUnique({
      where: { id },
      include: {
        opcoesDesabilitadas: true,
        jogador: {
          select: { id: true, nome: true, email: true, unidade: true, setor: true, genero: true },
        },
      },
    })

    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' })
    }

    return res.json(partida)
  } catch (error) {
    console.error('[partidas/buscar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar partida.' })
  }
})

/**
 * POST /api/partidas/:id/validar
 * Valida a resposta enviada pelo jogador no servidor.
 * - Se acertar: avança Johnny no labirinto, adiciona membro concluído e verifica vitória.
 * - Se errar: aplica +5 segundos de penalidade e registra a opção desabilitada.
 */
router.post('/:id/validar', async (req, res) => {
  try {
    const { id } = req.params
    const { membroId, opcaoId, segundosReais } = req.body

    if (!membroId || !opcaoId) {
      return res.status(400).json({ erro: 'membroId e opcaoId são obrigatórios.' })
    }

    const partida = await prisma.partida.findUnique({
      where: { id },
      include: {
        opcoesDesabilitadas: true,
      },
    })

    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' })
    }

    if (partida.status === 'CONCLUIDA') {
      return res.status(400).json({ erro: 'Esta partida já foi finalizada.' })
    }

    const membroNum = Number(membroId)
    const opcaoStr = String(opcaoId).trim().toLowerCase()

    // Verifica se este conselheiro já foi aprovado anteriormente
    if (partida.membrosConcluidos.includes(membroNum)) {
      return res.status(400).json({ erro: 'Este conselheiro já foi aprovado.' })
    }

    // Busca a opção no banco de dados com a flag de resposta correta
    const opcao = await prisma.opcaoDesafio.findUnique({
      where: {
        desafioId_opcaoId: {
          desafioId: membroNum,
          opcaoId: opcaoStr,
        },
      },
      include: { desafio: true },
    })

    if (!opcao) {
      return res.status(404).json({ erro: 'Alternativa não encontrada para este desafio.' })
    }

    const segundosValidos = typeof segundosReais === 'number' && segundosReais >= 0
      ? Math.floor(segundosReais)
      : partida.segundosReais

    // CENÁRIO 1: O JOGADOR ACERTOU
    if (opcao.correta) {
      // Registra a tentativa com sucesso
      await prisma.tentativa.create({
        data: {
          partidaId: partida.id,
          desafioId: membroNum,
          opcaoSelecionada: opcaoStr,
          acertou: true,
          penalidadeAplicada: 0,
        },
      })

      const novosMembros = Array.from(new Set([...partida.membrosConcluidos, membroNum]))
      const proximoPasso = novosMembros.length
      const jogoConcluido = novosMembros.length >= 7

      const dadosAtualizacao = {
        membrosConcluidos: novosMembros,
        etapaAtual: proximoPasso,
        segundosReais: segundosValidos,
        segundosTotais: segundosValidos + partida.segundosPenalidade,
      }

      if (jogoConcluido) {
        dadosAtualizacao.status = 'CONCLUIDA'
        dadosAtualizacao.finalizadoEm = new Date()
      }

      const partidaAtualizada = await prisma.partida.update({
        where: { id: partida.id },
        data: dadosAtualizacao,
        include: {
          opcoesDesabilitadas: true,
          jogador: {
            select: { id: true, nome: true, email: true, unidade: true, setor: true, genero: true },
          },
        },
      })

      return res.json({
        acertou: true,
        membroId: membroNum,
        mensagemAprovacao: opcao.desafio.mensagemAprovacao,
        etapaAtual: partidaAtualizada.etapaAtual,
        membrosConcluidos: partidaAtualizada.membrosConcluidos,
        jogoConcluido,
        partida: partidaAtualizada,
      })
    }

    // CENÁRIO 2: O JOGADOR ERROU (+5s de penalidade)
    await prisma.tentativa.create({
      data: {
        partidaId: partida.id,
        desafioId: membroNum,
        opcaoSelecionada: opcaoStr,
        acertou: false,
        penalidadeAplicada: 5,
      },
    })

    // Registra a opção desabilitada para não ser clicada de novo
    await prisma.opcaoDesabilitada.upsert({
      where: {
        partidaId_membroId_opcaoId: {
          partidaId: partida.id,
          membroId: membroNum,
          opcaoId: opcaoStr,
        },
      },
      update: {},
      create: {
        partidaId: partida.id,
        membroId: membroNum,
        opcaoId: opcaoStr,
      },
    })

    const novaPenalidade = partida.segundosPenalidade + 5
    const novosErros = partida.totalErros + 1
    const novoTotal = segundosValidos + novaPenalidade

    const partidaAtualizada = await prisma.partida.update({
      where: { id: partida.id },
      data: {
        segundosPenalidade: novaPenalidade,
        totalErros: novosErros,
        segundosReais: segundosValidos,
        segundosTotais: novoTotal,
      },
      include: {
        opcoesDesabilitadas: true,
        jogador: {
          select: { id: true, nome: true, email: true, unidade: true, setor: true, genero: true },
        },
      },
    })

    return res.json({
      acertou: false,
      penalidade: 5,
      opcaoId: opcaoStr,
      membroId: membroNum,
      totalErros: partidaAtualizada.totalErros,
      segundosPenalidade: partidaAtualizada.segundosPenalidade,
      partida: partidaAtualizada,
    })
  } catch (error) {
    console.error('[partidas/validar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao validar resposta.' })
  }
})

/**
 * POST /api/partidas/:id/sincronizar-tempo
 * Sincroniza periodicamente o tempo decorrido do jogador para persistência.
 */
router.post('/:id/sincronizar-tempo', async (req, res) => {
  try {
    const { id } = req.params
    const { segundosReais } = req.body

    if (typeof segundosReais !== 'number' || segundosReais < 0) {
      return res.status(400).json({ erro: 'segundosReais deve ser um número válido.' })
    }

    const partida = await prisma.partida.findUnique({ where: { id } })
    if (!partida || partida.status === 'CONCLUIDA') {
      return res.json({ ok: false })
    }

    const segundosValidos = Math.floor(segundosReais)
    await prisma.partida.update({
      where: { id },
      data: {
        segundosReais: segundosValidos,
        segundosTotais: segundosValidos + partida.segundosPenalidade,
      },
    })

    return res.json({ ok: true })
  } catch (error) {
    console.error('[partidas/sincronizar-tempo] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao sincronizar tempo.' })
  }
})

export default router

