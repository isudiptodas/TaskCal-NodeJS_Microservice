import express from 'express'
import { connectDb } from '../config/db.js'
import { Task } from '../models/Task.js'

const router = express.Router()

function normalizeTask(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    date: task.date,
  }
}

router.get('/', async (req, res) => {
  try {
    await connectDb();
    const tasks = await Task.find({ userId: req.user.userId }).sort({ date: 1, createdAt: 1 })
    res.json({ tasks: tasks.map(normalizeTask) })
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch tasks', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, description, priority, date } = req.body

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' })
    }

    await connectDb();
    const task = await Task.create({
      userId: req.user.userId,
      userEmail: req.user.email,
      title,
      description,
      priority,
      date,
    })

    res.status(201).json({ task: normalizeTask(task) })
  } catch (error) {
    res.status(500).json({ message: 'Could not create task', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, date } = req.body
    await connectDb()
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { title, description, priority, date, reminderSent: false },
      { new: true, runValidators: true },
    )

    if (!task) return res.status(404).json({ message: 'Task not found' })

    res.json({ task: normalizeTask(task) })
  } catch (error) {
    res.status(500).json({ message: 'Could not update task', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await connectDb();
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId })

    if (!task) return res.status(404).json({ message: 'Task not found' })

    res.json({ message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Could not delete task', error: error.message })
  }
})

export default router
