# MedGuardian Mobile App

Production-ready Expo app for medical report management with dual-role system (Patient/Caregiver).

## Features

### Patient Features
- 📄 Upload medical reports (prescriptions, lab reports, EEG, X-rays)
- 🤖 AI-powered OCR analysis with Gemini
- ❤️ Invite and manage caregivers with granular permissions
- 🔔 Real-time notifications of report analysis
- 📊 View extracted medicines, diagnoses, and risk levels

### Caregiver Features
- 👥 Accept patient invitations
- 📋 View assigned patients and their reports
- 🔔 Get alerts when reports are uploaded/analyzed
- 📍 Location tracking (when enabled)

## Prerequisites

- Node 20+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Backend running on http://localhost:3000

## Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Expo configuration
npx expo prebuild --clean
```

## Environment Setup

Create `.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Development

```bash
# Start Expo dev server
npm start

# Run on specific platform:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

Scan QR code with Expo Go app on your device.

## Folder Structure

```
app/
├── _layout.tsx                 # Root layout
├── (auth)/                     # Auth screens
│   ├── index.tsx              # Login
│   └── register.tsx           # Registration
└── (app)/                      # App screens
    ├── (patient)/             # Patient dashboard
    │   ├── index.tsx          # Home
    │   ├── reports.tsx        # Upload & list reports
    │   ├── caregivers.tsx     # Manage caregivers
    │   └── notifications.tsx  # View notifications
    └── (caregiver)/           # Caregiver dashboard
        ├── index.tsx          # Home & accept invitations
        ├── patients.tsx       # View patients
        └── notifications.tsx  # View alerts

store/
├── authStore.ts               # Auth state management
└── dataStore.ts               # Patient/Report/Caregiver data

services/
└── api.ts                      # All API endpoints
```

## Building for Production

### iOS
```bash
npm run build:ios
# Follow EAS instructions to submit to App Store
npm run submit -- --platform ios
```

### Android
```bash
npm run build:android
# Follow EAS instructions to submit to Play Store
npm run submit -- --platform android
```

### Web
```bash
npm run web
# Builds static files for deployment
```

## Testing

1. **Register** with two accounts (patient + caregiver)
2. **As Patient:**
   - Create patient profile
   - Upload a test report image
   - Invite caregiver via email
3. **As Caregiver:**
   - Accept invitation with code
   - View patient's profile
   - View uploaded reports
4. **Verify** notifications are received

## API Integration

All endpoints connected:
- ✅ Authentication (login, register)
- ✅ Patient management (CRUD)
- ✅ Report upload & retrieval
- ✅ Caregiver invitations
- ✅ Notifications
- ✅ Permissions management

## Technology Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **HTTP:** Axios with auto-retry
- **Storage:** AsyncStorage
- **Styling:** React Native StyleSheet
- **Build:** EAS Build

## Known Limitations

- File upload requires valid Supabase credentials
- Gemini API processing requires valid API key
- Email/push/Telegram notifications need configured providers
- Location tracking requires `expo-location` (Phase 3)

## Next Steps

1. Add real images to assets/
2. Configure Expo credentials (`eas init`)
3. Build for iOS/Android (`eas build --platform all`)
4. Submit to stores (`eas submit --platform all`)
5. Enable push notifications setup

## Support

See main README.md for architecture details.
