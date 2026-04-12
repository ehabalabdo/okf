
// =============================================
// User Roles & Types
// =============================================
export enum UserRole {
  ADMIN = 'admin',
  SECRETARY = 'secretary',
  DOCTOR = 'doctor',
  TECHNICIAN = 'technician',
  ACCOUNTANT = 'accountant',
  SENIOR_ACCOUNTANT = 'senior_accountant'
}

// Base Entity for Audit Trails
export interface AuditMetadata {
  createdAt: number;
  createdBy: string; // User UID
  updatedAt: number;
  updatedBy: string; // User UID
  isArchived?: boolean; // Soft Delete Flag (New)
}

// --- CLASSIFICATION UPDATE ---
export type ClinicCategory = 'clinic' | 'department';

export interface Clinic extends AuditMetadata {
  id: string;
  name: string;
  type: string;
  category: ClinicCategory;
  active: boolean;
}

export interface User extends AuditMetadata {
  uid: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  clinicIds: string[];
  isActive: boolean;
}

// --- New Medical & Visit Types ---

export type Priority = 'normal' | 'urgent';
export type Gender = 'male' | 'female';
export type VisitStatus = 'waiting' | 'in-progress' | 'completed';

export interface MedicalIntake {
  allergies: { exists: boolean; details: string };
  chronicConditions: { exists: boolean; details: string };
  currentMedications: { exists: boolean; details: string };
  previousSurgeries: { exists: boolean; details: string };
  isPregnant: boolean;
  notes?: string;
  // ENT-specific fields
  familyMedicalHistory?: {
    diabetes?: boolean;
    hypertension?: boolean;
    heartDisease?: boolean;
    asthma?: boolean;
    cancer?: boolean;
    hearingLoss?: boolean;
    otherENT?: boolean;
    details?: string;
  };
  isSmoker?: boolean;
  smokingDetails?: string; // e.g. "20 cigarettes/day for 10 years"
  hasAlcoholHistory?: boolean;
  alcoholDetails?: string;
  usesHearingAid?: boolean;
  hearingAidDetails?: string;
}

// --- NEW: Structured Clinical Data ---
export interface PrescriptionItem {
    id: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
}

export interface Attachment {
    id: string;
    name: string;
    type: 'image' | 'pdf' | 'lab';
    url: string; // Base64 or URL
    date: number;
}

// Re-using InvoiceItem here for the Doctor's selection
export interface InvoiceItem {
  id: string;
  description: string;
  price: number;
}

// --- SOAP-like Structured Visit ---

export interface VitalSigns {
  bloodPressure?: string;    // e.g. "120/80"
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface LabOrder {
  id: string;
  testName: string;
  notes?: string;
  status: 'Pending' | 'Completed';
  resultFileUrl?: string;    // Base64 or URL
  createdAt: number;
}

export interface ImagingOrder {
  id: string;
  imagingType: 'X-ray' | 'CT' | 'MRI' | 'Ultrasound' | 'Other';
  bodyPart: string;
  notes?: string;
  status: 'Pending' | 'Completed';
  reportFileUrl?: string;    // Base64 or URL
  createdAt: number;
}

export interface VisitData {
  visitId: string;
  clinicId: string;
  doctorId?: string;
  date: number;
  status: VisitStatus;
  priority: Priority;
  source?: string; // e.g. "Referral", "Walk-in", "Appointment"
  reasonForVisit: string;
  
  // === SOAP STRUCTURED SECTIONS ===

  // 1ï¸âƒ£ Chief Complaint
  chiefComplaint?: string;

  // 2ï¸âƒ£ History
  presentIllness?: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  familyHistory?: string;
  socialHistory?: string;

  // 3ï¸âƒ£ Examination
  generalExamination?: string;
  vitalSigns?: VitalSigns;
  systemicExamination?: string;

  // 4ï¸âƒ£ Assessment
  preliminaryDiagnosis?: string;
  differentialDiagnosis?: string;

