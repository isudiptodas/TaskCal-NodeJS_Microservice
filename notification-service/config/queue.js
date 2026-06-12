import { Queue, Worker } from 'bullmq'

function getRedisPort() {
  const port = Number(process.env.REDIS_PORT)

  if (!Number.isInteger(port) || port < 0 || port >= 65536) {
    throw new Error('REDIS_PORT must be a number between 0 and 65535')
  }

  return port
}

if (!process.env.REDIS_HOST) {
  throw new Error('REDIS_HOST is required')
}

if (!process.env.REDIS_PASSWORD) {
  throw new Error('REDIS_PASSWORD is required')
}

const connection = {
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: getRedisPort(),
  maxRetriesPerRequest: null,
}

let emailQueue

try {
  emailQueue = new Queue('email', {
    connection,
    skipVersionCheck: true,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  })

  emailQueue.on('error', (error) => console.error('email queue error:', error.message))
} catch (error) {
  console.error('Notification service queue error ->', error.message)
  throw error
}

function startEmailWorker(sendMail) {
  try {
    const worker = new Worker(
      'email',
      async (job) => {
        try {
          await sendMail(job.data)
        } catch (error) {
          console.error(`email job failed (${job.name}):`, error.message)
          throw error
        }
      },
      { connection, skipVersionCheck: true },
    )

    worker.on('error', (error) => console.error('email worker error:', error.message))
    worker.on('failed', (job, error) => console.error(`email job failed (${job?.name || 'unknown'}):`, error.message))

    return worker
  } catch (error) {
    console.error('Notification service worker error ->', error.message)
    throw error
  }
}

export { emailQueue, startEmailWorker }
