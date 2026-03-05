
import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { ReferralForm, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const ReferralFormView: React.FC = () => {
  const { client } = useClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    referringDoctorName: 'Dr. Tarek Khrais',
    referringClinic: 'عيادة الدكتور طارق خريس - أنف أذن حنجرة',
    referringDoctorPhone: '0790904030',
    referredToDoctorName: '',
    referredToSpecialty: '',
    referredToClinic: '',
    referredToHospital: '',
    diagnosis: '',
    reasonForReferral: '',
    clinicalSummary: '',
    relevantFindings: '',
    currentMedications: '',
    attachedReports: [] as string[],
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
    notes: '',
  });

  useEffect(() => {
    api.get('/patients').then(setPatients).catch(console.error);
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm)
  );
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSubmit = async () => {
    if (!selectedPatientId) return alert('يرجى اختيار المريض');
    if (!form.diagnosis) return alert('يرجى إدخال التشخيص');
    if (!form.reasonForReferral) return alert('يرجى إدخال سبب التحويل');
    if (!form.referredToSpecialty) return alert('يرجى تحديد التخصص المحول إليه');

    setSaving(true);
    try {
      await api.post('/ent-forms/referral', {
        ...form,
        patientId: selectedPatientId,
        clientId: client?.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!selectedPatient) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>نموذج تحويل - ${selectedPatient.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #1e293b; }
          .header { text-align: center; border-bottom: 3px double #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin: 0; color: #0369a1; }
          .header p { color: #64748b; margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .section h3 { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 14px; color: #334155; margin-bottom: 10px; }
          .field { display: flex; margin-bottom: 8px; }
          .field-label { font-weight: bold; min-width: 150px; color: #475569; }
          .field-value { flex: 1; border-bottom: 1px dotted #cbd5e1; padding-bottom: 2px; }
          .urgency { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .urgency-routine { background: #dcfce7; color: #166534; }
          .urgency-urgent { background: #fef9c3; color: #854d0e; }
          .urgency-emergency { background: #fecaca; color: #991b1b; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature div { text-align: center; width: 200px; }
          .signature .line { border-top: 1px solid #334155; margin-top: 40px; padding-top: 5px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dr. Tarek Khrais - ENT Specialist</h1>
          <p>عيادة الدكتور طارق خريس - أخصائي أنف وأذن وحنجرة</p>
          <p>هاتف: 0790904030</p>
          <h2 style="margin-top: 15px; color: #0f172a;">نموذج تحويل طبي</h2>
          <p style="font-size: 12px;">التاريخ: ${new Date().toLocaleDateString('ar-JO')}</p>
        </div>

        <div class="section">
          <h3>بيانات المريض</h3>
          <div class="field"><span class="field-label">الاسم:</span><span class="field-value">${selectedPatient.name}</span></div>
          <div class="field"><span class="field-label">العمر:</span><span class="field-value">${selectedPatient.age} سنة</span></div>
          <div class="field"><span class="field-label">الجنس:</span><span class="field-value">${selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
          <div class="field"><span class="field-label">الهاتف:</span><span class="field-value">${selectedPatient.phone}</span></div>
        </div>

        <div class="section">
          <h3>محول إلى</h3>
          <div class="field"><span class="field-label">الطبيب:</span><span class="field-value">${form.referredToDoctorName || '-'}</span></div>
          <div class="field"><span class="field-label">التخصص:</span><span class="field-value">${form.referredToSpecialty}</span></div>
          <div class="field"><span class="field-label">العيادة/المستشفى:</span><span class="field-value">${form.referredToClinic || form.referredToHospital || '-'}</span></div>
        </div>

        <div class="section">
          <h3>المعلومات السريرية</h3>
          <div class="field"><span class="field-label">التشخيص:</span><span class="field-value">${form.diagnosis}</span></div>
          <div class="field"><span class="field-label">سبب التحويل:</span><span class="field-value">${form.reasonForReferral}</span></div>
          <div class="field"><span class="field-label">الملخص السريري:</span><span class="field-value">${form.clinicalSummary}</span></div>
          ${form.relevantFindings ? `<div class="field"><span class="field-label">نتائج ذات صلة:</span><span class="field-value">${form.relevantFindings}</span></div>` : ''}
          ${form.currentMedications ? `<div class="field"><span class="field-label">الأدوية الحالية:</span><span class="field-value">${form.currentMedications}</span></div>` : ''}
        </div>

        <div class="section">
          <h3>الأولوية</h3>
          <span class="urgency urgency-${form.urgency}">${{ routine: 'روتيني', urgent: 'عاجل', emergency: 'طوارئ' }[form.urgency]}</span>
        </div>

        ${form.notes ? `<div class="section"><h3>ملاحظات</h3><p>${form.notes}</p></div>` : ''}

        <div class="signature">
          <div>
            <div class="line">توقيع الطبيب المحوِل</div>
            <p style="font-size: 12px;">Dr. Tarek Khrais</p>
          </div>
          <div>
            <div class="line">الختم</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const specialties = [
    'طب عام', 'جراحة عامة', 'أعصاب', 'جراحة أعصاب', 'عيون', 'جلدية',
    'باطنية', 'قلب وأوعية', 'عظام', 'أطفال', 'نسائية وتوليد',
    'مسالك بولية', 'صدرية', 'أورام', 'تخدير', 'طوارئ',
    'أشعة', 'أمراض دم', 'جراحة تجميل', 'طب نفسي', 'أسنان',
    'علاج طبيعي', 'سمعيات', 'نطق وتخاطب', 'أخرى',
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir="rtl">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-share-from-square text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">نموذج تحويل طبي</h1>
                <p className="text-slate-500 dark:text-slate-400">Medical Referral Form - ENT Department</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-cyan-500"></i> اختيار المريض
            </h2>
            <input type="text" placeholder="ابحث بالاسم أو رقم الهاتف..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white mb-3" />
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPatients.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }}
                    className="w-full text-right p-3 rounded-xl transition hover:bg-slate-100 dark:hover:bg-slate-700">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-slate-500 mr-3">{p.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <p className="font-bold text-cyan-800 dark:text-cyan-300">{selectedPatient.name}</p>
                <p className="text-sm text-cyan-600 dark:text-cyan-400">{selectedPatient.phone} | {selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى'} | العمر: {selectedPatient.age}</p>
              </div>
            )}
          </div>

          {/* Referring Doctor (pre-filled) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user-doctor text-blue-500"></i> الطبيب المحوِل
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الطبيب</label>
                <input type="text" value={form.referringDoctorName} onChange={e => setForm(f => ({ ...f, referringDoctorName: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/10 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العيادة</label>
                <input type="text" value={form.referringClinic} onChange={e => setForm(f => ({ ...f, referringClinic: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/10 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الهاتف</label>
                <input type="text" value={form.referringDoctorPhone} onChange={e => setForm(f => ({ ...f, referringDoctorPhone: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/10 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Referred To */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-arrow-right text-green-500"></i> محول إلى
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الطبيب (اختياري)</label>
                  <input type="text" value={form.referredToDoctorName} onChange={e => setForm(f => ({ ...f, referredToDoctorName: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التخصص *</label>
                  <select value={form.referredToSpecialty} onChange={e => setForm(f => ({ ...f, referredToSpecialty: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                    <option value="">اختر التخصص...</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العيادة</label>
                  <input type="text" value={form.referredToClinic} onChange={e => setForm(f => ({ ...f, referredToClinic: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المستشفى</label>
                  <input type="text" value={form.referredToHospital} onChange={e => setForm(f => ({ ...f, referredToHospital: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-file-medical text-red-500"></i> المعلومات السريرية
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التشخيص *</label>
                <textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سبب التحويل *</label>
                <textarea value={form.reasonForReferral} onChange={e => setForm(f => ({ ...f, reasonForReferral: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الملخص السريري</label>
                <textarea value={form.clinicalSummary} onChange={e => setForm(f => ({ ...f, clinicalSummary: e.target.value }))}
                  rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نتائج ذات صلة</label>
                <textarea value={form.relevantFindings} onChange={e => setForm(f => ({ ...f, relevantFindings: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="نتائج الفحوصات، الأشعة، التحاليل..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأدوية الحالية</label>
                <textarea value={form.currentMedications} onChange={e => setForm(f => ({ ...f, currentMedications: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-gauge-high text-yellow-500"></i> الأولوية
            </h2>
            <div className="flex gap-4 flex-wrap">
              {([
                ['routine', 'روتيني', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300'],
                ['urgent', 'عاجل', 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300'],
                ['emergency', 'طوارئ', 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300'],
              ] as const).map(([val, label, colors]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, urgency: val }))}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition border-2 ${form.urgency === val ? colors : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-note-sticky text-green-500"></i> ملاحظات
            </h2>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pb-8 flex-wrap">
            <button onClick={handleSubmit} disabled={saving}
              className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                : <><i className="fa-solid fa-save ml-2"></i> حفظ نموذج التحويل</>}
            </button>
            <button onClick={handlePrint} disabled={!selectedPatient}
              className="px-10 py-4 bg-gradient-to-r from-slate-600 to-slate-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              <i className="fa-solid fa-print ml-2"></i> طباعة
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralFormView;
