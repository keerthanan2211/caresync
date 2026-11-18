'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-store';
import { createStaffProfile } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { Field, FormError, Input, Select } from './ui/field';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  role: z.enum(['doctor', 'nurse']),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type Values = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // A signed-in account without a staff profile only needs to finish the profile
  const finishingProfile = mode === 'register' && status === 'needs-profile' && Boolean(user);
  const isRegister = mode === 'register';

  useEffect(() => {
    if (status === 'ready') router.replace('/');
  }, [status, router]);

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(finishingProfile ? registerSchema.pick({ name: true, role: true }) : isRegister ? registerSchema : loginSchema) as never,
    defaultValues: { name: '', role: 'nurse', email: '', password: '' },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      if (!isRegister) {
        await signInWithEmailAndPassword(auth, v.email, v.password);
        return;
      }
      const account = finishingProfile ? user! : (await createUserWithEmailAndPassword(auth, v.email, v.password)).user;
      await createStaffProfile(account.uid, { name: v.name.trim(), role: v.role, email: account.email! });
    } catch (err) {
      setServerError(friendlyError(err));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">{isRegister ? (finishingProfile ? 'Finish your profile' : 'Create a staff account') : 'Sign in to CareSync'}</h1>
        <p className="mt-1 text-sm text-muted">For clinic doctors and nurses.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
          {isRegister && (
            <>
              <Field label="Full name" error={errors.name?.message}>
                {(a) => <Input {...a} autoComplete="name" {...register('name')} />}
              </Field>
              <Field label="Role">
                {(a) => (
                  <Select {...a} {...register('role')}>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                  </Select>
                )}
              </Field>
            </>
          )}
          {!finishingProfile && (
            <>
              <Field label="Work email" error={errors.email?.message}>
                {(a) => <Input {...a} type="email" autoComplete="email" {...register('email')} />}
              </Field>
              <Field label="Password" error={errors.password?.message} hint={isRegister ? 'At least 8 characters' : undefined}>
                {(a) => <Input {...a} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} {...register('password')} />}
              </Field>
            </>
          )}
          <FormError message={serverError} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        {!finishingProfile && (
          <p className="mt-6 text-sm text-muted">
            {isRegister ? 'Already have an account? ' : 'New to the clinic? '}
            <Link href={isRegister ? '/login' : '/register'} className="font-semibold text-plum hover:underline">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        )}
        {!isRegister && <p className="mt-3 text-xs text-muted">Demo: dr.rao@caresync.dev or nurse.priya@caresync.dev, password Care#2026</p>}
      </div>
    </main>
  );
}
