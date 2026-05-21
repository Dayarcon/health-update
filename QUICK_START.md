# MedGuardian - Quick Start Guide

## ✅ What's Implemented

### Backend Modules (Complete)

1. **Auth Module** - JWT + Google OAuth
   - User registration & login
   - Refresh token rotation
   - Google OAuth integration
   - Protected endpoints via JwtAuthGuard

2. **Patients Module** - Patient management
   - Create, read, update, delete patients
   - Ownership scoping (users see only their patients)
   - Relations: parent, spouse, sibling, child

3. **Reports Module** - Document upload
   - Upload to Supabase storage
   - Automatic OCR job creation
   - Track processing status
   - Cascade delete medicines/diagnoses

4. **AI/OCR Module** - Gemini 2.0 Flash integration
   - Vision API for document scanning
   - Medical data extraction (medicines, diagnoses, tests)
   - Risk level assessment
   - Retry logic (max 3 attempts)
   - Cron-based job polling every 30 seconds

5. **Notifications Module** - Caregiver alerts (NEW)
   - Caregiver management (add/edit/delete)
   - Multi-channel notifications:
     - Email via Resend (3k/month free)
     - Push notifications via Expo
     - Telegram Bot alerts
   - Alert triggers: report uploaded, completed, failed
   - In-app notification history

6. **Queue Module** - Job processing
   - Database polling every 30 seconds
   - Sequential processing (respects Gemini 15 RPM limit)
   - Automatic retry with backoff

---

## 🚀 Local Development

### Quick Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env.local (see SETUP.md for details)
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Start Postgres (Docker)
docker run -d --name medguardian-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medguardian \
  -p 5432:5432 postgres:15

# 4. Initialize database
npx prisma migrate deploy

# 5. Start server
npm run dev
# Server runs on http://localhost:3000
```

### Test Endpoints

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","name":"Test"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'

# Create patient (use accessToken from login)
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","age":45,"relation":"self"}'

# Add caregiver
curl -X POST http://localhost:3000/notifications/caregivers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","relation":"spouse","email":"jane@test.com"}'
```

---

## 📦 Deployment (Production)

### Prerequisites

