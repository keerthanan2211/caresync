import type { AppointmentStatus } from './types';

export interface Slot {
  id?: string;
  start: Date;
  durationMin: number;
  status?: AppointmentStatus;
}

const end = (s: Slot) => s.start.getTime() + s.durationMin * 60_000;

/** Two slots overlap if each starts before the other ends. Back-to-back slots don't overlap. */
export function overlaps(a: Slot, b: Slot): boolean {
  return a.start.getTime() < end(b) && b.start.getTime() < end(a);
}

/** Returns the first active booking that clashes with the proposed slot, ignoring cancelled and no-show visits. */
export function findConflict(proposed: Slot, existing: Slot[]): Slot | null {
  return (
    existing.find((s) => s.id !== proposed.id && s.status !== 'cancelled' && s.status !== 'no-show' && overlaps(proposed, s)) ?? null
  );
}

/** Clinic hours 09:00–18:00; appointments must finish by closing time. */
export function withinClinicHours(slot: Slot): boolean {
  const startMin = slot.start.getHours() * 60 + slot.start.getMinutes();
  return startMin >= 9 * 60 && startMin + slot.durationMin <= 18 * 60;
}

export const NEXT_STATUS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['completed'],
  completed: [],
  cancelled: [],
  'no-show': [],
};
