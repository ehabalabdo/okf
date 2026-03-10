
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';
import { Patient, AudiogramFrequencyData } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

// ==================== Helpers ====================
const emptyFreq = (): AudiogramFrequencyData => ({ hz250: undefined, hz500: undefined, hz1000: undefined, hz2000: undefined, hz4000: undefined, hz8000: undefined });
const frequencies = ['hz250', 'hz500', 'hz1000', 'hz2000', 'hz4000', 'hz8000'] as const;
const freqLabels: Record<string, string> = { hz250: '250', hz500: '500', hz1000: '1000', hz2000: '2000', hz4000: '4000', hz8000: '8000' };
const hearingLevels = [
  { value: 'normal', label: 'طبيعي', color: 'bg-green-100 text-green-700' },
  { value: 'mild', label: 'خفيف', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'moderate', label: 'متوسط', color: 'bg-orange-100 text-orange-700' },
  { value: 'moderately_severe', label: 'متوسط لشديد', color: 'bg-red-100 text-red-700' },
  { value: 'severe', label: 'شديد', color: 'bg-red-200 text-red-800' },
  { value: 'profound', label: 'عميق', color: 'bg-red-300 text-red-900' },
];
const tympTypes = ['A', 'As', 'Ad', 'B', 'C'] as const;

type TestMode = 'audiogram' | 'balance';

