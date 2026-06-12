import axios from 'axios'

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

const apiBaseUrl = import.meta.env.VITE_API_URL ?? ''

function serviceUrl(envUrl: string | undefined, localUrl: string) {
  return envUrl ?? (import.meta.env.PROD ? apiBaseUrl : localUrl)
}

const authClient = axios.create({
  baseURL: serviceUrl(import.meta.env.VITE_AUTH_URL, 'http://localhost:5000'),
  withCredentials: true,
})

const taskClient = axios.create({
  baseURL: serviceUrl(import.meta.env.VITE_TASK_URL, 'http://localhost:7000'),
  withCredentials: true,
})

const passwordClient = axios.create({
  baseURL: serviceUrl(import.meta.env.VITE_PASSWORD_URL, 'http://localhost:8000'),
  withCredentials: true,
})

const toUser = (value: unknown): User => {
  const source = unwrap(value, 'user') as Record<string, unknown>

  return {
    id: String(source._id ?? source.id ?? ''),
    name: String(source.name ?? source.username ?? 'User'),
    email: String(source.email ?? ''),
  }
}

const toTask = (task: RawTask): Task => ({
  id: String(task._id ?? task.id ?? crypto.randomUUID()),
  title: String(task.title ?? task.name ?? task.taskName ?? 'Untitled task'),
  description: task.description,
  priority: toPriority(task.priority),
  date: String(task.date ?? task.taskDate ?? task.dueDate ?? new Date().toISOString()),
})

const toPriority = (priority?: string): TaskPriority => {
  const normalized = priority?.toLowerCase()

  if (normalized === 'medium') return 'Medium'
  if (normalized === 'low') return 'Low'
  if (normalized === 'very low' || normalized === 'very-low' || normalized === 'verylow') return 'Very low'

  return 'High'
}

const unwrap = (value: unknown, key: string): unknown => {
  const source = value as Record<string, unknown>

  return source[key] ?? source.data ?? value
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

    if (error.message.trim()) return error.message
  }

  return 'Something went wrong'
}

export async function getCurrentUser() {
  const { data } = await authClient.get('/api/auth/me')

  return toUser(data)
}

export async function loginUser(payload: { email: string; password: string }) {
  const { data } = await authClient.post('/api/auth/login', payload)

  return data
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const { data } = await authClient.post('/api/auth/register', payload)

  return data
}

export async function logoutUser() {
  await authClient.post('/api/auth/logout')
}

export async function getTasks() {
  const { data } = await taskClient.get('/api/task')
  const tasks = unwrap(data, 'tasks')

  return Array.isArray(tasks) ? tasks.map((task) => toTask(task as RawTask)) : []
}

export async function createTask(payload: Omit<Task, 'id'>) {
  const { data } = await taskClient.post('/api/task', payload)

  return toTask(unwrap(data, 'task') as RawTask)
}

export async function updateTask(id: string, payload: Omit<Task, 'id'>) {
  const { data } = await taskClient.put(`/api/task/${id}`, payload)

  return toTask(unwrap(data, 'task') as RawTask)
}

export async function deleteTask(id: string) {
  await taskClient.delete(`/api/task/${id}`)
}

export async function requestPasswordOtp(payload: { email: string; otp: string }) {
  const { data } = await passwordClient.post('/api/password-recovery/request-otp', payload)

  return data
}

export async function verifyPasswordOtp(payload: { email: string; otp: string }) {
  const { data } = await passwordClient.post('/api/password-recovery/verify-otp', payload)

  return data
}

export async function resetPassword(payload: { email: string; otp: string; password: string }) {
  const { data } = await passwordClient.post('/api/password-recovery/reset-password', payload)

  return data
}
