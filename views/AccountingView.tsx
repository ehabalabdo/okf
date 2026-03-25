import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BillingService } from '../services/services';
import { api } from '../src/api';
import type { Invoice } from '../types';

type TabKey = 'overview' | 'invoices' | 'services';

const AccountingView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  // Date range: default last 30 days
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
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
    if (validItems.length === 0) return alert(t('add_one_item'));
    try {
      const newItems = validItems.map((item, idx) => ({ id: `item-${idx}`, ...item }));
      const newTotal = validItems.reduce((sum, i) => sum + i.price, 0);
      await BillingService.update(user, editingInvoice.id, {
        items: newItems,
        totalAmount: newTotal,
      });
      setEditingInvoice(null);
      setEditItems([]);
      await loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!user) return;
    if (!confirm(`${t('delete_invoice_confirm')} ${inv.patientName}?`)) return;
    try {
      await api.del(`/invoices/${inv.id}`);
      setEditingInvoice(null);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const getDateRangeMs = (): { from: number; to: number } => {
    const from = new Date(dateFrom).getTime();
    const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1; // end of day
    return { from, to };
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { from, to } = getDateRangeMs();
      const daysNum = Math.max(1, Math.round((to - from) / (24 * 60 * 60 * 1000)));

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

  useEffect(() => { loadData(); }, [dateFrom, dateTo]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const { from, to } = getDateRangeMs();
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (inv.createdAt < from || inv.createdAt > to) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (inv.patientName || '').toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery, dateFrom, dateTo]);

  // Local calculations as fallback
  const localSummary = useMemo(() => {
    const { from, to } = getDateRangeMs();
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
  }, [invoices, dateFrom, dateTo]);

  const s = summary || localSummary;

  const formatCurrency = (n: number) => `${parseFloat(String(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // PDF Export
  const handleExportPDF = useCallback(() => {
    const { from, to } = getDateRangeMs();
    const rangedInvoices = invoices.filter(i => i.createdAt >= from && i.createdAt <= to);
    const rangeLabel = `${dateFrom} → ${dateTo}`;
    const fromDate = formatDate(from);
    const toDate = formatDate(to);
    const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const cashTotal = rangedInvoices.filter(i => i.paymentMethod === 'cash').reduce((s, i) => s + i.totalAmount, 0);
    const cardTotal = rangedInvoices.filter(i => i.paymentMethod === 'card').reduce((s, i) => s + i.totalAmount, 0);
    const insuranceTotal = rangedInvoices.filter(i => i.paymentMethod === 'insurance').reduce((s, i) => s + i.totalAmount, 0);

    const html = `<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
<head>
<meta charset="utf-8"/>
<title>${t('pdf_title')}</title>
<style>
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; }
.header { text-align: center; border-bottom: 3px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 16px; }
.header h1 { font-size: 22px; color: #0f172a; margin-bottom: 2px; }
.header .clinic { font-size: 13px; color: #64748b; }
.header .subtitle { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 10px; color: #64748b; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
.summary-card .val { font-size: 16px; font-weight: 800; color: #0f172a; }
.summary-card .lbl { font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
.summary-card.revenue { border-color: #3b82f6; background: #eff6ff; }
.summary-card.collected { border-color: #10b981; background: #ecfdf5; }
.summary-card.pending { border-color: #f59e0b; background: #fffbeb; }
.summary-card.partial { border-color: #8b5cf6; background: #f5f3ff; }
.section-title { font-size: 13px; font-weight: 700; color: #0f172a; margin: 14px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
th { background: #f1f5f9; font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; text-align: right; }
td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
tr:nth-child(even) { background: #f8fafc; }
.status-paid { color: #10b981; font-weight: 700; }
.status-unpaid { color: #ef4444; font-weight: 700; }
.status-partial { color: #f59e0b; font-weight: 700; }
.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.method-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; text-align: center; }
.method-card .val { font-size: 14px; font-weight: 800; }
.method-card .lbl { font-size: 9px; color: #94a3b8; }
.footer { text-align: center; color: #94a3b8; font-size: 9px; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; }
.totals-row { font-weight: 800; background: #f1f5f9 !important; }
.text-left { text-align: left; }
</style>
</head>
<body>
<div class="header">
  <h1>TKC</h1>
  <div class="clinic">${t('pdf_clinic')}</div>
  <div class="subtitle">${t('pdf_subtitle')} - ${rangeLabel} (${fromDate} - ${toDate})</div>
</div>

<div class="meta">
  <span>${t('pdf_print_date')}: ${now} - ${nowTime}</span>
  <span>${t('pdf_invoice_count')}: ${rangedInvoices.length}</span>
</div>

<div class="summary-grid">
  <div class="summary-card revenue">
    <div class="val">${formatCurrency(localSummary.total_revenue)}</div>
    <div class="lbl">${t('pdf_total_revenue')}</div>
  </div>
  <div class="summary-card collected">
    <div class="val">${formatCurrency(localSummary.total_collected)}</div>
    <div class="lbl">${t('pdf_collected')}</div>
  </div>
  <div class="summary-card pending">
    <div class="val">${formatCurrency(localSummary.total_pending)}</div>
    <div class="lbl">${t('pdf_pending')}</div>
  </div>
  <div class="summary-card partial">
    <div class="val">${formatCurrency(rangedInvoices.filter(i => i.status === 'partial').reduce((s, i) => s + i.totalAmount, 0))}</div>
    <div class="lbl">${t('pdf_partial')}</div>
  </div>
</div>

<div class="section-title">${t('pdf_payment_methods')}</div>
<div class="method-grid">
  <div class="method-card"><div class="val" style="color:#10b981">${formatCurrency(cashTotal)}</div><div class="lbl">${t('cash_method')} (${rangedInvoices.filter(i => i.paymentMethod === 'cash').length})</div></div>
  <div class="method-card"><div class="val" style="color:#3b82f6">${formatCurrency(cardTotal)}</div><div class="lbl">${t('card_method')} (${rangedInvoices.filter(i => i.paymentMethod === 'card').length})</div></div>
  <div class="method-card"><div class="val" style="color:#8b5cf6">${formatCurrency(insuranceTotal)}</div><div class="lbl">${t('insurance_method')} (${rangedInvoices.filter(i => i.paymentMethod === 'insurance').length})</div></div>
</div>

<div class="section-title">${t('pdf_invoice_details')}</div>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>${t('pdf_patient')}</th>
      <th>${t('pdf_amount')}</th>
      <th>${t('pdf_paid')}</th>
      <th>${t('pdf_balance')}</th>
      <th>${t('pdf_method')}</th>
      <th>${t('pdf_status')}</th>
      <th>${t('pdf_date')}</th>
    </tr>
  </thead>
  <tbody>
    ${rangedInvoices.sort((a, b) => b.createdAt - a.createdAt).map((inv, idx) => {
      const balance = inv.totalAmount - inv.paidAmount;
      const methodMap: Record<string, string> = { cash: t('cash_method'), card: t('card_method'), insurance: t('insurance_method') };
      const statusMap: Record<string, string> = { paid: t('paid'), unpaid: t('unpaid'), partial: t('partial_label') };
      return `<tr>
        <td>${idx + 1}</td>
        <td style="font-weight:600">${inv.patientName || '-'}</td>
        <td>${formatCurrency(inv.totalAmount)}</td>
        <td style="color:#10b981;font-weight:600">${formatCurrency(inv.paidAmount)}</td>
        <td style="color:${balance > 0 ? '#ef4444' : '#94a3b8'}">${formatCurrency(balance)}</td>
        <td>${methodMap[inv.paymentMethod] || inv.paymentMethod}</td>
        <td class="status-${inv.status}">${statusMap[inv.status] || inv.status}</td>
        <td class="text-left">${formatDate(inv.createdAt)}</td>
      </tr>`;
    }).join('')}
    <tr class="totals-row">
      <td colspan="2">${t('pdf_total')}</td>
      <td>${formatCurrency(rangedInvoices.reduce((s, i) => s + i.totalAmount, 0))}</td>
      <td style="color:#10b981">${formatCurrency(rangedInvoices.reduce((s, i) => s + i.paidAmount, 0))}</td>
      <td style="color:#ef4444">${formatCurrency(rangedInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0))}</td>
      <td colspan="3"></td>
    </tr>
  </tbody>
</table>

<div class="footer">
  ${t('pdf_footer')} &bull; ${now}
</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  }, [invoices, dateFrom, dateTo, localSummary]);

  const paymentMethodLabel = (m: string) => {
    const map: Record<string, string> = { cash: t('cash_method'), card: t('card_method'), insurance: t('insurance_method') };
    return map[m] || m;
  };

  // Chart: max bar height
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => parseFloat(d.total || 0)), 100);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: t('overview_tab'), icon: 'fa-chart-pie' },
    { key: 'invoices', label: t('invoices_tab'), icon: 'fa-file-invoice-dollar' },
    { key: 'services', label: t('top_services_tab'), icon: 'fa-ranking-star' },
  ];



  if (loading) {
    return (
      <Layout title={t('acct_title')}>
        <div className="flex items-center justify-center h-64">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('acct_subtitle')} titleExtra={<div onClick={handleTitleTap} className="h-1 w-16 bg-primary rounded-full mt-1.5 cursor-default select-none"></div>}>
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
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-2 items-center bg-white rounded-xl px-3 py-2 border border-slate-200">
            <i className="fa-solid fa-calendar text-slate-400 text-sm"></i>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent w-[130px]" />
            <span className="text-slate-300">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent w-[130px]" />
          </div>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <i className="fa-solid fa-file-pdf"></i>
            {t('print_report')}
          </button>
        </div>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: t('total_revenue'), value: formatCurrency(s.total_revenue), icon: 'fa-coins', color: 'bg-blue-100 text-blue-600', count: `${s.total_invoices || 0} ${t('invoice_count')}` },
              { label: t('collected_label'), value: formatCurrency(s.total_collected), icon: 'fa-circle-check', color: 'bg-emerald-100 text-emerald-600', count: `${s.paid_count || 0} ${t('paid')}` },
              { label: t('pending_label'), value: formatCurrency(s.total_pending), icon: 'fa-clock', color: 'bg-amber-100 text-amber-600', count: `${s.unpaid_count || 0} ${t('unpaid')}` },
              { label: t('partial_label'), value: formatCurrency(s.partial_total || 0), icon: 'fa-circle-half-stroke', color: 'bg-purple-100 text-purple-600', count: `${s.partial_count || 0} ${t('partial_label')}` },
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
                {t('daily_revenue')}
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
                {t('payment_methods')}
              </h3>
              {paymentMethods.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">{t('no_data')}</div>
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
                {t('invoice_status')}
              </h3>
              <div className="space-y-4">
                {[
                  { label: t('paid'), count: s.paid_count || 0, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                  { label: t('unpaid'), count: s.unpaid_count || 0, color: 'bg-red-500', textColor: 'text-red-600' },
                  { label: t('partial_label'), count: s.partial_count || 0, color: 'bg-amber-500', textColor: 'text-amber-600' },
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
                { key: 'all', label: t('all_filter') },
                { key: 'paid', label: t('paid') },
                { key: 'unpaid', label: t('unpaid') },
                { key: 'partial', label: t('partial_label') },
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
                placeholder={t('search_invoice')}
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
                  <th className="px-5 py-3 border-b border-slate-100">{t('patient_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('amount_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('paid_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('balance_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('method_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('status_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('date_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">{t('no_invoices')}</td></tr>
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
                            {inv.status === 'paid' ? t('paid') :
                             inv.status === 'unpaid' ? t('unpaid') :
                             t('partial_label')}
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
            <div><span className="text-slate-400 font-bold">{t('count_label')}</span> <span className="font-extrabold text-slate-800">{filteredInvoices.length}</span></div>
            <div><span className="text-slate-400 font-bold">{t('total_label')}</span> <span className="font-extrabold text-slate-800">{formatCurrency(filteredInvoices.reduce((s, i) => s + i.totalAmount, 0))}</span></div>
            <div><span className="text-slate-400 font-bold">{t('collected_colon')}</span> <span className="font-extrabold text-emerald-600">{formatCurrency(filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0))}</span></div>
            <div><span className="text-slate-400 font-bold">{t('pending_colon')}</span> <span className="font-extrabold text-red-600">{formatCurrency(filteredInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.totalAmount - i.paidAmount, 0))}</span></div>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-amber-600 text-white flex justify-between items-center">
              <h3 className="font-bold"><i className="fa-solid fa-pen-to-square ml-2"></i>{t('edit_invoice')} - {editingInvoice.patientName}</h3>
              <button onClick={() => setEditingInvoice(null)}><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="p-5 space-y-3">
              {editItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary outline-none"
                    placeholder={t('service_placeholder')}
                    value={item.description}
                    onChange={e => { const arr = [...editItems]; arr[idx].description = e.target.value; setEditItems(arr); }}
                  />
                  <input
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm text-left font-mono focus:border-primary outline-none"
                    type="number"
                    placeholder={t('price_placeholder_acct')}
                    value={item.price || ''}
                    onChange={e => { const arr = [...editItems]; arr[idx].price = parseFloat(e.target.value) || 0; setEditItems(arr); }}
                  />
                  <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-lg"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
              <button onClick={() => setEditItems([...editItems, { description: '', price: 0 }])} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2 text-sm text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <i className="fa-solid fa-plus ml-1"></i> {t('add_service_btn')}
              </button>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-600">{t('subtotal_label')}</span>
                <span className="text-2xl font-bold text-emerald-600">{editItems.reduce((s, i) => s + i.price, 0).toFixed(2)} {t('currency_jod')}</span>
              </div>
              <button onClick={handleSaveInvoiceEdit} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-amber-700 shadow-lg mt-2">
                <i className="fa-solid fa-check ml-2"></i> {t('save_edits')}
              </button>
              <button onClick={() => handleDeleteInvoice(editingInvoice)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-trash ml-2"></i> {t('delete_invoice_permanent')}
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
              {t('top_revenue_services')}
            </h3>
          </div>
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100 w-12">#</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('service_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-center">{t('count_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100">{t('revenue_col')}</th>
                  <th className="px-5 py-3 border-b border-slate-100 w-48"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topServices.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">{t('no_data')}</td></tr>
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
