# Backend Setup Guide

Quick start for local development.

## Prerequisites

- Node 20+ (or use `nvm use`)
- PostgreSQL 15+ (or Docker)
- npm or pnpm

## 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

## 2. Configure Environment

Copy `.env.local` and fill in values:

```bash
# For local development with Docker Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medguardian

# Generate random secrets (32+ chars)
JWT_SECRET=your-local-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-local-refresh-secret-key-at-least-32-chars

# Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id

# Get from Supabase (or skip for local-only testing)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Get from Google AI Studio
GEMINI_API_KEY=AIzaSyxxx...

# Get from Expo
EXPO_ACCESS_TOKEN=your-token

# Get from Resend
RESEND_API_KEY=re_xxxxx

# Get from Telegram BotFather
TELEGRAM_BOT_TOKEN=123456:ABCDxyz

# Local
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

## 3. Database Setup

### Option A: Docker (Recommended)

```bash
# Start Postgres in Docker
docker run -d \
  --name medguardian-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medguardian \
  -p 5432:5432 \
  postgres:15

# Create database
createdb -h localhost -U postgres medguardian

# Run migrations
npx prisma migrate deploy

# Or create from schema
npx prisma db push
```

### Option B: Local Postgres

```bash
# Create database
createdb medguardian

# Run migrations
npx prisma migrate deploy

# Or create from schema
npx prisma db push
```

## 4. Start Development Server

```bash
npm run dev
# Server runs on http://localhost:3000
```

## 5. Verify Setup

```bash
# Health check (should return 401)
curl http://localhost:3000/auth/me

# Create account
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test"
  }'
```

## 6. Database Admin

```bash
# Open Prisma Studio (interactive DB viewer)
npx prisma studio
# Opens on http://localhost:5555
```

## Common Tasks

### Create Migration

```bash
# Make changes to schema.prisma, then:
npx prisma migrate dev --name add_feature_name
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Lint Code

```bash
npm run lint
```

### Run Tests

```bash
npm test
npm run test:watch
```

### Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Port 3000 already in use

```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database connection refused

Check:
1. PostgreSQL is running: `psql -U postgres -d medguardian`
2. DATABASE_URL is correct in .env.local
3. Port 5432 is open (or correct port in DATABASE_URL)

### Prisma Client out of sync

```bash
npx prisma generate
npx prisma db push
```

### TypeScript errors

```bash
# Ensure all dependencies are installed
npm install

# Generate Prisma types
npx prisma generate

# Check types
npx tsc --noEmit
```

## File Structure

```
backend/
├── src/
│   ├── auth/              # JWT + Google OAuth
│   ├── patients/          # Patient CRUD
│   ├── reports/           # File upload + storage
│   ├── ai/                # Gemini OCR integration
│   ├── notifications/     # Caregivers + alerts
│   ├── queue/             # Job polling (cron)
│   ├── storage/           # Supabase file wrapper
│   ├── common/            # Guards, decorators, filters
│   └── main.ts            # Entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration history
├── test/                  # Jest tests
├── dist/                  # Compiled output (after build)
└── package.json
```

## Next Steps

- [ ] Complete .env.local with all API keys
- [ ] Run `npm run dev` to start server
- [ ] Test endpoints with curl or Postman
- [ ] Read DEPLOYMENT.md for production setup
- [ ] See CLAUDE.md for architecture overview
