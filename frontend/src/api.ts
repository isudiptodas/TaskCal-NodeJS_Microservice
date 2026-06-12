import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export type User = {
  id: string
  name: string
  email: string
}

export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Very low'

export type Task = {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  date: string
}

type RawTask = {
  _id?: string
  id?: string
  title?: string
  name?: string
  taskName?: string
  description?: string
  priority?: string
  date?: string
  taskDate?: string
  dueDate?: string
}

export const unwrap = (value: unknown, key: string): unknown => {
  const source = value as Record<string, unknown>

  return source[key] ?? source.data ?? value
}

export const toUser = (value: unknown): User => {
  const source = unwrap(value, 'user') as Record<string, unknown>

  return {
    id: String(source._id ?? source.id ?? ''),
    name: String(source.name ?? source.username ?? 'User'),
    email: String(source.email ?? ''),
  }
}

export const toTask = (value: unknown): Task => {
  const task = value as RawTask

  return {
    id: String(task._id ?? task.id ?? crypto.randomUUID()),
    title: String(task.title ?? task.name ?? task.taskName ?? 'Untitled task'),
    description: task.description,
    priority: toPriority(task.priority),
    date: String(task.date ?? task.taskDate ?? task.dueDate ?? new Date().toISOString()),
  }
}

function toPriority(priority?: string): TaskPriority {
  const normalized = priority?.toLowerCase()

  if (normalized === 'medium') return 'Medium'
  if (normalized === 'low') return 'Low'
  if (normalized === 'very low' || normalized === 'very-low' || normalized === 'verylow') return 'Very low'

  return 'High'
}

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim()) return data

    if (data && typeof data === 'object') {
      const source = data as Record<string, unknown>

      if (typeof source.message === 'string' && source.message.trim()) return source.message
      if (typeof source.error === 'string' && source.error.trim()) return source.error
    }
  }

  return 'Something went wrong'
}
