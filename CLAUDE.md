# MedGuardian AI — Claude Development Guide

## Project Context

**What we're building:** A free, open-source medical report analyzer for caregivers. Users upload prescription/EEG/lab reports, AI extracts info, and caregivers get instant alerts.

**Why it matters:** Families managing elderly care or chronic illness need a simple way to track medical documents and share with caregivers instantly.

**Target users:**
- Adult children managing parent's health
- Primary caregivers
- Chronic disease patients sharing with family
- Elderly care facilities

---

## Architecture Philosophy

**Keep it simple:** MVP does ONE thing well — upload → OCR → parse → notify.

**All-free stack:** Supabase + Gemini + Render. No AWS complexity.

**Backend:** NestJS for structure. No fancy patterns, just clean modules.

**Frontend:** Expo for cross-platform mobile. React Navigation, Zustand for state.

**Queue:** Upstash Redis for async OCR/parsing jobs.

---

## Tech Stack (Locked)

### Backend
- **Framework:** NestJS 11.x
- **Runtime:** Node 20 LTS
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Auth:** Supabase JWT
- **File Storage:** Supabase Storage (S3-compatible)
- **OCR + AI:** Gemini 2.0 Flash API
- **Queue:** Upstash Redis
- **Email:** Resend API
- **Chat:** Telegram Bot API (free alternative to WhatsApp)
- **Validation:** Zod
- **Testing:** Jest + SuperTest
- **Docker:** Compose for local Supabase

### Frontend
- **Framework:** React Native 0.76+
- **Builder:** Expo
- **Router:** Expo Router (file-based)
- **State:** Zustand
- **Forms:** React Hook Form
- **HTTP:** Axios
- **Notifications:** Expo Notifications
- **Camera/Upload:** Expo Camera, Image Picker
- **UI:** React Native Paper
- **Dev:** TypeScript, ESLint

### Infrastructure
- **Backend Hosting:** Render (free tier, auto-sleeps)
- **Database:** Supabase (free, 500MB)
- **Storage:** Supabase (1GB included)
- **Queue:** Upstash (10k req/day free)
- **Mobile:** Expo EAS (free build & submit)

---

## Folder Structure Rules

```
backend/src/
├── auth/           # JWT, Supabase login, guards
├── patients/       # Patient CRUD, relations
├── reports/        # Upload endpoint, file ops
├── ai/             # Gemini integration
├── notifications/  # Push, email, Telegram
├── storage/        # Supabase file wrapper
├── queue/          # Upstash Redis jobs
└── common/         # DTOs, decorators, filters
```

**Rule:** One module per domain. No cross-module imports except through services.

---

## Code Standards

### TypeScript
- **Strict mode** always
- **No `any`** — type everything
- **No optional chaining Hell** — use proper error handling
- **Enums** for fixed values (report types, risk levels)

### NestJS Modules
- Controller → Service → Repository pattern
- Guards for auth, interceptors for logging
- Zod validation in pipes
- Custom exceptions for domain errors

### React Native
- **Functional components** only
- **Hooks** for state and side effects
- **Zustand** for global state (auth, notifications)
- **TypeScript** for all components

### Database
- Prisma migrations only (no raw SQL)
- Foreign keys enforced
- Indexes on frequently filtered columns
- Audit timestamps on all tables

---

## API Design

**Responses:**
```json
{
  "success": true,
  "data": { /* ... */ },
  "error": null
}
```

