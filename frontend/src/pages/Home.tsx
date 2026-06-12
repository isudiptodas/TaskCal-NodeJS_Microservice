import axios from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FaCheck, FaRegCircleUser } from 'react-icons/fa6'
import { MdKeyboardDoubleArrowRight } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import {
  API_BASE_URL,
  getErrorMessage,
  type Task,
  type TaskPriority,
  type User,
  toTask,
  toUser,
  unwrap,
} from '../api'
import ErrorToast from '../components/ErrorToast'
import { pastDateMessage, requiredMessage } from '../validation'

type CalendarDay = {
  key: string
  day: number
  monthState: 'previous' | 'current' | 'next'
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']
const priorities: TaskPriority[] = ['High', 'Medium', 'Low', 'Very low']
const authApiUrl = API_BASE_URL ? API_BASE_URL : 'http://localhost:5000'
const taskApiUrl = API_BASE_URL ? API_BASE_URL : 'http://localhost:7000'

const emptyForm: Omit<Task, 'id'> = {
  title: '',
  description: '',
  priority: 'Low',
  date: toDateInputValue(new Date()),
}

async function getCurrentUser() {
  const { data } = await axios.get(`${authApiUrl}/api/auth/me`, { withCredentials: true })

  return toUser(data)
}

async function logoutUser() {
  await axios.post(`${authApiUrl}/api/auth/logout`, null, { withCredentials: true })
}

async function getTasks() {
  const { data } = await axios.get(`${taskApiUrl}/api/task`, { withCredentials: true })
  const tasks = unwrap(data, 'tasks')

  return Array.isArray(tasks) ? tasks.map((task) => toTask(task)) : []
}

async function createTask(payload: Omit<Task, 'id'>) {
  const { data } = await axios.post(`${taskApiUrl}/api/task`, payload, { withCredentials: true })

  return toTask(unwrap(data, 'task'))
}

async function updateTask(id: string, payload: Omit<Task, 'id'>) {
  const { data } = await axios.put(`${taskApiUrl}/api/task/${id}`, payload, { withCredentials: true })

  return toTask(unwrap(data, 'task'))
}

async function deleteTask(id: string) {
  await axios.delete(`${taskApiUrl}/api/task/${id}`, { withCredentials: true })
}

function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(2026, 5, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState<Omit<Task, 'id'>>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function bootstrapHome() {
      setLoading(true)
      setError('')

      try {
        const [currentUser, taskList] = await Promise.all([getCurrentUser(), getTasks()])

        if (!active) return

        setUser(currentUser)
        setTasks(taskList)
      } catch (caught) {
        if (!active) return

        if (isUnauthorized(caught)) {
          navigate('/auth/login', { replace: true })
          return
        }

        setError(getErrorMessage(caught))
      } finally {
        if (active) setLoading(false)
      }
    }

    bootstrapHome()

    return () => {
      active = false
    }
  }, [navigate])

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])
  const todayKey = useMemo(() => toDateKey(new Date()), [])
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks])
  const filteredTasksByDate = useMemo(() => groupTasksByDate(filterTasks(tasks, search)), [tasks, search])
  const selectedTasks = selectedDate ? filteredTasksByDate.get(selectedDate) ?? [] : []
  const selectedDateObject = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null
  const monthLabel = `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`
  const backgroundState =
    showMonthPicker || showCreateTask ? 'scale-[0.99] blur-[3px]' : selectedDate ? 'max-lg:scale-[0.99] max-lg:blur-[3px]' : ''

  if (loading) {
    return <HomeSkeleton />
  }

  const openCreateTask = (date?: string) => {
    setEditingTask(null)
    setForm({ ...emptyForm, date: date ?? toDateInputValue(new Date()) })
    setShowCreateTask(true)
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      date: toDateInputValue(task.date),
    })
    setShowCreateTask(true)
  }

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError =
      requiredMessage(form.title, 'Task name') || requiredMessage(form.description ?? '', 'Task description') || pastDateMessage(form.date)

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim(),
      }
      const savedTask = editingTask ? await updateTask(editingTask.id, payload) : await createTask(payload)

      setTasks((currentTasks) =>
        editingTask
          ? currentTasks.map((task) => (task.id === savedTask.id ? savedTask : task))
          : [...currentTasks, savedTask],
      )
      setSelectedDate(toDateKey(savedTask.date))
      setShowCreateTask(false)
      setEditingTask(null)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setError('')

    try {
      await deleteTask(taskId)
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  const handleLogout = async () => {
    setError('')

    try {
      await logoutUser()
      navigate('/', { replace: true })
    } catch (caught) {
      setError(getErrorMessage(caught))
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-6 text-black sm:px-8 lg:px-12 lg:py-8">
      <ErrorToast message={error} onClose={() => setError('')} />
      <div className={`transition duration-300 ease-out ${backgroundState}`}>
        <header className="grid grid-cols-[auto_minmax(12rem,1fr)_auto_auto] items-center gap-4 max-[760px]:grid-cols-[auto_1fr_auto] max-[760px]:gap-3">
          <button
            className="flex cursor-pointer items-center gap-2 text-xl font-normal tracking-normal transition duration-200 hover:opacity-75 sm:text-2xl lg:text-3xl"
            onClick={() => setShowMonthPicker(true)}
          >
            {monthLabel}
            <span className="mt-1 h-0 w-0 border-x-[9px] border-t-[9px] border-x-transparent border-t-black sm:border-x-10 sm:border-t-10" />
          </button>

          <input
            className="h-11 min-w-0 rounded-full bg-neutral-300 px-5 text-base outline-none transition duration-200 placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-400 max-[760px]:order-4 max-[760px]:col-span-3 max-[760px]:w-full sm:h-12 sm:text-lg lg:h-12"
            placeholder="Search Tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            className="h-11 cursor-pointer whitespace-nowrap rounded-full bg-blue-500 px-6 text-base text-white shadow-sm transition duration-200 hover:bg-blue-600 active:scale-95 sm:h-12 sm:px-7 sm:text-lg"
            onClick={() => openCreateTask()}
          >
            Create Task +
          </button>

          <div className="relative justify-self-end">
            <button
              className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-linear-to-br from-sky-500 to-emerald-500 transition duration-200 hover:brightness-105 active:scale-95 sm:h-12 sm:w-12"
              aria-label="Open profile menu"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <FaRegCircleUser className="h-7 w-7 text-white sm:h-8 sm:w-8" aria-hidden="true" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-14 z-20 w-44 animate-[fadeIn_180ms_ease-out] border border-neutral-200 bg-white p-3 shadow-2xl">
                <p className="mb-3 truncate text-sm text-neutral-600">{user?.name}</p>
                <button className="w-full cursor-pointer bg-red-500 px-4 py-2 text-white transition hover:bg-red-600" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <section
          className={`mt-14 grid items-start transition-[grid-template-columns,gap] duration-500 ease-out max-[760px]:mt-12 ${
            selectedDate ? 'lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-10' : 'lg:grid-cols-[minmax(0,1fr)_0rem] lg:gap-0'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-7 text-center text-2xl sm:text-3xl lg:text-4xl">
              {weekDays.map((day) => (
                <span className="pb-8 text-black text-sm lg:text-lg font-normal" key={day}>
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((calendarDay) => {
                const savedTaskCount = (tasksByDate.get(calendarDay.key) ?? []).length
                const hasTasks = savedTaskCount > 0
                const isToday = calendarDay.key === todayKey && calendarDay.monthState === 'current'

                return (
                  <button
                    className={`relative grid h-24 cursor-pointer place-items-center overflow-hidden border-2 text-2xl transition duration-300 hover:brightness-95 active:scale-[0.99] max-[760px]:h-29 max-[760px]:text-base sm:h-28 sm:text-3xl lg:h-[clamp(5.8rem,8.1vw,9.1rem)] lg:text-4xl ${monthCellClass(calendarDay.monthState, selectedDate === calendarDay.key, isToday)}`}
                    key={calendarDay.key}
                    onClick={() => setSelectedDate(calendarDay.key)}
                  >
                    <span>{calendarDay.day}</span>
                    {hasTasks && (
                      <i
                        className="absolute left-1/2 top-[68%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black max-[760px]:h-1.5 max-[760px]:w-1.5"
                        aria-label={`${savedTaskCount} tasks`}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-14 flex flex-wrap justify-center gap-10 text-lg max-[760px]:mt-7 max-[760px]:gap-5 max-[760px]:text-xs">
              {getLegendItems(calendarDays).map((item) => (
                <span className="flex items-center gap-3" key={item.state}>
                  <i className={`h-8 w-8 rounded-full max-[760px]:h-2 max-[760px]:w-2 ${legendClass(item.state)}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`hidden min-w-0 transition duration-500 ease-out lg:block ${
              selectedDate ? 'translate-x-0 overflow-visible opacity-100' : 'pointer-events-none translate-x-8 overflow-hidden opacity-0'
            }`}
          >
            {selectedDate && selectedDateObject && (
              <TaskPanel
                date={selectedDateObject}
                tasks={selectedTasks}
                onClose={() => setSelectedDate(null)}
                onCreate={() => openCreateTask(selectedDate)}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
              />
            )}
          </div>
        </section>
      </div>

      {selectedDate && selectedDateObject && (
        <div className="fixed inset-x-0 bottom-0 z-30 animate-[slideUp_260ms_ease-out] overflow-visible pt-8 lg:hidden">
          <button
            className="absolute left-1/2 top-0 z-10 grid h-16 w-16 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-black text-3xl text-white transition active:scale-95"
            onClick={() => setSelectedDate(null)}
          >
            x
          </button>
          <div className="max-h-[76vh] overflow-y-auto bg-neutral-200 px-7 pb-10 pt-12 shadow-2xl scrollbar-none [&::-webkit-scrollbar]:hidden">
            <TaskPanel
              date={selectedDateObject}
              tasks={selectedTasks}
              onClose={() => setSelectedDate(null)}
              onCreate={() => openCreateTask(selectedDate)}
              onEdit={openEditTask}
              onDelete={handleDeleteTask}
            />
          </div>
        </div>
      )}

      {showMonthPicker && (
        <div className="fixed inset-0 z-40 grid animate-[fadeIn_180ms_ease-out] place-items-center bg-white/30 backdrop-blur-md">
          <button className="absolute inset-0 cursor-pointer" aria-label="Close month picker" onClick={() => setShowMonthPicker(false)} />
          <MonthPicker
            currentMonth={visibleMonth}
            onChange={(nextMonth) => {
              setVisibleMonth(nextMonth)
              setShowMonthPicker(false)
              setSelectedDate(null)
            }}
          />
        </div>
      )}

      {showCreateTask && (
        <div className="fixed inset-0 z-50 grid animate-[fadeIn_180ms_ease-out] place-items-center bg-white/30 px-5 backdrop-blur-md">
          <TaskForm
            form={form}
            title={editingTask ? 'Update Task' : 'Create Task'}
            saving={saving}
            onChange={setForm}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setShowCreateTask(false)
              setEditingTask(null)
            }}
          />
        </div>
      )}
    </main>
  )
}

