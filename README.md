<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Intelligent Health Platform

AI-powered healthcare platform with blockchain-secured medical records, real-time collaboration, and FHIR interoperability.

## Features

### Core
- 🏥 **Case Management** - Create, assign, and track patient cases
- 🤖 **AI-Powered Diagnosis** - Gemini 2.5 integration for diagnostic support
- 📅 **Appointments** - Booking, scheduling, available slots
- 🔔 **Notifications** - Real-time alerts and preferences

### Role-Based Dashboards
- **Doctor/Specialist** - Case review, AI insights, patient management
- **Nurse** - Triage, vitals, medication tracking
- **Patient** - Health history, appointments, lab results
- **Physiotherapist** - Rehab sessions, exercise library, progress
- **Trainee** - Case shadowing, learning modules, AI feedback
- **Compliance** - Audit logs, GDPR exports, consent management
- **AI Engineer** - Agent metrics, model status, configuration

### Advanced Features
- 🔗 **Concordium Blockchain** - Wallet auth, access grants, ZKP verification
- 👨‍👩‍👧 **Family Groups** - Manage dependents, share records
- 📹 **Telemedicine** - Video/audio consultations
- ⚡ **WebSocket** - Real-time updates and collaboration
- 🎁 **Universal Referrals** - Invite system with automatic credit rewards
- ⌚ **IoT & Wearables** - Integration with Fitbit, Apple Health, Google Health
- 🏥 **FHIR R4** - Healthcare interoperability layer

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS, Custom Design System |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL (Cloud SQL) |
| AI | Google Gemini 2.5 Pro/Flash |
| Blockchain | Concordium (Rust Smart Contracts) |
| Hosting | Google Cloud Run |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL

### Local Development

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Run frontend
npm run dev

# Run backend (separate terminal)
cd server && uvicorn main:app --reload
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/concordium/connect` - Wallet authentication

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/{id}` - Get case details

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/available-slots/{doctor_id}` - Get slots

### FHIR R4
- `GET /api/fhir/metadata` - CapabilityStatement
- `GET /api/fhir/Patient` - Search patients
- `GET /api/fhir/Appointment` - Search appointments

See full API docs at `/docs` (Swagger UI) when running the server.

## Security

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for detailed security checklist.

Key security features:
- JWT authentication with RBAC
- bcrypt password hashing
- HIPAA/GDPR compliance features
- Concordium blockchain access control
- Audit logging

## Deployment

### Cloud Run

```bash
gcloud run deploy intelligent-health \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

### Custom Domain

See `.agent/workflows/setup_custom_domain.md` for domain mapping.

## License

MIT

## Contributing

See CONTRIBUTING.md for guidelines.
