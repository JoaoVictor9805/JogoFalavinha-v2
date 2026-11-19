import { Router } from 'express'
import { isValidUuid } from '../data/constantes.js'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { formatarDataBrasilia } from '../utils/dateFormatter.js'
import { selecionarMensagemAprovacao } from '../utils/dialogosConselho.js'
import {
  COOLDOWN_APOS_APROVACAO_MS,
  TEMPO_SUSPEITO_CONCLUSAO_SEGUNDOS,
  avaliarBonusAcerto,
  avaliarResultadoErro,
  calcularSegundosTotais,
  calcularTempoServidor,
} from '../utils/gameRules.js'
import { logSecurityEvent } from '../utils/securityLogger.js'
import { invalidateRankingCache } from './ranking.js'

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
  tentativas: {
    where: { acertou: false },
    select: {
      desafioId: true,
      penalidadeAplicada: true,
    },
  },
  jogador: {
    select: JOGADOR_PUBLIC_SELECT,
  },
}

function anexarTempoServidor(partida, now = new Date()) {
  if (!partida || partida.status !== 'EM_ANDAMENTO' || !partida.cronometroIniciadoEm) {
    return partida
  }
  const segundosReais = calcularTempoServidor({ partida, now })
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
      if (a.segundosReais !== b.segundosReais) {
        return a.segundosReais - b.segundosReais
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
 * Executa dentro de transação com row-lock no jogador para garantir no máximo 1 partida
 * `EM_ANDAMENTO` simultânea (sem race condition) e reaproveita partida vazia no `forceNew`.
 */
router.post('/iniciar', async (req, res) => {
  try {
    const jogadorId = req.jogadorId
    const forceNew = Boolean(req.body?.forceNew)

    const outcome = await prisma.$transaction(async (tx) => {
      // Lock de linha no jogador serializa criação/cancelamento de partidas simultâneas
      const lockedPlayer = await tx.$queryRaw`
        SELECT id FROM "jogadores" WHERE id = ${jogadorId} FOR UPDATE
      `
      if (!Array.isArray(lockedPlayer) || lockedPlayer.length === 0) {
        return { httpStatus: 404, payload: { erro: 'Jogador não encontrado.' } }
      }

      const partidaAtiva = await tx.partida.findFirst({
        where: {
          jogadorId,
          status: 'EM_ANDAMENTO',
        },
        include: {
          ...PARTIDA_INCLUDE,
          _count: {
            select: { tentativas: true },
          },
        },
        orderBy: { iniciadoEm: 'desc' },
      })

      if (forceNew) {
        // Se já existe uma partida totalmente zerada e sem largada, reaproveita sem gerar lixo CANCELADA
        const partidaIntacta =
          partidaAtiva &&
          !partidaAtiva.cronometroIniciadoEm &&
          partidaAtiva.etapaAtual === 0 &&
          partidaAtiva.totalErros === 0 &&
          partidaAtiva._count.tentativas === 0

        if (partidaIntacta) {
          const { _count, ...partidaLimpa } = partidaAtiva
          return {
            httpStatus: 200,
            payload: {
              mensagem: 'Partida pronta.',
              partida: partidaLimpa,
            },
          }
        }

        if (partidaAtiva) {
          await tx.partida.updateMany({
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
      } else if (partidaAtiva) {
        const { _count, ...partidaLimpa } = partidaAtiva
        // Nunca reseta ultimoSyncEm ao retomar: devolve o tempo contínuo real do servidor
        return {
          httpStatus: 200,
          payload: {
            mensagem: 'Partida pronta.',
            partida: anexarTempoServidor(partidaLimpa),
          },
        }
      }

      const novaPartida = await tx.partida.create({
        data: {
          jogadorId,
          status: 'EM_ANDAMENTO',
          etapaAtual: 0,
          membrosConcluidos: [],
          iniciadoEm: new Date(),
        },
        include: PARTIDA_INCLUDE,
      })

      return {
        httpStatus: 200,
        payload: {
          mensagem: 'Partida pronta.',
          partida: novaPartida,
        },
      }
    })

    return res.status(outcome.httpStatus).json(outcome.payload)
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

    return res.json(anexarTempoServidor(partida))
  } catch (error) {
    console.error('[partidas/buscar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar partida.' })
  }
})

/**
 * POST /api/partidas/:id/iniciar-cronometro
 * Marca no servidor o início efetivo do cronômetro quando o jogador confirma o briefing 3D.
 * Estritamente idempotente: chamadas subsequentes NÃO alteram `cronometroIniciadoEm` nem `ultimoSyncEm`.
 */
router.post('/:id/iniciar-cronometro', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw`
        SELECT id FROM "partidas" WHERE id = ${id} FOR UPDATE
      `
      if (!Array.isArray(lockedRows) || lockedRows.length === 0) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      const partida = await tx.partida.findUnique({ where: { id } })
      if (!partida) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      if (partida.jogadorId !== req.jogadorId) {
        return {
          httpStatus: 403,
          payload: { erro: 'Você não tem permissão para iniciar esta partida.' },
        }
      }

      if (partida.status !== 'EM_ANDAMENTO') {
        return { httpStatus: 400, payload: { erro: 'Esta partida não está mais em andamento.' } }
      }

      const now = new Date()

      // Idempotência: se o cronômetro já foi iniciado, não reinicia nem reseta ultimoSyncEm
      if (partida.cronometroIniciadoEm) {
        return {
          httpStatus: 200,
          payload: {
            ok: true,
            cronometroIniciadoEm: partida.cronometroIniciadoEm,
            segundosReais: calcularTempoServidor({ partida, now }),
          },
        }
      }

      const atualizada = await tx.partida.update({
        where: { id },
        data: {
          cronometroIniciadoEm: now,
          ultimoSyncEm: now,
        },
        select: {
          id: true,
          cronometroIniciadoEm: true,
        },
      })

      return {
        httpStatus: 200,
        payload: {
          ok: true,
          cronometroIniciadoEm: atualizada.cronometroIniciadoEm,
          segundosReais: 0,
        },
      }
    })

    return res.status(outcome.httpStatus).json(outcome.payload)
  } catch (error) {
    console.error('[partidas/iniciar-cronometro] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao iniciar cronômetro.' })
  }
})

