# MedGuardian API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints (To Be Implemented)

### Authentication

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "token": "jwt-token"
  }
}
```

---

#### POST /auth/login
Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "token": "jwt-token"
  }
}
```

---

#### POST /auth/google
Sign in with Google OAuth.

**Request:**
```json
{
  "googleToken": "google-oauth-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "token": "jwt-token"
  }
}
```

---

### Patients

#### POST /patients
Create a new patient record.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "Kulsum Naaz",
  "age": 45,
  "gender": "female",
  "relation": "self"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient-id",
    "name": "Kulsum Naaz",
    "age": 45,
    "gender": "female",
    "relation": "self"
  }
}
```

---

#### GET /patients
Get all patients for authenticated user.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "patient-id",
      "name": "Kulsum Naaz",
      "age": 45,
      "gender": "female"
    }
  ]
}
```

---

#### GET /patients/:id
Get single patient details.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient-id",
    "name": "Kulsum Naaz",
    "age": 45,
    "gender": "female",
    "relation": "self",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Reports

#### POST /reports/upload
Upload a medical report (image or PDF).

**Auth Required:** Yes

**Request (multipart/form-data):**
- `patientId` (string) - Patient ID
- `reportType` (string) - "prescription" | "eeg" | "lab" | "bill" | "discharge"
- `file` (file) - Image (JPEG/PNG) or PDF (max 20MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-id",
    "patientId": "patient-id",
    "reportType": "eeg",
    "imageUrl": "https://supabase.url/...",
    "processingStatus": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### GET /reports/:id
Get report details with AI analysis.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-id",
    "patientId": "patient-id",
    "reportType": "eeg",
    "imageUrl": "https://supabase.url/...",
    "rawOcrText": "EEG normal. No epileptiform discharge...",
    "aiSummary": {
      "patient_name": "Kulsum Naaz",
      "diagnosis": ["Anxiety NOS", "Dissociative Neurological Symptom Disorder"],
      "tests": {
        "EEG": "Normal"
      },
      "medicines": [
        {
          "name": "Escitalopram",
          "dose": "5mg",
          "frequency": "Night"
        }
      ],
      "risk_level": "Low"
    },
    "riskLevel": "low",
    "processingStatus": "completed",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### GET /patients/:id/reports
Get all reports for a patient.

**Auth Required:** Yes

**Query Params:**
- `limit` (number) - Max 50, default 10
- `offset` (number) - For pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-id",
        "reportType": "eeg",
        "riskLevel": "low",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

---

### Notifications

#### GET /notifications
Get all notifications for authenticated user.

**Auth Required:** Yes

**Query Params:**
- `isRead` (boolean) - Filter by read/unread

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "title": "New EEG report",
      "message": "Kulsum Naaz uploaded a new EEG report",
      "type": "push",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /notifications/:id/read
Mark notification as read.

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notification-id",
    "isRead": true
  }
}
```

---

## Error Responses

### Bad Request (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": "must be a valid email"
    }
  }
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limits

- **Global:** 100 requests/minute per IP
- **Auth:** 5 login attempts per 15 minutes
- **Upload:** 10 uploads per hour per user
- **Gemini API:** 1,500 requests/day (free tier)

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get patients (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer TOKEN"
```

---

## Changelog

### v0.1.0 (Initial)
- Authentication endpoints
- Patient management
- Report upload and analysis
- Notifications API
