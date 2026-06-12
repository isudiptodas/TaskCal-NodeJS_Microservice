import 'dotenv/config'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'

const app = express()
const port = process.env.PORT || 5000

app.use(
  cors({
    origin:  process.env.CLIENT_URL ? process.env.CLIENT_URL : "*",
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ service: 'auth-service', status: 'ok' }))
app.use('/api/auth', authRoutes)

async function startServer() {
  try {
    app.listen(port, () => console.log(`auth-service listening on ${port}`))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

startServer()
