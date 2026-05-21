import { create } from 'zustand';

export interface Patient {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  reportId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Diagnosis {
  id: string;
  reportId: string;
  condition: string;
}

export interface Report {
  id: string;
  patientId: string;
  reportType: string;
  imageUrl: string;
  fileName: string;
  rawOcrText: string | null;
  aiSummary: any;
  riskLevel: string | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  medicines?: Medicine[];
  diagnoses?: Diagnosis[];
}

export interface Caregiver {
  id: string;
  caregiverId: string;
  name: string;
  email: string;
  relationship: string;
  status: 'active' | 'pending';
  permissions: {
    canViewReports: boolean;
    canViewLocation: boolean;
    canMessage: boolean;
    canInviteOthers: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DataState {
  patients: Patient[];
  reports: Report[];
  caregivers: Caregiver[];
  notifications: Notification[];
  selectedPatientId: string | null;

  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  removePatient: (id: string) => void;

  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;

  setCaregivers: (caregivers: Caregiver[]) => void;
  addCaregiver: (caregiver: Caregiver) => void;
  removeCaregiver: (id: string) => void;

  setNotifications: (notifications: Notification[]) => void;
  markNotificationAsRead: (id: string) => void;

  setSelectedPatientId: (id: string | null) => void;
  clear: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  patients: [],
  reports: [],
  caregivers: [],
  notifications: [],
  selectedPatientId: null,

  setPatients: (patients) => set({ patients }),
  addPatient: (patient) => set((state) => ({
    patients: [patient, ...state.patients]
  })),
  removePatient: (id) => set((state) => ({
    patients: state.patients.filter(p => p.id !== id)
  })),

  setReports: (reports) => set({ reports }),
  addReport: (report) => set((state) => ({
    reports: [report, ...state.reports]
  })),

  setCaregivers: (caregivers) => set({ caregivers }),
  addCaregiver: (caregiver) => set((state) => ({
    caregivers: [caregiver, ...state.caregivers]
  })),
  removeCaregiver: (id) => set((state) => ({
    caregivers: state.caregivers.filter(c => c.id !== id)
  })),

  setNotifications: (notifications) => set({ notifications }),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    )
  })),

  setSelectedPatientId: (selectedPatientId) => set({ selectedPatientId }),

  clear: () => set({
    patients: [],
    reports: [],
    caregivers: [],
    notifications: [],
    selectedPatientId: null,
  }),
}));
