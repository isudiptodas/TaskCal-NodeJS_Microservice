import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL, getErrorMessage } from '../../api'
import ErrorToast from '../../components/ErrorToast'
import { passwordMessage, requiredMessage } from '../../validation'

type Step = 'email' | 'otp' | 'reset'
const passwordApiUrl = API_BASE_URL ? API_BASE_URL : 'http://localhost:8000'

function PasswordRecovery() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = requiredMessage(email, 'Email')

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000))
      await axios.post(`${passwordApiUrl}/api/password-recovery/request-otp`, { email, otp: generatedOtp }, { withCredentials: true })
      setStep('otp')
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!otp.trim()) {
      setError('OTP is required.')
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be 6 digits.')
      return
    }

    setLoading(true)

    try {
      await axios.post(`${passwordApiUrl}/api/password-recovery/verify-otp`, { email, otp }, { withCredentials: true })
      setStep('reset')
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationError = passwordMessage(password) || requiredMessage(confirmPassword, 'Confirm password')

    if (validationError) {
      setError(validationError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await axios.post(`${passwordApiUrl}/api/password-recovery/reset-password`, { email, otp, password }, { withCredentials: true })
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
      <section className="w-full max-w-xl border-2 border-black bg-white p-8 shadow-2xl">
        <h1 className="text-4xl font-normal">Password recovery</h1>
        <p className="mt-3 text-neutral-600">Verify your email, enter the OTP, then set a new password.</p>

        {step === 'email' && (
          <form onSubmit={handleEmail} noValidate>
            <label className="mt-8 block text-xl">
              Email
              <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="mt-8 h-14 w-full bg-blue-500 text-xl text-white disabled:opacity-70" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtp} noValidate>
            <label className="mt-8 block text-xl">
              Six digit OTP
              <input className="mt-3 h-16 w-full bg-neutral-200 px-5 text-center text-3xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-400" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} />
            </label>
            <button className="mt-8 h-14 w-full bg-blue-500 text-xl text-white disabled:opacity-70" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} noValidate>
            <label className="mt-8 block text-xl">
              New password
              <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label className="mt-6 block text-xl">
              Confirm password
              <input className="mt-3 h-14 w-full bg-neutral-200 px-5 text-lg outline-none focus:ring-2 focus:ring-blue-400" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <button className="mt-8 h-14 w-full bg-blue-500 text-xl text-white disabled:opacity-70" disabled={loading}>
              {loading ? 'Saving...' : 'Save password'}
            </button>
          </form>
        )}

        <Link className="mt-6 inline-block text-sm text-blue-600" to="/auth/login">
          Back to login
        </Link>
      </section>
    </main>
  )
}

export default PasswordRecovery
