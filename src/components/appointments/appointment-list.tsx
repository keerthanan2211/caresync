'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { setAppointmentStatus } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { dateKey, fmtDay, fmtTime } from '@/lib/format';
import { NEXT_STATUS } from '@/lib/schedule';
import type { Appointment, AppointmentStatus } from '@/lib/types';

const LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  'checked-in': 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No-show',
};
const ACTION: Partial<Record<AppointmentStatus, string>> = { 'checked-in': 'Check in', completed: 'Complete', cancelled: 'Cancel', 'no-show': 'No-show' };

export function AppointmentList({ appointments, showPatient = true }: { appointments: Appointment[]; showPatient?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  if (appointments.length === 0) return <p className="text-sm text-muted">No appointments.</p>;

  const days = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const k = dateKey(a.start.toDate());
    days.set(k, [...(days.get(k) ?? []), a]);
  }

  const update = (id: string, status: AppointmentStatus) => setAppointmentStatus(id, status).catch((e) => setError(friendlyError(e)));

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-critical">{error}</p>}
      {[...days].map(([key, list]) => (
        <section key={key} aria-label={fmtDay(list[0].start.toDate())}>
          <h3 className="mb-2 text-sm font-bold">{fmtDay(list[0].start.toDate())}</h3>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {list.map((a) => {
              const inactive = a.status === 'cancelled' || a.status === 'no-show';
              return (
                <li key={a.id} className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3', inactive && 'opacity-60')}>
                  <span className="w-20 font-semibold tabular-nums">{fmtTime(a.start.toDate())}</span>
                  <div className="min-w-0 flex-1">
                    {showPatient && <Link href={`/patients/${a.patientId}`} className="font-semibold hover:underline">{a.patientName}</Link>}
                    <p className="text-sm text-muted">{a.reason} · {a.durationMin} min · {a.doctorName}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted">{LABEL[a.status]}</span>
                  <div className="flex gap-2">
                    {NEXT_STATUS[a.status].map((s) => (
                      <button key={s} type="button" onClick={() => update(a.id, s)}
                        className={clsx('h-8 rounded-md px-3 text-xs font-semibold', s === 'cancelled' || s === 'no-show' ? 'text-muted hover:bg-canvas' : 'border border-line hover:border-plum')}>
                        {ACTION[s]}<span className="sr-only"> {a.patientName} at {fmtTime(a.start.toDate())}</span>
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
