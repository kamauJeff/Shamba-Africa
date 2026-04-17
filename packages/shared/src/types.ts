// ─── Auth ─────────────────────────────────────────────────────
export type UserRole = 'FARMER' | 'AGENT' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'

export interface User {
  id: string
  name: string
  phone: string
  email?: string | null
  role: UserRole
  isVerified: boolean
  county?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ─── Farmer Profile ────────────────────────────────────────────
export type IrrigationType = 'NONE' | 'DRIP' | 'SPRINKLER' | 'FLOOD' | 'FURROW'
export type SoilType = 'LOAM' | 'CLAY' | 'SANDY' | 'SILT' | 'CLAY_LOAM' | 'SANDY_LOAM' | 'PEAT' | 'CHALK'
export type Season = 'LONG_RAINS' | 'SHORT_RAINS' | 'DRY'

export interface FarmerProfile {
  id: string
  userId: string
  farmSizeAcres: number
  primaryCrop: string
  secondaryCrops: string[]
  county: string
  subCounty: string
  ward?: string | null
  latitude?: number | null
  longitude?: number | null
  soilType: SoilType
  irrigationType: IrrigationType
  yearsFarming: number
  hasStorage: boolean
  storageCapacityKg?: number | null
  previousYieldKg?: number | null
  nationalId?: string | null
  kraPin?: string | null
  completenessScore: number
  createdAt: Date
  updatedAt: Date
}

// ─── Credit ────────────────────────────────────────────────────
export type CreditRating = 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT'

export interface CreditScore {
  id: string
  userId: string
  score: number
  rating: CreditRating
  eligible: boolean
  maxLoanKes: number
  breakdown: CreditBreakdown
  computedAt: Date
}

export interface CreditBreakdown {
  repaymentHistory: CreditFactor
  yieldConsistency: CreditFactor
  profileCompleteness: CreditFactor
  loanUsage: CreditFactor
  marketActivity: CreditFactor
}

export interface CreditFactor {
  score: number
  max: number
  detail: string
}

// ─── Loans ─────────────────────────────────────────────────────
export type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'REJECTED'
export type LoanPurpose = 'SEEDS' | 'FERTILIZER' | 'PESTICIDES' | 'EQUIPMENT' | 'IRRIGATION' | 'LABOR' | 'STORAGE' | 'OTHER'
export type RepaymentStatus = 'PENDING' | 'PAID' | 'LATE' | 'WAIVED'
export type VoucherStatus = 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'

export interface Loan {
  id: string
  userId: string
  principalKes: number
  interestRatePct: number
  originationFeePct: number
  termMonths: number
  purpose: LoanPurpose
  status: LoanStatus
  creditScoreAtApplication: number
  approvedAt?: Date | null
  disbursedAt?: Date | null
  closedAt?: Date | null
  createdAt: Date
}

// ─── Insurance ─────────────────────────────────────────────────
export type PolicyStatus = 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED'
export type WeatherTriggerType = 'DROUGHT' | 'FLOOD' | 'HEAT' | 'FROST' | 'WIND' | 'PEST_ALERT'

export interface InsurancePolicy {
  id: string
  userId: string
  cropType: string
  county: string
  coverageAmountKes: number
  premiumKes: number
  status: PolicyStatus
  policyRef: string
  startDate: Date
  endDate: Date
  payoutAmountKes?: number | null
}

// ─── Marketplace ───────────────────────────────────────────────
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REMOVED'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_ESCROW' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
export type QualityGrade = 'A' | 'B' | 'C' | 'ORGANIC' | 'EXPORT'

export interface ProductListing {
  id: string
  sellerId: string
  cropName: string
  variety?: string | null
  quantityKg: number
  pricePerKgKes: number
  county: string
  grade: QualityGrade
  harvestDate: Date
  availableUntil: Date
  description?: string | null
  photos: string[]
  status: ListingStatus
  views: number
  createdAt: Date
}

export interface MarketOrder {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  quantityKg: number
  totalAmountKes: number
  commissionKes: number
  status: OrderStatus
  createdAt: Date
}

// ─── Wallet ────────────────────────────────────────────────────
export type TransactionType =
  | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'ORIGINATION_FEE' | 'LATE_FEE'
  | 'INSURANCE_PREMIUM' | 'INSURANCE_PAYOUT'
  | 'MARKET_SALE' | 'MARKET_PURCHASE' | 'MARKET_COMMISSION'
  | 'WALLET_TOPUP' | 'WALLET_WITHDRAWAL'
  | 'REFERRAL_BONUS' | 'GROUP_SAVING' | 'INPUT_PURCHASE'

export interface Wallet {
  id: string
  userId: string
  balanceKes: number
  escrowKes: number
  totalEarnedKes: number
  totalPaidKes: number
  updatedAt: Date
}

// ─── AI / Weather ──────────────────────────────────────────────
export interface YieldPrediction {
  cropName: string
  predictedYieldKg: number
  predictedYieldPerAcre: number
  confidencePct: number
  estimatedRevenueKes: number
  recommendations: string[]
  riskFactors: string[]
  optimalHarvestWindow: string
}

export interface WeatherForecast {
  date: string
  tempMin: number
  tempMax: number
  humidity: number
  rainfallMm: number
  windSpeed: number
  description: string
  icon: string
  farmingAdvice: string
}

// ─── Groups (new: farmer SACCOs & cooperatives) ────────────────
export type GroupRole = 'MEMBER' | 'SECRETARY' | 'TREASURER' | 'CHAIRPERSON'
export type GroupType = 'SACCO' | 'COOPERATIVE' | 'BUYING_GROUP' | 'IRRIGATION_SCHEME'

export interface FarmerGroup {
  id: string
  name: string
  type: GroupType
  county: string
  description?: string | null
  memberCount: number
  totalSavingsKes: number
  createdAt: Date
}

// ─── Supply chain (new) ────────────────────────────────────────
export type StakeholderType = 'AGRO_DEALER' | 'TRANSPORTER' | 'COLD_STORAGE' | 'PROCESSOR' | 'EXPORTER'

export interface Stakeholder {
  id: string
  name: string
  type: StakeholderType
  county: string
  phone: string
  latitude?: number | null
  longitude?: number | null
  verified: boolean
}

// ─── API wrappers ──────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
  meta?: Record<string, unknown>
}

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
