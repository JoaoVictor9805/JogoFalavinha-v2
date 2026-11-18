import 'dotenv/config'
import { createApp } from './app.js'
import { getJwtSecret } from './utils/jwt.js'

// Valida na inicialização que JWT_SECRET existe em produção
getJwtSecret()

const app = createApp()
const port = Number(process.env.PORT) || 3001

app.listen(port, '0.0.0.0', () => {
  console.log(`[jogofalavinha-v2-backend] Servidor rodando em http://localhost:${port}`)
})
