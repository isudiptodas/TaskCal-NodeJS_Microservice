import axios from 'axios'
import cron from 'node-cron'
import { connectDb } from './db.js'
import { Task } from '../models/Task.js'

function startReminderJob() {
  const schedule = process.env.REMINDER_CRON || '0 6 * * *'

  cron.schedule(schedule, async () => {
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      await connectDb()
      const tasks = await Task.find({
        date: { $gte: start, $lt: end },
        reminderSent: false,
      })

      for (const task of tasks) {
        try {
          await axios.post(`${process.env.NOTIFICATION_SERVICE}/api/notification/task-reminder`, {
            userId: task.userId,
            email: task.userEmail,
            title: task.title,
            description: task.description,
            priority: task.priority,
            date: task.date,
          })
          task.reminderSent = true
          await task.save()
        } catch (error) {
          console.error(`task reminder failed for ${task._id}:`, error.message)
        }
      }
    } catch (error) {
      console.error('task reminder scan failed:', error.message)
    }
  })
}

export default startReminderJob
