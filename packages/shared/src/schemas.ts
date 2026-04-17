import { z } from 'zod'

// ─── Helpers ───────────────────────────────────────────────────
const kenyanPhone = z.string()
  .regex(/^(\+254|0)[17]\d{8}$/, 'Enter a valid Kenyan phone number (e.g. +254712345678)')

const strongPassword = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

// ─── Auth ──────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name is required'),
  phone:    kenyanPhone,
  email:    z.string().email().optional().or(z.literal('')),
  password: strongPassword,
  role:     z.enum(['FARMER', 'AGENT', 'BUYER']).default('FARMER'),
  referralCode: z.string().optional(),
})

export const LoginSchema = z.object({
  phone:    z.string().min(1),
  password: z.string().min(1),
})

export const OtpVerifySchema = z.object({
  phone: kenyanPhone,
  otp:   z.string().length(6, 'OTP must be 6 digits'),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     strongPassword,
})

// ─── Farmer profile ────────────────────────────────────────────
export const FarmerProfileSchema = z.object({
  farmSizeAcres:       z.number().min(0.1),
  primaryCrop:         z.string().min(2),
  secondaryCrops:      z.array(z.string()).default([]),
  county:              z.string().min(2),
  subCounty:           z.string().min(2),
  ward:                z.string().optional(),
  latitude:            z.number().min(-4.7).max(4.6).optional(),
  longitude:           z.number().min(33.9).max(42.0).optional(),
  soilType:            z.enum(['LOAM','CLAY','SANDY','SILT','CLAY_LOAM','SANDY_LOAM','PEAT','CHALK']),
  irrigationType:      z.enum(['NONE','DRIP','SPRINKLER','FLOOD','FURROW']).default('NONE'),
  yearsFarming:        z.number().int().min(0),
  hasStorage:          z.boolean().default(false),
  storageCapacityKg:   z.number().positive().optional(),
  previousYieldKg:     z.number().positive().optional(),
  nationalId:          z.string().optional(),
  kraPin:              z.string().optional(),
})

// ─── Loan ──────────────────────────────────────────────────────
export const LoanApplicationSchema = z.object({
  principalKes: z.number().min(1000, 'Minimum KES 1,000').max(2_000_000),
  termMonths:   z.number().int().min(1).max(24),
  purpose:      z.enum(['SEEDS','FERTILIZER','PESTICIDES','EQUIPMENT','IRRIGATION','LABOR','STORAGE','OTHER']),
  purposeDetails: z.string().max(300).optional(),
  dealerName:   z.string().optional(),
  dealerPhone:  kenyanPhone.optional(),
})

export const RepaymentSchema = z.object({
  mpesaRef:  z.string().min(1, 'M-Pesa reference is required'),
  amountKes: z.number().positive(),
})

// ─── Insurance ─────────────────────────────────────────────────
export const InsurancePolicySchema = z.object({
  cropType:          z.string().min(2),
  county:            z.string().min(2),
  region:            z.string().min(2),
  coverageAmountKes: z.number().min(5000).max(10_000_000),
  startDate:         z.string().datetime(),
  endDate:           z.string().datetime(),
  loanId:            z.string().uuid().optional(),
})

// ─── Marketplace ───────────────────────────────────────────────
export const CreateListingSchema = z.object({
  cropName:       z.string().min(2),
  variety:        z.string().optional(),
  quantityKg:     z.number().positive(),
  pricePerKgKes:  z.number().positive(),
  county:         z.string().min(2),
  region:         z.string().min(2),
  grade:          z.enum(['A','B','C','ORGANIC','EXPORT']).default('B'),
  harvestDate:    z.string().datetime(),
  availableFrom:  z.string().datetime(),
  availableUntil: z.string().datetime(),
  description:    z.string().max(1000).optional(),
  photos:         z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  minimumOrderKg: z.number().positive().default(50),
  deliveryRadius: z.number().positive().optional(),
})

export const PlaceOrderSchema = z.object({
  listingId:       z.string().uuid(),
  quantityKg:      z.number().positive(),
  deliveryAddress: z.string().optional(),
  deliveryDate:    z.string().datetime().optional(),
  notes:           z.string().optional(),
})

// ─── Wallet ────────────────────────────────────────────────────
export const TopupSchema   = z.object({ amountKes: z.number().min(100).max(500_000) })
export const WithdrawSchema = z.object({ amountKes: z.number().min(10).max(70_000) })

// ─── AI Prediction ─────────────────────────────────────────────
export const YieldPredictionSchema = z.object({
  crop:           z.string().min(2),
  soilType:       z.enum(['LOAM','CLAY','SANDY','SILT','CLAY_LOAM','SANDY_LOAM','PEAT','CHALK']),
  areaAcres:      z.number().positive(),
  rainfallMm:     z.number().min(0),
  tempAvgC:       z.number().min(0).max(50),
  fertilizerUsed: z.boolean(),
  irrigated:      z.boolean(),
  season:         z.enum(['LONG_RAINS','SHORT_RAINS','DRY']),
})

// ─── Groups ────────────────────────────────────────────────────
export const CreateGroupSchema = z.object({
  name:        z.string().min(3),
  type:        z.enum(['SACCO','COOPERATIVE','BUYING_GROUP','IRRIGATION_SCHEME']),
  county:      z.string().min(2),
  description: z.string().max(500).optional(),
  targetSavingsKes: z.number().positive().optional(),
})

export const GroupContributionSchema = z.object({
  amountKes: z.number().positive(),
  mpesaRef:  z.string().min(1),
  notes:     z.string().optional(),
})

// ─── Supply chain ──────────────────────────────────────────────
export const StakeholderSchema = z.object({
  name:      z.string().min(2),
  type:      z.enum(['AGRO_DEALER','TRANSPORTER','COLD_STORAGE','PROCESSOR','EXPORTER']),
  county:    z.string().min(2),
  phone:     kenyanPhone,
  latitude:  z.number().optional(),
  longitude: z.number().optional(),
  services:  z.array(z.string()).default([]),
})

// ─── Inferred types ────────────────────────────────────────────
export type RegisterInput        = z.infer<typeof RegisterSchema>
export type LoginInput           = z.infer<typeof LoginSchema>
export type FarmerProfileInput   = z.infer<typeof FarmerProfileSchema>
export type LoanApplicationInput = z.infer<typeof LoanApplicationSchema>
export type InsuranceInput       = z.infer<typeof InsurancePolicySchema>
export type CreateListingInput   = z.infer<typeof CreateListingSchema>
export type PlaceOrderInput      = z.infer<typeof PlaceOrderSchema>
export type YieldPredictionInput = z.infer<typeof YieldPredictionSchema>
export type CreateGroupInput     = z.infer<typeof CreateGroupSchema>