  // 5ï¸âƒ£ Plan â€” Orders
  labOrders?: LabOrder[];
  imagingOrders?: ImagingOrder[];

  // Legacy fields (backward compat)
  diagnosis?: string;
  treatment?: string; 
  prescriptions?: PrescriptionItem[]; 
  attachments?: Attachment[];
  invoiceItems?: InvoiceItem[];
  doctorNotes?: string;
}

// The Main "Queue Item" effectively acts as the Patient + Current Visit
export interface Patient extends AuditMetadata {
  id: string;
  
  // Demographics
  name: string;
  age: number;
  dateOfBirth?: string; // ISO date string YYYY-MM-DD
  gender: Gender;
  phone: string;
  
  // Extended Demographics (ENT Clinic)
  weight?: number; // kg
  height?: number; // cm
  address?: string;
  alternativePhone?: string;
  nationalId?: string;
  guardianName?: string;
  guardianRelation?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  referralSource?: string; // e.g. "Doctor referral", "Self", "Hospital"
  painScale?: number; // 1-6
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodType?: string;
  
  // Authentication
  username?: string;
  email?: string;
  password?: string;
  hasAccess?: boolean;
  
  // Medical Profile (Sticky data)
  medicalProfile: MedicalIntake;
  
  // The Current Active Visit
  currentVisit: VisitData;
  
  // History (Simplified for NoSQL: In real DB, this is a subcollection)
  history: VisitData[]; 
}

// --- NEW ENTITIES (Paths 1 & 2) ---

export type AppointmentStatus = 'pending' | 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show' | 'suggested';

export interface Appointment extends AuditMetadata {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  doctorId?: string;
  date: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  suggestedDate?: number;
  suggestedNotes?: string;
}

// --- NEW: Billing & Notifications ---

export interface Invoice extends AuditMetadata {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'card' | 'insurance' | 'cliq';
  insuranceCompany?: string;
  patientShare?: number;
  patientPayMethod?: 'cash' | 'card';
  status: 'unpaid' | 'paid' | 'partial';
}

export interface Notification extends AuditMetadata {
    id: string;
    type: 'reminder' | 'system';
    title: string;
    message: string;
    targetRole?: UserRole; // Who should see this?
    relatedPatientId?: string;
    isRead: boolean;
    dueDate?: number; // When should this alert happen?
}

// --- NEW: System Settings for White-Labeling ---
export interface SystemSettings {
    clinicName: string;
    logoUrl: string; // Base64 or URL
    address: string;
    phone: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// =============================================
// HR Module Types
// =============================================

export type HrEmployeeStatus = 'active' | 'inactive' | 'disabled';
export type AttendanceStatus = 'normal' | 'late' | 'absent' | 'weekend' | 'incomplete';
export type HrRole = 'HR_ADMIN' | 'HR_EMPLOYEE';
export type AttendanceEventType = 'check_in' | 'break_out' | 'break_in' | 'check_out';
export type PayslipStatus = 'draft' | 'approved' | 'rejected';
export type PayrollRunStatus = 'draft' | 'closed';
export type WarningLevel = 'verbal' | 'written' | 'final';

export interface HrSchedule {
  workDays: number[];       // 1=Mon â€¦ 7=Sun
  startTime: string;        // "HH:MM"
  endTime: string;          // "HH:MM"
  graceMinutes: number;
  overtimeEnabled: boolean;
}

export interface HrEmployee {
  id: number;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  status: HrEmployeeStatus;
  role: HrRole;
  basicSalary: number;
  bioRegistered: boolean;
  schedule: HrSchedule | null;
  createdAt: string;
  updatedAt: string;
}

export interface HrAttendanceRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  workDate: string;          // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  totalMinutes: number;
  totalBreakMinutes: number;
  netWorkMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  events?: HrAttendanceEvent[];
}

export interface HrAttendanceEvent {
  id: number;
  employeeId: number;
  workDate: string;
  eventType: AttendanceEventType;
  eventTime: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: any;
}

export interface HrTodayAttendance {
  checkIn: string | null;
  checkOut: string | null;
  totalMinutes: number;
  totalBreakMinutes: number;
  netWorkMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: AttendanceStatus;
  onBreak: boolean;
  events: HrAttendanceEvent[];
}

export interface HrMeProfile {
  id: number;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  status: HrEmployeeStatus;
  role: HrRole;
  bioRegistered: boolean;
  bioCount: number;
  schedule: HrSchedule | null;
  todayAttendance: HrTodayAttendance | null;
}

export interface HrMonthlyReport {
  month: string;
  employeeId: number;
  summary: {
    daysPresent: number;
    totalWorkMinutes: number;
    totalLateMinutes: number;
    totalOvertimeMinutes: number;
    totalEarlyLeaveMinutes: number;
    totalAbsences: number;
    totalLateDays: number;
    totalEarlyLeaveDays: number;
  };
  days: HrAttendanceRecord[];
}

export interface ClinicLocation {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  allowed_radius_meters: number;
}

// =============================================
// HR Payroll Types
// =============================================

export interface HrSocialSecuritySettings {
  id: number;
  employeeRatePercent: number;
  employerRatePercent: number;
  enabled: boolean;
}

export interface HrPayrollRun {
  id: number;
  month: string;            // YYYY-MM-01
  status: PayrollRunStatus;
  createdBy?: number;
  createdAt: string;
  payslips?: HrPayslip[];
}

export interface HrPayslip {
  id: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  month: string;

