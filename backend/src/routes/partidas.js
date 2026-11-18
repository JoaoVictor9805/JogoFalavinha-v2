import { Router } from 'express'
import { isValidUuid } from '../data/constantes.js'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { formatarDataBrasilia } from '../utils/dateFormatter.js'
import {
  avaliarBonusAcerto,
  avaliarResultadoErro,
  calcularSegundosTotais,
  calcularTempoSeguro,
} from '../utils/gameRules.js'

const router = Router()

// Todas as rotas de partida exigem sessão autenticada
router.use(requireAuth)

const JOGADOR_PUBLIC_SELECT = {
  id: true,
  nome: true,
  email: true,
  unidade: true,
  setor: true,
  genero: true,
}

const PARTIDA_INCLUDE = {
  opcoesDesabilitadas: true,
  bloqueios: true,
  jogador: {
    select: JOGADOR_PUBLIC_SELECT,
  },
}

async function montarHistoricoJogador(jogadorId) {
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    select: { id: true, nome: true, email: true, unidade: true, setor: true },
  })

  if (!jogador) {
    return null
  }

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
      segundosBonus: true,
      segundosTotais: true,
      totalErros: true,
      totalCombos: true,
      etapaAtual: true,
    },
  })

  let melhorPartida = null
  if (partidasConcluidas.length > 0) {
    melhorPartida = [...partidasConcluidas].sort((a, b) => {
      if (a.segundosTotais !== b.segundosTotais) {
        return a.segundosTotais - b.segundosTotais
      }
      return a.totalErros - b.totalErros
    })[0]
  }

  const tentativasNumeradas = partidasConcluidas.map((p, idx) => ({
    id: p.id,
    tentativaNumero: idx + 1,
    isMelhorTempo: melhorPartida ? p.id === melhorPartida.id : false,
    segundosReais: p.segundosReais,
    segundosPenalidade: p.segundosPenalidade,
    segundosBonus: p.segundosBonus || 0,
    segundosTotais: p.segundosTotais,
    totalErros: p.totalErros,
    totalCombos: p.totalCombos || 0,
    invicto: p.totalErros === 0,
    completedAt: formatarDataBrasilia(p.finalizadoEm),
    startedAt: formatarDataBrasilia(p.iniciadoEm),
  }))

  return {
    jogador,
    totalTentativas: partidasConcluidas.length,
    melhorPartida: melhorPartida
      ? {
          ...melhorPartida,
          invicto: melhorPartida.totalErros === 0,
        }
      : null,
    tentativas: [...tentativasNumeradas].reverse(),
  }
}

/**
 * POST /api/partidas/iniciar
 * Cria uma nova partida ou recupera a partida em andamento do jogador autenticado.
 */
router.post('/iniciar', async (req, res) => {
  try {
    const jogadorId = req.jogadorId
    const forceNew = Boolean(req.body?.forceNew)

    const jogador = await prisma.jogador.findUnique({
      where: { id: jogadorId },
      select: { id: true },
    })

    if (!jogador) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' })
    }

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

    let partida = null
    if (!forceNew) {
      partida = await prisma.partida.findFirst({
        where: {
          jogadorId,
          status: 'EM_ANDAMENTO',
        },
        include: PARTIDA_INCLUDE,
        orderBy: { iniciadoEm: 'desc' },
      })

      if (partida?.cronometroIniciadoEm) {
        partida = await prisma.partida.update({
          where: { id: partida.id },
          data: { ultimoSyncEm: new Date() },
          include: PARTIDA_INCLUDE,
        })
      }
    }

    if (!partida) {
      partida = await prisma.partida.create({
        data: {
          jogadorId,
          status: 'EM_ANDAMENTO',
          etapaAtual: 0,
          membrosConcluidos: [],
          iniciadoEm: new Date(),
        },
        include: PARTIDA_INCLUDE,
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
 * GET /api/partidas/meu-historico
 * Retorna o histórico de tentativas concluídas do colaborador autenticado.
 */
router.get('/meu-historico', async (req, res) => {
  try {
    const historico = await montarHistoricoJogador(req.jogadorId)
    if (!historico) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' })
    }
    return res.json(historico)
  } catch (error) {
    console.error('[partidas/meu-historico] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar histórico de tentativas.' })
  }
})

/**
 * GET /api/partidas/jogador/:jogadorId/historico
 * Retorna todas as tentativas concluídas do colaborador autenticado (bloqueia IDOR).
 */
router.get('/jogador/:jogadorId/historico', async (req, res) => {
  try {
    const { jogadorId } = req.params

    if (!isValidUuid(jogadorId)) {
      return res.status(400).json({ erro: 'ID do jogador inválido.' })
    }

    if (jogadorId !== req.jogadorId) {
      return res.status(403).json({ erro: 'Acesso negado ao histórico de outro colaborador.' })
    }

    const historico = await montarHistoricoJogador(jogadorId)
    if (!historico) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' })
    }

    return res.json(historico)
  } catch (error) {
    console.error('[partidas/historico] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar histórico de tentativas.' })
  }
})

/**
 * GET /api/partidas/:id
 * Retorna o estado atual da partida, opções desabilitadas e bloqueios ativos (somente dono).
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    const partida = await prisma.partida.findUnique({
      where: { id },
      include: PARTIDA_INCLUDE,
    })

    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' })
    }

    if (partida.jogadorId !== req.jogadorId) {
      return res.status(403).json({ erro: 'Você não tem permissão para acessar esta partida.' })
    }

    return res.json(partida)
  } catch (error) {
    console.error('[partidas/buscar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar partida.' })
  }
})

/**
 * POST /api/partidas/:id/iniciar-cronometro
 * Marca no servidor o início efetivo do cronômetro quando o jogador confirma o briefing 3D.
 */
router.post('/:id/iniciar-cronometro', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    const partida = await prisma.partida.findUnique({ where: { id } })
    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' })
    }

    if (partida.jogadorId !== req.jogadorId) {
      return res.status(403).json({ erro: 'Você não tem permissão para iniciar esta partida.' })
    }

    if (partida.status !== 'EM_ANDAMENTO') {
      return res.status(400).json({ erro: 'Esta partida não está mais em andamento.' })
    }

    const now = new Date()
    const atualizada = await prisma.partida.update({
      where: { id },
      data: {
        cronometroIniciadoEm: partida.cronometroIniciadoEm || now,
        ultimoSyncEm: now,
      },
      select: {
        id: true,
        cronometroIniciadoEm: true,
        ultimoSyncEm: true,
      },
    })

    return res.json({
      ok: true,
      cronometroIniciadoEm: atualizada.cronometroIniciadoEm,
    })
  } catch (error) {
    console.error('[partidas/iniciar-cronometro] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao iniciar cronômetro.' })
  }
})

