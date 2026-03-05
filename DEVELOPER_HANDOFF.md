# MED LOOP — تقرير تقني شامل للمطور
# MED LOOP — Comprehensive Developer Handoff Report

---

## 1. نظرة عامة (System Overview)

**MED LOOP** هو نظام إدارة عيادات طبية متعدد المراكز (Multi-Tenant SaaS) يعمل على الويب.
كل مركز طبي (client) له رابط فريد (slug) ولوحة تحكم مستقلة.

| Component | Tech | Hosting | Repo |
|-----------|------|---------|------|
| Frontend | React 19 + TypeScript + Vite 6 | Vercel — `med.loopjo.com` | `ehabalabdo/med-loop` |
| Backend API | Express.js (ESM) + Node.js | Render — `medloop-api.onrender.com` | `ehabalabdo/medloop-api` |
| Database | PostgreSQL (Neon.tech) | Neon — SSL | — |

**Data Flow:**
```
Browser → api.js (fetch) → Backend API (Express) → PostgreSQL (Neon)
          ↑ JWT Token                ↑ Auth Middleware
```

---

## 2. البنية التحتية (Architecture)

### 2.1 Multi-Tenancy (تعدد المراكز)
- كل مركز له `slug` فريد: `med.loopjo.com/alshifa/login`
- كل جدول بالقاعدة فيه عمود `client_id`
- كل API request يُفلتر تلقائياً حسب `client_id` من JWT token
- المسارات: `/:slug/login`, `/:slug/admin`, `/:slug/reception`, إلخ

### 2.2 Authentication Flow (تدفق المصادقة)
```
1. User submits login form → POST /auth/login { username, password, client_id }
2. Backend: finds user by (full_name OR email OR phone OR username) + client_id
3. Backend: verifies password with bcrypt (with plaintext fallback for old accounts)
4. Backend: returns { token: JWT, type: 'staff'|'patient', user: {...} }
5. Frontend: stores token in localStorage('token'), user in localStorage('user')
6. All subsequent API calls: Authorization: Bearer <token>
7. Backend middleware: verifies JWT, sets req.user = { id, role, client_id, clinic_id }
```

### 2.3 User Roles (الصلاحيات)
| Role | Arabic | Access |
|------|--------|--------|
| `admin` | مدير | Full access to their client |
| `secretary` | سكرتير | Reception, patients, appointments |
| `doctor` | طبيب | Doctor view, patients, appointments |
| `lab_tech` | فني مختبر | Dental lab |
| `implant_manager` | مدير زراعة | Implant inventory |
| `course_manager` | مدير أكاديمية | Courses/academy |
| `super_admin` | مدير المنصة | All clients management (separate login) |

---

## 3. Frontend (الواجهة الأمامية)

### 3.1 Tech Stack
- **React 19.2.3** + **TypeScript 5.8**
- **Vite 6** (build tool, dev server port 3000)
- **React Router DOM v6** (slug-based routing)
- **Tailwind CSS** (via CDN in `index.html`)
- **Font Awesome** (icons via CDN)
- **jsPDF** (PDF generation)
- **socket.io-client** (for device real-time, not yet fully active)

