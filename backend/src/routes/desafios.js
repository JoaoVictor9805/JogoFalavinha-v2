import { Router } from 'express'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const DESAFIOS_CACHE_TTL_MS = 120000
let desafiosCache = {
  expiresAt: 0,
  data: null,
}
let desafiosInFlight = null
let gabaritoServerCache = {
  expiresAt: 0,
  map: null,
}
let gabaritoInFlight = null

export async function getOpcaoDesafioServerSide(desafioId, opcaoId) {
  const now = Date.now()
  if (!gabaritoServerCache.map || gabaritoServerCache.expiresAt <= now) {
    if (!gabaritoInFlight) {
      gabaritoInFlight = prisma.opcaoDesafio
        .findMany({ include: { desafio: true } })
        .then((opcoes) => {
          const map = new Map()
          for (const opt of opcoes) {
            map.set(`${opt.desafioId}:${opt.opcaoId}`, opt)
          }
          if (map.size > 0) {
            gabaritoServerCache = {
              expiresAt: Date.now() + DESAFIOS_CACHE_TTL_MS,
              map,
            }
          }
          return map
        })
        .finally(() => {
          gabaritoInFlight = null
        })
    }
    const map = await gabaritoInFlight
    return map.get(`${desafioId}:${opcaoId}`) || null
  }
  return gabaritoServerCache.map.get(`${desafioId}:${opcaoId}`) || null
}

async function obterDesafiosFormatados() {
  const now = Date.now()
  if (desafiosCache.data && desafiosCache.expiresAt > now) {
    return desafiosCache.data
  }

  if (!desafiosInFlight) {
    desafiosInFlight = prisma.desafio
      .findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          codigo: true,
          nome: true,
          cargo: true,
          rotuloCurto: true,
          posicaoMesa: true,
          gradienteAvatar: true,
          corBorda: true,
          corBrilho: true,
          corBadge: true,
          tipo: true,
          saudacao: true,
          pergunta: true,
          // 'mensagemAprovacao' NÃO é selecionado propositalmente (evita vazar gabarito antes do acerto)
          opcoes: {
            orderBy: { opcaoId: 'asc' },
            select: {
              opcaoId: true,
              rotulo: true,
              texto: true,
              // 'correta' NÃO é selecionado propositalmente
            },
          },
        },
      })
      .then((desafios) => {
        // Formata no padrão consumido pelo frontend do Tribunal
        const payloadFormatado = desafios.map((d) => ({
          id: d.id,
          code: d.codigo,
          name: d.nome,
          role: d.cargo,
          shortLabel: d.rotuloCurto,
          seatPosition: d.posicaoMesa,
          avatarGradient: d.gradienteAvatar,
          borderAccent: d.corBorda,
          glowAccent: d.corBrilho,
          badgeBg: d.corBadge,
          type: d.tipo,
          greeting: d.saudacao,
          question: d.pergunta,
          options: d.opcoes.map((opt) => ({
            id: opt.opcaoId,
            label: opt.rotulo,
            text: opt.texto,
          })),
        }))

        if (payloadFormatado.length > 0) {
          desafiosCache = {
            expiresAt: Date.now() + DESAFIOS_CACHE_TTL_MS,
            data: payloadFormatado,
          }
        }
        return payloadFormatado
      })
      .finally(() => {
        desafiosInFlight = null
      })
  }

  return desafiosInFlight
}

export async function getTotalDesafiosCount() {
  const lista = await obterDesafiosFormatados()
  return lista.length > 0 ? lista.length : 7
}

// Exige sessão autenticada para acessar as perguntas internas da empresa
router.use(requireAuth)

/**
 * GET /api/desafios
 * Retorna os 7 desafios do Conselho Next para montagem das telas do jogo.
 *
 * REGRAS DE SEGURANÇA FUNDAMENTAIS (Anti-Cheat):
 * - O campo `correta` (gabarito) é estritamente omitido da resposta.
 * - O campo `mensagemAprovacao` também é omitido (só é entregue em POST /partidas/:id/validar após acerto).
 */
router.get('/', async (_req, res) => {
  try {
    const payloadFormatado = await obterDesafiosFormatados()
    return res.json(payloadFormatado)
  } catch (error) {
    console.error('[desafios/listar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar desafios.' })
  }
})

export default router
