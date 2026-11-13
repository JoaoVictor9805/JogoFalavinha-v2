import { Router } from 'express'
import prisma from '../db.js'

const router = Router()

/**
 * GET /api/desafios
 * Retorna os 7 desafios do Conselho Next para montagem das telas do jogo.
 *
 * REGRA DE SEGURANÇA FUNDAMENTAL (Anti-Cheat):
 * O campo `correta` (gabarito) é estritamente omitido da resposta.
 */
router.get('/', async (_req, res) => {
  try {
    const desafios = await prisma.desafio.findMany({
      orderBy: { id: 'asc' },
      include: {
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
      approvalMessage: d.mensagemAprovacao,
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

