# MedGuardian Deployment Guide

## Overview

This guide covers deploying MedGuardian to production using:
- **Backend Hosting:** Render
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase (S3-compatible)
- **AI:** Gemini 2.0 Flash API
- **Notifications:** Expo, Resend, Telegram

---

## Prerequisites

You'll need accounts for:
- [Render](https://render.com) (free tier available)
- [Supabase](https://supabase.com) (free tier: 500MB database)
- [Google Cloud](https://console.cloud.google.com) (for Gemini API)
- [Resend](https://resend.com) (email, 3k/month free)
- [Expo](https://expo.dev) (push notifications)
- [Telegram BotFather](https://t.me/botfather) (free)

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → Sign up
2. Click "New Project"
3. **Name:** medguardian
4. **Region:** Choose closest to your users
5. **Password:** Save it securely (you'll need it)
6. Wait for project to initialize (2-3 min)

### 1.2 Get Connection String
1. In Supabase dashboard, click "Connect"
2. Copy the **PostgreSQL Connection String** (URI option)
3. Replace `[YOUR-PASSWORD]` with the password you set
4. Save this as `DATABASE_URL`

Example format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 1.3 Create Storage Bucket
1. In Supabase dashboard, go to **Storage**
2. Click "New Bucket"
3. **Name:** `reports`
4. **Public:** OFF (keep private)
5. Click "Create Bucket"

### 1.4 Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key - keep secret!)

### 1.5 Run Database Migrations
Once you have DATABASE_URL, run:
```bash
cd backend
npm install
npx prisma migrate deploy
```

This creates all tables defined in `schema.prisma`.

---

## Step 2: Set Up External APIs

### 2.1 Gemini API (Google)
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create API key in Google Cloud Console
4. Copy the key → `GEMINI_API_KEY`
5. **Note:** Free tier has 15 requests per minute

### 2.2 Resend Email API
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Go to **API Keys**
4. Copy the API key → `RESEND_API_KEY`
5. **Note:** Free tier: 3,000 emails/month

### 2.3 Expo Push Notifications
1. Go to [expo.dev](https://expo.dev)
2. Create account
3. Create a new project for MedGuardian
4. Go to **Settings** → **Access Tokens**
5. Create a token → `EXPO_ACCESS_TOKEN`

### 2.4 Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy the API token → `TELEGRAM_BOT_TOKEN`
5. Message your bot to activate it

---

## Step 3: Deploy Backend to Render

### 3.1 Prepare Repository
Ensure all code is committed and pushed to GitHub:
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### 3.2 Create Render Service
1. Go to [render.com](https://render.com)
2. Sign up → Connect GitHub account
3. Click "New +" → "Web Service"
4. Select your GitHub repo (health-report)
5. Configure:
   - **Name:** medguardian-backend
   - **Environment:** Node
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for production)

### 3.3 Add Environment Variables
In Render dashboard, go to **Environment** and add:

```
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-prod-secret-key-min-32-chars-CHANGE-THIS
JWT_REFRESH_SECRET=your-prod-refresh-secret-CHANGE-THIS
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=30d
GOOGLE_CLIENT_ID=your-google-oauth-client-id
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
GEMINI_API_KEY=AIzaSyxxx...
EXPO_ACCESS_TOKEN=your-expo-token
RESEND_API_KEY=re_xxxxx
TELEGRAM_BOT_TOKEN=123456:ABCDxyz
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important:** Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random values (min 32 chars each).

### 3.4 Deploy
1. Click "Create Web Service"
2. Render will automatically deploy from GitHub
3. Monitor logs in **Logs** tab
4. Once deployed, you'll get a URL like: `https://medguardian-backend.onrender.com`

### 3.5 Run Migrations (First Time Only)
After first deployment, go to Render **Shell** and run:
```bash
npm run prisma:migrate:deploy
```

---

## Step 4: Test Backend Endpoints

### 4.1 Health Check
```bash
curl https://medguardian-backend.onrender.com/auth/me
# Should return 401 Unauthorized (expected, no token)
```

### 4.2 Register User
```bash
curl -X POST https://medguardian-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Response should include:
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "email": "test@example.com",
    "accessToken": "eyJxxx...",
    "refreshToken": "eyJxxx..."
  }
}
```

### 4.3 Create Patient
```bash
curl -X POST https://medguardian-backend.onrender.com/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 45,
    "gender": "male",
    "relation": "self"
  }'
```

### 4.4 Add Caregiver
```bash
curl -X POST https://medguardian-backend.onrender.com/notifications/caregivers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "relation": "spouse",
    "email": "jane@example.com"
  }'
```

---

## Step 5: Frontend Setup

### 5.1 Environment Variables
Create `frontend/.env.local`:
```
EXPO_PUBLIC_API_URL=https://medguardian-backend.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 5.2 Run Locally
```bash
cd frontend
npm install
npx expo start
```

### 5.3 Build & Submit (iOS/Android)
```bash
# Preview on iOS simulator
npx expo run:ios

# Build for production
eas build --platform all

# Submit to App Store & Play Store
eas submit --platform all
```

---

## Monitoring & Maintenance

### Health Checks
1. **Render Dashboard** → Monitor CPU, memory, logs
2. **Supabase Dashboard** → Check database connections, storage usage
3. **Google Cloud Console** → Monitor Gemini API quota
4. **Resend Dashboard** → Monitor email delivery

### Logs
```bash
# View Render logs
# In Render dashboard → Logs tab

# View database logs (Supabase)
# Supabase dashboard → Database → Logs

# View errors from production
# Check Sentry integration (optional) or Render error notifications
```

### Scaling
- **Free tier limits:**
  - Render: 0.5GB RAM, auto-sleeps after 15min inactivity
  - Supabase: 500MB database, 1GB storage
  - Resend: 3,000 emails/month
  - Gemini: 1,500 requests/day

- **Upgrade when needed:**
  - Render Starter: $7/month (always on, 1GB RAM)
  - Supabase Pro: $25/month (8GB database, 100GB storage)

---

## Troubleshooting

### "Database connection failed"
1. Check `DATABASE_URL` in Render environment
2. Verify Supabase project is active
3. Run `npx prisma db push --skip-generate` locally to verify schema

### "Invalid API key"
1. Double-check copied keys (no extra spaces)
2. Verify keys match the correct service (don't mix prod/dev keys)
3. Regenerate if unsure

### "Queue jobs not processing"
1. Check `@Cron(EVERY_30_SECONDS)` in `job-queue.service.ts`
2. Verify Gemini API key is valid
3. Check Render logs for errors: `this.logger.error(...)`

### "Push notifications not sent"
1. Verify `EXPO_ACCESS_TOKEN` is correct
2. Check caregiver has valid `expoToken` in database
3. Test with: `curl -X GET https://medguardian-backend.onrender.com/notifications/caregivers`

### "Render keeps sleeping"
- Free tier sleeps after 15 min inactivity
- Solution: Upgrade to Starter plan ($7/month) or set up a cron job to ping the API

---

## Next Steps

1. **Set up CI/CD:** Configure GitHub Actions for automated testing
2. **Add Monitoring:** Integrate Sentry or LogRocket for error tracking
3. **Security Hardening:**
   - Enable HTTPS (Render auto-provides)
   - Set up rate limiting (currently 100 req/min)
   - Implement audit logging for sensitive operations
4. **Analytics:** Track user signups, report uploads, errors
5. **Mobile App:** Build and submit React Native app to App Store & Play Store

---

## Production Checklist

- [ ] DATABASE_URL configured in Render
- [ ] JWT_SECRET and JWT_REFRESH_SECRET changed (not defaults)
- [ ] All API keys added to Render environment
- [ ] Supabase backup configured
- [ ] CORS_ORIGIN set to frontend domain (not `*`)
- [ ] Rate limiting enabled
- [ ] Monitoring/alerting set up
- [ ] Error tracking (Sentry) configured (optional)
- [ ] Database backups automated
- [ ] Logs retention configured
- [ ] SSL/TLS enforced (Render default)

---

## Support

For issues:
1. Check Render logs: **Logs** tab in dashboard
2. Check Supabase status: [status.supabase.com](https://status.supabase.com)
3. Check Google Cloud status: [status.cloud.google.com](https://status.cloud.google.com)
4. Read NestJS docs: [docs.nestjs.com](https://docs.nestjs.com)
5. Open GitHub issue: [github.com/your-org/health-report/issues](https://github.com)
