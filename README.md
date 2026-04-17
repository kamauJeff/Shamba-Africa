# 🌱 Shamba — From Seed to Sale

> Africa's premier agritech ecosystem. Empowering smallholder farmers across East Africa with credit, insurance, marketplace access, and AI-driven insights.

---

## Why Shamba wins

| Problem | Shamba solution | Revenue stream |
|---|---|---|
| Farmers can't access credit | AI credit scoring → input loans | 12–18% interest + 1.5% origination fee |
| Crops lost to weather | Parametric insurance, auto-payout | 12% commission on 4% premium |
| Produce sold at exploitative prices | B2B marketplace with escrow | 7% transaction commission |
| No market data | Live prices across 15+ counties | Premium SaaS tier |
| Post-harvest loss | Verified cold storage directory | Lead-gen fees |
| Feature phone farmers excluded | Full USSD interface | Africa's Talking |

**Target market:** 5.4M smallholder farmers in Kenya alone. East Africa (KE/UG/TZ) = 15M+ farmers.

---

## Tech stack

| Layer | Technology | Deploy |
|---|---|---|
| API | Node.js · Express · Prisma · PostgreSQL | Railway |
| Web | React 18 · Vite · Tailwind CSS · shadcn/ui · React Query | Vercel |
| Mobile | Expo SDK 51 · React Native · Expo Router | EAS |
| Database | Supabase PostgreSQL | Supabase |
| Shared | TypeScript · Zod · pnpm workspaces | — |

---

## Project structure

```
shamba/
├── apps/
│   ├── api/                     # Express REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # 25 models, 8 domains
│   │   │   └── seed.ts          # Realistic EA data
│   │   └── src/
│   │       ├── controllers/v1/  # 11 controllers
│   │       ├── routes/v1/       # 11 route files
│   │       ├── services/        # credit, weather, mpesa, predict, sms, jwt
│   │       ├── jobs/            # node-cron insurance checker + reminders
│   │       └── middleware/      # JWT auth, Zod validation, error handler
│   ├── web/                     # React SPA
│   │   └── src/
│   │       ├── pages/           # 11 pages (dashboard → admin)
│   │       ├── components/      # AppLayout, shared UI
│   │       ├── hooks/           # React Query hooks for all APIs
│   │       ├── lib/             # axios client, utils
│   │       └── store/           # Zustand auth store
│   └── mobile/                  # Expo React Native
│       ├── app/
│       │   ├── (auth)/          # login, register
│       │   └── (tabs)/          # dashboard, market, loans, groups, profile
│       └── src/
│           ├── api/             # axios client + all endpoints
│           ├── hooks/           # React Query hooks
│           ├── store/           # Zustand + AsyncStorage auth
│           └── lib/             # theme, utils
└── packages/
    └── shared/                  # Types, Zod schemas, Kenya constants
        └── src/
            ├── types.ts
            ├── schemas.ts
            └── constants.ts
```

---

## Quick start

### Prerequisites
- Node.js 18+ · pnpm 9+ · Git

### 1. Install
```bash
git clone https://github.com/YOUR_USERNAME/shamba.git
cd shamba
pnpm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → New project → name it `shamba`
2. Use a password **with no special characters** (e.g. `Shamba2024Secure`)
3. Settings → Database → Connection string → copy both URLs

### 3. Configure environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in DATABASE_URL, DIRECT_URL, and JWT secrets
cp apps/web/.env.example apps/web/.env
# VITE_API_URL=http://localhost:3000/api/v1
```

**`apps/api/.env` template:**
```env
DATABASE_URL="postgresql://postgres.REF:PASS@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASS@db.REF.supabase.co:5432/postgres"
JWT_ACCESS_SECRET=shamba_access_32_char_secret_here
JWT_REFRESH_SECRET=shamba_refresh_32_char_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OPENWEATHER_API_KEY=your_key        # openweathermap.org (free tier)
AT_API_KEY=your_key                 # africastalking.com (sandbox free)
AT_USERNAME=sandbox
AT_SENDER_ID=Shamba
```

**`apps/mobile/.env`:**
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api/v1
```
> Use your machine's LAN IP (e.g. `192.168.1.10`), not `localhost` — Expo runs on your phone.

### 4. Migrate and seed
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
```

### 5. Run
```bash
# Terminal 1 — API
pnpm dev:api        # → http://localhost:3000

# Terminal 2 — Web
pnpm dev:web        # → http://localhost:5173

# Terminal 3 — Mobile (optional)
pnpm dev:mobile     # → Expo DevTools
```

Or run API + Web together:
```bash
pnpm dev
```

---

## Demo accounts (after seed)

| Role | Phone | Password |
|---|---|---|
| Admin | +254700000001 | Admin@1234 |
| Farmer (Nakuru) | +254712345678 | Farmer@1234 |
| Farmer (Kiambu) | +254723456789 | Farmer@1234 |
| Farmer (Uasin Gishu) | +254734567890 | Farmer@1234 |
| Buyer | +254756789012 | Buyer@1234 |