  basicSalary: number;
  employeeSs: number;
  employerSs: number;

  suggestedLateMinutes: number;
  suggestedLateAmount: number;
  finalLateAmount: number;
  lateThresholdExceeded: boolean;

  suggestedOvertimeMinutes: number;
  overtimeMultiplier: number;
  suggestedOvertimeAmount: number;
  finalOvertimeAmount: number;

  suggestedAbsentDays: number;
  suggestedAbsenceAmount: number;
  finalAbsenceAmount: number;

  totalBreakMinutes: number;
  manualDeductionsTotal: number;
  netSalary: number;

  daysWorked: number;
  totalWorkMinutes: number;

  status: PayslipStatus;
  rejectReason?: string;
  approvedBy?: number;
  approvedAt?: string;

  pdfUrl?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
}

export interface HrDeduction {
  id: number;
  employeeId: number;
  employeeName?: string;
  month: string;
  amount: number;
  reason?: string;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
}

export interface HrWarning {
  id: number;
  employeeId: number;
  employeeName?: string;
  level: WarningLevel;
  reason?: string;
  issuedBy?: number;
  issuedByName?: string;
  issuedAt: string;
}

export interface HrNotification {
  id: number;
  employeeId: number;
  message: string;
  isRead: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
}

// ===================== LEAVE MANAGEMENT =====================

export type LeaveType = 'annual' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface HrLeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason?: string;
  status: LeaveStatus;
  rejectionReason?: string;
  approvedByName?: string;
  approvedAt?: number | null;
  createdAt: number;
}

export interface HrLeaveBalance {
  year: number;
  annual: { quota: number; used: number; remaining: number };
  sick: { quota: number; used: number; remaining: number };
}

// ===================== CATALOG =====================

export interface CatalogService {
  id: string;
  serviceName: string;
  category: string;
  price: number;
  currency: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogMedication {
  id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  route: string;
  defaultDose: string;
  defaultFrequency: string;
  defaultDuration: string;
  notes: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; message: string }[];
}

// =============================================
// ENT Medical Forms (Dr. Tarek Khrais Clinic)
// =============================================

