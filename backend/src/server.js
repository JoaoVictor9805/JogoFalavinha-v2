import 'dotenv/config'
import { createApp } from './app.js'
import prisma from './db.js'
import { getJwtSecret } from './utils/jwt.js'

// Valida na inicialização que JWT_SECRET existe e é forte em produção
getJwtSecret()

const app = createApp()
const port = Number(process.env.PORT) || 3001

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[jogofalavinha-v2-backend] Servidor rodando em http://localhost:${port}`)
})

let isShuttingDown = false

async function gracefulShutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`[jogofalavinha-v2-backend] Sinal ${signal} recebido. Encerrando graciosamente...`)

  // Timeout de segurança caso alguma conexão keep-alive fique presa
  const forceExitTimer = setTimeout(() => {
    console.error('[jogofalavinha-v2-backend] Timeout no shutdown gracioso. Encerrando processo.')
    process.exit(1)
  }, 10000)
  forceExitTimer.unref()

  server.close(async (closeErr) => {
    if (closeErr) {
      console.error('[jogofalavinha-v2-backend] Erro ao fechar servidor HTTP:', closeErr)
    }
    try {
      await prisma.$disconnect()
      console.log('[jogofalavinha-v2-backend] Conexão com banco encerrada com sucesso.')
    } catch (dbErr) {
      console.error('[jogofalavinha-v2-backend] Erro ao desconectar Prisma:', dbErr)
    }
    clearTimeout(forceExitTimer)
    process.exit(closeErr ? 1 : 0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
