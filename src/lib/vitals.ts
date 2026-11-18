import type { VitalStatus, VitalsReading } from './types';

/**
 * Adult reference bands used to flag readings for attention.
 * Simplified from early-warning scoring for demonstration; not for clinical use.
 */
export interface Band {
  label: string;
  unit: string;
  normal: [number, number];
  watch: [number, number]; // outside this range is critical
  axis: [number, number]; // chart y-axis range
}

export const BANDS: Record<keyof VitalsReading, Band> = {
  systolic: { label: 'Systolic BP', unit: 'mmHg', normal: [101, 139], watch: [91, 179], axis: [70, 200] },
  diastolic: { label: 'Diastolic BP', unit: 'mmHg', normal: [60, 89], watch: [51, 119], axis: [40, 130] },
  heartRate: { label: 'Heart rate', unit: 'bpm', normal: [51, 90], watch: [41, 130], axis: [30, 150] },
  temperature: { label: 'Temperature', unit: '°C', normal: [36.1, 38.0], watch: [35.1, 39.0], axis: [34, 41] },
  spo2: { label: 'SpO₂', unit: '%', normal: [96, 100], watch: [92, 100], axis: [85, 100] },
};

export const METRICS = Object.keys(BANDS) as (keyof VitalsReading)[];

const RANK: Record<VitalStatus, number> = { normal: 0, watch: 1, critical: 2 };

export function classify(metric: keyof VitalsReading, value: number): VitalStatus {
  const { normal, watch } = BANDS[metric];
  if (value >= normal[0] && value <= normal[1]) return 'normal';
  if (value >= watch[0] && value <= watch[1]) return 'watch';
  return 'critical';
}

/** The overall status is the worst individual reading. */
export function overallStatus(reading: VitalsReading): VitalStatus {
  return METRICS.map((m) => classify(m, reading[m])).reduce((worst, s) => (RANK[s] > RANK[worst] ? s : worst), 'normal');
}

/** Which metrics are out of the normal range, for a short summary like "SpO₂ 91% critical". */
export function flags(reading: VitalsReading): { metric: keyof VitalsReading; status: VitalStatus }[] {
  return METRICS.map((metric) => ({ metric, status: classify(metric, reading[metric]) })).filter((f) => f.status !== 'normal');
}

export const STATUS_LABEL: Record<VitalStatus, string> = { normal: 'Normal', watch: 'Watch', critical: 'Critical' };