### 3.2 Project Structure
```
medloop2/
├── App.tsx                    # Main router + route guards
├── types.ts                   # All TypeScript interfaces & enums
├── index.tsx                  # ReactDOM entry point
├── index.html                 # HTML shell (Tailwind + FA CDN)
├── vite.config.ts             # Vite config (port 3000, @ alias)
├── vercel.json                # SPA rewrite rules
├── package.json
│
├── src/
│   └── api.js                 # HTTP client (fetch wrapper → backend API)
│
├── context/
│   ├── AuthContext.tsx         # Login/logout, JWT storage, user state
│   ├── ClientContext.tsx       # Resolves slug → client, checks expiration
│   ├── LanguageContext.tsx     # Arabic/English (i18n)
│   └── ThemeContext.tsx        # Light/Dark mode
│
├── services/
│   ├── apiServices.ts         # ★ PRIMARY — All API calls (drop-in for pgServices)
│   ├── services.ts            # Service layer with role checks → calls apiServices
│   ├── pgServices.ts          # OLD — Direct SQL (NOT used anymore, kept for reference)
│   ├── db.ts                  # OLD — Neon serverless connection (NOT used anymore)
│   └── mockFirebase.ts        # Mock data for local dev without DB
│
├── views/                     # Each view = a full page
│   ├── LoginView.tsx           # Staff login (per slug)
│   ├── AdminView.tsx           # Admin dashboard — users, clinics, settings
│   ├── ReceptionView.tsx       # Secretary — queue management, check-in
│   ├── DoctorView.tsx          # Doctor — waiting room, patient treatment
│   ├── AppointmentsView.tsx    # Calendar + scheduling
│   ├── PatientsRegistryView.tsx # Patient list + search
│   ├── PatientProfileView.tsx  # Single patient record + history
│   ├── ClinicHistoryView.tsx   # Completed visits archive
│   ├── DeviceResultsView.tsx   # Lab device results viewer
│   ├── DeviceManagementView.tsx # Device CRUD
│   ├── QueueDisplayView.tsx    # TV display for waiting room
│   ├── DentalLabView.tsx       # Lab cases tracking
│   ├── ImplantView.tsx         # Implant inventory
│   ├── CoursesView.tsx         # Academy management
│   ├── SuperAdminView.tsx      # Platform owner panel (all clients)
│   ├── LandingView.tsx         # Public landing page (med.loopjo.com/)
│   ├── PatientLoginView.tsx    # Patient portal login
│   └── PatientDashboardView.tsx # Patient portal dashboard
│
├── components/
│   ├── Layout.tsx              # Page layout wrapper (header, sidebar)
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── DevModeSwitcher.tsx     # Dev-only mode switcher (localhost only)
│   └── DeviceResultsTimeline.tsx # Device results display component
│
├── hooks/
│   ├── useCompletedPatients.ts # Hook for completed patients list
│   └── useDeviceSocket.ts      # Socket.io hook for device real-time
│
├── database/                   # SQL files (reference only, already applied to Neon)
│   ├── schema.sql              # Original schema (OUTDATED — see actual schema below)
│   ├── migration_saas.sql      # Added clients, super_admins, client_id columns
│   ├── migration_devices.sql   # Added devices, device_results, device_api_keys
│   ├── migration_add_auth.sql  # Added password to users, email/password to patients
│   └── seed.sql
│
└── bridge-agent/               # Desktop agent for medical device integration
    ├── bridge-agent.js
    ├── hl7-parser.js
    ├── mllp-listener.js
    └── serial-listener.js
```

### 3.3 Key File: `src/api.js` (HTTP Client)
```javascript
const BASE_URL = "https://medloop-api.onrender.com";

// Attaches Authorization: Bearer <token> from localStorage
// On 401: clears token + user from localStorage
// Exports: api.get(path), api.post(path, body), api.put(path, body), api.del(path, body)
```

### 3.4 Key File: `services/apiServices.ts`
This is the **main data layer**. It exports these objects (each with CRUD methods):
| Export | Description | API Routes Used |
|--------|-------------|----------------|
| `pgSuperAdmin` | Super admin login | `POST /auth/super-admin/login` |
| `pgClientsService` | Clients CRUD + extend/suspend | `GET/POST/PUT/DELETE /clients/*` |
| `pgUsers` | Users CRUD | `GET/POST/PUT/DELETE /users/*` |
| `pgClinics` | Clinics (departments) CRUD | `GET/POST/PUT/DELETE /clinics/*` |
| `pgPatients` | Patients CRUD | `GET/POST/PUT/DELETE /patients/*` |
| `pgAppointments` | Appointments CRUD | `GET/POST/PUT/DELETE /appointments/*` |
| `pgInvoices` | Invoices CRUD | `GET/POST/PUT/DELETE /invoices/*` |
| `pgDevices` | Medical devices CRUD | `GET/POST/PUT/DELETE /devices/*` |
| `pgDeviceResults` | Device results + matching | `GET/POST/PUT /device-results/*` |

### 3.5 Key File: `services/services.ts`
Higher-level service layer with **role-based checks**. Wraps `apiServices.ts`.
Key services:
- `AuthService` — create/update/delete users (admin only)
- `ClinicService` — manage clinics/departments
- `PatientService` — CRUD + **polling-based subscribe** (checks for changes every 3s)
- `AppointmentService` — CRUD + today/week filtering
- `BillingService` — invoice management
- `NotificationService`, `SettingsService`, `DentalLabService`, `ImplantService`, `CourseService`, `DeviceService`

