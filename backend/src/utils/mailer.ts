import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || '', // Needs setting in .env
    pass: process.env.SMTP_PASS || '', 
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Mailer] SMTP credentials not set. Simulated email to:', to, '\nSubject:', subject)
    return
  }

  try {
    await transporter.sendMail({
      from: `"The Gathering" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`[Mailer] Email sent to ${to}`)
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${to}:`, error)
  }
}
