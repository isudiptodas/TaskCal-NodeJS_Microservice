import axios from 'axios'
import bcrypt from 'bcrypt'
import express from 'express'
import { connectDb } from '../config/db.js'
import redis from '../config/redis.js'
import { User } from '../models/User.js'

const router = express.Router()
const ttl = Number(process.env.OTP_TTL_SECONDS || 300)

function key(email) {
  return `password-recovery:${email.toLowerCase()}`
}

router.post('/request-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    await connectDb()
    const user = await User.findOne({ email })

    if (!user) return res.status(404).json({ message: 'User not found' })

    await redis.set(key(email), otp, { EX: ttl })

    if (process.env.NOTIFICATION_SERVICE_URL) {
      try {
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notification/password-otp`, {
          name: user.name,
          email: user.email,
          otp,
          ttlMinutes: Math.ceil(ttl / 60),
        })
      } catch (error) {
        console.error('password OTP email enqueue failed:', error.message)
      }
    }

    res.json({ message: 'OTP sent' })
  } catch (error) {
    res.status(500).json({ message: 'Could not request OTP', error: error.message })
  }
})

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    const savedOtp = await redis.get(key(email || ''))

    if (!savedOtp || savedOtp !== otp) return res.status(400).json({ message: 'Invalid or expired OTP' })

    res.json({ message: 'OTP verified' })
  } catch (error) {
    res.status(500).json({ message: 'Could not verify OTP', error: error.message })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body
    const savedOtp = await redis.get(key(email || ''))

    if (!savedOtp || savedOtp !== otp) return res.status(400).json({ message: 'Invalid or expired OTP' })
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const hashedPassword = await bcrypt.hash(password, 12)
    await connectDb();
    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword })

    if (!user) return res.status(404).json({ message: 'User not found' })

    await redis.del(key(email))
    res.json({ message: 'Password reset successful' })
  } catch (error) {
    res.status(500).json({ message: 'Could not reset password', error: error.message })
  }
})

export default router
