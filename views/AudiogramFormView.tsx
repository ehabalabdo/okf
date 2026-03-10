
import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';
import { AudiogramResult, AudiogramFrequencyData, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const emptyFreq = (): AudiogramFrequencyData => ({ hz250: undefined, hz500: undefined, hz1000: undefined, hz2000: undefined, hz4000: undefined, hz8000: undefined });

const frequencies = ['hz250', 'hz500', 'hz1000', 'hz2000', 'hz4000', 'hz8000'] as const;
const freqLabels: Record<string, string> = { hz250: '250', hz500: '500', hz1000: '1000', hz2000: '2000', hz4000: '4000', hz8000: '8000' };

const hearingLevels = [
  { value: 'normal', labelKey: 'aud_normal' as const, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'mild', labelKey: 'aud_mild' as const, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'moderate', labelKey: 'aud_moderate' as const, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'moderately_severe', labelKey: 'aud_mod_severe' as const, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'severe', labelKey: 'aud_severe' as const, color: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' },
  { value: 'profound', labelKey: 'aud_profound' as const, color: 'bg-red-300 text-red-900 dark:bg-red-900/70 dark:text-red-100' },
];

const tympTypes = ['A', 'As', 'Ad', 'B', 'C'] as const;

const AudiogramFormView: React.FC = () => {
  const { client } = useClient();
  const { t, language } = useLanguage();
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
    if (!selectedPatientId) return alert(t('ent_select_patient'));
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
      alert(err.message || t('error_occurred'));
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
            <th className="p-2 text-right">{t('aud_frequency')}</th>
            {frequencies.map(f => <th key={f} className="p-2 text-center">{freqLabels[f]}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b dark:border-slate-600">
            <td className="p-2 font-medium text-red-600">{t('aud_right_ear')} <span className="text-xs">(O)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={form[rightKey][f] ?? ''} onChange={e => updateFreq(rightKey, f, e.target.value)}
                  className="w-16 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-red-50 dark:bg-red-900/10 text-slate-800 dark:text-white" min="-10" max="120" />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium text-amber-600">{t('aud_left_ear')} <span className="text-xs">(X)</span></td>
            {frequencies.map(f => (
              <td key={f} className="p-1">
                <input type="number" value={form[leftKey][f] ?? ''} onChange={e => updateFreq(leftKey, f, e.target.value)}
                  className="w-16 p-1 text-center rounded border border-slate-200 dark:border-slate-600 bg-amber-50 dark:bg-amber-900/10 text-slate-800 dark:text-white" min="-10" max="120" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-ear-listen text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('aud_title')}</h1>
                <p className="text-slate-500 dark:text-slate-400">{t('aud_subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-violet-500"></i> {t('ent_select_patient')}
            </h2>
            <input type="text" placeholder={t('ent_search_patient')} value={searchTerm}
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
                <p className="text-sm text-violet-600 dark:text-violet-400">{selectedPatient.phone} | {t('age_label')}: {selectedPatient.age}</p>
              </div>
            )}
          </div>

          {/* Pure Tone Audiometry - Air Conduction */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wave-square text-violet-500"></i> {t('aud_pure_tone')}
            </h2>
            <div className="space-y-6">
              <FrequencyTable title={`${t('aud_air_conduction')} (Air Conduction)`} rightKey="rightEarAC" leftKey="leftEarAC" color="violet" />
              <FrequencyTable title={`${t('aud_bone_conduction')} (Bone Conduction)`} rightKey="rightEarBC" leftKey="leftEarBC" color="indigo" />
            </div>
          </div>

          {/* Speech Audiometry */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-microphone text-pink-500"></i> {t('aud_speech_audiometry')} (Speech Audiometry)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-red-600 mb-1">{t('aud_srt_right')}</label>
                <input type="number" value={form.rightSRT ?? ''} onChange={e => setForm(f => ({ ...f, rightSRT: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-center" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">{t('aud_srt_left')}</label>
                <input type="number" value={form.leftSRT ?? ''} onChange={e => setForm(f => ({ ...f, leftSRT: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 text-center" />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-600 mb-1">{t('aud_sds_right')}</label>
                <input type="number" value={form.rightSDS ?? ''} onChange={e => setForm(f => ({ ...f, rightSDS: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-center" min="0" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">{t('aud_sds_left')}</label>
                <input type="number" value={form.leftSDS ?? ''} onChange={e => setForm(f => ({ ...f, leftSDS: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full p-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 text-center" min="0" max="100" />
              </div>
            </div>
          </div>

          {/* Tympanometry */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-area text-amber-500"></i> {t('aud_tympanometry')} (Tympanometry)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Ear */}
              <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-700 dark:text-red-300 mb-3">{t('aud_right_ear')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t('aud_type')}</label>
                    <div className="flex gap-2">{tympTypes.map(typ => (
                      <button key={typ} onClick={() => setForm(f => ({ ...f, rightTympanogram: typ }))}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${form.rightTympanogram === typ ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700'}`}>{typ}</button>
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
                    {t('aud_acoustic_reflex_present')}
                  </label>
                </div>
              </div>
              {/* Left Ear */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                <h3 className="font-bold text-amber-700 dark:text-amber-300 mb-3">{t('aud_left_ear')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t('aud_type')}</label>
                    <div className="flex gap-2">{tympTypes.map(typ => (
                      <button key={typ} onClick={() => setForm(f => ({ ...f, leftTympanogram: typ }))}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${form.leftTympanogram === typ ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-700'}`}>{typ}</button>
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
                    {t('aud_acoustic_reflex_present')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* OAE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-signal text-sky-500"></i> {t('aud_oae')}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">{t('aud_right_ear')}</label>
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
                <label className="block text-sm font-medium text-amber-600 mb-2">{t('aud_left_ear')}</label>
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
              <i className="fa-solid fa-clipboard-check text-green-500"></i> {t('aud_classification_recommendations')}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-2">{t('aud_hearing_level_right')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {hearingLevels.map(h => (
                      <button key={h.value} onClick={() => setForm(f => ({ ...f, rightHearingLevel: h.value }))}
                        className={`p-2 rounded-xl text-xs font-medium border-2 transition ${form.rightHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                        {t(h.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-600 mb-2">{t('aud_hearing_level_left')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {hearingLevels.map(h => (
                      <button key={h.value} onClick={() => setForm(f => ({ ...f, leftHearingLevel: h.value }))}
                        className={`p-2 rounded-xl text-xs font-medium border-2 transition ${form.leftHearingLevel === h.value ? h.color + ' border-current' : 'bg-slate-50 dark:bg-slate-700 border-transparent'}`}>
                        {t(h.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('aud_hearing_loss_type')}</label>
                <div className="flex gap-3 flex-wrap">
                  {([['conductive', t('aud_conductive')], ['sensorineural', t('aud_sensorineural')], ['mixed', t('aud_mixed')]] as [string, string][]).map(([val, label]) => (
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
                <span className="text-slate-700 dark:text-slate-300 font-medium">{t('aud_needs_hearing_aid')}</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('aud_recommendations')}</label>
                <textarea value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
                  rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_notes_label')}</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> {t('saving')}</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> {t('saved_successfully')}</>
                : <><i className="fa-solid fa-save ml-2"></i> {t('aud_save_audiogram')}</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AudiogramFormView;
