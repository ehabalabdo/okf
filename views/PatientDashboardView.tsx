import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Patient, VisitData, Appointment } from '../types';
import { pgPatients, pgAppointments } from '../services/apiServices';
import { fmtDate } from '../utils/formatters';

const PatientDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { patientUser, logout } = useAuth();
  const { t, dir, language } = useLanguage();

  // Show cached data immediately - no waiting for DB
  const [patient, setPatient] = useState<Patient | null>(patientUser as Patient | null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load fresh data from database in background (non-blocking)
  useEffect(() => {
    if (!patientUser) {
      navigate('/patient/login');
      return;
    }

    // Set patient from cache immediately
    setPatient(patientUser as Patient);

    let isMounted = true;

    const refreshData = async () => {
      if (!isMounted) return;
      setRefreshing(true);
      
      try {
        // Load fresh patient data (use getAll with client_id scope, then find by id)
        const freshData = await pgPatients.getById(patientUser.id);
        if (isMounted && freshData) setPatient(freshData);
      } catch (e) {
        console.error('[PatientDashboard] Patient error:', e);
      }

      try {
        // Load appointments
        const myApps = await pgAppointments.getByPatientId(patientUser.id);
        if (isMounted) {
          const upcomingApps = myApps.filter(a => 
            a.status === 'scheduled' && a.date >= Date.now()
          );
          setAppointments(upcomingApps.sort((a, b) => a.date - b.date));
        }
      } catch (e) {
        console.error('[PatientDashboard] Appointments error:', e);
      }

      if (isMounted) setRefreshing(false);
    };

    // Start background refresh
    refreshData();

    // Poll every 60 seconds (less frequent)
    const pollTimer = setInterval(refreshData, 60000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [patientUser?.id, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/patient/login');
  };

  if (!patient) {
    // Redirect if no patient (not logged in)
    navigate('/patient/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MED LOOP" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {t('patient_portal')}
                {refreshing && <i className="fa-solid fa-sync fa-spin text-primary text-sm mr-2"></i>}
              </h1>
              <p className="text-xs text-slate-500">{t('patient_portal_subtitle')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-all"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            {t('patient_logout')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{t('welcome_patient')}{language === 'ar' ? '،' : ','} {patient.name}</h2>
              <p className="text-white/70 text-sm">{t('health_wish')}</p>
            </div>
          </div>
        </div>

        {/* Current Visit Status - Show if patient has active visit */}
        {patient.currentVisit && patient.currentVisit.visitId && patient.currentVisit.visitId.trim() !== '' && (
          <div className={`rounded-2xl shadow-xl p-6 mb-8 border-2 ${
            patient.currentVisit.status === 'in-progress' 
              ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400' 
              : patient.currentVisit.status === 'waiting'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400'
              : 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400'
          } text-white animate-pulse-slow`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                  {patient.currentVisit.status === 'in-progress' ? (
                    <i className="fa-solid fa-user-doctor animate-bounce"></i>
                  ) : patient.currentVisit.status === 'waiting' ? (
                    <i className="fa-solid fa-clock"></i>
                  ) : (
                    <i className="fa-solid fa-check-circle"></i>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {patient.currentVisit.status === 'in-progress' 
                      ? `🔔 ${t('your_turn')}` 
                      : patient.currentVisit.status === 'waiting'
                      ? t('in_queue')
                      : t('visit_complete')
                    }
                  </h3>
                  <p className="text-sm opacity-90">
                    {patient.currentVisit.status === 'in-progress' 
                      ? t('go_to_exam_room') 
                      : patient.currentVisit.status === 'waiting'
                      ? t('please_wait_turn')
                      : t('thank_you_visit')
                    }
                  </p>
                  {patient.currentVisit.reasonForVisit && (
                    <p className="text-xs opacity-75 mt-1">
                      <i className="fa-solid fa-notes-medical mr-1"></i>
                      {t('visit_reason_label')}: {patient.currentVisit.reasonForVisit}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-75">{t('arrival_time')}</div>
                <div className="text-xl font-bold font-mono">
                  {new Date(patient.currentVisit.date).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{appointments.length}</div>
                <div className="text-sm text-slate-500">{t('upcoming_appointments')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xl">
                <i className="fa-solid fa-file-medical"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{patient.history?.length || 0}</div>
                <div className="text-sm text-slate-500">{t('past_visits')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-xl">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">0</div>
                <div className="text-sm text-slate-500">{t('pending_invoices_patient')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-id-card text-primary"></i>
                {t('personal_info_patient')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-slate-500 text-sm">{t('full_name_patient')}</span>
                <span className="font-medium text-slate-800">{patient.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-slate-500 text-sm">{t('age_patient')}</span>
                <span className="font-medium text-slate-800">{patient.age} {t('years')}{patient.dateOfBirth ? ` (${t('born_in')} ${patient.dateOfBirth})` : ''}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-slate-500 text-sm">{t('gender_patient')}</span>
                <span className="font-medium text-slate-800">{patient.gender === 'male' ? t('male') : t('female')}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-slate-500 text-sm">{t('phone_patient')}</span>
                <span className="font-medium text-slate-800 font-mono">{patient.phone}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-slate-500 text-sm">{t('email_patient')}</span>
                <span className="font-medium text-slate-800">{patient.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-green-500"></i>
                {t('medical_record')}
              </h3>
            </div>
            {patient.history && patient.history.length > 0 ? (
              <div className="space-y-4">
                {patient.history.slice(0, 5).map((visit, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-800">
                        {fmtDate(visit.date)}
                      </div>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <i className="fa-solid fa-check-circle"></i> {t('completed_status')}
                      </span>
                    </div>
                    {visit.reasonForVisit && (
                      <div className="text-xs text-slate-500">
                        <i className="fa-solid fa-comment-medical ml-1 text-primary"></i> {visit.reasonForVisit}
                      </div>
                    )}
                    {visit.chiefComplaint && (
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-slate-500">{t('complaint_label')}:</span> {visit.chiefComplaint}
                      </div>
                    )}
                    {(visit.preliminaryDiagnosis || visit.diagnosis) && (
                      <div className="text-xs bg-emerald-50 text-emerald-700 p-2 rounded-lg font-medium">
                        <i className="fa-solid fa-clipboard-check ml-1"></i> {t('diagnosis_label')}: {visit.preliminaryDiagnosis || visit.diagnosis}
                      </div>
                    )}
                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {visit.prescriptions.map((rx, i) => (
                          <span key={i} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                            💊 {rx.drugName} {rx.dosage}
                          </span>
                        ))}
                      </div>
                    )}
                    {visit.labOrders && visit.labOrders.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {visit.labOrders.map((lab, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${lab.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            🧪 {lab.testName}
                          </span>
                        ))}
                      </div>
                    )}
                    {visit.imagingOrders && visit.imagingOrders.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {visit.imagingOrders.map((img, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${img.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            📷 {img.imagingType} - {img.bodyPart}
                          </span>
                        ))}
                      </div>
                    )}
                    {visit.doctorNotes && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg italic">
                        <i className="fa-solid fa-note-sticky ml-1"></i> {visit.doctorNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <i className="fa-solid fa-folder-open text-4xl mb-3"></i>
                <p className="text-sm">{t('no_past_visits')}</p>
              </div>
            )}
          </div>

          {/* Medical Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                {t('medical_alerts')}
              </h3>
            </div>
            {patient.medicalProfile.allergies.exists || patient.medicalProfile.chronicConditions.exists ? (
              <div className="space-y-3">
                {patient.medicalProfile.allergies.exists && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="text-xs font-bold text-red-800 uppercase mb-1">{t('allergy_label')}</div>
                    <div className="text-sm text-red-700">{patient.medicalProfile.allergies.details}</div>
                  </div>
                )}
                {patient.medicalProfile.chronicConditions.exists && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <div className="text-xs font-bold text-orange-800 uppercase mb-1">{t('chronic_label')}</div>
                    <div className="text-sm text-orange-700">{patient.medicalProfile.chronicConditions.details}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-green-600">
                <i className="fa-solid fa-shield-check text-4xl mb-3"></i>
                <p className="text-sm font-medium">{t('no_medical_alerts')}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-bolt text-yellow-500"></i>
                {t('quick_actions')}
              </h3>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-file-medical"></i>
                {t('view_full_medical_record')}
              </button>
              <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <i className="fa-solid fa-receipt"></i>
                {t('view_invoices')}
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-calendar-check text-primary"></i>
                {t('upcoming_appointments')}
              </h3>
            </div>
            <div className="space-y-3">
              {appointments.map(app => (
                <div key={app.id} className="rounded-xl p-4 border bg-primary/5 border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                        <i className="text-xl fa-solid fa-calendar-day"></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {fmtDate(app.date)}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          <i className="fa-solid fa-clock ml-1"></i>
                          {new Date(app.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {app.reason && <div className="text-xs text-slate-400 mt-1">{app.reason}</div>}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-white">
                      {t('confirmed_status')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 MED LOOP. {t('all_rights_reserved')}</p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.01); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboardView;
