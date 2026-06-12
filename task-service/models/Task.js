import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Very low'],
      default: 'Low',
    },
    date: { type: Date, required: true, index: true },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Task = mongoose.model('Task', taskSchema)
