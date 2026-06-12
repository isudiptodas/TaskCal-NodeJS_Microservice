import axios from 'axios'
import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import { connectDb } from '../config/db.js'
import { User } from '../models/User.js'

const router = express.Router()

const cookieName = 'taskcal_token'

function signToken(user) {
  return jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https'
}

function authCookieOptions(req) {
  const secure = isSecureRequest(req)

  return {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
  }
}

function setAuthCookie(req, res, token) {
  res.cookie(cookieName, token, {
    ...authCookieOptions(req),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

async function requireAuth(req, res, next) {
  try {

    await connectDb();
    const token = req.cookies[cookieName]

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    
    const user = await User.findById(payload.userId).select('-password')

    if (!user) return res.status(401).json({ message: 'Not authenticated' })

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Not authenticated' })
  }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    await connectDb()
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashedPassword })

    if (process.env.NOTIFICATION_SERVICE_URL) {
      try {
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notification/welcome`, {
          name: user.name,
          email: user.email,
        })
      } catch (error) {
        console.error('welcome email enqueue failed:', error.message)
      }
    }

    res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    await connectDb()
    const user = await User.findOne({ email })

    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const passwordMatches = await bcrypt.compare(password, user.password)

    if (!passwordMatches) return res.status(401).json({ message: 'Invalid credentials' })

    setAuthCookie(req, res, signToken(user))
    res.json({ user: publicUser(user) })
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.post('/logout', (req, res) => {
  res.clearCookie(cookieName, authCookieOptions(req))
  res.json({ message: 'Logged out' })
})

export default router
