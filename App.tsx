
import React, { useEffect, useState } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClientProvider, useClient } from './context/ClientContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserRole, User } from './types';
import LoginView from './views/LoginView';
import AdminView from './views/AdminView';
import ReceptionView from './views/ReceptionView';
import DoctorView from './views/DoctorView';
import QueueDisplayView from './views/QueueDisplayView';
import PatientsRegistryView from './views/PatientsRegistryView';
import PatientProfileView from './views/PatientProfileView';
import AppointmentsView from './views/AppointmentsView'; 

import PatientLoginView from './views/PatientLoginView';
import PatientDashboardView from './views/PatientDashboardView';
import ClinicHistoryView from './views/ClinicHistoryView';
import DeviceResultsView from './views/DeviceResultsView';
import DeviceManagementView from './views/DeviceManagementView';
import SuperAdminView from './views/SuperAdminView';
import LandingView from './views/LandingView';
import HrEmployeesView from './views/HrEmployeesView';
import HrAttendanceView from './views/HrAttendanceView';
import HrReportsView from './views/HrReportsView';
import HrEmployeeMeView from './views/HrEmployeeMeView';
import HrPayrollView from './views/HrPayrollView';
import HrManagerActionsView from './views/HrManagerActionsView';
import CatalogView from './views/CatalogView';
import AccountingView from './views/AccountingView';
import ENTNewPatientFormView from './views/ENTNewPatientFormView';
import ENTFollowUpFormView from './views/ENTFollowUpFormView';
import AudiogramFormView from './views/AudiogramFormView';
import BalanceAssessmentFormView from './views/BalanceAssessmentFormView';
import ReferralFormView from './views/ReferralFormView';
import TechnicianView from './views/TechnicianView';
// HrLoginView removed — HR login integrated into main LoginView
import DevModeSwitcher from './components/DevModeSwitcher';
import ErrorBoundary from './components/ErrorBoundary';

// --- Safe Router Strategy ---
const SafeRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [useMemory, setUseMemory] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      if (!window.location) throw new Error("No location");
      if (window.location.protocol === 'blob:' || window.location.origin === 'null') {
         // Keep MemoryRouter
      } else {
         setUseMemory(false);
      }
    } catch (e) {
      console.warn("Environment restricted: defaulting to MemoryRouter");
    } finally {
      setChecked(true);
    }
  }, []);

  if (!checked) return null;

  return useMemory ? (
    <MemoryRouter>{children}</MemoryRouter>
  ) : (
    <BrowserRouter>{children}</BrowserRouter>
  );
};

// --- Redirect Helper ---
const RedirectHandler = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return null;
};

// --- Route Guard ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// --- Expired Block Screen (blocks entire system) ---
const ExpiredBlockScreen: React.FC = () => {
  const { isExpired, client } = useClient();
  const { t, dir } = useLanguage();
  if (!isExpired) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center" dir={dir}>
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md text-center border border-white/20 shadow-2xl">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-lock text-red-400 text-4xl"></i>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{t('app_subscription_expired')}</h1>
        <p className="text-slate-300 mb-2 text-lg">{client?.name || t('app_center_name_fallback')}</p>
        <p className="text-slate-400 text-sm mb-6">
          {client?.status === 'trial' 
            ? t('app_trial_expired')
            : client?.status === 'suspended'
            ? t('app_suspended')
            : t('app_subscription_ended')}
        </p>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <p className="text-slate-400 text-xs mb-1">{t('app_contact_management')}</p>
          <p className="text-white font-bold text-lg">0790904030</p>
        </div>
        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('patientUser'); window.location.href = '/login'; }}
          className="text-slate-500 hover:text-white text-sm transition">
          <i className="fa-solid fa-arrow-right-from-bracket ml-1"></i> {t('app_logout')}
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
      </div>
    );
  }

  if (!user) {
    return <RedirectHandler to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === UserRole.ADMIN) return <RedirectHandler to="/admin" />;
    if (user.role === UserRole.SECRETARY) return <RedirectHandler to="/reception" />;
    if (user.role === UserRole.DOCTOR) return <RedirectHandler to="/doctor" />;
    if (user.role === UserRole.TECHNICIAN) return <RedirectHandler to="/technician" />;
    return <RedirectHandler to="/login" />;
  }

  return <>{children}</>;
};

// --- HR Employee Route Guard (separate from staff auth) ---
const HrEmployeeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hrData = localStorage.getItem('hrEmployee');
  if (!hrData) return <RedirectHandler to="/login" />;
  try {
    const parsed = JSON.parse(hrData);
    if (!parsed.id) return <RedirectHandler to="/login" />;
  } catch {
    return <RedirectHandler to="/login" />;
  }
  return <>{children}</>;
};

