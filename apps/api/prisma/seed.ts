import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Shamba database...\n')

  // ─── Users ────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 12)
  const [adminPw, farmerPw, buyerPw] = await Promise.all([hash('Admin@1234'), hash('Farmer@1234'), hash('Buyer@1234')])

  const admin = await db.user.upsert({ where: { phone: '+254700000001' }, update: {}, create: { name: 'Shamba Admin', phone: '+254700000001', email: 'admin@shamba.africa', passwordHash: adminPw, role: 'ADMIN', isVerified: true } })

  const farmers = await Promise.all([
    db.user.upsert({ where: { phone: '+254712345678' }, update: {}, create: { name: 'John Kamau',   phone: '+254712345678', email: 'john@example.com',  passwordHash: farmerPw, role: 'FARMER', county: 'Nakuru',    isVerified: true } }),
    db.user.upsert({ where: { phone: '+254723456789' }, update: {}, create: { name: 'Mary Wanjiku', phone: '+254723456789', email: 'mary@example.com',  passwordHash: farmerPw, role: 'FARMER', county: 'Kiambu',    isVerified: true } }),
    db.user.upsert({ where: { phone: '+254734567890' }, update: {}, create: { name: 'Peter Otieno', phone: '+254734567890', email: 'peter@example.com', passwordHash: farmerPw, role: 'FARMER', county: 'Uasin Gishu',isVerified: true } }),
    db.user.upsert({ where: { phone: '+254745678901' }, update: {}, create: { name: 'Grace Njeri',  phone: '+254745678901', email: 'grace@example.com', passwordHash: farmerPw, role: 'FARMER', county: 'Meru',      isVerified: true } }),
  ])

  const buyer = await db.user.upsert({ where: { phone: '+254756789012' }, update: {}, create: { name: 'EastAfrica Traders Ltd', phone: '+254756789012', email: 'buyer@eatraders.co.ke', passwordHash: buyerPw, role: 'BUYER', county: 'Nairobi', isVerified: true } })

  console.log('✅ Users created')

  // ─── Wallets ──────────────────────────────────────────────────
  for (const u of [...farmers, buyer, admin]) {
    await db.wallet.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id } })
  }

  // ─── Farmer profiles ──────────────────────────────────────────
  const profileData = [
    { userId: farmers[0].id, farmSizeAcres: 12, primaryCrop: 'Maize', secondaryCrops: ['Beans','Tomatoes'], county: 'Nakuru', subCounty: 'Nakuru East', latitude: -0.303, longitude: 36.080, soilType: 'LOAM' as const, irrigationType: 'DRIP' as const, yearsFarming: 8, hasStorage: true, storageCapacityKg: 5000, previousYieldKg: 4500, nationalId: '12345678', completenessScore: 92 },
    { userId: farmers[1].id, farmSizeAcres: 4,  primaryCrop: 'Tea',   secondaryCrops: ['Avocados','Coffee'], county: 'Kiambu', subCounty: 'Githunguri', latitude: -1.031, longitude: 36.831, soilType: 'CLAY_LOAM' as const, irrigationType: 'SPRINKLER' as const, yearsFarming: 5, hasStorage: false, previousYieldKg: 1200, nationalId: '23456789', completenessScore: 78 },
    { userId: farmers[2].id, farmSizeAcres: 20, primaryCrop: 'Wheat', secondaryCrops: ['Sunflower','Soybean'], county: 'Uasin Gishu', subCounty: 'Turbo', latitude: 0.520, longitude: 35.270, soilType: 'LOAM' as const, irrigationType: 'NONE' as const, yearsFarming: 15, hasStorage: true, storageCapacityKg: 20000, previousYieldKg: 14000, nationalId: '34567890', kraPin: 'A012345678B', completenessScore: 96 },
    { userId: farmers[3].id, farmSizeAcres: 3,  primaryCrop: 'Tomatoes', secondaryCrops: ['Kale','Capsicum'], county: 'Meru', subCounty: 'Imenti North', latitude: 0.047, longitude: 37.649, soilType: 'LOAM' as const, irrigationType: 'DRIP' as const, yearsFarming: 4, hasStorage: false, previousYieldKg: 3200, nationalId: '45678901', completenessScore: 82 },
  ]
  for (const p of profileData) {
    await db.farmerProfile.upsert({ where: { userId: p.userId }, update: {}, create: p })
  }
  console.log('✅ Farmer profiles')

  // ─── Credit scores ────────────────────────────────────────────
  const scores = [
    { userId: farmers[0].id, score: 685, rating: 'VERY_GOOD' as const, eligible: true, maxLoanKes: 200000, repaymentScore: 176, yieldScore: 44, completenessScore: 62, loanUsageScore: 55, marketActivityScore: 48 },
    { userId: farmers[1].id, score: 598, rating: 'GOOD' as const,      eligible: true, maxLoanKes: 50000,  repaymentScore: 140, yieldScore: 22, completenessScore: 41, loanUsageScore: 33, marketActivityScore: 12 },
    { userId: farmers[2].id, score: 742, rating: 'EXCELLENT' as const, eligible: true, maxLoanKes: 2000000,repaymentScore: 200, yieldScore: 55, completenessScore: 82, loanUsageScore: 82, marketActivityScore: 55 },
    { userId: farmers[3].id, score: 612, rating: 'GOOD' as const,      eligible: true, maxLoanKes: 50000,  repaymentScore: 160, yieldScore: 33, completenessScore: 55, loanUsageScore: 22, marketActivityScore: 22 },
  ]
  for (const s of scores) {
    await db.creditScore.create({ data: s })
  }
  console.log('✅ Credit scores')

  // ─── Loans ────────────────────────────────────────────────────
  const loan1 = await db.loan.create({ data: { userId: farmers[0].id, principalKes: 20000, interestRatePct: 13, termMonths: 6, purpose: 'SEEDS', status: 'ACTIVE', creditScoreAtApp: 685, approvedAt: new Date(Date.now() - 45*86400000), disbursedAt: new Date(Date.now() - 43*86400000) } })
  const loan2 = await db.loan.create({ data: { userId: farmers[2].id, principalKes: 80000, interestRatePct: 11, termMonths: 12, purpose: 'EQUIPMENT', status: 'CLOSED', creditScoreAtApp: 742, approvedAt: new Date(Date.now() - 400*86400000), disbursedAt: new Date(Date.now() - 398*86400000), closedAt: new Date(Date.now() - 30*86400000) } })

  const emi1 = (20000 * (13/100/12) * Math.pow(1+13/100/12,6)) / (Math.pow(1+13/100/12,6)-1)
  const emi2 = (80000 * (11/100/12) * Math.pow(1+11/100/12,12)) / (Math.pow(1+11/100/12,12)-1)

  for (let i = 0; i < 6; i++) {
    const due = new Date(Date.now() - 43*86400000); due.setMonth(due.getMonth()+i+1)
    await db.repayment.create({ data: { loanId: loan1.id, dueDate: due, amountDueKes: Math.round(emi1*100)/100, status: i < 2 ? 'PAID' : 'PENDING', paidAt: i < 2 ? new Date(due.getTime()-2*86400000) : null, amountPaidKes: i < 2 ? Math.round(emi1*100)/100 : null, mpesaRef: i < 2 ? `MPE${Date.now()}${i}` : null } })
  }
  for (let i = 0; i < 12; i++) {
    const due = new Date(Date.now() - 398*86400000); due.setMonth(due.getMonth()+i+1)
    await db.repayment.create({ data: { loanId: loan2.id, dueDate: due, amountDueKes: Math.round(emi2*100)/100, status: 'PAID', paidAt: new Date(due.getTime()-86400000), amountPaidKes: Math.round(emi2*100)/100, mpesaRef: `MPE${Date.now()}${i}` } })
  }

  await db.voucher.create({ data: { loanId: loan1.id, userId: farmers[0].id, amountKes: 19700, dealerName: 'Nakuru Agrovet Centre', dealerPhone: '+254722000001', status: 'REDEEMED', expiresAt: new Date(Date.now()+15*86400000), redeemedAt: new Date(Date.now()-40*86400000) } })
  console.log('✅ Loans + repayments + vouchers')

  // ─── Insurance ────────────────────────────────────────────────
  await db.insurancePolicy.create({ data: { userId: farmers[0].id, loanId: loan1.id, cropType: 'Maize', county: 'Nakuru', region: 'Rift Valley', coverageAmountKes: 100000, premiumKes: 4000, platformCommissionKes: 480, status: 'ACTIVE', policyRef: 'SHM-MAIZE-001', startDate: new Date(Date.now()-30*86400000), endDate: new Date(Date.now()+150*86400000) } })
  await db.insurancePolicy.create({ data: { userId: farmers[2].id, cropType: 'Wheat', county: 'Uasin Gishu', region: 'Rift Valley', coverageAmountKes: 300000, premiumKes: 12000, platformCommissionKes: 1440, status: 'TRIGGERED', policyRef: 'SHM-WHEAT-001', startDate: new Date(Date.now()-90*86400000), endDate: new Date(Date.now()+90*86400000), payoutAmountKes: 150000, paidOutAt: new Date(Date.now()-15*86400000) } })
  console.log('✅ Insurance policies')

  // ─── Market prices ────────────────────────────────────────────
  const prices = [
    { crop:'Maize',   region:'Rift Valley',county:'Nakuru',       priceKes:42,  unit:'KG' },
    { crop:'Wheat',   region:'Rift Valley',county:'Uasin Gishu',  priceKes:52,  unit:'KG' },
    { crop:'Beans',   region:'Central',    county:'Kiambu',        priceKes:130, unit:'KG' },
    { crop:'Tomatoes',region:'Eastern',    county:'Meru',          priceKes:85,  unit:'KG' },
    { crop:'Potatoes',region:'Rift Valley',county:'Nakuru',        priceKes:35,  unit:'KG' },
    { crop:'Tea',     region:'Central',    county:'Kiambu',        priceKes:82,  unit:'KG' },
    { crop:'Coffee',  region:'Central',    county:"Murang'a",      priceKes:510, unit:'KG' },
    { crop:'Avocados',region:'Central',    county:'Kiambu',        priceKes:120, unit:'KG' },
    { crop:'Kale',    region:'Nairobi',    county:'Nairobi',       priceKes:28,  unit:'KG' },
    { crop:'Maize',   region:'Eastern',    county:'Machakos',      priceKes:40,  unit:'KG' },
    { crop:'Beans',   region:'Nyanza',     county:'Kisumu',        priceKes:122, unit:'KG' },
    { crop:'Tomatoes',region:'Nairobi',    county:'Nairobi',       priceKes:92,  unit:'KG' },
    { crop:'Wheat',   region:'Rift Valley',county:'Trans Nzoia',   priceKes:50,  unit:'KG' },
    { crop:'Macadamia',region:'Eastern',  county:'Meru',           priceKes:350, unit:'KG' },
    { crop:'Sugarcane',region:'Western',  county:'Kakamega',       priceKes:4,   unit:'KG' },
  ]
  for (const p of prices) {
    for (let d = 0; d <= 30; d += 10) {
      await db.cropPrice.create({ data: { ...p, priceKes: Math.round(p.priceKes * (0.92 + Math.random() * 0.16)), recordedAt: new Date(Date.now()-d*86400000) } })
    }
  }
  console.log('✅ Market prices')

  // ─── Listings ─────────────────────────────────────────────────
  const listings = [
    { sellerId:farmers[0].id, cropName:'Maize',   quantityKg:2000, pricePerKgKes:38, county:'Nakuru',      region:'Rift Valley', grade:'A' as const, description:'Grade A dry maize, moisture <14%. Milling quality.', photos:[], certifications:['KEBS'], minimumOrderKg:200 },
    { sellerId:farmers[2].id, cropName:'Wheat',   quantityKg:5000, pricePerKgKes:52, county:'Uasin Gishu', region:'Rift Valley', grade:'EXPORT' as const, description:'Premium hard wheat, protein >12%. Suitable for flour milling.', photos:[], certifications:['KEBS','ISO'], minimumOrderKg:500 },
    { sellerId:farmers[1].id, cropName:'Avocados',quantityKg:800,  pricePerKgKes:115,county:'Kiambu',      region:'Central',     grade:'EXPORT' as const, description:'Hass avocado, export grade. 180-220g per fruit. Picked at maturity.', photos:[], certifications:['GlobalG.A.P'], minimumOrderKg:100 },
    { sellerId:farmers[3].id, cropName:'Tomatoes',quantityKg:500,  pricePerKgKes:80, county:'Meru',        region:'Eastern',     grade:'A' as const, description:'Roma tomatoes, firm. Farm fresh. Delivered Nairobi.', photos:[], certifications:[], minimumOrderKg:50 },
  ]
  const harvest = new Date(Date.now()-7*86400000)
  const until   = new Date(Date.now()+21*86400000)
  for (const l of listings) {
    await db.productListing.create({ data: { ...l, totalValueKes: l.quantityKg*l.pricePerKgKes, harvestDate: harvest, availableFrom: new Date(), availableUntil: until, status: 'ACTIVE', views: Math.round(Math.random()*80+10) } })
  }
  console.log('✅ Marketplace listings')

  // ─── Supply chain directory ────────────────────────────────────
  const stakeholders = [
    { name:'Nakuru Agrovet Centre',  type:'AGRO_DEALER' as const,   county:'Nakuru',       phone:'+254722000001', latitude:-0.285, longitude:36.066, services:['Seeds','Fertilizer','Pesticides'], capacity:'500 farmers/month', verified:true, rating:4.5, ratingCount:28 },
    { name:'Eldoret Cold Storage',   type:'COLD_STORAGE' as const,  county:'Uasin Gishu',  phone:'+254733000002', latitude:0.514,  longitude:35.269, services:['Produce storage','Ripening room'], capacity:'200 tons', verified:true, rating:4.2, ratingCount:15 },
    { name:'Meru Transporters Ltd',  type:'TRANSPORTER' as const,   county:'Meru',         phone:'+254744000003', latitude:0.040,  longitude:37.640, services:['Refrigerated trucks','GPS tracking'], capacity:'10 trucks', verified:true, rating:4.0, ratingCount:22 },
    { name:'Nairobi Grain Millers',  type:'PROCESSOR' as const,     county:'Nairobi',      phone:'+254755000004', latitude:-1.290, longitude:36.825, services:['Maize milling','Wheat flour','Packaging'], capacity:'50 tons/day', verified:true, rating:4.7, ratingCount:41 },
    { name:'Kenya Fresh Exports Ltd',type:'EXPORTER' as const,      county:'Nairobi',      phone:'+254766000005', latitude:-1.318, longitude:36.828, services:['EU export','Fresh produce','Documentation'], capacity:'20 containers/month', verified:true, rating:4.3, ratingCount:19 },
    { name:'Kisumu Agrovet',         type:'AGRO_DEALER' as const,   county:'Kisumu',       phone:'+254777000006', latitude:-0.098, longitude:34.762, services:['Seeds','Fertilizer','Soil testing'], capacity:'300 farmers/month', verified:false, rating:3.8, ratingCount:12 },
  ]
  for (const s of stakeholders) {
    await db.stakeholder.create({ data: s })
  }
  console.log('✅ Supply chain directory')

  // ─── Farmer groups ────────────────────────────────────────────
  const group = await db.farmerGroup.create({ data: { name:'Nakuru Maize Growers SACCO', type:'SACCO', county:'Nakuru', description:'A farmer SACCO for maize growers in Nakuru county. Pooling resources for bulk input purchase and group loans.', targetSavingsKes:500000, totalSavingsKes:127500, isVerified:true } })
  for (const f of farmers.slice(0,3)) {
    await db.groupMember.create({ data: { groupId: group.id, userId: f.id, role: f.id === farmers[0].id ? 'CHAIRPERSON' : 'MEMBER' } })
  }
  await db.groupContribution.createMany({ data: [
    { groupId:group.id, userId:farmers[0].id, amountKes:50000, mpesaRef:'MPE001', notes:'March contribution' },
    { groupId:group.id, userId:farmers[1].id, amountKes:42500, mpesaRef:'MPE002' },
    { groupId:group.id, userId:farmers[2].id, amountKes:35000, mpesaRef:'MPE003' },
  ]})
  console.log('✅ Farmer groups')

  // ─── Revenue transactions ──────────────────────────────────────
  await db.transaction.createMany({ data: [
    { userId:farmers[0].id, loanId:loan1.id, type:'ORIGINATION_FEE',    amountKes:300,   description:'1.5% origination on KES 20,000',  createdAt:new Date(Date.now()-43*86400000) },
    { userId:farmers[0].id, loanId:loan1.id, type:'LOAN_REPAYMENT',     amountKes:3620,  description:'Instalment 1', createdAt:new Date(Date.now()-43*86400000+30*86400000) },
    { userId:farmers[0].id, loanId:loan1.id, type:'LOAN_REPAYMENT',     amountKes:3620,  description:'Instalment 2', createdAt:new Date(Date.now()-43*86400000+60*86400000) },
    { userId:farmers[2].id, type:'INSURANCE_PREMIUM',  amountKes:1440,  description:'Insurance commission SHM-WHEAT-001' },
    { userId:farmers[0].id, type:'INSURANCE_PREMIUM',  amountKes:480,   description:'Insurance commission SHM-MAIZE-001' },
    { userId:farmers[2].id, type:'INSURANCE_PAYOUT',   amountKes:150000,description:'Drought trigger payout' },
  ]})
  console.log('✅ Transactions')

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌱 Shamba seed complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin:   +254700000001 / Admin@1234
Farmers: +254712345678 / Farmer@1234
         +254723456789 / Farmer@1234
         +254734567890 / Farmer@1234
         +254745678901 / Farmer@1234
Buyer:   +254756789012 / Buyer@1234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1) }).finally(() => db.$disconnect())