// --- Form 1: New Patient Questionnaire (Ø§Ø³ØªØ¨ÙŠØ§Ù† Ù…Ø±ÙŠØ¶ Ø¬Ø¯ÙŠØ¯) ---
export interface ENTNewPatientForm {
  id?: string;
  patientId: string;
  createdAt?: number;
  
  // Chief Complaint
  chiefComplaint: string;
  symptomDuration: string;
  symptomSide: 'right' | 'left' | 'both' | 'none';
  
  // ENT Symptoms Checklist
  symptoms: {
    earPain: boolean;
    hearingLoss: boolean;
    tinnitus: boolean; // Ø·Ù†ÙŠÙ†
    earDischarge: boolean;
    vertigo: boolean; // Ø¯ÙˆØ®Ø©
    nasalObstruction: boolean; // Ø§Ù†Ø³Ø¯Ø§Ø¯ Ø£Ù†Ù
    nasalDischarge: boolean;
    sneezing: boolean;
    soreThroat: boolean;
    voiceChange: boolean; // ØªØºÙŠØ± ØµÙˆØª
    dysphagia: boolean; // ØµØ¹ÙˆØ¨Ø© Ø¨Ù„Ø¹
    snoring: boolean;
    sleepApnea: boolean;
    facialPain: boolean;
    headache: boolean;
    nosebleeds: boolean; // Ø±Ø¹Ø§Ù
    lossOfSmell: boolean; // ÙÙ‚Ø¯Ø§Ù† Ø´Ù…
    neckMass: boolean; // ÙƒØªÙ„Ø© Ø¨Ø§Ù„Ø±Ù‚Ø¨Ø©
    other?: string;
  };
  
  // Previous ENT Treatment
  previousENTTreatment: boolean;
  previousENTDetails?: string;
  previousENTSurgery: boolean;
  previousENTSurgeryDetails?: string;
  
  // Notes
  notes?: string;
}

// --- Form 2: Follow-up Questionnaire (Ø§Ø³ØªØ¨ÙŠØ§Ù† Ù…Ø±Ø§Ø¬Ø¹Ø©) ---
export interface ENTFollowUpForm {
  id?: string;
  patientId: string;
  visitId?: string;
  createdAt?: number;
  
  // Follow-up Assessment
  followUpReason: string;
  previousDiagnosis: string;
  treatmentCompliance: 'full' | 'partial' | 'none';
  treatmentComplianceNotes?: string;
  
  // Symptom Assessment
  symptomChange: 'improved' | 'same' | 'worsened' | 'new_symptoms';
  currentSymptoms: string;
  newSymptoms?: string;
  
  // Medication Review
  medicationEffectiveness: 'effective' | 'partially' | 'not_effective';
  sideEffects: boolean;
  sideEffectsDetails?: string;
  
  // Post-Surgery follow-up (if applicable)
  isSurgicalFollowUp: boolean;
  surgeryDate?: string;
  surgeryType?: string;
  healingAssessment?: 'good' | 'moderate' | 'poor';
  complications?: string;
  
  notes?: string;
}

// --- Form 3: Audiogram (ÙØ­Øµ Ø³Ù…Ø¹) ---
export interface AudiogramFrequencyData {
  hz250?: number;
  hz500?: number;
  hz1000?: number;
  hz2000?: number;
  hz4000?: number;
  hz8000?: number;
}

export interface AudiogramResult {
  id?: string;
  patientId: string;
  visitId?: string;
  createdAt?: number;
  testDate: number;
  
  // Air Conduction (dB)
  rightEarAC: AudiogramFrequencyData;
  leftEarAC: AudiogramFrequencyData;
  
  // Bone Conduction (dB)
  rightEarBC: AudiogramFrequencyData;
  leftEarBC: AudiogramFrequencyData;
  
  // Speech Audiometry
  rightSRT?: number; // Speech Reception Threshold
  leftSRT?: number;
  rightSDS?: number; // Speech Discrimination Score (%)
  leftSDS?: number;
  
