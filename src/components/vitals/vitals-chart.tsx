'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { niceTicks, xPositions, yScale, type ChartBox } from '@/lib/chart';
import { fmtShortDate, toDate } from '@/lib/format';
import { BANDS, classify, METRICS } from '@/lib/vitals';
import type { Vitals, VitalsReading } from '@/lib/types';

const BOX: ChartBox = { width: 640, height: 220, pad: { top: 14, right: 16, bottom: 28, left: 44 } };
const DOT = { normal: '#1E7B4F', watch: '#9A5B0B', critical: '#B42318' };

/**
 * Trend chart for one vital sign. The shaded band is the normal range, so readings that
 * drift out of range are obvious at a glance. A data table follows for screen readers.
 */
export function VitalsChart({ readings }: { readings: Vitals[] }) {
  const [metric, setMetric] = useState<keyof VitalsReading>('systolic');
  const band = BANDS[metric];
  const points = [...readings].reverse().slice(-12); // oldest → newest, last 12
  const xs = xPositions(points.length, BOX);
  const y = (v: number) => yScale(v, band.axis, BOX);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs[i]},${y(p[metric])}`).join(' ');

  return (
    <section aria-labelledby="trend" className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="trend" className="font-bold">Trend</h3>
        <div role="group" aria-label="Choose a vital sign" className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}
              className={clsx('rounded-md px-2.5 py-1 text-xs', metric === m ? 'bg-plum text-white' : 'text-muted hover:bg-canvas')}>
              {BANDS[m].label}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <p className="py-10 text-center text-sm text-muted">Record at least two readings to see a trend.</p>
      ) : (
        <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} className="mt-4 w-full" role="img" aria-label={`${band.label} over the last ${points.length} readings. Normal range ${band.normal[0]} to ${band.normal[1]} ${band.unit}.`}>
          <rect x={BOX.pad.left} width={BOX.width - BOX.pad.left - BOX.pad.right} y={y(band.normal[1])} height={y(band.normal[0]) - y(band.normal[1])} fill="#E6F4EC" />
          {niceTicks(band.axis).map((t) => (
            <g key={t}>
              <line x1={BOX.pad.left} x2={BOX.width - BOX.pad.right} y1={y(t)} y2={y(t)} stroke="#DDE2E8" strokeDasharray="3 3" />
              <text x={BOX.pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5A6474">{t}</text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#6B3FA0" strokeWidth="2" />
          {points.map((p, i) => {
            const d = toDate(p.recordedAt);
            return (
              <g key={p.id}>
                <circle cx={xs[i]} cy={y(p[metric])} r="4.5" fill={DOT[classify(metric, p[metric])]} stroke="white" strokeWidth="1.5" />
                {(i === 0 || i === points.length - 1) && d && (
                  <text x={xs[i]} y={BOX.height - 8} textAnchor={i === 0 ? 'start' : 'end'} fontSize="11" fill="#5A6474">{fmtShortDate(d)}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <p className="mt-2 text-xs text-muted">Shaded area: normal range ({band.normal[0]}–{band.normal[1]} {band.unit}). Reference bands are for demonstration, not clinical use.</p>
    </section>
  );
}
