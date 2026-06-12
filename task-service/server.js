import 'dotenv/config'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import startReminderJob from './config/reminderJob.js'
import requireAuth from './routes/authMiddleware.js'
import taskRoutes from './routes/taskRoutes.js'

const app = express()
const port = process.env.PORT || 7000

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => res.json({ service: 'task-service', status: 'ok' }))
app.use('/api/task', requireAuth, taskRoutes)

async function startServer() {
  try {
    if (process.env.NOTIFICATION_SERVICE_URL) startReminderJob()
    app.listen(port, () => console.log(`task-service listening on ${port}`))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

startServer()