const TechnicianView: React.FC = () => {
  const { user } = useAuth();
  const { client } = useClient();
  const { t } = useLanguage();

  // ========= State =========
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [testMode, setTestMode] = useState<TestMode>('audiogram');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Patient history
  const [patientHistory, setPatientHistory] = useState<{ audiograms: any[]; balanceAssessments: any[] }>({ audiograms: [], balanceAssessments: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // ==== Audiogram Form State ====
  const [audioForm, setAudioForm] = useState({
    rightEarAC: emptyFreq(), leftEarAC: emptyFreq(),
    rightEarBC: emptyFreq(), leftEarBC: emptyFreq(),
    rightSRT: undefined as number | undefined, leftSRT: undefined as number | undefined,
    rightSDS: undefined as number | undefined, leftSDS: undefined as number | undefined,
    rightTympanogram: '', leftTympanogram: '',
    rightCompliance: undefined as number | undefined, leftCompliance: undefined as number | undefined,
    rightPressure: undefined as number | undefined, leftPressure: undefined as number | undefined,
    rightAcousticReflex: false, leftAcousticReflex: false,
    rightOAE: '', leftOAE: '',
    rightHearingLevel: 'normal', leftHearingLevel: 'normal',
    hearingLossType: '', recommendation: '', needsHearingAid: false, notes: '',
  });

  // ==== Balance Form State ====
  const [balanceForm, setBalanceForm] = useState({
    vertigoType: 'rotational' as string, vertigoDuration: '', vertigoFrequency: '', triggeredBy: '',
    associatedSymptoms: { nausea: false, vomiting: false, hearingLoss: false, tinnitus: false, headache: false, visualDisturbance: false, fallHistory: false },
    saccadeTest: '', saccadeNotes: '', smoothPursuitTest: '', smoothPursuitNotes: '', gazeTest: '', gazeNotes: '',
    dixHallpikeRight: '', dixHallpikeLeft: '', nystagmusDirection: '',
    caloricRight: '', caloricLeft: '', caloricAsymmetry: undefined as number | undefined,
    bppvDiagnosis: false, bppvCanal: '', bppvSide: '', epleyPerformed: false,
    diagnosis: '', vestibularFunction: 'normal', recommendation: '', notes: '',
  });

  // ========= Effects =========
  useEffect(() => {
    api.get('/patients').then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadPatientHistory = useCallback(async (patientId: string) => {
    setHistoryLoading(true);
    try {
      const data = await api.get(`/ent-forms/patient/${patientId}/all`);
      setPatientHistory({
        audiograms: (data as any).audiograms || [],
        balanceAssessments: (data as any).balanceAssessments || [],
      });
    } catch { setPatientHistory({ audiograms: [], balanceAssessments: [] }); }
    setHistoryLoading(false);
  }, []);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setSearchTerm('');
    setSaved(false);
    loadPatientHistory(p.id);
    resetForms();
  };

  const resetForms = () => {
    setAudioForm({
      rightEarAC: emptyFreq(), leftEarAC: emptyFreq(), rightEarBC: emptyFreq(), leftEarBC: emptyFreq(),
      rightSRT: undefined, leftSRT: undefined, rightSDS: undefined, leftSDS: undefined,
      rightTympanogram: '', leftTympanogram: '', rightCompliance: undefined, leftCompliance: undefined,
      rightPressure: undefined, leftPressure: undefined, rightAcousticReflex: false, leftAcousticReflex: false,
      rightOAE: '', leftOAE: '', rightHearingLevel: 'normal', leftHearingLevel: 'normal',
      hearingLossType: '', recommendation: '', needsHearingAid: false, notes: '',
    });
    setBalanceForm({
      vertigoType: 'rotational', vertigoDuration: '', vertigoFrequency: '', triggeredBy: '',
      associatedSymptoms: { nausea: false, vomiting: false, hearingLoss: false, tinnitus: false, headache: false, visualDisturbance: false, fallHistory: false },
      saccadeTest: '', saccadeNotes: '', smoothPursuitTest: '', smoothPursuitNotes: '', gazeTest: '', gazeNotes: '',
      dixHallpikeRight: '', dixHallpikeLeft: '', nystagmusDirection: '',
      caloricRight: '', caloricLeft: '', caloricAsymmetry: undefined,
      bppvDiagnosis: false, bppvCanal: '', bppvSide: '', epleyPerformed: false,
      diagnosis: '', vestibularFunction: 'normal', recommendation: '', notes: '',
    });
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm)
  );

  // ========= Submit Handlers =========
  const handleSubmitAudiogram = async () => {
    if (!selectedPatient) return alert('يرجى اختيار المريض');
    setSaving(true);
    try {
      await api.post('/ent-forms/audiogram', {
        ...audioForm, testDate: Date.now(),
        patientId: selectedPatient.id, clientId: client?.id,
      });
      setSaved(true);
      loadPatientHistory(selectedPatient.id);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { alert(err.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  const handleSubmitBalance = async () => {
    if (!selectedPatient) return alert('يرجى اختيار المريض');
    if (!balanceForm.diagnosis) return alert('يرجى إدخال التشخيص');
    setSaving(true);
    try {
      await api.post('/ent-forms/balance-assessment', {
        ...balanceForm, testDate: Date.now(),
        patientId: selectedPatient.id, clientId: client?.id,
      });
      setSaved(true);
      loadPatientHistory(selectedPatient.id);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { alert(err.message || 'حدث خطأ'); }
    finally { setSaving(false); }
  };

  // Update frequency helper
  const updateFreq = (ear: 'rightEarAC' | 'leftEarAC' | 'rightEarBC' | 'leftEarBC', freq: string, value: string) => {
    setAudioForm(f => ({ ...f, [ear]: { ...f[ear], [freq]: value === '' ? undefined : Number(value) } }));
  };

  const toggleAssociated = (key: string) => {
    setBalanceForm(f => ({
      ...f,
      associatedSymptoms: { ...f.associatedSymptoms, [key]: !f.associatedSymptoms[key as keyof typeof f.associatedSymptoms] }
    }));
  };

  const associatedLabels: Record<string, string> = {
    nausea: 'غثيان', vomiting: 'تقيؤ', hearingLoss: 'ضعف سمع',
    tinnitus: 'طنين', headache: 'صداع', visualDisturbance: 'اضطراب بصري', fallHistory: 'تاريخ سقوط',
  };

  // ========= Frequency Table Component =========
  const FrequencyTable = ({ title, rightKey, leftKey }: { title: string; rightKey: 'rightEarAC' | 'rightEarBC'; leftKey: 'leftEarAC' | 'leftEarBC' }) => (
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
            <td className="p-2 font-medium text-red-600">يمنى <span className="text-xs">(O)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={audioForm[rightKey][f] ?? ''} onChange={e => updateFreq(rightKey, f, e.target.value)}
                  className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-red-50 dark:bg-red-900/10 text-slate-800 dark:text-white text-xs" min="-10" max="120" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium text-amber-600">يسرى <span className="text-xs">(X)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={audioForm[leftKey][f] ?? ''} onChange={e => updateFreq(leftKey, f, e.target.value)}
                  className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-amber-50 dark:bg-amber-900/10 text-slate-800 dark:text-white text-xs" min="-10" max="120" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // ==================== RENDER ====================
  return (
    <Layout title="فني الفحوصات" hideTitle>
      <div className="flex h-full overflow-hidden" dir="rtl">
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-ear-listen text-white text-xl"></i>
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">فني الفحوصات</h1>
                <p className="text-[10px] text-slate-500">{currentTime.toLocaleTimeString('ar-JO')}</p>
              </div>
            </div>

            {/* ENT Medical Forms Quick Access */}
            <div className="w-full max-w-2xl mt-8">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center"><i className="fa-solid fa-stethoscope"></i></div>
                <div className="text-right"><h2 className="font-bold text-slate-800 dark:text-white leading-tight">نماذج الأنف والأذن والحنجرة</h2><p className="text-[10px] text-slate-400 uppercase tracking-wide">ENT Medical Forms</p></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { path: 'ent/new-patient', icon: 'fa-file-medical', label: 'استبيان مريض جديد', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                  { path: 'ent/follow-up', icon: 'fa-file-lines', label: 'متابعة مريض', color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
                  { path: 'ent/audiogram', icon: 'fa-ear-listen', label: 'فحص السمع', color: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
                  { path: 'ent/balance', icon: 'fa-person-walking', label: 'فحص التوازن', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                  { path: 'ent/referral', icon: 'fa-share-from-square', label: 'تحويل طبي', color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' },
                ].map(item => {
                  const slug = client?.slug || localStorage.getItem('currentClientSlug') || '';
                  return (
                    <a key={item.path} href={`/${slug}/${item.path}`}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${item.color}`}>
                      <i className={`fa-solid ${item.icon} text-2xl`}></i>
                      <span className="text-xs font-bold">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TechnicianView;
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-ear-listen text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">فني الفحوصات</h2>
                <p className="text-[10px] text-slate-500">{currentTime.toLocaleTimeString('ar-JO')}</p>
              </div>
            </div>
            <input
              type="text" placeholder="بحث بالاسم أو الهاتف..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Patient List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredPatients.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-sm">
                <i className="fa-solid fa-users-slash text-3xl mb-2 opacity-30"></i>
                <p>لا يوجد مرضى</p>
              </div>
            ) : (
              filteredPatients.map(p => (
                <button key={p.id} onClick={() => handleSelectPatient(p)}
                  className={`w-full text-right px-4 py-3 border-b border-slate-100 dark:border-slate-700 transition-all flex items-center gap-3 ${
                    selectedPatient?.id === p.id
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-r-4 border-r-amber-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{p.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.phone} {p.age ? `• ${p.age} سنة` : ''}</p>
                  </div>
                  {p.currentVisit?.status === 'in_progress' && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ====== MAIN CONTENT ====== */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {!selectedPatient ? (
            /* No patient selected — show ENT form cards + prompt */
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <i className="fa-solid fa-ear-listen text-7xl opacity-10 mb-6 text-slate-300"></i>
              <p className="text-xl font-bold text-slate-400 mb-2">اختر مريض لبدء الفحص</p>
              <p className="text-sm text-slate-400 mb-8">ابحث عن المريض من القائمة على اليمين</p>

              {/* ENT Medical Forms Quick Access */}
              <div className="w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center"><i className="fa-solid fa-stethoscope"></i></div>
                  <div className="text-right"><h2 className="font-bold text-slate-800 dark:text-white leading-tight">نماذج الأنف والأذن والحنجرة</h2><p className="text-[10px] text-slate-400 uppercase tracking-wide">ENT Medical Forms</p></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { path: 'ent/new-patient', icon: 'fa-file-medical', label: 'استبيان مريض جديد', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                    { path: 'ent/follow-up', icon: 'fa-file-lines', label: 'متابعة مريض', color: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
                    { path: 'ent/audiogram', icon: 'fa-ear-listen', label: 'فحص السمع', color: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
                    { path: 'ent/balance', icon: 'fa-person-walking', label: 'فحص التوازن', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                    { path: 'ent/referral', icon: 'fa-share-from-square', label: 'تحويل طبي', color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' },
                  ].map(item => {
                    const slug = client?.slug || localStorage.getItem('currentClientSlug') || '';
                    return (
                      <a key={item.path} href={`/${slug}/${item.path}`}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${item.color}`}>
                        <i className={`fa-solid ${item.icon} text-2xl`}></i>
                        <span className="text-xs font-bold">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
              {/* Patient Info Bar */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{selectedPatient.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedPatient.name}</h2>
                    <p className="text-sm text-slate-500">{selectedPatient.phone} {selectedPatient.age ? `• ${selectedPatient.age} سنة` : ''} {selectedPatient.gender === 'male' ? '• ذكر' : selectedPatient.gender === 'female' ? '• أنثى' : ''}</p>
                  </div>
                </div>
                {/* Previous test counts */}
                {!historyLoading && (
                  <div className="flex gap-3">
                    <div className="text-center px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <p className="text-lg font-black text-purple-600">{patientHistory.audiograms.length}</p>
                      <p className="text-[9px] font-bold text-purple-500">فحص سمع</p>
                    </div>
                    <div className="text-center px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-lg font-black text-amber-600">{patientHistory.balanceAssessments.length}</p>
                      <p className="text-[9px] font-bold text-amber-500">فحص توازن</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Mode Selector */}
              <div className="flex gap-2">
                <button onClick={() => { setTestMode('audiogram'); setSaved(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    testMode === 'audiogram'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}>
                  <i className="fa-solid fa-ear-listen"></i> فحص السمع - Audiogram
                </button>
                <button onClick={() => { setTestMode('balance'); setSaved(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                    testMode === 'balance'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
                  }`}>
                  <i className="fa-solid fa-compass"></i> فحص التوازن - VNG/BPPV
                </button>
              </div>

              {/* ======================== AUDIOGRAM FORM ======================== */}
              {testMode === 'audiogram' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Pure Tone */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-wave-square text-purple-500"></i> قياس السمع بالنغمة الصافية
                    </h3>
                    <div className="space-y-4">
                      <FrequencyTable title="التوصيل الهوائي (Air Conduction)" rightKey="rightEarAC" leftKey="leftEarAC" />
                      <FrequencyTable title="التوصيل العظمي (Bone Conduction)" rightKey="rightEarBC" leftKey="leftEarBC" />
                    </div>
                  </div>

                  {/* Speech Audiometry */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-microphone text-pink-500"></i> قياس السمع الكلامي
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'rightSRT', label: 'SRT يمنى (dB)', color: 'red' },
                        { key: 'leftSRT', label: 'SRT يسرى (dB)', color: 'amber' },
                        { key: 'rightSDS', label: 'SDS يمنى (%)', color: 'red' },
                        { key: 'leftSDS', label: 'SDS يسرى (%)', color: 'amber' },
                      ].map(item => (
                        <div key={item.key}>
                          <label className={`block text-xs font-medium text-${item.color}-600 mb-1`}>{item.label}</label>
                          <input type="number" value={(audioForm as any)[item.key] ?? ''} onChange={e => setAudioForm(f => ({ ...f, [item.key]: e.target.value ? Number(e.target.value) : undefined }))}
                            className={`w-full p-2 rounded-xl border border-${item.color}-200 bg-${item.color}-50 dark:bg-${item.color}-900/10 dark:border-${item.color}-800 text-center text-sm`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tympanometry */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-chart-area text-amber-500"></i> قياس طبلية الأذن (Tympanometry)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Right Ear */}
                      <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-700 dark:text-red-300 mb-2 text-sm">أذن يمنى</h4>
                        <div className="space-y-2">
                          <div className="flex gap-1.5">{tympTypes.map(t => (
                            <button key={t} onClick={() => setAudioForm(f => ({ ...f, rightTympanogram: t }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${audioForm.rightTympanogram === t ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-600'}`}>{t}</button>
                          ))}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-[10px] mb-0.5">Compliance (ml)</label>
                              <input type="number" step="0.1" value={audioForm.rightCompliance ?? ''} onChange={e => setAudioForm(f => ({ ...f, rightCompliance: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full p-1.5 rounded-lg border text-center text-xs" /></div>
                            <div><label className="block text-[10px] mb-0.5">Pressure (daPa)</label>
                              <input type="number" value={audioForm.rightPressure ?? ''} onChange={e => setAudioForm(f => ({ ...f, rightPressure: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full p-1.5 rounded-lg border text-center text-xs" /></div>
                          </div>
                          <label className="flex items-center gap-1.5 text-xs">
                            <input type="checkbox" checked={audioForm.rightAcousticReflex} onChange={e => setAudioForm(f => ({ ...f, rightAcousticReflex: e.target.checked }))} />
                            منعكس سمعي موجود
                          </label>
                        </div>
                      </div>
                      {/* Left Ear */}
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-2 text-sm">أذن يسرى</h4>
                        <div className="space-y-2">
                          <div className="flex gap-1.5">{tympTypes.map(t => (
                            <button key={t} onClick={() => setAudioForm(f => ({ ...f, leftTympanogram: t }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${audioForm.leftTympanogram === t ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-600'}`}>{t}</button>
                          ))}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-[10px] mb-0.5">Compliance (ml)</label>
                              <input type="number" step="0.1" value={audioForm.leftCompliance ?? ''} onChange={e => setAudioForm(f => ({ ...f, leftCompliance: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full p-1.5 rounded-lg border text-center text-xs" /></div>
                            <div><label className="block text-[10px] mb-0.5">Pressure (daPa)</label>
                              <input type="number" value={audioForm.leftPressure ?? ''} onChange={e => setAudioForm(f => ({ ...f, leftPressure: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full p-1.5 rounded-lg border text-center text-xs" /></div>
                          </div>
                          <label className="flex items-center gap-1.5 text-xs">
                            <input type="checkbox" checked={audioForm.leftAcousticReflex} onChange={e => setAudioForm(f => ({ ...f, leftAcousticReflex: e.target.checked }))} />
                            منعكس سمعي موجود
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OAE */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-signal text-sky-500"></i> الانبعاث السمعي (OAE)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-red-600 mb-1.5">أذن يمنى</label>
                        <div className="flex gap-2">
                          {['pass', 'refer'].map(v => (
                            <button key={v} onClick={() => setAudioForm(f => ({ ...f, rightOAE: v }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium ${audioForm.rightOAE === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'pass' ? 'Pass ✓' : 'Refer ✗'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-amber-600 mb-1.5">أذن يسرى</label>
                        <div className="flex gap-2">
                          {['pass', 'refer'].map(v => (
                            <button key={v} onClick={() => setAudioForm(f => ({ ...f, leftOAE: v }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium ${audioForm.leftOAE === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'pass' ? 'Pass ✓' : 'Refer ✗'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-clipboard-check text-green-500"></i> التصنيف والتوصيات
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-red-600 mb-1.5">مستوى السمع - يمنى</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {hearingLevels.map(h => (
                              <button key={h.value} onClick={() => setAudioForm(f => ({ ...f, rightHearingLevel: h.value }))}
                                className={`p-1.5 rounded-lg text-[10px] font-bold border-2 transition ${audioForm.rightHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                                {h.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-amber-600 mb-1.5">مستوى السمع - يسرى</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {hearingLevels.map(h => (
                              <button key={h.value} onClick={() => setAudioForm(f => ({ ...f, leftHearingLevel: h.value }))}
                                className={`p-1.5 rounded-lg text-[10px] font-bold border-2 transition ${audioForm.leftHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                                {h.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">نوع ضعف السمع</label>
                        <div className="flex gap-2 flex-wrap">
                          {[['conductive', 'توصيلي'], ['sensorineural', 'حسي عصبي'], ['mixed', 'مختلط']].map(([val, label]) => (
                            <button key={val} onClick={() => setAudioForm(f => ({ ...f, hearingLossType: val }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${audioForm.hearingLossType === val ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={audioForm.needsHearingAid} onChange={e => setAudioForm(f => ({ ...f, needsHearingAid: e.target.checked }))} className="w-4 h-4 rounded" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">يحتاج سماعة طبية</span>
                      </label>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">التوصيات</label>
                        <textarea value={audioForm.recommendation} onChange={e => setAudioForm(f => ({ ...f, recommendation: e.target.value }))}
                          rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                        <textarea value={audioForm.notes} onChange={e => setAudioForm(f => ({ ...f, notes: e.target.value }))}
                          rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Audiogram */}
                  <div className="flex justify-center pb-6">
                    <button onClick={handleSubmitAudiogram} disabled={saving}
                      className="px-10 py-3 bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50">
                      {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                        : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                        : <><i className="fa-solid fa-save ml-2"></i> حفظ نتيجة فحص السمع</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ======================== BALANCE FORM ======================== */}
              {testMode === 'balance' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Vertigo Assessment */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-person-falling text-amber-500"></i> تقييم الدوخة (Vertigo Assessment)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">نوع الدوخة</label>
                        <div className="flex gap-2">
                          {[['rotational', 'دورانية'], ['non-rotational', 'غير دورانية'], ['lightheadedness', 'خفة رأس']].map(([val, lbl]) => (
                            <button key={val} onClick={() => setBalanceForm(f => ({ ...f, vertigoType: val }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium ${balanceForm.vertigoType === val ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">مدة النوبة</label>
                        <input type="text" value={balanceForm.vertigoDuration} onChange={e => setBalanceForm(f => ({ ...f, vertigoDuration: e.target.value }))}
                          placeholder="مثلاً: ثوانٍ، دقائق، ساعات" className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">تكرار النوبات</label>
                        <input type="text" value={balanceForm.vertigoFrequency} onChange={e => setBalanceForm(f => ({ ...f, vertigoFrequency: e.target.value }))}
                          placeholder="مثلاً: يومي، أسبوعي" className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">المحفزات</label>
                        <input type="text" value={balanceForm.triggeredBy} onChange={e => setBalanceForm(f => ({ ...f, triggeredBy: e.target.value }))}
                          placeholder="مثلاً: حركة الرأس، الوقوف" className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                    </div>
                    {/* Associated Symptoms */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">أعراض مصاحبة</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(associatedLabels).map(([key, label]) => (
                          <button key={key} onClick={() => toggleAssociated(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                              balanceForm.associatedSymptoms[key as keyof typeof balanceForm.associatedSymptoms]
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                            }`}>{label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* VNG Tests */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-eye text-blue-500"></i> فحوصات VNG
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'saccade', label: 'Saccade Test', noteKey: 'saccadeNotes' },
                        { key: 'smoothPursuit', label: 'Smooth Pursuit Test', noteKey: 'smoothPursuitNotes' },
                        { key: 'gaze', label: 'Gaze Test', noteKey: 'gazeNotes' },
                      ].map(test => (
                        <div key={test.key} className="grid grid-cols-3 gap-2 items-start">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{test.label}</label>
                            <div className="flex gap-1.5">
                              {['normal', 'abnormal'].map(v => (
                                <button key={v} onClick={() => setBalanceForm((f: any) => ({ ...f, [`${test.key}Test`]: v }))}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${(balanceForm as any)[`${test.key}Test`] === v ? (v === 'normal' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                                  {v === 'normal' ? 'طبيعي' : 'غير طبيعي'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-slate-500 mb-1">ملاحظات</label>
                            <input type="text" value={(balanceForm as any)[test.noteKey]} onChange={e => setBalanceForm((f: any) => ({ ...f, [test.noteKey]: e.target.value }))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs bg-slate-50 dark:bg-slate-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dix-Hallpike & Caloric */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-temperature-low text-orange-500"></i> Dix-Hallpike & Caloric Test
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Dix-Hallpike (يمنى)</label>
                        <div className="flex gap-1.5">
                          {['positive', 'negative'].map(v => (
                            <button key={v} onClick={() => setBalanceForm(f => ({ ...f, dixHallpikeRight: v }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${balanceForm.dixHallpikeRight === v ? (v === 'positive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'positive' ? 'إيجابي' : 'سلبي'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Dix-Hallpike (يسرى)</label>
                        <div className="flex gap-1.5">
                          {['positive', 'negative'].map(v => (
                            <button key={v} onClick={() => setBalanceForm(f => ({ ...f, dixHallpikeLeft: v }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${balanceForm.dixHallpikeLeft === v ? (v === 'positive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'positive' ? 'إيجابي' : 'سلبي'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">اتجاه الرأرأة</label>
                        <input type="text" value={balanceForm.nystagmusDirection} onChange={e => setBalanceForm(f => ({ ...f, nystagmusDirection: e.target.value }))}
                          placeholder="مثلاً: يمين، يسار، أفقي" className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Caloric - يمنى</label>
                        <div className="flex gap-1.5">
                          {['normal', 'reduced', 'absent'].map(v => (
                            <button key={v} onClick={() => setBalanceForm(f => ({ ...f, caloricRight: v }))}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium ${balanceForm.caloricRight === v ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'normal' ? 'طبيعي' : v === 'reduced' ? 'منخفض' : 'معدوم'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Caloric - يسرى</label>
                        <div className="flex gap-1.5">
                          {['normal', 'reduced', 'absent'].map(v => (
                            <button key={v} onClick={() => setBalanceForm(f => ({ ...f, caloricLeft: v }))}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium ${balanceForm.caloricLeft === v ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {v === 'normal' ? 'طبيعي' : v === 'reduced' ? 'منخفض' : 'معدوم'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">عدم التناظر الحراري (%)</label>
                        <input type="number" value={balanceForm.caloricAsymmetry ?? ''} onChange={e => setBalanceForm(f => ({ ...f, caloricAsymmetry: e.target.value ? Number(e.target.value) : undefined }))}
                          className="w-full p-1.5 rounded-lg border text-center text-sm" min="0" max="100" />
                      </div>
                    </div>
                  </div>

                  {/* BPPV Diagnosis */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-spinner text-rose-500"></i> تشخيص BPPV
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={balanceForm.bppvDiagnosis} onChange={e => setBalanceForm(f => ({ ...f, bppvDiagnosis: e.target.checked }))} className="w-4 h-4 rounded" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تشخيص BPPV مؤكد</span>
                      </label>
                      {balanceForm.bppvDiagnosis && (
                        <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">القناة</label>
                            <div className="flex gap-1.5">
                              {[['posterior', 'خلفية'], ['lateral', 'جانبية'], ['anterior', 'أمامية']].map(([val, lbl]) => (
                                <button key={val} onClick={() => setBalanceForm(f => ({ ...f, bppvCanal: val }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium ${balanceForm.bppvCanal === val ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{lbl}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">الجهة</label>
                            <div className="flex gap-1.5">
                              {[['right', 'يمنى'], ['left', 'يسرى'], ['bilateral', 'كلاهما']].map(([val, lbl]) => (
                                <button key={val} onClick={() => setBalanceForm(f => ({ ...f, bppvSide: val }))}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium ${balanceForm.bppvSide === val ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{lbl}</button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={balanceForm.epleyPerformed} onChange={e => setBalanceForm(f => ({ ...f, epleyPerformed: e.target.checked }))} className="w-4 h-4 rounded" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">تم إجراء Epley</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis & Recommendations */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-clipboard-check text-green-500"></i> التشخيص والتوصيات
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">وظيفة الدهليز</label>
                        <div className="flex gap-2">
                          {[['normal', 'طبيعي'], ['unilateral_weakness', 'ضعف أحادي'], ['bilateral_weakness', 'ضعف ثنائي'], ['central', 'مركزي']].map(([val, lbl]) => (
                            <button key={val} onClick={() => setBalanceForm(f => ({ ...f, vestibularFunction: val }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium ${balanceForm.vestibularFunction === val ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">التشخيص <span className="text-red-500">*</span></label>
                        <textarea value={balanceForm.diagnosis} onChange={e => setBalanceForm(f => ({ ...f, diagnosis: e.target.value }))}
                          rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" placeholder="التشخيص النهائي..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">التوصيات</label>
                        <textarea value={balanceForm.recommendation} onChange={e => setBalanceForm(f => ({ ...f, recommendation: e.target.value }))}
                          rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                        <textarea value={balanceForm.notes} onChange={e => setBalanceForm(f => ({ ...f, notes: e.target.value }))}
                          rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Balance */}
                  <div className="flex justify-center pb-6">
                    <button onClick={handleSubmitBalance} disabled={saving}
                      className="px-10 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50">
                      {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</>
                        : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                        : <><i className="fa-solid fa-save ml-2"></i> حفظ نتيجة فحص التوازن</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </Layout>
  );
};

export default TechnicianView;
