import axios from 'axios'

const BASE = process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

async function token(): Promise<string> {
  if (process.env.NODE_ENV !== 'production') return 'stub_token'
  const creds = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
  const { data } = await axios.get(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${creds}` } })
  return data.access_token
}

export async function stkPush(phone: string, amount: number, ref: string, desc: string) {
  if (!process.env.MPESA_SHORTCODE) {
    console.log(`[MPESA STK] ${phone} KES ${amount} ref:${ref}`)
    return { checkoutRequestId: `stub_${Date.now()}`, merchantRequestId: `stub_m_${Date.now()}` }
  }
  const t = await token()
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const pwd = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString('base64')
  const { data } = await axios.post(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: process.env.MPESA_SHORTCODE, Password: pwd, Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline', Amount: Math.ceil(amount),
    PartyA: phone, PartyB: process.env.MPESA_SHORTCODE, PhoneNumber: phone,
    CallBackURL: `${process.env.APP_URL}/webhooks/mpesa/stk`,
    AccountReference: ref, TransactionDesc: desc,
  }, { headers: { Authorization: `Bearer ${t}` } })
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID }
}

export async function b2c(phone: string, amount: number, occasion: string) {
  if (!process.env.MPESA_B2C_SHORTCODE) {
    console.log(`[MPESA B2C] ${phone} KES ${amount}`)
    return { conversationId: `stub_${Date.now()}` }
  }
  const t = await token()
  const { data } = await axios.post(`${BASE}/mpesa/b2c/v1/paymentrequest`, {
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: 'BusinessPayment', Amount: Math.ceil(amount),
    PartyA: process.env.MPESA_B2C_SHORTCODE, PartyB: phone,
    Remarks: occasion, Occasion: occasion,
    QueueTimeOutURL: `${process.env.APP_URL}/webhooks/mpesa/b2c/timeout`,
    ResultURL: `${process.env.APP_URL}/webhooks/mpesa/b2c/result`,
  }, { headers: { Authorization: `Bearer ${t}` } })
  return { conversationId: data.ConversationID }
}

export function normalizeMpesaPhone(phone: string): string {
  if (phone.startsWith('+254')) return phone.slice(1)
  if (phone.startsWith('07') || phone.startsWith('01')) return `254${phone.slice(1)}`
  return phone
}
