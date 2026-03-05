import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { HrAttendanceRecord, HrAttendanceEvent, HrEmployee } from '../types';
import { hrAttendanceService, hrEmployeesService } from '../services/hrApiServices';
import { useLanguage } from '../context/LanguageContext';
import { fmtTime, fmtMinutes, fmtDate } from '../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-700',
  late: 'bg-amber-100 text-amber-700',
  incomplete: 'bg-blue-100 text-blue-700',
  absent: 'bg-red-100 text-red-600',
  weekend: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS_AR: Record<string, string> = {
  normal: 'منتظم',
  late: 'متأخر',
  incomplete: 'غير مكتمل',
  absent: 'غائب',
  weekend: 'عطلة',
};


/** Sanitize a cell value to prevent CSV injection */
function csvSafe(val: string | number | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
  return s;
}

function downloadCSV(rows: HrAttendanceRecord[]) {
  const header = 'Date,Employee,Check In,Check Out,Total Min,Break Min,Net Work Min,Late Min,Overtime Min,Status\n';
  const body = rows.map(r =>
    `${csvSafe(r.workDate)},"${csvSafe(r.employeeName)}",${r.checkIn ? new Date(r.checkIn).toISOString() : ''},${r.checkOut ? new Date(r.checkOut).toISOString() : ''},${csvSafe(r.totalMinutes)},${csvSafe(r.totalBreakMinutes || 0)},${csvSafe(r.netWorkMinutes || r.totalMinutes)},${csvSafe(r.lateMinutes)},${csvSafe(r.overtimeMinutes)},${csvSafe(r.status)}`
  ).join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const EVENT_ICONS: Record<string, string> = {
  check_in: 'fa-right-to-bracket text-emerald-500',
  break_out: 'fa-mug-hot text-amber-500',
  break_in: 'fa-play text-blue-500',
  check_out: 'fa-right-from-bracket text-rose-500',
};

const EVENT_LABELS: Record<string, string> = {
  check_in: 'Check In',
  break_out: 'Break Start',
  break_in: 'Break End',
  check_out: 'Check Out',
};

const EVENT_LABELS_AR: Record<string, string> = {
  check_in: 'تسجيل دخول',
  break_out: 'بداية استراحة',
  break_in: 'نهاية استراحة',
  check_out: 'تسجيل خروج',
};

const HrAttendanceView: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [records, setRecords] = useState<HrAttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<Record<number, HrAttendanceEvent[]>>({});

  // Filters
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(weekAgo);
  const [toDate, setToDate] = useState(today);
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, emps] = await Promise.all([
        hrAttendanceService.getAll({
          from: fromDate,
          to: toDate,
          employee_id: filterEmployee ? parseInt(filterEmployee) : undefined,
          status: filterStatus || undefined,
        }),
        hrEmployeesService.getAll(),
      ]);
      setRecords(recs);
      setEmployees(emps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, filterEmployee, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTimeline = async (record: HrAttendanceRecord) => {
    if (expandedRow === record.id) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(record.id);
    if (!timelineEvents[record.id]) {
      try {
        const events = await hrAttendanceService.getTimeline(record.employeeId, record.workDate);
        setTimelineEvents(prev => ({ ...prev, [record.id]: events }));
      } catch (err) {
        console.error('Failed to load timeline', err);
        setTimelineEvents(prev => ({ ...prev, [record.id]: [] }));
      }
    }
  };

  // Stats
  const totalRecords = records.length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const incompleteCount = records.filter(r => r.status === 'incomplete').length;
  const avgMinutes = totalRecords > 0 ? Math.round(records.reduce((s, r) => s + (r.totalMinutes || 0), 0) / totalRecords) : 0;
  const totalBreakMins = records.reduce((s, r) => s + (r.totalBreakMinutes || 0), 0);

  return (
    <Layout title={isAr ? 'سجل الحضور - HR' : 'HR Attendance'}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-slate-800">{totalRecords}</div>
          <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'سجلات' : 'Records'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-amber-600">{lateCount}</div>
          <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'متأخر' : 'Late'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-blue-600">{incompleteCount}</div>
          <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'غير مكتمل' : 'Incomplete'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-slate-800">{fmtMinutes(avgMinutes)}</div>
          <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'متوسط العمل' : 'Avg Work'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-orange-500">{fmtMinutes(totalBreakMins)}</div>
          <div className="text-xs font-bold uppercase text-slate-400">{isAr ? 'استراحات' : 'Total Breaks'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'من' : 'From'}</label>
            <input type="date" className="p-2.5 rounded-xl border border-gray-200 outline-none text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'إلى' : 'To'}</label>
            <input type="date" className="p-2.5 rounded-xl border border-gray-200 outline-none text-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'الموظف' : 'Employee'}</label>
            <select className="p-2.5 rounded-xl border border-gray-200 outline-none text-sm min-w-[150px]" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
              <option value="">{isAr ? 'الكل' : 'All'}</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isAr ? 'الحالة' : 'Status'}</label>
            <select className="p-2.5 rounded-xl border border-gray-200 outline-none text-sm min-w-[120px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{isAr ? 'الكل' : 'All'}</option>
              <option value="normal">{isAr ? 'منتظم' : 'Normal'}</option>
              <option value="late">{isAr ? 'متأخر' : 'Late'}</option>
              <option value="incomplete">{isAr ? 'غير مكتمل' : 'Incomplete'}</option>
              <option value="weekend">{isAr ? 'عطلة' : 'Weekend'}</option>
            </select>
          </div>
          <button onClick={() => downloadCSV(records)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 ms-auto">
            <i className="fa-solid fa-download"></i> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i>
            <p className="font-bold">{isAr ? 'لا توجد سجلات' : 'No records found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-start">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'دخول' : 'In'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'خروج' : 'Out'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'المجموع' : 'Total'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'استراحة' : 'Break'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'صافي' : 'Net'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'تأخير' : 'Late'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'إضافي' : 'OT'}</th>
                  <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => toggleTimeline(r)}>
                      <td className="px-4 py-3 text-slate-700 font-medium">{fmtDate(r.workDate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{r.employeeName}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{fmtTime(r.checkIn)}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{fmtTime(r.checkOut)}</td>
                      <td className="px-4 py-3 text-center font-bold">{fmtMinutes(r.totalMinutes)}</td>
                      <td className="px-4 py-3 text-center">
                        {(r.totalBreakMinutes || 0) > 0 ? <span className="text-orange-500 font-bold">{r.totalBreakMinutes}m</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-600">
                        {fmtMinutes(r.netWorkMinutes ?? r.totalMinutes)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.lateMinutes > 0 ? <span className="text-amber-600 font-bold">{r.lateMinutes}m</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.overtimeMinutes > 0 ? <span className="text-indigo-600 font-bold">{r.overtimeMinutes}m</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`}>
                          {isAr ? (STATUS_LABELS_AR[r.status] || r.status) : r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <i className={`fa-solid fa-chevron-${expandedRow === r.id ? 'up' : 'down'} text-slate-400 text-xs`}></i>
                      </td>
                    </tr>
                    {expandedRow === r.id && (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 bg-slate-50/80">
                          <div className="text-xs font-bold uppercase text-slate-400 mb-3">
                            <i className="fa-solid fa-timeline me-1"></i>
                            {isAr ? 'الجدول الزمني' : 'Timeline'}
                          </div>
                          {!timelineEvents[r.id] ? (
                            <div className="text-center text-slate-400 py-2">
                              <i className="fa-solid fa-circle-notch fa-spin"></i>
                            </div>
                          ) : timelineEvents[r.id].length === 0 ? (
                            <div className="text-center text-slate-400 py-2 text-sm">
                              {isAr ? 'لا توجد أحداث مفصلة' : 'No detailed events'}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-4">
                              {timelineEvents[r.id].map((evt, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
                                  <i className={`fa-solid ${EVENT_ICONS[evt.eventType] || 'fa-circle text-slate-400'}`}></i>
                                  <div>
                                    <div className="text-xs font-bold text-slate-700">
                                      {isAr ? EVENT_LABELS_AR[evt.eventType] : EVENT_LABELS[evt.eventType]}
                                    </div>
                                    <div className="text-xs font-mono text-slate-500">{fmtTime(evt.eventTime)}</div>
                                  </div>
                                  {idx < timelineEvents[r.id].length - 1 && (
                                    <i className="fa-solid fa-arrow-right text-slate-300 text-[10px] ms-1"></i>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HrAttendanceView;