/**
 * POST /api/partidas/:id/validar
 * Valida a resposta no servidor dentro de transação atômica com row-lock:
 * - Impede race condition e dupla penalidade
 * - Aplica anti-cheat do cronômetro
 * - Acertos seguidos de primeira ativam Combo (-5s) e partida sem erros ganha bônus Invicto (-10s)
 * - 1º/2º erro: +5s | 3º erro: +10s, bloqueio de 10s e reset das opções do conselheiro
 */
router.post('/:id/validar', async (req, res) => {
  try {
    const { id } = req.params
    const { membroId, opcaoId, segundosReais } = req.body || {}

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    const membroNum = Number(membroId)
    const opcaoStr = typeof opcaoId === 'string' ? opcaoId.trim().toLowerCase() : ''

    if (!Number.isInteger(membroNum) || membroNum < 1 || !['a', 'b', 'c', 'd'].includes(opcaoStr)) {
      return res.status(400).json({ erro: 'membroId ou opcaoId inválidos.' })
    }

    const outcome = await prisma.$transaction(async (tx) => {
      // Lock de linha na partida evita condições de corrida entre cliques/abas simultâneas
      const lockedRows = await tx.$queryRaw`
        SELECT id FROM "partidas" WHERE id = ${id} FOR UPDATE
      `
      if (!Array.isArray(lockedRows) || lockedRows.length === 0) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      const partida = await tx.partida.findUnique({
        where: { id },
        include: {
          opcoesDesabilitadas: true,
          bloqueios: true,
        },
      })

      if (!partida) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      if (partida.jogadorId !== req.jogadorId) {
        return {
          httpStatus: 403,
          payload: { erro: 'Você não tem permissão para interagir com esta partida.' },
        }
      }

      if (partida.status !== 'EM_ANDAMENTO') {
        return { httpStatus: 400, payload: { erro: 'Esta partida não está mais em andamento.' } }
      }

      if (partida.membrosConcluidos.includes(membroNum)) {
        return { httpStatus: 400, payload: { erro: 'Este conselheiro já foi aprovado.' } }
      }

      const now = new Date()

      // Verifica se este conselheiro está temporariamente bloqueado (10s após 3 erros)
      const bloqueioAtivo = partida.bloqueios.find(
        (b) => b.membroId === membroNum && b.bloqueadoAte && b.bloqueadoAte > now
      )
      if (bloqueioAtivo) {
        const segundosRestantes = Math.max(
          1,
          Math.ceil((bloqueioAtivo.bloqueadoAte.getTime() - now.getTime()) / 1000)
        )
        return {
          httpStatus: 423,
          payload: {
            erro: `Conselheiro bloqueado. Aguarde ${segundosRestantes}s para tentar novamente.`,
            bloqueado: true,
            membroId: membroNum,
            bloqueadoAte: bloqueioAtivo.bloqueadoAte,
            segundosRestantes,
          },
        }
      }

      const opcao = await tx.opcaoDesafio.findUnique({
        where: {
          desafioId_opcaoId: {
            desafioId: membroNum,
            opcaoId: opcaoStr,
          },
        },
        include: { desafio: true },
      })

      if (!opcao) {
        return { httpStatus: 404, payload: { erro: 'Alternativa não encontrada para este desafio.' } }
      }

      // Impede reaplicação de penalidade caso uma opção já descartada no ciclo seja reenviada
      const jaDesabilitada = partida.opcoesDesabilitadas.some(
        (o) => o.membroId === membroNum && o.opcaoId === opcaoStr
      )
      if (jaDesabilitada) {
        return {
          httpStatus: 400,
          payload: { erro: 'Esta alternativa já foi descartada neste ciclo.' },
        }
      }

      const segundosValidos = calcularTempoSeguro({
        partida,
        clientSeconds: segundosReais,
        now,
      })

      // CENÁRIO 1: O JOGADOR ACERTOU
      if (opcao.correta) {
        const errosPreviosNoMembro = await tx.tentativa.count({
          where: {
            partidaId: partida.id,
            desafioId: membroNum,
            acertou: false,
          },
        })
        const acertouDePrimeira = errosPreviosNoMembro === 0

        await tx.tentativa.create({
          data: {
            partidaId: partida.id,
            desafioId: membroNum,
            opcaoSelecionada: opcaoStr,
            acertou: true,
            penalidadeAplicada: 0,
          },
        })

        // Limpa eventuais opções desabilitadas deste membro ao aprovar
        await tx.opcaoDesabilitada.deleteMany({
          where: { partidaId: partida.id, membroId: membroNum },
        })

        const totalDesafiosBanco = await tx.desafio.count()
        const totalDesafios = totalDesafiosBanco > 0 ? totalDesafiosBanco : 7

        const novosMembros = Array.from(new Set([...partida.membrosConcluidos, membroNum]))
        const proximoPasso = novosMembros.length
        const jogoConcluido = novosMembros.length >= totalDesafios

        const bonus = avaliarBonusAcerto({
          comboAtual: partida.comboAtual,
          acertouDePrimeira,
          jogoConcluido,
          totalErrosPartida: partida.totalErros,
        })

        const novoSegundosBonus = partida.segundosBonus + bonus.bonusTotalAplicado
        const novoSegundosTotais = calcularSegundosTotais({
          segundosReais: segundosValidos,
          segundosPenalidade: partida.segundosPenalidade,
          segundosBonus: novoSegundosBonus,
        })

        const dadosAtualizacao = {
          membrosConcluidos: novosMembros,
          etapaAtual: proximoPasso,
          segundosReais: segundosValidos,
          segundosBonus: novoSegundosBonus,
          segundosTotais: novoSegundosTotais,
          comboAtual: bonus.novoComboAtual,
          totalCombos: partida.totalCombos + bonus.incrementTotalCombos,
          cronometroIniciadoEm: partida.cronometroIniciadoEm || now,
          ultimoSyncEm: now,
        }

        if (jogoConcluido) {
          dadosAtualizacao.status = 'CONCLUIDA'
          dadosAtualizacao.finalizadoEm = now
        }

        const partidaAtualizada = await tx.partida.update({
          where: { id: partida.id },
          data: dadosAtualizacao,
          include: PARTIDA_INCLUDE,
        })

        return {
          httpStatus: 200,
          payload: {
            acertou: true,
            acertouDePrimeira,
            membroId: membroNum,
            mensagemAprovacao: opcao.desafio.mensagemAprovacao,
            etapaAtual: partidaAtualizada.etapaAtual,
            membrosConcluidos: partidaAtualizada.membrosConcluidos,
            jogoConcluido,
            comboAtual: partidaAtualizada.comboAtual,
            comboAtivado: bonus.comboAtivado,
            bonusCombo: bonus.bonusCombo,
            invicto: bonus.invicto,
            bonusInvicto: bonus.bonusInvicto,
            bonusTotalAplicado: bonus.bonusTotalAplicado,
            segundosReais: partidaAtualizada.segundosReais,
            segundosBonus: partidaAtualizada.segundosBonus,
            segundosTotais: partidaAtualizada.segundosTotais,
            partida: partidaAtualizada,
          },
        }
      }

      // CENÁRIO 2: O JOGADOR ERROU (1º/2º erro: +5s | 3º erro: +10s, bloqueio 10s e reset)
      const errosAnterioresNoCiclo = partida.opcoesDesabilitadas.filter(
        (o) => o.membroId === membroNum
      ).length

      const errEval = avaliarResultadoErro({ errosAnterioresNoCiclo })

      await tx.tentativa.create({
        data: {
          partidaId: partida.id,
          desafioId: membroNum,
          opcaoSelecionada: opcaoStr,
          acertou: false,
          penalidadeAplicada: errEval.penalidade,
        },
      })

      let bloqueadoAte = null
      if (errEval.reprovado) {
        bloqueadoAte = new Date(now.getTime() + errEval.bloqueioSegundos * 1000)

        await tx.bloqueioConselheiro.upsert({
          where: {
            partidaId_membroId: {
              partidaId: partida.id,
              membroId: membroNum,
            },
          },
          update: {
            bloqueadoAte,
            vezesBloqueado: { increment: 1 },
          },
          create: {
            partidaId: partida.id,
            membroId: membroNum,
            bloqueadoAte,
            vezesBloqueado: 1,
          },
        })

        // Reseta as 4 opções deste conselheiro para a volta após os 10s
        await tx.opcaoDesabilitada.deleteMany({
          where: {
            partidaId: partida.id,
            membroId: membroNum,
          },
        })
      } else {
        await tx.opcaoDesabilitada.create({
          data: {
            partidaId: partida.id,
            membroId: membroNum,
            opcaoId: opcaoStr,
          },
        })
      }

      const novaPenalidade = partida.segundosPenalidade + errEval.penalidade
      const novosErros = partida.totalErros + 1
      const novoTotal = calcularSegundosTotais({
        segundosReais: segundosValidos,
        segundosPenalidade: novaPenalidade,
        segundosBonus: partida.segundosBonus,
      })

      const partidaAtualizada = await tx.partida.update({
        where: { id: partida.id },
        data: {
          segundosPenalidade: novaPenalidade,
          totalErros: novosErros,
          segundosReais: segundosValidos,
          segundosTotais: novoTotal,
          comboAtual: 0,
          cronometroIniciadoEm: partida.cronometroIniciadoEm || now,
          ultimoSyncEm: now,
        },
        include: PARTIDA_INCLUDE,
      })

      return {
        httpStatus: 200,
        payload: {
          acertou: false,
          penalidade: errEval.penalidade,
          reprovado: errEval.reprovado,
          bloqueioSegundos: errEval.bloqueioSegundos,
          bloqueadoAte,
          opcoesResetadas: errEval.reprovado,
          errosNoCiclo: errEval.reprovado ? 0 : errosAnterioresNoCiclo + 1,
          opcaoId: opcaoStr,
          membroId: membroNum,
          totalErros: partidaAtualizada.totalErros,
          segundosPenalidade: partidaAtualizada.segundosPenalidade,
          segundosReais: partidaAtualizada.segundosReais,
          segundosBonus: partidaAtualizada.segundosBonus,
          segundosTotais: partidaAtualizada.segundosTotais,
          comboAtual: 0,
          partida: partidaAtualizada,
        },
      }
    })

    return res.status(outcome.httpStatus).json(outcome.payload)
  } catch (error) {
    console.error('[partidas/validar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao validar resposta.' })
  }
})

