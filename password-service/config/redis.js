import { createClient } from 'redis'

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

const redis = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: getRedisPort(),
  },
})

redis.on('error', (error) => console.error('redis error:', error.message))

try {
  await redis.connect()
  console.log('password-service connected to Redis')
} catch (error) {
  console.error('Password service Redis error ->', error.message)
  throw error
}

export default redis
