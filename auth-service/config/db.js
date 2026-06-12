
import mongoose from 'mongoose'

export const connectDb = async () => {
  try {

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is required')
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log('auth-service connected to MongoDB')
  } catch (error) {
    console.error('Auth service database error ->', error.message)
    throw error
  }
}

