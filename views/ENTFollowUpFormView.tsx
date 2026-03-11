
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';
import { ENTFollowUpForm, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const ENTFollowUpFormView: React.FC = () => {
  const { user } = useAuth();
  const { client } = useClient();
  const { t, language } = useLanguage();
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
    if (!selectedPatientId) return alert(t('ent_select_patient'));
    if (!form.followUpReason) return alert(t('ent_followup_reason'));
    
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
      alert(err.message || t('error_occurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-rotate text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('ent_followup_title')}</h1>
                <p className="text-slate-500 dark:text-slate-400">{t('ent_followup_subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-emerald-500"></i> {t('ent_select_patient')}
            </h2>
            <input type="text" placeholder={t('ent_search_patient')} value={searchTerm}
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
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{selectedPatient.phone} | {t('ent_prev_visits_count')}: {selectedPatient.history?.length || 0}</p>
              </div>
            )}
          </div>

          {/* Follow-up Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-stethoscope text-emerald-500"></i> {t('ent_followup_info')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_followup_reason')}</label>
                <textarea value={form.followUpReason} onChange={e => setForm(f => ({ ...f, followUpReason: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_previous_diagnosis')}</label>
                <input type="text" value={form.previousDiagnosis} onChange={e => setForm(f => ({ ...f, previousDiagnosis: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Treatment Compliance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-pills text-amber-500"></i> {t('ent_compliance_level')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('ent_compliance_level')}</label>
                <div className="flex gap-3 flex-wrap">
                  {([['full', t('ent_full_compliance')], ['partial', t('ent_partial_compliance')], ['none', t('ent_no_compliance')]] as [string, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, treatmentCompliance: val as typeof f.treatmentCompliance }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.treatmentCompliance === val ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {form.treatmentCompliance !== 'full' && (
                <textarea value={form.treatmentComplianceNotes} onChange={e => setForm(f => ({ ...f, treatmentComplianceNotes: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder={t('ent_non_compliance_reason')} />
              )}
            </div>
          </div>

          {/* Symptom Assessment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-amber-500"></i> {t('ent_symptom_assessment')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('ent_symptom_change_label')}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([['improved', t('ent_improved_label'), 'text-green-600 bg-green-100 dark:bg-green-900/30'], 
                      ['same', t('ent_same_label'), 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'], 
                      ['worsened', t('ent_worsened_label'), 'text-red-600 bg-red-100 dark:bg-red-900/30'],
                      ['new_symptoms', t('ent_new_symptoms_label'), 'text-purple-600 bg-purple-100 dark:bg-purple-900/30']] as [string, string, string][]).map(([val, label, colors]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, symptomChange: val as typeof f.symptomChange }))}
                      className={`p-3 rounded-xl text-sm font-medium transition border-2 ${form.symptomChange === val ? colors + ' border-current' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_current_symptoms')}</label>
                <textarea value={form.currentSymptoms} onChange={e => setForm(f => ({ ...f, currentSymptoms: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
              </div>
              {form.symptomChange === 'new_symptoms' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_new_symptoms_detail')}</label>
                  <textarea value={form.newSymptoms} onChange={e => setForm(f => ({ ...f, newSymptoms: e.target.value }))}
                    rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Medication Effectiveness */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-capsules text-amber-500"></i> {t('ent_medication_effectiveness')}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                {([['effective', t('ent_med_effective')], ['partially', t('ent_med_partial')], ['not_effective', t('ent_med_not_effective')]] as [string, string][]).map(([val, label]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, medicationEffectiveness: val as typeof f.medicationEffectiveness }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.medicationEffectiveness === val ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.sideEffects} onChange={e => setForm(f => ({ ...f, sideEffects: e.target.checked }))}
                    className="w-5 h-5 rounded text-amber-500" />
                  <span className="text-slate-700 dark:text-slate-300">{t('ent_side_effects_question')}</span>
                </label>
              </div>
              {form.sideEffects && (
                <textarea value={form.sideEffectsDetails} onChange={e => setForm(f => ({ ...f, sideEffectsDetails: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder={t('ent_side_effects_details')} />
              )}
            </div>
          </div>

          {/* Surgical Follow-up */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-scalpel text-rose-500"></i> {t('ent_surgical_followup_section')}
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isSurgicalFollowUp} onChange={e => setForm(f => ({ ...f, isSurgicalFollowUp: e.target.checked }))}
                  className="w-5 h-5 rounded text-rose-500" />
                <span className="text-slate-700 dark:text-slate-300">{t('ent_is_surgical_followup')}</span>
              </label>
              {form.isSurgicalFollowUp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_surgery_date')}</label>
                    <input type="date" value={form.surgeryDate} onChange={e => setForm(f => ({ ...f, surgeryDate: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_surgery_type')}</label>
                    <input type="text" value={form.surgeryType} onChange={e => setForm(f => ({ ...f, surgeryType: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('ent_healing_assessment')}</label>
                    <div className="flex gap-3">
                      {([['good', t('ent_healing_good')], ['moderate', t('ent_healing_moderate')], ['poor', t('ent_healing_poor')]] as [string, string][]).map(([val, label]) => (
                        <button key={val} onClick={() => setForm(f => ({ ...f, healingAssessment: val as typeof f.healingAssessment }))}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.healingAssessment === val ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('ent_complications_label')}</label>
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
              <i className="fa-solid fa-note-sticky text-green-500"></i> {t('ent_notes_label')}
            </h2>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
          </div>

          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-amber-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> {t('saving')}</>
                : saved ? <><i className="fa-solid fa-check ml-2"></i> {t('saved_successfully')}</>
                : <><i className="fa-solid fa-save ml-2"></i> {t('ent_save_followup_form')}</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ENTFollowUpFormView;
