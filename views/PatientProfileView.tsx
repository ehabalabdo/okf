
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { PatientService, ClinicService } from '../services/services';
import { api } from '../src/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Patient, Clinic, UserRole } from '../types';
import DeviceResultsTimeline from '../components/DeviceResultsTimeline';
import { fmtDate, fmtDateTime } from '../utils/formatters';

const PatientProfileView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir } = useLanguage();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'timeline' | 'clinical' | 'devices' | 'ent-forms'>('basic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ENT Forms State
  const [entForms, setEntForms] = useState<any>(null);
  const [entLoading, setEntLoading] = useState(false);
  const [entExpanded, setEntExpanded] = useState<string | null>(null);
  const [entDetail, setEntDetail] = useState<any>(null);
  const [entDetailLoading, setEntDetailLoading] = useState(false);

  // Edit State for Clinical Tab
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');

  // Edit State for Basic Tab (Patient Portal Access)
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(0);
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editHasAccess, setEditHasAccess] = useState(false);

  // Sound notification system
  const prevStatusRef = React.useRef<string | null>(null);
  
  const playCallingSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Calling tone
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
      // Close AudioContext after sound finishes to prevent memory leak
      oscillator.onended = () => audioContext.close();
      
      // Show alert notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('جاء دورك!', {
          body: 'الرجاء التوجه إلى غرفة الفحص',
          icon: '/logo.png'
        });
      }
    } catch (e) {
      console.log('Audio calling not supported');
    }
  };

  // Monitor patient status for calling notification
  useEffect(() => {
    if (patient && patient.currentVisit) {
      const currentStatus = patient.currentVisit.status;
      
      // If status changed from 'waiting' to 'in-progress', play calling sound
      if (prevStatusRef.current === 'waiting' && currentStatus === 'in-progress') {
        playCallingSound();
      }
      
      prevStatusRef.current = currentStatus;
    }
  }, [patient?.currentVisit?.status]);
  
  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

    // Load patient data with real-time updates
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !id) return;
            try {
                const patientData = await PatientService.getById(user, id);
                if (patientData) {
                    setPatient(patientData);
                    const allClinics = await ClinicService.getActive();
                    setClinics(allClinics);
                } else {
                    setError('Patient not found');
                }
            } catch (err: any) {
                setError(err.message || 'Access denied');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        
        // Poll for updates every 10 seconds to catch status changes
        const interval = setInterval(fetchData, 10000);
        
        return () => clearInterval(interval);
    }, [user, id]);

  // Load ENT forms when tab is selected
  useEffect(() => {
    if (activeTab === 'ent-forms' && patient && !entForms && !entLoading) {
      setEntLoading(true);
      api.get(`/ent-forms/patient/${patient.id}/all`)
        .then((data: any) => setEntForms(data))
        .catch(() => setEntForms(null))
        .finally(() => setEntLoading(false));
    }
  }, [activeTab, patient?.id]);

  const handleSaveClinical = async () => {
     if(!patient || !user) return;
     try {
         await PatientService.updateStatus(user, patient, patient.currentVisit.status, {
             diagnosis, 
             treatment
         });
         alert(t('saved_successfully'));
     } catch (e: any) {
         alert(e.message);
     }
  };

  const handleEditBasic = () => {
    if (!patient) return;
    setEditName(patient.name);
    setEditAge(patient.age);
    setEditDateOfBirth(patient.dateOfBirth || '');
    setEditPhone(patient.phone);
    setEditUsername(patient.username || '');
    setEditEmail(patient.email || '');
    setEditPassword('');
    setEditHasAccess(patient.hasAccess || false);
    setIsEditingBasic(true);
  };

  const handleCancelBasicEdit = () => {
    setIsEditingBasic(false);
    setEditPassword('');
  };

  const handleSaveBasic = async () => {
    if (!patient || !user) return;
    try {
      await PatientService.update(user, patient.id, {
        name: editName,
        dateOfBirth: editDateOfBirth || undefined,
        age: editAge,
        phone: editPhone,
        username: editUsername || undefined,
        email: editEmail || undefined,
        password: editPassword || undefined,
        hasAccess: editHasAccess
      });
      
      // Reload patient data
      const updated = await PatientService.getById(user, patient.id);
      if (updated) setPatient(updated);
      
      setIsEditingBasic(false);
      setEditPassword('');
      alert(t('saved_successfully'));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getClinicName = (id: string) => clinics.find(c => c.id === id)?.name || id;

  if (loading) return <Layout title="Loading..."><div className="p-10 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i></div></Layout>;
  
  if (error) return (
    <Layout title={t('access_denied')}>
        <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-xl shadow border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fa-solid fa-ban"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('access_denied')}</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => {
                const slug = localStorage.getItem('currentClientSlug');
                navigate(slug ? `/${slug}/patients` : '/patients');
            }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
                Back to Registry
            </button>
        </div>
    </Layout>
  );

  if (!patient) return null;

  // -- Components --

  const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === id 
            ? 'border-primary text-primary bg-primary/5' 
            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50'
        }`}
      >
          <i className={icon}></i> {label}
      </button>
  );

  const MedicalBadge = ({ label, data }: { label: string, data: { exists: boolean, details: string } }) => {
      if (!data.exists) return null;
      return (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-3">
              <i className="fa-solid fa-triangle-exclamation text-red-500 mt-1"></i>
              <div>
                  <div className="text-xs font-bold text-red-800 uppercase">{label}</div>
                  <div className="text-sm text-red-700 font-medium">{data.details}</div>
              </div>
          </div>
      );
  };

  const DetailField = ({ label, value, span2 }: { label: string, value: any, span2?: boolean }) => (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <div className="text-xs font-bold uppercase text-slate-400 mb-1">{label}</div>
      <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{value || '—'}</div>
    </div>
  );

  return (
    <Layout title={patient.name}>
       
       {/* Profile Header */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-inner ${
               patient.gender === 'male' ? 'bg-amber-100 text-amber-500' : 'bg-pink-100 text-pink-500'
           }`}>
               <i className="fa-solid fa-user"></i>
           </div>
           
           <div className="flex-1 text-center md:text-start">
               <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                   <h1 className="text-3xl font-bold text-slate-800">{patient.name}</h1>
                   {patient.currentVisit?.visitId && (
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-fit mx-auto md:mx-0 ${
                       patient.currentVisit.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                   }`}>
                       {patient.currentVisit.status}
                   </span>
                   )}
               </div>
               
               <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                   <span className="flex items-center gap-1"><i className="fa-solid fa-cake-candles"></i> {patient.age} {t('years_old')}</span>
                   <span className="flex items-center gap-1"><i className="fa-solid fa-phone"></i> {patient.phone}</span>
                   <span className="flex items-center gap-1"><i className="fa-solid fa-hospital"></i> {getClinicName(patient.currentVisit.clinicId)}</span>
               </div>
           </div>

           <div className="text-right hidden md:block">
               <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Entry ID</div>
               <div className="font-mono font-bold text-slate-700">{patient.id.split('_')[1]}</div>
           </div>
       </div>

       {/* Tabs Navigation */}
       <div className="bg-white rounded-t-xl shadow-sm border border-gray-100 flex overflow-hidden">
           <TabButton id="basic" label={t('tab_basic')} icon="fa-solid fa-address-card" />
           <TabButton id="timeline" label={t('tab_timeline')} icon="fa-solid fa-clock-rotate-left" />
           <TabButton id="clinical" label={t('tab_clinical')} icon="fa-solid fa-file-medical" />
           <TabButton id="devices" label="نتائج الأجهزة" icon="fa-solid fa-microscope" />
           <TabButton id="ent-forms" label="نماذج ENT" icon="fa-solid fa-stethoscope" />
       </div>

       {/* Tab Content */}
       <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6 min-h-[400px]">
           
           {/* TAB 1: BASIC INFO */}
           {activeTab === 'basic' && (
               <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                       <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-bold uppercase text-slate-400">{t('personal_info')}</h3>
                           {user?.role === UserRole.ADMIN && !isEditingBasic && (
                               <button
                                   onClick={handleEditBasic}
                                   className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                               >
                                   <i className="fa-solid fa-pen"></i> تعديل
                               </button>
                           )}
                       </div>
                       
                       {!isEditingBasic ? (
                           <div className="space-y-4">
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">{t('full_name')}</span>
                                   <span className="font-medium">{patient.name}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">{t('gender')}</span>
                                   <span className="font-medium capitalize">{patient.gender}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">{t('date_of_birth')}</span>
                                   <span className="font-medium">{patient.dateOfBirth || '—'}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">{t('age')}</span>
                                   <span className="font-medium">{patient.age} {t('years_old')}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">{t('phone')}</span>
                                   <span className="font-medium font-mono">{patient.phone}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">اسم المستخدم</span>
                                   <span className="font-medium">{patient.username || '—'}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">البريد الإلكتروني</span>
                                   <span className="font-medium">{patient.email || '—'}</span>
                               </div>
                               <div className="flex justify-between border-b border-gray-50 pb-2">
                                   <span className="text-slate-500">الدخول للبوابة</span>
                                   <span className={`font-bold ${patient.hasAccess ? 'text-green-600' : 'text-red-600'}`}>
                                       {patient.hasAccess ? '✓ مفعل' : '✗ معطل'}
                                   </span>
                               </div>
                           </div>
                       ) : (
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">{t('full_name')}</label>
                                   <input
                                       type="text"
                                       value={editName}
                                       onChange={e => setEditName(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">{t('date_of_birth')}</label>
                                   <input
                                       type="date"
                                       value={editDateOfBirth}
                                       onChange={e => setEditDateOfBirth(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">{t('phone')}</label>
                                   <input
                                       type="text"
                                       value={editPhone}
                                       onChange={e => setEditPhone(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم (للبوابة)</label>
                                   <input
                                       type="text"
                                       value={editUsername}
                                       onChange={e => setEditUsername(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                       placeholder="username"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">البريد الإلكتروني</label>
                                   <input
                                       type="email"
                                       value={editEmail}
                                       onChange={e => setEditEmail(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                       placeholder="email@example.com"
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور (اتركها فارغة للإبقاء على القديمة)</label>
                                   <input
                                       type="password"
                                       value={editPassword}
                                       onChange={e => setEditPassword(e.target.value)}
                                       className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                       placeholder="••••••••"
                                   />
                               </div>
                               <div className="flex items-center gap-2">
                                   <input
                                       type="checkbox"
                                       id="hasAccess"
                                       checked={editHasAccess}
                                       onChange={e => setEditHasAccess(e.target.checked)}
                                       className="w-4 h-4"
                                   />
                                   <label htmlFor="hasAccess" className="text-sm font-medium text-slate-700">تفعيل الدخول لبوابة المريض</label>
                               </div>
                               <div className="flex gap-2 pt-2">
                                   <button
                                       onClick={handleSaveBasic}
                                       className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
                                   >
                                       <i className="fa-solid fa-check"></i> حفظ
                                   </button>
                                   <button
                                       onClick={handleCancelBasicEdit}
                                       className="flex-1 bg-gray-300 hover:bg-gray-400 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm"
                                   >
                                       <i className="fa-solid fa-times"></i> إلغاء
                                   </button>
                               </div>
                           </div>
                       )}
                   </div>

                   <div>
                       <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">{t('medical_alerts')}</h3>
                       <div className="space-y-3">
                           {!patient.medicalProfile.allergies.exists && !patient.medicalProfile.chronicConditions.exists && (
                               <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                   <i className="fa-solid fa-check-circle"></i> No known medical alerts.
                               </div>
                           )}
                           <MedicalBadge label={t('allergies')} data={patient.medicalProfile.allergies} />
                           <MedicalBadge label={t('chronic_conditions')} data={patient.medicalProfile.chronicConditions} />
                           <MedicalBadge label={t('current_meds')} data={patient.medicalProfile.currentMedications} />
                       </div>
                   </div>
               </div>
           )}

           {/* TAB 2: TIMELINE */}
           {activeTab === 'timeline' && (
               <div className="animate-fade-in relative pl-8 border-l-2 border-slate-100 space-y-8 py-2">
                   {/* Combined History + Current (skip empty/reset currentVisit) */}
                   {[...(patient.currentVisit?.visitId ? [patient.currentVisit] : []), ...patient.history].map((visit, idx) => {
                       const hasVitals = visit.vitalSigns && Object.values(visit.vitalSigns).some(v => v);
                       const hasSOAP = visit.chiefComplaint || visit.presentIllness || visit.pastMedicalHistory || visit.surgicalHistory || visit.currentMedications || visit.allergies || visit.familyHistory || visit.socialHistory || visit.generalExamination || visit.systemicExamination || hasVitals || visit.preliminaryDiagnosis || visit.differentialDiagnosis;
                       const hasLabs = visit.labOrders && visit.labOrders.length > 0;
                       const hasImaging = visit.imagingOrders && visit.imagingOrders.length > 0;
                       
                       return (
                       <div key={idx} className="relative">
                           <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-primary' : 'bg-slate-300'}`}></div>
                           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                               <div className="flex-1 w-full">
                                   <div className={`text-sm font-bold ${idx === 0 ? 'text-primary' : 'text-slate-600'}`}>
                                       {fmtDate(visit.date)}
                                   </div>
                                   <div className="text-xs text-slate-400 mb-2">
                                       {new Date(visit.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {getClinicName(visit.clinicId)}
                                   </div>
                                   
                                   {/* Clinical Summary Card */}
                                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 w-full space-y-3">
                                       {visit.reasonForVisit && (
                                         <div className="text-sm font-medium text-slate-800">
                                           <i className="fa-solid fa-comment-medical text-primary ml-1"></i> سبب الزيارة: {visit.reasonForVisit}
                                         </div>
                                       )}
                                       
                                       {/* Show Medical Details if Authorized */}
                                       {user?.role !== UserRole.SECRETARY && (
                                           <div className="border-t border-gray-200 pt-3 mt-2 space-y-4">

                                               {/* === SOAP SECTIONS === */}
                                               
                                               {/* 1. Chief Complaint */}
                                               {visit.chiefComplaint && (
                                                 <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                   <div className="text-[11px] font-bold text-primary uppercase mb-1 flex items-center gap-1">
                                                     <i className="fa-solid fa-bullhorn text-[10px]"></i> الشكوى الرئيسية
                                                   </div>
                                                   <div className="text-sm text-slate-700">{visit.chiefComplaint}</div>
                                                 </div>
                                               )}

                                               {/* 2. History Section */}
                                               {(visit.presentIllness || visit.pastMedicalHistory || visit.surgicalHistory || visit.currentMedications || visit.allergies || visit.familyHistory || visit.socialHistory) && (
                                                 <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                   <div className="text-[11px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-book-medical text-[10px]"></i> التاريخ المرضي
                                                   </div>
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                     {visit.presentIllness && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">المرض الحالي:</span> <span className="text-slate-700">{visit.presentIllness}</span></div>
                                                     )}
                                                     {visit.pastMedicalHistory && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">التاريخ الطبي:</span> <span className="text-slate-700">{visit.pastMedicalHistory}</span></div>
                                                     )}
                                                     {visit.surgicalHistory && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">التاريخ الجراحي:</span> <span className="text-slate-700">{visit.surgicalHistory}</span></div>
                                                     )}
                                                     {visit.currentMedications && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">الأدوية الحالية:</span> <span className="text-slate-700">{visit.currentMedications}</span></div>
                                                     )}
                                                     {visit.allergies && (
                                                       <div className="text-xs"><span className="font-bold text-red-500">الحساسية:</span> <span className="text-red-700">{visit.allergies}</span></div>
                                                     )}
                                                     {visit.familyHistory && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">تاريخ العائلة:</span> <span className="text-slate-700">{visit.familyHistory}</span></div>
                                                     )}
                                                     {visit.socialHistory && (
                                                       <div className="text-xs"><span className="font-bold text-slate-500">التاريخ الاجتماعي:</span> <span className="text-slate-700">{visit.socialHistory}</span></div>
                                                     )}
                                                   </div>
                                                 </div>
                                               )}

                                               {/* 3. Examination */}
                                               {(visit.generalExamination || visit.systemicExamination || hasVitals) && (
                                                 <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                   <div className="text-[11px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-stethoscope text-[10px]"></i> الفحص السريري
                                                   </div>
                                                   {visit.generalExamination && (
                                                     <div className="text-xs mb-2"><span className="font-bold text-slate-500">الفحص العام:</span> <span className="text-slate-700">{visit.generalExamination}</span></div>
                                                   )}
                                                   {visit.systemicExamination && (
                                                     <div className="text-xs mb-2"><span className="font-bold text-slate-500">فحص الأجهزة:</span> <span className="text-slate-700">{visit.systemicExamination}</span></div>
                                                   )}
                                                   {hasVitals && (
                                                     <div className="mt-2">
                                                       <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">العلامات الحيوية</div>
                                                       <div className="flex flex-wrap gap-2">
                                                         {visit.vitalSigns?.bloodPressure && (
                                                           <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1">
                                                             <i className="fa-solid fa-heart-pulse text-[9px]"></i> {visit.vitalSigns.bloodPressure}
                                                           </span>
                                                         )}
                                                         {visit.vitalSigns?.pulse && (
                                                           <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded text-[11px] font-medium">
                                                             ❤️ {visit.vitalSigns.pulse} bpm
                                                           </span>
                                                         )}
                                                         {visit.vitalSigns?.temperature && (
                                                           <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[11px] font-medium">
                                                             🌡️ {visit.vitalSigns.temperature}°C
                                                           </span>
                                                         )}
                                                         {visit.vitalSigns?.respiratoryRate && (
                                                           <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[11px] font-medium">
                                                             🫁 {visit.vitalSigns.respiratoryRate}/min
                                                           </span>
                                                         )}
                                                         {visit.vitalSigns?.oxygenSaturation && (
                                                           <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[11px] font-medium">
                                                             O₂ {visit.vitalSigns.oxygenSaturation}%
                                                           </span>
                                                         )}
                                                       </div>
                                                     </div>
                                                   )}
                                                 </div>
                                               )}

                                               {/* 4. Assessment / Diagnosis */}
                                               {(visit.preliminaryDiagnosis || visit.differentialDiagnosis || visit.diagnosis) && (
                                                 <div className="bg-white p-3 rounded-lg border border-emerald-100">
                                                   <div className="text-[11px] font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-clipboard-check text-[10px]"></i> التشخيص
                                                   </div>
                                                   {(visit.preliminaryDiagnosis || visit.diagnosis) && (
                                                     <div className="text-sm font-medium text-slate-800 mb-1">
                                                       {visit.preliminaryDiagnosis || visit.diagnosis}
                                                     </div>
                                                   )}
                                                   {visit.differentialDiagnosis && (
                                                     <div className="text-xs text-slate-500">
                                                       <span className="font-bold">تشخيص تفريقي:</span> {visit.differentialDiagnosis}
                                                     </div>
                                                   )}
                                                 </div>
                                               )}

                                               {/* 5. Prescriptions */}
                                               {visit.prescriptions && visit.prescriptions.length > 0 && (
                                                 <div className="bg-white p-3 rounded-lg border border-amber-100">
                                                   <div className="text-[11px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-prescription text-[10px]"></i> الوصفة الطبية
                                                   </div>
                                                   <div className="flex flex-wrap gap-1.5">
                                                     {visit.prescriptions.map((rx, i) => (
                                                       <span key={i} className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-100">
                                                         💊 {rx.drugName} {rx.dosage} {rx.frequency ? `• ${rx.frequency}` : ''} {rx.duration ? `• ${rx.duration}` : ''}
                                                       </span>
                                                     ))}
                                                   </div>
                                                 </div>
                                               )}

                                               {/* 6. Lab Orders */}
                                               {hasLabs && (
                                                 <div className="bg-white p-3 rounded-lg border border-purple-100">
                                                   <div className="text-[11px] font-bold text-purple-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-flask text-[10px]"></i> طلبات المختبر
                                                   </div>
                                                   <div className="space-y-1.5">
                                                     {visit.labOrders!.map((lab, i) => (
                                                       <div key={i} className="flex items-center justify-between bg-purple-50 px-3 py-1.5 rounded-lg text-xs">
                                                         <span className="font-medium text-purple-800">🧪 {lab.testName}</span>
                                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lab.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                           {lab.status === 'Completed' ? '✓ مكتمل' : '⏳ معلق'}
                                                         </span>
                                                       </div>
                                                     ))}
                                                   </div>
                                                 </div>
                                               )}

                                               {/* 7. Imaging Orders */}
                                               {hasImaging && (
                                                 <div className="bg-white p-3 rounded-lg border border-sky-100">
                                                   <div className="text-[11px] font-bold text-sky-600 uppercase mb-2 flex items-center gap-1">
                                                     <i className="fa-solid fa-x-ray text-[10px]"></i> طلبات الأشعة
                                                   </div>
                                                   <div className="space-y-1.5">
                                                     {visit.imagingOrders!.map((img, i) => (
                                                       <div key={i} className="flex items-center justify-between bg-sky-50 px-3 py-1.5 rounded-lg text-xs">
                                                         <span className="font-medium text-sky-800">📷 {img.imagingType} - {img.bodyPart}</span>
                                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${img.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                           {img.status === 'Completed' ? '✓ مكتمل' : '⏳ معلق'}
                                                         </span>
                                                       </div>
                                                     ))}
                                                   </div>
                                                 </div>
                                               )}

                                               {/* 8. Doctor Notes */}
                                               {visit.doctorNotes && (
                                                 <div className="bg-white p-3 rounded-lg border border-amber-100">
                                                   <div className="text-[11px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                                     <i className="fa-solid fa-note-sticky text-[10px]"></i> ملاحظات الطبيب
                                                   </div>
                                                   <div className="text-sm text-slate-700 italic">"{visit.doctorNotes}"</div>
                                                 </div>
                                               )}

                                               {/* 9. Attachments */}
                                               {visit.attachments && visit.attachments.length > 0 && (
                                                   <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                       <div className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                                         <i className="fa-solid fa-paperclip text-[10px]"></i> المرفقات
                                                       </div>
                                                       <div className="flex flex-wrap gap-2">
                                                           {visit.attachments.map((att, i) => (
                                                               <a 
                                                                   key={i} 
                                                                   href={att.url} 
                                                                   target="_blank" 
                                                                   rel="noopener noreferrer" 
                                                                   className="block w-16 h-16 rounded-lg border border-slate-200 overflow-hidden hover:border-primary transition-all hover:scale-105 relative group shadow-sm"
                                                                   title={att.name}
                                                               >
                                                                   {att.type === 'image' ? (
                                                                       <img src={att.url} className="w-full h-full object-cover" alt="attachment" />
                                                                   ) : (
                                                                       <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-1">
                                                                           <i className="fa-solid fa-file-pdf text-xl text-red-400"></i>
                                                                           <span className="text-[8px] uppercase font-bold">PDF</span>
                                                                       </div>
                                                                   )}
                                                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                       <i className="fa-solid fa-magnifying-glass-plus"></i>
                                                                   </div>
                                                               </a>
                                                           ))}
                                                       </div>
                                                   </div>
                                               )}

                                               {/* No data message */}
                                               {!hasSOAP && !visit.diagnosis && (!visit.prescriptions || visit.prescriptions.length === 0) && !hasLabs && !hasImaging && !visit.doctorNotes && (!visit.attachments || visit.attachments.length === 0) && (
                                                 <div className="text-center py-4 text-slate-400 text-xs">
                                                   <i className="fa-solid fa-inbox text-lg mb-1"></i>
                                                   <p>لا توجد بيانات سريرية مسجلة لهذه الزيارة</p>
                                                 </div>
                                               )}

                                           </div>
                                       )}
                                   </div>
                               </div>
                               <div className="text-right shrink-0">
                                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                       visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                   }`}>
                                       {visit.status}
                                   </span>
                               </div>
                           </div>
                       </div>
                       );
                   })}
               </div>
           )}

           {/* TAB 3: CLINICAL DATA (Protected) */}
           {activeTab === 'clinical' && (
               <div className="animate-fade-in">
                   {user?.role === UserRole.SECRETARY ? (
                       // Secretary View (Restricted)
                       <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                           <i className="fa-solid fa-user-lock text-4xl mb-3 text-slate-300"></i>
                           <p>{t('access_denied_msg')}</p>
                       </div>
                   ) : (
                       // Doctor View (Editable)
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <div className="space-y-6">
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">{t('diagnosis')}</label>
                                   <textarea 
                                       className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                       placeholder={t('diagnosis_placeholder')}
                                       value={diagnosis}
                                       onChange={e => setDiagnosis(e.target.value)}
                                   ></textarea>
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">{t('treatment')}</label>
                                   <textarea 
                                       className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                       placeholder={t('treatment_placeholder')}
                                       value={treatment}
                                       onChange={e => setTreatment(e.target.value)}
                                   ></textarea>
                               </div>
                               <div className="pt-4">
                                   <button 
                                     onClick={handleSaveClinical}
                                     className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
                                   >
                                       <i className="fa-solid fa-save"></i> {t('save_changes')}
                                   </button>
                               </div>
                           </div>
                           
                           {/* Read-Only Context Side */}
                           <div className="bg-slate-50 p-6 rounded-lg border border-gray-100 h-fit">
                               <h4 className="text-xs font-bold uppercase text-slate-400 mb-4">Visit Metadata</h4>
                               <div className="space-y-4 text-sm">
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Visit ID</span>
                                       <span className="font-mono text-slate-700">{patient.currentVisit.visitId}</span>
                                   </div>
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Date</span>
                                       <span className="text-slate-700">{fmtDateTime(patient.currentVisit.date)}</span>
                                   </div>
                                   <div className="flex justify-between">
                                       <span className="text-slate-500">Priority</span>
                                       <span className={`font-bold ${patient.currentVisit.priority === 'urgent' ? 'text-red-600' : 'text-slate-700'}`}>
                                           {patient.currentVisit.priority}
                                       </span>
                                   </div>
                                   <div className="mt-4 pt-4 border-t border-gray-200">
                                       <div className="text-xs text-slate-400 mb-1">Reason for Visit</div>
                                       <div className="font-medium text-slate-800 italic">"{patient.currentVisit.reasonForVisit}"</div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {/* TAB 4: DEVICE RESULTS */}
           {activeTab === 'devices' && (
               <div className="animate-fade-in">
                   <DeviceResultsTimeline patientId={patient.id} />
               </div>
           )}

           {/* TAB 5: ENT FORMS */}
           {activeTab === 'ent-forms' && (
               <div className="animate-fade-in">
                   {entLoading ? (
                     <div className="flex items-center justify-center py-20">
                       <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
                     </div>
                   ) : !entForms ? (
                     <div className="text-center text-slate-400 py-20">
                       <i className="fa-solid fa-folder-open text-4xl mb-3"></i>
                       <p>لا توجد نماذج محفوظة</p>
                     </div>
                   ) : (
                     <div className="space-y-6">
                       {/* Summary Cards */}
                       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                         {[
                           { key: 'newPatientForms', label: 'استبيان مريض جديد', icon: 'fa-file-medical', color: 'blue', endpoint: 'new-patient' },
                           { key: 'followUpForms', label: 'متابعة', icon: 'fa-file-lines', color: 'green', endpoint: 'follow-up' },
                           { key: 'audiograms', label: 'فحص السمع', icon: 'fa-ear-listen', color: 'purple', endpoint: 'audiogram' },
                           { key: 'balanceAssessments', label: 'فحص التوازن', icon: 'fa-person-walking', color: 'amber', endpoint: 'balance-assessment' },
                           { key: 'referrals', label: 'تحويل طبي', icon: 'fa-share-from-square', color: 'rose', endpoint: 'referral' },
                         ].map(cat => {
                           const count = entForms[cat.key]?.length || 0;
                           return (
                             <button key={cat.key} onClick={() => { setEntExpanded(entExpanded === cat.key ? null : cat.key); setEntDetail(null); }}
                               className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${
                                 entExpanded === cat.key
                                   ? `bg-${cat.color}-100 border-${cat.color}-400 ring-2 ring-${cat.color}-300`
                                   : `bg-${cat.color}-50 border-${cat.color}-200 hover:bg-${cat.color}-100`
                               }`}>
                               <i className={`fa-solid ${cat.icon} text-2xl text-${cat.color}-600`}></i>
                               <span className="text-xs font-bold leading-tight">{cat.label}</span>
                               <span className={`text-lg font-black text-${cat.color}-700`}>{count}</span>
                             </button>
                           );
                         })}
                       </div>

                       {/* Expanded List */}
                       {entExpanded && entForms[entExpanded] && entForms[entExpanded].length > 0 && (
                         <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                           <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                             <i className="fa-solid fa-list"></i>
                             السجلات ({entForms[entExpanded].length})
                           </h3>
                           <div className="space-y-2">
                             {entForms[entExpanded].map((form: any, idx: number) => {
                               const formType = entExpanded === 'newPatientForms' ? 'new-patient'
                                 : entExpanded === 'followUpForms' ? 'follow-up'
                                 : entExpanded === 'audiograms' ? 'audiogram'
                                 : entExpanded === 'balanceAssessments' ? 'balance-assessment'
                                 : 'referral';
                               const summary = form.chief_complaint || form.follow_up_reason || form.hearing_level || form.vestibular_function || form.referred_to_specialty || '—';
                               return (
                                 <button key={form.id} onClick={async () => {
                                   setEntDetailLoading(true);
                                   try {
                                     const data = await api.get(`/ent-forms/${formType}/${patient.id}`);
                                     const found = (data as any[]).find((d: any) => d.id === form.id);
                                     setEntDetail({ type: formType, data: found || form });
                                   } catch { setEntDetail({ type: formType, data: form }); }
                                   setEntDetailLoading(false);
                                 }}
                                   className={`w-full text-right p-4 rounded-xl border transition-all flex justify-between items-center ${
                                     entDetail?.data?.id === form.id ? 'bg-white border-primary shadow-md' : 'bg-white border-slate-100 hover:border-primary/40 hover:shadow-sm'
                                   }`}>
                                   <div>
                                     <span className="text-sm font-bold text-slate-700">#{idx + 1}</span>
                                     <span className="text-xs text-slate-400 mr-3">{new Date(form.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                   <span className="text-xs text-slate-500 max-w-[200px] truncate">{summary}</span>
                                 </button>
                               );
                             })}
                           </div>
                         </div>
                       )}

                       {entExpanded && entForms[entExpanded]?.length === 0 && (
                         <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                           <i className="fa-solid fa-inbox text-3xl mb-2"></i>
                           <p>لا توجد سجلات من هذا النوع</p>
                         </div>
                       )}

                       {/* Detail View */}
                       {entDetailLoading && (
                         <div className="flex items-center justify-center py-10">
                           <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
                         </div>
                       )}
                       {entDetail && !entDetailLoading && (
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" dir="rtl">
                           <div className="flex items-center justify-between mb-4">
                             <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                               <i className="fa-solid fa-file-medical text-primary"></i> تفاصيل النموذج
                             </h3>
                             <span className="text-xs text-slate-400">{new Date(entDetail.data.created_at).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                           </div>
                           
                           {entDetail.type === 'new-patient' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DetailField label="الشكوى الرئيسية" value={entDetail.data.chief_complaint} />
                               <DetailField label="مدة الأعراض" value={entDetail.data.symptom_duration} />
                               <DetailField label="جهة الأعراض" value={{right:'يمين',left:'يسار',both:'كلاهما',none:'غير محدد'}[entDetail.data.symptom_side as string] || entDetail.data.symptom_side} />
                               <DetailField label="علاج ENT سابق" value={entDetail.data.previous_ent_treatment ? `نعم — ${entDetail.data.previous_ent_details}` : 'لا'} />
                               <DetailField label="عمليات ENT سابقة" value={entDetail.data.previous_ent_surgery ? `نعم — ${entDetail.data.previous_ent_surgery_details}` : 'لا'} />
                               {entDetail.data.symptoms && typeof entDetail.data.symptoms === 'object' && (
                                 <div className="md:col-span-2">
                                   <div className="text-xs font-bold uppercase text-slate-400 mb-2">الأعراض</div>
                                   <div className="flex flex-wrap gap-2">
                                     {Object.entries(entDetail.data.symptoms).filter(([k, v]) => v === true).map(([k]) => (
                                       <span key={k} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                                         {{earPain:'ألم أذن',hearingLoss:'ضعف سمع',tinnitus:'طنين',earDischarge:'إفرازات أذن',vertigo:'دوخة',nasalObstruction:'انسداد أنف',nasalDischarge:'إفرازات أنف',sneezing:'عطاس',soreThroat:'ألم حلق',voiceChange:'تغير صوت',dysphagia:'صعوبة بلع',snoring:'شخير',sleepApnea:'انقطاع نفس',facialPain:'ألم وجه',headache:'صداع',nosebleeds:'رعاف',lossOfSmell:'فقدان شم',neckMass:'كتلة رقبة'}[k] || k}
                                       </span>
                                     ))}
                                     {entDetail.data.symptoms.other && <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">{entDetail.data.symptoms.other}</span>}
                                   </div>
                                 </div>
                               )}
                               {entDetail.data.notes && <DetailField label="ملاحظات" value={entDetail.data.notes} span2 />}
                             </div>
                           )}

                           {entDetail.type === 'follow-up' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DetailField label="سبب المتابعة" value={entDetail.data.follow_up_reason} />
                               <DetailField label="التشخيص السابق" value={entDetail.data.previous_diagnosis} />
                               <DetailField label="الالتزام بالعلاج" value={{full:'كامل',partial:'جزئي',none:'لا يوجد'}[entDetail.data.treatment_compliance as string] || entDetail.data.treatment_compliance} />
                               <DetailField label="تقييم الأعراض" value={{improved:'تحسن',same:'كما هي',worsened:'تفاقمت'}[entDetail.data.symptom_assessment as string] || entDetail.data.symptom_assessment} />
                               <DetailField label="أعراض جديدة" value={entDetail.data.new_symptoms} />
                               <DetailField label="فعالية الأدوية" value={entDetail.data.medication_effectiveness} />
                               {entDetail.data.is_surgical_follow_up && <DetailField label="العملية الجراحية" value={entDetail.data.surgical_procedure} />}
                               {entDetail.data.is_surgical_follow_up && <DetailField label="التئام الجرح" value={entDetail.data.wound_healing} />}
                               <DetailField label="الخطوات القادمة" value={entDetail.data.next_steps} />
                               {entDetail.data.notes && <DetailField label="ملاحظات" value={entDetail.data.notes} span2 />}
                             </div>
                           )}

                           {entDetail.type === 'audiogram' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DetailField label="مستوى السمع" value={entDetail.data.hearing_level} />
                               <DetailField label="نوع ضعف السمع" value={entDetail.data.hearing_loss_type} />
                               <DetailField label="توصية بسماعة" value={entDetail.data.recommend_hearing_aid ? 'نعم' : 'لا'} />
                               <DetailField label="OAE" value={entDetail.data.oae} />
                               {entDetail.data.notes && <DetailField label="ملاحظات" value={entDetail.data.notes} span2 />}
                             </div>
                           )}

                           {entDetail.type === 'balance-assessment' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DetailField label="وظيفة الدهليز" value={entDetail.data.vestibular_function} />
                               {entDetail.data.notes && <DetailField label="ملاحظات" value={entDetail.data.notes} span2 />}
                             </div>
                           )}

                           {entDetail.type === 'referral' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DetailField label="الطبيب المحوّل" value={entDetail.data.referring_doctor} />
                               <DetailField label="التخصص" value={entDetail.data.referred_to_specialty} />
                               <DetailField label="الطبيب المحال إليه" value={entDetail.data.referred_to_doctor} />
                               <DetailField label="المستشفى" value={entDetail.data.referred_to_hospital} />
                               <DetailField label="الاستعجال" value={{routine:'عادي',urgent:'مستعجل',emergency:'طوارئ'}[entDetail.data.urgency as string] || entDetail.data.urgency} />
                               {entDetail.data.notes && <DetailField label="ملاحظات" value={entDetail.data.notes} span2 />}
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   )}
               </div>
           )}

       </div>

       <style>{`
         .animate-fade-in { animation: fadeIn 0.3s ease-out; }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
       `}</style>
    </Layout>
  );
};

export default PatientProfileView;