/**
 * POST /api/partidas/:id/sincronizar-tempo
 * Sincroniza periodicamente o tempo decorrido do jogador com validação anti-cheat.
 */
router.post('/:id/sincronizar-tempo', async (req, res) => {
  try {
    const { id } = req.params
    const { segundosReais } = req.body || {}

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    if (typeof segundosReais !== 'number' || !Number.isFinite(segundosReais) || segundosReais < 0) {
      return res.status(400).json({ erro: 'segundosReais deve ser um número válido.' })
    }

    const partida = await prisma.partida.findUnique({ where: { id } })
    if (!partida) {
      return res.status(404).json({ erro: 'Partida não encontrada.' })
    }

    if (partida.jogadorId !== req.jogadorId) {
      return res.status(403).json({ erro: 'Você não tem permissão para atualizar esta partida.' })
    }

    if (partida.status !== 'EM_ANDAMENTO') {
      return res.json({ ok: false })
    }

    const now = new Date()
    const segundosSeguros = calcularTempoSeguro({
      partida,
      clientSeconds: segundosReais,
      now,
    })
    const segundosTotais = calcularSegundosTotais({
      segundosReais: segundosSeguros,
      segundosPenalidade: partida.segundosPenalidade,
      segundosBonus: partida.segundosBonus,
    })

    await prisma.partida.update({
      where: { id },
      data: {
        segundosReais: segundosSeguros,
        segundosTotais,
        cronometroIniciadoEm: partida.cronometroIniciadoEm || now,
        ultimoSyncEm: now,
      },
    })

    return res.json({
      ok: true,
      segundosReais: segundosSeguros,
      segundosTotais,
    })
  } catch (error) {
    console.error('[partidas/sincronizar-tempo] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao sincronizar tempo.' })
  }
})

export default router
