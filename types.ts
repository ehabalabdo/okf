
// =============================================
// SaaS Client (المركز كزبون)
// =============================================
export type ClientStatus = 'trial' | 'active' | 'expired' | 'suspended';

export interface ClientFeatures {
  device_results: boolean;
}

export interface Client {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  status: ClientStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  ownerUserId: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  enabledFeatures: ClientFeatures;
}

export interface SuperAdmin {
  id: number;
  username: string;
  name: string;
}

// =============================================
// User Roles & Types
// =============================================
export enum UserRole {
  ADMIN = 'admin',
  SECRETARY = 'secretary',
  DOCTOR = 'doctor'
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
  clientId?: number;
}

export interface User extends AuditMetadata {
  uid: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  clinicIds: string[];
  clientId?: number; // SaaS: which client this user belongs to
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

  // 1️⃣ Chief Complaint
  chiefComplaint?: string;

  // 2️⃣ History
  presentIllness?: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  familyHistory?: string;
  socialHistory?: string;

  // 3️⃣ Examination
  generalExamination?: string;
  vitalSigns?: VitalSigns;
  systemicExamination?: string;

  // 4️⃣ Assessment
  preliminaryDiagnosis?: string;
  differentialDiagnosis?: string;

  // 5️⃣ Plan — Orders
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
  
  // SaaS
  clientId?: number;
  
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
  clientId?: number;
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
  paymentMethod: 'cash' | 'card' | 'insurance';
  status: 'unpaid' | 'paid' | 'partial';
  clientId?: number;
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

// =============================================
// Medical Device Integration Types
// =============================================

export type DeviceType = 'cbc' | 'ecg' | 'glucose' | 'chemistry' | 'xray' | 'other';
export type DeviceConnectionType = 'lan' | 'serial' | 'hl7' | 'folder' | 'api';
export type DeviceResultStatus = 'pending' | 'matched' | 'error' | 'rejected';

export interface Device {
  id: string;
  clientId: number;
  clinicId: string;
  name: string;
  type: DeviceType;
  connectionType: DeviceConnectionType;
  ipAddress?: string;
  port?: number;
  comPort?: string;
  baudRate?: number;
  config?: Record<string, any>;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceResult {
  id: string;
  clientId: number;
  deviceId: string;
  deviceName?: string;        // Joined from devices table
  deviceType?: DeviceType;    // Joined from devices table
  patientIdentifier: string;
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  rawMessage?: string;
  status: DeviceResultStatus;
  matchedPatientId?: string;
  matchedPatientName?: string; // Joined from patients table
  matchedAt?: string;
  matchedBy?: string;
  errorMessage?: string;
  createdAt: string;
}

/** Payload sent by the clinic bridge agent */
export interface DeviceResultPayload {
  clinicId: string;
  deviceId: string;
  patientIdentifier: string;
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  rawMessage?: string;
}

/** Batch payload for sending multiple results at once */
export interface DeviceResultBatchPayload {
  clinicId: string;
  deviceId: string;
  patientIdentifier: string;
  results: Array<{
    testCode: string;
    testName?: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    isAbnormal?: boolean;
  }>;
  rawMessage?: string;
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
  workDays: number[];       // 1=Mon … 7=Sun
  startTime: string;        // "HH:MM"
  endTime: string;          // "HH:MM"
  graceMinutes: number;
  overtimeEnabled: boolean;
}

export interface HrEmployee {
  id: number;
  clientId: number;
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
  clientId: number;
  employeeRatePercent: number;
  employerRatePercent: number;
  enabled: boolean;
}

export interface HrPayrollRun {
  id: number;
  clientId: number;
  month: string;            // YYYY-MM-01
  status: PayrollRunStatus;
  createdBy?: number;
  createdAt: string;
  payslips?: HrPayslip[];
}

export interface HrPayslip {
  id: number;
  clientId: number;
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
  clientId: number;
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
  clientId: number;
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
  clientId: number;
  employeeId: number;
  message: string;
  isRead: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
}

// ===================== CATALOG =====================

export interface CatalogService {
  id: string;
  serviceName: string;
  category: string;
  price: number;
  currency: string;
  active: boolean;
  clientId: number;
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
  clientId: number;
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

// --- Form 1: New Patient Questionnaire (استبيان مريض جديد) ---
export interface ENTNewPatientForm {
  id?: string;
  patientId: string;
  clientId?: number;
  createdAt?: number;
  
  // Chief Complaint
  chiefComplaint: string;
  symptomDuration: string;
  symptomSide: 'right' | 'left' | 'both' | 'none';
  
  // ENT Symptoms Checklist
  symptoms: {
    earPain: boolean;
    hearingLoss: boolean;
    tinnitus: boolean; // طنين
    earDischarge: boolean;
    vertigo: boolean; // دوخة
    nasalObstruction: boolean; // انسداد أنف
    nasalDischarge: boolean;
    sneezing: boolean;
    soreThroat: boolean;
    voiceChange: boolean; // تغير صوت
    dysphagia: boolean; // صعوبة بلع
    snoring: boolean;
    sleepApnea: boolean;
    facialPain: boolean;
    headache: boolean;
    nosebleeds: boolean; // رعاف
    lossOfSmell: boolean; // فقدان شم
    neckMass: boolean; // كتلة بالرقبة
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

// --- Form 2: Follow-up Questionnaire (استبيان مراجعة) ---
export interface ENTFollowUpForm {
  id?: string;
  patientId: string;
  visitId?: string;
  clientId?: number;
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

// --- Form 3: Audiogram (فحص سمع) ---
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
  clientId?: number;
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

// --- Form 4: Balance Assessment / VNG (فحص توازن) ---
export interface BalanceAssessmentForm {
  id?: string;
  patientId: string;
  visitId?: string;
  clientId?: number;
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

// --- Form 5: Referral Form (نموذج تحويل) ---
export interface ReferralForm {
  id?: string;
  patientId: string;
  visitId?: string;
  clientId?: number;
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
