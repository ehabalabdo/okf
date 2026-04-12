
import { Clinic, Patient, User, UserRole, AuditMetadata, VisitData, Appointment, Invoice, Notification, PrescriptionItem, Attachment, SystemSettings, ClinicCategory } from '../types';
import { pgUsers, pgClinics, pgPatients, pgAppointments, pgInvoices } from './apiServices';

// --- Helpers ---
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;

const DEFAULT_SETTINGS: SystemSettings = {
  clinicName: 'TKC',
  logoUrl: '',
  address: 'Medical Plaza',
  phone: '000-000-0000'
};

// --- Services ---

export const AuthService = {
  
  createUser: async (admin: User, data: Pick<User, 'name'|'email'|'password'|'role'|'clinicIds'>): Promise<void> => {
    if (admin.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    await pgUsers.create({
      ...data,
      password: data.password || 'password123',
      isActive: true,
      isArchived: false
    });
  },

  updateUser: async (admin: User, userId: string, data: Partial<User>): Promise<void> => {
    if (admin.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    const updateData = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    await pgUsers.update(userId, updateData);
  },

  deleteUser: async (admin: User, userId: string): Promise<void> => {
    if (admin.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    if (admin.uid === userId) throw new Error("Cannot delete your own account");
    await pgUsers.delete(userId);
  }
};

export const ClinicService = {

  getActive: async (): Promise<Clinic[]> => {
    return await pgClinics.getAll();
  },

  add: async (user: User, name: string, type: string, category: ClinicCategory): Promise<void> => {
    if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized: Admins only");
    await pgClinics.create({
      name,
      type,
      category,
      active: true,
      isArchived: false
    });
  },

  toggleStatus: async (user: User, clinicId: string, status: boolean): Promise<void> => {
    if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    await pgClinics.toggleStatus(clinicId, status);
  },
  
  delete: async (user: User, clinicId: string): Promise<void> => {
    if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    await pgClinics.delete(clinicId);
  }
};

export const PatientService = {
  subscribe: (user: User, callback: (patients: Patient[]) => void): (() => void) => {
    return pgPatients.subscribe((allPatients) => {
      // Filter: only active patients with current visit (visitId must be non-empty string)
      let filtered = allPatients.filter(p => {
        return !p.isArchived && 
               p.currentVisit && 
               p.currentVisit.visitId && 
               p.currentVisit.visitId.trim() !== '';
      });
      
      // Filter for Doctors: Only see patients in their clinics
      if (user.role === UserRole.DOCTOR) {
        if (!user.clinicIds || user.clinicIds.length === 0) {
          callback([]); return;
        }
        filtered = filtered.filter(p => {
          const hasClinic = p.currentVisit && p.currentVisit.clinicId;
          return hasClinic && user.clinicIds.includes(p.currentVisit.clinicId);
        });
      }
      callback(filtered.sort((a, b) => {
        if (a.currentVisit.priority === 'urgent' && b.currentVisit.priority !== 'urgent') return -1;
        if (a.currentVisit.priority !== 'urgent' && b.currentVisit.priority === 'urgent') return 1;
        return a.currentVisit.date - b.currentVisit.date;
      }));
    });
  },

  getAll: async (user: User): Promise<Patient[]> => {
    const allPatients = await pgPatients.getAll();
    const activePatients = allPatients.filter(p => {
      return !p.isArchived && 
             p.currentVisit && 
             p.currentVisit.visitId && 
             p.currentVisit.visitId.trim() !== '';
    });
    if (user.role === UserRole.DOCTOR) {
      if (!user.clinicIds || user.clinicIds.length === 0) {
        return [];
      }
      return activePatients.filter(p => {
        const hasClinic = p.currentVisit && p.currentVisit.clinicId;
        return hasClinic && user.clinicIds.includes(p.currentVisit.clinicId);
      });
    }
    return activePatients;
  },

  getAllForRegistry: async (user: User): Promise<Patient[]> => {
    const allPatients = await pgPatients.getAll();
    return allPatients.filter(p => !p.isArchived);
  },

  getById: async (user: User, id: string): Promise<Patient | null> => {
    const allPatients = await pgPatients.getAll();
    const patient = allPatients.find(p => p.id === id);
    if (!patient || patient.isArchived) return null;
    return patient;
  },

  add: async (user: User, data: Pick<Patient, 'name'|'dateOfBirth'|'phone'|'gender'|'medicalProfile'|'currentVisit'|'username'|'password'> & Partial<Pick<Patient, 'age'|'email'>>): Promise<string> => {
    const age = data.age ?? (data.dateOfBirth ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / 31557600000) : 0);
    const fullData = { ...data, age };
    const patientId = await pgPatients.create({
      ...fullData,
      hasAccess: true,
      currentVisit: { ...data.currentVisit, visitId: generateId('v') },
      history: [],
      isArchived: false
    });
    return patientId;
  },

  update: async (user: User, patientId: string, data: Partial<Pick<Patient, 'name'|'age'|'dateOfBirth'|'phone'|'gender'|'username'|'email'|'password'|'hasAccess'>>): Promise<void> => {
    const updateData = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    await pgPatients.update(patientId, updateData);
  },

  updateMedicalProfile: async (user: User, patientId: string, medicalProfile: Patient['medicalProfile']): Promise<void> => {
    await pgPatients.update(patientId, { medicalProfile });
  },

  updateVisitData: async (user: User, patient: Patient, data: Partial<VisitData>) => {
    const updatedVisit = { ...patient.currentVisit, ...data };
    await pgPatients.update(patient.id, { currentVisit: updatedVisit });
  },

  updateStatus: async (user: User, patient: Patient, status: VisitData['status'], doctorData?: Partial<VisitData>) => {
    const updatedVisit = { ...patient.currentVisit, status, ...(doctorData || {}) };
    
    if (status === 'completed') {
       // Create invoice with empty items â€” secretary will enter price manually
       await BillingService.create(user, {
           visitId: patient.currentVisit.visitId,
           patientId: patient.id,
           patientName: patient.name,
           items: []
       });
       
       // Move current visit to history and reset currentVisit in ONE update
       const newHistory = [...(patient.history || []), updatedVisit];
       const resetVisit = {
         visitId: '',
         clinicId: '',
         date: 0,
         status: 'waiting' as const,
         priority: 'normal' as const,
         reasonForVisit: '',
         source: 'walk-in' as const
       };
       
       await pgPatients.update(patient.id, { 
         history: newHistory,
         currentVisit: resetVisit
       });
    } else {
      await pgPatients.update(patient.id, { currentVisit: updatedVisit });
    }
  },

  archive: async (user: User, patientId: string) => {
    if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    await pgPatients.update(patientId, { isArchived: true });
  }
};

export const AppointmentService = {
    getAll: async (user: User): Promise<Appointment[]> => {
      const allApps = await pgAppointments.getAll();
      if (user.role === UserRole.DOCTOR) {
        return allApps.filter(a => (a.doctorId === user.uid) || (!a.doctorId && user.clinicIds.includes(a.clinicId)));
      }
      return allApps;
    },

    create: async (user: User, data: Pick<Appointment, 'patientId'|'patientName'|'clinicId'|'doctorId'|'date'|'reason'>) => {
        const newApp: Appointment = {
            id: generateId('app'),
            ...data,
            status: 'scheduled',
            createdAt: Date.now(),
            createdBy: user?.uid || 'system',
            updatedAt: Date.now(),
            updatedBy: user?.uid || 'system',
            isArchived: false
        };
        
        await pgAppointments.create(newApp);
    },

    update: async (user: User, id: string, data: Partial<Pick<Appointment, 'clinicId'|'doctorId'|'date'|'reason'>>) => {
      await pgAppointments.update(id, data);
    },

    updateStatus: async (user: User, id: string, status: Appointment['status']) => {
      await pgAppointments.update(id, { status });
    },
    
    delete: async (user: User, id: string) => {
      await pgAppointments.delete(id);
    },

    checkIn: async (user: User, appointmentId: string) => {
        const allApps = await pgAppointments.getAll();
        const app = allApps.find(a => a.id === appointmentId);
        if (!app) throw new Error("Appointment not found");
        
        const patient = await PatientService.getById(user, app.patientId);
        if (!patient) throw new Error("Patient not found in database");

        const oldHistory = Array.isArray(patient.history) ? patient.history : [];
        const historyToAdd = patient.currentVisit ? [{ ...patient.currentVisit, status: 'completed' as const }] : [];
        
        const newCurrentVisit = {
            visitId: generateId('v_app'),
            clinicId: app.clinicId,
            doctorId: app.doctorId,
            date: Date.now(),
            status: 'waiting' as const,
            priority: 'normal' as const,
            source: 'appointment' as const,
            reasonForVisit: app.reason || 'Appointment'
        };

        await pgAppointments.update(appointmentId, { status: 'checked-in' });
        await pgPatients.update(patient.id, {
          history: [...oldHistory, ...historyToAdd],
          currentVisit: newCurrentVisit
        });
    }
};

export const BillingService = {
    getAll: async (user: User): Promise<Invoice[]> => {
      return await pgInvoices.getAll();
    },

    create: async (user: User, data: Pick<Invoice, 'visitId'|'patientId'|'patientName'|'items'>) => {
        const total = data.items.reduce((sum, item) => sum + item.price, 0);
        const newInvoice: Invoice = {
            id: generateId('inv'),
            ...data,
            totalAmount: total,
            paidAmount: 0,
            status: 'unpaid',
            paymentMethod: 'cash',
            createdAt: Date.now(),
            createdBy: user?.uid || 'system',
            updatedAt: Date.now(),
            updatedBy: user?.uid || 'system',
            isArchived: false
        };
        await pgInvoices.create(newInvoice);
    },

    update: async (user: User, id: string, data: Partial<Invoice>) => {
      await pgInvoices.update(id, data);
    },
    
    processPayment: async (user: User, id: string, amount: number, method: Invoice['paymentMethod'], insuranceData?: { insuranceCompany?: string; patientShare?: number; patientPayMethod?: 'cash' | 'card' }) => {
        const invoices = await pgInvoices.getAll();
        const inv = invoices.find(i => i.id === id);
        if (!inv) throw new Error("Invoice not found");
        
        const newPaid = inv.paidAmount + amount;
        const status = newPaid >= inv.totalAmount ? 'paid' : 'partial';
        
        await pgInvoices.update(id, {
            paidAmount: newPaid,
            status,
            paymentMethod: method,
            ...(insuranceData || {})
        });
    }
};

export const NotificationService = {
    getAll: async (user: User): Promise<Notification[]> => {
        // TODO: implement via API when backend notification endpoints are ready
        return [];
    },
    
    getPendingReminders: async (user: User): Promise<Notification[]> => {
        // TODO: implement via API when backend notification endpoints are ready
        return [];
    },

    create: async (user: User, data: Pick<Notification, 'type'|'title'|'message'|'targetRole'|'relatedPatientId'|'dueDate'>) => {
        // TODO: implement via API when backend notification endpoints are ready
    },

    markAsRead: async (user: User, id: string) => {
        // TODO: implement via API when backend notification endpoints are ready
    }
};

export const SettingsService = {
    getSettings: async (): Promise<SystemSettings> => {
        // TODO: implement via API when backend settings endpoints are ready
        return DEFAULT_SETTINGS;
    },
    
    updateSettings: async (user: User, settings: SystemSettings): Promise<void> => {
        if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized");
        // TODO: implement via API when backend settings endpoints are ready
    }
};
