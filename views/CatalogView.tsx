import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pgCatalogServices, pgCatalogMedications } from '../services/apiServices';
import type { CatalogService, CatalogMedication, ImportResult } from '../types';

/** Lazy-load xlsx only when needed */
const loadXLSX = () => import('xlsx');

type CatalogTab = 'services' | 'medications';

const CatalogView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<CatalogTab>('services');

  // Services state
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Medications state
  const [medications, setMedications] = useState<CatalogMedication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);

  // Add forms
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ serviceName: '', category: 'General', price: '', currency: 'JOD' });
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({ brandName: '', genericName: '', strength: '', dosageForm: '', route: '', defaultDose: '', defaultFrequency: '', defaultDuration: '', notes: '' });

  // Import state
  const [importModal, setImportModal] = useState<{ type: CatalogTab; rows: any[]; headers: string[] } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const serviceFileRef = useRef<HTMLInputElement>(null);
  const medFileRef = useRef<HTMLInputElement>(null);

  // ===================== LOAD DATA =====================
  useEffect(() => {
    loadServices();
    loadMedications();
  }, []);

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const data = await pgCatalogServices.getAll();
      setServices(data);
    } catch (e) { console.error('Load services error:', e); }
    setLoadingServices(false);
  };

  const loadMedications = async () => {
    setLoadingMeds(true);
    try {
      const data = await pgCatalogMedications.getAll();
      setMedications(data);
    } catch (e) { console.error('Load meds error:', e); }
    setLoadingMeds(false);
  };

  // ===================== ADD SERVICE =====================
  const handleAddService = async () => {
    if (!newService.serviceName || !newService.price) return;
    try {
      await pgCatalogServices.create({
        serviceName: newService.serviceName,
        category: newService.category,
        price: Number(newService.price),
        currency: newService.currency,
      });
      setNewService({ serviceName: '', category: 'General', price: '', currency: 'JOD' });
      setShowAddService(false);
      loadServices();
    } catch (e: any) { alert(e.message); }
  };

  // ===================== ADD MEDICATION =====================
  const handleAddMed = async () => {
    if (!newMed.brandName && !newMed.genericName) return;
    try {
      await pgCatalogMedications.create(newMed as any);
      setNewMed({ brandName: '', genericName: '', strength: '', dosageForm: '', route: '', defaultDose: '', defaultFrequency: '', defaultDuration: '', notes: '' });
      setShowAddMed(false);
      loadMedications();
    } catch (e: any) { alert(e.message); }
  };

  // ===================== DELETE =====================
  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await pgCatalogServices.remove(id);
    loadServices();
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm('Delete this medication?')) return;
    await pgCatalogMedications.remove(id);
    loadMedications();
  };

  // ===================== TOGGLE ACTIVE =====================
  const toggleServiceActive = async (svc: CatalogService) => {
    await pgCatalogServices.update(svc.id, { active: !svc.active } as any);
    loadServices();
  };

  const toggleMedActive = async (med: CatalogMedication) => {
    await pgCatalogMedications.update(med.id, { active: !med.active } as any);
    loadMedications();
  };

  // ===================== DOWNLOAD TEMPLATE =====================
  const downloadServiceTemplate = async () => {
    const XLSX = await loadXLSX();
    const data = [
      { serviceName: 'General Consultation', category: 'Consultation', price: 30, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'Follow-up Visit', category: 'Consultation', price: 15, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'Injection', category: 'Procedure', price: 10, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'Ultrasound', category: 'Imaging', price: 80, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'X-Ray', category: 'Imaging', price: 60, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'Lab Test - CBC', category: 'Lab', price: 15, currency: 'JOD', active: 'TRUE' },
      { serviceName: 'Minor Surgery', category: 'Procedure', price: 150, currency: 'JOD', active: 'TRUE' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Services');
    XLSX.writeFile(wb, 'services_template.xlsx');
  };

  const downloadMedTemplate = async () => {
    const XLSX = await loadXLSX();
    const data = [
      { brandName: 'Panadol', genericName: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet', route: 'Oral', defaultDose: '1 tablet', defaultFrequency: '3 times daily', defaultDuration: '5 days', notes: 'After meals', active: 'TRUE' },
      { brandName: 'Augmentin', genericName: 'Amoxicillin/Clavulanate', strength: '625mg', dosageForm: 'Tablet', route: 'Oral', defaultDose: '1 tablet', defaultFrequency: '2 times daily', defaultDuration: '7 days', notes: '', active: 'TRUE' },
      { brandName: 'Voltaren', genericName: 'Diclofenac', strength: '50mg', dosageForm: 'Tablet', route: 'Oral', defaultDose: '1 tablet', defaultFrequency: '2 times daily', defaultDuration: '5 days', notes: 'After food', active: 'TRUE' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 15 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medications');
    XLSX.writeFile(wb, 'medications_template.xlsx');
  };

  // ===================== UPLOAD PARSE =====================
  const SERVICE_HEADERS = ['serviceName', 'category', 'price', 'currency', 'active'];
  const MED_HEADERS = ['brandName', 'genericName', 'strength', 'dosageForm', 'route', 'defaultDose', 'defaultFrequency', 'defaultDuration', 'notes', 'active'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: CatalogTab) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.xlsx?$/i)) {
      alert('Please upload an .xlsx or .xls file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await loadXLSX();
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (jsonRows.length === 0) {
          alert('Excel file is empty');
          return;
        }
        if (jsonRows.length > 5000) {
          alert('Maximum 5000 rows allowed');
          return;
        }

        // Validate headers
        const requiredHeaders = type === 'services' ? SERVICE_HEADERS : MED_HEADERS;
        const fileHeaders = Object.keys(jsonRows[0]);
        const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
        if (missingHeaders.length > 0) {
          alert(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        setImportModal({ type, rows: jsonRows, headers: fileHeaders });
        setImportResult(null);
      } catch (err) {
        alert('Failed to parse Excel file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ===================== CONFIRM IMPORT =====================
  const handleConfirmImport = async () => {
    if (!importModal) return;
    setImporting(true);
    try {
      let result: ImportResult;
      if (importModal.type === 'services') {
        result = await pgCatalogServices.importBulk(importModal.rows);
        loadServices();
      } else {
        result = await pgCatalogMedications.importBulk(importModal.rows);
        loadMedications();
      }
      setImportResult(result);
    } catch (e: any) {
      alert('Import failed: ' + e.message);
    }
    setImporting(false);
  };

  // ===================== RENDER =====================
  return (
    <Layout title="Clinic Catalog">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'services'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-briefcase-medical mr-2"></i>
          Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('medications')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'medications'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-pills mr-2"></i>
          Medications ({medications.length})
        </button>
      </div>

      {/* =================== SERVICES TAB =================== */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-800">
              <i className="fa-solid fa-briefcase-medical text-emerald-500 mr-2"></i>
              Services Catalog
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={downloadServiceTemplate} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                <i className="fa-solid fa-download mr-1"></i> Download Template
              </button>
              <input type="file" ref={serviceFileRef} className="hidden" accept=".xlsx,.xls" onChange={e => handleFileSelect(e, 'services')} />
              <button onClick={() => serviceFileRef.current?.click()} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all">
                <i className="fa-solid fa-upload mr-1"></i> Upload Excel
              </button>
              <button onClick={() => setShowAddService(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                <i className="fa-solid fa-plus mr-1"></i> Add Service
              </button>
            </div>
          </div>

          {/* Add Service Form */}
          {showAddService && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-100">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input className="p-2 rounded-lg border text-sm" placeholder="Service Name *" value={newService.serviceName} onChange={e => setNewService({ ...newService, serviceName: e.target.value })} />
                <select className="p-2 rounded-lg border text-sm bg-white" value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })}>
                  <option>General</option><option>Consultation</option><option>Procedure</option><option>Imaging</option><option>Lab</option><option>Surgery</option>
                </select>
                <input type="number" className="p-2 rounded-lg border text-sm" placeholder="Price *" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
                <select className="p-2 rounded-lg border text-sm bg-white" value={newService.currency} onChange={e => setNewService({ ...newService, currency: e.target.value })}>
                  <option value="JOD">JOD</option><option value="USD">USD</option><option value="IQD">IQD</option><option value="SAR">SAR</option><option value="AED">AED</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleAddService} className="flex-1 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700">Save</button>
                  <button onClick={() => setShowAddService(false)} className="px-3 bg-white border rounded-lg text-sm text-slate-500 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Services Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left p-3 font-bold">Service Name</th>
                  <th className="text-left p-3 font-bold">Category</th>
                  <th className="text-right p-3 font-bold">Price</th>
                  <th className="text-center p-3 font-bold">Currency</th>
                  <th className="text-center p-3 font-bold">Status</th>
                  <th className="text-center p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingServices ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-400"><i className="fa-solid fa-spinner animate-spin mr-2"></i>Loading...</td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-400">No services yet. Add your first service or upload a template.</td></tr>
                ) : (
                  services.map(svc => (
                    <tr key={svc.id} className={`hover:bg-slate-50 transition-colors ${!svc.active ? 'opacity-50' : ''}`}>
                      <td className="p-3 font-medium text-slate-800">{svc.serviceName}</td>
                      <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{svc.category}</span></td>
                      <td className="p-3 text-right font-bold text-emerald-600">{svc.price}</td>
                      <td className="p-3 text-center text-slate-500">{svc.currency}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleServiceActive(svc)} className={`px-2 py-0.5 rounded-full text-xs font-bold ${svc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {svc.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteService(svc.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================== MEDICATIONS TAB =================== */}
      {activeTab === 'medications' && (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-800">
              <i className="fa-solid fa-pills text-blue-500 mr-2"></i>
              Medications Catalog
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={downloadMedTemplate} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                <i className="fa-solid fa-download mr-1"></i> Download Template
              </button>
              <input type="file" ref={medFileRef} className="hidden" accept=".xlsx,.xls" onChange={e => handleFileSelect(e, 'medications')} />
              <button onClick={() => medFileRef.current?.click()} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all">
                <i className="fa-solid fa-upload mr-1"></i> Upload Excel
              </button>
              <button onClick={() => setShowAddMed(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                <i className="fa-solid fa-plus mr-1"></i> Add Medication
              </button>
            </div>
          </div>

          {/* Add Medication Form */}
          {showAddMed && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input className="p-2 rounded-lg border text-sm" placeholder="Brand Name" value={newMed.brandName} onChange={e => setNewMed({ ...newMed, brandName: e.target.value })} />
                <input className="p-2 rounded-lg border text-sm" placeholder="Generic Name" value={newMed.genericName} onChange={e => setNewMed({ ...newMed, genericName: e.target.value })} />
                <input className="p-2 rounded-lg border text-sm" placeholder="Strength (e.g. 500mg)" value={newMed.strength} onChange={e => setNewMed({ ...newMed, strength: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                <select className="p-2 rounded-lg border text-sm bg-white" value={newMed.dosageForm} onChange={e => setNewMed({ ...newMed, dosageForm: e.target.value })}>
                  <option value="">Dosage Form</option><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Drops</option><option>Inhaler</option><option>Suppository</option>
                </select>
                <select className="p-2 rounded-lg border text-sm bg-white" value={newMed.route} onChange={e => setNewMed({ ...newMed, route: e.target.value })}>
                  <option value="">Route</option><option>Oral</option><option>IV</option><option>IM</option><option>SC</option><option>Topical</option><option>Rectal</option><option>Inhalation</option><option>Ophthalmic</option><option>Otic</option>
                </select>
                <input className="p-2 rounded-lg border text-sm" placeholder="Default Dose" value={newMed.defaultDose} onChange={e => setNewMed({ ...newMed, defaultDose: e.target.value })} />
                <input className="p-2 rounded-lg border text-sm" placeholder="Default Frequency" value={newMed.defaultFrequency} onChange={e => setNewMed({ ...newMed, defaultFrequency: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="p-2 rounded-lg border text-sm" placeholder="Default Duration" value={newMed.defaultDuration} onChange={e => setNewMed({ ...newMed, defaultDuration: e.target.value })} />
                <input className="p-2 rounded-lg border text-sm" placeholder="Notes" value={newMed.notes} onChange={e => setNewMed({ ...newMed, notes: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={handleAddMed} className="flex-1 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">Save</button>
                  <button onClick={() => setShowAddMed(false)} className="px-3 bg-white border rounded-lg text-sm text-slate-500 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Medications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left p-3 font-bold">Brand Name</th>
                  <th className="text-left p-3 font-bold">Generic Name</th>
                  <th className="text-left p-3 font-bold">Strength</th>
                  <th className="text-left p-3 font-bold">Form</th>
                  <th className="text-left p-3 font-bold">Route</th>
                  <th className="text-left p-3 font-bold">Default Dose</th>
                  <th className="text-center p-3 font-bold">Status</th>
                  <th className="text-center p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingMeds ? (
                  <tr><td colSpan={8} className="text-center p-8 text-slate-400"><i className="fa-solid fa-spinner animate-spin mr-2"></i>Loading...</td></tr>
                ) : medications.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-8 text-slate-400">No medications yet. Add your first medication or upload a template.</td></tr>
                ) : (
                  medications.map(med => (
                    <tr key={med.id} className={`hover:bg-slate-50 transition-colors ${!med.active ? 'opacity-50' : ''}`}>
                      <td className="p-3 font-medium text-slate-800">{med.brandName || '—'}</td>
                      <td className="p-3 text-slate-600 italic">{med.genericName || '—'}</td>
                      <td className="p-3"><span className="bg-blue-50 px-2 py-0.5 rounded text-xs font-bold text-blue-700">{med.strength || '—'}</span></td>
                      <td className="p-3 text-slate-500">{med.dosageForm || '—'}</td>
                      <td className="p-3 text-slate-500">{med.route || '—'}</td>
                      <td className="p-3 text-slate-500 text-xs">{med.defaultDose ? `${med.defaultDose} ${med.defaultFrequency} × ${med.defaultDuration}` : '—'}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleMedActive(med)} className={`px-2 py-0.5 rounded-full text-xs font-bold ${med.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {med.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteMed(med.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================== IMPORT PREVIEW MODAL =================== */}
      {importModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setImportModal(null); setImportResult(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-800">
                <i className={`fa-solid ${importModal.type === 'services' ? 'fa-briefcase-medical text-emerald-500' : 'fa-pills text-blue-500'} mr-2`}></i>
                Import Preview — {importModal.rows.length} rows
              </h3>
              <button onClick={() => { setImportModal(null); setImportResult(null); }} className="text-slate-400 hover:text-slate-700">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                    <i className="fa-solid fa-circle-plus"></i> Created: {importResult.created}
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                    <i className="fa-solid fa-pen"></i> Updated: {importResult.updated}
                  </div>
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                      <i className="fa-solid fa-circle-xmark"></i> Failed: {importResult.failed}
                    </div>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-3 bg-red-50 rounded-lg border border-red-100 p-3 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-600 mb-1">
                        <span className="font-bold">Row {err.row}:</span> {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-bold text-slate-600 border">#</th>
                    {importModal.headers.map(h => (
                      <th key={h} className="p-2 text-left font-bold text-slate-600 border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importModal.rows.slice(0, 50).map((row, i) => {
                    const hasError = importResult?.errors.some(e => e.row === i + 2);
                    return (
                      <tr key={i} className={hasError ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2 border text-slate-400 font-mono">{i + 2}</td>
                        {importModal.headers.map(h => (
                          <td key={h} className="p-2 border text-slate-700 max-w-[150px] truncate">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {importModal.rows.length > 50 && (
                <p className="text-xs text-slate-400 mt-2 text-center">Showing first 50 of {importModal.rows.length} rows</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setImportModal(null); setImportResult(null); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200">
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && (
                <button onClick={handleConfirmImport} disabled={importing} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-all">
                  {importing ? (
                    <><i className="fa-solid fa-spinner animate-spin mr-2"></i>Importing...</>
                  ) : (
                    <><i className="fa-solid fa-file-import mr-2"></i>Confirm Import ({importModal.rows.length} rows)</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CatalogView;