**Errors:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_FILE",
    "message": "File must be JPEG or PDF"
  }
}
```

**Status codes:**
- `200` ✓ OK
- `201` ✓ Created
- `400` ✗ Bad request (validation)
- `401` ✗ Unauthorized
- `403` ✗ Forbidden
- `409` ✗ Conflict
- `500` ✗ Server error

---

## Security Checklist

- [ ] All passwords hashed with bcrypt
- [ ] HTTPS enforced (Render auto-provides)
- [ ] JWT expires in 24h, refresh in 30d
- [ ] Rate limiting: 100 req/min per IP
- [ ] File uploads: max 20MB, whitelist MIME types
- [ ] No medical data in error logs
- [ ] Supabase RLS policies for patient data
- [ ] Input validation on all endpoints
- [ ] CORS limited to frontend origin

---

## Important Constraints

1. **Medical accuracy:** AI output is informational only, not diagnostic. Add disclaimers.
2. **HIPAA considerations:** For real medical data, implement audit logging and encryption.
3. **Rate limiting:** Gemini has 1,500 req/day free, Upstash has 10k. Monitor in production.
4. **Render sleep:** Free tier sleeps after 15min inactivity. First request takes ~30s to wake up.
5. **No file deletion:** Once uploaded, reports are immutable (legal/compliance).

---

## Environment Variables

### Backend (.env.local)
```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Gemini AI
GEMINI_API_KEY=AIzaSyxxx...

# Upstash Redis
UPSTASH_REDIS_URL=https://xxx:yyy@xxx.upstash.io

# Resend Email
RESEND_API_KEY=re_xxx...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABCxyz...

# App
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-min-32-chars
```

### Frontend (.env.local)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## Development Workflow

1. **Pick a feature** from roadmap
2. **Write Prisma schema** if needed
3. **Write controller** + validation
4. **Write service** + business logic
5. **Test** with Jest
6. **Test API** with Postman/REST Client
7. **Commit** with clear message
8. **Push** → auto-deploys to Render

---

## Common Tasks

### Add a new API endpoint
```bash
# 1. Generate NestJS module
nest g module reports
nest g controller reports
nest g service reports

# 2. Add validation DTOs
# 3. Implement controller & service
# 4. Add Prisma schema if needed
# 5. Test & commit
```

### Add a Prisma migration
```bash
# Make a change to schema.prisma
npx prisma migrate dev --name add_risk_level
# Creates migration file + applies it
```

### Deploy to Render
```bash
git push origin main
# Auto-deploys via GitHub integration
# Check build logs in Render dashboard
```

### Test Gemini integration
```bash
# Use test API in ai/gemini.service.ts
npm run test -- ai.service.spec
```

---

## Debugging Tips

- **API errors:** Check Render logs in dashboard
- **Database issues:** Inspect with Supabase web UI
- **Queue jobs stuck:** Clear Upstash cache in dashboard
- **Mobile auth:** Clear Expo cache: `npx expo start --clear`
- **Gemini quota:** Monitor in Google Cloud Console

---

## Performance Considerations

1. **Image compression** before upload (max 2MB after compression)
2. **Batch Gemini calls** in queue jobs (avoid rate limiting)
3. **Cache user patients** in Zustand (not every screen load)
4. **Paginate report lists** (50 items per page max)
5. **Use signed URLs** for file downloads (not direct S3 access)

---

## When to Ask for Help

❌ Don't scope-creep features beyond the roadmap  
❌ Don't skip validation or security  
❌ Don't add commented-out code  
❌ Don't use magic numbers (use constants)  

✅ Do ask if an API design is right  
✅ Do ask if Prisma schema makes sense  
✅ Do ask before major refactors  
✅ Do test on real devices before claiming done  

---

## Useful Commands

```bash
# Backend
npm run dev                  # Start dev server
npm run build               # Production build
npm run test                # Run tests
npx prisma studio          # Open DB UI
npx prisma migrate dev      # Create migration

# Frontend
npx expo start              # Start dev server
npx expo prebuild           # Generate native code
eas build --platform all    # Build for iOS/Android
eas submit --platform all   # Submit to stores
```

---

## First Commit After Setup

```bash
git add .
git commit -m "chore: initialize project structure

- Create NestJS and React Native scaffolds
- Add Prisma schema with initial models
- Set up Docker Compose for local dev
- Add environment examples and documentation
- Configure TypeScript and linters"

git push origin main
```
