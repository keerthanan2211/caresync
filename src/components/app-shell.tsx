'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-store';
import { auth } from '@/lib/firebase';
import { Loading } from './ui/page';

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/patients', label: 'Patients' },
  { href: '/appointments', label: 'Appointments' },
];

/** Page frame for signed-in staff. Guests go to /login; accounts without a profile finish signing up first. */
export function AppShell({ children }: { children: ReactNode }) {
  const { status, staff } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (status === 'signed-out') router.replace('/login');
    if (status === 'needs-profile') router.replace('/register');
  }, [status, router]);

  if (status !== 'ready' || !staff) return <Loading label="Checking your sign-in…" />;

  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <rect x="1" y="1" width="20" height="20" rx="6" fill="#6B3FA0" />
              <path d="M5 12h3l2-5 3 9 2-4h2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CareSync
          </Link>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? 'page' : undefined}
              className={clsx('whitespace-nowrap rounded-md px-3 py-2 text-sm', active(n.href) ? 'bg-plum-soft font-semibold text-plum-dark' : 'text-ink hover:bg-canvas')}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 md:absolute md:bottom-0 md:block md:w-full">
          <p className="text-sm font-semibold">{staff.name}</p>
          <p className="text-xs capitalize text-muted">{staff.role}</p>
          <button type="button" onClick={() => signOut(auth)} className="mt-2 text-sm text-muted underline hover:text-ink">
            Sign out
          </button>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        {children}
        <button type="button" onClick={() => signOut(auth)} className="mt-10 text-sm text-muted underline md:hidden">
          Sign out ({staff.name})
        </button>
      </main>
    </div>
  );
}