> **ملاحظة مهمة:** `PatientService.subscribe()` يستخدم polling (setInterval كل 3 ثواني) وليس WebSocket — هذا مقصود حالياً.

### 3.6 Routing Structure (`App.tsx`)
```
/                          → LandingView (public)
/super-admin               → SuperAdminView
/patient/login             → PatientLoginView
/patient/dashboard         → PatientDashboardView

/:slug/login               → LoginView (per client)
/:slug/admin               → AdminView          [admin]
/:slug/reception           → ReceptionView       [secretary]
/:slug/doctor              → DoctorView          [doctor]
/:slug/patients            → PatientsRegistryView [admin, secretary, doctor]
/:slug/patients/:id        → PatientProfileView   [admin, secretary, doctor]
/:slug/appointments        → AppointmentsView     [admin, secretary, doctor]
/:slug/dental-lab          → DentalLabView        [admin, doctor, lab_tech]
/:slug/implant-company     → ImplantView          [admin, doctor, implant_manager]
/:slug/academy             → CoursesView          [admin, course_manager, secretary]
/:slug/clinic-history      → ClinicHistoryView    [admin, doctor]
/:slug/device-results      → DeviceResultsView    [admin, secretary, doctor]
/:slug/device-management   → DeviceManagementView [admin]
/:slug/queue-display       → QueueDisplayView     [admin, secretary]
```

Legacy bare routes (e.g., `/admin`, `/reception`) auto-redirect to `/:slug/...` using saved slug from localStorage.

### 3.7 Context Providers (Wrap Order)
```tsx
<ErrorBoundary>
  <LanguageProvider>      // Arabic/English
    <ThemeProvider>        // Light/Dark
      <AuthProvider>      // Login state + JWT
        <BrowserRouter>
          <ClientProvider> // Resolves slug → client (only inside /:slug/* routes)
            <ExpiredBlockScreen /> // Blocks if subscription expired
            <Routes ... />
          </ClientProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </LanguageProvider>
</ErrorBoundary>
```

---

## 4. Backend API (الخادم)

### 4.1 Tech Stack
- **Express.js** (ESM modules — `"type": "module"`)
- **Node.js**
- Dependencies: `bcrypt`, `bcryptjs`, `cors`, `dotenv`, `express`, `jsonwebtoken`, `pg`, `zod`

### 4.2 Project Structure
```
medloop-api/
├── src/
│   ├── app.js              # Express app + CORS + route mounting
│   ├── db.js               # pg.Pool connection to Neon (SSL)
│   ├── middleware/
│   │   ├── auth.js         # JWT verification middleware
│   │   ├── requireRole.js  # Role-based access control
│   │   └── authGuard.js    # Auth guard utility
│   ├── routes/
│   │   ├── auth.js         # POST /auth/login, /auth/super-admin/login, /auth/refresh
│   │   ├── users.js        # GET/POST/PUT/DELETE /users
│   │   ├── clinics.js      # GET/POST/PUT/DELETE /clinics
│   │   ├── clients.js      # 14 endpoints /clients/* (super admin)
│   │   ├── patients.js     # GET/POST/PUT/DELETE /patients
│   │   ├── appointments.js # 9 endpoints /appointments/*
│   │   ├── invoices.js     # GET/POST/PUT/DELETE /invoices
│   │   ├── devices.js      # 5 endpoints /devices/*
│   │   ├── device-results.js # 5 endpoints /device-results/*
│   │   └── reports.js      # 3 report endpoints
│   └── validation/
│       └── appointment.js  # Zod schema validation
├── package.json
└── .env                    # ⚠️ NOT in git — must create manually
```

### 4.3 Environment Variables (Backend `.env`)
```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=your-secret-key
PORT=3000
```

### 4.4 CORS Configuration (`app.js`)
```javascript
const allowedOrigins = [
  'https://med.loopjo.com',
  'http://localhost:5173',
  'http://localhost:3000'
];
// Supports credentials, all standard methods and headers
```

