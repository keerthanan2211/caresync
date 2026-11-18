import { z } from 'zod';

const list = z
  .string()
  .max(500)
  .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20));

export const patientSchema = z.object({
  name: z.string().trim().min(2, 'Enter the patient’s full name').max(100),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date of birth')
    .refine((d) => new Date(d) <= new Date(), 'Date of birth can’t be in the future'),
  sex: z.enum(['female', 'male', 'other']),
  phone: z.string().trim().regex(/^\+?\d{10,14}$/, 'Enter a 10-digit phone number'),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']),
  allergies: list,
  conditions: list,
  primaryDoctorId: z.string().min(1, 'Choose a primary doctor'),
});
export type PatientInput = z.input<typeof patientSchema>;
export type PatientValues = z.output<typeof patientSchema>;

// Wide "plausible measurement" limits catch typos (e.g. 1200 instead of 120); the clinical bands live in vitals.ts
const reading = (label: string, min: number, max: number) =>
  z.coerce.number({ invalid_type_error: `Enter ${label}` }).min(min, `${label} looks too low (min ${min})`).max(max, `${label} looks too high (max ${max})`);

export const vitalsSchema = z
  .object({
    systolic: reading('systolic pressure', 50, 260),
    diastolic: reading('diastolic pressure', 30, 160),
    heartRate: reading('heart rate', 20, 250),
    temperature: reading('temperature', 30, 44),
    spo2: reading('SpO₂', 50, 100),
    notes: z.string().max(500).default(''),
  })
  .refine((v) => v.systolic > v.diastolic, { message: 'Systolic must be higher than diastolic', path: ['diastolic'] });
export type VitalsInput = z.input<typeof vitalsSchema>;
export type VitalsValues = z.output<typeof vitalsSchema>;

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Choose a patient'),
  doctorId: z.string().min(1, 'Choose a doctor'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time'),
  durationMin: z.coerce.number().refine((n) => [15, 30, 45, 60].includes(n)),
  reason: z.string().trim().min(2, 'Add a short reason for the visit').max(200),
});
export type AppointmentInput = z.input<typeof appointmentSchema>;
export type AppointmentValues = z.output<typeof appointmentSchema>;
