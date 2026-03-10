import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BillingService } from '../services/services';
import { api } from '../src/api';
import type { Invoice } from '../types';

type TabKey = 'overview' | 'invoices' | 'services';
type DateRange = '7d' | '30d' | '90d' | '365d' | 'all';

const AccountingView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Financial report data from API
  const [summary, setSummary] = useState<any>(null);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);

  // Invoice filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice edit
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editItems, setEditItems] = useState<{description: string; price: number}[]>([]);
  const [editMode, setEditMode] = useState(false);
  const tapCount = React.useRef(0);
  const tapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      setEditMode(prev => !prev);
      tapCount.current = 0;
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
  };

  const openEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditItems(inv.items.map(i => ({ description: i.description, price: i.price })));
  };

  const handleSaveInvoiceEdit = async () => {
    if (!user || !editingInvoice) return;
    const validItems = editItems.filter(i => i.description.trim() && i.price > 0);
    if (validItems.length === 0) return alert(isRTL ? 'أضف خدمة واحدة على الأقل' : 'Add at least one item');
    try {
      const newItems = validItems.map((item, idx) => ({ id: `item-${idx}`, ...item }));
      const newTotal = validItems.reduce((sum, i) => sum + i.price, 0);
      await BillingService.update(user, editingInvoice.id, {
        items: newItems,
        totalAmount: newTotal,
      });
      setEditingInvoice(null);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!user) return;
    if (!confirm(isRTL ? `حذف فاتورة ${inv.patientName} نهائياً؟` : `Delete invoice for ${inv.patientName}?`)) return;
    try {
      await api.del(`/invoices/${inv.id}`);
      setEditingInvoice(null);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const getDateRangeMs = (range: DateRange): { from: number; to: number } => {
    const to = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const map: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365, 'all': 3650 };
    return { from: to - map[range] * dayMs, to };
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { from, to } = getDateRangeMs(dateRange);
      const daysNum = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 3650;

      const [inv, sum, daily, methods, services] = await Promise.all([
        BillingService.getAll(user),
        api.get(`/reports/financial-summary?from=${from}&to=${to}`).catch(() => null),
        api.get(`/reports/daily-revenue?days=${daysNum}`).catch(() => []),
        api.get(`/reports/payment-methods?from=${from}&to=${to}`).catch(() => []),
        api.get(`/reports/top-services?from=${from}&to=${to}`).catch(() => []),
      ]);

      setInvoices(inv);
      setSummary(sum);
      setDailyRevenue(Array.isArray(daily) ? daily : []);
      setPaymentMethods(Array.isArray(methods) ? methods : []);
      setTopServices(Array.isArray(services) ? services : []);
    } catch (err) {
      console.error('Load accounting data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [dateRange]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const { from, to } = getDateRangeMs(dateRange);
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (inv.createdAt < from || inv.createdAt > to) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (inv.patientName || '').toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery, dateRange]);

  // Local calculations as fallback
  const localSummary = useMemo(() => {
    const { from, to } = getDateRangeMs(dateRange);
    const rangedInvoices = invoices.filter(i => i.createdAt >= from && i.createdAt <= to);
    return {
      total_invoices: rangedInvoices.length,
      total_revenue: rangedInvoices.reduce((s, i) => s + i.totalAmount, 0),
      total_collected: rangedInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0),
      total_pending: rangedInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.totalAmount - i.paidAmount, 0),
      paid_count: rangedInvoices.filter(i => i.status === 'paid').length,
      unpaid_count: rangedInvoices.filter(i => i.status === 'unpaid').length,
      partial_count: rangedInvoices.filter(i => i.status === 'partial').length,
    };
  }, [invoices, dateRange]);

  const s = summary || localSummary;

  const formatCurrency = (n: number) => `${parseFloat(String(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const paymentMethodLabel = (m: string) => {
    const map: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', insurance: 'تأمين' };
    return isRTL ? (map[m] || m) : m;
  };

  // Chart: max bar height
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => parseFloat(d.total || 0)), 100);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: 'fa-chart-pie' },
    { key: 'invoices', label: isRTL ? 'الفواتير' : 'Invoices', icon: 'fa-file-invoice-dollar' },
    { key: 'services', label: isRTL ? 'الخدمات' : 'Top Services', icon: 'fa-ranking-star' },
  ];

  const dateRanges: { key: DateRange; label: string }[] = [
    { key: '7d', label: isRTL ? '7 أيام' : '7 Days' },
    { key: '30d', label: isRTL ? '30 يوم' : '30 Days' },
    { key: '90d', label: isRTL ? '3 أشهر' : '3 Months' },
    { key: '365d', label: isRTL ? 'سنة' : '1 Year' },
    { key: 'all', label: isRTL ? 'الكل' : 'All' },
  ];

  if (loading) {
    return (
      <Layout title={isRTL ? 'المحاسبة' : 'Accounting'}>
        <div className="flex items-center justify-center h-64">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isRTL ? 'المحاسبة والتقارير المالية' : 'Accounting & Financial Reports'} titleExtra={<div onClick={handleTitleTap} className="h-1 w-16 bg-primary rounded-full mt-1.5 cursor-default select-none"></div>}>
      {/* Header: Tabs + Date Range */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
          {dateRanges.map(r => (
            <button
              key={r.key}
              onClick={() => setDateRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRange === r.key ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatCurrency(s.total_revenue), icon: 'fa-coins', color: 'bg-blue-100 text-blue-600', count: `${s.total_invoices || 0} ${isRTL ? 'فاتورة' : 'invoices'}` },
              { label: isRTL ? 'المحصّل' : 'Collected', value: formatCurrency(s.total_collected), icon: 'fa-circle-check', color: 'bg-emerald-100 text-emerald-600', count: `${s.paid_count || 0} ${isRTL ? 'مدفوعة' : 'paid'}` },
              { label: isRTL ? 'المعلّق' : 'Pending', value: formatCurrency(s.total_pending), icon: 'fa-clock', color: 'bg-amber-100 text-amber-600', count: `${s.unpaid_count || 0} ${isRTL ? 'غير مدفوعة' : 'unpaid'}` },
              { label: isRTL ? 'دفع جزئي' : 'Partial', value: formatCurrency(s.partial_total || 0), icon: 'fa-circle-half-stroke', color: 'bg-purple-100 text-purple-600', count: `${s.partial_count || 0} ${isRTL ? 'جزئية' : 'partial'}` },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-2xl shadow-inner`}>
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-800 tracking-tight">{card.value}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{card.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{card.count}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Revenue Chart */}
          {dailyRevenue.length > 0 && (
            <div className="bg-slate-900 rounded-[2rem] p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                <i className="fa-solid fa-chart-bar text-primary"></i>
                {isRTL ? 'الإيرادات اليومية' : 'Daily Revenue'}
              </h3>
              <div className="relative z-10 flex gap-1 items-end h-48 overflow-x-auto">
                {dailyRevenue.map((d, i) => {
                  const h = Math.max(Math.round((parseFloat(d.total) / maxDailyRevenue) * 100), 2);
                  const dayLabel = new Date(d.day).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                  return (
                    <div key={i} className="flex-1 min-w-[24px] flex flex-col justify-end items-center gap-1 group h-full">
                      <div className="text-[9px] font-bold text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {parseFloat(d.total).toFixed(0)}
                      </div>
                      <div className="w-full bg-slate-800 rounded-xl relative overflow-hidden h-full flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-primary to-sky-400 rounded-t-xl transition-all duration-500"
                          style={{ height: `${h}%`, minHeight: '3px' }}
                        ></div>
                      </div>
                      <span className="text-[8px] font-bold text-slate-500">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-credit-card text-primary"></i>
                {isRTL ? 'طرق الدفع' : 'Payment Methods'}
              </h3>
              {paymentMethods.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">{isRTL ? 'لا توجد بيانات' : 'No data'}</div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((m, i) => {
                    const totalAll = paymentMethods.reduce((s, x) => s + parseFloat(x.total || 0), 0);
                    const pct = totalAll > 0 ? (parseFloat(m.total) / totalAll * 100).toFixed(1) : '0';
                    const colors: Record<string, string> = { cash: 'bg-emerald-500', card: 'bg-blue-500', insurance: 'bg-purple-500' };
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-slate-700">
                            {paymentMethodLabel(m.payment_method)} ({m.count})
                          </span>
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(parseFloat(m.total))}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className={`${colors[m.payment_method] || 'bg-slate-400'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Donut/Summary */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-chart-pie text-primary"></i>
                {isRTL ? 'حالة الفواتير' : 'Invoice Status'}
              </h3>
              <div className="space-y-4">
                {[
                  { label: isRTL ? 'مدفوعة' : 'Paid', count: s.paid_count || 0, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                  { label: isRTL ? 'غير مدفوعة' : 'Unpaid', count: s.unpaid_count || 0, color: 'bg-red-500', textColor: 'text-red-600' },
                  { label: isRTL ? 'جزئية' : 'Partial', count: s.partial_count || 0, color: 'bg-amber-500', textColor: 'text-amber-600' },
                ].map((item, i) => {
                  const total = (s.paid_count || 0) + (s.unpaid_count || 0) + (s.partial_count || 0);
                  const pct = total > 0 ? (item.count / total * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-sm ${item.textColor}`}>{item.label}</span>
                          <span className="text-sm font-bold text-slate-700">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                          <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== INVOICES TAB ==================== */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between bg-slate-50/50">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: isRTL ? 'الكل' : 'All' },
                { key: 'paid', label: isRTL ? 'مدفوعة' : 'Paid' },
                { key: 'unpaid', label: isRTL ? 'غير مدفوعة' : 'Unpaid' },
                { key: 'partial', label: isRTL ? 'جزئية' : 'Partial' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === f.key ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder={isRTL ? 'بحث بالاسم أو رقم الفاتورة...' : 'Search by name or invoice #...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">#</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'المريض' : 'Patient'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'المدفوع' : 'Paid'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'الباقي' : 'Balance'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'طريقة الدفع' : 'Method'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">{isRTL ? 'لا توجد فواتير' : 'No invoices found'}</td></tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const balance = inv.totalAmount - inv.paidAmount;
                    const statusColors: Record<string, string> = {
                      paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      unpaid: 'bg-red-50 text-red-600 border-red-100',
                      partial: 'bg-amber-50 text-amber-600 border-amber-100',
                    };
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{inv.id.substring(0, 12)}</td>
                        <td className="px-5 py-3 font-bold text-slate-800">{inv.patientName || '-'}</td>
                        <td className="px-5 py-3 font-bold">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-5 py-3 text-emerald-600 font-bold">{formatCurrency(inv.paidAmount)}</td>
                        <td className={`px-5 py-3 font-bold ${balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {formatCurrency(balance)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold">{paymentMethodLabel(inv.paymentMethod)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-tight border ${statusColors[inv.status] || ''}`}>
                            {inv.status === 'paid' ? (isRTL ? 'مدفوعة' : 'Paid') :
                             inv.status === 'unpaid' ? (isRTL ? 'غير مدفوعة' : 'Unpaid') :
                             (isRTL ? 'جزئية' : 'Partial')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                        {editMode && (
                          <td className="px-3 py-3">
                            <button onClick={() => openEditInvoice(inv)} className="text-amber-500 hover:text-amber-700 transition-colors" title="Edit">
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 text-sm">
            <div><span className="text-slate-400 font-bold">{isRTL ? 'عدد الفواتير:' : 'Count:'}</span> <span className="font-extrabold text-slate-800">{filteredInvoices.length}</span></div>
            <div><span className="text-slate-400 font-bold">{isRTL ? 'الإجمالي:' : 'Total:'}</span> <span className="font-extrabold text-slate-800">{formatCurrency(filteredInvoices.reduce((s, i) => s + i.totalAmount, 0))}</span></div>
            <div><span className="text-slate-400 font-bold">{isRTL ? 'المحصّل:' : 'Collected:'}</span> <span className="font-extrabold text-emerald-600">{formatCurrency(filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0))}</span></div>
            <div><span className="text-slate-400 font-bold">{isRTL ? 'المعلّق:' : 'Pending:'}</span> <span className="font-extrabold text-red-600">{formatCurrency(filteredInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.totalAmount - i.paidAmount, 0))}</span></div>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-amber-600 text-white flex justify-between items-center">
              <h3 className="font-bold"><i className="fa-solid fa-pen-to-square ml-2"></i>تعديل فاتورة - {editingInvoice.patientName}</h3>
              <button onClick={() => setEditingInvoice(null)}><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="p-5 space-y-3">
              {editItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary outline-none"
                    placeholder="الخدمة"
                    value={item.description}
                    onChange={e => { const arr = [...editItems]; arr[idx].description = e.target.value; setEditItems(arr); }}
                  />
                  <input
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm text-left font-mono focus:border-primary outline-none"
                    type="number"
                    placeholder="السعر"
                    value={item.price || ''}
                    onChange={e => { const arr = [...editItems]; arr[idx].price = parseFloat(e.target.value) || 0; setEditItems(arr); }}
                  />
                  <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-lg"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
              <button onClick={() => setEditItems([...editItems, { description: '', price: 0 }])} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2 text-sm text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <i className="fa-solid fa-plus ml-1"></i> إضافة خدمة
              </button>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-600">المجموع:</span>
                <span className="text-2xl font-bold text-emerald-600">{editItems.reduce((s, i) => s + i.price, 0).toFixed(2)} د.أ</span>
              </div>
              <button onClick={handleSaveInvoiceEdit} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-amber-700 shadow-lg mt-2">
                <i className="fa-solid fa-check ml-2"></i> حفظ التعديلات
              </button>
              <button onClick={() => handleDeleteInvoice(editingInvoice)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-trash ml-2"></i> حذف الفاتورة نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOP SERVICES TAB ==================== */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-ranking-star text-amber-500"></i>
              {isRTL ? 'أعلى الخدمات ربحاً' : 'Top Revenue Services'}
            </h3>
          </div>
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100 w-12">#</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'الخدمة' : 'Service'}</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-center">{isRTL ? 'العدد' : 'Count'}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{isRTL ? 'الإيرادات' : 'Revenue'}</th>
                  <th className="px-5 py-3 border-b border-slate-100 w-48"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topServices.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">{isRTL ? 'لا توجد بيانات' : 'No data'}</td></tr>
                ) : (
                  topServices.map((svc, i) => {
                    const maxTotal = parseFloat(topServices[0]?.total || 1);
                    const pct = Math.round((parseFloat(svc.total) / maxTotal) * 100);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3 font-bold text-slate-400">{medal || (i + 1)}</td>
                        <td className="px-5 py-3 font-bold text-slate-800">{svc.service_name}</td>
                        <td className="px-5 py-3 text-center font-bold text-primary">{svc.count}</td>
                        <td className="px-5 py-3 font-bold text-slate-800">{formatCurrency(parseFloat(svc.total))}</td>
                        <td className="px-5 py-3">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-primary to-sky-400 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AccountingView;
