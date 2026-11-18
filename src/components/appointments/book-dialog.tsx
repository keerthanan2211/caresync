'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth-store';
import { bookAppointment } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { dateKey } from '@/lib/format';
import { appointmentSchema, type AppointmentInput, type AppointmentValues } from '@/lib/schemas';
import type { Patient } from '@/lib/types';
import { useStaff } from '@/hooks/use-staff';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Field, FormError, Input, Select } from '../ui/field';

export function BookDialog({ open, onClose, patients, patientId }: { open: boolean; onClose: () => void; patients: Patient[]; patientId?: string }) {
  const staff = useAuth((s) => s.staff)!;
  const { doctors } = useStaff();
  const [error, setError] = useState<string | null>(null);
  const preset = patients.find((p) => p.id === patientId);
  const { register, handleSubmit, formState } = useForm<AppointmentInput, unknown, AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patientId: patientId ?? '', doctorId: preset?.primaryDoctorId ?? '', date: dateKey(new Date()), time: '10:00', durationMin: 30, reason: '' },
  });
  const e = formState.errors;

  const onSubmit = async (v: AppointmentValues) => {
    setError(null);
    const patient = patients.find((p) => p.id === v.patientId);
    const doctor = doctors.find((d) => d.id === v.doctorId);
    if (!patient || !doctor) return setError('Choose a patient and a doctor.');
    try {
      await bookAppointment(v, patient.name, doctor, staff.id);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Book an appointment">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Patient" error={e.patientId?.message}>
          {(a) => (
            <Select {...a} {...register('patientId')} disabled={Boolean(patientId)}>
              <option value="">Choose a patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Doctor" error={e.doctorId?.message}>
          {(a) => (
            <Select {...a} {...register('doctorId')}>
              <option value="">Choose a doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" error={e.date?.message}>{(a) => <Input {...a} type="date" min={dateKey(new Date())} {...register('date')} />}</Field>
          <Field label="Time" error={e.time?.message}>{(a) => <Input {...a} type="time" min="09:00" max="17:45" step={900} {...register('time')} />}</Field>
          <Field label="Length">
            {(a) => (
              <Select {...a} {...register('durationMin')}>
                {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Reason for visit" error={e.reason?.message}>{(a) => <Input {...a} placeholder="Follow-up: blood pressure review" {...register('reason')} />}</Field>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Checking availability…' : 'Book appointment'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