function TaskPanel({
  date,
  tasks,
  onClose,
  onCreate,
  onEdit,
  onDelete,
}: {
  date: Date
  tasks: Task[]
  onClose: () => void
  onCreate: () => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  return (
    <aside className="relative max-h-[80vh] bg-neutral-200 px-2 pb-8 pt-7 lg:px-10">
      <button
        className="absolute -left-5 top-1/2 hidden h-10 w-10 -translate-y-1/2 cursor-pointer rounded-full bg-black text-2xl leading-none text-white transition duration-200 hover:scale-105 active:scale-95 lg:grid lg:place-items-center"
        aria-label="Close tasks"
        onClick={onClose}
      >
        <MdKeyboardDoubleArrowRight />
      </button>
      <h2 className="mb-8 text-center text-2xl font-normal max-[760px]:text-xl">{formatLongDate(date)}</h2>
      {tasks.length === 0 ? (
        <div className="grid min-h-56 place-items-center bg-white px-6 text-center">
          <div>
            <strong className="block text-2xl font-normal">No tasks</strong>
            <button className="mt-5 cursor-pointer bg-blue-500 px-6 py-3 text-white transition hover:bg-blue-600 active:scale-95" onClick={onCreate}>
              Create Task +
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-15rem)] space-y-8 overflow-y-auto pr-1 scrollbar-none max-[760px]:max-h-[52vh] max-[760px]:pr-0 [&::-webkit-scrollbar]:hidden">
          {tasks.map((task) => (
            <article className="bg-white py-4 h-auto w-full px-4" key={task.id}>
              <span className={`inline-flex min-w-20 justify-center rounded-full border px-4 py-1 text-sm ${priorityPillClass(task.priority)}`}>
                {task.priority}
              </span>
              <h3 className="mt-4 text-xl font-normal">{task.title}</h3>
              {task.description && <p className="mt-2 text-base leading-snug opacity-70">{task.description}</p>}
              <div className="mt-4 flex gap-3 text-sm">
                <button className="cursor-pointer bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600" onClick={() => onEdit(task)}>
                  Edit
                </button>
                <button className="cursor-pointer bg-red-500 px-4 py-2 text-white transition hover:bg-red-600" onClick={() => onDelete(task.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  )
}

function TaskForm({
  form,
  title,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: Omit<Task, 'id'>
  title: string
  saving: boolean
  onChange: (task: Omit<Task, 'id'>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  return (
    <form
      className="relative z-10 max-h-[80vh] w-[min(46rem,82vw)] animate-[modalIn_220ms_ease-out] overflow-y-auto border-2 border-black bg-white px-6 py-6 shadow-2xl scrollbar-none max-[760px]:max-h-[78vh] max-[760px]:w-[88vw] max-[760px]:px-5 max-[760px]:py-5 [&::-webkit-scrollbar]:hidden"
      onSubmit={onSubmit}
      noValidate
    >
      <label className="block text-lg">
        Task name
        <input
          className="mt-2 h-12 w-full bg-neutral-200 px-4 text-base outline-none transition placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-400"
          placeholder="Enter you task name"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
        />
      </label>

      <label className="mt-5 block text-lg">
        Task description
        <textarea
          className="mt-2 h-32 w-full resize-none bg-neutral-200 px-4 py-3 text-base outline-none transition placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-400 sm:h-36"
          placeholder="Enter you task description"
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div className="grid grid-cols-2 gap-3">
          {priorities.map((priority) => (
            <button
              className={`min-w-20 cursor-pointer rounded-full border px-4 py-1 text-sm transition duration-200 hover:brightness-95 active:scale-95 ${priorityPillClass(priority)} ${form.priority === priority ? 'ring-2 ring-black' : ''}`}
              key={priority}
              type="button"
              onClick={() => onChange({ ...form, priority })}
            >
              {priority}
              {form.priority === priority && <FaCheck className="ml-3 inline h-3 w-3" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="h-14 w-px bg-neutral-300 max-[760px]:hidden" />

        <input
          className="h-11 cursor-pointer bg-black px-4 text-base text-white outline-none transition scheme-dark hover:bg-neutral-800 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
          type="date"
          min={toDateInputValue(new Date())}
          value={toDateInputValue(form.date)}
          onChange={(event) => onChange({ ...form, date: event.target.value })}
        />
      </div>

      <button className="mt-6 h-12 w-full cursor-pointer bg-blue-500 text-xl text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70" disabled={saving} type="submit">
        {saving ? 'Saving...' : title}
      </button>
      <button className="mt-4 h-12 w-full cursor-pointer bg-red-600 text-xl text-white transition hover:bg-red-700 active:scale-[0.99]" type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

function MonthPicker({
  currentMonth,
  onChange,
}: {
  currentMonth: Date
  onChange: (date: Date) => void
}) {
  const [year, setYear] = useState(currentMonth.getFullYear())

  return (
    <div className="relative z-10 w-[min(32rem,calc(100vw-3rem))] animate-[modalIn_220ms_ease-out] border-2 border-black bg-white px-6 py-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-center gap-5 text-2xl">
        <button className="cursor-pointer px-3 transition hover:scale-110 active:scale-95" onClick={() => setYear((value) => value - 1)}>
          &lt;
        </button>
        <strong className="font-normal">{year}</strong>
        <button className="cursor-pointer px-3 transition hover:scale-110 active:scale-95" onClick={() => setYear((value) => value + 1)}>
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {monthNames.map((month, index) => (
          <button className="cursor-pointer px-3 py-3 text-base transition duration-200 hover:bg-neutral-100 active:scale-95" key={month} onClick={() => onChange(new Date(year, index, 1))}>
            {month}
          </button>
        ))}
      </div>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <main className="min-h-screen bg-white px-5 py-6 text-black sm:px-8 lg:px-12 lg:py-8">
      <div className="animate-pulse">
        <header className="grid grid-cols-[auto_minmax(12rem,1fr)_auto_auto] items-center gap-4 max-[760px]:grid-cols-[auto_1fr_auto] max-[760px]:gap-3">
          <span className="h-9 w-44 rounded bg-neutral-200 sm:w-52" />
          <span className="h-11 rounded-full bg-neutral-200 max-[760px]:order-4 max-[760px]:col-span-3 sm:h-12" />
          <span className="h-11 w-40 rounded-full bg-neutral-200 sm:h-12 sm:w-44" />
          <span className="h-11 w-11 rounded-full bg-neutral-200 sm:h-12 sm:w-12" />
        </header>
        <div className="mt-14 grid grid-cols-7 text-center text-2xl max-[760px]:mt-12 max-[760px]:text-base sm:text-3xl lg:text-4xl">
          {weekDays.map((day) => (
            <span className="pb-8 max-[760px]:pb-7" key={day}>
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 28 }).map((_, index) => (
            <span className="h-24 border-2 border-emerald-200 bg-neutral-100 max-[760px]:h-29 sm:h-28 lg:h-[clamp(5.8rem,8.1vw,9.1rem)]" key={index} />
          ))}
        </div>
      </div>
    </main>
  )
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstOfMonth = new Date(year, monthIndex, 1)
  const start = new Date(year, monthIndex, 1 - firstOfMonth.getDay())
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const totalDays = firstOfMonth.getDay() + daysInMonth > 35 ? 42 : 28

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    return {
      key: toDateKey(date),
      day: date.getDate(),
      monthState: date.getMonth() === monthIndex ? 'current' : date < firstOfMonth ? 'previous' : 'next',
    }
  })
}

function groupTasksByDate(tasks: Task[]) {
  const map = new Map<string, Task[]>()

  for (const task of tasks) {
    const key = toDateKey(task.date)
    map.set(key, [...(map.get(key) ?? []), task])
  }

  return map
}

function filterTasks(tasks: Task[], search: string) {
  const query = search.trim().toLowerCase()

  if (!query) return tasks

  return tasks.filter((task) => `${task.title} ${task.description ?? ''}`.toLowerCase().includes(query))
}

function getLegendItems(days: CalendarDay[]) {
  const states = new Set(days.map((day) => day.monthState))

  return [
    { state: 'previous', label: 'Previous month' },
    { state: 'current', label: 'Current month' },
    { state: 'next', label: 'Next month' },
  ].filter((item) => states.has(item.state as CalendarDay['monthState']))
}

function monthCellClass(monthState: CalendarDay['monthState'], selected: boolean, isToday: boolean) {
  const selectedClass = selected ? 'bg-emerald-400 font-semibold outline outline-2 outline-black outline-offset-[-2px]' : ''

  if (monthState === 'previous') {
    return `border-fuchsia-300 bg-fuchsia-50 text-neutral-400 ${selectedClass}`
  }

  if (monthState === 'next') {
    return `border-orange-200 bg-orange-50 text-neutral-400 ${selectedClass}`
  }

  const todayClass = isToday ? 'border-emerald-500 bg-emerald-200 font-semibold' : 'border-emerald-200 bg-emerald-50'

  return `${todayClass} ${selectedClass}`
}

function legendClass(state: string) {
  if (state === 'previous') return 'bg-fuchsia-200'
  if (state === 'next') return 'bg-orange-200'

  return 'bg-emerald-200'
}

function priorityPillClass(priority: TaskPriority) {
  if (priority === 'High') return 'border-red-500 bg-red-100'
  if (priority === 'Medium') return 'border-orange-500 bg-orange-100'
  if (priority === 'Very low') return 'border-green-500 bg-green-100'

  return 'border-yellow-500 bg-yellow-100'
}

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toDateInputValue(value: string | Date) {
  return toDateKey(value)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function isUnauthorized(error: unknown) {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status === 401
    : false
}

export default Home
