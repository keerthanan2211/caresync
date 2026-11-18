import { describe, expect, it } from 'vitest';
import { ageFrom, dateKey } from './format';

describe('ageFrom', () => {
  it('counts completed years only', () => {
    expect(ageFrom('1990-06-15', new Date(2026, 5, 14))).toBe(35);
    expect(ageFrom('1990-06-15', new Date(2026, 5, 15))).toBe(36);
  });
});

describe('dateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
