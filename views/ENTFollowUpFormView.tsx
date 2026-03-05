
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { ENTFollowUpForm, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const ENTFollowUpFormView: React.FC = () => {
  const { user } = useAuth();
  const { client } = useClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState<Omit<ENTFollowUpForm, 'id' | 'patientId' | 'visitId' | 'clientId' | 'createdAt'>>({
    followUpReason: '',
    previousDiagnosis: '',
    treatmentCompliance: 'full',
    treatmentComplianceNotes: '',
    symptomChange: 'same',
    currentSymptoms: '',
    newSymptoms: '',
    medicationEffectiveness: 'effective',
    sideEffects: false,
    sideEffectsDetails: '',
    isSurgicalFollowUp: false,
    surgeryDate: '',
    surgeryType: '',
    healingAssessment: 'good',
    complications: '',
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
    if (!form.followUpReason) return alert('يرجى إدخال سبب المراجعة');
    
    setSaving(true);
    try {
      await api.post('/ent-forms/follow-up', {
        ...form,
        patientId: selectedPatientId,
        clientId: client?.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm({
        followUpReason: '', previousDiagnosis: '', treatmentCompliance: 'full',
        treatmentComplianceNotes: '', symptomChange: 'same', currentSymptoms: '',
        newSymptoms: '', medicationEffectiveness: 'effective', sideEffects: false,
        sideEffectsDetails: '', isSurgicalFollowUp: false, surgeryDate: '',
        surgeryType: '', healingAssessment: 'good', complications: '', notes: '',
      });
      setSelectedPatientId('');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir="rtl">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-rotate text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">استبيان مراجعة</h1>
                <p className="text-slate-500 dark:text-slate-400">Follow-up Questionnaire - ENT Department</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-emerald-500"></i> اختيار المريض
            </h2>
            <input type="text" placeholder="ابحث بالاسم أو رقم الهاتف..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white mb-3" />
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPatients.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }}
                    className={`w-full text-right p-3 rounded-xl transition ${selectedPatientId === p.id ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-slate-500 mr-3">{p.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">{selectedPatient.name}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{selectedPatient.phone} | عدد الزيارات السابقة: {selectedPatient.history?.length || 0}</p>
              </div>
            )}
          </div>

          {/* Follow-up Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-stethoscope text-emerald-500"></i> معلومات المراجعة
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سبب المراجعة *</label>
                <textarea value={form.followUpReason} onChange={e => setForm(f => ({ ...f, followUpReason: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التشخيص السابق</label>
                <input type="text" value={form.previousDiagnosis} onChange={e => setForm(f => ({ ...f, previousDiagnosis: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Treatment Compliance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-pills text-blue-500"></i> الالتزام بالعلاج
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مدى الالتزام بالعلاج</label>
                <div className="flex gap-3 flex-wrap">
                  {([['full', 'التزام كامل'], ['partial', 'التزام جزئي'], ['none', 'لم يلتزم']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, treatmentCompliance: val }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.treatmentCompliance === val ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {form.treatmentCompliance !== 'full' && (
                <textarea value={form.treatmentComplianceNotes} onChange={e => setForm(f => ({ ...f, treatmentComplianceNotes: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="سبب عدم الالتزام..." />
              )}
            </div>
          </div>

          {/* Symptom Assessment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-amber-500"></i> تقييم الأعراض
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تغير الأعراض</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([['improved', 'تحسن', 'text-green-600 bg-green-100 dark:bg-green-900/30'], 
                      ['same', 'كما هو', 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'], 
                      ['worsened', 'ساء', 'text-red-600 bg-red-100 dark:bg-red-900/30'],
                      ['new_symptoms', 'أعراض جديدة', 'text-purple-600 bg-purple-100 dark:bg-purple-900/30']] as const).map(([val, label, colors]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, symptomChange: val }))}
                      className={`p-3 rounded-xl text-sm font-medium transition border-2 ${form.symptomChange === val ? colors + ' border-current' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأعراض الحالية</label>
                <textarea value={form.currentSymptoms} onChange={e => setForm(f => ({ ...f, currentSymptoms: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              {form.symptomChange === 'new_symptoms' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الأعراض الجديدة</label>
                  <textarea value={form.newSymptoms} onChange={e => setForm(f => ({ ...f, newSymptoms: e.target.value }))}
                    rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Medication Effectiveness */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-capsules text-blue-500"></i> فعالية الأدوية
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                {([['effective', 'فعّالة'], ['partially', 'فعالة جزئياً'], ['not_effective', 'غير فعالة']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, medicationEffectiveness: val }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.medicationEffectiveness === val ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.sideEffects} onChange={e => setForm(f => ({ ...f, sideEffects: e.target.checked }))}
                    className="w-5 h-5 rounded text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-300">هل يوجد أعراض جانبية؟</span>
                </label>
              </div>
              {form.sideEffects && (
                <textarea value={form.sideEffectsDetails} onChange={e => setForm(f => ({ ...f, sideEffectsDetails: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="تفاصيل الأعراض الجانبية..." />
              )}
            </div>
          </div>

          {/* Surgical Follow-up */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-scalpel text-rose-500"></i> متابعة جراحية
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isSurgicalFollowUp} onChange={e => setForm(f => ({ ...f, isSurgicalFollowUp: e.target.checked }))}
                  className="w-5 h-5 rounded text-rose-500" />
                <span className="text-slate-700 dark:text-slate-300">هل هذه مراجعة بعد عملية جراحية؟</span>
              </label>
              {form.isSurgicalFollowUp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ العملية</label>
                    <input type="date" value={form.surgeryDate} onChange={e => setForm(f => ({ ...f, surgeryDate: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع العملية</label>
                    <input type="text" value={form.surgeryType} onChange={e => setForm(f => ({ ...f, surgeryType: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تقييم الشفاء</label>
                    <div className="flex gap-3">
                      {([['good', 'جيد'], ['moderate', 'متوسط'], ['poor', 'ضعيف']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setForm(f => ({ ...f, healingAssessment: val }))}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.healingAssessment === val ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مضاعفات</label>
                    <input type="text" value={form.complications} onChange={e => setForm(f => ({ ...f, complications: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Submit */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-note-sticky text-green-500"></i> ملاحظات
            </h2>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
          </div>

          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-blue-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                : <><i className="fa-solid fa-save ml-2"></i> حفظ استبيان المراجعة</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ENTFollowUpFormView;
