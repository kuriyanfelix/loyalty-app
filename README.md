# 🥐 Crumb & Co — Digital Loyalty App

A mobile-first digital loyalty card system for small bakeries and cafes. Replaces paper stamp cards with a clean, phone-number-based web app.

---

## ✨ Features

- **Customer flow** — Phone login via OTP → see stamp count → view rewards
- **Staff/Admin flow** — Search customer by phone → add stamps → redeem rewards
- **No app install required** — works from any browser via QR code scan
- **Mock OTP** — dev mode logs OTP to console; swap in Twilio for production

---

## 🗂 Project Structure

```
loyalty-app/
├── prisma/
│   ├── schema.prisma          # DB models
│   ├── seed.ts                # Test data seeder
│   └── migrations/            # SQL migrations
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Root redirect
│   │   ├── login/page.tsx     # Phone + OTP login
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Server component (auth + data fetch)
│   │   │   └── DashboardClient.tsx  # Customer stamp card UI
│   │   ├── admin/page.tsx     # Staff portal
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── send-otp/  # POST — create & log OTP
│   │       │   ├── verify-otp/ # POST — verify + set cookie
│   │       │   └── logout/    # POST — clear cookie
│   │       ├── user/me/       # GET — current customer data
│   │       ├── stamps/add/    # POST — add stamp (admin)
│   │       ├── redeem/        # POST — redeem reward (admin)
│   │       ├── admin/customer/ # GET — search customer (admin)
│   │       └── health/        # GET — Railway health check
│   ├── components/
│   │   └── StampCard.tsx      # Animated stamp card component
│   └── lib/
│       ├── prisma.ts          # Prisma client singleton
│       └── auth.ts            # JWT helpers, OTP generator, admin auth
├── .env.example
├── railway.toml
└── tailwind.config.js
```

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL (local or via Docker)

### 1. Clone & install

```bash
git clone <your-repo>
cd loyalty-app
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/loyalty_app"
JWT_SECRET="any-long-random-string"
ADMIN_KEY="your-staff-password"
STAMPS_PER_REWARD="10"
```

### 3. Set up the database

```bash
# Create the database (if using local Postgres)
createdb loyalty_app

# Run migrations
npx prisma migrate dev

# (Optional) Seed test data
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Visit:
- **Customer login**: http://localhost:3000/login
- **Admin portal**: http://localhost:3000/admin (key: `admin-dev-key`)

### 5. OTP in development

OTPs are printed to the **terminal** (not sent via SMS). Look for:

```
🔐 OTP for +15551234567: 482910
```

The OTP also appears in the UI as a yellow dev banner for convenience.

---

## 🚂 Deploying to Railway

### Option A: Deploy via Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option B: Deploy via GitHub (recommended)

1. Push your code to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo

### Add PostgreSQL on Railway

1. In your Railway project → **New** → **Database** → **PostgreSQL**
2. Click the Postgres service → **Variables** tab → copy `DATABASE_URL`
3. Go to your app service → **Variables** → add:

```
DATABASE_URL=<paste from Postgres service>
JWT_SECRET=<generate a long random string>
ADMIN_KEY=<choose a staff password>
STAMPS_PER_REWARD=10
```

### Run migrations on Railway

Option 1 — Railway runs this automatically via `railway.toml`:
```toml
startCommand = "npx prisma migrate deploy && npm start"
```

Option 2 — Run manually via Railway shell:
```bash
railway run npx prisma migrate deploy
```

### Generate a QR code for your storefront

Once deployed, your customer URL is something like:
`https://loyalty-app-production.up.railway.app/login`

Use any QR generator (e.g., [qr-code-generator.com](https://www.qr-code-generator.com/)) to create a printable QR code pointing to your login URL.

---

## 🔌 API Reference

All admin routes require the `x-admin-key` header.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/send-otp` | — | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | — | Verify OTP, set session cookie |
| POST | `/api/auth/logout` | — | Clear session |
| GET | `/api/user/me` | Session cookie | Get current customer data |
| GET | `/api/admin/customer?phone=` | Admin key | Look up customer |
| POST | `/api/stamps/add` | Admin key | Add 1 stamp to customer |
| POST | `/api/redeem` | Admin key | Redeem 1 reward (deducts 10 stamps) |
| GET | `/api/health` | — | Health check for Railway |

---

## 🔧 Adding Real SMS (Twilio)

Replace the mock in `src/lib/auth.ts` with:

```bash
npm install twilio
```

```ts
// src/lib/auth.ts
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function sendOtp(phone: string, code: string) {
  await client.messages.create({
    body: `Your Crumb & Co code: ${code}`,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });
}
```

Then call `sendOtp(phone, code)` in the `send-otp` API route instead of `console.log`.

Add to Railway env vars:
```
TWILIO_SID=...
TWILIO_TOKEN=...
TWILIO_PHONE=+1...
```

---

## 🗺 Future Enhancements

- [ ] Customer name collection on first visit
- [ ] Multiple reward tiers (e.g., 10 = free coffee, 20 = free cake)
- [ ] Push notifications via Web Push API
- [ ] Admin dashboard with daily/weekly stats
- [ ] Multi-location / multi-business support
- [ ] Referral rewards

---

## 📄 License

MIT
