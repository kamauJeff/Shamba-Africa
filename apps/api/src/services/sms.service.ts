export async function sendSms(phone: string, message: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !process.env.AT_API_KEY) {
    console.log(`[SMS] ${phone}: ${message}`)
    return
  }
  const AT = require('africastalking')({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME ?? 'sandbox' })
  await AT.SMS.send({ to: [phone], message, from: process.env.AT_SENDER_ID ?? 'Shamba' })
}

export async function sendBulk(recipients: { phone: string; message: string }[]) {
  await Promise.allSettled(recipients.map(r => sendSms(r.phone, r.message)))
}
