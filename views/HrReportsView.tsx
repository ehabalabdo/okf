import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { HrMonthlyReport, HrEmployee } from '../types';
import { hrReportsService, hrEmployeesService } from '../services/hrApiServices';
import { useLanguage } from '../context/LanguageContext';
import { fmtMinutes, fmtTime, fmtDate } from '../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-700',
  late: 'bg-amber-100 text-amber-700',
  incomplete: 'bg-blue-100 text-blue-700',
  absent: 'bg-red-100 text-red-600',
  weekend: 'bg-slate-100 text-slate-500',
};
const STATUS_AR: Record<string, string> = { normal: 'منتظم', late: 'متأخر', incomplete: 'غير مكتمل', absent: 'غائب', weekend: 'عطلة' };

const HrReportsView: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [report, setReport] = useState<HrMonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    hrEmployeesService.getAll().then(emps => {
      setEmployees(emps);
      if (emps.length > 0) setSelectedEmployee(String(emps[0].id));
      setLoadingEmployees(false);
    }).catch(() => setLoadingEmployees(false));
  }, []);

  const fetchReport = useCallback(async () => {
    if (!selectedEmployee || !month) return;
    setLoading(true);
    try {
      const data = await hrReportsService.monthly(parseInt(selectedEmployee), month);
      setReport(data);
    } catch (err) {
      console.error(err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const summary = report?.summary;
  const days = report?.days || [];

  return (
    <Layout title={isAr ? 'التقارير الشهرية - HR' : 'HR Monthly Reports'}>
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
            {loadingEmployees ? (
              <div className="p-2.5 text-slate-400 text-sm"><i className="fa-solid fa-circle-notch fa-spin"></i></div>
            ) : (
              <select className="w-full p-2.5 rounded-xl border border-gray-200 outline-none text-sm" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'الشهر' : 'Month'}</label>
            <input type="month" className="p-2.5 rounded-xl border border-gray-200 outline-none text-sm" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>
      )}

      {!loading && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-3xl font-extrabold text-emerald-600">{summary.daysPresent}</div>
              <div className="text-xs font-bold uppercase text-slate-400 mt-1">{isAr ? 'أيام حضور' : 'Days Present'}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-3xl font-extrabold text-slate-800">{fmtMinutes(summary.totalWorkMinutes)}</div>
              <div className="text-xs font-bold uppercase text-slate-400 mt-1">{isAr ? 'إجمالي العمل' : 'Total Work'}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-3xl font-extrabold text-amber-600">{fmtMinutes(summary.totalLateMinutes)}</div>
              <div className="text-xs font-bold uppercase text-slate-400 mt-1">{isAr ? 'إجمالي التأخير' : 'Total Late'}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-3xl font-extrabold text-indigo-600">{fmtMinutes(summary.totalOvertimeMinutes)}</div>
              <div className="text-xs font-bold uppercase text-slate-400 mt-1">{isAr ? 'إجمالي الإضافي' : 'Total Overtime'}</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-xl font-extrabold text-red-500">{summary.totalAbsences}</div>
              <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'غياب' : 'Absences'}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-xl font-extrabold text-amber-500">{summary.totalLateDays}</div>
              <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'أيام تأخير' : 'Late Days'}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
              <div className="text-xl font-extrabold text-blue-500">{summary.totalEarlyLeaveDays || 0}</div>
              <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'مغادرة مبكرة' : 'Early Leaves'}</div>
            </div>
          </div>

          {/* Day-by-Day Table */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-600 uppercase">{isAr ? 'التفاصيل اليومية' : 'Daily Breakdown'}</h3>
            </div>
            {days.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <i className="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i>
                <p className="font-bold">{isAr ? 'لا توجد بيانات' : 'No data'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'دخول' : 'In'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'خروج' : 'Out'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'المجموع' : 'Total'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'تأخير' : 'Late'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'إضافي' : 'OT'}</th>
                      <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {days.map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {fmtDate(d.date)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{fmtTime(d.checkIn)}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{fmtTime(d.checkOut)}</td>
                        <td className="px-4 py-3 text-center font-bold">{fmtMinutes(d.totalMinutes || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          {d.lateMinutes > 0 ? <span className="text-amber-600 font-bold">{d.lateMinutes}m</span> : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {d.overtimeMinutes > 0 ? <span className="text-indigo-600 font-bold">{d.overtimeMinutes}m</span> : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[d.status] || 'bg-slate-100 text-slate-500'}`}>
                            {isAr ? (STATUS_AR[d.status] || d.status) : d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !summary && selectedEmployee && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center text-slate-400">
          <i className="fa-solid fa-chart-bar text-4xl mb-3 block"></i>
          <p className="font-bold">{isAr ? 'اختر موظف لعرض التقرير' : 'Select an employee to view report'}</p>
        </div>
      )}
    </Layout>
  );
};

export default HrReportsView;
