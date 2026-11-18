'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { savePatient } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { patientSchema, type PatientInput, type PatientValues } from '@/lib/schemas';
import type { Patient } from '@/lib/types';
import { useStaff } from '@/hooks/use-staff';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Field, FormError, Input, Select } from '../ui/field';

const BLOOD = ['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function PatientFormDialog({ open, onClose, patient }: { open: boolean; onClose: () => void; patient?: Patient }) {
  const { doctors } = useStaff();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<PatientInput, unknown, PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          name: patient.name,
          dob: patient.dob,
          sex: patient.sex,
          phone: patient.phone,
          bloodGroup: patient.bloodGroup as PatientInput['bloodGroup'],
          allergies: patient.allergies.join(', '),
          conditions: patient.conditions.join(', '),
          primaryDoctorId: patient.primaryDoctorId,
        }
      : { name: '', dob: '', sex: 'female', phone: '', bloodGroup: 'unknown', allergies: '', conditions: '', primaryDoctorId: '' },
  });
  const e = formState.errors;

  const onSubmit = async (values: PatientValues) => {
    setError(null);
    try {
      const id = await savePatient(values, doctors, patient?.id);
      onClose();
      if (!patient) router.push(`/patients/${id}`);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={patient ? 'Edit patient' : 'Add a patient'} wide>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Full name" error={e.name?.message}>{(a) => <Input {...a} autoFocus {...register('name')} />}</Field>
        </div>
        <Field label="Date of birth" error={e.dob?.message}>{(a) => <Input {...a} type="date" {...register('dob')} />}</Field>
        <Field label="Sex">
          {(a) => (
            <Select {...a} {...register('sex')}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          )}
        </Field>
        <Field label="Phone" error={e.phone?.message}>{(a) => <Input {...a} type="tel" inputMode="tel" {...register('phone')} />}</Field>
        <Field label="Blood group">
          {(a) => (
            <Select {...a} {...register('bloodGroup')}>
              {BLOOD.map((b) => <option key={b} value={b}>{b === 'unknown' ? 'Unknown' : b}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Allergies" hint="Separate with commas" error={e.allergies?.message}>{(a) => <Input {...a} placeholder="Penicillin, latex" {...register('allergies')} />}</Field>
        <Field label="Conditions" hint="Separate with commas" error={e.conditions?.message}>{(a) => <Input {...a} placeholder="Type 2 diabetes" {...register('conditions')} />}</Field>
        <div className="sm:col-span-2">
          <Field label="Primary doctor" error={e.primaryDoctorId?.message}>
            {(a) => (
              <Select {...a} {...register('primaryDoctorId')}>
                <option value="">Choose a doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <div className="sm:col-span-2"><FormError message={error} /></div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Saving…' : patient ? 'Save changes' : 'Add patient'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
