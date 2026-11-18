import clsx from 'clsx';
import { STATUS_LABEL } from '@/lib/vitals';
import type { VitalStatus } from '@/lib/types';

const tone: Record<VitalStatus, string> = {
  normal: 'bg-normal-soft text-normal',
  watch: 'bg-watch-soft text-watch',
  critical: 'bg-critical-soft text-critical',
};

/** Shape + text + colour, so status is readable for colour-blind users too: ● normal, ▲ watch, ■ critical. */
function Shape({ status }: { status: VitalStatus }) {
  if (status === 'normal') return <circle cx="5" cy="5" r="4" fill="currentColor" />;
  if (status === 'watch') return <path d="M5 1l4 8H1z" fill="currentColor" />;
  return <rect x="1" y="1" width="8" height="8" fill="currentColor" />;
}

export function StatusBadge({ status, children }: { status: VitalStatus; children?: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', tone[status])}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <Shape status={status} />
      </svg>
      {children ?? STATUS_LABEL[status]}
    </span>
  );
}
