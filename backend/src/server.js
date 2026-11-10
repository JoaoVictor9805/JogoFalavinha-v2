import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import apiRouter from './routes/index.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5174'

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
)
app.use(express.json())

app.use('/api', apiRouter)

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`[jogofalavinha-v2-backend] Servidor rodando em http://localhost:${port}`)
})

