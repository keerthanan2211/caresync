'use client';

import type { User } from 'firebase/auth';
import { create } from 'zustand';
import type { Staff } from './types';

type Status = 'loading' | 'signed-out' | 'needs-profile' | 'ready';

interface AuthState {
  status: Status;
  user: User | null;
  staff: Staff | null;
  set: (s: Partial<AuthState>) => void;
}

/** Signed-in Firebase user plus their staff profile (name and role). Filled by <AuthListener />. */
export const useAuth = create<AuthState>((set) => ({ status: 'loading', user: null, staff: null, set }));
