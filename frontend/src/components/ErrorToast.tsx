import { useEffect } from 'react'
import { FaCircleExclamation } from 'react-icons/fa6'

type ErrorToastProps = {
  message: string
  onClose: () => void
}

function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return

    const timer = window.setTimeout(onClose, 5000)

    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed left-1/2 top-5 z-[100] flex w-[min(92vw,34rem)] -translate-x-1/2 animate-[toastIn_220ms_ease-out] items-center gap-3 border border-red-200 bg-white px-5 py-4 text-red-700 shadow-2xl">
      <FaCircleExclamation className="h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
      <p className="text-sm font-medium sm:text-base">{message}</p>
    </div>
  )
}

export default ErrorToast