// --- Helper to Determine Home Page ---
const getHomeRoute = (user: User): string => {
  if (user.role === UserRole.ADMIN) return '/admin';
  if (user.role === UserRole.SECRETARY) return '/reception';
  if (user.role === UserRole.DOCTOR) return '/doctor';
  return '/login';
};

// --- App Router ---
const AppRoutes: React.FC = () => {
  const { user, patientUser } = useAuth();
  const location = useLocation();

  // Landing page: render directly without ClientGate (no backend dependency)
  if (location.pathname === '/' && !user) {
    return <LandingView />;
  }

  return (
    <ClientProvider slug="tarek">
      <ClientGate>
        <ExpiredBlockScreen />
        <Routes>
          {/* Super Admin */}
          <Route path="/super-admin" element={<SuperAdminView />} />

          {/* Login */}
          <Route path="/login" element={user ? <RedirectHandler to={getHomeRoute(user)} /> : <LoginView />} />

          {/* Patient Portal */}
          <Route path="/patient/login" element={patientUser ? <RedirectHandler to="/patient/dashboard" /> : <PatientLoginView />} />
          <Route path="/patient/dashboard" element={patientUser ? <PatientDashboardView /> : <RedirectHandler to="/patient/login" />} />

          {/* Staff Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminView /></ProtectedRoute>} />
          <Route path="/reception" element={<ProtectedRoute allowedRoles={[UserRole.SECRETARY]}><ReceptionView /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={[UserRole.DOCTOR]}><DoctorView /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute allowedRoles={[UserRole.TECHNICIAN]}><TechnicianView /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><PatientsRegistryView /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><PatientProfileView /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><AppointmentsView /></ProtectedRoute>} />
          <Route path="/clinic-history" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DOCTOR]}><ClinicHistoryView /></ProtectedRoute>} />
          <Route path="/device-results" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><DeviceResultsView /></ProtectedRoute>} />
          <Route path="/device-management" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><DeviceManagementView /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><CatalogView /></ProtectedRoute>} />
          <Route path="/accounting" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AccountingView /></ProtectedRoute>} />
          <Route path="/queue-display" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY]}><QueueDisplayView /></ProtectedRoute>} />

          {/* ENT Medical Forms */}
          <Route path="/ent/new-patient" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR, UserRole.TECHNICIAN]}><ENTNewPatientFormView /></ProtectedRoute>} />
          <Route path="/ent/follow-up" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR, UserRole.TECHNICIAN]}><ENTFollowUpFormView /></ProtectedRoute>} />
          <Route path="/ent/audiogram" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR, UserRole.TECHNICIAN]}><AudiogramFormView /></ProtectedRoute>} />
          <Route path="/ent/balance" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR, UserRole.TECHNICIAN]}><BalanceAssessmentFormView /></ProtectedRoute>} />
          <Route path="/ent/referral" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR, UserRole.TECHNICIAN]}><ReferralFormView /></ProtectedRoute>} />

          {/* HR Admin Routes */}
          <Route path="/hr/employees" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><HrEmployeesView /></ProtectedRoute>} />
          <Route path="/hr/attendance" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><HrAttendanceView /></ProtectedRoute>} />
          <Route path="/hr/reports" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><HrReportsView /></ProtectedRoute>} />
          <Route path="/hr/payroll" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><HrPayrollView /></ProtectedRoute>} />
          <Route path="/hr/actions" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><HrManagerActionsView /></ProtectedRoute>} />

          {/* HR Employee Portal */}
          <Route path="/hr/me" element={<HrEmployeeGuard><HrEmployeeMeView /></HrEmployeeGuard>} />

          {/* Logged-in user on "/" → redirect to home */}
          <Route path="/" element={<RedirectHandler to={user ? getHomeRoute(user) : '/login'} />} />
          <Route path="*" element={<RedirectHandler to="/" />} />
        </Routes>
      </ClientGate>
    </ClientProvider>
  );
};

// --- Client Gate: Shows loading/error while resolving client ---
const ClientGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client, loading, error } = useClient();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary mb-3"></i>
          <p className="text-slate-500">{t('app_loading_center')}</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg max-w-md">
          <i className="fa-solid fa-building-circle-xmark text-5xl text-red-400 mb-4"></i>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('app_center_not_found')}</h2>
          <p className="text-slate-500 mb-4">{error || t('app_check_url')}</p>
          <a href="/super-admin" className="text-primary hover:underline text-sm">{t('app_go_to_control_panel')}</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <SafeRouter>
              <AppRoutes />
              {window.location.hostname === 'localhost' && <DevModeSwitcher />}
            </SafeRouter>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
