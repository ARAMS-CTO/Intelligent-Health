# Changelog

All notable changes to the Intelligent Health Platform are documented in this file.

## [2.2.0] - 2026-01-24

### Added

#### Patient Features
- **Video Consultation** (`components/VideoConsultation.tsx`)
  - Telemedicine interface with video controls
  - In-call notes panel
  - PIP view and minimization support
  - Quick actions panel for patient dashboard

- **Vitals Tracker** (`components/VitalsTracker.tsx`)
  - Track blood pressure, heart rate, oxygen, temperature
  - Weight and blood glucose monitoring
  - Normal range indicators and warnings
  - 7-day trend visualization

- **Prescription Manager** (`components/PrescriptionManager.tsx`)
  - View active medications
  - Track refill counts and dates
  - Request refills from pharmacy
  - Detailed medication instructions

- **Emergency Access Card** (`components/EmergencyAccessCard.tsx`)
  - QR code for emergency responders
  - Critical health info display
  - Emergency contact quick dial
  - Medical ID wallet card

- **Insurance Card** (`components/InsuranceCard.tsx`)
  - Digital insurance card with full details
  - Deductible and out-of-pocket tracking
  - Claims history and status
  - Benefits summary

- **Family Health Hub** (`components/FamilyHealthHub.tsx`)
  - Manage family members' health
  - View appointments and refills across family
  - Checkup reminders
  - Quick actions for scheduling

- **AI Health Insights** (`components/AIHealthInsights.tsx`)
  - Personalized health score (0-100)
  - Category scores (nutrition, exercise, sleep, mental, preventive)
  - AI-generated recommendations
  - Actionable health insights

- **Care Plan Manager** (`components/CarePlanManager.tsx`)
  - Goals with progress tracking
  - Tasks with completion status
  - Care team display
  - Overall progress calculation

- **Health Timeline** (`components/HealthTimeline.tsx`)
  - Medical history events grouped by month
  - Filterable by event type
  - Attachments and provider info
  - Export options

- **Case Notes Manager** (`components/CaseNotesManager.tsx`)
  - SOAP note templates
  - AI-assisted note drafting
  - Note signing workflow
  - Multiple note types (progress, consult, procedure, discharge)

- **Patient Health Hub** (`pages/PatientHealthHub.tsx`)
  - Unified patient portal with all components
  - Tabbed navigation for sections
  - Overview with quick stats

#### Phase 2: Backend API
- **Vitals API** (`server/routes/vitals.py`)
  - Record and retrieve vital readings
  - Automatic status determination (Normal/High/Low/Critical)
  - Trend calculation
  - Vital alerts for doctors/nurses
  - Patient and provider endpoints

- **Care Plan API** (`server/routes/careplan.py`)
  - Full CRUD for care plans, goals, and tasks
  - Progress calculation
  - Goal status updates
  - Doctor-created care plans for patients

- **New Database Models** (`server/models.py`)
  - `VitalReading` - Health vital signs
  - `CarePlan`, `CarePlanGoal`, `CarePlanTask` - Care management
  - `EmergencyProfile` - QR-accessible emergency info
  - `HealthEvent` - Timeline events


#### Collaboration Features
- **Messaging System** (`server/routes/messaging.py`, `components/MessagingCenter.tsx`)
  - Doctor-patient secure messaging
  - Conversation threads
  - Unread message tracking
  - Priority levels for messages

- **Referral System** (`server/routes/collaboration.py`, `components/ReferralWidget.tsx`)
  - Case referrals between doctors
  - Consultation requests
  - Accept/decline workflow
  - Specialist search

- **Doctor Dashboard** (`pages/Dashboard.tsx`)
  - Patient Queue widget with status tracking
  - Clinical Alerts widget (critical/warning/info)
  - Quick Stats bar with gradient cards

- **Patient Dashboard** (`pages/PatientDashboard.tsx`)
  - Upcoming Appointments section
  - Medication Tracker with "Take Now" feature
  - Health Goals with progress bars
  - Quick Actions for telemedicine, labs, messages

- **Lab Dashboard** (`pages/LabDashboard.tsx`)
  - Stats grid (pending, in progress, completed, critical)
  - Test category filters
  - AI interpretation for results
  - Critical value alerts

- **Radiology Dashboard** (`pages/RadiologyDashboard.tsx`)
  - PACS worklist with modality filters
  - Study priority badges (STAT, Urgent, Routine)
  - AI Radiology Assistant panel
  - Recent reports sidebar

#### Internationalization
- Extended English translations (`locales/en/dashboard.json`)
- Added Spanish translations (`locales/es/dashboard.json`)
- New keys for all dashboard features

#### Security
- Content Security Policy (CSP) headers
- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Permissions-Policy for camera/microphone

### Changed
- Database connection pooling with pre-ping and auto-recycling
- SQLite WAL mode enabled for development
- Version bumped to 2.2.0
- Updated API documentation in Swagger

### Fixed
- Improved error handling in middleware chain
- Better connection pool recovery on database errors

---

## [2.1.18] - 2026-01-21

### Added
- Concordium ZKP verification flow
- Family group management routes
- Telemedicine consultation endpoints
- WebSocket real-time notifications

### Changed
- Updated Gemini model aliases to gemini-3-*-preview

---

## [2.1.3] - 2026-01-18

### Added
- Concordium wallet connection
- AI Specialist agents (Cardiology, Orthopedics)
- Voice input for symptom checker

### Fixed
- Medical records upload pipeline
- Authentication logout bugs
- Light mode text visibility

---

## [2.0.0] - 2025-11-20

### Added
- Initial platform release
- 10+ AI agents
- 42 frontend pages
- 30+ backend route modules
- Role-based dashboards
- Blockchain identity integration

---

*This changelog follows [Keep a Changelog](https://keepachangelog.com/) guidelines.*
