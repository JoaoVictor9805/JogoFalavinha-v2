import { Router } from 'express'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { formatarDataBrasilia } from '../utils/dateFormatter.js'

const router = Router()

// Exige sessão autenticada para consultar rankings internos de colaboradores
router.use(requireAuth)

// Quórum mínimo oficial para pontuar no ranking por equipes
const MIN_QUORUM = 3

// Cache curto em memória para reduzir carga no banco em horários de pico
const RANKING_CACHE_TTL_MS = 5000
const RANKING_MIN_RECOMPUTE_INTERVAL_MS = 2000
let rankingCache = {
  expiresAt: 0,
  data: null,
}
let rankingInFlight = null
let rankingCacheVersion = 0
let lastRankingComputeAt = 0

export function invalidateRankingCache() {
  const now = Date.now()
  if (rankingCache.data && now - lastRankingComputeAt < RANKING_MIN_RECOMPUTE_INTERVAL_MS) {
    // Em ondas de conclusão simultânea, limita a recomputação a no máximo 1x a cada 2s
    rankingCache.expiresAt = Math.min(
      rankingCache.expiresAt,
      lastRankingComputeAt + RANKING_MIN_RECOMPUTE_INTERVAL_MS
    )
    return
  }

  rankingCacheVersion += 1
  rankingInFlight = null
  rankingCache = {
    expiresAt: 0,
    data: null,
  }
}

/**
 * Busca diretamente no PostgreSQL via `DISTINCT ON (jogador_id)` apenas
 * o MELHOR TEMPO (Personal Record) de cada colaborador único, já ordenado
 * pelo critério oficial (segundosTotais -> segundosReais -> totalErros -> finalizadoEm).
 * Usa trava `rankingInFlight` para evitar cache stampede quando o cache expira no pico.
 */
async function obterMelhoresPartidasPorJogador() {
  const now = Date.now()
  if (rankingCache.data && rankingCache.expiresAt > now) {
    return rankingCache.data
  }

  if (!rankingInFlight) {
    const versionAtStart = rankingCacheVersion
    rankingInFlight = prisma.$queryRaw`
      SELECT * FROM (
        SELECT DISTINCT ON (p."jogador_id")
          p."jogador_id" AS "jogadorId",
          p."segundos_reais" AS "segundosReais",
          p."segundos_penalidade" AS "segundosPenalidade",
          p."segundos_bonus" AS "segundosBonus",
          p."segundos_totais" AS "segundosTotais",
          p."total_erros" AS "totalErros",
          p."total_combos" AS "totalCombos",
          p."finalizado_em" AS "finalizadoEm",
          j."nome" AS "nome",
          j."unidade" AS "unidade",
          j."setor" AS "setor"
        FROM "partidas" p
        INNER JOIN "jogadores" j ON j."id" = p."jogador_id"
        WHERE p."status" = 'CONCLUIDA'
        ORDER BY
          p."jogador_id",
          p."segundos_totais" ASC,
          p."segundos_reais" ASC,
          p."total_erros" ASC,
          p."finalizado_em" ASC
      ) AS melhores
      ORDER BY
        melhores."segundosTotais" ASC,
        melhores."segundosReais" ASC,
        melhores."totalErros" ASC,
        melhores."finalizadoEm" ASC
    `
      .then((melhoresPartidas) => {
        if (versionAtStart === rankingCacheVersion) {
          const computedAt = Date.now()
          lastRankingComputeAt = computedAt
          rankingCache = {
            expiresAt: computedAt + RANKING_CACHE_TTL_MS,
            data: melhoresPartidas,
          }
        }
        return melhoresPartidas
      })
      .finally(() => {
        if (versionAtStart === rankingCacheVersion) {
          rankingInFlight = null
        }
      })
  }

  return rankingInFlight
}

/**
 * GET /api/ranking
 * Retorna o Ranking Geral individual considerando apenas o MELHOR tempo de cada colaborador.
 * Não expõe e-mail nem UUIDs (`jogadorId` / `partidaId`) de terceiros.
 */
router.get('/', async (req, res) => {
  try {
    const melhoresPartidas = await obterMelhoresPartidasPorJogador()

    const rankingGeral = melhoresPartidas.map((p, index) => ({
      posicao: index + 1,
      isCurrentUser: p.jogadorId === req.jogadorId,
      nome: p.nome,
      unidade: p.unidade,
      setor: p.setor,
      realSeconds: Number(p.segundosReais) || 0,
      penaltySeconds: Number(p.segundosPenalidade) || 0,
      bonusSeconds: Number(p.segundosBonus) || 0,
      totalCombos: Number(p.totalCombos) || 0,
      invicto: Number(p.totalErros) === 0,
      totalSeconds: Number(p.segundosTotais) || 0,
      totalErrors: Number(p.totalErros) || 0,
      completedAt: formatarDataBrasilia(p.finalizadoEm),
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

    const agrupado = {}
    for (const p of melhoresPartidas) {
      const setor = p.setor || 'Geral'
      const totalSeg = Number(p.segundosTotais) || 0
      const erros = Number(p.totalErros) || 0

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
      agrupado[setor].somaSegundosTotais += totalSeg
      agrupado[setor].somaErros += erros
      if (totalSeg < agrupado[setor].melhorTempoSegundos) {
        agrupado[setor].melhorTempoSegundos = totalSeg
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
