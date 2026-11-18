import type { Timestamp } from 'firebase/firestore';

export type Role = 'doctor' | 'nurse';
export type VitalStatus = 'normal' | 'watch' | 'critical';
export type AppointmentStatus = 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface VitalsReading {
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  spo2: number;
}

export interface Patient {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  sex: 'female' | 'male' | 'other';
  phone: string;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  primaryDoctorId: string;
  primaryDoctorName: string;
  latestVitals?: (VitalsReading & { status: VitalStatus; recordedAt: Timestamp }) | null;
  createdAt: Timestamp;
}

export interface Vitals extends VitalsReading {
  id: string;
  status: VitalStatus;
  notes: string;
  recordedAt: Timestamp | null; // null for a moment while the server timestamp is pending
  recordedBy: string;
  recordedByName: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  start: Timestamp;
  durationMin: 15 | 30 | 45 | 60;
  reason: string;
  status: AppointmentStatus;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: Timestamp | null;
}