### 4.5 Route Mounting
```javascript
// Public (no auth)
app.use('/auth', authRoutes);

// Protected (JWT required)
app.use('/users', authMiddleware, usersRoutes);
app.use('/clinics', authMiddleware, clinicsRoutes);
app.use('/patients', authMiddleware, patientsRoutes);
app.use('/appointments', authMiddleware, appointmentsRoutes);
app.use('/invoices', authMiddleware, invoicesRoutes);
app.use('/devices', authMiddleware, devicesRoutes);
app.use('/device-results', authMiddleware, deviceResultsRoutes);
app.use('/reports', authMiddleware, reportsRoutes);
app.use('/clients', clientsRoutes);  // Has its own auth (super_admin)
```

### 4.6 Complete API Endpoints

#### Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Staff + patient login |
| POST | `/auth/super-admin/login` | Public | Super admin login |
| POST | `/auth/refresh` | Token | Refresh JWT token |

#### Users (`/users`) — JWT Required
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/users` | Any authenticated | List users (filtered by client_id) |
| POST | `/users` | Admin | Create user (bcrypt password) |
| POST | `/users/doctors` | Admin | Legacy: create doctor |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

#### Clinics (`/clinics`) — JWT Required
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/clinics` | Any | List clinics (filtered by client_id) |
| POST | `/clinics` | Admin | Create clinic |
| PUT | `/clinics/:id` | Admin | Update clinic |
| PUT | `/clinics/:id/status` | Admin | Toggle active/inactive |
| DELETE | `/clinics/:id` | Admin | Delete clinic |

#### Patients (`/patients`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List patients (filtered by client_id) |
| GET | `/patients/:id` | Get single patient |
| POST | `/patients` | Create patient (bcrypt password if provided) |
| PUT | `/patients/:id` | Update patient |
| DELETE | `/patients/:id` | Delete patient |

#### Appointments (`/appointments`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/appointments` | List all (filtered by client_id) |
| GET | `/appointments/by-patient/:patientId` | By patient |
| GET | `/appointments/today` | Today's appointments |
| GET | `/appointments/week` | This week's appointments |
| GET | `/appointments/day?date=YYYY-MM-DD` | Specific day |
| POST | `/appointments` | Create appointment |
| PUT | `/appointments/:id` | Update appointment |
| PUT | `/appointments/:id/status` | Change status |
| DELETE | `/appointments/:id` | Delete appointment |

#### Invoices (`/invoices`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/invoices` | List all (filtered by client_id) |
| POST | `/invoices` | Create invoice |
| PUT | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Delete invoice |

#### Devices (`/devices`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/devices` | List devices (`?clinicId=X` optional) |
| POST | `/devices` | Register device |
| PUT | `/devices/:id` | Update device |
| PUT | `/devices/:id/last-seen` | Update last seen timestamp |
| DELETE | `/devices/:id` | Delete device |

#### Device Results (`/device-results`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/device-results` | List results (`?status=X&patientId=X`) |
| GET | `/device-results/pending-count` | Count of pending results |
| POST | `/device-results` | Submit result (auto-match attempted) |
| PUT | `/device-results/:id/match` | Manually match to patient |
| PUT | `/device-results/:id/reject` | Reject result |

#### Clients (`/clients`) — Super Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/clients/by-slug/:slug` | Public | Resolve slug to client |
| GET | `/clients` | Super Admin | List all clients |
| GET | `/clients/:id` | Super Admin | Get client details |
| POST | `/clients` | Super Admin | Create new client |
| POST | `/clients/:id/owner` | Super Admin | Create owner admin for client |
| PUT | `/clients/:id` | Super Admin | Update client |
| PUT | `/clients/:id/extend-trial` | Super Admin | Extend trial period |
| PUT | `/clients/:id/trial-end-date` | Super Admin | Set trial end date |
| PUT | `/clients/:id/extend-subscription` | Super Admin | Extend subscription |
| PUT | `/clients/:id/suspend` | Super Admin | Suspend client |
| PUT | `/clients/:id/activate` | Super Admin | Activate client |
| PUT | `/clients/:id/features` | Super Admin | Toggle features |
| GET | `/clients/:id/stats` | Super Admin | Client statistics |
| DELETE | `/clients/:id` | Super Admin | Cascade delete client |

#### Reports (`/reports`) — JWT Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/daily` | Daily report |
| GET | `/reports/weekly` | Weekly report |
| GET | `/reports/monthly` | Monthly report |

---

## 5. Database (قاعدة البيانات)

