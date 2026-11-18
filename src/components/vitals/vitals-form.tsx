'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth-store';
import { recordVitals } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { vitalsSchema, type VitalsInput, type VitalsValues } from '@/lib/schemas';
import { BANDS, METRICS, STATUS_LABEL } from '@/lib/vitals';
import type { VitalStatus } from '@/lib/types';
import { Button } from '../ui/button';
import { Field, FormError, Input, Textarea } from '../ui/field';

export function VitalsForm({ patientId }: { patientId: string }) {
  const staff = useAuth((s) => s.staff)!;
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<VitalStatus | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<VitalsInput, unknown, VitalsValues>({ resolver: zodResolver(vitalsSchema) });

  const onSubmit = async (values: VitalsValues) => {
    setError(null);
    setSaved(null);
    try {
      setSaved(await recordVitals(patientId, values, staff));
      reset();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="record-vitals" className="rounded-lg border border-line bg-white p-5">
      <h3 id="record-vitals" className="font-bold">Record vitals</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {METRICS.map((m) => (
          <Field key={m} label={`${BANDS[m].label} (${BANDS[m].unit})`} error={formState.errors[m]?.message}>
            {(a) => <Input {...a} type="number" inputMode="decimal" step={m === 'temperature' ? '0.1' : '1'} {...register(m)} />}
          </Field>
        ))}
      </div>
      <div className="mt-3">
        <Field label="Notes (optional)">{(a) => <Textarea {...a} rows={2} maxLength={500} {...register('notes')} />}</Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Saving…' : 'Save reading'}</Button>
        {saved && (
          <p role="status" className="text-sm text-muted">
            Saved. Overall status: <strong>{STATUS_LABEL[saved]}</strong>
            {saved !== 'normal' && '. The care team can see this flag on the patient list.'}
          </p>
        )}
      </div>
      <div className="mt-3"><FormError message={error} /></div>
    </form>
  );
}
