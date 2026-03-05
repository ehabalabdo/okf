-- =============================================
-- MIGRATION: HR Module V2 — Breaks, Payroll, Manager Actions
-- Date: 2026-02-23
-- Description: Extends HR module with:
--   - Attendance events (break_out/break_in timeline)
--   - Break minutes columns on hr_attendance
--   - Payroll runs & payslips
--   - Social security settings
--   - Manual deductions, warnings, notifications
--   - Basic salary field on hr_employees
--   - Role field on hr_employees (HR_ADMIN / HR_EMPLOYEE)
-- =============================================

-- =============================================
-- 1. ALTER hr_employees: add basic_salary + role
-- =============================================
ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'HR_EMPLOYEE'
    CHECK (role IN ('HR_ADMIN', 'HR_EMPLOYEE'));

COMMENT ON COLUMN hr_employees.basic_salary IS 'Fixed monthly basic salary in JOD';
COMMENT ON COLUMN hr_employees.role IS 'HR_ADMIN=full access, HR_EMPLOYEE=self-service only';

-- =============================================
-- 2. ALTER hr_attendance: add break columns + net_work_minutes
-- =============================================
ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS total_break_minutes INTEGER DEFAULT 0;
ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS net_work_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN hr_attendance.total_break_minutes IS 'Sum of all break durations in minutes';
COMMENT ON COLUMN hr_attendance.net_work_minutes IS 'total_work_minutes - total_break_minutes';

-- =============================================
-- 3. HR ATTENDANCE EVENTS (timeline: check_in, break_out, break_in, check_out)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_attendance_events (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('check_in','break_out','break_in','check_out')),
    event_time TIMESTAMP NOT NULL DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_events_employee_date
    ON hr_attendance_events(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_hr_events_client
    ON hr_attendance_events(client_id);

COMMENT ON TABLE hr_attendance_events IS 'Individual attendance punches for timeline (check_in, break_out, break_in, check_out)';

-- =============================================
-- 4. SOCIAL SECURITY SETTINGS (per client)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_social_security_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 7.50,
    employer_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 14.25,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_ss_client
    ON hr_social_security_settings(client_id);

COMMENT ON TABLE hr_social_security_settings IS 'Jordan social security rates per client';

-- =============================================
-- 5. HR DEDUCTIONS (manager-entered, NOT automatic)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_deductions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- YYYY-MM-01
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    reason TEXT,
    created_by INTEGER REFERENCES hr_employees(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_deductions_emp_month
    ON hr_deductions(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_hr_deductions_client
    ON hr_deductions(client_id);

COMMENT ON TABLE hr_deductions IS 'Manual deductions entered by manager (NOT automatic)';

-- =============================================
-- 6. HR WARNINGS (manager-entered)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_warnings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL DEFAULT 'verbal' CHECK (level IN ('verbal','written','final')),
    reason TEXT,
    issued_by INTEGER REFERENCES hr_employees(id),
    issued_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_warnings_employee
    ON hr_warnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_warnings_client
    ON hr_warnings(client_id);

COMMENT ON TABLE hr_warnings IS 'Manager-issued warnings (verbal, written, final)';

-- =============================================
-- 7. HR NOTIFICATIONS (manager → employee)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_notifications (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_by INTEGER REFERENCES hr_employees(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_notifications_employee
    ON hr_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_notifications_client
    ON hr_notifications(client_id);

COMMENT ON TABLE hr_notifications IS 'Manager-to-employee notifications';

-- =============================================
-- 8. PAYROLL RUNS (one per client per month)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_payroll_runs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- YYYY-MM-01
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','closed')),
    created_by INTEGER REFERENCES hr_employees(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_payroll_runs_client_month
    ON hr_payroll_runs(client_id, month);

COMMENT ON TABLE hr_payroll_runs IS 'Monthly payroll run (draft → closed)';

-- =============================================
-- 9. PAYSLIPS (one per employee per month)
-- =============================================
CREATE TABLE IF NOT EXISTS hr_payslips (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payroll_run_id INTEGER NOT NULL REFERENCES hr_payroll_runs(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    month DATE NOT NULL,  -- YYYY-MM-01

    -- Salary snapshot
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Social Security (calculated from basic_salary ONLY)
    employee_ss NUMERIC(12,2) NOT NULL DEFAULT 0,
    employer_ss NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Lateness
    suggested_late_minutes INTEGER NOT NULL DEFAULT 0,
    suggested_late_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_late_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    late_threshold_exceeded BOOLEAN NOT NULL DEFAULT false,

    -- Overtime
    suggested_overtime_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    suggested_overtime_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_overtime_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Absence
    suggested_absent_days INTEGER NOT NULL DEFAULT 0,
    suggested_absence_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_absence_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Break summary
    total_break_minutes INTEGER NOT NULL DEFAULT 0,

    -- Manual deductions (sum from hr_deductions)
    manual_deductions_total NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Net salary (computed)
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Attendance summary
    days_worked INTEGER NOT NULL DEFAULT 0,
    total_work_minutes INTEGER NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
    reject_reason TEXT,
    approved_by INTEGER REFERENCES hr_employees(id),
    approved_at TIMESTAMP,

    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_payslips_client_emp_month
    ON hr_payslips(client_id, employee_id, month);
CREATE INDEX IF NOT EXISTS idx_hr_payslips_run
    ON hr_payslips(payroll_run_id);

COMMENT ON TABLE hr_payslips IS 'Per-employee payslip with suggested vs final amounts. Manager approves/edits individually.';

-- =============================================
-- DONE — HR V2 Migration
-- =============================================
