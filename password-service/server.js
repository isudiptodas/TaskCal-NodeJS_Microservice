import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import passwordRoutes from './routes/passwordRoutes.js'

const app = express()
const port = process.env.PORT || 8000

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ service: 'password-service', status: 'ok' }))
app.use('/api/password-recovery', passwordRoutes)

async function startServer() {
  try {
    app.listen(port, () => console.log(`password-service listening on ${port}`))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

startServer()
