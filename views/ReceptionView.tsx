
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { ClinicService, PatientService, AppointmentService, NotificationService, BillingService } from '../services/services';
import { api } from '../src/api';
import { useAuth } from '../context/AuthContext';
import { useClientSafe } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';
import { Clinic, Patient, Gender, Priority, Appointment, Notification, Invoice } from '../types';
import { fmtDate, fmtDateTime } from '../utils/formatters';

interface ReceptionViewProps {
    user?: any;
}

const ReceptionView: React.FC<ReceptionViewProps> = ({ user: propUser }) => {
    const client = useClientSafe()?.client || null;
    const { user: authUser } = useAuth();
    const user = propUser || authUser;
    const { t, language } = useLanguage();
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    name: '', dateOfBirth: '', phone: '', gender: 'male' as Gender,
    allergiesExists: false, allergiesDetail: '',
    chronicExists: false, chronicDetail: '',
    medsExists: false, medsDetail: '',
    surgeriesExists: false, surgeriesDetail: '', // NEW: Previous surgeries
    isPregnant: false,
    clinicId: '', priority: 'normal' as Priority, source: 'walk-in', reasonForVisit: '',
  });

  // ENT Inline Questionnaire State
  const [showENTForm, setShowENTForm] = useState(false);
  const [entPatientId, setEntPatientId] = useState('');
  const [entPatientName, setEntPatientName] = useState('');
  const [entSaving, setEntSaving] = useState(false);
  const [entForm, setEntForm] = useState({
    chiefComplaint: '',
    symptomDuration: '',
    symptomSide: 'none' as 'right' | 'left' | 'both' | 'none',
    symptoms: {
      earPain: false, hearingLoss: false, tinnitus: false, earDischarge: false,
      vertigo: false, nasalObstruction: false, nasalDischarge: false, sneezing: false,
      soreThroat: false, voiceChange: false, dysphagia: false, snoring: false,
      sleepApnea: false, facialPain: false, headache: false, nosebleeds: false,
      lossOfSmell: false, neckMass: false, other: '',
    },
    previousENTTreatment: false,
    previousENTDetails: '',
    previousENTSurgery: false,
    previousENTSurgeryDetails: '',
    notes: '',
  });

  const entSymptomLabels: Record<string, string> = {
    earPain: t('ent_ear_pain'), hearingLoss: t('ent_hearing_loss'), tinnitus: t('ent_tinnitus'),
    earDischarge: t('ent_ear_discharge'), vertigo: t('ent_vertigo'), nasalObstruction: t('ent_nasal_obstruction'),
    nasalDischarge: t('ent_nasal_discharge'), sneezing: t('ent_sneezing'), soreThroat: t('ent_sore_throat'),
    voiceChange: t('ent_voice_change'), dysphagia: t('ent_dysphagia'), snoring: t('ent_snoring'),
    sleepApnea: t('ent_sleep_apnea'), facialPain: t('ent_facial_pain'), headache: t('ent_headache'),
    nosebleeds: t('ent_nosebleeds'), lossOfSmell: t('ent_loss_of_smell'), neckMass: t('ent_neck_mass'),
  };

  const resetEntForm = () => {
    setEntForm({
      chiefComplaint: '', symptomDuration: '', symptomSide: 'none',
      symptoms: {
        earPain: false, hearingLoss: false, tinnitus: false, earDischarge: false,
        vertigo: false, nasalObstruction: false, nasalDischarge: false, sneezing: false,
        soreThroat: false, voiceChange: false, dysphagia: false, snoring: false,
        sleepApnea: false, facialPain: false, headache: false, nosebleeds: false,
        lossOfSmell: false, neckMass: false, other: '',
      },
      previousENTTreatment: false, previousENTDetails: '',
      previousENTSurgery: false, previousENTSurgeryDetails: '', notes: '',
    });
  };

  const handleEntSubmit = async () => {
    if (!entForm.chiefComplaint) return alert(t('ent_chief_complaint_enter'));
    setEntSaving(true);
    try {
      await api.post('/ent-forms/new-patient', {
        ...entForm,
        patientId: entPatientId,
        clientId: client?.id,
      });
      resetEntForm();
      setShowENTForm(false);
      setEntPatientId('');
      setEntPatientName('');
    } catch (err: any) {
      alert(err.message || t('ent_error_occurred'));
    } finally {
      setEntSaving(false);
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
    const [allApps, activeClinics, notifs, allInvoices] = await Promise.all([
        AppointmentService.getAll(user),
        ClinicService.getActive(),
        NotificationService.getPendingReminders(user),
        BillingService.getAll(user)
    ]);
    
    // STRICT FILTER: Reception should ONLY see patient-facing clinics, NOT departments.
    const patientClinics = activeClinics.filter(c => c.category === 'clinic');

    // Process Appointments
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Patient Appointments
    const todaysPatientApps = allApps.filter(a => a.date >= today.getTime() && a.date < tomorrow.getTime() && a.status === 'scheduled');

    // Sort
    const unifiedSchedule = [...todaysPatientApps].sort((a: any, b: any) => a.date - b.date);
    
    setTodaysAppointments(unifiedSchedule);
    setClinics(patientClinics);
    setNotifications(notifs);
    setInvoices(allInvoices.filter(i => i.status !== 'paid')); // Show unpaid
    
    if (patientClinics.length > 0 && !formData.clinicId) setFormData(prev => ({ ...prev, clinicId: patientClinics[0].id }));
    } catch (err) {
      console.error('[ReceptionView] Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Polling for appointments/notifs/invoices
    return () => clearInterval(interval);
  }, [user]);

  // Duplicate invoice polling removed — loadData already fetches invoices every 30s

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


    // Play notification sound when new patient arrives
    const prevPatientCountRef = React.useRef<number>(0);
    
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Pleasant notification tone
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            // Close AudioContext after sound finishes to prevent memory leak
            oscillator.onended = () => audioContext.close();
        } catch (e) {
            console.log('Audio notification not supported');
        }
    };

    // تحميل المرضى من السيرفر مع real-time subscription
    useEffect(() => {
        if (!user) return;
        
        console.log('[ReceptionView] 🔴 Setting up subscription...');
        
        const unsubscribe = PatientService.subscribe(user, (data) => {
            // التحقق من مريض جديد للصوت
            const waitingCount = data.filter(p => p.currentVisit?.status === 'waiting').length;
            if (prevPatientCountRef.current > 0 && waitingCount > prevPatientCountRef.current) {
                playNotificationSound();
            }
            prevPatientCountRef.current = waitingCount;
            
            // حفظ المرضى مباشرة - الفلترة ستحصل في activeQueue
            setPatients(data);
        });
        
        return () => {
            console.log('[ReceptionView] 🔴 Cleaning up subscription');
            unsubscribe();
        };
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.clinicId || !formData.phone || !user) return;
        
        // Generate cryptographically secure 6-digit password
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        const generatedPassword = String(100000 + (arr[0] % 900000));
        
        try {
            const patientId = await PatientService.add(user, {
                name: formData.name,
                dateOfBirth: formData.dateOfBirth || undefined,
                age: 0, // age will be calculated from dateOfBirth in pgServices
                phone: formData.phone,
                username: formData.phone, // رقم الهاتف هو username
                email: undefined,
                password: generatedPassword,
                gender: formData.gender,
                medicalProfile: {
                    allergies: { exists: formData.allergiesExists, details: formData.allergiesDetail },
                    chronicConditions: { exists: formData.chronicExists, details: formData.chronicDetail },
                    currentMedications: { exists: formData.medsExists, details: formData.medsDetail },
                    previousSurgeries: { exists: formData.surgeriesExists, details: formData.surgeriesDetail },
                    isPregnant: formData.isPregnant,
                    notes: ''
                },
                currentVisit: {
                    visitId: '',
                    clinicId: formData.clinicId,
                    date: Date.now(),
                    status: 'waiting',
                    priority: formData.priority,
                    reasonForVisit: formData.reasonForVisit,
                    source: 'walk-in'
                }
            });
            
            // Show inline ENT questionnaire after successful registration
            const registeredName = formData.name;
            
            setFormData(prev => ({ ...prev, name: '', dateOfBirth: '', phone: '', reasonForVisit: '' }));
            setIsFormOpen(false);
            // No need to manually fetch - PatientService.subscribe will auto-update
            
            // Show inline ENT form with the newly registered patient
            setEntPatientId(patientId);
            setEntPatientName(registeredName);
            resetEntForm();
            setShowENTForm(true);
        } catch (e: any) {
            alert(t('error_prefix') + (e.message || t('add_patient_failed')));
        }
    };

  const handleAppCheckIn = async (appId: string) => {
    if (!user) return;
    try {
        await AppointmentService.checkIn(user, appId);
        await loadData();
    } catch (e: any) { alert(e.message); }
  };

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'insurance' | 'cliq'>('cash');
  const [insurancePatientAmount, setInsurancePatientAmount] = useState('');
  const [insuranceCompanyAmount, setInsuranceCompanyAmount] = useState('');
  const [insuranceCompanyName, setInsuranceCompanyName] = useState('');
  const [patientPayMethod, setPatientPayMethod] = useState<'cash' | 'card'>('cash');
  const handlePayInvoice = async (amount: number) => {
      if(!user || !selectedInvoice) return;
      try {
          if (paymentMethod === 'insurance') {
              if (!insuranceCompanyName.trim()) {
                  alert(t('insurance_company_required'));
                  return;
              }
              const patientPay = parseFloat(insurancePatientAmount) || 0;
              const insurancePay = parseFloat(insuranceCompanyAmount) || 0;
              if (patientPay + insurancePay !== selectedInvoice.totalAmount) {
                  alert(t('payment_split_error'));
                  return;
              }
              await BillingService.processPayment(user, selectedInvoice.id, patientPay + insurancePay, paymentMethod, {
                  insuranceCompany: insuranceCompanyName.trim(),
                  patientShare: patientPay,
                  patientPayMethod: patientPayMethod
              });
          } else {
              await BillingService.processPayment(user, selectedInvoice.id, amount, paymentMethod);
          }
          setShowBillingModal(false);
          setSelectedInvoice(null);
          setPaymentMethod('cash');
          setInsurancePatientAmount('');
          setInsuranceCompanyAmount('');
          setInsuranceCompanyName('');
          setPatientPayMethod('cash');
          await loadData();
      } catch (e: any) {
          alert(e.message || t('payment_error'));
      }
  };

  // --- PDF GENERATOR ---
  const handlePrintInvoice = async () => {
      if (!selectedInvoice) return;
      
      // Use client (clinic) data — each clinic gets their own name/logo/address
      const clinicName = client?.name || t('rcpt_clinic_fallback');
      const clinicLogo = client?.logoUrl || '';
      const clinicAddress = client?.address || '';
      const invoiceDate = fmtDate(selectedInvoice.createdAt);
      
      const itemsHtml = selectedInvoice.items.map(item => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155">${item.description}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#334155;text-align:left;white-space:nowrap">${item.price.toFixed(2)} ${t('rcpt_currency')}</td>
        </tr>
      `).join('');

      const printHtml = `<!DOCTYPE html>
<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8"/>
  <title>${t('rcpt_invoice_title')} - ${selectedInvoice.id.slice(-8)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; background:#fff; color:#1e293b; padding:40px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:3px solid #0d9488; padding-bottom:20px; }
    .logo-img { width:60px; height:60px; border-radius:12px; margin-bottom:8px; }
    .clinic-name { font-size:22px; font-weight:800; color:#0d9488; }
    .clinic-addr { font-size:12px; color:#94a3b8; margin-top:4px; }
    .invoice-title { font-size:28px; font-weight:900; color:#1e293b; text-align:left; }
    .invoice-id { font-size:11px; color:#94a3b8; margin-top:4px; text-align:left; }
    .info-row { display:flex; justify-content:space-between; margin-bottom:24px; background:#f8fafc; padding:16px; border-radius:12px; }
    .info-label { font-size:11px; color:#94a3b8; margin-bottom:4px; }
    .info-value { font-size:16px; font-weight:700; }
    .info-right { text-align:left; }
    .info-right .info-value { font-size:14px; font-weight:600; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    thead tr { background:#f1f5f9; }
    th { padding:10px 16px; font-size:13px; font-weight:700; color:#64748b; }
    th:first-child { text-align:right; }
    th:last-child { text-align:left; width:130px; }
    .total-bar { display:flex; justify-content:space-between; align-items:center; background:#0d9488; color:#fff; padding:16px 20px; border-radius:12px; margin-top:10px; }
    .total-label { font-size:16px; font-weight:700; }
    .total-amount { font-size:24px; font-weight:900; }
    .footer { text-align:center; margin-top:30px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${clinicLogo ? `<img src="${clinicLogo}" class="logo-img"/>` : ''}
      <div class="clinic-name">${clinicName}</div>
      ${clinicAddress ? `<div class="clinic-addr">${clinicAddress}</div>` : ''}
    </div>
    <div>
      <div class="invoice-title">${t('rcpt_invoice_title')}</div>
      <div class="invoice-id">#${selectedInvoice.id.slice(-8)}</div>
    </div>
  </div>

  <div class="info-row">
    <div>
      <div class="info-label">${t('rcpt_patient_name')}</div>
      <div class="info-value">${selectedInvoice.patientName}</div>
    </div>
    <div class="info-right">
      <div class="info-label">${t('rcpt_date')}</div>
      <div class="info-value">${invoiceDate}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>${t('rcpt_description')}</th><th>${t('rcpt_amount')}</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="total-bar">
    <div class="total-label">${t('rcpt_total')}</div>
    <div class="total-amount">${selectedInvoice.totalAmount.toFixed(2)} ${t('rcpt_currency')}</div>
  </div>

  <div class="footer">${t('rcpt_thank_you')} ${clinicName}</div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
          printWindow.document.write(printHtml);
          printWindow.document.close();
      } else {
          alert(t('allow_popups'));
      }
  };

  const openQueueWindow = () => {
      try { const fullUrl = window.location.origin + '/queue-display'; window.open(fullUrl, 'MedCoreQueue', 'width=1000,height=800'); } catch (e) { alert("Cannot open window."); }
  };

  // السكرتيرة تشوف فقط المرضى المنتظرين (لم يبدأ الدكتور معهم بعد)
  const activeQueue = React.useMemo(() => {
    const filtered = patients.filter(p => 
      p.currentVisit.visitId && 
      p.currentVisit.visitId.trim() !== '' && 
      p.currentVisit.status === 'waiting'  // فقط المنتظرين
    );
    console.log('[ReceptionView] activeQueue recalculated:', {
      totalPatients: patients.length,
      waitingCount: filtered.length,
      patients: filtered.map(p => ({ id: p.id, name: p.name, status: p.currentVisit.status }))
    });
    return filtered;
  }, [patients]);

  // Time formatting for the fancy clock
  const hh = String(currentTime.getHours()).padStart(2, '0');
  const mm = String(currentTime.getMinutes()).padStart(2, '0');
  const ss = currentTime.getSeconds();
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdays[currentTime.getDay()];

  return (
    <Layout title={t('reception_desk')}>
      <div className="flex flex-col gap-6 md:gap-10 max-w-7xl mx-auto relative">
        
        {/* NOTIFICATIONS & BILLING BAR */}
        <div className="flex justify-end gap-4 mb-2">
            <button onClick={() => setShowBillingModal(true)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 relative">
                <i className="fa-solid fa-cash-register"></i> {t('billing')}
                {invoices.length > 0 && <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] absolute -top-2 -right-2">{invoices.length}</span>}
            </button>
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2 relative">
                <i className="fa-solid fa-bell"></i> {t('alerts')}
                {notifications.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-3 animate-ping"></span>}
            </button>
        </div>

        {/* NOTIFICATION PANEL */}
        {showNotifPanel && (
            <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in-down">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-sm text-slate-700">{t('pending_reminders')}</div>
                <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? <div className="p-6 text-center text-xs text-slate-400">{t('no_new_alerts')}</div> : (
                        notifications.map(n => (
                            <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-amber-50 transition-colors cursor-pointer" onClick={() => { NotificationService.markAsRead(user!, n.id); loadData(); }}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-primary">{n.title}</span>
                                    <span className="text-[10px] text-slate-400">{fmtDate(n.dueDate || 0)}</span>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed">{n.message}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* BILLING MODAL */}
        {showBillingModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                    <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
                        <h3 className="font-bold">{t('pending_invoices')}</h3>
                        <button onClick={() => { setShowBillingModal(false); setSelectedInvoice(null); }}><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="p-6">
                        {selectedInvoice ? (
                            <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-slate-100 relative">
                                    {/* Print Button */}
                                    <button onClick={handlePrintInvoice} className="absolute top-0 right-0 text-slate-400 hover:text-primary" title="Print Invoice PDF">
                                        <i className="fa-solid fa-print text-xl"></i>
                                    </button>
                                    
                                    <div className="text-sm font-bold text-primary mt-1 mb-2 text-xl">{selectedInvoice.patientName}</div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 mb-4">
                                        {selectedInvoice.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                                                <span>{item.description}</span>
                                                <span className="font-mono font-bold">{item.price} {t('rcpt_currency')}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm text-slate-400 uppercase">{t('total_due')}</div>
                                    <div className="text-4xl font-bold text-slate-800">{selectedInvoice.totalAmount} {t('rcpt_currency')}</div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    {([['cash', 'fa-money-bill-wave', t('cash')], ['card', 'fa-credit-card', t('card')], ['cliq', 'fa-bolt', 'CliQ'], ['insurance', 'fa-shield-heart', t('insurance')]] as const).map(([method, icon, label]) => (
                                        <button key={method} onClick={() => setPaymentMethod(method)} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                                            paymentMethod === method
                                                ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/50'
                                        }`}>
                                            <i className={`fa-solid ${icon}`}></i> {label}
                                        </button>
                                    ))}
                                </div>
                                {paymentMethod === 'insurance' && (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 mb-3">
                                        <div className="text-sm font-bold text-blue-700 text-center mb-2">
                                            <i className="fa-solid fa-shield-heart ml-1"></i> {t('amount_distribution')}
                                        </div>
                                        {/* Insurance Company Name */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">{t('insurance_company_name')}</label>
                                            <input
                                                type="text"
                                                value={insuranceCompanyName}
                                                onChange={(e) => setInsuranceCompanyName(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                                                placeholder={t('insurance_company_placeholder')}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-1">{t('patient_share')}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={insurancePatientAmount}
                                                    onChange={(e) => {
                                                        setInsurancePatientAmount(e.target.value);
                                                        const patVal = parseFloat(e.target.value) || 0;
                                                        setInsuranceCompanyAmount((selectedInvoice.totalAmount - patVal).toFixed(2));
                                                    }}
                                                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-center font-bold text-lg focus:border-blue-500 focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-600 mb-1">{t('insurance_share')}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={insuranceCompanyAmount}
                                                    onChange={(e) => {
                                                        setInsuranceCompanyAmount(e.target.value);
                                                        const insVal = parseFloat(e.target.value) || 0;
                                                        setInsurancePatientAmount((selectedInvoice.totalAmount - insVal).toFixed(2));
                                                    }}
                                                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-center font-bold text-lg focus:border-blue-500 focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        {/* Patient Pay Method */}
                                        {parseFloat(insurancePatientAmount) > 0 && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-2">{t('patient_pay_method')}</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setPatientPayMethod('cash')} className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all border-2 ${
                                                        patientPayMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400'
                                                    }`}>
                                                        <i className="fa-solid fa-money-bill-wave"></i> {t('cash')}
                                                    </button>
                                                    <button onClick={() => setPatientPayMethod('card')} className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all border-2 ${
                                                        patientPayMethod === 'card' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400'
                                                    }`}>
                                                        <i className="fa-solid fa-credit-card"></i> {t('card')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-center text-xs text-slate-500">
                                            {t('total_label')}: <span className={`font-bold ${(parseFloat(insurancePatientAmount) || 0) + (parseFloat(insuranceCompanyAmount) || 0) === selectedInvoice.totalAmount ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {((parseFloat(insurancePatientAmount) || 0) + (parseFloat(insuranceCompanyAmount) || 0)).toFixed(2)}
                                            </span> / {selectedInvoice.totalAmount.toFixed(2)} {t('rcpt_currency')}
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => handlePayInvoice(selectedInvoice.totalAmount)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg">
                                    <i className="fa-solid fa-check-circle mr-2"></i> {t('confirm_payment')}
                                </button>
                                <button onClick={() => setSelectedInvoice(null)} className="w-full text-slate-400 text-sm hover:text-slate-600">{t('back_to_list')}</button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {invoices.length === 0 ? <div className="text-center py-10 text-slate-400">{t('no_pending_invoices')}</div> : invoices.map(inv => (
                                    <div key={inv.id}
                                        className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:border-primary cursor-pointer transition-colors select-none"
                                        onClick={() => setSelectedInvoice(inv)}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800">{inv.patientName}</div>
                                            <div className="text-xs text-slate-500">{fmtDate(inv.createdAt)} • {inv.items.length} items</div>
                                        </div>
                                        <div className="font-bold text-lg text-emerald-600">{inv.totalAmount} {t('rcpt_currency')}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
             </div>
        )}

        {/* 1. FUTURISTIC MEDICAL HOLOGRAPHIC CLOCK WIDGET */}
        <div dir="ltr" className="relative rounded-[2rem] md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,145,178,0.2)] bg-[#0a0f16] border border-amber-900/50 h-[220px] md:h-[280px] group select-none flex items-center">
             
             {/* Holographic Background & Grid */}
             <div className="absolute inset-0 pointer-events-none">
                 {/* Deep Space Glow */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[150%] bg-amber-500/10 blur-[120px] rounded-full"></div>
                 
                 {/* Hex Grid Overlay */}
                 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413263' viewBox='0 0 60 103.92304845413263' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413263L0 86.60254037844386L0 51.96152422706631L30 34.64101615137755L60 51.96152422706631L60 86.60254037844386Z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3Cpath d='M30 51.96152422706631L0 34.64101615137755L0 0L30 -17.32050807568877L60 0L60 34.64101615137755Z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '60px 103.9px' }}></div>
                 
                 {/* Animated Medical Rings (Center-Right Background) */}
                 <div className="absolute top-1/2 right-[25%] -translate-y-1/2 w-64 h-64 opacity-20">
                     <div className="absolute inset-0 border-2 border-dashed border-amber-500 rounded-full animate-[spin_20s_linear_infinite]"></div>
                     <div className="absolute inset-4 border border-amber-500/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                     <div className="absolute inset-8 border-4 border-t-amber-400 border-r-transparent border-b-amber-400 border-l-transparent rounded-full animate-[spin_10s_linear_infinite]"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                         <img src="/logo.png" alt="TKC" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse" />
                     </div>
                 </div>

                 {/* Multi-layered Sine Waves (Bottom) */}
                 <div className="absolute bottom-0 left-0 w-full h-24 opacity-40 flex flex-col justify-end overflow-hidden">
                     <svg viewBox="0 0 2000 100" className="w-[200%] h-full absolute bottom-0 left-0 animate-[wave_8s_linear_infinite]" preserveAspectRatio="none">
                         <path d="M0,50 Q250,0 500,50 T1000,50 T1500,50 T2000,50" fill="none" stroke="#f59e0b" strokeWidth="2" className="opacity-50" />
                     </svg>
                     <svg viewBox="0 0 2000 100" className="w-[200%] h-full absolute bottom-0 left-0 animate-[wave_6s_linear_infinite_reverse]" preserveAspectRatio="none">
                         <path d="M0,50 Q250,100 500,50 T1000,50 T1500,50 T2000,50" fill="none" stroke="#d97706" strokeWidth="2" className="opacity-30" />
                     </svg>
                     <style>{`
                         @keyframes wave {
                             0% { transform: translateX(0); }
                             100% { transform: translateX(-50%); }
                         }
                     `}</style>
                 </div>
             </div>
             
             {/* Main Content Container */}
             <div className="relative z-10 w-full px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                 
                 {/* Left Side: Holographic Time Display */}
                 <div className="flex flex-col items-center md:items-start relative">
                     {/* Decorative Tech Accents */}
                     <div className="absolute -top-6 -left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/50"></div>
                     <div className="absolute -bottom-6 -right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/50"></div>
                     
                     <div className="flex items-baseline gap-2 text-white">
                         <span className="text-7xl md:text-[8rem] font-light tracking-tighter leading-none">
                             {hh}
                         </span>
                         <span className="text-5xl md:text-7xl font-light text-amber-500/50 animate-pulse leading-none mb-4 md:mb-8 mx-1">:</span>
                         <span className="text-7xl md:text-[8rem] font-light tracking-tighter leading-none">
                             {mm}
                         </span>
                     </div>
                     
                     {/* High-Tech Seconds Progress */}
                     <div className="flex items-center gap-4 mt-2 md:mt-4 w-full max-w-[320px]">
                         <div className="text-amber-400 font-mono text-xl md:text-2xl font-bold w-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">{String(ss).padStart(2, '0')}</div>
                         <div className="flex-1 flex gap-1 h-2">
                             {/* Segmented Progress Bar */}
                             {[...Array(30)].map((_, i) => (
                                 <div 
                                     key={i} 
                                     className={`flex-1 h-full rounded-sm transition-all duration-300 ${i < (ss / 2) ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-amber-950/50'}`}
                                 ></div>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Right Side: Medical HUD Stats */}
                 <div className="hidden md:flex flex-col items-end text-right z-20">
                     {/* Client Name & System Status (Moved to Right) */}
                     <div className="flex items-center gap-3 mb-6 justify-end">
                         <div className="flex flex-col text-right">
                             <span className="text-white font-bold text-sm md:text-base tracking-widest uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                 {client?.name || 'TKC'}
                             </span>
                             <span className="text-amber-500/70 text-[10px] font-mono tracking-[0.3em] uppercase">
                                 Reception System // Active
                             </span>
                         </div>
                         <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-950 border border-amber-500/50">
                             <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping absolute"></span>
                             <span className="w-2 h-2 bg-amber-400 rounded-full relative"></span>
                         </div>
                     </div>
                     
                     {/* Date Display */}
                     <div className="text-3xl md:text-4xl font-bold text-white tracking-wide mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                         {dayName}
                     </div>
                     <div className="text-lg md:text-xl text-amber-500/80 font-mono uppercase tracking-widest flex items-center gap-3">
                         {fmtDate(currentTime)}
                     </div>
                     
                     {/* HUD Data Modules */}
                     <div className="flex gap-4 mt-8">
                         {/* Waiting Module */}
                         <div className="relative bg-[#0f172a]/80 border-l-2 border-amber-500 pl-4 pr-6 py-3 flex items-center gap-4 backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/50"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/50"></div>
                            <div className="text-amber-400 text-2xl"><i className="fa-solid fa-users-viewfinder"></i></div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="font-mono text-white text-2xl font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{String(activeQueue.length).padStart(2, '0')}</span>
                                <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mt-1">{t('waiting_label')}</span>
                            </div>
                         </div>
                         
                         {/* Clinics Module */}
                         <div className="relative bg-[#0f172a]/80 border-l-2 border-amber-500 pl-4 pr-6 py-3 flex items-center gap-4 backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/50"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/50"></div>
                            <div className="text-amber-400 text-2xl"><i className="fa-solid fa-network-wired"></i></div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="font-mono text-white text-2xl font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{String(clinics.length).padStart(2, '0')}</span>
                                <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mt-1">{t('clinics_label')}</span>
                            </div>
                         </div>
                     </div>
                 </div>

             </div>
             
             {/* Glitch/Scan Overlay */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(245,158,11,0.05)_50%)] bg-[length:100%_4px] z-50 opacity-20"></div>
        </div>

        {/* ... [Rest of the file remains same] ... */}
        {/* 2. Intake Form */}
        <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-soft border border-slate-100 overflow-hidden transition-all duration-300">
            <button onClick={() => setIsFormOpen(!isFormOpen)} className={`w-full p-5 md:p-6 flex justify-between items-center transition-colors ${isFormOpen ? 'bg-slate-50 border-b border-gray-100' : 'bg-white'}`}>
                <div className="flex items-center gap-3 md:gap-4">
                   <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-lg ${isFormOpen ? 'bg-primary text-white scale-105' : 'bg-primary/10 text-primary'}`}><i className="fa-solid fa-file-pen text-base md:text-xl"></i></div>
                   <div className="text-left rtl:text-right">
                       <h2 className="font-bold text-slate-800 text-lg md:text-xl">{t('new_patient')}</h2>
                       <p className="text-[10px] md:text-sm text-slate-400">{isFormOpen ? t('fill_intake') : t('click_register')}</p>
                   </div>
                </div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-100 flex items-center justify-center text-slate-400 transition-transform duration-300 ${isFormOpen ? 'rotate-180 bg-slate-200' : ''}`}><i className="fa-solid fa-chevron-down"></i></div>
            </button>
            
            {isFormOpen && (
                <div className="animate-fade-in-down overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 bg-slate-50/50">
                      <div className="space-y-6">
                         <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 mb-2"><span className="w-1 h-4 bg-primary rounded-full"></span> {t('personal_info')}</h3>
                            <input type="text" placeholder={t('full_name')} className="input-modern" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                 <input type="date" placeholder={t('date_of_birth')} className="input-modern" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
                                 <select className="input-modern" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}><option value="male">{t('male')}</option><option value="female">{t('female')}</option></select>
                            </div>
                            <input type="tel" placeholder={t('phone')} className="input-modern" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                         </div>
                         <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                             <select className="input-modern" value={formData.clinicId} onChange={e => setFormData({...formData, clinicId: e.target.value})}>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                             
                             {/* Priority Toggle */}
                             <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">{t('priority')}</label>
                                <div className="flex gap-2">
                                   <button type="button" onClick={() => setFormData({...formData, priority: 'normal' as Priority})}
                                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.priority === 'normal' ? 'bg-green-100 text-green-800 border-2 border-green-400 shadow-sm' : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'}`}>
                                      <i className="fa-solid fa-user"></i> {t('normal')}
                                   </button>
                                   <button type="button" onClick={() => setFormData({...formData, priority: 'urgent' as Priority})}
                                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.priority === 'urgent' ? 'bg-red-100 text-red-800 border-2 border-red-400 shadow-sm animate-pulse' : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'}`}>
                                      <i className="fa-solid fa-bolt"></i> {t('urgent')}
                                   </button>
                                </div>
                             </div>

                             <input type="text" placeholder={t('reason_visit')} className="input-modern" value={formData.reasonForVisit} onChange={e => setFormData({...formData, reasonForVisit: e.target.value})} />
                         </div>
                      </div>

                      <div className="flex flex-col h-full gap-6">
                          <div className="bg-rose-50/50 p-5 md:p-6 rounded-2xl border border-rose-100 flex-1 space-y-4">
                             <h3 className="text-[10px] font-bold uppercase text-rose-700 flex items-center gap-2 mb-4"><span className="w-1 h-4 bg-rose-500 rounded-full"></span> {t('medical_intake')}</h3>
                             {['allergies', 'chronic', 'meds', 'surgeries'].map((key) => (
                                 <div key={key} className="bg-white/70 p-3 rounded-xl border border-rose-100/30" data-field={key}>
                                    <div className="flex items-center gap-3 mb-2"><input type="checkbox" checked={(formData as any)[`${key}Exists`]} onChange={e => setFormData({...formData, [`${key}Exists`]: e.target.checked})} className="w-5 h-5 text-rose-600 rounded-md" /><label className="text-xs font-bold text-slate-700 capitalize">{t(key as any)}</label></div>
                                    {(formData as any)[`${key}Exists`] && <input type="text" placeholder="..." className="w-full bg-white border border-rose-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-rose-200" value={(formData as any)[`${key}Detail`]} onChange={e => setFormData({...formData, [`${key}Detail`]: e.target.value})} />}
                                 </div>
                             ))}
                          </div>
                          
                          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl transition-all hover:bg-primary transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"><i className="fa-solid fa-check-circle"></i> {t('register_patient')}</button>
                      </div>
                    </form>
                </div>
            )}
        </div>

        {/* Inline ENT New Patient Questionnaire - appears after registration */}
        {showENTForm && (
        <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-soft border-2 border-amber-300 overflow-hidden animate-fade-in-down">
            <div className="p-5 md:p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-sky-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500 to-sky-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-clipboard-list text-xl"></i></div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">{t('ent_new_patient_title')}</h2>
                        <p className="text-sm text-slate-500">{entPatientName}</p>
                    </div>
                </div>
                <button onClick={() => { setShowENTForm(false); resetEntForm(); }} className="text-slate-400 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50" title={t('skip')}>
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            <div className="p-5 md:p-6 space-y-5">
                {/* Chief Complaint */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="fa-solid fa-comment-medical text-red-500"></i> {t('ent_chief_complaint')}</h3>
                    <textarea value={entForm.chiefComplaint} onChange={e => setEntForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                        rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_chief_complaint_placeholder')} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={entForm.symptomDuration} onChange={e => setEntForm(f => ({ ...f, symptomDuration: e.target.value }))}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_symptom_duration_placeholder')} />
                        <div className="flex gap-2 flex-wrap">
                            {(['right', 'left', 'both', 'none'] as const).map(side => (
                                <button key={side} type="button" onClick={() => setEntForm(f => ({ ...f, symptomSide: side }))}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium transition ${entForm.symptomSide === side ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {{ right: t('ent_side_right'), left: t('ent_side_left'), both: t('ent_side_both'), none: t('ent_side_none') }[side]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Symptoms Checklist */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="fa-solid fa-list-check text-amber-500"></i> {t('ent_symptoms_checklist')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(entSymptomLabels).map(([key, label]) => (
                            <button key={key} type="button" onClick={() => setEntForm(f => ({ ...f, symptoms: { ...f.symptoms, [key]: !f.symptoms[key as keyof typeof f.symptoms] } }))}
                                className={`p-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                                    entForm.symptoms[key as keyof typeof entForm.symptoms]
                                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                <i className={`fa-solid ${entForm.symptoms[key as keyof typeof entForm.symptoms] ? 'fa-square-check text-red-500' : 'fa-square text-slate-400'}`}></i>
                                {label}
                            </button>
                        ))}
                    </div>
                    <input type="text" value={entForm.symptoms.other || ''} onChange={e => setEntForm(f => ({ ...f, symptoms: { ...f.symptoms, other: e.target.value } }))}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_other_symptoms_placeholder')} />
                </div>

                {/* Previous ENT Treatment */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="fa-solid fa-clock-rotate-left text-purple-500"></i> {t('ent_previous_treatment')}</h3>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={entForm.previousENTTreatment} onChange={e => setEntForm(f => ({ ...f, previousENTTreatment: e.target.checked }))} className="w-5 h-5 rounded text-amber-500" />
                            <span className="text-sm text-slate-700">{t('ent_prev_ent_treatment')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={entForm.previousENTSurgery} onChange={e => setEntForm(f => ({ ...f, previousENTSurgery: e.target.checked }))} className="w-5 h-5 rounded text-amber-500" />
                            <span className="text-sm text-slate-700">{t('ent_prev_ent_surgery')}</span>
                        </label>
                    </div>
                    {entForm.previousENTTreatment && (
                        <textarea value={entForm.previousENTDetails} onChange={e => setEntForm(f => ({ ...f, previousENTDetails: e.target.value }))}
                            rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_prev_treatment_details')} />
                    )}
                    {entForm.previousENTSurgery && (
                        <textarea value={entForm.previousENTSurgeryDetails} onChange={e => setEntForm(f => ({ ...f, previousENTSurgeryDetails: e.target.value }))}
                            rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_prev_surgery_details')} />
                    )}
                </div>

                {/* Notes */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2"><i className="fa-solid fa-note-sticky text-green-500"></i> {t('ent_additional_notes')}</h3>
                    <textarea value={entForm.notes || ''} onChange={e => setEntForm(f => ({ ...f, notes: e.target.value }))}
                        rows={2} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800" placeholder={t('ent_any_additional_notes')} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleEntSubmit} disabled={entSaving}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-sky-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                        {entSaving ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('ent_saving')}</> : <><i className="fa-solid fa-save"></i> {t('ent_save_questionnaire')}</>}
                    </button>
                    <button type="button" onClick={() => { setShowENTForm(false); resetEntForm(); }}
                        className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2">
                        <i className="fa-solid fa-forward"></i> {t('skip')}
                    </button>
                </div>
            </div>
        </div>
        )}

        {/* ENT Medical Forms Quick Access */}
        <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-amber-50/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center"><i className="fa-solid fa-stethoscope"></i></div>
                    <div><h2 className="font-bold text-slate-800 leading-tight">{t('ent_forms_title')}</h2><p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('ent_forms_subtitle')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { path: 'ent/new-patient', icon: 'fa-file-medical', label: t('new_patient_questionnaire'), color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                        { path: 'ent/follow-up', icon: 'fa-file-lines', label: t('follow_up_patient'), color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
                    ].map(item => {
                        return (
                            <a key={item.path} href={`/${item.path}`}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${item.color}`}>
                                <i className={`fa-solid ${item.icon} text-2xl`}></i>
                                <span className="text-xs font-bold leading-tight">{item.label}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* 3. Stacked Sections: Queue (Top) and Appointments (Bottom) */}
        <div className="flex flex-col gap-10">
            
            {/* --- QUEUE DISPLAY (PRIORITY #1) --- */}
            <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center"><i className="fa-solid fa-people-group"></i></div>
                        <div><h2 className="font-bold text-slate-800 leading-tight">{t('todays_queue')}</h2><p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('currently_waiting')}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={openQueueWindow} className="hidden sm:block text-[11px] font-bold text-emerald-600 bg-emerald-100/50 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all uppercase"><i className="fa-solid fa-desktop mr-1"></i> {t('open_queue_screen')}</button>
                        <span className="bg-slate-900 text-white text-xs px-4 py-2 rounded-xl font-bold shadow-lg">{activeQueue.length}</span>
                    </div>
                </div>
                <div className="p-4 md:p-6 overflow-auto max-h-[600px]">
                    {activeQueue.length === 0 ? (
                        <div className="text-center py-20 text-slate-300 flex flex-col items-center opacity-40"><i className="fa-solid fa-mug-hot text-5xl mb-4"></i><span className="font-bold uppercase text-[12px] tracking-widest">{t('no_active_patients')}</span></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {activeQueue.map(p => {
                                const clinic = clinics.find(c => c.id === p.currentVisit.clinicId);
                                const isUrgent = p.currentVisit.priority === 'urgent';
                                return (
                                    <div key={p.id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between group hover:shadow-xl ${isUrgent ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:scale-110 transition-transform ${isUrgent ? 'bg-red-500' : 'bg-slate-800'}`}>{(p?.name || p?.email || "U").charAt(0)}</div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-800 truncate text-lg">{p.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{clinic?.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-end shrink-0">
                                            <div className="text-[12px] font-bold text-slate-900">{new Date(p.currentVisit.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</div>
                                            <div className={`text-[9px] font-extrabold uppercase px-3 py-1 rounded-full mt-2 inline-block ${p.currentVisit.status === 'in-progress' ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>{p.currentVisit.status}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* --- TODAYS APPOINTMENTS & CLASSES (PRIORITY #2) --- */}
            <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center"><i className="fa-regular fa-calendar-check"></i></div>
                        <div><h2 className="font-bold text-slate-800 leading-tight">{t('scheduled_today')}</h2><p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('appointments_classes')}</p></div>
                    </div>
                    <span className="bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold shadow-lg">{todaysAppointments.length}</span>
                </div>
                <div className="p-4 md:p-6 overflow-auto max-h-[500px]">
                    {todaysAppointments.length === 0 ? (
                        <div className="text-center py-20 text-slate-300 flex flex-col items-center opacity-40"><i className="fa-solid fa-calendar-day text-5xl mb-4"></i><span className="font-bold uppercase text-[12px] tracking-widest">{t('no_schedule_today')}</span></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {todaysAppointments.map(app => (
                                <div key={app.id} className={`flex items-center justify-between p-5 border rounded-3xl hover:border-amber-300 transition-all group hover:shadow-xl ${app.isClass ? 'bg-purple-50 border-purple-100' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg transition-colors ${app.isClass ? 'bg-purple-600 group-hover:bg-purple-700' : 'bg-slate-900 group-hover:bg-amber-600'}`}>
                                            {app.isClass ? (
                                                <i className="fa-solid fa-chalkboard-user text-2xl"></i>
                                            ) : (
                                                <>
                                                    <span className="text-[10px] font-bold opacity-60 uppercase">{new Date(app.date).toLocaleDateString('en-GB', {month:'short'})}</span>
                                                    <span className="font-bold text-sm leading-tight">{new Date(app.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-800 truncate text-lg">{app.patientName}</div>
                                            <div className="text-[10px] text-slate-400 italic truncate font-medium">
                                                {app.isClass ? (
                                                    <span>{new Date(app.date).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})} • {app.reason}</span>
                                                ) : app.reason}
                                            </div>
                                        </div>
                                    </div>
                                    {!app.isClass && (
                                        <button onClick={() => handleAppCheckIn(app.id)} className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl text-[11px] font-extrabold uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 flex items-center gap-2">
                                            <i className="fa-solid fa-check"></i>
                                            {t('check_in_btn')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        
        @keyframes glitch {
            0% { transform: translate(0) }
            20% { transform: translate(-2px, 1px) }
            40% { transform: translate(-1px, -1px) }
            60% { transform: translate(2px, 1px) }
            80% { transform: translate(1px, -1px) }
            100% { transform: translate(0) }
        }
        
        .input-modern { width: 100%; padding: 0.875rem 1.25rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 1.25rem; font-size: 0.95rem; transition: all 0.2s; }
        .input-modern:focus { border-color: #0d9488; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1); outline: none; }
        .animate-fade-in-down { animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </Layout>
  );
};

export default ReceptionView;
