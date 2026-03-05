
import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { AudiogramResult, AudiogramFrequencyData, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const emptyFreq = (): AudiogramFrequencyData => ({ hz250: undefined, hz500: undefined, hz1000: undefined, hz2000: undefined, hz4000: undefined, hz8000: undefined });

const frequencies = ['hz250', 'hz500', 'hz1000', 'hz2000', 'hz4000', 'hz8000'] as const;
const freqLabels: Record<string, string> = { hz250: '250', hz500: '500', hz1000: '1000', hz2000: '2000', hz4000: '4000', hz8000: '8000' };

const hearingLevels = [
  { value: 'normal', label: 'طبيعي', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'mild', label: 'خفيف', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'moderate', label: 'متوسط', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'moderately_severe', label: 'متوسط لشديد', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'severe', label: 'شديد', color: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' },
  { value: 'profound', label: 'عميق', color: 'bg-red-300 text-red-900 dark:bg-red-900/70 dark:text-red-100' },
];

const tympTypes = ['A', 'As', 'Ad', 'B', 'C'] as const;

const AudiogramFormView: React.FC = () => {
  const { client } = useClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    testDate: Date.now(),
    rightEarAC: emptyFreq(), leftEarAC: emptyFreq(),
    rightEarBC: emptyFreq(), leftEarBC: emptyFreq(),
    rightSRT: undefined as number | undefined, leftSRT: undefined as number | undefined,
    rightSDS: undefined as number | undefined, leftSDS: undefined as number | undefined,
    rightTympanogram: '' as string, leftTympanogram: '' as string,
    rightCompliance: undefined as number | undefined, leftCompliance: undefined as number | undefined,
    rightPressure: undefined as number | undefined, leftPressure: undefined as number | undefined,
    rightAcousticReflex: false, leftAcousticReflex: false,
    rightOAE: '' as string, leftOAE: '' as string,
    rightHearingLevel: 'normal' as string, leftHearingLevel: 'normal' as string,
    hearingLossType: '' as string,
    recommendation: '', needsHearingAid: false, notes: '',
  });

  useEffect(() => {
    api.get('/patients').then(setPatients).catch(console.error);
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm)
  );
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const updateFreq = (ear: 'rightEarAC' | 'leftEarAC' | 'rightEarBC' | 'leftEarBC', freq: string, value: string) => {
    setForm(f => ({
      ...f,
      [ear]: { ...f[ear], [freq]: value === '' ? undefined : Number(value) }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) return alert('يرجى اختيار المريض');
    setSaving(true);
    try {
      await api.post('/ent-forms/audiogram', {
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

  const FrequencyTable = ({ title, rightKey, leftKey, color }: { title: string; rightKey: 'rightEarAC' | 'rightEarBC'; leftKey: 'leftEarAC' | 'leftEarBC'; color: string }) => (
    <div className="overflow-x-auto">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700">
            <th className="p-2 text-right">التردد (Hz)</th>
            {frequencies.map(f => <th key={f} className="p-2 text-center">{freqLabels[f]}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b dark:border-slate-600">
            <td className="p-2 font-medium text-red-600">أذن يمنى <span className="text-xs">(O)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={form[rightKey][f] ?? ''} onChange={e => updateFreq(rightKey, f, e.target.value)}
                  className="w-16 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-red-50 dark:bg-red-900/10 text-slate-800 dark:text-white" min="-10" max="120" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium text-blue-600">أذن يسرى <span className="text-xs">(X)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={form[leftKey][f] ?? ''} onChange={e => updateFreq(leftKey, f, e.target.value)}
                  className="w-16 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/10 text-slate-800 dark:text-white" min="-10" max="120" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir="rtl">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-ear-listen text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">فحص السمع - Audiogram</h1>
                <p className="text-slate-500 dark:text-slate-400">Audiological Assessment - ENT Department</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-violet-500"></i> اختيار المريض
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
              <div className="mt-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                <p className="font-bold text-violet-800 dark:text-violet-300">{selectedPatient.name}</p>
                <p className="text-sm text-violet-600 dark:text-violet-400">{selectedPatient.phone} | العمر: {selectedPatient.age}</p>
              </div>
            )}
          </div>

          {/* Pure Tone Audiometry - Air Conduction */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wave-square text-violet-500"></i> قياس السمع بالنغمة الصافية
            </h2>
            <div className="space-y-6">
              <FrequencyTable title="التوصيل الهوائي (Air Conduction)" rightKey="rightEarAC" leftKey="leftEarAC" color="violet" />
              <FrequencyTable title="التوصيل العظمي (Bone Conduction)" rightKey="rightEarBC" leftKey="leftEarBC" color="indigo" />
            </div>
          </div>

          {/* Speech Audiometry */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-microphone text-pink-500"></i> قياس السمع الكلامي (Speech Audiometry)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-red-600 mb-1">SRT يمنى (dB)</label>
                <input type="number" value={form.rightSRT ?? ''} onChange={e => setForm(f => ({ ...f, rightSRT: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-center" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">SRT يسرى (dB)</label>
                <input type="number" value={form.leftSRT ?? ''} onChange={e => setForm(f => ({ ...f, leftSRT: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 text-center" />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-600 mb-1">SDS يمنى (%)</label>
                <input type="number" value={form.rightSDS ?? ''} onChange={e => setForm(f => ({ ...f, rightSDS: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-center" min="0" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-600 mb-1">SDS يسرى (%)</label>
                <input type="number" value={form.leftSDS ?? ''} onChange={e => setForm(f => ({ ...f, leftSDS: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 text-center" min="0" max="100" />
              </div>
            </div>
          </div>

          {/* Tympanometry */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-area text-blue-500"></i> قياس طبلية الأذن (Tympanometry)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Ear */}
              <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-300 mb-3">أذن يمنى</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">النوع</label>
                    <div className="flex gap-2">{tympTypes.map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, rightTympanogram: t }))}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${form.rightTympanogram === t ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700'}`}>{t}</button>
                    ))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Compliance (ml)</label>
                      <input type="number" step="0.1" value={form.rightCompliance ?? ''} onChange={e => setForm(f => ({ ...f, rightCompliance: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full p-2 rounded-lg border text-center text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Pressure (daPa)</label>
                      <input type="number" value={form.rightPressure ?? ''} onChange={e => setForm(f => ({ ...f, rightPressure: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full p-2 rounded-lg border text-center text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.rightAcousticReflex} onChange={e => setForm(f => ({ ...f, rightAcousticReflex: e.target.checked }))} />
                    منعكس سمعي موجود
                  </label>
                </div>
              </div>
              {/* Left Ear */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-3">أذن يسرى</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">النوع</label>
                    <div className="flex gap-2">{tympTypes.map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, leftTympanogram: t }))}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${form.leftTympanogram === t ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700'}`}>{t}</button>
                    ))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Compliance (ml)</label>
                      <input type="number" step="0.1" value={form.leftCompliance ?? ''} onChange={e => setForm(f => ({ ...f, leftCompliance: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full p-2 rounded-lg border text-center text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Pressure (daPa)</label>
                      <input type="number" value={form.leftPressure ?? ''} onChange={e => setForm(f => ({ ...f, leftPressure: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full p-2 rounded-lg border text-center text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.leftAcousticReflex} onChange={e => setForm(f => ({ ...f, leftAcousticReflex: e.target.checked }))} />
                    منعكس سمعي موجود
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* OAE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-signal text-sky-500"></i> الانبعاث السمعي (OAE)
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">أذن يمنى</label>
                <div className="flex gap-3">
                  {['pass', 'refer'].map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, rightOAE: v }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${form.rightOAE === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {v === 'pass' ? 'Pass ✓' : 'Refer ✗'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-600 mb-2">أذن يسرى</label>
                <div className="flex gap-3">
                  {['pass', 'refer'].map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, leftOAE: v }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${form.leftOAE === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {v === 'pass' ? 'Pass ✓' : 'Refer ✗'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Classification & Recommendation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-check text-green-500"></i> التصنيف والتوصيات
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">مستوى السمع - يمنى</label>
                  <div className="grid grid-cols-2 gap-2">
                    {hearingLevels.map(h => (
                      <button key={h.value} onClick={() => setForm(f => ({ ...f, rightHearingLevel: h.value }))}
                        className={`p-2 rounded-xl text-xs font-medium border-2 transition ${form.rightHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-600 mb-2">مستوى السمع - يسرى</label>
                  <div className="grid grid-cols-2 gap-2">
                    {hearingLevels.map(h => (
                      <button key={h.value} onClick={() => setForm(f => ({ ...f, leftHearingLevel: h.value }))}
                        className={`p-2 rounded-xl text-xs font-medium border-2 transition ${form.leftHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع ضعف السمع</label>
                <div className="flex gap-3 flex-wrap">
                  {[['conductive', 'توصيلي'], ['sensorineural', 'حسي عصبي'], ['mixed', 'مختلط']].map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, hearingLossType: val }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.hearingLossType === val ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.needsHearingAid} onChange={e => setForm(f => ({ ...f, needsHearingAid: e.target.checked }))}
                  className="w-5 h-5 rounded" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">يحتاج سماعة طبية</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التوصيات</label>
                <textarea value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
                  rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                : <><i className="fa-solid fa-save ml-2"></i> حفظ نتيجة فحص السمع</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AudiogramFormView;
