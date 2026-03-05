
import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { BalanceAssessmentForm, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const BalanceAssessmentView: React.FC = () => {
  const { client } = useClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    testDate: Date.now(),
    vertigoType: 'rotational' as string,
    vertigoDuration: '',
    vertigoFrequency: '',
    triggeredBy: '',
    associatedSymptoms: {
      nausea: false, vomiting: false, hearingLoss: false,
      tinnitus: false, headache: false, visualDisturbance: false, fallHistory: false,
    },
    saccadeTest: '' as string, saccadeNotes: '',
    smoothPursuitTest: '' as string, smoothPursuitNotes: '',
    gazeTest: '' as string, gazeNotes: '',
    dixHallpikeRight: '' as string, dixHallpikeLeft: '' as string,
    nystagmusDirection: '',
    caloricRight: '' as string, caloricLeft: '' as string,
    caloricAsymmetry: undefined as number | undefined,
    bppvDiagnosis: false,
    bppvCanal: '' as string, bppvSide: '' as string,
    epleyPerformed: false,
    diagnosis: '',
    vestibularFunction: 'normal' as string,
    recommendation: '', notes: '',
  });

  useEffect(() => {
    api.get('/patients').then(setPatients).catch(console.error);
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm)
  );
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const toggleAssociated = (key: string) => {
    setForm(f => ({
      ...f,
      associatedSymptoms: { ...f.associatedSymptoms, [key]: !f.associatedSymptoms[key as keyof typeof f.associatedSymptoms] }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) return alert('يرجى اختيار المريض');
    if (!form.diagnosis) return alert('يرجى إدخال التشخيص');
    setSaving(true);
    try {
      await api.post('/ent-forms/balance-assessment', {
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

  const associatedLabels: Record<string, string> = {
    nausea: 'غثيان', vomiting: 'تقيؤ', hearingLoss: 'ضعف سمع',
    tinnitus: 'طنين', headache: 'صداع', visualDisturbance: 'اضطراب بصري', fallHistory: 'تاريخ سقوط',
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir="rtl">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-compass text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">فحص التوازن - VNG/BPPV</h1>
                <p className="text-slate-500 dark:text-slate-400">Balance Assessment - Vestibular Function Test</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-amber-500"></i> اختيار المريض
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
              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="font-bold text-amber-800 dark:text-amber-300">{selectedPatient.name}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{selectedPatient.phone} | العمر: {selectedPatient.age}</p>
              </div>
            )}
          </div>

          {/* Vertigo Assessment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-notch text-red-500"></i> تقييم الدوخة / الدوار
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع الدوار</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([['rotational', 'دوراني'], ['positional', 'وضعي'], ['constant', 'مستمر'], ['episodic', 'نوبات']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, vertigoType: val }))}
                      className={`p-2 rounded-xl text-sm font-medium transition ${form.vertigoType === val ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مدة النوبة</label>
                  <input type="text" value={form.vertigoDuration} onChange={e => setForm(f => ({ ...f, vertigoDuration: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="ثواني، دقائق، ساعات..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تكرار النوبات</label>
                  <input type="text" value={form.vertigoFrequency} onChange={e => setForm(f => ({ ...f, vertigoFrequency: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="يومياً، أسبوعياً..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المحفزات</label>
                  <input type="text" value={form.triggeredBy} onChange={e => setForm(f => ({ ...f, triggeredBy: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="حركة الرأس، الوقوف..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">أعراض مصاحبة</label>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(associatedLabels).map(([key, label]) => (
                    <button key={key} onClick={() => toggleAssociated(key)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                        form.associatedSymptoms[key as keyof typeof form.associatedSymptoms] 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-2 border-red-300' 
                          : 'bg-slate-100 dark:bg-slate-700 border border-slate-200'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VNG Tests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-eye text-amber-500"></i> فحوصات VNG
            </h2>
            <div className="space-y-4">
              {/* Saccade */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Saccade Test</span>
                  <div className="flex gap-2">
                    {['normal', 'abnormal'].map(v => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, saccadeTest: v }))}
                        className={`px-3 py-1 rounded-lg text-sm ${form.saccadeTest === v ? (v === 'normal' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-white dark:bg-slate-600'}`}>
                        {v === 'normal' ? 'طبيعي' : 'غير طبيعي'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.saccadeTest === 'abnormal' && (
                  <input type="text" value={form.saccadeNotes} onChange={e => setForm(f => ({ ...f, saccadeNotes: e.target.value }))}
                    className="w-full p-2 rounded-lg border text-sm mt-1" placeholder="ملاحظات..." />
                )}
              </div>
              {/* Smooth Pursuit */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Smooth Pursuit</span>
                  <div className="flex gap-2">
                    {['normal', 'abnormal'].map(v => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, smoothPursuitTest: v }))}
                        className={`px-3 py-1 rounded-lg text-sm ${form.smoothPursuitTest === v ? (v === 'normal' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-white dark:bg-slate-600'}`}>
                        {v === 'normal' ? 'طبيعي' : 'غير طبيعي'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.smoothPursuitTest === 'abnormal' && (
                  <input type="text" value={form.smoothPursuitNotes} onChange={e => setForm(f => ({ ...f, smoothPursuitNotes: e.target.value }))}
                    className="w-full p-2 rounded-lg border text-sm mt-1" placeholder="ملاحظات..." />
                )}
              </div>
              {/* Gaze */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Gaze Test</span>
                  <div className="flex gap-2">
                    {[['normal', 'طبيعي'], ['abnormal', 'غير طبيعي'], ['nystagmus_present', 'رأرأة']].map(([v, label]) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, gazeTest: v }))}
                        className={`px-3 py-1 rounded-lg text-sm ${form.gazeTest === v ? (v === 'normal' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-white dark:bg-slate-600'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.gazeTest && form.gazeTest !== 'normal' && (
                  <input type="text" value={form.gazeNotes} onChange={e => setForm(f => ({ ...f, gazeNotes: e.target.value }))}
                    className="w-full p-2 rounded-lg border text-sm mt-1" placeholder="ملاحظات..." />
                )}
              </div>
            </div>
          </div>

          {/* Dix-Hallpike & Caloric */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-vial text-purple-500"></i> Dix-Hallpike & Caloric Test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dix-Hallpike */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Dix-Hallpike</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-16">يمين:</span>
                  <div className="flex gap-2">
                    {['positive', 'negative'].map(v => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, dixHallpikeRight: v }))}
                        className={`px-3 py-1 rounded-lg text-sm ${form.dixHallpikeRight === v ? (v === 'positive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {v === 'positive' ? 'إيجابي' : 'سلبي'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-16">يسار:</span>
                  <div className="flex gap-2">
                    {['positive', 'negative'].map(v => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, dixHallpikeLeft: v }))}
                        className={`px-3 py-1 rounded-lg text-sm ${form.dixHallpikeLeft === v ? (v === 'positive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {v === 'positive' ? 'إيجابي' : 'سلبي'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1">اتجاه الرأرأة</label>
                  <input type="text" value={form.nystagmusDirection} onChange={e => setForm(f => ({ ...f, nystagmusDirection: e.target.value }))}
                    className="w-full p-2 rounded-lg border text-sm" />
                </div>
              </div>
              {/* Caloric */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Caloric Test</h3>
                {['Right', 'Left'].map(side => (
                  <div key={side} className="flex items-center gap-3">
                    <span className="text-sm w-16">{side === 'Right' ? 'يمين:' : 'يسار:'}</span>
                    <div className="flex gap-1 flex-wrap">
                      {['normal', 'hypoactive', 'hyperactive', 'areflexic'].map(v => (
                        <button key={v} onClick={() => setForm(f => ({ ...f, [`caloric${side}`]: v }))}
                          className={`px-2 py-1 rounded-lg text-xs ${form[`caloric${side}` as keyof typeof form] === v ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          {{ normal: 'طبيعي', hypoactive: 'خامل', hyperactive: 'مفرط', areflexic: 'لا استجابة' }[v]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1">عدم التماثل (%)</label>
                  <input type="number" value={form.caloricAsymmetry ?? ''} onChange={e => setForm(f => ({ ...f, caloricAsymmetry: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full p-2 rounded-lg border text-sm text-center" min="0" max="100" />
                </div>
              </div>
            </div>
          </div>

          {/* BPPV */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-person-falling text-orange-500"></i> تقييم BPPV
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.bppvDiagnosis} onChange={e => setForm(f => ({ ...f, bppvDiagnosis: e.target.checked }))}
                  className="w-5 h-5 rounded text-orange-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">تشخيص BPPV</span>
              </label>
              {form.bppvDiagnosis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1">القناة المصابة</label>
                    <div className="flex gap-2">
                      {[['posterior', 'خلفية'], ['horizontal', 'أفقية'], ['anterior', 'أمامية']].map(([val, label]) => (
                        <button key={val} onClick={() => setForm(f => ({ ...f, bppvCanal: val }))}
                          className={`px-3 py-1 rounded-lg text-sm ${form.bppvCanal === val ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">الجهة</label>
                    <div className="flex gap-2">
                      {[['right', 'يمين'], ['left', 'يسار'], ['bilateral', 'كلاهما']].map(([val, label]) => (
                        <button key={val} onClick={() => setForm(f => ({ ...f, bppvSide: val }))}
                          className={`px-3 py-1 rounded-lg text-sm ${form.bppvSide === val ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input type="checkbox" checked={form.epleyPerformed} onChange={e => setForm(f => ({ ...f, epleyPerformed: e.target.checked }))}
                        className="w-5 h-5 rounded" />
                      <span className="text-sm">تم إجراء Epley Maneuver</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis & Recommendation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-check text-green-500"></i> التشخيص والتوصيات
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">وظيفة الجهاز الدهليزي</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[['normal', 'طبيعي'], ['unilateral_weakness', 'ضعف أحادي'], ['bilateral_weakness', 'ضعف ثنائي'], ['central', 'مركزي']].map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, vestibularFunction: val }))}
                      className={`p-2 rounded-xl text-sm font-medium transition ${form.vestibularFunction === val ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التشخيص *</label>
                <textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التوصيات</label>
                <textarea value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                : <><i className="fa-solid fa-save ml-2"></i> حفظ نتيجة فحص التوازن</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BalanceAssessmentView;
