import { Router } from 'express'
import prisma from '../db.js'

const router = Router()

// Quórum mínimo oficial para pontuar no ranking por equipes
const MIN_QUORUM = 3

/**
 * Função auxiliar que busca as partidas concluídas e filtra apenas
 * o MELHOR TEMPO (Personal Record) de cada jogador único.
 *
 * Se o jogador jogar várias vezes:
 * - Se fizer um tempo menor (melhor), seu recorde é atualizado no ranking.
 * - Se fizer um tempo maior (pior), o recorde anterior é preservado.
 * - Cada pessoa conta apenas UMA VEZ no ranking e na contagem da equipe.
 */
async function obterMelhoresPartidasPorJogador() {
  const partidasConcluidas = await prisma.partida.findMany({
    where: { status: 'CONCLUIDA' },
    orderBy: [
      { segundosTotais: 'asc' },
      { totalErros: 'asc' },
      { finalizadoEm: 'asc' },
    ],
    include: {
      jogador: {
        select: {
          id: true,
          nome: true,
          email: true,
          unidade: true,
          setor: true,
        },
      },
    },
  })

  // Como a consulta já vem ordenada pelo menor tempo, o primeiro registro de cada jogador é o seu melhor
  const melhoresPartidas = new Map()
  for (const p of partidasConcluidas) {
    if (!melhoresPartidas.has(p.jogadorId)) {
      melhoresPartidas.set(p.jogadorId, p)
    }
  }

  return Array.from(melhoresPartidas.values())
}

/**
 * GET /api/ranking
 * Retorna o Ranking Geral individual considerando apenas o MELHOR tempo de cada colaborador.
 */
router.get('/', async (_req, res) => {
  try {
    const melhoresPartidas = await obterMelhoresPartidasPorJogador()

    const rankingGeral = melhoresPartidas.map((p, index) => ({
      posicao: index + 1,
      id: p.id,
      jogadorId: p.jogadorId,
      nome: p.jogador.nome,
      email: p.jogador.email,
      unidade: p.jogador.unidade,
      setor: p.jogador.setor,
      realSeconds: p.segundosReais,
      penaltySeconds: p.segundosPenalidade,
      totalSeconds: p.segundosTotais,
      totalErrors: p.totalErros,
      completedAt: p.finalizadoEm ? new Date(p.finalizadoEm).toLocaleString('pt-BR') : '',
    }))

    return res.json(rankingGeral)
  } catch (error) {
    console.error('[ranking/geral] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar ranking geral.' })
  }
})

/**
 * GET /api/ranking/setores
 * Retorna o Ranking de Equipes por Setor/Departamento:
 * - Considera apenas o melhor tempo de cada colaborador único (1 voto por pessoa).
 * - Exige quórum mínimo de 3 pessoas únicas no setor.
 * - Desempata por maior número de participantes concluintes.
 */
router.get('/setores', async (_req, res) => {
  try {
    const melhoresPartidas = await obterMelhoresPartidasPorJogador()

    // Agrupa as métricas por setor usando apenas os colaboradores únicos
    const agrupado = {}
    for (const p of melhoresPartidas) {
      const setor = p.jogador.setor || 'Geral'
      if (!agrupado[setor]) {
        agrupado[setor] = {
          setor,
          participantesConcluidos: 0,
          somaSegundosTotais: 0,
          somaErros: 0,
          melhorTempoSegundos: Infinity,
        }
      }

      agrupado[setor].participantesConcluidos += 1
      agrupado[setor].somaSegundosTotais += p.segundosTotais
      agrupado[setor].somaErros += p.totalErros
      if (p.segundosTotais < agrupado[setor].melhorTempoSegundos) {
        agrupado[setor].melhorTempoSegundos = p.segundosTotais
      }
    }

    const setoresMapeados = Object.values(agrupado).map((item) => {
      const qualificado = item.participantesConcluidos >= MIN_QUORUM
      const media = Math.round(item.somaSegundosTotais / item.participantesConcluidos)
      return {
        setor: item.setor,
        participantesConcluidos: item.participantesConcluidos,
        qualificado,
        minQuorum: MIN_QUORUM,
        mediaSegundosTotais: media,
        melhorTempoSegundos: item.melhorTempoSegundos === Infinity ? 0 : item.melhorTempoSegundos,
        totalErros: item.somaErros,
      }
    })

    // 1. Setores Qualificados (com Quórum Mínimo de 3 pessoas)
    // Ordenação: 1º Média de Tempo ASC | 2º Maior nº de Participantes DESC (Desempate) | 3º Menor nº de Erros ASC
    const qualificados = setoresMapeados
      .filter((s) => s.qualificado)
      .sort((a, b) => {
        if (a.mediaSegundosTotais !== b.mediaSegundosTotais) {
          return a.mediaSegundosTotais - b.mediaSegundosTotais
        }
        if (a.participantesConcluidos !== b.participantesConcluidos) {
          return b.participantesConcluidos - a.participantesConcluidos
        }
        if (a.totalErros !== b.totalErros) {
          return a.totalErros - b.totalErros
        }
        return a.melhorTempoSegundos - b.melhorTempoSegundos
      })
      .map((item, idx) => ({
        posicao: idx + 1,
        ...item,
      }))

    // 2. Setores em Formação (menos de 3 concluintes)
    const emFormacao = setoresMapeados
      .filter((s) => !s.qualificado)
      .sort((a, b) => {
        if (b.participantesConcluidos !== a.participantesConcluidos) {
          return b.participantesConcluidos - a.participantesConcluidos
        }
        return a.mediaSegundosTotais - b.mediaSegundosTotais
      })
      .map((item) => ({
        posicao: null,
        ...item,
      }))

    return res.json([...qualificados, ...emFormacao])
  } catch (error) {
    console.error('[ranking/setores] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar ranking de setores.' })
  }
})

export default router
