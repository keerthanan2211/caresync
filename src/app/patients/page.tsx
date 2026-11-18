'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { orderBy, query } from 'firebase/firestore';
import { AppShell } from '@/components/app-shell';
import { PatientFormDialog } from '@/components/patients/patient-form';
import { Button } from '@/components/ui/button';
import { ErrorNote, Loading, PageHeader } from '@/components/ui/page';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLiveQuery } from '@/hooks/use-live';
import { refs } from '@/lib/db';
import { ageFrom, fmtDateTime, toDate } from '@/lib/format';
import type { Patient } from '@/lib/types';

function Patients() {
  const { data: patients, loading, error } = useLiveQuery<Patient>(query(refs.patients(), orderBy('name')), 'patients');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q)) : patients;
  }, [patients, search]);

  return (
    <>
      <PageHeader title="Patients" description="Everyone registered at the clinic." action={<Button onClick={() => setAdding(true)}>Add patient</Button>} />
      <label htmlFor="patient-search" className="sr-only">Search patients by name or phone</label>
      <input id="patient-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone"
        className="mb-4 h-10 w-full max-w-sm rounded-md border border-line bg-white px-3 text-sm focus:border-plum focus:outline-none" />

      {loading && <Loading label="Loading patients…" />}
      {error && <ErrorNote message={error} />}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Patients</caption>
            <thead className="border-b border-line text-left text-muted">
              <tr>
                {['Name', 'Age / sex', 'Primary doctor', 'Last vitals', 'Status'].map((h) => <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">{search ? 'No patients match your search.' : 'No patients yet. Add the first one.'}</td></tr>
              )}
              {shown.map((p) => (
                <tr key={p.id} className="hover:bg-canvas">
                  <td className="px-4 py-3"><Link href={`/patients/${p.id}`} className="font-semibold hover:underline">{p.name}</Link></td>
                  <td className="px-4 py-3">{ageFrom(p.dob)} · <span className="capitalize">{p.sex}</span></td>
                  <td className="px-4 py-3">{p.primaryDoctorName}</td>
                  <td className="px-4 py-3 text-muted">{p.latestVitals ? fmtDateTime(toDate(p.latestVitals.recordedAt)) : 'None yet'}</td>
                  <td className="px-4 py-3">{p.latestVitals ? <StatusBadge status={p.latestVitals.status} /> : <span className="text-muted">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PatientFormDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

export default function PatientsPage() {
  return <AppShell><Patients /></AppShell>;
}
