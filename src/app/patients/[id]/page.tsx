'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { limit, orderBy, query, where } from 'firebase/firestore';
import { AppShell } from '@/components/app-shell';
import { AppointmentList } from '@/components/appointments/appointment-list';
import { BookDialog } from '@/components/appointments/book-dialog';
import { CareTeamChat } from '@/components/chat/care-team-chat';
import { PatientFormDialog } from '@/components/patients/patient-form';
import { Button } from '@/components/ui/button';
import { ErrorNote, Loading } from '@/components/ui/page';
import { StatusBadge } from '@/components/ui/status-badge';
import { VitalsChart } from '@/components/vitals/vitals-chart';
import { VitalsForm } from '@/components/vitals/vitals-form';
import { VitalsHistory } from '@/components/vitals/vitals-history';
import { useLiveDoc, useLiveQuery } from '@/hooks/use-live';
import { refs } from '@/lib/db';
import { ageFrom } from '@/lib/format';
import type { Appointment, Patient, Vitals } from '@/lib/types';
import { BANDS, flags } from '@/lib/vitals';

function PatientDetail({ id }: { id: string }) {
  const { data: patient, loading, error } = useLiveDoc<Patient>(refs.patient(id), `patient-${id}`);
  const { data: vitals } = useLiveQuery<Vitals>(query(refs.vitals(id), orderBy('recordedAt', 'desc'), limit(30)), `vitals-${id}`);
  const { data: appts } = useLiveQuery<Appointment>(query(refs.appointments(), where('patientId', '==', id), orderBy('start', 'desc'), limit(10)), `appts-${id}`);
  const [editing, setEditing] = useState(false);
  const [booking, setBooking] = useState(false);

  if (loading) return <Loading label="Loading patient…" />;
  if (error) return <ErrorNote message={error} />;
  if (!patient) return <ErrorNote message="This patient record doesn’t exist." />;

  const latest = patient.latestVitals;

  return (
    <>
      <Link href="/patients" className="text-sm text-muted hover:text-ink">All patients</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {ageFrom(patient.dob)} years · <span className="capitalize">{patient.sex}</span> · Blood group {patient.bloodGroup === 'unknown' ? 'unknown' : patient.bloodGroup} · {patient.phone} · Dr {patient.primaryDoctorName.replace(/^Dr\.?\s*/, '')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit details</Button>
          <Button onClick={() => setBooking(true)}>Book appointment</Button>
        </div>
      </div>

      {(patient.allergies.length > 0 || patient.conditions.length > 0) && (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {patient.allergies.length > 0 && (
            <div className="flex gap-2"><dt className="font-semibold text-critical">Allergies:</dt><dd>{patient.allergies.join(', ')}</dd></div>
          )}
          {patient.conditions.length > 0 && (
            <div className="flex gap-2"><dt className="font-semibold">Conditions:</dt><dd>{patient.conditions.join(', ')}</dd></div>
          )}
        </dl>
      )}

      {latest && latest.status !== 'normal' && (
        <p role="note" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm">
          <StatusBadge status={latest.status} />
          Latest reading out of range:{' '}
          {flags(latest).map((f) => `${BANDS[f.metric].label} ${latest[f.metric]} ${BANDS[f.metric].unit}`).join(', ')}
        </p>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <VitalsChart readings={vitals} />
          <VitalsForm patientId={id} />
          <section aria-labelledby="history">
            <h2 id="history" className="mb-3 font-bold">Vitals history</h2>
            <VitalsHistory readings={vitals} />
          </section>
          <section aria-labelledby="visits">
            <h2 id="visits" className="mb-3 font-bold">Appointments</h2>
            <AppointmentList appointments={appts} showPatient={false} />
          </section>
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <CareTeamChat patientId={id} />
        </div>
      </div>

      {editing && <PatientFormDialog open onClose={() => setEditing(false)} patient={patient} />}
      {booking && <BookDialog open onClose={() => setBooking(false)} patients={[patient]} patientId={patient.id} />}
    </>
  );
}

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  return <AppShell><PatientDetail id={id} /></AppShell>;
}