### 5.1 Connection
- **Provider:** Neon.tech (Serverless PostgreSQL)
- **Connection:** `pg.Pool` with SSL (`rejectUnauthorized: false`)
- **Connection string:** `DATABASE_URL` environment variable

### 5.2 Actual Table Schemas

> ⚠️ **تنبيه:** ملف `database/schema.sql` قديم ولا يعكس الحالة الفعلية للقاعدة. الجداول التالية هي الحالة الفعلية بعد تطبيق جميع migrations.

#### `clients` — المراكز (SaaS Tenants)
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'trial',  -- trial | active | expired | suspended
    trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_ends_at TIMESTAMP,
    owner_user_id INTEGER,
    enabled_features JSONB DEFAULT '{"dental_lab":false,"implant_company":false,"academy":false,"device_results":false}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

#### `super_admins` — مدير المنصة
```sql
CREATE TABLE super_admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users` — موظفي المراكز
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255),              -- bcrypt hashed (some old accounts: plaintext)
    role VARCHAR(50) NOT NULL,          -- admin | secretary | doctor | lab_tech | implant_manager | course_manager
    clinic_id INTEGER,                  -- Primary clinic
    clinic_ids JSONB DEFAULT '[]',      -- Array of clinic IDs
    client_id INTEGER REFERENCES clients(id),
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
```

#### `patients` — المرضى
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    password VARCHAR(255),              -- For patient portal access
    username VARCHAR(100),
    has_access BOOLEAN DEFAULT false,
    date_of_birth DATE,
    age INTEGER,                        -- Auto-calculated by backend
    gender VARCHAR(10),                 -- male | female
    medical_profile JSONB DEFAULT '{}', -- Allergies, chronic conditions, etc.
    current_visit JSONB DEFAULT '{}',   -- Active visit data
    history JSONB DEFAULT '[]',         -- Past visits array
    notes TEXT,
    client_id INTEGER REFERENCES clients(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
```

