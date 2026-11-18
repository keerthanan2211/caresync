'use client';

import { useState } from 'react';
import { orderBy, query, Timestamp, where } from 'firebase/firestore';
import { AppShell } from '@/components/app-shell';
import { AppointmentList } from '@/components/appointments/appointment-list';
import { BookDialog } from '@/components/appointments/book-dialog';
import { Button } from '@/components/ui/button';
import { ErrorNote, Loading, PageHeader } from '@/components/ui/page';
import { useLiveQuery } from '@/hooks/use-live';
import { useStaff } from '@/hooks/use-staff';
import { refs } from '@/lib/db';
import { dateKey } from '@/lib/format';
import type { Appointment, Patient } from '@/lib/types';

function Appointments() {
  const { doctors } = useStaff();
  const [doctorId, setDoctorId] = useState('');
  const [booking, setBooking] = useState(false);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 7 * 86_400_000);

  const filters = [where('start', '>=', Timestamp.fromDate(from)), where('start', '<', Timestamp.fromDate(to))];
  const q = doctorId
    ? query(refs.appointments(), where('doctorId', '==', doctorId), ...filters, orderBy('start'))
    : query(refs.appointments(), ...filters, orderBy('start'));
  const { data: appts, loading, error } = useLiveQuery<Appointment>(q, `appts-${dateKey(from)}-${doctorId}`);
  const { data: patients } = useLiveQuery<Patient>(query(refs.patients(), orderBy('name')), 'patients');

  return (
    <>
      <PageHeader title="Appointments" description="The next 7 days." action={<Button onClick={() => setBooking(true)}>Book appointment</Button>} />
      <label htmlFor="doctor-filter" className="mb-1.5 block text-sm font-semibold">Doctor</label>
      <select id="doctor-filter" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
        className="mb-6 h-10 w-full max-w-xs rounded-md border border-line bg-white px-3 text-sm focus:border-plum focus:outline-none">
        <option value="">All doctors</option>
        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {loading && <Loading label="Loading appointments…" />}
      {error && <ErrorNote message={error} />}
      {!loading && !error && <AppointmentList appointments={appts} />}
      {booking && <BookDialog open onClose={() => setBooking(false)} patients={patients} />}
    </>
  );
}

export default function AppointmentsPage() {
  return <AppShell><Appointments /></AppShell>;
}
