import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatKes = (n: number) =>
  new Intl.NumberFormat('en-KE', { style:'currency', currency:'KES', minimumFractionDigits:0, maximumFractionDigits:0 }).format(n)

export const formatNum = (n: number, d = 0) =>
  new Intl.NumberFormat('en-KE', { minimumFractionDigits:d, maximumFractionDigits:d }).format(n)

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-KE', { year:'numeric', month:'short', day:'numeric' }).format(new Date(d))

export const formatRelative = (d: string | Date) => {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days} days ago`
  return formatDate(d)
}

export const scorePercent = (s: number) => Math.round(((s - 300) / 550) * 100)

export const creditColor = (r: string) => ({
  POOR:'text-red-600', FAIR:'text-amber-600', GOOD:'text-yellow-600',
  VERY_GOOD:'text-shamba-600', EXCELLENT:'text-shamba-700',
}[r] ?? 'text-gray-500')

export const creditBadge = (r: string) => ({
  POOR:'badge-red', FAIR:'badge-amber', GOOD:'badge-amber',
  VERY_GOOD:'badge-green', EXCELLENT:'badge-green',
}[r] ?? 'badge-gray')

export const loanStatusBadge = (s: string) => ({
  PENDING:'badge-amber', APPROVED:'badge-blue', ACTIVE:'badge-green',
  CLOSED:'badge-gray', DEFAULTED:'badge-red', REJECTED:'badge-red',
}[s] ?? 'badge-gray')

export const orderStatusBadge = (s: string) => ({
  PENDING:'badge-amber', CONFIRMED:'badge-blue', IN_ESCROW:'badge-blue',
  DELIVERED:'badge-green', COMPLETED:'badge-green',
  DISPUTED:'badge-red', CANCELLED:'badge-gray',
}[s] ?? 'badge-gray')

export const txIcon = (type: string): { icon: string; positive: boolean } => {
  const map: Record<string, { icon: string; positive: boolean }> = {
    INSURANCE_PAYOUT: { icon:'shield-check', positive:true },
    MARKET_SALE:      { icon:'shopping-bag', positive:true },
    WALLET_TOPUP:     { icon:'arrow-down-circle', positive:true },
    REFERRAL_BONUS:   { icon:'gift', positive:true },
    LOAN_DISBURSEMENT:{ icon:'arrow-down-circle', positive:true },
    LOAN_REPAYMENT:   { icon:'arrow-up-circle', positive:false },
    ORIGINATION_FEE:  { icon:'receipt', positive:false },
    LATE_FEE:         { icon:'alert-circle', positive:false },
    INSURANCE_PREMIUM:{ icon:'shield', positive:false },
    MARKET_COMMISSION:{ icon:'percent', positive:false },
    WALLET_WITHDRAWAL:{ icon:'phone', positive:false },
    GROUP_SAVING:     { icon:'users', positive:false },
  }
  return map[type] ?? { icon:'swap', positive:true }
}
