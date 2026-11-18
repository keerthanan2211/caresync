'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

/** Native <dialog>: focus trapping, Escape to close and screen-reader semantics built in. */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="dialog-title" className={clsx('w-[calc(100%-2rem)] rounded-xl border border-line p-0 text-ink shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id="dialog-title" className="text-lg font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-line/60 hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