#### `appointments` — المواعيد
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    patient_name VARCHAR(255),
    clinic_id INTEGER,
    doctor_id INTEGER,
    start_time TIMESTAMP,               -- Appointment date/time
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- pending | scheduled | checked-in | completed | cancelled | no-show | suggested
    reason TEXT,
    suggested_date TIMESTAMP,
    suggested_notes TEXT,
    client_id INTEGER REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(255)
);
```

#### `invoices` — الفواتير
```sql
CREATE TABLE invoices (
    id VARCHAR(100) PRIMARY KEY,        -- Generated ID like 'inv_xxxx_yyyy'
    visit_id VARCHAR(255),
    patient_id INTEGER,
    patient_name VARCHAR(255),
    items JSONB DEFAULT '[]',           -- Array of { id, description, price }
    total_amount NUMERIC(10,2) DEFAULT 0,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    payment_method VARCHAR(50),         -- cash | card | insurance
    status VARCHAR(50) DEFAULT 'unpaid', -- unpaid | paid | partial
    client_id INTEGER REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `clinics` — العيادات/الأقسام
```sql
CREATE TABLE clinics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    category VARCHAR(50) DEFAULT 'clinic', -- clinic | department
    active BOOLEAN DEFAULT true,
    client_id INTEGER REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    is_archived BOOLEAN DEFAULT false
);
```

#### `devices` — الأجهزة الطبية
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    clinic_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,          -- cbc | ecg | glucose | chemistry | xray | other
    connection_type VARCHAR(50) NOT NULL, -- lan | serial | hl7 | folder | api
    ip_address VARCHAR(45),
    port INTEGER,
    com_port VARCHAR(20),
    baud_rate INTEGER,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `device_results` — نتائج الأجهزة
```sql
CREATE TABLE device_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    patient_identifier TEXT NOT NULL,
    test_code VARCHAR(100) NOT NULL,
    test_name VARCHAR(255),
    value TEXT NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    is_abnormal BOOLEAN DEFAULT false,
    raw_message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending | matched | error | rejected
    matched_patient_id INTEGER,
    matched_at TIMESTAMP,
    matched_by VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Other Tables (less frequently used)
- **`notifications`** — System notifications (type, title, message, target_role)
- **`lab_cases`** — Dental lab case tracking (status: PENDING → IN_PROGRESS → READY → DELIVERED)
- **`implant_inventory`** — Implant stock management (brand, type, size, quantity, min_threshold)
- **`implant_orders`** — Implant orders tracking
- **`courses`** — Academy course definitions
- **`course_students`** — Enrolled students + payment tracking
- **`course_sessions`** — Course session records
- **`system_settings`** — Per-client settings (clinic name, logo, address, phone)
- **`device_api_keys`** — API keys for bridge agent authentication

### 5.3 Key Indexes
All tables have indexes on `client_id` for multi-tenant filtering performance.
Additional indexes on: `clients(slug)`, `clients(status)`, `devices(clinic_id)`, `device_results(status)`, `device_results(patient_identifier)`, `device_results(created_at DESC)`.

### 5.4 JSONB Fields (Important)
| Table | Column | Structure |
|-------|--------|-----------|
| `patients` | `medical_profile` | `{ allergies: {exists, details}, chronicConditions: {exists, details}, currentMedications: {exists, details}, previousSurgeries: {exists, details}, isPregnant: boolean }` |
| `patients` | `current_visit` | `{ visitId, clinicId, doctorId, date, status, priority, reasonForVisit, diagnosis, treatment, prescriptions: [], attachments: [], invoiceItems: [] }` |
| `patients` | `history` | `Array<VisitData>` — same structure as current_visit |
| `users` | `clinic_ids` | `[1, 2, 3]` — array of clinic IDs user can access |
| `invoices` | `items` | `[{ id, description, price }]` |
| `devices` | `config` | Extensible device configuration |
| `clients` | `enabled_features` | `{ dental_lab: bool, implant_company: bool, academy: bool, device_results: bool }` |

---

## 6. TypeScript Types (الأنواع)

All types are defined in `types.ts`. Key types:

```typescript
enum UserRole { ADMIN, SECRETARY, DOCTOR, LAB_TECH, IMPLANT_MANAGER, COURSE_MANAGER }
type ClientStatus = 'trial' | 'active' | 'expired' | 'suspended';
type AppointmentStatus = 'pending' | 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show' | 'suggested';
type DeviceType = 'cbc' | 'ecg' | 'glucose' | 'chemistry' | 'xray' | 'other';
type DeviceResultStatus = 'pending' | 'matched' | 'error' | 'rejected';

interface Client { id, name, slug, status, trialEndsAt, subscriptionEndsAt, enabledFeatures, ... }
interface User { uid, name, email, password?, role, clinicIds, clientId, isActive, ... }
interface Patient { id, name, age, dateOfBirth, gender, phone, medicalProfile, currentVisit, history, ... }
interface Appointment { id, patientId, patientName, clinicId, doctorId, date, status, reason, ... }
interface Invoice { id, visitId, patientId, items[], totalAmount, paidAmount, paymentMethod, status, ... }
interface Device { id, clientId, clinicId, name, type, connectionType, ipAddress, port, ... }
interface DeviceResult { id, clientId, deviceId, patientIdentifier, testCode, value, unit, status, ... }
```

---

## 7. Deployment (النشر)

### 7.1 Frontend (Vercel)
- **Domain:** `med.loopjo.com`
- **Repo:** `ehabalabdo/med-loop` on GitHub
- **Auto-deploy:** Push to `main` → Vercel builds automatically
- **Build:** `vite build`
- **SPA Rewrite:** `vercel.json` → all routes rewrite to `index.html`

### 7.2 Backend (Render)
- **URL:** `https://medloop-api.onrender.com`
- **Repo:** `ehabalabdo/medloop-api` on GitHub
- **Auto-deploy:** Push to `main` → Render deploys automatically
- **Start command:** `node src/app.js`
- **Environment Variables** (set in Render dashboard):
  - `DATABASE_URL` — Neon PostgreSQL connection string
  - `JWT_SECRET` — Secret key for JWT signing
  - `PORT` — (optional, Render sets this)

### 7.3 Database (Neon)
- **Provider:** Neon.tech
- Serverless PostgreSQL with auto-scaling
- SSL required (`sslmode=require`)
- Managed via Neon dashboard (no SSH)

### 7.4 Deploy Commands
```bash
# Frontend
cd medloop2
git add -A && git commit -m "description" && git push

# Backend
cd medloop-api
git add -A && git commit -m "description" && git push
```

---

## 8. Local Development (التشغيل المحلي)

### 8.1 Frontend
```bash
cd medloop2
npm install
# Create .env file:
# VITE_API_URL=http://localhost:3000  (optional — api.js currently hardcodes Render URL)
npm run dev
# Opens at http://localhost:3000
```

### 8.2 Backend
```bash
cd medloop-api
npm install
# Create .env file:
echo "DATABASE_URL=postgresql://..." > .env
echo "JWT_SECRET=your-secret" >> .env
echo "PORT=3000" >> .env
node src/app.js
# Runs on http://localhost:3000
```

> **⚠️ ملاحظة:** الفرونت حالياً يستخدم URL ثابت للـ API (`https://medloop-api.onrender.com`) في `src/api.js`. لتطوير محلي كامل يجب تغييرها إلى `http://localhost:3000`.

---

## 9. Bridge Agent (وكيل الأجهزة الطبية)

Located in `bridge-agent/` — a Node.js desktop agent that:
1. Listens to medical devices (serial/HL7/LAN)
2. Parses device output
3. Sends results to the backend API

Files:
- `bridge-agent.js` — Main agent orchestrator
- `hl7-parser.js` — HL7 message parser
- `mllp-listener.js` — MLLP protocol listener
- `serial-listener.js` — Serial port listener (COM ports)

> This is designed to run on the clinic's local computer, connected to lab devices.

---

## 10. Known Limitations & Notes (ملاحظات مهمة)

### 10.1 Security
- ✅ All data access goes through backend API (no direct DB from browser)
- ✅ JWT authentication on all protected routes
- ✅ CORS restricted to known origins
- ✅ bcrypt password hashing with plaintext fallback (for migration)
- ⚠️ Some old user accounts have plaintext passwords — should be migrated to bcrypt
- ⚠️ `@neondatabase/serverless` and `pg` still in frontend `package.json` (not used, can be removed)
- ⚠️ `database/schema.sql` is outdated — actual schema differs from file

### 10.2 Features
- ⚠️ Patient portal (PatientLoginView/PatientDashboardView) is basic
- ⚠️ Real-time device results via Socket.io is partially implemented (uses polling currently)
- ⚠️ Notification system exists in types but not fully connected
- ⚠️ Dental lab, implant, courses modules — basic CRUD, no advanced workflows

### 10.3 Data Patterns
- All timestamps stored as PostgreSQL `TIMESTAMP` (ISO format)
- Frontend often sends dates as `number` (epoch ms) — backend converts
- Patient age is auto-calculated from `date_of_birth` in backend
- `current_visit` and `history` use JSONB — full visit data embedded in patient record

### 10.4 Cleanup Opportunities
- Remove `@neondatabase/serverless` and `pg` from frontend dependencies
- Remove or archive `services/pgServices.ts` and `services/db.ts`
- Update `database/schema.sql` to match actual DB state
- Make `api.js` BASE_URL configurable via environment variable
- Add rate limiting to backend
- Add input validation (Zod) to more routes (currently only appointments have it)
- Add proper logging (winston/pino)

---

## 11. Quick Reference (مرجع سريع)

### URLs
| What | URL |
|------|-----|
| Production Frontend | `https://med.loopjo.com` |
| Production API | `https://medloop-api.onrender.com` |
| Super Admin Panel | `https://med.loopjo.com/super-admin` |
| Client Login Example | `https://med.loopjo.com/alshifa/login` |
| API Health Check | `GET https://medloop-api.onrender.com/` |

### Key localStorage Items
| Key | Value | Purpose |
|-----|-------|---------|
| `token` | JWT string | Authorization header |
| `user` | JSON (User object) | Current staff user |
| `patientUser` | JSON (Patient object) | Current patient user |
| `currentClientSlug` | string (e.g. "alshifa") | Remember which client |
| `currentClientId` | string (e.g. "1") | Client ID for API calls |
| `theme` | "light" \| "dark" | UI theme |
| `language` | "ar" \| "en" | UI language |

### JWT Token Payload
```json
{
  "id": 1,
  "role": "admin",
  "type": "staff",
  "client_id": 1,
  "clinic_id": null,
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

**End of Report — آخر التقرير**
*Generated for developer handoff — MED LOOP Platform*