---

## API reference

### Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register (with optional referral code) |
| POST | `/auth/login` | — | Login → access + refresh token |
| POST | `/auth/refresh` | cookie | Rotate refresh token |
| GET | `/auth/me` | ✓ | Current user |
| GET | `/farmer/dashboard` | ✓ | Stats overview |
| GET/PUT | `/farmer/profile` | ✓ | Farmer profile |
| GET | `/farmer/credit` | ✓ | Credit score (24h cache) |
| POST | `/farmer/credit/refresh` | ✓ | Force recompute |
| GET | `/loans` | ✓ | Loan list |
| POST | `/loans/apply` | ✓ | Apply (credit check built-in) |
| POST | `/loans/:id/repay` | ✓ | Record repayment |
| POST | `/loans/:id/approve` | ADMIN | Approve + issue voucher |
| GET | `/insurance` | ✓ | My policies |
| POST | `/insurance` | ✓ | Create parametric policy |
| GET | `/insurance/thresholds` | — | Auto-payout trigger reference |
| GET | `/market/listings` | — | Browse listings |
| POST | `/market/listings` | ✓ | Create listing |
| POST | `/market/orders` | ✓ | Place order |
| POST | `/market/orders/:id/confirm-delivery` | ✓ | Release escrow |
| GET | `/market/prices` | — | Crop prices |
| GET | `/wallet` | ✓ | Balance + transactions |
| POST | `/wallet/withdraw` | ✓ | Send to M-Pesa |
| GET | `/weather/my-farm` | ✓ | Hyperlocal farm forecast |
| GET | `/weather/county/:county` | — | County weather |
| POST | `/predict` | ✓ | AI yield prediction |
| GET | `/groups` | — | Browse farmer groups |
| POST | `/groups/:id/join` | ✓ | Join a SACCO/group |
| POST | `/groups/:id/contribute` | ✓ | Record contribution |
| GET | `/supply` | — | Supply chain directory |
| GET | `/admin/revenue` | ADMIN | P&L dashboard |
| GET | `/admin/users` | ADMIN | User management |
| GET | `/admin/loans` | ADMIN | Loan portfolio |
| POST | `/ussd` | — | Africa's Talking USSD |

---

## Deployment

### API → Railway
```bash
# 1. Push to GitHub
# 2. railway.app → New Project → Deploy from GitHub → select shamba
# 3. Add environment variables (copy from .env)
# 4. Railway auto-detects railway.toml and deploys
# 5. Run migrations via Railway CLI:
railway run cd apps/api && npx prisma migrate deploy
```

### Web → Vercel
```bash
# 1. vercel.com → New Project → Import from GitHub
# 2. Root directory: leave blank (vercel.json handles it)
# 3. Add env var: VITE_API_URL=https://shamba-api.up.railway.app/api/v1
# 4. Deploy
```

### Mobile → EAS
```bash
cd apps/mobile
npm install -g eas-cli
eas login
# Update eas.json with your production API URL
eas build --platform android --profile preview   # APK for testing
eas build --platform android --profile production # Play Store
```

---

## Revenue model (Year 1 targets)

| Stream | Rate | KES 1M farmers × avg |
|---|---|---|
| Loan interest | 12–18% p.a. | KES 6B/year interest |
| Origination fees | 1.5% of principal | KES 1.5B/year |
| Late fees | 5% of instalment | varies |
| Insurance commission | 12% of 4% premium | KES 480M/year |
| Marketplace commission | 7% of sales | KES 2.1B/year |
| **Conservative total** | | **KES 10B+ / year** |

---

## Roadmap

### Q1 (now) — Launch MVP
- [x] Credit scoring engine
- [x] Input loan + voucher disbursement
- [x] Parametric weather insurance
- [x] B2B marketplace with escrow
- [x] USSD for feature phones
- [x] Supply chain directory

### Q2 — Scale
- [ ] M-Pesa Daraja live integration (replace stubs)
- [ ] Paystack live for marketplace payments
- [ ] Africa's Talking live SMS + USSD
- [ ] Push notifications (Expo Notifications)
- [ ] Google Maps farm boundary drawing
- [ ] Bulk input group buying module

### Q3 — Expand
- [ ] Uganda + Tanzania localization (UGX, TZS)
- [ ] Multi-language: Swahili, Luganda
- [ ] SaaS portal for agribusinesses + cooperatives
- [ ] Satellite yield monitoring (integration)
- [ ] Investor matching for premium farms

### Q4 — Data moat
- [ ] AI voice assistant (Swahili, Dholuo)
- [ ] Alternative credit scoring via M-Pesa history
- [ ] Aggregated data products for commodity traders
- [ ] Export-grade traceability (blockchain pilot)

---

## License
MIT — Built with ❤️ for African farmers. Shamba — From seed to sale.