  // Tympanometry
  rightTympanogram?: 'A' | 'As' | 'Ad' | 'B' | 'C';
  leftTympanogram?: 'A' | 'As' | 'Ad' | 'B' | 'C';
  rightCompliance?: number;
  leftCompliance?: number;
  rightPressure?: number; // daPa
  leftPressure?: number;
  
  // Reflexes
  rightAcousticReflex?: boolean;
  leftAcousticReflex?: boolean;
  
  // OAE (Otoacoustic Emissions)
  rightOAE?: 'pass' | 'refer';
  leftOAE?: 'pass' | 'refer';
  
  // Classification
  rightHearingLevel: 'normal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' | 'profound';
  leftHearingLevel: 'normal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' | 'profound';
  hearingLossType?: 'conductive' | 'sensorineural' | 'mixed';
  
  // Recommendation
  recommendation?: string;
  needsHearingAid?: boolean;
  notes?: string;
}

// --- Form 4: Balance Assessment / VNG (ÙØ­Øµ ØªÙˆØ§Ø²Ù†) ---
export interface BalanceAssessmentForm {
  id?: string;
  patientId: string;
  visitId?: string;
  createdAt?: number;
  testDate: number;
  
  // Patient Symptoms
  vertigoType: 'rotational' | 'positional' | 'constant' | 'episodic';
  vertigoDuration: string;
  vertigoFrequency: string;
  triggeredBy?: string; // head movements, standing, etc.
  associatedSymptoms: {
    nausea: boolean;
    vomiting: boolean;
    hearingLoss: boolean;
    tinnitus: boolean;
    headache: boolean;
    visualDisturbance: boolean;
    fallHistory: boolean;
  };
  
  // VNG Tests
  saccadeTest?: 'normal' | 'abnormal';
  saccadeNotes?: string;
  smoothPursuitTest?: 'normal' | 'abnormal';
  smoothPursuitNotes?: string;
  gazeTest?: 'normal' | 'abnormal' | 'nystagmus_present';
  gazeNotes?: string;
  
  // Positional Testing (Dix-Hallpike)
  dixHallpikeRight?: 'positive' | 'negative';
  dixHallpikeLeft?: 'positive' | 'negative';
  nystagmusDirection?: string;
  
  // Caloric Test
  caloricRight?: 'normal' | 'hypoactive' | 'hyperactive' | 'areflexic';
  caloricLeft?: 'normal' | 'hypoactive' | 'hyperactive' | 'areflexic';
  caloricAsymmetry?: number; // percentage
  
  // BPPV Assessment
  bppvDiagnosis?: boolean;
  bppvCanal?: 'posterior' | 'horizontal' | 'anterior';
  bppvSide?: 'right' | 'left' | 'bilateral';
  epleyPerformed?: boolean;
  
  // Overall Assessment
  diagnosis: string;
  vestibularFunction: 'normal' | 'unilateral_weakness' | 'bilateral_weakness' | 'central';
  recommendation?: string;
  notes?: string;
}

// --- Form 5: Referral Form (Ù†Ù…ÙˆØ°Ø¬ ØªØ­ÙˆÙŠÙ„) ---
export interface ReferralForm {
  id?: string;
  patientId: string;
  visitId?: string;
  createdAt?: number;
  
  // Referring Doctor
  referringDoctorName: string;
  referringClinic: string;
  referringDoctorPhone?: string;
  
  // Referred To
  referredToDoctorName?: string;
  referredToSpecialty: string;
  referredToClinic?: string;
  referredToHospital?: string;
  
  // Clinical Information
  diagnosis: string;
  reasonForReferral: string;
  clinicalSummary: string;
  relevantFindings?: string;
  currentMedications?: string;
  
  // Attachments Reference
  attachedReports?: string[]; // audiogram IDs, balance test IDs, etc.
  
  // Urgency
  urgency: 'routine' | 'urgent' | 'emergency';
  
  notes?: string;
}
