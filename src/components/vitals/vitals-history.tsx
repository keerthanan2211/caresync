import { fmtDateTime, toDate } from '@/lib/format';
import type { Vitals } from '@/lib/types';
import { StatusBadge } from '../ui/status-badge';

export function VitalsHistory({ readings }: { readings: Vitals[] }) {
  if (readings.length === 0) return <p className="text-sm text-muted">No vitals recorded yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Vital sign history, newest first</caption>
        <thead className="border-b border-line text-left text-muted">
          <tr>
            {['Recorded', 'BP (mmHg)', 'HR (bpm)', 'Temp (°C)', 'SpO₂ (%)', 'Status', 'By'].map((h) => (
              <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {readings.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-2.5">{fmtDateTime(toDate(v.recordedAt))}</td>
              <td className="px-4 py-2.5">{v.systolic}/{v.diastolic}</td>
              <td className="px-4 py-2.5">{v.heartRate}</td>
              <td className="px-4 py-2.5">{v.temperature.toFixed(1)}</td>
              <td className="px-4 py-2.5">{v.spo2}</td>
              <td className="px-4 py-2.5"><StatusBadge status={v.status} /></td>
              <td className="px-4 py-2.5 text-muted">{v.recordedByName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
