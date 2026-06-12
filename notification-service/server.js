import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import sendMail from './config/mailer.js'
import { startEmailWorker } from './config/queue.js'
import notificationRoutes from './routes/notificationRoutes.js'

const app = express()
const port = process.env.PORT || 6000

app.use(
  cors({
    origin:  process.env.CLIENT_URL ? process.env.CLIENT_URL : "*",
    credentials: true,
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ service: 'notification-service', status: 'ok' }))
app.use('/api/notification', notificationRoutes)

function startServer() {
  try {
    startEmailWorker(sendMail)
    app.listen(port, () => console.log(`notification-service listening on ${port}`))
  } catch (error) {
    console.error('Notification service startup error ->', error.message)
    process.exit(1)
  }
}

startServer()
