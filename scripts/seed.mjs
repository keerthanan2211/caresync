/**
 * Seeds the Firebase EMULATOR with demo staff, patients, vitals, appointments and chat.
 * Start the emulators first (npm run emulators), then: npm run seed
 * Logins: dr.rao@caresync.dev, dr.khan@caresync.dev, nurse.priya@caresync.dev (password Care#2026)
 */
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const { initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

initializeApp({ projectId: 'demo-caresync' });
const auth = getAuth();
const db = getFirestore();

const STAFF = [
  { uid: 'dr-rao', name: 'Dr Anil Rao', email: 'dr.rao@caresync.dev', role: 'doctor' },
  { uid: 'dr-khan', name: 'Dr Sara Khan', email: 'dr.khan@caresync.dev', role: 'doctor' },
  { uid: 'nurse-priya', name: 'Priya Nair', email: 'nurse.priya@caresync.dev', role: 'nurse' },
];

const PATIENTS = [
  { id: 'p-meera', name: 'Meera Iyer', dob: '1968-03-14', sex: 'female', phone: '9840012345', bloodGroup: 'B+', allergies: ['Penicillin'], conditions: ['Hypertension'], doctor: 0, trend: 'bp-high' },
  { id: 'p-arjun', name: 'Arjun Menon', dob: '1990-11-02', sex: 'male', phone: '9884456789', bloodGroup: 'O+', allergies: [], conditions: [], doctor: 0, trend: 'normal' },
  { id: 'p-lakshmi', name: 'Lakshmi Sundaram', dob: '1949-07-21', sex: 'female', phone: '9500098765', bloodGroup: 'A-', allergies: ['Sulfa drugs'], conditions: ['COPD', 'Type 2 diabetes'], doctor: 1, trend: 'low-spo2' },
  { id: 'p-rahul', name: 'Rahul Verma', dob: '2001-01-30', sex: 'male', phone: '9123456780', bloodGroup: 'AB+', allergies: [], conditions: ['Asthma'], doctor: 1, trend: 'fever' },
  { id: 'p-fatima', name: 'Fatima Sheikh', dob: '1985-09-09', sex: 'female', phone: '9988776655', bloodGroup: 'O-', allergies: ['Latex'], conditions: [], doctor: 0, trend: 'normal' },
];

// Simple local copy of the app's classification (src/lib/vitals.ts)
const BANDS = {
  systolic: [[101, 139], [91, 179]], diastolic: [[60, 89], [51, 119]], heartRate: [[51, 90], [41, 130]],
  temperature: [[36.1, 38.0], [35.1, 39.0]], spo2: [[96, 100], [92, 100]],
};
const statusOf = (r) => {
  let worst = 0;
  for (const [k, [n, w]] of Object.entries(BANDS)) {
    const v = r[k];
    const s = v >= n[0] && v <= n[1] ? 0 : v >= w[0] && v <= w[1] ? 1 : 2;
    worst = Math.max(worst, s);
  }
  return ['normal', 'watch', 'critical'][worst];
};

function reading(trend, i) {
  const j = (n) => Math.round((Math.random() - 0.5) * n);
  const base = { systolic: 118 + j(8), diastolic: 76 + j(6), heartRate: 72 + j(8), temperature: Math.round((36.7 + (Math.random() - 0.5) * 0.4) * 10) / 10, spo2: 98 - Math.abs(j(2)) };
  if (trend === 'bp-high') return { ...base, systolic: 132 + i * 6 + j(4), diastolic: 84 + i * 3 };
  if (trend === 'low-spo2') return { ...base, spo2: 96 - i, heartRate: 88 + i * 4 };
  if (trend === 'fever') return { ...base, temperature: Math.round((37.2 + i * 0.4) * 10) / 10, heartRate: 84 + i * 5 };
  return base;
}

for (const s of STAFF) {
  await auth.createUser({ uid: s.uid, email: s.email, password: 'Care#2026', displayName: s.name }).catch(() => {});
  await db.doc(`staff/${s.uid}`).set({ name: s.name, email: s.email, role: s.role, createdAt: Timestamp.now() });
}

const now = Date.now();
for (const p of PATIENTS) {
  const doctor = STAFF[p.doctor];
  let latest = null;
  for (let i = 0; i < 6; i++) {
    const r = reading(p.trend, i);
    const recordedAt = Timestamp.fromMillis(now - (5 - i) * 2 * 86_400_000);
    const status = statusOf(r);
    await db.collection(`patients/${p.id}/vitals`).add({ ...r, status, notes: '', recordedAt, recordedBy: STAFF[2].uid, recordedByName: STAFF[2].name });
    latest = { ...r, status, recordedAt };
  }
  const { doctor: _d, trend: _t, id, ...fields } = p;
  await db.doc(`patients/${id}`).set({ ...fields, primaryDoctorId: doctor.uid, primaryDoctorName: doctor.name, latestVitals: latest, createdAt: Timestamp.now() });
}

const today = new Date();
const slot = (dayOffset, h, m) => Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, h, m));
const APPTS = [
  ['p-meera', 0, 0, 10, 0, 'Blood pressure review', 'checked-in'],
  ['p-arjun', 0, 0, 10, 30, 'Annual check-up', 'scheduled'],
  ['p-lakshmi', 1, 0, 11, 0, 'Breathing difficulty follow-up', 'scheduled'],
  ['p-rahul', 1, 0, 15, 30, 'Fever, 3 days', 'scheduled'],
  ['p-fatima', 0, 1, 9, 30, 'Prenatal consultation', 'scheduled'],
  ['p-meera', 0, 3, 12, 0, 'Medication adjustment', 'scheduled'],
];
for (const [pid, d, off, h, m, reason, status] of APPTS) {
  const p = PATIENTS.find((x) => x.id === pid);
  await db.collection('appointments').add({
    patientId: pid, patientName: p.name, doctorId: STAFF[d].uid, doctorName: STAFF[d].name,
    start: slot(off, h, m), durationMin: 30, reason, status, createdBy: STAFF[2].uid, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
}

const chat = [
  ['nurse-priya', 'BP was 162/96 this morning, repeated after 10 minutes: 158/94. Patient reports mild headache.'],
  ['dr-rao', 'Thanks. Please keep her for a recheck at 11 and hold the next dose until I review.'],
  ['nurse-priya', 'Will do. Recheck scheduled.'],
];
for (const [i, [uid, text]] of chat.entries()) {
  const s = STAFF.find((x) => x.uid === uid);
  await db.collection('patients/p-meera/messages').add({ text, authorId: uid, authorName: s.name, authorRole: s.role, createdAt: Timestamp.fromMillis(now - (3 - i) * 600_000) });
}

console.log('Seeded 3 staff, 5 patients with vitals, 6 appointments and a care-team chat.');
console.log('Sign in with dr.rao@caresync.dev / Care#2026');
process.exit(0);
