
import { Clinic, Patient, User, UserRole, AuditMetadata } from '../types';

/**
 * MOCK DATABASE ADAPTER (DAL) - HIGH PERFORMANCE MODE
 * Delays removed to ensure UI/Storage consistency (Single Source of Truth).
 */

// --- Safe Storage Helper ---
const memoryStore: Record<string, string> = {};

const getLocalStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return storage;
  } catch (e) {
    return null;
  }
};

const storageImpl = getLocalStorage();

const safeStorage = {
  getItem: (key: string): string | null => {
    if (!storageImpl) return memoryStore[key] || null;
    try { return storageImpl.getItem(key); } 
    catch (e) { return memoryStore[key] || null; }
  },
  setItem: (key: string, value: string): void => {
    if (!storageImpl) { memoryStore[key] = value; return; }
    try { storageImpl.setItem(key, value); } 
    catch (e) { memoryStore[key] = value; }
  },
  removeItem: (key: string): void => {
    if (!storageImpl) { delete memoryStore[key]; return; }
    try { storageImpl.removeItem(key); } 
    catch (e) { delete memoryStore[key]; }
  }
};

// --- Persistence Helpers ---
const load = <T>(key: string, def: T): T => {
  const s = safeStorage.getItem(key);
  return s ? JSON.parse(s) : def;
}
const save = (key: string, data: any) => safeStorage.setItem(key, JSON.stringify(data));

// --- Seed Data (UPDATED WITH STRICT CATEGORIZATION) ---
const SEED_CLINICS: Clinic[] = [
  // 1. PATIENT-FACING CLINICS
  { id: 'c_dental', name: 'Dental Clinic', type: 'Dental', category: 'clinic', active: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  { id: 'c_gp', name: 'General Medicine', type: 'Medical', category: 'clinic', active: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  { id: 'c_laser', name: 'Laser Clinic', type: 'Cosmetic', category: 'clinic', active: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  { id: 'c_cosmetic', name: 'Cosmetic Clinic', type: 'Cosmetic', category: 'clinic', active: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  
  // 2. BACK-OFFICE / OPERATIONAL DEPARTMENTS
];

// Updated Users to test STRICT ISOLATION
const SEED_USERS: User[] = [
  // 1. Admin & Secretary (See ALL)
  { uid: 'sec_1', email: 'reception@medcore.com', name: 'Sarah Reception', role: UserRole.SECRETARY, clinicIds: [], isActive: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  
  // 2. Dentist (Sees Dental Clinic)
  { uid: 'doc_dental', email: 'drmahmud@medcore.com', name: 'Dr. Mahmud', role: UserRole.DOCTOR, clinicIds: ['c_dental'], isActive: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
  
  // 3. GP Doctor (Sees General Medicine only)
  { uid: 'doc_gp', email: 'gp@medcore.com', name: 'Dr. General', role: UserRole.DOCTOR, clinicIds: ['c_gp'], isActive: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },

  // 4. Cosmetic Doctor (Sees Laser + Cosmetic)
  { uid: 'doc_beauty', email: 'beauty@medcore.com', name: 'Dr. Beauty', role: UserRole.DOCTOR, clinicIds: ['c_laser', 'c_cosmetic'], isActive: true, createdAt: Date.now(), createdBy: 'system', updatedAt: Date.now(), updatedBy: 'system' },
];

class MockAdapter {
  private patientListeners: ((data: Patient[]) => void)[] = [];
  
  constructor() {
    // FORCE RESET: Update drmahmud user if exists with wrong clinicIds
    const users = load<User[]>('medcore_users', []);
    const drmahmud = users.find(u => u.email === 'drmahmud@medcore.com');
    
    if (!drmahmud || !drmahmud.clinicIds || drmahmud.clinicIds.length === 0) {
        console.warn("⚠️ Detected drmahmud with missing/wrong clinicIds. Refreshing Seed Data.");
        save('medcore_users', SEED_USERS);
        save('medcore_clinics', SEED_CLINICS);
    }
    
    // Ensure seeding
    if (!load('medcore_clinics', null)) save('medcore_clinics', SEED_CLINICS);
    if (!load('medcore_users', null)) save('medcore_users', SEED_USERS);
  }

  // --- Synchronous IO disguised as Async ---
  
  // Synchronous version for all services to use
  getCollection<T>(collection: string): T[] {
    return load<T[]>(`medcore_${collection}`, []);
  }

  async writeDocument<T extends { id?: string; uid?: string }>(collection: string, data: T): Promise<void> {
    const list = load<T[]>(`medcore_${collection}`, []);
    const getItemId = (item: any) => item.id || item.uid;
    const dataId = getItemId(data);
    const idx = list.findIndex(i => getItemId(i) === dataId);
    
    if (idx >= 0) {
      list[idx] = data; // Update
    } else {
      list.unshift(data); // Create
    }
    
    save(`medcore_${collection}`, list);
    
    if (collection === 'patients') this.notifyPatients();
  }

  // Additional methods required by services.ts
  add<T extends { id?: string; uid?: string }>(collection: string, data: T): void {
    const list = load<T[]>(`medcore_${collection}`, []);
    list.unshift(data);
    save(`medcore_${collection}`, list);
    if (collection === 'patients') this.notifyPatients();
  }

  update<T extends { id?: string; uid?: string }>(collection: string, id: string, data: T): void {
    const list = load<T[]>(`medcore_${collection}`, []);
    const idx = list.findIndex((i: any) => (i.id === id || i.uid === id));
    if (idx >= 0) {
      list[idx] = data;
      save(`medcore_${collection}`, list);
      if (collection === 'patients') this.notifyPatients();
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    const list = load<any[]>(`medcore_${collection}`, []);
    const filtered = list.filter(i => (i.id !== id && i.uid !== id));
    save(`medcore_${collection}`, filtered);
    
    if (collection === 'patients') this.notifyPatients();
  }

  // --- Realtime Hooks ---
  subscribeToPatients(callback: (data: Patient[]) => void): () => void {
    const data = load<Patient[]>('medcore_patients', []);
    callback(data);
    this.patientListeners.push(callback);
    return () => {
      this.patientListeners = this.patientListeners.filter(l => l !== callback);
    };
  }

  private notifyPatients() {
    const data = load<Patient[]>('medcore_patients', []);
    this.patientListeners.forEach(l => l(data));
  }

  // --- Auth Simulation ---
  async authSignIn(email: string): Promise<User> {
    await new Promise(r => setTimeout(r, 300));
    const users = load<User[]>('medcore_users', []);
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("Invalid credentials");
    if (!user.isActive) throw new Error("Account disabled");
    save('medcore_session', user);
    return user;
  }

  async authSignOut() {
    safeStorage.removeItem('medcore_session');
  }

  getSession(): User | null {
    return load<User | null>('medcore_session', null);
  }

  setSession(user: User) {
    save('medcore_session', user);
  }

  getAllUsers(): User[] {
    return load<User[]>('medcore_users', []);
  }

  saveUser(user: User): void {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    save('medcore_users', users);
  }
}

export const mockDb = new MockAdapter();
