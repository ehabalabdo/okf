import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { HrEmployee, HrDeduction, HrWarning, HrNotification } from '../types';
import { hrEmployeesService, hrDeductionsService, hrWarningsService, hrNotificationsService } from '../services/hrApiServices';
import { useLanguage } from '../context/LanguageContext';
import { fmtDate, fmtDateTime } from '../utils/formatters';

type Tab = 'deductions' | 'warnings' | 'notifications';

const WARNING_COLORS: Record<string, string> = {
  verbal: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  written: 'bg-orange-100 text-orange-700 border-orange-300',
  final: 'bg-red-100 text-red-700 border-red-300',
};
const WARNING_AR: Record<string, string> = {
  verbal: 'شفهي',
  written: 'خطي',
  final: 'نهائي',
};

const HrManagerActionsView: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [tab, setTab] = useState<Tab>('deductions');
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  // Deductions state
  const [deductions, setDeductions] = useState<HrDeduction[]>([]);
  const [dedMonth, setDedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dedEmpFilter, setDedEmpFilter] = useState('');
  const [showDedForm, setShowDedForm] = useState(false);
  const [dedForm, setDedForm] = useState({ employee_id: '', amount: '', reason: '' });

  // Warnings state
  const [warnings, setWarnings] = useState<HrWarning[]>([]);
  const [warnEmpFilter, setWarnEmpFilter] = useState('');
  const [showWarnForm, setShowWarnForm] = useState(false);
  const [warnForm, setWarnForm] = useState({ employee_id: '', level: 'verbal', reason: '' });

  // Notifications state
  const [notifications, setNotifications] = useState<HrNotification[]>([]);
  const [notifEmpFilter, setNotifEmpFilter] = useState('');
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifForm, setNotifForm] = useState({ employee_id: '', message: '' });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hrEmployeesService.getAll().then(e => {
      setEmployees(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Fetch deductions
  const fetchDeductions = useCallback(async () => {
    try {
      const data = await hrDeductionsService.getAll({
        month: `${dedMonth}-01`,
        employee_id: dedEmpFilter ? parseInt(dedEmpFilter) : undefined,
      });
      setDeductions(data);
    } catch { setDeductions([]); }
  }, [dedMonth, dedEmpFilter]);

  // Fetch warnings
  const fetchWarnings = useCallback(async () => {
    try {
      const data = await hrWarningsService.getAll({
        employee_id: warnEmpFilter ? parseInt(warnEmpFilter) : undefined,
      });
      setWarnings(data);
    } catch { setWarnings([]); }
  }, [warnEmpFilter]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await hrNotificationsService.getAll({
        employee_id: notifEmpFilter ? parseInt(notifEmpFilter) : undefined,
      });
      setNotifications(data);
    } catch { setNotifications([]); }
  }, [notifEmpFilter]);

  useEffect(() => {
    if (tab === 'deductions') fetchDeductions();
    if (tab === 'warnings') fetchWarnings();
    if (tab === 'notifications') fetchNotifications();
  }, [tab, fetchDeductions, fetchWarnings, fetchNotifications]);

  const handleAddDeduction = async () => {
    if (!dedForm.employee_id || !dedForm.amount) return;
    setSaving(true);
    try {
      await hrDeductionsService.create({
        employee_id: parseInt(dedForm.employee_id),
        month: `${dedMonth}-01`,
        amount: parseFloat(dedForm.amount),
        reason: dedForm.reason || undefined,
      });
      setMsg({ text: isAr ? 'تمت إضافة الخصم' : 'Deduction added', type: 'ok' });
      setShowDedForm(false);
      setDedForm({ employee_id: '', amount: '', reason: '' });
      fetchDeductions();
    } catch (e: any) {
      setMsg({ text: e?.message || 'Error', type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeduction = async (id: number) => {
    if (!confirm(isAr ? 'حذف هذا الخصم؟' : 'Delete this deduction?')) return;
    try {
      await hrDeductionsService.remove(id);
      fetchDeductions();
    } catch (e: any) {
      setMsg({ text: e?.message || 'Error', type: 'err' });
    }
  };

  const handleAddWarning = async () => {
    if (!warnForm.employee_id) return;
    setSaving(true);
    try {
      await hrWarningsService.create({
        employee_id: parseInt(warnForm.employee_id),
        level: warnForm.level,
        reason: warnForm.reason || undefined,
      });
      setMsg({ text: isAr ? 'تم إضافة الإنذار' : 'Warning added', type: 'ok' });
      setShowWarnForm(false);
      setWarnForm({ employee_id: '', level: 'verbal', reason: '' });
      fetchWarnings();
    } catch (e: any) {
      setMsg({ text: e?.message || 'Error', type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotification = async () => {
    if (!notifForm.employee_id || !notifForm.message) return;
    setSaving(true);
    try {
      await hrNotificationsService.create({
        employee_id: parseInt(notifForm.employee_id),
        message: notifForm.message,
      });
      setMsg({ text: isAr ? 'تم إرسال الإشعار' : 'Notification sent', type: 'ok' });
      setShowNotifForm(false);
      setNotifForm({ employee_id: '', message: '' });
      fetchNotifications();
    } catch (e: any) {
      setMsg({ text: e?.message || 'Error', type: 'err' });
    } finally {
      setSaving(false);
    }
  };

  const empName = (id: number) => employees.find(e => e.id === id)?.fullName || `#${id}`;

  const tabs: { key: Tab; icon: string; label: string; labelAr: string }[] = [
    { key: 'deductions', icon: 'fa-money-bill-transfer', label: 'Deductions', labelAr: 'الخصومات' },
    { key: 'warnings', icon: 'fa-triangle-exclamation', label: 'Warnings', labelAr: 'الإنذارات' },
    { key: 'notifications', icon: 'fa-bell', label: 'Notifications', labelAr: 'الإشعارات' },
  ];

  return (
    <Layout title={isAr ? 'إجراءات إدارية - HR' : 'HR Manager Actions'}>
      {msg && (
        <div className={`mb-4 p-4 rounded-2xl font-bold text-sm flex items-center gap-2 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={`fa-solid ${msg.type === 'ok' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          {msg.text}
          <button className="ms-auto opacity-60 hover:opacity-100" onClick={() => setMsg(null)}><i className="fa-solid fa-xmark"></i></button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl shadow-soft border p-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition ${tab === t.key ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <i className={`fa-solid ${t.icon}`}></i>
            {isAr ? t.labelAr : t.label}
          </button>
        ))}
      </div>

      {/* ════ DEDUCTIONS TAB ════ */}
      {tab === 'deductions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-soft border p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الشهر' : 'Month'}</label>
              <input type="month" value={dedMonth} onChange={e => setDedMonth(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
              <select value={dedEmpFilter} onChange={e => setDedEmpFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-w-[160px]">
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </div>
            <button onClick={() => setShowDedForm(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm">
              <i className="fa-solid fa-plus me-1"></i> {isAr ? 'إضافة خصم' : 'Add Deduction'}
            </button>
          </div>

          {/* Deductions Form Modal */}
          {showDedForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDedForm(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4">
                  <i className="fa-solid fa-money-bill-transfer text-indigo-500 me-2"></i>
                  {isAr ? 'خصم جديد' : 'New Deduction'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
                    <select value={dedForm.employee_id} onChange={e => setDedForm({ ...dedForm, employee_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm">
                      <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                      {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'المبلغ (JOD)' : 'Amount (JOD)'}</label>
                    <input type="number" step="0.01" min="0" value={dedForm.amount}
                      onChange={e => setDedForm({ ...dedForm, amount: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'السبب' : 'Reason'}</label>
                    <textarea value={dedForm.reason} onChange={e => setDedForm({ ...dedForm, reason: e.target.value })}
                      rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddDeduction} disabled={saving || !dedForm.employee_id || !dedForm.amount}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                      {saving && <i className="fa-solid fa-circle-notch fa-spin me-2"></i>}
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                    <button onClick={() => setShowDedForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm">
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deductions Table */}
          <div className="bg-white rounded-2xl shadow-soft border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-start px-4 py-3 font-bold text-slate-500">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="text-center px-3 py-3 font-bold text-slate-500">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="text-start px-3 py-3 font-bold text-slate-500">{isAr ? 'السبب' : 'Reason'}</th>
                  <th className="text-center px-3 py-3 font-bold text-slate-500">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-300">{isAr ? 'لا توجد خصومات' : 'No deductions'}</td></tr>
                ) : deductions.map(d => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{d.employeeName || empName(d.employeeId)}</td>
                    <td className="text-center px-3 py-3 font-mono font-bold text-red-600">{d.amount.toFixed(2)} JOD</td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{d.reason || '—'}</td>
                    <td className="text-center px-3 py-3 text-slate-400 text-xs">{fmtDate(d.createdAt)}</td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => handleDeleteDeduction(d.id)} className="text-red-400 hover:text-red-600 text-xs">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ WARNINGS TAB ════ */}
      {tab === 'warnings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-soft border p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
              <select value={warnEmpFilter} onChange={e => setWarnEmpFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-w-[160px]">
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </div>
            <button onClick={() => setShowWarnForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-bold text-sm">
              <i className="fa-solid fa-triangle-exclamation me-1"></i> {isAr ? 'إضافة إنذار' : 'Add Warning'}
            </button>
          </div>

          {/* Warning Form Modal */}
          {showWarnForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowWarnForm(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4">
                  <i className="fa-solid fa-triangle-exclamation text-orange-500 me-2"></i>
                  {isAr ? 'إنذار جديد' : 'New Warning'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
                    <select value={warnForm.employee_id} onChange={e => setWarnForm({ ...warnForm, employee_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm">
                      <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                      {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'مستوى الإنذار' : 'Warning Level'}</label>
                    <div className="flex gap-2">
                      {(['verbal', 'written', 'final'] as const).map(lvl => (
                        <button key={lvl} type="button"
                          onClick={() => setWarnForm({ ...warnForm, level: lvl })}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${warnForm.level === lvl ? WARNING_COLORS[lvl] : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          {isAr ? WARNING_AR[lvl] : lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'السبب' : 'Reason'}</label>
                    <textarea value={warnForm.reason} onChange={e => setWarnForm({ ...warnForm, reason: e.target.value })}
                      rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddWarning} disabled={saving || !warnForm.employee_id}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                      {saving && <i className="fa-solid fa-circle-notch fa-spin me-2"></i>}
                      {isAr ? 'إصدار إنذار' : 'Issue Warning'}
                    </button>
                    <button onClick={() => setShowWarnForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm">
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings Table */}
          <div className="bg-white rounded-2xl shadow-soft border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-start px-4 py-3 font-bold text-slate-500">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="text-center px-3 py-3 font-bold text-slate-500">{isAr ? 'المستوى' : 'Level'}</th>
                  <th className="text-start px-3 py-3 font-bold text-slate-500">{isAr ? 'السبب' : 'Reason'}</th>
                  <th className="text-center px-3 py-3 font-bold text-slate-500">{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {warnings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-300">{isAr ? 'لا توجد إنذارات' : 'No warnings'}</td></tr>
                ) : warnings.map(w => (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{w.employeeName || empName(w.employeeId)}</td>
                    <td className="text-center px-3 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${WARNING_COLORS[w.level]}`}>
                        {isAr ? WARNING_AR[w.level] : w.level}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{w.reason || '—'}</td>
                    <td className="text-center px-3 py-3 text-slate-400 text-xs">{fmtDate(w.issuedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ NOTIFICATIONS TAB ════ */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-soft border p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
              <select value={notifEmpFilter} onChange={e => setNotifEmpFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-w-[160px]">
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </div>
            <button onClick={() => setShowNotifForm(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-xl font-bold text-sm">
              <i className="fa-solid fa-bell me-1"></i> {isAr ? 'إرسال إشعار' : 'Send Notification'}
            </button>
          </div>

          {/* Notification Form Modal */}
          {showNotifForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNotifForm(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-extrabold text-slate-800 mb-4">
                  <i className="fa-solid fa-bell text-teal-500 me-2"></i>
                  {isAr ? 'إشعار جديد' : 'New Notification'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
                    <select value={notifForm.employee_id} onChange={e => setNotifForm({ ...notifForm, employee_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm">
                      <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                      {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{isAr ? 'الرسالة' : 'Message'}</label>
                    <textarea value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                      rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                      placeholder={isAr ? 'محتوى الإشعار...' : 'Notification content...'} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddNotification} disabled={saving || !notifForm.employee_id || !notifForm.message}
                      className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                      {saving && <i className="fa-solid fa-circle-notch fa-spin me-2"></i>}
                      {isAr ? 'إرسال' : 'Send'}
                    </button>
                    <button onClick={() => setShowNotifForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm">
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft border p-8 text-center text-slate-300">
                {isAr ? 'لا توجد إشعارات' : 'No notifications'}
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`bg-white rounded-2xl shadow-soft border p-4 flex items-start gap-3 ${!n.isRead ? 'border-teal-300 bg-teal-50/30' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-slate-100' : 'bg-teal-100'}`}>
                  <i className={`fa-solid fa-bell ${n.isRead ? 'text-slate-400' : 'text-teal-500'}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-800">{empName(n.employeeId)}</span>
                    {!n.isRead && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">{isAr ? 'جديد' : 'NEW'}</span>}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtDateTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HrManagerActionsView;
