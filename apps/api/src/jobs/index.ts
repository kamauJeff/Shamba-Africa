import cron from 'node-cron'
import axios from 'axios'
import { db } from '../config/db'
import { sendSms } from '../services/sms.service'
import { COUNTY_COORDS } from '@shamba/shared'

const THRESHOLDS = {
  DROUGHT: { field: 'rain', op: '<', value: 2   },
  FLOOD:   { field: 'rain', op: '>', value: 150  },
  HEAT:    { field: 'temp', op: '>', value: 38   },
  FROST:   { field: 'temp', op: '<', value: 2    },
  WIND:    { field: 'wind', op: '>', value: 25   },
}

async function fetchWeatherForCounty(county: string) {
  const c = COUNTY_COORDS[county] ?? { lat: -1.286, lon: 36.82 }
  const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { lat: c.lat, lon: c.lon, appid: process.env.OPENWEATHER_API_KEY, units: 'metric' },
    timeout: 8000,
  })
  return { tempC: data.main.temp, rainMm: data.rain?.['1h'] ?? 0, windMs: data.wind.speed }
}

async function runInsuranceCheck() {
  if (!process.env.OPENWEATHER_API_KEY) { console.log('[Jobs] No OPENWEATHER key — skipping insurance check'); return }
  const policies = await db.insurancePolicy.findMany({
    where: { status: 'ACTIVE', startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    include: { user: { select: { phone: true, name: true } } },
  })

  const cache = new Map<string, any>()
  for (const policy of policies) {
    try {
      if (!cache.has(policy.county)) cache.set(policy.county, await fetchWeatherForCounty(policy.county))
      const w = cache.get(policy.county)!

      const checks = [
        { type: 'DROUGHT' as const, measured: w.rainMm },
        { type: 'FLOOD'   as const, measured: w.rainMm },
        { type: 'HEAT'    as const, measured: w.tempC  },
        { type: 'FROST'   as const, measured: w.tempC  },
        { type: 'WIND'    as const, measured: w.windMs },
      ]

      for (const { type, measured } of checks) {
        const t = THRESHOLDS[type]
        const triggered = t.op === '>' ? measured > t.value : measured < t.value
        await db.weatherTriggerLog.create({ data: { policyId: policy.id, county: policy.county, triggerType: type, measuredValue: measured, threshold: t.value, triggered, rawWeatherData: w } })

        if (triggered) {
          const payout = policy.coverageAmountKes * 0.5
          await db.$transaction([
            db.insurancePolicy.update({ where: { id: policy.id }, data: { status: 'TRIGGERED', payoutAmountKes: payout, paidOutAt: new Date() } }),
            db.wallet.upsert({ where: { userId: policy.userId }, create: { userId: policy.userId, balanceKes: payout, totalEarnedKes: payout }, update: { balanceKes: { increment: payout }, totalEarnedKes: { increment: payout } } }),
            db.transaction.create({ data: { userId: policy.userId, policyId: policy.id, type: 'INSURANCE_PAYOUT', amountKes: payout, description: `Auto-payout: ${type} trigger in ${policy.county}` } }),
          ])
          if (policy.user?.phone) await sendSms(policy.user.phone, `Shamba Insurance: ${type} detected in ${policy.county}. KES ${payout.toLocaleString()} paid to your Shamba wallet. Policy: ${policy.policyRef}`)
          break // One payout per check cycle
        }
      }
    } catch (e: any) { console.error(`[Insurance Job] Policy ${policy.id}:`, e.message) }
  }
}

async function runRepaymentReminders() {
  const in3Days = new Date(Date.now() + 3 * 86400000)
  const tomorrow = new Date(Date.now() + 86400000)
  const due = await db.repayment.findMany({
    where: { status: 'PENDING', dueDate: { gte: tomorrow, lte: in3Days }, smsSentAt: null },
    include: { loan: { include: { user: { select: { phone: true, name: true } } } } },
  })
  for (const r of due) {
    if (!r.loan.user?.phone) continue
    await sendSms(r.loan.user.phone, `Shamba Finance: Reminder — KES ${r.amountDueKes.toLocaleString()} due on ${r.dueDate.toLocaleDateString()}. Pay via the Shamba app or M-Pesa. Ref: ${r.loanId.slice(0,8).toUpperCase()}`)
    await db.repayment.update({ where: { id: r.id }, data: { smsSentAt: new Date() } })
  }
  if (due.length > 0) console.log(`[Reminders] Sent ${due.length} repayment reminder(s)`)
}

async function runOverdueCheck() {
  const overdue = await db.repayment.findMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
  })
  for (const r of overdue) {
    await db.repayment.update({ where: { id: r.id }, data: { status: 'LATE' } })
  }
  if (overdue.length > 0) console.log(`[Overdue] Marked ${overdue.length} repayment(s) as LATE`)
}

export function startJobs() {
  // Insurance check: daily 8am EAT
  cron.schedule('0 5 * * *', () => runInsuranceCheck().catch(e => console.error('[Insurance Job]', e)), { timezone: 'Africa/Nairobi' })
  // Repayment reminders: daily 9am EAT
  cron.schedule('0 6 * * *', () => runRepaymentReminders().catch(e => console.error('[Reminder Job]', e)), { timezone: 'Africa/Nairobi' })
  // Overdue check: daily midnight EAT
  cron.schedule('0 21 * * *', () => runOverdueCheck().catch(e => console.error('[Overdue Job]', e)), { timezone: 'Africa/Nairobi' })
  console.log('  ⏰ Background jobs scheduled (insurance, reminders, overdue)')
}
