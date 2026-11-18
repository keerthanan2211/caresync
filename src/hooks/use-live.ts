'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, type DocumentReference, type Query } from 'firebase/firestore';
import { friendlyError } from '@/lib/errors';

interface Live<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to a Firestore query with onSnapshot, so the UI updates in real time
 * whenever anyone changes the data. Pass `null` to wait (e.g. until an id is known).
 * `key` must change whenever the query changes.
 */
export function useLiveQuery<T>(q: Query | null, key: string): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!q) return;
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as T), loading: false, error: null }),
      (err) => setState({ data: [], loading: false, error: friendlyError(err) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

export function useLiveDoc<T>(ref: DocumentReference | null, key: string): Live<T | null> {
  const [state, setState] = useState<Live<T | null>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!ref) return;
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? ({ id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } as T) : null, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: friendlyError(err) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
