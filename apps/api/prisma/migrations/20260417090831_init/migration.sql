-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'AGENT', 'BUYER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('LOAM', 'CLAY', 'SANDY', 'SILT', 'CLAY_LOAM', 'SANDY_LOAM', 'PEAT', 'CHALK');

-- CreateEnum
CREATE TYPE "IrrigationType" AS ENUM ('NONE', 'DRIP', 'SPRINKLER', 'FLOOD', 'FURROW');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('LONG_RAINS', 'SHORT_RAINS', 'DRY');

-- CreateEnum
CREATE TYPE "CreditRating" AS ENUM ('POOR', 'FAIR', 'GOOD', 'VERY_GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'CLOSED', 'DEFAULTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanPurpose" AS ENUM ('SEEDS', 'FERTILIZER', 'PESTICIDES', 'EQUIPMENT', 'IRRIGATION', 'LABOR', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'WAIVED');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ISSUED', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WeatherTriggerType" AS ENUM ('DROUGHT', 'FLOOD', 'HEAT', 'FROST', 'WIND', 'PEST_ALERT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "QualityGrade" AS ENUM ('A', 'B', 'C', 'ORGANIC', 'EXPORT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_ESCROW', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'ORIGINATION_FEE', 'LATE_FEE', 'INSURANCE_PREMIUM', 'INSURANCE_PAYOUT', 'MARKET_SALE', 'MARKET_PURCHASE', 'MARKET_COMMISSION', 'WALLET_TOPUP', 'WALLET_WITHDRAWAL', 'REFERRAL_BONUS', 'GROUP_SAVING', 'GROUP_WITHDRAWAL', 'INPUT_PURCHASE', 'SUBSCRIPTION_FEE');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('SACCO', 'COOPERATIVE', 'BUYING_GROUP', 'IRRIGATION_SCHEME');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('MEMBER', 'SECRETARY', 'TREASURER', 'CHAIRPERSON');

-- CreateEnum
CREATE TYPE "StakeholderType" AS ENUM ('AGRO_DEALER', 'TRANSPORTER', 'COLD_STORAGE', 'PROCESSOR', 'EXPORTER');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FARMER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "county" TEXT,
    "avatarUrl" TEXT,
    "referralCode" TEXT,
    "referredById" TEXT,
    "subscription" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmSizeAcres" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "primaryCrop" TEXT,
    "secondaryCrops" TEXT[],
    "county" TEXT NOT NULL,
    "subCounty" TEXT NOT NULL,
    "ward" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "soilType" "SoilType" NOT NULL DEFAULT 'LOAM',
    "irrigationType" "IrrigationType" NOT NULL DEFAULT 'NONE',
    "yearsFarming" INTEGER NOT NULL DEFAULT 0,
    "hasStorage" BOOLEAN NOT NULL DEFAULT false,
    "storageCapacityKg" DOUBLE PRECISION,
    "previousYieldKg" DOUBLE PRECISION,
    "nationalId" TEXT,
    "kraPin" TEXT,
    "completenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" "CreditRating" NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "maxLoanKes" DOUBLE PRECISION NOT NULL,
    "repaymentScore" INTEGER NOT NULL,
    "yieldScore" INTEGER NOT NULL,
    "completenessScore" INTEGER NOT NULL,
    "loanUsageScore" INTEGER NOT NULL,
    "marketActivityScore" INTEGER NOT NULL,
    "notes" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "principalKes" DOUBLE PRECISION NOT NULL,
    "interestRatePct" DOUBLE PRECISION NOT NULL,
    "originationFeePct" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "termMonths" INTEGER NOT NULL,
    "purpose" "LoanPurpose" NOT NULL,
    "purposeDetails" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "creditScoreAtApp" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "mpesaDisbursementRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountDueKes" DOUBLE PRECISION NOT NULL,
    "amountPaidKes" DOUBLE PRECISION,
    "lateFeeKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "mpesaRef" TEXT,
    "smsSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "dealerName" TEXT,
    "dealerPhone" TEXT,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ISSUED',
    "items" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loanId" TEXT,
    "cropType" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "coverageAmountKes" DOUBLE PRECISION NOT NULL,
    "premiumKes" DOUBLE PRECISION NOT NULL,
    "platformCommissionKes" DOUBLE PRECISION NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "policyRef" TEXT NOT NULL,
    "insurerName" TEXT NOT NULL DEFAULT 'Pioneer Insurance Kenya',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "payoutAmountKes" DOUBLE PRECISION,
    "paidOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherTriggerLog" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "triggerType" "WeatherTriggerType" NOT NULL,
    "measuredValue" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "triggered" BOOLEAN NOT NULL,
    "rawWeatherData" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherTriggerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "variety" TEXT,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "pricePerKgKes" DOUBLE PRECISION NOT NULL,
    "totalValueKes" DOUBLE PRECISION NOT NULL,
    "county" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "grade" "QualityGrade" NOT NULL DEFAULT 'B',
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "minimumOrderKg" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "description" TEXT,
    "photos" TEXT[],
    "certifications" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "deliveryRadius" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "agreedPricePerKgKes" DOUBLE PRECISION NOT NULL,
    "totalAmountKes" DOUBLE PRECISION NOT NULL,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "commissionKes" DOUBLE PRECISION NOT NULL,
    "escrowAmountKes" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAddress" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escrowKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarnedKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "loanId" TEXT,
    "policyId" TEXT,
    "orderId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION,
    "reference" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "season" "Season" NOT NULL,
    "soilType" "SoilType" NOT NULL,
    "areaAcres" DOUBLE PRECISION NOT NULL,
    "rainfallMm" DOUBLE PRECISION NOT NULL,
    "tempAvgC" DOUBLE PRECISION NOT NULL,
    "fertilizerUsed" BOOLEAN NOT NULL,
    "irrigated" BOOLEAN NOT NULL,
    "predictedYieldKg" DOUBLE PRECISION NOT NULL,
    "predictedYieldPerAcre" DOUBLE PRECISION NOT NULL,
    "confidencePct" DOUBLE PRECISION NOT NULL,
    "estimatedRevenueKes" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YieldPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherCache" (
    "id" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPrice" (
    "id" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "priceKes" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "source" TEXT NOT NULL DEFAULT 'Shamba',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GroupType" NOT NULL,
    "county" TEXT NOT NULL,
    "description" TEXT,
    "targetSavingsKes" DOUBLE PRECISION,
    "totalSavingsKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "registrationNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupContribution" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountKes" DOUBLE PRECISION NOT NULL,
    "mpesaRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stakeholder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StakeholderType" NOT NULL,
    "county" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "services" TEXT[],
    "capacity" TEXT,
    "priceInfo" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderReview" (
    "id" TEXT NOT NULL,
    "stakeholderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakeholderReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_county_idx" ON "User"("county");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "OtpCode_userId_idx" ON "OtpCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_userId_key" ON "FarmerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_nationalId_key" ON "FarmerProfile"("nationalId");

-- CreateIndex
CREATE INDEX "FarmerProfile_userId_idx" ON "FarmerProfile"("userId");

-- CreateIndex
CREATE INDEX "FarmerProfile_county_idx" ON "FarmerProfile"("county");

-- CreateIndex
CREATE INDEX "FarmerProfile_primaryCrop_idx" ON "FarmerProfile"("primaryCrop");

-- CreateIndex
CREATE INDEX "CreditScore_userId_idx" ON "CreditScore"("userId");

-- CreateIndex
CREATE INDEX "CreditScore_computedAt_idx" ON "CreditScore"("computedAt");

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_createdAt_idx" ON "Loan"("createdAt");

-- CreateIndex
CREATE INDEX "Repayment_loanId_idx" ON "Repayment"("loanId");

-- CreateIndex
CREATE INDEX "Repayment_dueDate_idx" ON "Repayment"("dueDate");

-- CreateIndex
CREATE INDEX "Repayment_status_idx" ON "Repayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_userId_idx" ON "Voucher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_policyRef_key" ON "InsurancePolicy"("policyRef");

-- CreateIndex
CREATE INDEX "InsurancePolicy_userId_idx" ON "InsurancePolicy"("userId");

-- CreateIndex
CREATE INDEX "InsurancePolicy_county_idx" ON "InsurancePolicy"("county");

-- CreateIndex
CREATE INDEX "InsurancePolicy_status_idx" ON "InsurancePolicy"("status");

-- CreateIndex
CREATE INDEX "WeatherTriggerLog_policyId_idx" ON "WeatherTriggerLog"("policyId");

-- CreateIndex
CREATE INDEX "WeatherTriggerLog_county_idx" ON "WeatherTriggerLog"("county");

-- CreateIndex
CREATE INDEX "WeatherTriggerLog_checkedAt_idx" ON "WeatherTriggerLog"("checkedAt");

-- CreateIndex
CREATE INDEX "ProductListing_sellerId_idx" ON "ProductListing"("sellerId");

-- CreateIndex
CREATE INDEX "ProductListing_cropName_idx" ON "ProductListing"("cropName");

-- CreateIndex
CREATE INDEX "ProductListing_county_idx" ON "ProductListing"("county");

-- CreateIndex
CREATE INDEX "ProductListing_status_idx" ON "ProductListing"("status");

-- CreateIndex
CREATE INDEX "ProductListing_grade_idx" ON "ProductListing"("grade");

-- CreateIndex
CREATE INDEX "MarketOrder_listingId_idx" ON "MarketOrder"("listingId");

-- CreateIndex
CREATE INDEX "MarketOrder_buyerId_idx" ON "MarketOrder"("buyerId");

-- CreateIndex
CREATE INDEX "MarketOrder_sellerId_idx" ON "MarketOrder"("sellerId");

-- CreateIndex
CREATE INDEX "MarketOrder_status_idx" ON "MarketOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "YieldPrediction_userId_idx" ON "YieldPrediction"("userId");

-- CreateIndex
CREATE INDEX "YieldPrediction_crop_idx" ON "YieldPrediction"("crop");

-- CreateIndex
CREATE INDEX "WeatherCache_county_idx" ON "WeatherCache"("county");

-- CreateIndex
CREATE INDEX "WeatherCache_expiresAt_idx" ON "WeatherCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCache_county_key" ON "WeatherCache"("county");

-- CreateIndex
CREATE INDEX "CropPrice_crop_idx" ON "CropPrice"("crop");

-- CreateIndex
CREATE INDEX "CropPrice_county_idx" ON "CropPrice"("county");

-- CreateIndex
CREATE INDEX "CropPrice_recordedAt_idx" ON "CropPrice"("recordedAt");

-- CreateIndex
CREATE INDEX "FarmerGroup_county_idx" ON "FarmerGroup"("county");

-- CreateIndex
CREATE INDEX "FarmerGroup_type_idx" ON "FarmerGroup"("type");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupContribution_groupId_idx" ON "GroupContribution"("groupId");

-- CreateIndex
CREATE INDEX "GroupContribution_userId_idx" ON "GroupContribution"("userId");

-- CreateIndex
CREATE INDEX "Stakeholder_type_idx" ON "Stakeholder"("type");

-- CreateIndex
CREATE INDEX "Stakeholder_county_idx" ON "Stakeholder"("county");

-- CreateIndex
CREATE INDEX "StakeholderReview_stakeholderId_idx" ON "StakeholderReview"("stakeholderId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_email_key" ON "Organization"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_apiKey_key" ON "Organization"("apiKey");

-- CreateIndex
CREATE INDEX "Organization_apiKey_idx" ON "Organization"("apiKey");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScore" ADD CONSTRAINT "CreditScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherTriggerLog" ADD CONSTRAINT "WeatherTriggerLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductListing" ADD CONSTRAINT "ProductListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOrder" ADD CONSTRAINT "MarketOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MarketOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldPrediction" ADD CONSTRAINT "YieldPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FarmerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupContribution" ADD CONSTRAINT "GroupContribution_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FarmerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderReview" ADD CONSTRAINT "StakeholderReview_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "Stakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
