import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendMail({ to, subject, text }) {
  if (!resend) {
    console.log('email skipped because RESEND_API_KEY is not configured:', { to, subject, text })
    return
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TaskCal <onboarding@resend.dev>',
      to,
      subject,
      text,
    })
  } catch (error) {
    console.error('resend email failed:', error.message)
    throw error
  }
}

export default sendMail
