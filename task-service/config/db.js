import mongoose from 'mongoose'

export const connectDb = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return
    }

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is required')
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log('task-service connected to MongoDB')
  } catch (error) {
    console.error('Task service database error ->', error.message)
    throw error
  }
}

