
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
