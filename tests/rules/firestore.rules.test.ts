/**
 * Security rules tests. They run against the Firestore emulator:  npm run test:rules
 * These prove the database itself enforces access, whatever a client sends.
 */
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const patient = {
  name: 'Meera Iyer',
  dob: '1980-05-02',
  sex: 'female',
  phone: '9876543210',
  bloodGroup: 'O+',
  allergies: [],
  conditions: [],
  primaryDoctorId: 'doc',
  primaryDoctorName: 'Dr Rao',
  latestVitals: null,
};

const vitals = (by: string) => ({
  systolic: 120, diastolic: 80, heartRate: 72, temperature: 36.8, spo2: 98,
  status: 'normal', notes: '', recordedBy: by, recordedByName: 'x', recordedAt: serverTimestamp(),
});

const as = (uid: string, email = `${uid}@caresync.dev`) => env.authenticatedContext(uid, { email }).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-caresync',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  // Seed with rules disabled: one doctor, one nurse and a patient
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'staff/doc'), { name: 'Dr Rao', email: 'doc@caresync.dev', role: 'doctor' });
    await setDoc(doc(db, 'staff/nurse'), { name: 'Priya', email: 'nurse@caresync.dev', role: 'nurse' });
    await setDoc(doc(db, 'patients/p1'), { ...patient, createdAt: Timestamp.now() });
  });
});

describe('staff profiles', () => {
  it('lets a new user create their own profile', async () => {
    await assertSucceeds(setDoc(doc(as('new'), 'staff/new'), { name: 'New Nurse', email: 'new@caresync.dev', role: 'nurse', createdAt: serverTimestamp() }));
  });
  it('blocks invented roles and profiles for someone else', async () => {
    await assertFails(setDoc(doc(as('new'), 'staff/new'), { name: 'Hacker', email: 'new@caresync.dev', role: 'admin', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('new'), 'staff/other'), { name: 'Other', email: 'new@caresync.dev', role: 'nurse', createdAt: serverTimestamp() }));
  });
  it('never lets anyone change their own role', async () => {
    await assertFails(updateDoc(doc(as('nurse'), 'staff/nurse'), { role: 'doctor' }));
  });
});

describe('patients', () => {
  it('hides patient data from signed-out users and non-staff accounts', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'patients/p1')));
    await assertFails(getDoc(doc(as('stranger'), 'patients/p1')));
  });
  it('lets staff read and create valid patients', async () => {
    await assertSucceeds(getDoc(doc(as('nurse'), 'patients/p1')));
    await assertSucceeds(addDoc(collection(as('nurse'), 'patients'), { ...patient, createdAt: serverTimestamp() }));
  });
  it('rejects invalid patient data', async () => {
    await assertFails(addDoc(collection(as('nurse'), 'patients'), { ...patient, dob: 'yesterday', createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(as('nurse'), 'patients'), { ...patient, primaryDoctorId: 'ghost', createdAt: serverTimestamp() }));
  });
  it('only lets doctors delete patients', async () => {
    await assertFails(deleteDoc(doc(as('nurse'), 'patients/p1')));
    await assertSucceeds(deleteDoc(doc(as('doc'), 'patients/p1')));
  });
});

describe('vitals', () => {
  it('records vitals attributed to the signed-in staff member', async () => {
    await assertSucceeds(addDoc(collection(as('nurse'), 'patients/p1/vitals'), vitals('nurse')));
  });
  it('blocks recording vitals in someone else’s name or with impossible values', async () => {
    await assertFails(addDoc(collection(as('nurse'), 'patients/p1/vitals'), vitals('doc')));
    await assertFails(addDoc(collection(as('nurse'), 'patients/p1/vitals'), { ...vitals('nurse'), spo2: 140 }));
  });
  it('keeps vitals append-only', async () => {
    const ref = await addDoc(collection(as('nurse'), 'patients/p1/vitals'), vitals('nurse'));
    await assertFails(updateDoc(doc(as('nurse'), ref.path), { systolic: 200 }));
  });
});

describe('care-team chat', () => {
  it('lets staff post as themselves only, and never edit history', async () => {
    const db = as('nurse');
    const ref = await assertSucceeds(addDoc(collection(db, 'patients/p1/messages'), { text: 'BP rechecked', authorId: 'nurse', authorName: 'Priya', authorRole: 'nurse', createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(db, 'patients/p1/messages'), { text: 'Spoofed', authorId: 'doc', authorName: 'Dr Rao', authorRole: 'doctor', createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, ref.path), { text: 'edited' }));
  });
});

describe('appointments', () => {
  const appt = (by: string) => ({
    patientId: 'p1', patientName: 'Meera Iyer', doctorId: 'doc', doctorName: 'Dr Rao',
    start: Timestamp.fromDate(new Date(Date.now() + 86_400_000)), durationMin: 30, reason: 'Review',
    status: 'scheduled', createdBy: by, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  it('books valid appointments and only allows status changes afterwards', async () => {
    const db = as('nurse');
    const ref = await assertSucceeds(addDoc(collection(db, 'appointments'), appt('nurse')));
    await assertSucceeds(updateDoc(doc(db, ref.path), { status: 'checked-in', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, ref.path), { doctorId: 'nurse' }));
  });
  it('rejects odd durations and bookings for unknown patients', async () => {
    await assertFails(addDoc(collection(as('nurse'), 'appointments'), { ...appt('nurse'), durationMin: 20 }));
    await assertFails(addDoc(collection(as('nurse'), 'appointments'), { ...appt('nurse'), patientId: 'ghost' }));
  });
});
