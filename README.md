# MedGuardian AI — Medical Report Reader & Caregiver Alert System

A mobile-first healthcare assistant that lets users upload medical reports, extracts information using AI, and alerts caregivers instantly.

## 🎯 MVP Features

### User Features
- **Email/Google authentication** via Supabase
- **Upload medical reports** (prescriptions, EEG, lab reports, medical bills)
- **Automatic OCR + AI extraction** using Gemini 2.0 Flash
- **AI-generated summaries** in simple language
- **Medical timeline** — view all past reports chronologically
- **Push notifications** — get instant alerts when caregivers view reports

### Caregiver Features
- **Instant notifications** via push, email, Telegram, or WhatsApp
- **View patient medical history**
- **Track medications and diagnoses**

---

## 💰 All-Free Tech Stack

| Component | Service | Free Tier | Notes |
|-----------|---------|-----------|-------|
| **Database** | Supabase PostgreSQL | 500MB, always-on | Includes auth |
| **File Storage** | Supabase Storage | 1GB | Part of Supabase |
| **OCR + AI** | Gemini 2.0 Flash | 1,500 req/day, 15 RPM | Handles vision + parsing |
| **Backend** | Render | Free web service | Auto-sleeps after 15min |
| **Job Queue** | Upstash Redis | 10,000 req/day | For async processing |
| **Mobile App** | Expo | Free | React Native |
| **Push Notifications** | Expo Push | Free | Built-in to Expo |
| **Email** | Resend | 3,000/month | Free tier |
| **SMS/Chat** | Telegram Bot | Free forever | Caregiver alerts |

**Total Cost: $0/month** (until you outgrow free tiers)

---

## 📁 Project Structure

```
.
├── backend/                          # NestJS backend
│   ├── src/
│   │   ├── auth/                     # JWT auth, Supabase integration
│   │   ├── patients/                 # Patient management
│   │   ├── reports/                  # Report upload, storage
│   │   ├── ai/                       # Gemini 2.0 Flash integration
│   │   ├── notifications/            # Push, email, Telegram
│   │   ├── storage/                  # Supabase file operations
│   │   ├── queue/                    # Upstash Redis jobs
│   │   └── common/                   # DTOs, guards, interceptors
│   ├── prisma/                       # Prisma schema & migrations
│   └── test/                         # Unit & integration tests
│
├── frontend/                         # React Native Expo app
│   ├── app/                          # Expo Router setup
│   ├── components/                   # Reusable components
│   ├── screens/                      # App screens
│   ├── services/                     # API, notifications, storage
│   ├── hooks/                        # Custom hooks
│   ├── store/                        # Zustand state
│   └── utils/                        # Helpers
│
├── docs/                             # API docs, guides
├── docker-compose.yml                # Local dev (Supabase)
├── .env.example                      # Environment template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Supabase account (free)
- Gemini API key (free)
- Render account (free)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

```bash
# Backend
cp ../.env.example backend/.env.local

# Frontend
cp ../.env.example frontend/.env.local
```

Fill in:
```
SUPABASE_URL=your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
UPSTASH_REDIS_URL=your-upstash-url
RESEND_API_KEY=your-resend-key
TELEGRAM_BOT_TOKEN=your-telegram-bot
```

### 3. Local Database

```bash
# Start Supabase locally (optional, for development)
docker-compose up -d

# Run migrations
cd backend
npm run prisma:migrate
```

### 4. Run Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

### 5. Run Mobile App

```bash
cd frontend
npx expo start
# Scan QR code with Expo Go or press 'i' for iOS simulator
```

---

## 📊 Data Flow

```
User uploads report (image/PDF)
    ↓
Backend stores in Supabase Storage
    ↓
Queue job → Gemini Vision API (OCR)
    ↓
Gemini LLM (parse diagnosis, meds, risk level)
    ↓
Save to PostgreSQL
    ↓
Send push notification to caregivers
```

---

## 🔐 Security

- ✅ HTTPS only (enforced on production)
- ✅ JWT authentication (Supabase)
- ✅ Private file storage (Supabase)
- ✅ No PII in logs
- ✅ Medical data encrypted at rest (Supabase default)
- ✅ Rate limiting on API endpoints
- ✅ Input validation with Zod

---

## 📅 Development Roadmap

### Week 1: Core Infrastructure
- [ ] NestJS backend scaffold
- [ ] Prisma schema & migrations
- [ ] Supabase setup & auth
- [ ] API structure & validation

### Week 2: Upload & OCR
- [ ] File upload endpoint (multipart)
- [ ] Gemini Vision API integration
- [ ] Upstash Redis queue setup
- [ ] OCR text storage

### Week 3: AI Parsing & Notifications
- [ ] Gemini LLM medical parsing
- [ ] Expo push notifications setup
- [ ] Email & Telegram alerts
- [ ] React Native UI scaffolding

### Week 4: Mobile App
- [ ] Auth screens (login/register)
- [ ] Upload flow UI
- [ ] Report detail screen
- [ ] Medical timeline
- [ ] Polish & testing

---

## 🧪 Testing

```bash
# Run tests
cd backend
npm run test

# Coverage
npm run test:cov

# E2E
npm run test:e2e
```

---

## 🌐 Deployment

### Backend → Render
```bash
# Push to GitHub
git push origin main

# Connect Render to GitHub repo
# Auto-deploys on push
# Env vars in Render dashboard
```

### Frontend → Expo EAS
```bash
npm install -g eas-cli
eas build --platform all
eas submit --platform all
```

---

## 📚 API Documentation

See `docs/API.md` for full endpoint reference.

**Key Endpoints:**
- `POST /auth/register` — Create account
- `POST /auth/login` — Sign in
- `POST /reports/upload` — Upload medical document
- `GET /patients/:id/reports` — Get medical history
- `GET /notifications` — Fetch alerts

---

## 💡 Future Enhancements

- Drug interaction checker
- Multi-language support
- Voice explanations
- Wearable integration
- Advanced symptom tracking
- Emergency SOS button
- Elderly care mode

---

## 📞 Support

For questions or issues, open a GitHub issue or contact the team.

---

## 📄 License

MIT
