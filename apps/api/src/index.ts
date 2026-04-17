import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { authRouter }        from './routes/v1/auth.routes'
import { farmerRouter }      from './routes/v1/farmer.routes'
import { loanRouter }        from './routes/v1/loan.routes'
import { insuranceRouter }   from './routes/v1/insurance.routes'
import { marketRouter }      from './routes/v1/market.routes'
import { walletRouter }      from './routes/v1/wallet.routes'
import { weatherRouter }     from './routes/v1/weather.routes'
import { predictRouter }     from './routes/v1/predict.routes'
import { groupRouter }       from './routes/v1/group.routes'
import { supplyRouter }      from './routes/v1/supply.routes'
import { adminRouter }       from './routes/v1/admin.routes'
import { webhookRouter }     from './routes/v1/webhook.routes'
import { ussdRouter }        from './routes/v1/ussd.routes'

import { errorHandler }  from './middleware/error'
import { notFound }      from './middleware/notFound'
import { startJobs }     from './jobs'

const app  = express()
const PORT = process.env.PORT ?? 3000

// ─── Security ─────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? 'http://localhost:5173',
    'exp://localhost:8081',
    /\.shamba\.africa$/,
  ],
  credentials: true,
}))

// ─── Rate limiting ────────────────────────────────────────────
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, error: 'Too many auth attempts' } }))

// ─── Middleware ───────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ─── Health ───────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  success: true,
  data: { status: 'ok', version: '1.0.0', brand: 'Shamba', env: process.env.NODE_ENV, ts: new Date().toISOString() },
}))

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth',      authRouter)
app.use('/api/v1/farmer',    farmerRouter)
app.use('/api/v1/loans',     loanRouter)
app.use('/api/v1/insurance', insuranceRouter)
app.use('/api/v1/market',    marketRouter)
app.use('/api/v1/wallet',    walletRouter)
app.use('/api/v1/weather',   weatherRouter)
app.use('/api/v1/predict',   predictRouter)
app.use('/api/v1/groups',    groupRouter)
app.use('/api/v1/supply',    supplyRouter)
app.use('/api/v1/admin',     adminRouter)
app.use('/webhooks',         webhookRouter)
app.use('/ussd',             ussdRouter)

// ─── Error handling ───────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 Shamba API running on port ${PORT} [${process.env.NODE_ENV}]`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
  startJobs()
})

export default app
