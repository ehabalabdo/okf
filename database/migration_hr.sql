-- =============================================
-- MIGRATION: HR Module
-- Date: 2026-02-18
-- Description: Adds HR employees, work schedules,
--              biometric credentials, attendance,
--              and clinic location fields.
-- =============================================

-- =============================================
-- 1. CLINIC / CLIENT LOCATION (Geo-fence)
--    Add location columns to clinics table
-- =============================================
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS allowed_radius_meters INTEGER NOT NULL DEFAULT 100;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

COMMENT ON COLUMN clinics.latitude IS 'Clinic latitude for geo-fence attendance';
COMMENT ON COLUMN clinics.longitude IS 'Clinic longitude for geo-fence attendance';
COMMENT ON COLUMN clinics.allowed_radius_meters IS 'Max radius in meters for attendance check-in';

-- =============================================
-- 2. HR EMPLOYEES
--    Separate table from users for HR-specific
--    employee management. Has own username/password.
-- =============================================
CREATE TABLE IF NOT EXISTS hr_employees (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,       -- bcrypt hash
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- username must be unique within a given client
CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_employees_client_username
    ON hr_employees(client_id, username);
CREATE INDEX IF NOT EXISTS idx_hr_employees_client_id
    ON hr_employees(client_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status
    ON hr_employees(status);

COMMENT ON TABLE hr_employees IS 'HR module employees — separate from system users';

-- =============================================
-- 3. HR WORK SCHEDULES (versioned per employee)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_work_schedules (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    work_days JSONB NOT NULL DEFAULT '[1,2,3,4,5]', -- 1=Mon … 7=Sun
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    grace_minutes INTEGER NOT NULL DEFAULT 10,
    overtime_enabled BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,                              -- NULL = still active
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_schedules_employee
    ON hr_work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_schedules_client
    ON hr_work_schedules(client_id);

COMMENT ON TABLE hr_work_schedules IS 'Per-employee work schedule (versioned by effective dates)';

-- =============================================
-- 4. HR BIOMETRIC CREDENTIALS (WebAuthn)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_biometric_credentials (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports JSONB DEFAULT '[]',
    device_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_biometric_employee
    ON hr_biometric_credentials(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_biometric_client
    ON hr_biometric_credentials(client_id);
CREATE INDEX IF NOT EXISTS idx_hr_biometric_credential_id
    ON hr_biometric_credentials(credential_id);

COMMENT ON TABLE hr_biometric_credentials IS 'WebAuthn credentials for biometric attendance verification';

-- =============================================
-- 5. HR ATTENDANCE (one row per employee per day)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_attendance (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    total_minutes INTEGER DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    verification_method TEXT DEFAULT 'biometric',
    check_in_lat DOUBLE PRECISION,
    check_in_lng DOUBLE PRECISION,
    check_out_lat DOUBLE PRECISION,
    check_out_lng DOUBLE PRECISION,
    device_info TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'incomplete'
        CHECK (status IN ('normal','late','absent','weekend','incomplete')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- One attendance row per employee per day per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_attendance_unique_day
    ON hr_attendance(client_id, employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee
    ON hr_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_client
    ON hr_attendance(client_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date
    ON hr_attendance(work_date);

COMMENT ON TABLE hr_attendance IS 'Daily attendance records with geo and biometric verification';

-- =============================================
-- 6. HR WEBAUTHN CHALLENGES (temporary storage)
--    Short-lived challenge store for WebAuthn flow
-- =============================================
CREATE TABLE IF NOT EXISTS hr_webauthn_challenges (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    challenge TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('register', 'authenticate')),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_challenges_employee
    ON hr_webauthn_challenges(employee_id);

-- =============================================
-- DONE
-- =============================================
