'use client';

import Link from 'next/link';
import { orderBy, query, Timestamp, where } from 'firebase/firestore';
import { AppShell } from '@/components/app-shell';
import { AppointmentList } from '@/components/appointments/appointment-list';
import { PageHeader } from '@/components/ui/page';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLiveQuery } from '@/hooks/use-live';
import { useAuth } from '@/lib/auth-store';
import { refs } from '@/lib/db';
import { dateKey, fmtDay } from '@/lib/format';
import type { Appointment, Patient } from '@/lib/types';

function Today() {
  const staff = useAuth((s) => s.staff)!;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);

  const { data: appts } = useLiveQuery<Appointment>(
    query(refs.appointments(), where('start', '>=', Timestamp.fromDate(start)), where('start', '<', Timestamp.fromDate(end)), orderBy('start')),
    `today-${dateKey(start)}`,
  );
  const { data: patients } = useLiveQuery<Patient>(query(refs.patients(), orderBy('name')), 'patients');

  // Patients whose latest reading needs attention, most urgent first
  const flagged = patients
    .filter((p) => p.latestVitals && p.latestVitals.status !== 'normal')
    .sort((a, b) => (a.latestVitals!.status === 'critical' ? -1 : 0) - (b.latestVitals!.status === 'critical' ? -1 : 0));
  const active = appts.filter((a) => a.status !== 'cancelled' && a.status !== 'no-show');
  const waiting = appts.filter((a) => a.status === 'checked-in').length;

  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${staff.name.split(' ')[0]}`} description={fmtDay(new Date())} />

      <dl className="mb-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        <div className="bg-white p-5"><dt className="text-sm text-muted">Appointments today</dt><dd className="mt-1 text-3xl font-bold">{active.length}</dd></div>
        <div className="bg-white p-5"><dt className="text-sm text-muted">Checked in, waiting</dt><dd className="mt-1 text-3xl font-bold">{waiting}</dd></div>
        <div className="bg-white p-5"><dt className="text-sm text-muted">Patients needing attention</dt><dd className="mt-1 text-3xl font-bold">{flagged.length}</dd></div>
      </dl>

      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <section aria-labelledby="schedule">
          <h2 id="schedule" className="mb-3 font-bold">Today’s schedule</h2>
          <AppointmentList appointments={appts} />
        </section>
        <section aria-labelledby="attention">
          <h2 id="attention" className="mb-3 font-bold">Needs attention</h2>
          {flagged.length === 0 ? (
            <p className="text-sm text-muted">No patients with abnormal recent vitals.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-white">
              {flagged.map((p) => (
                <li key={p.id}>
                  <Link href={`/patients/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas">
                    <span className="font-semibold">{p.name}</span>
                    <StatusBadge status={p.latestVitals!.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <Today />
    </AppShell>
  );
}
