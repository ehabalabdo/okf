
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BillingService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Invoice, UserRole } from '../types';
import { fmtDate } from '../utils/formatters';

const AccountantView: React.FC = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');

    const isSenior = user?.role === UserRole.SENIOR_ACCOUNTANT;

    const loadInvoices = async () => {
        if (!user) return;
        try {
            const all = await BillingService.getAll(user);
            setInvoices(all);
        } catch (err) {
            console.error('Failed to load invoices:', err);
        }
    };

    useEffect(() => { loadInvoices(); }, [user]);

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'paid') return inv.status === 'paid';
        if (filter === 'unpaid') return inv.status !== 'paid';
        return true;
    });

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

    const handleEdit = async (inv: Invoice) => {
        if (!user || !isSenior) return;
        const newAmount = parseFloat(editAmount);
        if (isNaN(newAmount) || newAmount < 0) return;
        try {
            await BillingService.update(user, inv.id, {
                items: [{ id: 'edited', description: 'Medical Consultation', price: newAmount }],
                totalAmount: newAmount
            });
            setEditingId(null);
            setEditAmount('');
            await loadInvoices();
        } catch (err: any) {
            alert(err.message || 'Error updating invoice');
        }
    };

    const handleDelete = async (inv: Invoice) => {
        if (!user || !isSenior) return;
        if (!confirm(`حذف فاتورة ${inv.patientName}؟`)) return;
        try {
            const { pgInvoices } = await import('../services/apiServices');
            await pgInvoices.delete(inv.id);
            await loadInvoices();
        } catch (err: any) {
            alert(err.message || 'Error deleting invoice');
        }
    };

    return (
        <Layout title={isSenior ? 'محاسب أول' : 'المحاسبة'}>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="text-xs text-slate-400 uppercase mb-1">إجمالي الفواتير</div>
                        <div className="text-3xl font-bold text-slate-800">{invoices.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                        <div className="text-xs text-emerald-500 uppercase mb-1">الإيرادات المحصلة</div>
                        <div className="text-3xl font-bold text-emerald-600">{totalRevenue.toFixed(2)}</div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
                        <div className="text-xs text-amber-500 uppercase mb-1">المبالغ المعلقة</div>
                        <div className="text-3xl font-bold text-amber-600">{totalPending.toFixed(2)}</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {(['all', 'paid', 'unpaid'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            {f === 'all' ? 'الكل' : f === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                        </button>
                    ))}
                </div>

                {/* Invoice Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <th className="px-6 py-3 text-right">المريض</th>
                                <th className="px-6 py-3 text-right">التاريخ</th>
                                <th className="px-6 py-3 text-right">المبلغ</th>
                                <th className="px-6 py-3 text-right">الحالة</th>
                                <th className="px-6 py-3 text-right">طريقة الدفع</th>
                                {isSenior && <th className="px-6 py-3 text-right">إجراءات</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-bold text-slate-800">{inv.patientName}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(inv.createdAt)}</td>
                                    <td className="px-6 py-4">
                                        {editingId === inv.id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                                    className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold" autoFocus />
                                                <button onClick={() => handleEdit(inv)} className="text-emerald-600 hover:text-emerald-700"><i className="fa-solid fa-check"></i></button>
                                                <button onClick={() => { setEditingId(null); setEditAmount(''); }} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-slate-800">{inv.totalAmount.toFixed(2)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'جزئي' : 'غير مدفوعة'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'بطاقة' : inv.paymentMethod === 'insurance' ? 'تأمين' : inv.paymentMethod}
                                    </td>
                                    {isSenior && (
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingId(inv.id); setEditAmount(String(inv.totalAmount)); }}
                                                    className="text-blue-500 hover:text-blue-700" title="تعديل">
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                                <button onClick={() => handleDelete(inv)}
                                                    className="text-red-400 hover:text-red-600" title="حذف">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr><td colSpan={isSenior ? 6 : 5} className="px-6 py-12 text-center text-slate-400">لا توجد فواتير</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AccountantView;
