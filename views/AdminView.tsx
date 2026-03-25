
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ClinicService, AuthService, BillingService, SettingsService } from '../services/services';
import { pgUsers, pgClientsService } from '../services/apiServices';
import { api } from '../src/api';
import { Clinic, User, UserRole, Invoice, SystemSettings, ClinicCategory, ClientFeatures } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useClientSafe } from '../context/ClientContext';

interface AdminViewProps {
    user?: User;
}

const AdminView: React.FC<AdminViewProps> = ({ user: propUser }) => {
    const { t, language } = useLanguage();
    const { user: authUser, simulateLogin } = useAuth();
    const clientCtx = useClientSafe();
    const client = clientCtx?.client || null;
    const refreshClient = clientCtx?.refreshClient || (async () => {});
    const navigate = useNavigate();
    // Prefer propUser if provided, otherwise fallback to context
    const currentUser = propUser || authUser;
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
    // Remove unused setCurrentUser, use currentUser directly

  // Clinic/Dept Form State
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [targetCategory, setTargetCategory] = useState<ClinicCategory>('clinic');
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState('');

  // Staff Form State (Handles both Add and Edit)
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: UserRole.DOCTOR,
      clinicIds: [] as string[]
  });

  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({ clinicName: '', address: '', phone: '', logoUrl: '' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  // UI State for Switching
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);
  const [showUserSwitcherModal, setShowUserSwitcherModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [c, allUsers, allInvoices] = await Promise.all([
                ClinicService.getActive(),
                pgUsers.getAll(),
                BillingService.getAll(currentUser!)
            ]);
            setClinics(c);
            setUsers(allUsers);
            setInvoices(allInvoices);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // ... [Clinic/Staff Handlers] ...
  const openAddEntityModal = (category: ClinicCategory) => {
      setTargetCategory(category);
      setNewEntityName('');
      setNewEntityType('');
      setIsAddingEntity(true);
  };

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEntityName) return;
    try {
      // Use targetCategory set by the specific button
      await ClinicService.add(currentUser, newEntityName, newEntityType || 'General', targetCategory);
      setNewEntityName('');
      setNewEntityType('');
      setIsAddingEntity(false);
      await fetchData();
      alert(t('added_success'));
    } catch (e: any) {
      alert(t('error_prefix') + (e.message || t('add_failed')));
    }
  };

  const toggleClinic = async (id: string, currentStatus: boolean) => {
    if (!currentUser) return;
    await ClinicService.toggleStatus(currentUser, id, !currentStatus);
    fetchData();
  };
  
  const deleteClinic = async (id: string) => {
      if(!currentUser || !window.confirm(t('confirm_delete'))) return;
      try {
        await ClinicService.delete(currentUser, id);
        fetchData();
      } catch (err: any) {
          alert(err.message);
      }
  };

  const openStaffForm = (user?: User) => {
      if (user) {
          setEditingUserId(user.uid);
          setUserFormData({
              name: user.name,
              email: user.email,
              password: '',
              role: user.role,
              clinicIds: [...user.clinicIds]
          });
      } else {
          setEditingUserId(null);
          setUserFormData({ name: '', email: '', password: '', role: UserRole.DOCTOR, clinicIds: [] });
      }
      setIsStaffFormOpen(true);
  };

  const closeStaffForm = () => {
      setIsStaffFormOpen(false);
      setEditingUserId(null);
      setUserFormData({ name: '', email: '', password: '', role: UserRole.DOCTOR, clinicIds: [] });
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      try {
          if (editingUserId) {
              await AuthService.updateUser(currentUser, editingUserId, userFormData);
          } else {
              await AuthService.createUser(currentUser, userFormData);
          }
          closeStaffForm();
          fetchData();
      } catch (err: any) {
          alert(err.message);
      }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || !window.confirm(t('confirm_delete_user'))) return;
    try {
        await AuthService.deleteUser(currentUser, userId);
        fetchData();
    } catch (err: any) {
        alert(err.message);
    }
  };

  const toggleUserClinic = (clinicId: string) => {
      setUserFormData(prev => ({
          ...prev,
          clinicIds: prev.clinicIds.includes(clinicId)
            ? prev.clinicIds.filter(id => id !== clinicId)
            : [...prev.clinicIds, clinicId]
      }));
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
      if (!currentUser) return;
      await AuthService.updateUser(currentUser, userId, { isActive: !currentStatus });
      fetchData();
  };

  const handleSwitchUser = async (targetUser: User) => {
    setSwitchingUser(targetUser.uid);
    
    // 1. Determine destination based on role
    let path = '/';
    switch (targetUser.role) {
        case UserRole.ADMIN: path = '/admin'; break;
        case UserRole.SECRETARY: path = '/reception'; break;
        case UserRole.DOCTOR: path = '/doctor'; break;
        case UserRole.TECHNICIAN: path = '/technician'; break;
        default: path = '/login';
    }

    // 2. Wait a moment for visual feedback
    await new Promise(r => setTimeout(r, 600));

    // 3. Switch User Context
    simulateLogin(targetUser);

    // 4. Force Navigation
    navigate(path);
  };

  // --- Real Chart Data Logic ---
  const calculateChartData = () => {
      // Last 7 days
      const days: string[] = [];
      const values: number[] = [];
      const dates: Date[] = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          d.setHours(0,0,0,0);
          
          const nextD = new Date(d);
          nextD.setDate(d.getDate() + 1);
          
          // Sum paid invoices for this day
          const sum = invoices
            .filter(inv => inv.status === 'paid' && inv.createdAt >= d.getTime() && inv.createdAt < nextD.getTime())
            .reduce((acc, curr) => acc + curr.totalAmount, 0);
            
          days.push(d.toLocaleDateString('en-GB', { weekday: 'short' }));
          values.push(sum);
          dates.push(d);
      }
      
      // Normalize values for CSS height % (max value = 100%)
      const maxVal = Math.max(...values, 100); // Avoid div by zero, min scale 100
      const heights = values.map(v => Math.round((v / maxVal) * 100));
      
      return { days, values, heights, dates };
  };

  const chartData = calculateChartData();

  // --- Settings Handler ---
  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentUser) return;
      try {
          await SettingsService.updateSettings(currentUser, settings);
          alert(t('settings_saved'));
      } catch (e: any) {
          alert(t('error_prefix') + e.message);
      }
  };

  // Convert uploaded image to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setSettings(prev => ({ ...prev, logoUrl: ev.target!.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Financial Calcs ---
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'unpaid').reduce((acc, curr) => acc + curr.totalAmount, 0);

  // --- Segregate Clinics vs Departments ---
  const patientClinics = clinics.filter(c => c.category === 'clinic');
  const departments = clinics.filter(c => c.category === 'department');

  // Reusable Table Component for Clinics/Dept
  const EntityTable = ({ title, data, category, icon, colorClass }: { title: string, data: Clinic[], category: ClinicCategory, icon: string, colorClass: string }) => (
      <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden flex flex-col mb-8">
          <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${colorClass}`}>
              <div className="flex items-center gap-3">
                  <i className={`fa-solid ${icon}`}></i>
                  <h2 className="font-extrabold text-slate-800 tracking-tight">{title}</h2>
              </div>
              <button 
                  onClick={() => openAddEntityModal(category)}
                  className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 hover:bg-primary shadow-lg shadow-slate-900/10"
              >
                  <i className="fa-solid fa-plus"></i> Add {category === 'clinic' ? 'Clinic' : 'Department'}
              </button>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px]">
              {data.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">{t('no_items')}</div> : (
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-4 border-b border-slate-100">{t('name_col')}</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-center">{t('status_col')}</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-end">{t('actions_col')}</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                  {data.map(clinic => (
                      <tr key={clinic.id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{clinic.name}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-tighter">{clinic.type}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-tighter shadow-sm border ${
                              clinic.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                          {clinic.active ? t('active') : t('disabled')}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-end space-x-4 rtl:space-x-reverse opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleClinic(clinic.id, clinic.active)} className="text-slate-400 hover:text-primary transform transition hover:scale-125" title="Toggle Status">
                              <i className={`fa-solid ${clinic.active ? 'fa-toggle-on text-primary' : 'fa-toggle-off'}`}></i>
                          </button>
                          <button onClick={() => deleteClinic(clinic.id)} className="text-slate-300 hover:text-rose-500 transform transition hover:scale-125" title="Delete">
                              <i className="fa-solid fa-trash-can"></i>
                          </button>
                      </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
              )}
          </div>
      </div>
  );

  return (
    <Layout title={t('admin_dashboard')}>
      {/* Top Tabs & Switcher */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
            <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                <i className="fa-solid fa-chart-line mr-2"></i> {t('dashboard')}
            </button>
            <button 
                onClick={() => setActiveTab('settings')} 
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
                <i className="fa-solid fa-gear mr-2"></i> {t('system_settings')}
            </button>
            <button 
                onClick={() => { window.location.href = '/catalog'; }} 
                className="px-6 py-2 rounded-xl font-bold transition-all bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            >
                <i className="fa-solid fa-book-medical mr-2"></i> {t('catalog')}
            </button>
            <button 
                onClick={() => { window.location.href = '/accounting'; }} 
                className="px-6 py-2 rounded-xl font-bold transition-all bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            >
                <i className="fa-solid fa-calculator mr-2"></i> {t('accounting')}
            </button>
        </div>

        {/* --- USER SWITCHER PORTAL BUTTON --- */}
        <button 
            onClick={() => setShowUserSwitcherModal(true)}
            className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-xl font-extrabold shadow-lg hover:bg-yellow-300 transition-all flex items-center gap-2 animate-pulse"
        >
            <i className="fa-solid fa-bolt"></i> 
            {t('quick_login_portal')}
        </button>
      </div>

      {/* --- SWITCHER MODAL --- */}
      {showUserSwitcherModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                      <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                              <i className="fa-solid fa-bolt text-yellow-400"></i> {t('user_switcher_portal')}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">{t('select_user_hint')}</p>
                      </div>
                      <button onClick={() => setShowUserSwitcherModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                          <i className="fa-solid fa-xmark"></i>
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.map(u => (
                          <button
                              key={u.uid}
                              onClick={() => handleSwitchUser(u)}
                              disabled={switchingUser === u.uid}
                              className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group hover:shadow-lg ${
                                  switchingUser === u.uid 
                                  ? 'border-primary bg-primary/5 cursor-wait' 
                                  : 'border-slate-100 hover:border-slate-300 bg-white'
                              }`}
                          >
                              {switchingUser === u.uid && (
                                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                      <i className="fa-solid fa-circle-notch fa-spin text-primary text-2xl"></i>
                                  </div>
                              )}
                              <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${
                                      u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                      u.role === 'doctor' ? 'bg-amber-100 text-amber-600' :
                                      'bg-green-100 text-green-600'
                                  }`}>
                                      <i className={`fa-solid ${
                                          u.role === 'admin' ? 'fa-shield-halved' :
                                          u.role === 'doctor' ? 'fa-user-doctor' :
                                          'fa-user'
                                      }`}></i>
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800 leading-tight">{u.name}</div>
                                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{u.role}</div>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
                                  <span className="truncate max-w-[150px]">{u.email}</span>
                                  <span className="font-bold text-slate-300 group-hover:text-primary transition-colors">{t('login_label')} <i className="fa-solid fa-arrow-right ml-1"></i></span>
                              </div>
                          </button>
                      ))}
                  </div>
                  <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100 shrink-0">
                      {t('access_level_admin')}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'settings' ? (
          <>
          <div className="bg-white rounded-[2rem] shadow-soft p-8 max-w-2xl animate-fade-in-down">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-sliders text-primary"></i> {t('clinic_config')}
              </h2>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('clinic_group_name')}</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none" value={settings.clinicName} onChange={e => setSettings({...settings, clinicName: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('address_invoices')}</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('contact_phone')}</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('logo')}</label>
                      <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                              {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" alt="logo" /> : <i className="fa-solid fa-image text-gray-300"></i>}
                          </div>
                          <div>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                              <p className="text-[10px] text-slate-400 mt-1">{t('logo_hint')}</p>
                          </div>
                      </div>
                  </div>
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 shadow-lg">{t('save_settings')}</button>
              </form>
          </div>

          {/* Feature Toggles Section */}
          <div className="bg-white rounded-[2rem] shadow-soft p-8 max-w-2xl mt-6 animate-fade-in-down">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <i className="fa-solid fa-toggle-on text-primary"></i> {t('sections_features')}
              </h2>
              <p className="text-slate-400 text-sm mb-6">{t('sections_features_desc')}</p>
              {[
                { key: 'device_results' as keyof ClientFeatures, label: t('device_results_label'), icon: 'fa-solid fa-microscope', desc: t('device_results_desc') }
              ].map(feature => {
                const features = client?.enabledFeatures || { device_results: false };
                const isOn = features[feature.key];
                return (
                  <div key={feature.key} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOn ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                        <i className={feature.icon}></i>
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isOn ? 'text-slate-800' : 'text-slate-400'}`}>{feature.label}</p>
                        <p className="text-xs text-slate-400">{feature.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!client) return;
                        const updated = { ...features, [feature.key]: !isOn };
                        try {
                          await pgClientsService.updateFeatures(client.id, updated);
                          await refreshClient();
                        } catch (err: any) {
                          alert(t('error_prefix') + err.message);
                        }
                      }}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isOn ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isOn ? 'right-0.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                );
              })}
          </div>
          </>
      ) : (
        <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl shadow-inner">
                    <i className="fa-solid fa-hospital"></i>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{patientClinics.filter(c => c.active).length}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('active_clinics')}</div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl shadow-inner">
                    <i className="fa-solid fa-user-doctor"></i>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{users.length}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('total_staff')}</div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-inner">
                    <i className="fa-solid fa-wallet"></i>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">${totalRevenue.toLocaleString()}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('collected_revenue')}</div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-inner">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                    <div className="text-3xl font-extrabold text-slate-800 tracking-tight">${pendingRevenue.toLocaleString()}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('pending_payments')}</div>
                </div>
                </div>
            </div>
            
            {/* Real Financial Chart */}
            <div className="bg-slate-900 rounded-[2rem] p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8 items-end h-64">
                    {chartData.heights.map((h, i) => (
                        <div key={i} onClick={() => {
                            const d = chartData.dates[i];
                            const dateStr = d.toISOString().split('T')[0];
                            navigate(`/accounting?from=${dateStr}&to=${dateStr}`);
                        }} className="flex-1 flex flex-col justify-end items-center gap-2 group h-full cursor-pointer">
                            <div className="text-xs font-bold text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">${chartData.values[i]}</div>
                            <div className="w-full bg-slate-800 rounded-xl relative overflow-hidden h-full flex items-end group-hover:ring-2 group-hover:ring-sky-400 transition-all">
                                <div className="w-full bg-gradient-to-t from-primary to-sky-400 rounded-t-xl transition-all duration-1000" style={{height: `${h}%`, minHeight: '4px'}}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-sky-400 transition-colors">{chartData.days[i]}</span>
                        </div>
                    ))}
                </div>
                <h3 className="text-lg font-bold mt-6 flex items-center gap-2">
                    <i className="fa-solid fa-chart-line text-primary"></i> {t('revenue_analytics')}
                </h3>
            </div>



            {/* --- ENTITY MANAGEMENT MODAL --- */}
            {isAddingEntity && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">{t('add_new_entity')} {targetCategory === 'clinic' ? t('add_clinic_label').replace(t('add_new_entity') + ' ', '') : t('add_department_label').replace(t('add_new_entity') + ' ', '')}</h3>
                        <form onSubmit={handleAddEntity} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('name_label')}</label>
                                <input 
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                                    placeholder={targetCategory === 'clinic' ? 'e.g. Dental Clinic' : 'e.g. Dental Lab'}
                                    value={newEntityName}
                                    onChange={e => setNewEntityName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('specialty_type')}</label>
                                <input 
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                                    placeholder={targetCategory === 'clinic' ? 'e.g. Dental' : 'e.g. Laboratory'}
                                    value={newEntityType}
                                    onChange={e => setNewEntityType(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddingEntity(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors">{t('create')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* --- LEFT COLUMN: ENTITIES --- */}
                <div>
                    <EntityTable 
                        title={t('patient_clinics')} 
                        data={patientClinics} 
                        category="clinic" 
                        icon="fa-hospital-user" 
                        colorClass="bg-amber-50/20 text-amber-600" 
                    />
                    
                    <EntityTable 
                        title={t('operational_depts')} 
                        data={departments} 
                        category="department" 
                        icon="fa-building-shield" 
                        colorClass="bg-amber-50/20 text-amber-600" 
                    />
                </div>

                {/* --- RIGHT COLUMN: STAFF MANAGEMENT --- */}
                <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden flex flex-col h-fit">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-user-gear text-purple-600"></i>
                        <h2 className="font-extrabold text-slate-800 tracking-tight">{t('staff_roles')}</h2>
                    </div>
                    <button 
                        onClick={() => isStaffFormOpen ? closeStaffForm() : openStaffForm()}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                            isStaffFormOpen ? 'bg-red-50 text-red-600' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/10'
                        }`}
                    >
                    <i className={`fa-solid ${isStaffFormOpen ? 'fa-xmark' : 'fa-plus'}`}></i> 
                    {isStaffFormOpen ? t('cancel') : t('add_staff')}
                    </button>
                </div>

                {isStaffFormOpen && (
                    <div className="p-6 bg-purple-50/50 border-b border-purple-100 animate-fade-in-down">
                        <form onSubmit={handleStaffSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('full_name_label')}</label>
                                    <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-purple-100 outline-none focus:ring-4 focus:ring-purple-100" placeholder="e.g. Dr. John Doe" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('email_username')}</label>
                                    <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-purple-100 outline-none focus:ring-4 focus:ring-purple-100" placeholder="staff@clinic.com" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                                <input type="password" className="w-full px-4 py-2.5 rounded-xl border border-purple-100 outline-none focus:ring-4 focus:ring-purple-100" placeholder="Enter password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} required={!editingUserId} />
                                {editingUserId && <p className="text-xs text-slate-400 mt-1 ml-1">{t('keep_password_hint')}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('system_role')}</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl border border-purple-100 bg-white outline-none" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}>
                                        <option value={UserRole.DOCTOR}>{t('doctor_medical')}</option>
                                        <option value={UserRole.TECHNICIAN}>{t('technician_role')}</option>
                                        <option value={UserRole.SECRETARY}>{t('secretary_frontdesk')}</option>
                                        <option value={UserRole.ADMIN}>{t('admin_system')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('assigned_access')}</label>
                                    <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
                                        {/* Show all (Clinics + Departments) so staff can be assigned to labs etc */}
                                        {clinics.map(c => (
                                            <button 
                                                key={c.id}
                                                type="button"
                                                onClick={() => toggleUserClinic(c.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                    userFormData.clinicIds.includes(c.id) 
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-purple-300'
                                                }`}
                                            >
                                                {c.name} {c.category === 'department' && '(Dept)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-3">
                                <i className={`fa-solid ${editingUserId ? 'fa-save' : 'fa-user-plus'}`}></i> {editingUserId ? t('save_changes_btn') : t('create_account')}
                            </button>
                        </form>
                    </div>
                )}

                <div className="flex-1 overflow-auto max-h-[500px]">
                    <table className="w-full text-left text-sm text-slate-600 border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-100">{t('user_details')}</th>
                            <th className="px-6 py-4 border-b border-slate-100">{t('permissions')}</th>
                            <th className="px-6 py-4 border-b border-slate-100 text-end">{t('manage')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {users.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-50 transition group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-transform ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                                        user.role === 'doctor' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                        'bg-emerald-100 text-emerald-600 border-emerald-200'
                                    }`}>
                                        {(user?.name || user?.email || "U").charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {user.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className={`w-fit px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-tighter shadow-sm border ${
                                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        user.role === 'doctor' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                        {user.role}
                                    </span>
                                    <div className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">
                                        {user.role === 'admin' ? t('all_access') : user.clinicIds.map(id => clinics.find(c => c.id === id)?.name).join(', ') || t('no_clinics_assigned')}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-end flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => openStaffForm(user)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                                    title="Edit User"
                                >
                                    <i className="fa-solid fa-user-pen"></i>
                                </button>
                                <button 
                                    disabled={user.uid === currentUser?.uid}
                                    onClick={() => toggleUserStatus(user.uid, user.isActive)}
                                    className={`p-1.5 transition-all disabled:opacity-20 ${
                                        user.isActive ? 'text-primary' : 'text-slate-300'
                                    }`}
                                    title="Toggle Status"
                                >
                                    <i className={`fa-solid ${user.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                </button>
                                <button 
                                    disabled={user.uid === currentUser?.uid}
                                    onClick={() => handleDeleteUser(user.uid)}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors disabled:opacity-0"
                                    title="Delete User"
                                >
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
        </>
      )}

      <style>{`
        .animate-fade-in-down { animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Layout>
  );
};

export default AdminView;
