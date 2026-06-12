import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage, registerUser } from '../../api'
import ErrorToast from '../../components/ErrorToast'
import { passwordMessage, requiredMessage } from '../../validation'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = requiredMessage(name, 'Name') || requiredMessage(email, 'Email') || passwordMessage(password)

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      await registerUser({ name, email, password })
      navigate('/auth/login', { replace: true })
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-white px-5 py-10 text-black">
      <ErrorToast message={error} onClose={() => setError('')} />
      <form className="w-full max-w-xl border-2 border-black bg-white p-8 shadow-2xl" onSubmit={handleSubmit} noValidate>
        <h1 className="text-4xl font-normal">Create account</h1>
        <p className="mt-3 text-neutral-600">Save tasks, view dates, and receive reminders.</p>

        <label className="mt-8 block text-xl">
          Name
          <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="mt-6 block text-xl">
          Email
          <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="mt-6 block text-xl">
          Password
          <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <button className="mt-8 h-14 w-full bg-blue-500 text-xl text-white disabled:opacity-70" disabled={loading}>
          {loading ? 'Creating...' : 'Sign up'}
        </button>

        <p className="mt-6 text-sm">
          Already have an account?{' '}
          <Link className="text-blue-600" to="/auth/login">
            Login
          </Link>
        </p>
      </form>
    </main>
  )
}

export default Register
