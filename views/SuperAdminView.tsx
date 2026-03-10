import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, SuperAdmin } from '../types';
import { pgClientsService, pgSuperAdmin } from '../services/apiServices';
import { fmtDate } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

const SuperAdminView: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [admin, setAdmin] = useState<SuperAdmin | null>(() => {
    const saved = localStorage.getItem('superAdmin');
    if (saved) { try { return JSON.parse(saved); } catch { return null; } }
    return null;
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientStats, setClientStats] = useState<Record<number, any>>({});
  const [newClient, setNewClient] = useState({
    name: '', slug: '', phone: '', email: '', address: '',
    ownerName: '', ownerEmail: '', ownerPassword: '', trialDays: 30
  });
  const [addingClient, setAddingClient] = useState(false);
  const [extendDays, setExtendDays] = useState<Record<number, number>>({});

  const fetchClients = async () => {
    setLoading(true);
    try {
      const all = await pgClientsService.getAll();
      setClients(all);
      // Load stats for all clients in parallel (much faster than sequential)
      const statsEntries = await Promise.all(
        all.map(async (c) => {
          try {
            const stats = await pgClientsService.getStats(c.id);
            return [c.id, stats] as const;
          } catch {
            return [c.id, { patientsCount: 0, usersCount: 0, appointmentsCount: 0 }] as const;
          }
        })
      );
      const statsMap: Record<number, any> = {};
      for (const [id, stats] of statsEntries) {
        statsMap[id] = stats;
      }
      setClientStats(statsMap);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchClients();
    else setLoading(false);
  }, [admin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await pgSuperAdmin.login(loginForm.username, loginForm.password);
      if (result) {
        setAdmin(result);
        localStorage.setItem('superAdmin', JSON.stringify(result));
      } else {
        setLoginError(t('sa_invalid_credentials'));
      }
    } catch (err: any) {
      setLoginError(err.message || t('sa_login_error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdmin');
    setAdmin(null);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.slug || !newClient.ownerName || !newClient.ownerEmail || !newClient.ownerPassword) {
      alert(t('sa_fill_required'));
      return;
    }
    setAddingClient(true);
    try {
      // 1. Create client
      const clientId = await pgClientsService.create({
        name: newClient.name,
        slug: newClient.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address,
        trialDays: newClient.trialDays || 30
      });
      // 2. Create owner (admin user)
      await pgClientsService.createOwner(clientId, {
        name: newClient.ownerName,
        email: newClient.ownerEmail,
        password: newClient.ownerPassword
      });
      
      alert(`${t('sa_center_created')}\n\n${t('sa_center_link')}: ${window.location.origin}/${newClient.slug}/login\n${t('sa_username_label')}: ${newClient.ownerEmail}`);
      setNewClient({ name: '', slug: '', phone: '', email: '', address: '', ownerName: '', ownerEmail: '', ownerPassword: '', trialDays: 30 });
      setShowAddClient(false);
      await fetchClients();
    } catch (err: any) {
      alert(t('sa_create_error') + ': ' + (err.message || t('sa_creation_failed')));
    } finally {
      setAddingClient(false);
    }
  };

  const handleExtendTrial = async (clientId: number) => {
    const days = extendDays[clientId] || 30;
    try {
      await pgClientsService.extendTrial(clientId, days);
      alert(t('sa_trial_extended').replace('{days}', String(days)));
      await fetchClients();
    } catch (err: any) {
      alert(t('sa_error') + ': ' + err.message);
    }
  };

  const handleActivateSubscription = async (clientId: number) => {
    const days = extendDays[clientId] || 30;
    if (!confirm(t('sa_activate_confirm').replace('{days}', String(days)))) return;
    try {
      await pgClientsService.extendSubscription(clientId, days);
      alert(t('sa_subscription_activated').replace('{days}', String(days)));
      await fetchClients();
    } catch (err: any) {
      alert(t('sa_error') + ': ' + err.message);
    }
  };

  const handleDelete = async (clientId: number, clientName: string) => {
    if (!confirm(t('sa_delete_confirm').replace('{name}', clientName))) return;
    if (!confirm(t('sa_delete_final_confirm'))) return;
    try {
      await pgClientsService.delete(clientId);
      alert(t('sa_deleted_success'));
      await fetchClients();
    } catch (err: any) {
      alert(t('sa_delete_error') + ': ' + err.message);
    }
  };

  const handleSuspend = async (clientId: number) => {
    if (!confirm(t('sa_suspend_confirm'))) return;
    try {
      await pgClientsService.suspend(clientId);
      await fetchClients();
    } catch (err: any) { alert(t('sa_error') + ': ' + err.message); }
  };

  const handleActivate = async (clientId: number) => {
    try {
      await pgClientsService.activate(clientId);
      await fetchClients();
    } catch (err: any) { alert(t('sa_error') + ': ' + err.message); }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      suspended: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    };
    const labels: Record<string, string> = {
      trial: t('sa_status_trial'), active: t('sa_status_active'), expired: t('sa_status_expired_label'), suspended: t('sa_status_suspended')
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || colors.trial}`}>{labels[status] || status}</span>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return fmtDate(d);
  };

  const getRemainingDays = (dateStr: string | null) => {
    if (!dateStr) return null;
    const end = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ==================== LOGIN SCREEN ====================
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto text-3xl shadow-lg">
              <i className="fa-solid fa-crown"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Super Admin</h1>
            <p className="text-slate-400 text-sm">{t('sa_platform_control')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text" placeholder={t('sa_username')}
              value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:border-amber-500"
              required
            />
            <input
              type="password" placeholder={t('sa_password')}
              value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:border-amber-500"
              required
            />
            {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
              {t('sa_login_btn')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-crown text-2xl"></i>
          <div>
            <h1 className="text-xl font-bold">{t('sa_dashboard_title')}</h1>
            <p className="text-amber-100 text-sm">{t('sa_welcome').replace('{name}', admin.name)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddClient(true)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <i className="fa-solid fa-plus"></i> {t('sa_new_client')}
          </button>
          <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 text-xs mb-1">{t('sa_total_clients')}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{clients.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 text-xs mb-1">{t('sa_active_clients')}</p>
          <p className="text-2xl font-bold text-green-600">{clients.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 text-xs mb-1">{t('sa_trial_clients')}</p>
          <p className="text-2xl font-bold text-amber-600">{clients.filter(c => c.status === 'trial').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 text-xs mb-1">{t('sa_expired_clients')}</p>
          <p className="text-2xl font-bold text-red-600">{clients.filter(c => c.status === 'expired' || c.status === 'suspended').length}</p>
        </div>
      </div>

      {/* Clients List */}
      <div className="px-6 pb-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('sa_clients_centers')}</h2>
        
        {loading ? (
          <div className="text-center py-12 text-slate-400"><i className="fa-solid fa-circle-notch fa-spin text-3xl"></i></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <i className="fa-solid fa-building text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500">{t('sa_no_clients')}</p>
            <button onClick={() => setShowAddClient(true)} className="mt-3 bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition">
              {t('sa_add_first_client')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map(client => {
              const stats = clientStats[client.id] || {};
              return (
                <div key={client.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{client.name}</h3>
                        {getStatusBadge(client.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span><i className="fa-solid fa-link ml-1"></i> /{client.slug}</span>
                        {client.phone && <span><i className="fa-solid fa-phone ml-1"></i> {client.phone}</span>}
                        {client.email && <span><i className="fa-solid fa-envelope ml-1"></i> {client.email}</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                        <span>{t('sa_patients_stat')}: <b className="text-slate-600 dark:text-slate-300">{stats.patientsCount || 0}</b></span>
                        <span>{t('sa_staff_stat')}: <b className="text-slate-600 dark:text-slate-300">{stats.usersCount || 0}</b></span>
                        <span>{t('sa_appointments_stat')}: <b className="text-slate-600 dark:text-slate-300">{stats.appointmentsCount || 0}</b></span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-400">
                        {client.status === 'trial' && (() => {
                          const remaining = getRemainingDays(client.trialEndsAt);
                          return <span>{t('sa_trial_ends')}: <b className="text-amber-600">{formatDate(client.trialEndsAt)}</b>
                            {remaining !== null && (
                              <b className={`mr-1 ${remaining <= 5 ? 'text-red-500' : remaining <= 14 ? 'text-amber-500' : 'text-amber-500'}`}>
                                ({remaining > 0 ? t('sa_days_remaining').replace('{days}', String(remaining)) : t('sa_status_expired')})
                              </b>
                            )}
                          </span>;
                        })()}
                        {client.subscriptionEndsAt && (() => {
                          const remaining = getRemainingDays(client.subscriptionEndsAt);
                          return <span>{t('sa_subscription_ends')}: <b className="text-green-600">{formatDate(client.subscriptionEndsAt)}</b>
                            {remaining !== null && (
                              <b className={`mr-1 ${remaining <= 5 ? 'text-red-500' : remaining <= 14 ? 'text-amber-500' : 'text-green-500'}`}>
                                ({remaining > 0 ? t('sa_days_remaining').replace('{days}', String(remaining)) : t('sa_status_expired')})
                              </b>
                            )}
                          </span>;
                        })()}
                        <span>{t('sa_registration_date')}: {formatDate(client.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="1" value={extendDays[client.id] || 30}
                          onChange={e => setExtendDays({...extendDays, [client.id]: parseInt(e.target.value) || 30})}
                          className="w-16 px-2 py-1 border rounded-lg text-center text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          placeholder={t('sa_days_placeholder')}
                        />
                        {client.status === 'trial' ? (
                          <button onClick={() => handleExtendTrial(client.id)} className="flex-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-600 transition">
                            <i className="fa-solid fa-clock-rotate-left ml-1"></i> {t('sa_extend_trial')}
                          </button>
                        ) : (
                          <button onClick={() => handleActivateSubscription(client.id)} className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600 transition">
                            <i className="fa-solid fa-calendar-plus ml-1"></i> {t('sa_extend_subscription')}
                          </button>
                        )}
                      </div>
                      {client.status === 'trial' && (
                        <button onClick={() => handleActivateSubscription(client.id)} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition">
                          <i className="fa-solid fa-arrow-up-right-from-square ml-1"></i> {t('sa_convert_paid')}
                        </button>
                      )}
                      {client.status !== 'suspended' ? (
                        <button onClick={() => handleSuspend(client.id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200 transition">
                          <i className="fa-solid fa-ban ml-1"></i> {t('sa_suspend')}
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(client.id)} className="bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-200 transition">
                          <i className="fa-solid fa-check ml-1"></i> {t('sa_activate')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/${client.slug}/login`;
                          navigator.clipboard.writeText(url);
                          alert(`${t('sa_link_copied')}:\n${url}`);
                        }}
                        className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                      >
                        <i className="fa-solid fa-copy ml-1"></i> {t('sa_copy_link')}
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                      >
                        <i className="fa-solid fa-trash ml-1"></i> {t('sa_delete')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                <i className="fa-solid fa-plus-circle text-amber-500 ml-2"></i>
                {t('sa_add_client_title')}
              </h2>
              <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600 text-xl">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-amber-700 dark:text-amber-300 text-sm font-bold mb-1"><i className="fa-solid fa-building ml-1"></i> {t('sa_center_info')}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_center_name')}</label>
                <input value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder={t('sa_center_name_placeholder')} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_slug_label')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">/</span>
                  <input value={newClient.slug} 
                    onChange={e => setNewClient({...newClient, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="flex-1 px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="alshifa" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_phone_label')}</label>
                  <input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="07XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_email_label')}</label>
                  <input value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="info@clinic.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_address_label')}</label>
                <input value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder={t('sa_address_placeholder')} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_trial_days_label')}</label>
                <input type="number" min="1" max="365" value={newClient.trialDays}
                  onChange={e => setNewClient({...newClient, trialDays: parseInt(e.target.value) || 30})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800 mt-4">
                <p className="text-amber-700 dark:text-amber-300 text-sm font-bold mb-1"><i className="fa-solid fa-user-shield ml-1"></i> {t('sa_owner_info')}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_owner_name')}</label>
                <input value={newClient.ownerName} onChange={e => setNewClient({...newClient, ownerName: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder={t('sa_owner_name_placeholder')} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_owner_email')}</label>
                <input value={newClient.ownerEmail} onChange={e => setNewClient({...newClient, ownerEmail: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="admin@clinic.com" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t('sa_owner_password')}</label>
                <input type="password" value={newClient.ownerPassword} onChange={e => setNewClient({...newClient, ownerPassword: e.target.value})}
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder={t('sa_password_placeholder')} required />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addingClient}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50">
                  {addingClient ? <><i className="fa-solid fa-circle-notch fa-spin ml-2"></i> {t('sa_creating')}</> : <><i className="fa-solid fa-check ml-2"></i> {t('sa_create_center')}</>}
                </button>
                <button type="button" onClick={() => setShowAddClient(false)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 transition">
                  {t('sa_cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminView;
