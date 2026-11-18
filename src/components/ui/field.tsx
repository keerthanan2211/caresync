import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

const control = 'w-full rounded-md border border-line bg-white px-3 text-sm placeholder:text-muted/70 focus:border-plum focus:outline-none aria-[invalid=true]:border-critical';

type A11y = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string };

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (a11y: A11y) => ReactNode }) {
  const id = useId();
  const msg = `${id}-msg`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error || hint ? msg : undefined })}
      {(error || hint) && (
        <p id={msg} role={error ? 'alert' : undefined} className={clsx('text-xs', error ? 'text-critical' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={clsx(control, 'h-10', className)} {...p} />
));
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={clsx(control, 'h-10', className)} {...p} />
));
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={clsx(control, 'py-2', className)} {...p} />
));
Textarea.displayName = 'Textarea';

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">
      {message}
    </p>
  );
}
