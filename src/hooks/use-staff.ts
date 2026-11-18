'use client';

import { orderBy, query } from 'firebase/firestore';
import { refs } from '@/lib/db';
import type { Staff } from '@/lib/types';
import { useLiveQuery } from './use-live';

export function useStaff() {
  const { data, ...rest } = useLiveQuery<Staff>(query(refs.staff(), orderBy('name')), 'staff');
  return { staff: data, doctors: data.filter((s) => s.role === 'doctor'), ...rest };
}
