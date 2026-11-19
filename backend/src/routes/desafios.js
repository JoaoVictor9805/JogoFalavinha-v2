import { Router } from 'express'
import prisma from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

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
    const desafios = await prisma.desafio.findMany({
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

    return res.json(payloadFormatado)
  } catch (error) {
    console.error('[desafios/listar] Erro:', error)
    return res.status(500).json({ erro: 'Erro interno ao buscar desafios.' })
  }
})

export default router
