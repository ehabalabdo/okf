
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClient } from '../context/ClientContext';
import { ENTNewPatientForm, Patient } from '../types';
import { api } from '../src/api';
import Layout from '../components/Layout';

const defaultSymptoms = {
  earPain: false, hearingLoss: false, tinnitus: false, earDischarge: false,
  vertigo: false, nasalObstruction: false, nasalDischarge: false, sneezing: false,
  soreThroat: false, voiceChange: false, dysphagia: false, snoring: false,
  sleepApnea: false, facialPain: false, headache: false, nosebleeds: false,
  lossOfSmell: false, neckMass: false, other: '',
};

const ENTNewPatientFormView: React.FC = () => {
  const { user } = useAuth();
  const { client } = useClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState<Omit<ENTNewPatientForm, 'id' | 'patientId' | 'clientId' | 'createdAt'>>({
    chiefComplaint: '',
    symptomDuration: '',
    symptomSide: 'none',
    symptoms: { ...defaultSymptoms },
    previousENTTreatment: false,
    previousENTDetails: '',
    previousENTSurgery: false,
    previousENTSurgeryDetails: '',
    notes: '',
  });

  useEffect(() => {
    api.get('/patients').then(setPatients).catch(console.error);
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const toggleSymptom = (key: keyof typeof defaultSymptoms) => {
    if (key === 'other') return;
    setForm(prev => ({
      ...prev,
      symptoms: { ...prev.symptoms, [key]: !prev.symptoms[key] }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) return alert('يرجى اختيار المريض');
    if (!form.chiefComplaint) return alert('يرجى إدخال الشكوى الرئيسية');
    
    setSaving(true);
    try {
      await api.post('/ent-forms/new-patient', {
        ...form,
        patientId: selectedPatientId,
        clientId: client?.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Reset form
      setForm({
        chiefComplaint: '', symptomDuration: '', symptomSide: 'none',
        symptoms: { ...defaultSymptoms },
        previousENTTreatment: false, previousENTDetails: '',
        previousENTSurgery: false, previousENTSurgeryDetails: '', notes: '',
      });
      setSelectedPatientId('');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const symptomLabels: Record<string, string> = {
    earPain: 'ألم أذن', hearingLoss: 'ضعف سمع', tinnitus: 'طنين',
    earDischarge: 'إفرازات أذن', vertigo: 'دوخة / دوار', nasalObstruction: 'انسداد أنف',
    nasalDischarge: 'إفرازات أنف', sneezing: 'عطاس', soreThroat: 'ألم حلق',
    voiceChange: 'تغير في الصوت', dysphagia: 'صعوبة بلع', snoring: 'شخير',
    sleepApnea: 'انقطاع نفس أثناء النوم', facialPain: 'ألم وجه', headache: 'صداع',
    nosebleeds: 'رعاف (نزيف أنف)', lossOfSmell: 'فقدان حاسة الشم', neckMass: 'كتلة في الرقبة',
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-3 md:p-6" dir="rtl">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-user-plus text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">استبيان مريض جديد</h1>
                <p className="text-slate-500 dark:text-slate-400">New Patient Questionnaire - ENT Department</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-user text-blue-500"></i> اختيار المريض
            </h2>
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white mb-3"
            />
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPatients.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPatientId(p.id); setSearchTerm(''); }}
                    className={`w-full text-right p-3 rounded-xl transition ${selectedPatientId === p.id ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-slate-500 mr-3">{p.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="font-bold text-blue-800 dark:text-blue-300">{selectedPatient.name}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{selectedPatient.phone} | {selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى'} | العمر: {selectedPatient.age}</p>
              </div>
            )}
          </div>

          {/* Chief Complaint */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-comment-medical text-red-500"></i> الشكوى الرئيسية
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشكوى الرئيسية *</label>
                <textarea value={form.chiefComplaint} onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                  rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="وصف الشكوى الرئيسية للمريض..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مدة الأعراض</label>
                  <input type="text" value={form.symptomDuration} onChange={e => setForm(f => ({ ...f, symptomDuration: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="مثال: أسبوعين، شهر..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">جهة الأعراض</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['right', 'left', 'both', 'none'] as const).map(side => (
                      <button key={side} onClick={() => setForm(f => ({ ...f, symptomSide: side }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${form.symptomSide === side ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                        {{ right: 'يمين', left: 'يسار', both: 'كلاهما', none: 'غير محدد' }[side]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-amber-500"></i> قائمة الأعراض
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(symptomLabels).map(([key, label]) => (
                <button key={key} onClick={() => toggleSymptom(key as keyof typeof defaultSymptoms)}
                  className={`p-3 rounded-xl text-sm font-medium text-right transition flex items-center gap-2 ${
                    form.symptoms[key as keyof typeof defaultSymptoms] 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700' 
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}>
                  <i className={`fa-solid ${form.symptoms[key as keyof typeof defaultSymptoms] ? 'fa-square-check text-red-500' : 'fa-square text-slate-400'}`}></i>
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">أعراض أخرى</label>
              <input type="text" value={form.symptoms.other || ''} 
                onChange={e => setForm(f => ({ ...f, symptoms: { ...f.symptoms, other: e.target.value } }))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                placeholder="أدخل أي أعراض إضافية..." />
            </div>
          </div>

          {/* Previous ENT Treatment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-purple-500"></i> العلاج السابق
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.previousENTTreatment}
                    onChange={e => setForm(f => ({ ...f, previousENTTreatment: e.target.checked }))}
                    className="w-5 h-5 rounded text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-300">هل تلقى علاج أنف أذن حنجرة سابقاً؟</span>
                </label>
              </div>
              {form.previousENTTreatment && (
                <textarea value={form.previousENTDetails} onChange={e => setForm(f => ({ ...f, previousENTDetails: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="تفاصيل العلاج السابق..." />
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.previousENTSurgery}
                    onChange={e => setForm(f => ({ ...f, previousENTSurgery: e.target.checked }))}
                    className="w-5 h-5 rounded text-blue-500" />
                  <span className="text-slate-700 dark:text-slate-300">هل أجرى عمليات جراحية في الأنف أو الأذن أو الحنجرة؟</span>
                </label>
              </div>
              {form.previousENTSurgery && (
                <textarea value={form.previousENTSurgeryDetails} onChange={e => setForm(f => ({ ...f, previousENTSurgeryDetails: e.target.value }))}
                  rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="تفاصيل العمليات السابقة..." />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-note-sticky text-green-500"></i> ملاحظات إضافية
            </h2>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
              placeholder="أي ملاحظات إضافية..." />
          </div>

          {/* Submit */}
          <div className="flex justify-center pb-8">
            <button onClick={handleSubmit} disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105 disabled:opacity-50 text-lg">
              {saving ? <><i className="fa-solid fa-spinner fa-spin ml-2"></i> جاري الحفظ...</> 
                : saved ? <><i className="fa-solid fa-check ml-2"></i> تم الحفظ بنجاح</>
                : <><i className="fa-solid fa-save ml-2"></i> حفظ الاستبيان</>}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ENTNewPatientFormView;