Create free accounts for:
- [Render](https://render.com) - Backend hosting
- [Supabase](https://supabase.com) - PostgreSQL database
- [Google Cloud](https://console.cloud.google.com) - Gemini API
- [Resend](https://resend.com) - Email service
- [Expo](https://expo.dev) - Push notifications
- [Telegram BotFather](https://t.me/botfather) - Bot API

### Deploy in 10 Minutes

See **DEPLOYMENT.md** for step-by-step instructions. Summary:

1. **Set up Supabase**
   - Create project
   - Get connection string
   - Create "reports" storage bucket
   - Copy API keys

2. **Get API Keys**
   - Gemini API key (Google Cloud)
   - Resend API key
   - Expo access token
   - Telegram bot token

3. **Deploy to Render**
   - Connect GitHub repo
   - Add environment variables
   - Deploy (auto-builds & deploys)
   - Run migrations via Shell

4. **Test Endpoints**
   - POST `/auth/register`
   - GET `/patients`
   - POST `/reports` (with file)
   - Wait 30s → report should be processed

---

## 📁 Project Structure

```
health-report/
├── backend/                       # NestJS API server
│   ├── src/
│   │   ├── auth/                 # JWT + Google OAuth
│   │   ├── patients/             # Patient CRUD
│   │   ├── reports/              # File upload + storage
│   │   ├── ai/                   # Gemini integration
│   │   ├── notifications/        # Caregiver alerts (NEW)
│   │   ├── queue/                # Job polling
│   │   ├── storage/              # Supabase wrapper
│   │   ├── common/               # Guards, decorators
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   ├── SETUP.md                  # Local dev guide
│   └── .env.local                # Environment config
├── frontend/                      # React Native + Expo
│   └── (coming soon)
├── DEPLOYMENT.md                 # Production setup
├── CLAUDE.md                      # Architecture guide
└── QUICK_START.md               # This file

```

---

## 🔌 Database Schema

### Users
- Email (unique)
- Hashed password
- Google ID (for OAuth)
- Refresh token (hashed)

### Patients
- Name, age, gender, relation
- Owned by User

### Reports
- File URL (Supabase)
- Processing status (pending → processing → completed/failed)
- Risk level (low/medium/high)
- Raw OCR text + AI summary (JSON)

### Medicines (extracted)
- Name, dosage, frequency, duration
- Links to Report

### Diagnoses (extracted)
- Condition, severity
- Links to Report

### Caregivers (NEW)
- Email, Expo token, Telegram ID
- Relation to user
- Owned by User

### Notifications (NEW)
- Title, message, type (report_uploaded/completed/failed)
- Read status
- Report reference
- Metadata (patient name, risk level, etc.)

### Jobs
- Status (pending → processing → completed/failed)
- Type (ocr)
- Retries, max retries
- Error message if failed

---

## 🔐 Security Checklist

- [x] All passwords hashed with bcrypt
- [x] JWT with 24h expiry + 30d refresh
- [x] Ownership scoping on all queries
- [x] File type validation (whitelist MIME types)
- [x] File size limit (20MB max)
- [x] Input validation with Zod/class-validator
- [x] Error handling (no sensitive data in logs)
- [ ] Rate limiting (TODO: add express-rate-limit)
- [ ] HTTPS enforced (Render auto-provides)
- [ ] RLS policies on Supabase (TODO: configure)
- [ ] Audit logging for sensitive operations (TODO)

---

## 🎯 Next Steps

### Immediate (Before First Deploy)
1. [ ] Get all API keys (see DEPLOYMENT.md)
2. [ ] Complete .env.local locally
3. [ ] Test all endpoints locally
4. [ ] Set up Render account & GitHub connection
5. [ ] Deploy backend to Render

### Short Term (Week 1-2)
1. [ ] Build React Native frontend
2. [ ] Implement camera/file picker
3. [ ] Add push notification handling
4. [ ] Test file upload → OCR → notification flow

### Medium Term (Month 1)
1. [ ] Build mobile app UI
2. [ ] Add authentication UI
3. [ ] Submit to App Store & Play Store
4. [ ] Set up monitoring (Sentry)
5. [ ] Add rate limiting

### Long Term (Month 2+)
1. [ ] Analytics & usage metrics
2. [ ] Caregiver sharing (multi-user access)
3. [ ] Prescription refill alerts
4. [ ] Medical history trends
5. [ ] Sync with electronic health records (EHR)

---

## 🆘 Troubleshooting

### "Database connection refused"
```bash
# Check Postgres is running
docker ps | grep medguardian-db

# Or start it
docker run -d --name medguardian-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medguardian \
  -p 5432:5432 postgres:15
```

### "Port 3000 already in use"
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### "Gemini API quota exceeded"
- Free tier: 15 requests/minute, 1,500/day
- Solution: Upgrade to paid plan or wait until quota resets

### "Queue jobs not processing"
- Check `job-queue.service.ts` logs
- Verify Gemini API key is valid
- Ensure Prisma migrations ran successfully

---

## 📚 Documentation

- **SETUP.md** - Local development setup
- **DEPLOYMENT.md** - Production deployment
- **CLAUDE.md** - Architecture & code standards
- **schema.prisma** - Database schema with docs

---

## 🚀 Production Endpoints

Once deployed to Render:

```
https://medguardian-backend.onrender.com/auth/register
https://medguardian-backend.onrender.com/auth/login
https://medguardian-backend.onrender.com/patients
https://medguardian-backend.onrender.com/reports
https://medguardian-backend.onrender.com/notifications/caregivers
```

---

## 📞 Support

- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs
- Supabase Docs: https://supabase.com/docs
- Render Docs: https://render.com/docs

---

**Built with ❤️ for caregivers everywhere.**