/**
 * POST /api/partidas/:id/validar
 * Valida a resposta no servidor dentro de transação atômica com row-lock:
 * - Exige que o cronômetro da partida já tenha sido iniciado no servidor
 * - Calcula tempo 100% server-side (ignora segundos enviados pelo cliente)
 * - Impede race condition e dupla penalidade
 * - Acertos seguidos de primeira ativam Combo (-5s) e partida sem erros ganha bônus Invicto (-10s)
 * - 1º/2º erro: +5s | 3º erro: +10s, bloqueio de 10s e reset das opções do conselheiro
 */
router.post('/:id/validar', async (req, res) => {
  try {
    const { id } = req.params
    const { membroId, opcaoId } = req.body || {}

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

      if (!partida.cronometroIniciadoEm) {
        return {
          httpStatus: 400,
          payload: { erro: 'Inicie o cronômetro da partida antes de responder.' },
        }
      }

      if (partida.membrosConcluidos.includes(membroNum)) {
        return { httpStatus: 400, payload: { erro: 'Este conselheiro já foi aprovado.' } }
      }

      const now = new Date()

      // Anti-cheat de cadência: na UI real há trava obrigatória de 2,5s após cada aprovação + modal 3D.
      // Exigir intervalo mínimo de 2s entre uma aprovação e a próxima tentativa impede scripts pulando animações.
      const ultimaAprovacao = await tx.tentativa.findFirst({
        where: {
          partidaId: partida.id,
          acertou: true,
        },
        orderBy: { criadoEm: 'desc' },
        select: { criadoEm: true },
      })

      if (ultimaAprovacao) {
        const msDesdeUltimaAprovacao = now.getTime() - ultimaAprovacao.criadoEm.getTime()
        if (msDesdeUltimaAprovacao < COOLDOWN_APOS_APROVACAO_MS) {
          return {
            httpStatus: 429,
            suspiciousFastAnswer: true,
            msDesdeUltimaAprovacao,
            payload: {
              erro: 'Aguarde a confirmação do conselheiro anterior antes de responder o próximo.',
            },
          }
        }
      }

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

      // Tempo 100% calculado no servidor (ignora segundos enviados pelo navegador)
      const segundosValidos = calcularTempoServidor({ partida, now })

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

        const todosDesafiosIds = Array.from({ length: totalDesafios }, (_, idx) => idx + 1)
        const membrosRestantes = todosDesafiosIds.filter((id) => !novosMembros.includes(id))
        const mensagemAprovacaoDinamica = selecionarMensagemAprovacao({
          membroId: membroNum,
          mensagemPadrao: opcao.desafio.mensagemAprovacao,
          acertouDePrimeira,
          membrosJaAprovados: partida.membrosConcluidos,
          membrosRestantes,
        })

        return {
          httpStatus: 200,
          completed: jogoConcluido,
          segundosReaisFinais: segundosValidos,
          payload: {
            acertou: true,
            acertouDePrimeira,
            membroId: membroNum,
            mensagemAprovacao: mensagemAprovacaoDinamica,
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
          ultimoSyncEm: now,
        },
        include: PARTIDA_INCLUDE,
      })

      return {
        httpStatus: 200,
        completed: false,
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

    if (outcome.suspiciousFastAnswer) {
      logSecurityEvent('SUSPICIOUS_FAST_ANSWER', {
        partidaId: id,
        jogadorId: req.jogadorId,
        membroId: membroNum,
        msDesdeUltimaAprovacao: outcome.msDesdeUltimaAprovacao,
        ip: req.ip,
      })
    }

    if (outcome.completed) {
      invalidateRankingCache()
      if (
        typeof outcome.segundosReaisFinais === 'number' &&
        outcome.segundosReaisFinais < TEMPO_SUSPEITO_CONCLUSAO_SEGUNDOS
      ) {
        logSecurityEvent('SUSPICIOUS_COMPLETION_TIME', {
          partidaId: id,
          jogadorId: req.jogadorId,
          segundosReais: outcome.segundosReaisFinais,
          ip: req.ip,
        })
      }
    }

    return res.status(outcome.httpStatus).json(outcome.payload)
  } catch (error) {
    console.error('[partidas/validar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao validar resposta.' })
  }
})

