# MedConnect — Comprehensive Healthcare Platform

A full-stack healthcare management platform that connects **Patients, Doctors, Hospital Admins, Lab Technicians, Pharmacists, and Super Admins** within a unified digital ecosystem.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 6 (SPA, Vanilla CSS Glassmorphism) |
| **Backend** | Node.js + Express.js (REST API) |
| **Database** | SQLite (dev) / PostgreSQL ready via **Prisma ORM** |
| **Authentication** | JWT (JSON Web Tokens) + RBAC Middleware |
| **Icons** | Lucide React |

---

## 🚀 Local Setup Guide

### Prerequisites
- **Node.js** v18+ (installed via winget or nodejs.org)
- **Git** (for version control)

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd medconnect
```

### Step 2: Setup Backend
```bash
cd backend
npm install
npx prisma db push      # Creates the SQLite database
npx prisma db seed      # Seeds demo data (hospitals, doctors, users)
npm run dev             # Starts Express API on http://localhost:5000
```

### Step 3: Setup Frontend (Open a NEW terminal)
```bash
cd frontend
npm install
npm run dev             # Starts React app on http://localhost:3000
```

### Step 4: Open the App
Navigate to **http://localhost:3000** in your browser.

---

## 🔐 Demo Test Accounts

All accounts use password: **`password123`**

| Role | Email |
|---|---|
| 👤 Patient | `patient@medconnect.com` |
| 🩺 Doctor | `doctor@medconnect.com` |
| 🏥 Hospital Admin | `hadmin@medconnect.com` |
| 🔬 Lab Technician | `labtech@medconnect.com` |
| 💊 Pharmacist | `pharmacist@medconnect.com` |
| 🛡️ Super Admin | `admin@medconnect.com` |

---

## 📁 Project Structure

```
medconnect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # All database models
│   │   └── seed.js            # Demo data seeder
│   ├── src/
│   │   ├── controllers/       # Business logic per module
│   │   │   ├── authController.js
│   │   │   ├── appointmentController.js
│   │   │   ├── ehrController.js
│   │   │   ├── consentController.js
│   │   │   ├── referralController.js
│   │   │   ├── labController.js
│   │   │   ├── hospitalController.js
│   │   │   ├── doctorController.js
│   │   │   ├── dashboardController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification
│   │   │   └── roleMiddleware.js     # RBAC enforcement
│   │   ├── routes/                  # API route handlers
│   │   ├── utils/
│   │   │   ├── prisma.js            # DB client singleton
│   │   │   ├── auditLogger.js       # Security audit trail
│   │   │   └── notificationHelper.js
│   │   └── server.js               # Express entry point
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx           # Role-based sidebar + shell
    │   ├── context/
    │   │   └── AuthContext.jsx      # Global auth state
    │   ├── pages/
    │   │   ├── Auth.jsx             # Login + Patient Registration
    │   │   └── DashboardController.jsx  # All 11 module dashboards
    │   ├── services/
    │   │   └── api.js               # Fetch client with JWT
    │   ├── App.jsx                  # App root & routing
    │   ├── main.jsx                 # React entry point
    │   └── index.css                # Design system (Glassmorphism)
    ├── vite.config.js
    └── package.json
```

---

## 🧩 Modules Implemented

| # | Module | Marks | Status |
|---|---|---|---|
| 1 | Authentication & RBAC | 10 | ✅ |
| 2 | Appointment Management | 20 | ✅ |
| 3 | Doctor Management | 10 | ✅ |
| 4 | Patient EHR (Medical Records) | 20 | ✅ |
| 5 | Consent Management | 5 | ✅ |
| 6 | Hospital Network & Beds | 10 | ✅ |
| 7 | Patient Referral System | 5 | ✅ |
| 8 | Lab & Diagnostics | 5 | ✅ |
| 9 | Pharmacy Integration | 5 | ✅ |
| 10 | Notifications | 5 | ✅ |
| 11 | Hospital Admin Dashboard | 5 | ✅ |

---

## 🔌 API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Patient self-registration |
| POST | `/api/auth/login` | Public | All role login |
| GET | `/api/auth/profile` | All | Get current user profile |
| GET | `/api/hospitals` | Public | List all hospitals + beds |
| GET | `/api/doctors` | Public | List doctors (filter by hospital/specialization) |
| GET | `/api/appointments` | Auth | Role-filtered appointment list |
| POST | `/api/appointments` | Patient | Book new appointment |
| PATCH | `/api/appointments/:id/status` | Auth | Update status lifecycle |
| PATCH | `/api/appointments/:id/reschedule` | Auth | Reschedule with double-booking check |
| POST | `/api/ehr/records` | Doctor | Create medical record + prescription |
| GET | `/api/ehr/patient/:id` | Auth+Consent | View patient EHR |
| GET | `/api/pharmacy/prescriptions` | Pharmacist | View Rx queue |
| PATCH | `/api/pharmacy/prescriptions/:id/status` | Pharmacist | Fulfill prescription |
| POST | `/api/consent` | Patient | Grant time-limited record access |
| DELETE | `/api/consent/:id` | Patient | Revoke consent |
| GET | `/api/consent` | Auth | List active grants |
| POST | `/api/referrals` | Doctor | Create inter-hospital referral |
| PATCH | `/api/referrals/:id/status` | Auth | Update referral lifecycle |
| POST | `/api/labs/upload` | Lab Tech | Upload report with critical flag |
| GET | `/api/labs/reports` | Auth | View lab reports |
| GET | `/api/notifications` | Auth | Get personal notifications |
| GET | `/api/dashboard/metrics` | Admin | System-wide analytics |
| PATCH | `/api/hospitals/:id/beds` | Admin | Update bed availability |

---

## 🗄️ Database (Prisma Schema)

Entities: `User`, `Patient`, `Doctor`, `Hospital`, `Department`, `Appointment`, `MedicalRecord`, `Prescription`, `PrescriptionItem`, `ConsentGrant`, `Referral`, `LabReport`, `Notification`, `AuditLog`

### Switch to PostgreSQL (for deployment)
Change one line in `backend/prisma/schema.prisma`:
```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```
Then update `.env` with your Supabase/Neon connection URL and run `npx prisma db push`.

---

## 🔐 Security Features
- JWT token-based stateless authentication
- Role-Based Access Control (RBAC) on every protected route
- Patient Consent Gate — EHR access requires explicit time-limited patient consent
- Double-booking prevention for appointment slots
- Doctor leave management blocks bookings
- Full Audit Log of all actions (user, action, IP, timestamp)
- Password hashing with bcryptjs (salt rounds: 10)
