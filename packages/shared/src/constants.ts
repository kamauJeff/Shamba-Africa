// ─── Kenya Counties ────────────────────────────────────────────
export const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa',"Murang'a",
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu',
  'Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia','Turkana',
  'Uasin Gishu','Vihiga','Wajir','West Pokot',
] as const

export type KenyanCounty = (typeof KENYA_COUNTIES)[number]

export const AGRICULTURAL_REGIONS: Record<string, string[]> = {
  RIFT_VALLEY: ['Nakuru','Uasin Gishu','Trans Nzoia','Nandi','Kericho','Bomet','Narok','Baringo','Elgeyo-Marakwet','West Pokot','Laikipia','Kajiado'],
  CENTRAL:     ['Kiambu',"Murang'a",'Nyandarua','Nyeri','Kirinyaga'],
  WESTERN:     ['Kakamega','Vihiga','Bungoma','Busia'],
  NYANZA:      ['Kisumu','Siaya','Homa Bay','Migori','Kisii','Nyamira'],
  EASTERN:     ['Meru','Embu','Tharaka-Nithi','Machakos','Makueni','Kitui'],
  COAST:       ['Mombasa','Kilifi','Kwale','Taita-Taveta','Lamu','Tana River'],
  NORTH_EASTERN: ['Garissa','Wajir','Mandera'],
  NORTHERN:    ['Marsabit','Isiolo','Samburu','Turkana'],
  NAIROBI:     ['Nairobi'],
}

// ─── Crops ─────────────────────────────────────────────────────
export const CROPS = [
  'Maize','Wheat','Sorghum','Millet','Rice','Barley',
  'Beans','Cowpeas','Green Grams','Soybean','Pigeon Peas',
  'Potatoes','Sweet Potatoes','Cassava','Yams','Arrowroots',
  'Tomatoes','Kale','Spinach','Cabbage','Onions','Carrots',
  'Capsicum','Brinjal','Courgette','French Beans','Peas',
  'Bananas','Mangoes','Avocados','Oranges','Passion Fruit',
  'Watermelon','Pineapples','Pawpaw','Strawberries',
  'Coffee','Tea','Pyrethrum','Sunflower','Sugarcane','Macadamia','Vanilla',
] as const

// ─── Baseline yields (kg/acre) ─────────────────────────────────
export const BASELINE_YIELDS: Record<string, number> = {
  Maize: 900, Wheat: 700, Sorghum: 600, Millet: 500, Rice: 1200,
  Beans: 400, Cowpeas: 350, 'Green Grams': 300, Soybean: 500,
  Potatoes: 5000, 'Sweet Potatoes': 4000, Cassava: 3500,
  Tomatoes: 8000, Kale: 5000, Cabbage: 6000, Onions: 4000,
  Carrots: 4500, 'French Beans': 2000,
  Bananas: 6000, Mangoes: 2500, Avocados: 2000, Oranges: 3000,
  Coffee: 400, Tea: 3000, Sunflower: 600, Macadamia: 800,
}

// ─── Market price estimates (KES/kg) ──────────────────────────
export const PRICE_ESTIMATES: Record<string, number> = {
  Maize: 42, Wheat: 55, Tomatoes: 85, Potatoes: 35, Beans: 130,
  Coffee: 510, Tea: 82, Avocados: 120, Bananas: 30, Kale: 28,
  'French Beans': 280, Macadamia: 350, 'Green Grams': 140,
}

// ─── Credit scoring ────────────────────────────────────────────
export const CREDIT_WEIGHTS = {
  repaymentHistory:   0.40,
  yieldConsistency:   0.20,
  profileCompleteness:0.15,
  loanUsage:          0.15,
  marketActivity:     0.10,
}

export const CREDIT_TIERS = [
  { min: 300, max: 499, rating: 'POOR',      maxLoanKes: 0,         interestRate: 0  },
  { min: 500, max: 579, rating: 'FAIR',      maxLoanKes: 15_000,    interestRate: 18 },
  { min: 580, max: 649, rating: 'GOOD',      maxLoanKes: 50_000,    interestRate: 15 },
  { min: 650, max: 729, rating: 'VERY_GOOD', maxLoanKes: 200_000,   interestRate: 13 },
  { min: 730, max: 850, rating: 'EXCELLENT', maxLoanKes: 2_000_000, interestRate: 11 },
] as const

// ─── Revenue model ─────────────────────────────────────────────
export const REVENUE_CONFIG = {
  loan: {
    originationFeePct: 1.5,
    lateFeePct:        5,
  },
  insurance: {
    premiumRatePct:    4,
    commissionPct:     12,
    payoutPct:         50,
  },
  marketplace: {
    commissionPct:     7,
    premiumListingKes: 200,
  },
  saas: {
    basicMonthlyKes:   2_500,
    proMonthlyKes:     8_000,
    enterpriseKes:     25_000,
  },
  referral: {
    bonusKes: 500,
  },
}

// ─── Seasons ───────────────────────────────────────────────────
export const KENYA_SEASONS = {
  LONG_RAINS:  { months: [3,4,5],      name: 'Long Rains (Mar–May)' },
  SHORT_RAINS: { months: [10,11,12],   name: 'Short Rains (Oct–Dec)' },
  DRY:         { months: [1,2,6,7,8,9],name: 'Dry Season' },
}

export function getCurrentSeason(): 'LONG_RAINS' | 'SHORT_RAINS' | 'DRY' {
  const m = new Date().getMonth() + 1
  if ([3,4,5].includes(m))    return 'LONG_RAINS'
  if ([10,11,12].includes(m)) return 'SHORT_RAINS'
  return 'DRY'
}

// ─── County GPS centres ────────────────────────────────────────
export const COUNTY_COORDS: Record<string, { lat: number; lon: number }> = {
  Nakuru:       { lat: -0.303,  lon: 36.080 },
  Nairobi:      { lat: -1.286,  lon: 36.820 },
  Kiambu:       { lat: -1.031,  lon: 36.831 },
  Meru:         { lat:  0.047,  lon: 37.649 },
  Kisumu:       { lat: -0.092,  lon: 34.768 },
  Kakamega:     { lat:  0.282,  lon: 34.754 },
  'Uasin Gishu':{ lat:  0.520,  lon: 35.270 },
  'Trans Nzoia':{ lat:  1.016,  lon: 35.003 },
  Nyeri:        { lat: -0.417,  lon: 36.947 },
  Machakos:     { lat: -1.517,  lon: 37.266 },
  Mombasa:      { lat: -4.043,  lon: 39.668 },
  Kericho:      { lat: -0.369,  lon: 35.283 },
  "Murang'a":   { lat: -0.780,  lon: 37.040 },
}
