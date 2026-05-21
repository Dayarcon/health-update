# Docker Deployment Guide

## Why Docker?

Docker eliminates the npm/nest CLI issues by containerizing the entire build environment. Your app runs the same way locally and in production.

---

## Deploy to Render with Docker

### Option A: Quick Setup (Recommended)

1. **Go to Render dashboard:** https://render.com/dashboard
2. **Click "New +" → "Web Service"**
3. **Select your GitHub repo** (`Dayarcon/health-update`)
4. **Configure:**
   - **Name:** `medguardian-backend`
   - **Region:** Choose closest to you (Oregon by default)
   - **Environment:** Select **Docker**
   - **Dockerfile Path:** `./Dockerfile` (root level)
   - **Build Command:** (Leave empty)
   - **Start Command:** (Leave empty)
   - **Plan:** Free
5. **Click "Create Web Service"**
6. Render auto-detects the Dockerfile and builds Docker image ✅

### Option B: Infrastructure as Code

If Render doesn't auto-detect, you can use the `render.yaml` file:

1. **Go to Render dashboard**
2. **Click "New +" → "Import from Git"**
3. **Select your repo**
4. **Render reads `render.yaml` and auto-configures everything**
5. **Click "Create"** ✅

---

## Add Environment Variables

In Render dashboard, go to **medguardian-backend** service → **Environment** and add:

```
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-prod-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-prod-refresh-secret-key-min-32-chars
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
GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## How It Works

### Build Process
```
1. Render clones your GitHub repo
2. Detects Dockerfile in backend/ directory
3. Runs: docker build -f backend/Dockerfile -t medguardian-backend .
4. Builder stage:
   - Uses Node 20 Alpine
   - npm install --legacy-peer-deps
   - npm run build (compiles NestJS)
5. Runtime stage:
   - Fresh Node 20 Alpine image (smaller)
   - Copy dist/ from builder
   - npm ci --only=production (production deps only)
   - Runs: node dist/main
```

### Health Check
- Every 30 seconds, Render pings `GET /auth/me`
- Expects 401 Unauthorized (correct behavior, no token provided)
- If it gets 401, service is healthy ✅

### Container Size
- Builder stage: ~800MB (compilation, building)
- Runtime stage: ~300MB (slim, production only) ✅

---

## Test After Deployment

```bash
# Check if service is running
curl https://medguardian-backend.onrender.com/auth/me
# Should return 401 Unauthorized (expected, no token)

# Register a user
curl -X POST https://medguardian-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
# Should return 201 Created with tokens

# Create a patient
curl -X POST https://medguardian-backend.onrender.com/patients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 45,
    "relation": "self"
  }'
# Should return 201 Created

# Send location update
curl -X POST https://medguardian-backend.onrender.com/location \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 5,
    "battery": 85
  }'
# Should return 201 Created
```

---

## Docker Logs

In Render dashboard:
1. Click **medguardian-backend**
2. Go to **Logs** tab
3. View build logs and runtime logs

Common issues:
- `Build failed`: Check Dockerfile path and GitHub permissions
- `Port already in use`: Render assigns PORT automatically, ensure code uses `process.env.PORT`
- `Database connection failed`: Check DATABASE_URL is correct

---

## Run Locally with Docker

Test the Docker build locally (if you have Docker installed):

```bash
cd health-report

# Build image
docker build -f backend/Dockerfile -t medguardian-backend:latest backend/

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=test \
  -e SUPABASE_URL=https://... \
  medguardian-backend:latest
```

---

## Troubleshooting

### Build Fails: "node_modules not found"
- Docker layer caching might be stale
- In Render dashboard: **Settings** → **Clear build cache** → **Trigger Deploy**

### "Dockerfile not found"
- Ensure `backend/Dockerfile` exists
- Check Dockerfile path in Render settings (should be `backend/Dockerfile`)

### Service keeps restarting
- Check logs for runtime errors
- Verify all required environment variables are set
- Ensure PORT is read from `process.env.PORT`

### Slow startup
- First deployment builds image (takes 2-5 min)
- Subsequent deploys use cached layers (faster)
- Free tier Render instances can be slow on startup

---

## Performance

- **Image size:** ~300MB (lean, production only)
- **Startup time:** 10-30 seconds (including cold-start on Render free tier)
- **Memory:** ~150MB at rest, 300MB under load (within free tier limit)

Upgrade to Render Starter ($7/month) for:
- Always-on (no cold-start)
- 1GB RAM
- Background workers

---

## Next Steps

1. ✅ Push Docker files to GitHub (already done)
2. **Deploy on Render** (follow Option A or B above)
3. **Add environment variables** in Render dashboard
4. **Test endpoints** using curl commands above
5. **Monitor logs** in Render dashboard

You're ready to deploy! 🚀
