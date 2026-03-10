
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { ClinicService, PatientService, AppointmentService, SettingsService } from '../services/services';
import { api } from '../src/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Patient, VisitData, Appointment, Gender, Priority, PrescriptionItem, Attachment, InvoiceItem, VitalSigns, LabOrder, ImagingOrder, CatalogService, CatalogMedication } from '../types';
import { pgCatalogServices, pgCatalogMedications } from '../services/apiServices';
import DeviceResultsTimeline from '../components/DeviceResultsTimeline';
import { fmtDate } from '../utils/formatters';

// ===================== SOAP TAB TYPES =====================
type SoapTab = 'chief' | 'history' | 'exam' | 'assessment' | 'plan' | 'billing' | 'devices' | 'ent-forms';

const DoctorView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ======= SOAP FORM STATE =======
  // 1. Chief Complaint
  const [chiefComplaint, setChiefComplaint] = useState('');

  // 2. History
  const [presentIllness, setPresentIllness] = useState('');
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [socialHistory, setSocialHistory] = useState('');

  // 3. Examination
  const [generalExamination, setGeneralExamination] = useState('');
  const [systemicExamination, setSystemicExamination] = useState('');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});

  // 4. Assessment
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState('');

  // 5. Plan — Lab Orders & Imaging
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [imagingOrders, setImagingOrders] = useState<ImagingOrder[]>([]);

  // Legacy fields (kept for backward compat)
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Billing State
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedService, setSelectedService] = useState('Consultation');

  // Prescription Input State
  const [newRx, setNewRx] = useState({ name: '', dose: '', freq: '', dur: '' });
  const [rxSearch, setRxSearch] = useState('');
  const [rxDropdownOpen, setRxDropdownOpen] = useState(false);

  // Catalog data (loaded once)
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [catalogMedications, setCatalogMedications] = useState<CatalogMedication[]>([]);

  // Billing custom service
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');
  const [serviceMode, setServiceMode] = useState<'catalog' | 'custom'>('catalog');

  // Lab & Imaging Input State
  const [newLab, setNewLab] = useState({ testName: '', notes: '' });
  const [newImaging, setNewImaging] = useState({ imagingType: 'X-ray' as ImagingOrder['imagingType'], bodyPart: '', notes: '' });

  // UI State
  const [mobileTab, setMobileTab] = useState<'queue' | 'emr'>('queue');
  const [activeTab, setActiveTab] = useState<SoapTab>('chief');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labFileInputRef = useRef<HTMLInputElement>(null);
  const imagingFileInputRef = useRef<HTMLInputElement>(null);
  const [attachingLabId, setAttachingLabId] = useState<string | null>(null);
  const [attachingImagingId, setAttachingImagingId] = useState<string | null>(null);
  
  // Track previous count for doctor notifications
  const prevWaitingCountRef = useRef(0);

  // ENT Forms State
  const [entForms, setEntForms] = useState<any>(null);
  const [entLoading, setEntLoading] = useState(false);
  const [entExpanded, setEntExpanded] = useState<string | null>(null);
  const [entDetail, setEntDetail] = useState<any>(null);
  const [entDetailLoading, setEntDetailLoading] = useState(false);
  const selectedPatientRef = useRef<Patient | null>(null);
  const rxDropdownRef = useRef<HTMLDivElement>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
  }, [selectedPatient]);

  const handleSelectPatient = async (p: Patient) => {
    // أول ما الدكتور يختار المريض، يصير in-progress فوراً
    if (p.currentVisit.status === 'waiting' && user) {
      try {
        // تحديث محلي فوري
        const updatedPatient = {
          ...p,
          currentVisit: { ...p.currentVisit, status: 'in-progress' as const }
        };
        setSelectedPatient(updatedPatient);
        
        // تحديث الـ state
        setPatients(prev => prev.map(patient => 
          patient.id === p.id ? updatedPatient : patient
        ));
        
        // تحديث في Database
        await PatientService.updateStatus(user, p, 'in-progress');
        
        // Force immediate refresh from database
        if ((window as any).__patientRefresh) {
          await (window as any).__patientRefresh();
        }
      } catch (e) {
        console.error('[DoctorView] ❌ Failed to update patient status:', e);
      }
    } else {
      setSelectedPatient(p);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeQueue = PatientService.subscribe(user, (data) => {
      const waitingCount = data.filter(p => p.currentVisit.status === 'waiting').length;
      
      // Notify doctor if new waiting patients arrived
      if (waitingCount > prevWaitingCountRef.current && prevWaitingCountRef.current > 0) {
        // Play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiToIGGe87OehTg==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
        
        // Visual notification
        if (Notification.permission === 'granted') {
          new Notification(t('new_patient_waiting'), {
            body: `${t('waiting_patients_count')}: ${waitingCount}`,
            icon: '/favicon.ico'
          });
        }
      }
      
      prevWaitingCountRef.current = waitingCount;
      setPatients(data);
      
      // Real-time update for selected patient (use ref to avoid stale closure)
      const currentSelected = selectedPatientRef.current;
      if (currentSelected) {
        const updated = data.find(p => p.id === currentSelected.id);
        if (updated && updated.currentVisit.status !== currentSelected.currentVisit.status) {
          setSelectedPatient(updated);
        }
      }
    });
    
    // Store the unsubscribe function with refresh capability
    (window as any).__patientRefresh = (unsubscribeQueue as any).refresh;
    
    const loadData = async () => {
            try {
                const apps = await AppointmentService.getAll(user);
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const todayEnd = todayStart + 86400000; // +24h
                setAppointments(apps.filter(a => a.status === 'scheduled' && a.date >= todayStart && a.date < todayEnd).sort((a,b) => a.date - b.date));
            } catch {
                setAppointments([]);
            }
        };
        loadData();

    // Load catalog data for dropdowns
    const loadCatalog = async () => {
      try {
        const [svcs, meds] = await Promise.all([
          pgCatalogServices.getAll(),
          pgCatalogMedications.getAll()
        ]);
        setCatalogServices(svcs.filter((s: CatalogService) => s.active));
        setCatalogMedications(meds.filter((m: CatalogMedication) => m.active));
      } catch (e) { console.warn('Catalog load failed, using manual entry only:', e); }
    };
    loadCatalog();

    return () => unsubscribeQueue();
  }, [user]); // Only re-subscribe when user changes

  useEffect(() => {
    if (selectedPatient) {
        const v = selectedPatient.currentVisit;
        // SOAP fields
        setChiefComplaint(v.chiefComplaint || '');
        setPresentIllness(v.presentIllness || '');
        setPastMedicalHistory(v.pastMedicalHistory || '');
        setSurgicalHistory(v.surgicalHistory || '');
        setCurrentMedications(v.currentMedications || '');
        setAllergiesText(v.allergies || '');
        setFamilyHistory(v.familyHistory || '');
        setSocialHistory(v.socialHistory || '');
        setGeneralExamination(v.generalExamination || '');
        setSystemicExamination(v.systemicExamination || '');
        setVitalSigns(v.vitalSigns || {});
        setPreliminaryDiagnosis(v.preliminaryDiagnosis || '');
        setDifferentialDiagnosis(v.differentialDiagnosis || '');
        setLabOrders(v.labOrders || []);
        setImagingOrders(v.imagingOrders || []);

        // Legacy
        setDiagnosis(v.diagnosis || '');
        setNotes(v.doctorNotes || '');
        setPrescriptions(v.prescriptions || []);
        setAttachments(v.attachments || []);
        
        // Initialize billing with a default consultation if empty
        if (!v.invoiceItems || v.invoiceItems.length === 0) {
            setInvoiceItems([{ id: Date.now().toString(), description: 'Consultation', price: 50 }]);
        } else {
            setInvoiceItems(v.invoiceItems);
        }
        
        setActiveTab('chief');
        if (window.innerWidth < 1024) setMobileTab('emr');
        // Reset ENT forms when patient changes
        setEntForms(null);
        setEntExpanded(null);
        setEntDetail(null);
    }
  }, [selectedPatient?.id]); // Only re-run when a different patient is selected

  // Load ENT forms when ENT tab is active
  useEffect(() => {
    if (activeTab === 'ent-forms' && selectedPatient && !entForms && !entLoading) {
      setEntLoading(true);
      api.get(`/ent-forms/patient/${selectedPatient.id}/all`)
        .then((data: any) => setEntForms(data))
        .catch(() => setEntForms(null))
        .finally(() => setEntLoading(false));
    }
  }, [activeTab, selectedPatient?.id]);

  const handleSaveVisit = async (status: VisitData['status']) => {
    if (!selectedPatient || !user) return;
    try {
        if(status === 'completed') {
            // الإزالة الفورية من UI
            setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
        } else if (status === 'in-progress') {
            // تحديث الحالة فوراً
            setPatients(prev => prev.map(p => 
                p.id === selectedPatient.id 
                    ? { ...p, currentVisit: { ...p.currentVisit, status: 'in-progress' } }
                    : p
            ));
        }
        
        // استدعاء API - هذا رح يحدث database
        await PatientService.updateStatus(user, selectedPatient, status, {
            // SOAP data
            chiefComplaint,
            presentIllness,
            pastMedicalHistory,
            surgicalHistory,
            currentMedications,
            allergies: allergiesText,
            familyHistory,
            socialHistory,
            generalExamination,
            systemicExamination,
            vitalSigns,
            preliminaryDiagnosis,
            differentialDiagnosis,
            labOrders,
            imagingOrders,
            // Legacy + Billing
            diagnosis: preliminaryDiagnosis || diagnosis,
            doctorNotes: notes,
            prescriptions,
            attachments,
            invoiceItems
        });
        
        // CRITICAL: Force immediate refresh from database
        if ((window as any).__patientRefresh) {
            await (window as any).__patientRefresh();
        }
        
        if(status === 'completed') {
            setSelectedPatient(null);
            setMobileTab('queue');
            resetForm();
        } else if (status === 'in-progress') {
            setSelectedPatient({
                ...selectedPatient,
                currentVisit: { ...selectedPatient.currentVisit, status: 'in-progress' }
            });
        }
    } catch(e: any) { 
        console.error('[DoctorView] ❌ Save visit failed:', e);
        alert('Failed to save: ' + e.message); 
    }
  };

  // --- PDF GENERATOR ---
  const handlePrintRx = async () => {
      if (!selectedPatient || prescriptions.length === 0) return;
      const settings = await SettingsService.getSettings();
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // LOGO
      if (settings.logoUrl) {
          try {
             doc.addImage(settings.logoUrl, 'PNG', 15, 10, 20, 20); // x, y, w, h
          } catch(e) { console.error("Could not add logo", e); }
      }

      // Header
      doc.setFontSize(22);
      doc.setTextColor(13, 148, 136); // Teal color
      doc.text(settings.clinicName || "MedCore Clinic", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(settings.address || "Medical Plaza", pageWidth / 2, 26, { align: "center" });
      doc.text(settings.phone || "Tel: +1 234 567 8900", pageWidth / 2, 31, { align: "center" });
      
      // Separator
      doc.setDrawColor(200);
      doc.line(10, 35, pageWidth - 10, 35);
      
      // Info Block
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(`Dr. ${user?.name || 'Doctor'}`, 15, 45);
      doc.text(`Date: ${fmtDate(Date.now())}`, pageWidth - 15, 45, { align: "right" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Patient: ${selectedPatient.name}`, 15, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Age/Sex: ${selectedPatient.age} / ${selectedPatient.gender}`, 15, 60);
      
      // Rx Section
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 70, pageWidth - 20, 10, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PRESCRIPTION (Rx)", 15, 77);
      
      let y = 95;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      prescriptions.forEach((rx, i) => {
          doc.setFont("helvetica", "bold");
          doc.text(`${i + 1}. ${rx.drugName}`, 15, y);
          
          doc.setFont("helvetica", "normal");
          const details = `${rx.dosage}  |  ${rx.frequency}  |  ${rx.duration}`;
          doc.text(details, 20, y + 6);
          
          y += 18;
      });
      
      // Footer
      doc.setDrawColor(0);
      doc.line(15, 250, 80, 250);
      doc.setFontSize(10);
      doc.text("Doctor's Signature", 15, 255);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated by MedCore System", pageWidth / 2, 280, { align: "center" });
      
      doc.save(`Rx_${selectedPatient.name.replace(/\s/g, '_')}.pdf`);
  };

  const addPrescription = () => {
      if(!newRx.name) return;
      const item: PrescriptionItem = {
          id: Date.now().toString(),
          drugName: newRx.name,
          dosage: newRx.dose,
          frequency: newRx.freq,
          duration: newRx.dur
      };
      setPrescriptions([...prescriptions, item]);
      setNewRx({ name: '', dose: '', freq: '', dur: '' });
  };

  const removePrescription = (id: string) => {
      setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const addService = () => {
      // Look up price from catalog first
      const catalogMatch = catalogServices.find(s => s.serviceName === selectedService);
      let price = catalogMatch ? Number(catalogMatch.price) : 0;
      
      // Fallback to hardcoded defaults if no catalog
      if (!price) {
        switch(selectedService) {
            case 'Consultation': price = 50; break;
            case 'Follow-up': price = 25; break;
            case 'Ultrasound': price = 80; break;
            case 'Lab Test (Basic)': price = 40; break;
            case 'X-Ray': price = 60; break;
            case 'Minor Surgery': price = 150; break;
            default: price = 0;
        }
      }
      const newItem: InvoiceItem = {
          id: Date.now().toString(),
          description: selectedService,
          price: price
      };
      setInvoiceItems([...invoiceItems, newItem]);
  };

  const removeService = (id: string) => {
      setInvoiceItems(invoiceItems.filter(i => i.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const newAtt: Attachment = {
                      id: Date.now().toString(),
                      name: file.name,
                      type: file.type.includes('image') ? 'image' : 'pdf',
                      url: ev.target.result as string,
                      date: Date.now()
                  };
                  setAttachments([...attachments, newAtt]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // ===================== RESET FORM =====================
  const resetForm = () => {
    setChiefComplaint(''); setPresentIllness(''); setPastMedicalHistory('');
    setSurgicalHistory(''); setCurrentMedications(''); setAllergiesText('');
    setFamilyHistory(''); setSocialHistory(''); setGeneralExamination('');
    setSystemicExamination(''); setVitalSigns({}); setPreliminaryDiagnosis('');
    setDifferentialDiagnosis(''); setLabOrders([]); setImagingOrders([]);
    setDiagnosis(''); setNotes(''); setPrescriptions([]); setAttachments([]); setInvoiceItems([]);
  };

  // ===================== LAB ORDERS =====================
  const addLabOrder = () => {
    if (!newLab.testName) return;
    setLabOrders([...labOrders, {
      id: Date.now().toString(), testName: newLab.testName,
      notes: newLab.notes || undefined, status: 'Pending', createdAt: Date.now()
    }]);
    setNewLab({ testName: '', notes: '' });
  };
  const removeLabOrder = (id: string) => setLabOrders(labOrders.filter(l => l.id !== id));
  const toggleLabStatus = (id: string) => setLabOrders(labOrders.map(l => l.id === id ? { ...l, status: l.status === 'Pending' ? 'Completed' : 'Pending' } : l));

  const handleLabFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && attachingLabId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setLabOrders(labOrders.map(l => l.id === attachingLabId ? { ...l, resultFileUrl: ev.target!.result as string, status: 'Completed' } : l));
          setAttachingLabId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ===================== IMAGING ORDERS =====================
  const addImagingOrder = () => {
    if (!newImaging.bodyPart) return;
    setImagingOrders([...imagingOrders, {
      id: Date.now().toString(), imagingType: newImaging.imagingType,
      bodyPart: newImaging.bodyPart, notes: newImaging.notes || undefined,
      status: 'Pending', createdAt: Date.now()
    }]);
    setNewImaging({ imagingType: 'X-ray', bodyPart: '', notes: '' });
  };
  const removeImagingOrder = (id: string) => setImagingOrders(imagingOrders.filter(i => i.id !== id));
  const toggleImagingStatus = (id: string) => setImagingOrders(imagingOrders.map(i => i.id === id ? { ...i, status: i.status === 'Pending' ? 'Completed' : 'Pending' } : i));

  const handleImagingFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && attachingImagingId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagingOrders(imagingOrders.map(i => i.id === attachingImagingId ? { ...i, reportFileUrl: ev.target!.result as string, status: 'Completed' } : i));
          setAttachingImagingId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const waitingList = patients.filter(p => 
    p.currentVisit.visitId && 
    p.currentVisit.visitId.trim() !== '' && 
    (p.currentVisit.status === 'waiting' || p.currentVisit.status === 'in-progress')
  );

  // ===================== TAB CONFIG =====================
  // ENT Detail Field helper
  const EntField = ({ label, value, span2 }: { label: string, value: any, span2?: boolean }) => (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</div>
      <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2 border border-slate-100">{value || '—'}</div>
    </div>
  );

  const tabs: { key: SoapTab; label: string; icon: string; color: string }[] = [
    { key: 'ent-forms', label: t('ent_forms_tab'), icon: 'fa-stethoscope', color: 'bg-amber-600' },
    { key: 'chief', label: t('chief_complaint'), icon: 'fa-comment-medical', color: 'bg-slate-800' },
    { key: 'history', label: t('history'), icon: 'fa-clock-rotate-left', color: 'bg-amber-600' },
    { key: 'exam', label: t('examination'), icon: 'fa-stethoscope', color: 'bg-amber-600' },
    { key: 'assessment', label: t('assessment'), icon: 'fa-diagnoses', color: 'bg-purple-600' },
    { key: 'plan', label: t('plan_orders'), icon: 'fa-clipboard-list', color: 'bg-amber-600' },
    { key: 'billing', label: t('billing_tab'), icon: 'fa-file-invoice-dollar', color: 'bg-emerald-600' },
    { key: 'devices', label: t('devices_tab'), icon: 'fa-microchip', color: 'bg-violet-600' },
  ];

  return (
    <Layout title={t('doctor_console')} hideTitle>
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex mb-4 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button onClick={() => setMobileTab('queue')} className={`flex-1 py-2 text-sm font-bold rounded-xl ${mobileTab === 'queue' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>
            <i className="fa-solid fa-users-viewfinder mr-2"></i> {t('waiting_room')}
          </button>
          <button onClick={() => setMobileTab('emr')} disabled={!selectedPatient} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mobileTab === 'emr' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 opacity-50'}`}>
            <i className="fa-solid fa-file-medical mr-2"></i> {t('emr_view')}
          </button>
      </div>

      <div className="flex flex-col lg:flex-row h-auto lg:h-full gap-4 overflow-visible lg:overflow-hidden">
        
        {/* --- SIDEBAR --- */}
        <div className={`w-full lg:w-52 xl:w-60 flex-col gap-5 ${mobileTab === 'queue' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex-1 min-h-[300px] lg:min-h-0 bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 text-xs">{t('waiting_room')}</h2>
                    <div className="flex items-center gap-2">
                      {waitingList.filter(p => p.currentVisit.status === 'waiting').length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                          <i className="fa-solid fa-user-clock text-amber-500 text-xs"></i>
                          <span className="text-amber-700 text-xs font-bold">
                            {waitingList.filter(p => p.currentVisit.status === 'waiting').length}
                          </span>
                          <span className="text-amber-600 text-[10px]">
                            {t('waiting_label')}
                          </span>
                        </div>
                      )}
                      <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded-lg font-bold">{waitingList.length}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {waitingList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 py-10"><i className="fa-solid fa-mug-hot text-3xl mb-2"></i><p className="text-[10px] font-bold">{t('no_active_patients')}</p></div>
                    ) : (
                        waitingList.map(p => {
                            const isUrgent = p.currentVisit.priority === 'urgent';
                            const isWaiting = p.currentVisit.status === 'waiting';
                            const isSelected = selectedPatient?.id === p.id;
                            
                            // Dynamic Styling for Queue Items
                            let cardClass = "w-full text-left p-2.5 rounded-xl border transition-all relative group overflow-hidden shadow-sm ";
                            
                            if (isSelected) {
                                cardClass += "bg-slate-800 text-white border-slate-900 shadow-xl scale-[1.02] z-10 ";
                            } else if (isUrgent) {
                                cardClass += "bg-red-50 border-l-4 border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100 hover:shadow-md ";
                            } else if (isWaiting) {
                                cardClass += "bg-amber-50 border-l-4 border-l-amber-400 border-t-amber-100 border-r-amber-100 border-b-amber-100 hover:shadow-md ";
                            } else {
                                // In Progress but not selected (rare but possible)
                                cardClass += "bg-white border-slate-100 hover:bg-slate-50 ";
                            }

                            return (
                                <button key={p.id} onClick={() => handleSelectPatient(p)} className={cardClass}>
                                    {isUrgent && <div className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">URGENT</div>}
                                    <div className={`font-bold text-xs mb-0.5 truncate pr-14 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{p.name}</div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className={`font-medium italic ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{p.currentVisit.reasonForVisit}</span>
                                        <div className={`px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                                            p.currentVisit.status === 'in-progress' 
                                            ? 'bg-amber-500 text-white animate-pulse' 
                                            : 'bg-amber-200 text-amber-800'
                                        }`}>
                                            {p.currentVisit.status === 'in-progress' && <i className="fa-solid fa-circle-play text-[8px]"></i>}
                                            {p.currentVisit.status === 'waiting' && <i className="fa-regular fa-clock text-[8px]"></i>}
                                            {p.currentVisit.status}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
            

        </div>

        {/* --- MAIN EMR WORKSPACE --- */}
        <div className={`flex-1 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-soft border border-slate-100 flex flex-col overflow-hidden relative ${mobileTab === 'emr' ? 'flex' : 'hidden lg:flex'}`}>
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <div className="p-5 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${selectedPatient.gender === 'male' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'}`}>
                    <i className="fa-solid fa-hospital-user"></i>
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{selectedPatient.name}</h1>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{selectedPatient.age} Yrs</span>
                      <span>•</span>
                      <span>{selectedPatient.gender}</span>
                      <span>•</span>
                      <span>{selectedPatient.currentVisit.reasonForVisit}</span>
                    </div>
                  </div>
                </div>
                
                {(selectedPatient.medicalProfile.allergies.exists || selectedPatient.medicalProfile.chronicConditions.exists) && (
                    <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-bold border border-rose-100 animate-pulse">
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i> Medical Alert
                    </div>
                )}

                {selectedPatient?.currentVisit.status === 'in-progress' && (
                  <button onClick={() => handleSaveVisit('completed')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0">
                    <i className="fa-solid fa-check-circle text-[10px]"></i> {t('btn_complete_visit')}
                  </button>
                )}
              </div>

              {/* SOAP Tabs Navigation */}
              <div className="border-b border-slate-100 bg-slate-50/30 px-2 overflow-x-auto flex gap-1 py-2">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.key
                        ? `${tab.color} text-white shadow-lg scale-105`
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                      activeTab === tab.key ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                    }`}>{idx + 1}</span>
                    <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Workspace */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
                 
                 {/* --- BLOCKING OVERLAY FOR WAITING PATIENTS --- */}
                 {selectedPatient.currentVisit.status === 'waiting' && (
                     <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                         <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl animate-bounce">
                             <i className="fa-solid fa-user-clock"></i>
                         </div>
                         <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{t('patient_is_waiting')}</h2>
                         <p className="text-slate-500 max-w-md mb-8">{t('review_profile_msg')}</p>
                         <button 
                             onClick={() => handleSaveVisit('in-progress')}
                             className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-primary shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                         >
                             <i className="fa-solid fa-play"></i> {t('start_consult')}
                         </button>
                     </div>
                 )}

                 <div className={`max-w-4xl mx-auto transition-opacity duration-300 ${selectedPatient.currentVisit.status === 'waiting' ? 'opacity-20 blur-sm overflow-hidden h-[500px]' : 'opacity-100'}`}>
                    
                    {/* ============ TAB 1: CHIEF COMPLAINT ============ */}
                    {activeTab === 'chief' && (
                      <div className="space-y-4 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-comment-medical text-slate-500"></i> {t('chief_complaint')}
                        </h3>
                        <input
                          type="text"
                          maxLength={255}
                          className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all font-medium text-slate-800 text-lg"
                          placeholder={t('chief_complaint_placeholder')}
                          value={chiefComplaint}
                          onChange={e => setChiefComplaint(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 text-right">{chiefComplaint.length}/255</p>

                        {/* Quick medical profile preview */}
                        <div className="mt-6 bg-amber-50 rounded-xl border border-amber-100 p-4">
                          <h4 className="text-xs font-bold text-amber-800 mb-3 uppercase"><i className="fa-solid fa-notes-medical mr-1"></i> {t('patient_medical_profile')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-2 rounded-lg">
                              <span className="font-bold text-slate-600">{t('allergies_profile')}: </span>
                              <span className={selectedPatient.medicalProfile.allergies.exists ? 'text-red-600 font-bold' : 'text-slate-400'}>
                                {selectedPatient.medicalProfile.allergies.exists ? selectedPatient.medicalProfile.allergies.details : t('nkda')}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <span className="font-bold text-slate-600">{t('chronic_profile')}: </span>
                              <span className={selectedPatient.medicalProfile.chronicConditions.exists ? 'text-orange-600 font-bold' : 'text-slate-400'}>
                                {selectedPatient.medicalProfile.chronicConditions.exists ? selectedPatient.medicalProfile.chronicConditions.details : t('none_label')}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <span className="font-bold text-slate-600">{t('medications_profile')}: </span>
                              <span className={selectedPatient.medicalProfile.currentMedications.exists ? 'text-amber-600' : 'text-slate-400'}>
                                {selectedPatient.medicalProfile.currentMedications.exists ? selectedPatient.medicalProfile.currentMedications.details : t('none_label')}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <span className="font-bold text-slate-600">{t('surgeries_profile')}: </span>
                              <span className="text-slate-400">
                                {selectedPatient.medicalProfile.previousSurgeries?.exists ? selectedPatient.medicalProfile.previousSurgeries.details : t('none_label')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 2: HISTORY ============ */}
                    {activeTab === 'history' && (
                      <div className="space-y-5 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-clock-rotate-left text-amber-500"></i> {t('medical_history_heading')}
                        </h3>
                        
                        {[
                          { label: t('history_hpi'), value: presentIllness, setter: setPresentIllness, placeholder: t('history_hpi_placeholder') },
                          { label: t('past_medical_history'), value: pastMedicalHistory, setter: setPastMedicalHistory, placeholder: t('past_medical_placeholder') },
                          { label: t('surgical_history'), value: surgicalHistory, setter: setSurgicalHistory, placeholder: t('surgical_placeholder') },
                          { label: t('current_medications_label'), value: currentMedications, setter: setCurrentMedications, placeholder: t('medications_placeholder') },
                          { label: t('allergies_label'), value: allergiesText, setter: setAllergiesText, placeholder: t('allergies_placeholder') },
                          { label: t('family_history'), value: familyHistory, setter: setFamilyHistory, placeholder: t('family_placeholder') },
                          { label: t('social_history'), value: socialHistory, setter: setSocialHistory, placeholder: t('social_placeholder') },
                        ].map(field => (
                          <div key={field.label}>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">{field.label}</label>
                            <textarea
                              className="w-full h-20 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-400 transition-all text-sm text-slate-800 resize-none"
                              placeholder={field.placeholder}
                              value={field.value}
                              onChange={e => field.setter(e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ============ TAB 3: EXAMINATION ============ */}
                    {activeTab === 'exam' && (
                      <div className="space-y-5 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-stethoscope text-amber-500"></i> {t('examination')}
                        </h3>

                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t('general_examination')}</label>
                          <textarea className="w-full h-20 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-400 transition-all text-sm resize-none" placeholder={t('general_exam_placeholder')} value={generalExamination} onChange={e => setGeneralExamination(e.target.value)} />
                        </div>

                        {/* Vital Signs */}
                        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                          <h4 className="text-xs font-bold text-amber-800 mb-3 uppercase"><i className="fa-solid fa-heart-pulse mr-1"></i> {t('vital_signs_heading')}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('blood_pressure')}</label>
                              <input type="text" className="w-full p-2 rounded-lg border text-sm bg-white text-center font-bold" placeholder="120/80" value={vitalSigns.bloodPressure || ''} onChange={e => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('pulse_bpm')}</label>
                              <input type="number" className="w-full p-2 rounded-lg border text-sm bg-white text-center font-bold" placeholder="72" value={vitalSigns.pulse || ''} onChange={e => setVitalSigns({...vitalSigns, pulse: parseInt(e.target.value) || undefined})} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('temp_c')}</label>
                              <input type="number" step="0.1" className="w-full p-2 rounded-lg border text-sm bg-white text-center font-bold" placeholder="37.0" value={vitalSigns.temperature || ''} onChange={e => setVitalSigns({...vitalSigns, temperature: parseFloat(e.target.value) || undefined})} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('rr_min')}</label>
                              <input type="number" className="w-full p-2 rounded-lg border text-sm bg-white text-center font-bold" placeholder="16" value={vitalSigns.respiratoryRate || ''} onChange={e => setVitalSigns({...vitalSigns, respiratoryRate: parseInt(e.target.value) || undefined})} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('spo2_pct')}</label>
                              <input type="number" className="w-full p-2 rounded-lg border text-sm bg-white text-center font-bold" placeholder="98" value={vitalSigns.oxygenSaturation || ''} onChange={e => setVitalSigns({...vitalSigns, oxygenSaturation: parseInt(e.target.value) || undefined})} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t('systemic_examination')}</label>
                          <textarea className="w-full h-24 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-amber-400 transition-all text-sm resize-none" placeholder={t('systemic_exam_placeholder')} value={systemicExamination} onChange={e => setSystemicExamination(e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 4: ASSESSMENT ============ */}
                    {activeTab === 'assessment' && (
                      <div className="space-y-5 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-diagnoses text-purple-500"></i> {t('assessment')}
                        </h3>

                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t('preliminary_diagnosis')}</label>
                          <textarea className="w-full h-24 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-purple-400 transition-all text-sm resize-none" placeholder={t('preliminary_placeholder')} value={preliminaryDiagnosis} onChange={e => setPreliminaryDiagnosis(e.target.value)} />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t('differential_diagnosis')} <span className="text-slate-400 font-normal">({t('differential_optional')})</span></label>
                          <textarea className="w-full h-20 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-purple-400 transition-all text-sm resize-none" placeholder={t('differential_placeholder')} value={differentialDiagnosis} onChange={e => setDifferentialDiagnosis(e.target.value)} />
                        </div>

                        {/* Doctor Notes (legacy) */}
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t('additional_notes')}</label>
                          <textarea className="w-full h-16 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-purple-400 transition-all text-sm resize-none" placeholder={t('additional_notes_placeholder')} value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 5: PLAN & ORDERS ============ */}
                    {activeTab === 'plan' && (
                      <div className="space-y-8 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-clipboard-list text-amber-500"></i> {t('plan_orders')}
                        </h3>

                        {/* A) Lab Orders */}
                        <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4">
                          <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-flask"></i> {t('lab_orders')}
                          </h4>
                          <div className="flex gap-2 mb-3">
                            <input className="flex-1 p-2 rounded-lg border text-sm bg-white" placeholder={t('test_name_placeholder')} value={newLab.testName} onChange={e => setNewLab({...newLab, testName: e.target.value})} />
                            <input className="w-40 p-2 rounded-lg border text-sm bg-white" placeholder={t('notes_placeholder')} value={newLab.notes} onChange={e => setNewLab({...newLab, notes: e.target.value})} />
                            <button onClick={addLabOrder} className="bg-amber-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-amber-700">
                              <i className="fa-solid fa-plus mr-1"></i> {t('add_btn')}
                            </button>
                          </div>
                          
                          <input type="file" ref={labFileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleLabFileAttach} />

                          {labOrders.length > 0 && (
                            <div className="space-y-2">
                              {labOrders.map(lab => (
                                <div key={lab.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => toggleLabStatus(lab.id)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${lab.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-600 border border-amber-300'}`}>
                                      {lab.status === 'Completed' ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-clock"></i>}
                                    </button>
                                    <div>
                                      <span className="font-bold text-sm text-slate-800">{lab.testName}</span>
                                      {lab.notes && <span className="text-xs text-slate-400 ml-2">— {lab.notes}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lab.resultFileUrl && <i className="fa-solid fa-paperclip text-green-500 text-xs"></i>}
                                    <button onClick={() => { setAttachingLabId(lab.id); labFileInputRef.current?.click(); }} className="text-amber-400 hover:text-amber-600 text-xs" title="Attach result">
                                      <i className="fa-solid fa-cloud-arrow-up"></i>
                                    </button>
                                    <button onClick={() => removeLabOrder(lab.id)} className="text-slate-300 hover:text-red-500">
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* B) Imaging Orders */}
                        <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4">
                          <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-x-ray"></i> {t('imaging_orders')}
                          </h4>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            <select className="p-2 rounded-lg border text-sm bg-white" value={newImaging.imagingType} onChange={e => setNewImaging({...newImaging, imagingType: e.target.value as ImagingOrder['imagingType']})}>
                              <option value="X-ray">X-ray</option>
                              <option value="CT">CT Scan</option>
                              <option value="MRI">MRI</option>
                              <option value="Ultrasound">Ultrasound</option>
                              <option value="Other">Other</option>
                            </select>
                            <input className="flex-1 p-2 rounded-lg border text-sm bg-white" placeholder={t('body_part_placeholder')} value={newImaging.bodyPart} onChange={e => setNewImaging({...newImaging, bodyPart: e.target.value})} />
                            <input className="w-32 p-2 rounded-lg border text-sm bg-white" placeholder={t('notes_placeholder')} value={newImaging.notes} onChange={e => setNewImaging({...newImaging, notes: e.target.value})} />
                            <button onClick={addImagingOrder} className="bg-amber-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-amber-700">
                              <i className="fa-solid fa-plus mr-1"></i> {t('add_btn')}
                            </button>
                          </div>

                          <input type="file" ref={imagingFileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleImagingFileAttach} />

                          {imagingOrders.length > 0 && (
                            <div className="space-y-2">
                              {imagingOrders.map(img => (
                                <div key={img.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => toggleImagingStatus(img.id)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${img.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-600 border border-amber-300'}`}>
                                      {img.status === 'Completed' ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-clock"></i>}
                                    </button>
                                    <div>
                                      <span className="font-bold text-sm text-slate-800">{img.imagingType} — {img.bodyPart}</span>
                                      {img.notes && <span className="text-xs text-slate-400 ml-2">— {img.notes}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {img.reportFileUrl && <i className="fa-solid fa-paperclip text-green-500 text-xs"></i>}
                                    <button onClick={() => { setAttachingImagingId(img.id); imagingFileInputRef.current?.click(); }} className="text-amber-400 hover:text-amber-600 text-xs" title="Attach report">
                                      <i className="fa-solid fa-cloud-arrow-up"></i>
                                    </button>
                                    <button onClick={() => removeImagingOrder(img.id)} className="text-slate-300 hover:text-red-500">
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* C) Prescription */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <i className="fa-solid fa-prescription"></i> {t('prescription_rx')}
                            </h4>
                            {prescriptions.length > 0 && (
                              <button onClick={handlePrintRx} className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-bold hover:bg-amber-200 transition-colors">
                                <i className="fa-solid fa-print mr-1"></i> {t('print_rx')}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
                            <div className="md:col-span-4 relative" ref={rxDropdownRef}>
                              <input 
                                className="w-full p-2 rounded-lg border text-sm" 
                                placeholder={t('drug_name_placeholder')} 
                                value={newRx.name} 
                                onChange={e => { setNewRx({...newRx, name: e.target.value}); setRxSearch(e.target.value); setRxDropdownOpen(e.target.value.length >= 1); }}
                                onFocus={() => { if (rxSearch.length >= 1) setRxDropdownOpen(true); }}
                                onBlur={() => setTimeout(() => setRxDropdownOpen(false), 200)}
                              />
                              {rxDropdownOpen && rxSearch.length >= 1 && catalogMedications.length > 0 && (() => {
                                const q = rxSearch.toLowerCase();
                                const filtered = catalogMedications.filter(m => 
                                  (m.brandName || '').toLowerCase().startsWith(q) || (m.genericName || '').toLowerCase().startsWith(q)
                                );
                                return filtered.length > 0 ? (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                  {filtered.slice(0, 15).map(m => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-slate-50 last:border-0 transition-colors"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const displayName = m.brandName ? `${m.brandName} (${m.genericName || ''})` : m.genericName || '';
                                          setNewRx({
                                            name: displayName.trim(),
                                            dose: m.defaultDose || m.strength || '',
                                            freq: m.defaultFrequency || '',
                                            dur: m.defaultDuration || ''
                                          });
                                          setRxSearch('');
                                          setRxDropdownOpen(false);
                                        }}
                                      >
                                        <div className="font-bold text-slate-800">{m.brandName || m.genericName}</div>
                                        {m.brandName && m.genericName && <div className="text-xs text-slate-400 italic">{m.genericName}</div>}
                                        <div className="text-xs text-slate-500">{[m.strength, m.dosageForm, m.route].filter(Boolean).join(' · ')}</div>
                                      </button>
                                    ))
                                  }
                                </div>
                                ) : null;
                              })()}
                            </div>
                            <div className="md:col-span-2"><input className="w-full p-2 rounded-lg border text-sm" placeholder={t('dose_placeholder')} value={newRx.dose} onChange={e => setNewRx({...newRx, dose: e.target.value})} /></div>
                            <div className="md:col-span-2"><input className="w-full p-2 rounded-lg border text-sm" placeholder={t('frequency_placeholder')} value={newRx.freq} onChange={e => setNewRx({...newRx, freq: e.target.value})} /></div>
                            <div className="md:col-span-2"><input className="w-full p-2 rounded-lg border text-sm" placeholder={t('duration_placeholder')} value={newRx.dur} onChange={e => setNewRx({...newRx, dur: e.target.value})} /></div>
                            <div className="md:col-span-2"><button onClick={addPrescription} className="w-full bg-slate-800 text-white rounded-lg h-full font-bold text-xs hover:bg-slate-700">{t('add_uppercase')}</button></div>
                          </div>
                          {prescriptions.length > 0 && (
                            <div className="space-y-2">
                              {prescriptions.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                  <div className="flex gap-2 text-sm font-bold text-slate-700 flex-wrap">
                                    <span className="text-primary">{p.drugName}</span>
                                    <span className="text-slate-400">|</span>
                                    <span>{p.dosage}</span>
                                    <span className="bg-gray-100 px-1 rounded text-xs py-0.5">{p.frequency}</span>
                                    {p.duration && <span className="bg-amber-50 px-1 rounded text-xs py-0.5 text-amber-600">{p.duration}</span>}
                                  </div>
                                  <button onClick={() => removePrescription(p.id)} className="text-rose-400 hover:text-rose-600"><i className="fa-solid fa-trash"></i></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* D) Attachments */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-paperclip"></i> {t('general_attachments')}
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all">
                              <i className="fa-solid fa-cloud-arrow-up text-2xl mb-1"></i>
                              <span className="text-[10px] font-bold uppercase">{t('upload_label')}</span>
                            </button>
                            {attachments.map(att => (
                              <div key={att.id} className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden relative group">
                                <img src={att.url} className="w-full h-full object-cover" alt="attachment" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="text-white hover:text-rose-400"><i className="fa-solid fa-trash"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 6: BILLING ============ */}
                    {activeTab === 'billing' && (
                      <div className="space-y-5 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-file-invoice-dollar text-emerald-500"></i> {t('services_billing')}
                        </h3>
                        <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-4">
                          {/* Mode toggle */}
                          <div className="flex gap-2 mb-3">
                            <button 
                              onClick={() => setServiceMode('catalog')} 
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${serviceMode === 'catalog' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border'}`}
                            >
                              <i className="fa-solid fa-list mr-1"></i> {t('from_catalog')}
                            </button>
                            <button 
                              onClick={() => setServiceMode('custom')} 
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${serviceMode === 'custom' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border'}`}
                            >
                              <i className="fa-solid fa-pen mr-1"></i> {t('custom_entry')}
                            </button>
                          </div>

                          {serviceMode === 'catalog' ? (
                            <div className="flex gap-2 mb-3">
                              <select className="flex-1 p-2 rounded-lg border text-sm bg-white" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                                {catalogServices.length > 0 ? (
                                  catalogServices.map(s => (
                                    <option key={s.id} value={s.serviceName}>{s.serviceName} ({s.price} {s.currency})</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="Consultation">General Consultation (50 JOD)</option>
                                    <option value="Follow-up">Follow-up Visit (25 JOD)</option>
                                    <option value="Ultrasound">Ultrasound (80 JOD)</option>
                                    <option value="Lab Test (Basic)">Lab Test - Basic (40 JOD)</option>
                                    <option value="X-Ray">X-Ray (60 JOD)</option>
                                    <option value="Minor Surgery">Minor Surgery (150 JOD)</option>
                                  </>
                                )}
                              </select>
                              <button onClick={addService} className="bg-emerald-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-emerald-700">Add</button>
                            </div>
                          ) : (
                            <div className="flex gap-2 mb-3">
                              <input className="flex-1 p-2 rounded-lg border text-sm" placeholder={t('service_name_placeholder')} value={customServiceName} onChange={e => setCustomServiceName(e.target.value)} />
                              <input className="w-24 p-2 rounded-lg border text-sm" type="number" placeholder={t('price_placeholder')} value={customServicePrice} onChange={e => setCustomServicePrice(e.target.value)} />
                              <button onClick={() => {
                                if (!customServiceName || !customServicePrice) return;
                                setInvoiceItems([...invoiceItems, { id: Date.now().toString(), description: customServiceName, price: Number(customServicePrice) }]);
                                setCustomServiceName(''); setCustomServicePrice('');
                              }} className="bg-emerald-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-emerald-700">Add</button>
                            </div>
                          )}
                          
                          {invoiceItems.length > 0 ? (
                            <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-100">
                              {invoiceItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                                  <span className="font-medium text-slate-700">{item.description}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-emerald-600">{item.price} {t('currency_jod')}</span>
                                    <button onClick={() => removeService(item.id)} className="text-slate-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100 font-bold text-slate-800">
                                <span>{t('total_estimated')}</span>
                                <span>{invoiceItems.reduce((acc, i) => acc + i.price, 0)} {t('currency_jod')}</span>
                              </div>
                            </div>
                          ) : <div className="text-xs text-slate-400 italic text-center py-2">{t('no_services_added')}</div>}
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 7: DEVICES ============ */}
                    {activeTab === 'devices' && (
                      <div className="space-y-5 animate-fadeIn">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-microchip text-violet-500"></i> {t('device_results_heading')}
                        </h3>
                        <div className="bg-violet-50/30 rounded-xl border border-violet-100 p-4">
                            <DeviceResultsTimeline patientId={selectedPatient.id} />
                        </div>
                      </div>
                    )}

                    {/* ============ TAB 8: ENT FORMS ============ */}
                    {activeTab === 'ent-forms' && (
                      <div className="space-y-5 animate-fadeIn" dir="rtl">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <i className="fa-solid fa-stethoscope text-amber-500"></i> {t('ent_forms_heading_doctor')}
                          </h3>
                          {/* Doctor can create tests directly */}
                          <div className="flex gap-2">
                            <button onClick={() => { const slug = window.location.pathname.split('/').filter(Boolean)[0]; window.open(`/${slug}/ent/audiogram`, '_blank'); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 transition">
                              <i className="fa-solid fa-ear-listen"></i> {t('new_hearing_test')}
                            </button>
                            <button onClick={() => { const slug = window.location.pathname.split('/').filter(Boolean)[0]; window.open(`/${slug}/ent/balance`, '_blank'); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 transition">
                              <i className="fa-solid fa-compass"></i> {t('new_balance_test')}
                            </button>
                            <button onClick={() => { const slug = window.location.pathname.split('/').filter(Boolean)[0]; window.open(`/${slug}/ent/referral`, '_blank'); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 transition">
                              <i className="fa-solid fa-share-from-square"></i> {t('medical_referral_btn')}
                            </button>
                          </div>
                        </div>
                        {entLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <i className="fa-solid fa-spinner fa-spin text-3xl text-amber-500"></i>
                          </div>
                        ) : !entForms ? (
                          <div className="text-center text-slate-400 py-16">
                            <i className="fa-solid fa-folder-open text-4xl mb-3"></i>
                            <p>{t('no_forms_for_patient')}</p>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {/* Category Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                              {[
                                { key: 'newPatientForms', label: t('new_patient_questionnaire_cat'), icon: 'fa-file-medical', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100', txt: 'text-amber-600', activeBg: 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' },
                                { key: 'followUpForms', label: t('follow_up_cat'), icon: 'fa-file-lines', bg: 'bg-green-50 border-green-200 hover:bg-green-100', txt: 'text-green-600', activeBg: 'bg-green-100 border-green-400 ring-2 ring-green-300' },
                                { key: 'audiograms', label: t('hearing_test_cat'), icon: 'fa-ear-listen', bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100', txt: 'text-purple-600', activeBg: 'bg-purple-100 border-purple-400 ring-2 ring-purple-300' },
                                { key: 'balanceAssessments', label: t('balance_test_cat'), icon: 'fa-person-walking', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100', txt: 'text-amber-600', activeBg: 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' },
                                { key: 'referrals', label: t('medical_referral_cat'), icon: 'fa-share-from-square', bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100', txt: 'text-rose-600', activeBg: 'bg-rose-100 border-rose-400 ring-2 ring-rose-300' },
                              ].map(cat => {
                                const count = entForms[cat.key]?.length || 0;
                                return (
                                  <button key={cat.key} onClick={() => { setEntExpanded(entExpanded === cat.key ? null : cat.key); setEntDetail(null); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center ${entExpanded === cat.key ? cat.activeBg : cat.bg}`}>
                                    <i className={`fa-solid ${cat.icon} text-xl ${cat.txt}`}></i>
                                    <span className="text-[10px] font-bold leading-tight">{cat.label}</span>
                                    <span className={`text-lg font-black ${cat.txt}`}>{count}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Records List */}
                            {entExpanded && entForms[entExpanded] && entForms[entExpanded].length > 0 && (
                              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                <h4 className="font-bold text-slate-700 mb-3 text-sm">{t('records_label')} ({entForms[entExpanded].length})</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {entForms[entExpanded].map((form: any, idx: number) => {
                                    const formType = entExpanded === 'newPatientForms' ? 'new-patient'
                                      : entExpanded === 'followUpForms' ? 'follow-up'
                                      : entExpanded === 'audiograms' ? 'audiogram'
                                      : entExpanded === 'balanceAssessments' ? 'balance-assessment' : 'referral';
                                    const summary = form.chief_complaint || form.follow_up_reason || form.hearing_level || form.vestibular_function || form.referred_to_specialty || '—';
                                    return (
                                      <button key={form.id} onClick={async () => {
                                        setEntDetailLoading(true);
                                        try {
                                          const data = await api.get(`/ent-forms/${formType}/${selectedPatient.id}`);
                                          const found = (data as any[]).find((d: any) => d.id === form.id);
                                          setEntDetail({ type: formType, data: found || form });
                                        } catch { setEntDetail({ type: formType, data: form }); }
                                        setEntDetailLoading(false);
                                      }}
                                        className={`w-full text-right p-3 rounded-xl border transition-all flex justify-between items-center gap-2 ${
                                          entDetail?.data?.id === form.id ? 'bg-white border-amber-400 shadow-md' : 'bg-white border-slate-100 hover:border-amber-300'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-600">#{idx + 1}</span>
                                          <span className="text-[10px] text-slate-400">{new Date(form.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{summary}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {entExpanded && entForms[entExpanded]?.length === 0 && (
                              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
                                <i className="fa-solid fa-inbox text-2xl mb-2"></i>
                                <p>{t('no_records_found')}</p>
                              </div>
                            )}

                            {/* Detail View */}
                            {entDetailLoading && (
                              <div className="flex items-center justify-center py-8">
                                <i className="fa-solid fa-spinner fa-spin text-xl text-amber-500"></i>
                              </div>
                            )}
                            {entDetail && !entDetailLoading && (
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-file-medical text-amber-500"></i> {t('form_details')}
                                  </h4>
                                  <span className="text-[10px] text-slate-400">{new Date(entDetail.data.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {entDetail.type === 'new-patient' && <>
                                    <EntField label={t('ent_chief_complaint')} value={entDetail.data.chief_complaint} />
                                    <EntField label={t('ent_symptom_duration')} value={entDetail.data.symptom_duration} />
                                    <EntField label={t('ent_symptom_side')} value={{right:t('ent_side_right'),left:t('ent_side_left'),both:t('ent_side_both'),none:t('ent_side_none')}[entDetail.data.symptom_side as string] || entDetail.data.symptom_side} />
                                    <EntField label={t('ent_previous_treatment')} value={entDetail.data.previous_ent_treatment ? `${t('ent_yes')} — ${entDetail.data.previous_ent_details}` : t('ent_no')} />
                                    <EntField label={t('ent_previous_surgery')} value={entDetail.data.previous_ent_surgery ? `${t('ent_yes')} — ${entDetail.data.previous_ent_surgery_details}` : t('ent_no')} />
                                    {entDetail.data.symptoms && typeof entDetail.data.symptoms === 'object' && (
                                      <div className="md:col-span-2">
                                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">{t('ent_symptoms')}</div>
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(entDetail.data.symptoms).filter(([,v]) => v === true).map(([k]) => (
                                            <span key={k} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200">
                                              {{earPain:t('ent_ear_pain'),hearingLoss:t('ent_hearing_loss'),tinnitus:t('ent_tinnitus'),earDischarge:t('ent_ear_discharge'),vertigo:t('ent_vertigo'),nasalObstruction:t('ent_nasal_obstruction'),nasalDischarge:t('ent_nasal_discharge'),sneezing:t('ent_sneezing'),soreThroat:t('ent_sore_throat'),voiceChange:t('ent_voice_change'),dysphagia:t('ent_dysphagia'),snoring:t('ent_snoring'),sleepApnea:t('ent_sleep_apnea'),facialPain:t('ent_facial_pain'),headache:t('ent_headache'),nosebleeds:t('ent_nosebleeds'),lossOfSmell:t('ent_loss_of_smell'),neckMass:t('ent_neck_mass')}[k] || k}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {entDetail.data.notes && <EntField label={t('ent_notes')} value={entDetail.data.notes} span2 />}
                                  </>}
                                  {entDetail.type === 'follow-up' && <>
                                    <EntField label={t('ent_follow_up_reason')} value={entDetail.data.follow_up_reason} />
                                    <EntField label={t('ent_previous_diagnosis')} value={entDetail.data.previous_diagnosis} />
                                    <EntField label={t('ent_treatment_compliance')} value={{full:t('ent_compliance_full'),partial:t('ent_compliance_partial'),none:t('ent_no')}[entDetail.data.treatment_compliance as string] || entDetail.data.treatment_compliance} />
                                    <EntField label={t('ent_symptom_assessment')} value={{improved:t('ent_improved'),same:t('ent_same'),worsened:t('ent_worsened')}[entDetail.data.symptom_assessment as string] || entDetail.data.symptom_assessment} />
                                    <EntField label={t('ent_new_symptoms')} value={entDetail.data.new_symptoms} />
                                    <EntField label={t('ent_medication_effectiveness')} value={entDetail.data.medication_effectiveness} />
                                    <EntField label={t('ent_next_steps')} value={entDetail.data.next_steps} />
                                    {entDetail.data.notes && <EntField label={t('ent_notes')} value={entDetail.data.notes} span2 />}
                                  </>}
                                  {entDetail.type === 'audiogram' && <>
                                    <EntField label={t('ent_hearing_level')} value={entDetail.data.hearing_level} />
                                    <EntField label={t('ent_hearing_loss_type')} value={entDetail.data.hearing_loss_type} />
                                    <EntField label={t('ent_recommend_hearing_aid')} value={entDetail.data.recommend_hearing_aid ? t('ent_yes') : t('ent_no')} />
                                    <EntField label="OAE" value={entDetail.data.oae} />
                                    {entDetail.data.notes && <EntField label={t('ent_notes')} value={entDetail.data.notes} span2 />}
                                  </>}
                                  {entDetail.type === 'balance-assessment' && <>
                                    <EntField label={t('ent_vestibular_function')} value={entDetail.data.vestibular_function} />
                                    {entDetail.data.notes && <EntField label={t('ent_notes')} value={entDetail.data.notes} span2 />}
                                  </>}
                                  {entDetail.type === 'referral' && <>
                                    <EntField label={t('ent_referring_doctor')} value={entDetail.data.referring_doctor} />
                                    <EntField label={t('ent_specialty')} value={entDetail.data.referred_to_specialty} />
                                    <EntField label={t('ent_referred_doctor')} value={entDetail.data.referred_to_doctor} />
                                    <EntField label={t('ent_hospital')} value={entDetail.data.referred_to_hospital} />
                                    <EntField label={t('ent_urgency')} value={{routine:t('ent_urgency_routine'),urgent:t('ent_urgency_urgent'),emergency:t('ent_urgency_emergency')}[entDetail.data.urgency as string] || entDetail.data.urgency} />
                                    {entDetail.data.notes && <EntField label={t('ent_notes')} value={entDetail.data.notes} span2 />}
                                  </>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                 </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                <i className="fa-solid fa-user-doctor text-6xl opacity-10 mb-6 animate-pulse"></i>
                <p className="text-xl font-extrabold text-slate-400">{t('select_patient')}</p>
            </div>
          )}

      </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default DoctorView;
