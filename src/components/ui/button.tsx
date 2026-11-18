import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const styles: Record<Variant, string> = {
  primary: 'bg-plum text-white hover:bg-plum-dark',
  secondary: 'border border-line bg-white text-ink hover:border-plum',
  ghost: 'text-muted hover:bg-line/60 hover:text-ink',
  danger: 'text-critical hover:bg-critical-soft',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ variant = 'primary', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx('inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', styles[variant], className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
