import { describe, expect, it } from 'vitest';
import { patientSchema, vitalsSchema } from './schemas';

describe('vitalsSchema', () => {
  const ok = { systolic: '120', diastolic: '80', heartRate: '70', temperature: '36.9', spo2: '98' };

  it('coerces form strings to numbers', () => {
    expect(vitalsSchema.parse(ok)).toMatchObject({ systolic: 120, temperature: 36.9, notes: '' });
  });

  it('catches impossible typos', () => {
    expect(vitalsSchema.safeParse({ ...ok, systolic: '1200' }).success).toBe(false);
  });

  it('requires systolic above diastolic', () => {
    const res = vitalsSchema.safeParse({ ...ok, systolic: '80', diastolic: '90' });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(['diastolic']);
  });
});

describe('patientSchema', () => {
  const base = { name: 'Meera Iyer', dob: '1980-05-02', sex: 'female', phone: '9876543210', bloodGroup: 'O+', allergies: 'Penicillin, peanuts', conditions: '', primaryDoctorId: 'd1' };

  it('splits comma-separated lists', () => {
    const parsed = patientSchema.parse(base);
    expect(parsed.allergies).toEqual(['Penicillin', 'peanuts']);
    expect(parsed.conditions).toEqual([]);
  });

  it('rejects future birth dates and bad phone numbers', () => {
    expect(patientSchema.safeParse({ ...base, dob: '2999-01-01' }).success).toBe(false);
    expect(patientSchema.safeParse({ ...base, phone: '12345' }).success).toBe(false);
  });
});
