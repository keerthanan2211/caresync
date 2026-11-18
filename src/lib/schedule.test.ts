import { describe, expect, it } from 'vitest';
import { findConflict, overlaps, withinClinicHours } from './schedule';

const at = (h: number, m = 0) => new Date(2026, 11, 1, h, m);

describe('overlaps', () => {
  it('detects overlapping slots', () => {
    expect(overlaps({ start: at(10), durationMin: 30 }, { start: at(10, 15), durationMin: 30 })).toBe(true);
  });
  it('allows back-to-back slots', () => {
    expect(overlaps({ start: at(10), durationMin: 30 }, { start: at(10, 30), durationMin: 30 })).toBe(false);
  });
  it('detects a slot inside another', () => {
    expect(overlaps({ start: at(10), durationMin: 60 }, { start: at(10, 15), durationMin: 15 })).toBe(true);
  });
});

describe('findConflict', () => {
  const existing = [
    { id: 'a', start: at(10), durationMin: 30, status: 'scheduled' as const },
    { id: 'b', start: at(11), durationMin: 30, status: 'cancelled' as const },
  ];

  it('finds a clash with an active booking', () => {
    expect(findConflict({ start: at(10, 15), durationMin: 15 }, existing)?.id).toBe('a');
  });
  it('ignores cancelled bookings', () => {
    expect(findConflict({ start: at(11), durationMin: 30 }, existing)).toBeNull();
  });
  it('ignores the appointment being edited', () => {
    expect(findConflict({ id: 'a', start: at(10), durationMin: 30 }, existing)).toBeNull();
  });
});

describe('withinClinicHours', () => {
  it('accepts slots that end by 18:00', () => {
    expect(withinClinicHours({ start: at(17, 30), durationMin: 30 })).toBe(true);
  });
  it('rejects early starts and late finishes', () => {
    expect(withinClinicHours({ start: at(8, 45), durationMin: 30 })).toBe(false);
    expect(withinClinicHours({ start: at(17, 45), durationMin: 30 })).toBe(false);
  });
});
