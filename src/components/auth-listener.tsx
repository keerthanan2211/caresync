'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-store';
import { auth, db } from '@/lib/firebase';
import type { Staff } from '@/lib/types';

/** Keeps the auth store in sync with Firebase Auth and the signed-in user's staff profile. */
export function AuthListener() {
  const set = useAuth((s) => s.set);

  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      if (!user) {
        set({ status: 'signed-out', user: null, staff: null });
        return;
      }
      stopProfile = onSnapshot(
        doc(db, 'staff', user.uid),
        (snap) =>
          set(
            snap.exists()
              ? { status: 'ready', user, staff: { id: snap.id, ...(snap.data() as Omit<Staff, 'id'>) } }
              : { status: 'needs-profile', user, staff: null },
          ),
        () => set({ status: 'needs-profile', user, staff: null }),
      );
    });
    return () => {
      stopAuth();
      stopProfile?.();
    };
  }, [set]);

  return null;
}
