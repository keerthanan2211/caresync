import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { findConflict, withinClinicHours } from './schedule';
import type { AppointmentValues, PatientValues, VitalsValues } from './schemas';
import type { Appointment, AppointmentStatus, Role, Staff } from './types';
import { overallStatus } from './vitals';

export const refs = {
  staff: () => collection(db, 'staff'),
  patients: () => collection(db, 'patients'),
  patient: (id: string) => doc(db, 'patients', id),
  vitals: (patientId: string) => collection(db, 'patients', patientId, 'vitals'),
  messages: (patientId: string) => collection(db, 'patients', patientId, 'messages'),
  appointments: () => collection(db, 'appointments'),
};

export function createStaffProfile(uid: string, data: { name: string; email: string; role: Role }) {
  return setDoc(doc(db, 'staff', uid), { ...data, createdAt: serverTimestamp() });
}

export async function savePatient(values: PatientValues, doctors: Staff[], id?: string) {
  const doctor = doctors.find((d) => d.id === values.primaryDoctorId);
  const data = { ...values, primaryDoctorName: doctor?.name ?? 'Unknown' };
  if (id) return updateDoc(refs.patient(id), data).then(() => id);
  const created = await addDoc(refs.patients(), { ...data, latestVitals: null, createdAt: serverTimestamp() });
  return created.id;
}

/**
 * Records vitals and updates the patient's "latest vitals" summary in ONE atomic batch,
 * so the patient list and the vitals history can never disagree.
 */
export async function recordVitals(patientId: string, values: VitalsValues, by: Staff) {
  const reading = {
    systolic: values.systolic,
    diastolic: values.diastolic,
    heartRate: values.heartRate,
    temperature: values.temperature,
    spo2: values.spo2,
  };
  const status = overallStatus(reading);
  const batch = writeBatch(db);
  batch.set(doc(refs.vitals(patientId)), {
    ...reading,
    status,
    notes: values.notes.trim(),
    recordedAt: serverTimestamp(),
    recordedBy: by.id,
    recordedByName: by.name,
  });
  batch.update(refs.patient(patientId), { latestVitals: { ...reading, status, recordedAt: serverTimestamp() } });
  await batch.commit();
  return status;
}

export class BookingError extends Error {}

export async function bookAppointment(values: AppointmentValues, patientName: string, doctor: Staff, createdBy: string) {
  const start = new Date(`${values.date}T${values.time}`);
  const proposed = { start, durationMin: values.durationMin };

  if (start < new Date()) throw new BookingError('Choose a time in the future.');
  if (!withinClinicHours(proposed)) throw new BookingError('Appointments must be between 09:00 and 18:00.');

  // Check the doctor's bookings that day for clashes
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const sameDay = await getDocs(
    query(
      refs.appointments(),
      where('doctorId', '==', doctor.id),
      where('start', '>=', Timestamp.fromDate(dayStart)),
      where('start', '<', Timestamp.fromDate(dayEnd)),
    ),
  );
  const existing = sameDay.docs.map((d) => {
    const a = d.data() as Appointment;
    return { id: d.id, start: a.start.toDate(), durationMin: a.durationMin, status: a.status };
  });
  if (findConflict(proposed, existing)) {
    throw new BookingError(`${doctor.name} already has an appointment at that time. Choose another slot.`);
  }

  await addDoc(refs.appointments(), {
    patientId: values.patientId,
    patientName,
    doctorId: doctor.id,
    doctorName: doctor.name,
    start: Timestamp.fromDate(start),
    durationMin: values.durationMin,
    reason: values.reason,
    status: 'scheduled',
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function setAppointmentStatus(id: string, status: AppointmentStatus) {
  return updateDoc(doc(db, 'appointments', id), { status, updatedAt: serverTimestamp() });
}

export function sendMessage(patientId: string, text: string, by: Staff) {
  return addDoc(refs.messages(patientId), {
    text: text.trim(),
    authorId: by.id,
    authorName: by.name,
    authorRole: by.role,
    createdAt: serverTimestamp(),
  });
}
