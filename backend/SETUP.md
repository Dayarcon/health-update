# Backend Setup

## Install Dependencies
```bash
npm install
```

## Configure Environment
Create `.env.local`:
```bash
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Auth (32+ chars)
JWT_SECRET=your-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters

# File Storage (Supabase)
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=key
SUPABASE_SERVICE_ROLE_KEY=key

# AI Processing (Gemini)
GEMINI_API_KEY=key

# Email Notifications (Resend)
RESEND_API_KEY=re_key

# Push Notifications (Expo)
EXPO_ACCESS_TOKEN=token

# Telegram Notifications
TELEGRAM_BOT_TOKEN=token

# App
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

## Database Setup
```bash
# Apply schema
npx prisma db push

# View database
npx prisma studio
```

## Development
```bash
npm run dev        # Watch mode
npm run build      # Production build
npm start          # Run compiled app
npm run lint       # Lint code
```

See CLAUDE.md for architecture details.
