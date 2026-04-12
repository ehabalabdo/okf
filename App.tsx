
import React, { useEffect, useState } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

import ClinicHistoryView from './views/ClinicHistoryView';
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
import AccountantView from './views/AccountantView';
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
    if (user.role === UserRole.ACCOUNTANT || user.role === UserRole.SENIOR_ACCOUNTANT) return <RedirectHandler to="/accountant" />;
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
  if (user.role === UserRole.ACCOUNTANT || user.role === UserRole.SENIOR_ACCOUNTANT) return '/accountant';
  return '/login';
};

// --- App Router ---
const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Landing page
  if (location.pathname === '/' && !user) {
    return <LandingView />;
  }

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={user ? <RedirectHandler to={getHomeRoute(user)} /> : <LoginView />} />

      {/* Staff Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminView /></ProtectedRoute>} />
      <Route path="/reception" element={<ProtectedRoute allowedRoles={[UserRole.SECRETARY]}><ReceptionView /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={[UserRole.DOCTOR]}><DoctorView /></ProtectedRoute>} />
      <Route path="/technician" element={<ProtectedRoute allowedRoles={[UserRole.TECHNICIAN]}><TechnicianView /></ProtectedRoute>} />
      <Route path="/accountant" element={<ProtectedRoute allowedRoles={[UserRole.ACCOUNTANT, UserRole.SENIOR_ACCOUNTANT]}><AccountantView /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><PatientsRegistryView /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><PatientProfileView /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR]}><AppointmentsView /></ProtectedRoute>} />
          <Route path="/clinic-history" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DOCTOR]}><ClinicHistoryView /></ProtectedRoute>} />
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
  );
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
