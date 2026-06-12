import express from 'express'
import { emailQueue } from '../config/queue.js'

const router = express.Router()

router.post('/welcome', async (req, res) => {
  try {
    const { name, email } = req.body

    if (!email) return res.status(400).json({ message: 'Email is required' })

    await emailQueue.add('welcome', {
      to: email,
      subject: 'Welcome to TaskCal',
      text: `Hi ${name || 'there'}, welcome to TaskCal. Your task calendar is ready.`,
    })

    res.status(202).json({ message: 'Welcome email queued' })
  } catch (error) {
    res.status(500).json({ message: 'Could not queue welcome email', error: error.message })
  }
})

router.post('/password-otp', async (req, res) => {
  try {
    const { name, email, otp, ttlMinutes } = req.body

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    await emailQueue.add('password-otp', {
      to: email,
      subject: 'Your TaskCal password recovery OTP',
      text: `Hi ${name || 'there'}, your OTP is ${otp}. It expires in ${ttlMinutes || 5} minutes.`,
    })

    res.status(202).json({ message: 'OTP email queued' })
  } catch (error) {
    res.status(500).json({ message: 'Could not queue OTP email', error: error.message })
  }
})

router.post('/task-reminder', async (req, res) => {
  try {
    const { email, title, description, date } = req.body

    if (!email) {
      return res.status(202).json({ message: 'Reminder received without email; no email queued' })
    }

    await emailQueue.add('task-reminder', {
      to: email,
      subject: `Task reminder: ${title}`,
      text: `Your task is scheduled for ${new Date(date).toDateString()}.\n\n${title}\n${description || ''}`,
    })

    res.status(202).json({ message: 'Task reminder queued' })
  } catch (error) {
    res.status(500).json({ message: 'Could not queue task reminder', error: error.message })
  }
})

export default router
