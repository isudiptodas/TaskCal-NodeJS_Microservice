export function requiredMessage(value: string, label: string) {
  return value.trim() ? '' : `${label} is required.`
}

export function passwordMessage(password: string) {
  if (!password.trim()) return 'Password is required.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain a number.'

  return ''
}

export function pastDateMessage(dateValue: string) {
  if (!dateValue.trim()) return 'Date is required.'

  const selectedDate = new Date(`${dateValue}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return selectedDate < today ? 'Date cannot be in the past.' : ''
}