/**
 * POST /api/partidas/:id/sincronizar-tempo
 * Sincroniza o cronômetro utilizando exclusivamente o tempo calculado pelo servidor.
 * Ignora qualquer valor enviado pelo cliente para fins de cálculo oficial.
 */
router.post('/:id/sincronizar-tempo', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUuid(id)) {
      return res.status(400).json({ erro: 'ID da partida inválido.' })
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw`
        SELECT id FROM "partidas" WHERE id = ${id} FOR UPDATE
      `
      if (!Array.isArray(lockedRows) || lockedRows.length === 0) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      const partida = await tx.partida.findUnique({ where: { id } })
      if (!partida) {
        return { httpStatus: 404, payload: { erro: 'Partida não encontrada.' } }
      }

      if (partida.jogadorId !== req.jogadorId) {
        return {
          httpStatus: 403,
          payload: { erro: 'Você não tem permissão para atualizar esta partida.' },
        }
      }

      if (partida.status !== 'EM_ANDAMENTO' || !partida.cronometroIniciadoEm) {
        return { httpStatus: 200, payload: { ok: false } }
      }

      const now = new Date()
      const segundosSeguros = calcularTempoServidor({ partida, now })
      const segundosTotais = calcularSegundosTotais({
        segundosReais: segundosSeguros,
        segundosPenalidade: partida.segundosPenalidade,
        segundosBonus: partida.segundosBonus,
      })

      await tx.partida.update({
        where: { id },
        data: {
          segundosReais: segundosSeguros,
          segundosTotais,
          ultimoSyncEm: now,
        },
      })

      return {
        httpStatus: 200,
        payload: {
          ok: true,
          segundosReais: segundosSeguros,
          segundosTotais,
        },
      }
    })

    return res.status(outcome.httpStatus).json(outcome.payload)
  } catch (error) {
    console.error('[partidas/sincronizar-tempo] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao sincronizar tempo.' })
  }
})

export default router
