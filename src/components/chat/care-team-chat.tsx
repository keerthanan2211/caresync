'use client';

import { useEffect, useRef, useState } from 'react';
import { limitToLast, orderBy, query } from 'firebase/firestore';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-store';
import { refs, sendMessage } from '@/lib/db';
import { friendlyError } from '@/lib/errors';
import { fmtDateTime, toDate } from '@/lib/format';
import type { ChatMessage } from '@/lib/types';
import { useLiveQuery } from '@/hooks/use-live';

/** Real-time care-team thread for one patient (Firestore onSnapshot). New messages appear instantly for everyone. */
export function CareTeamChat({ patientId }: { patientId: string }) {
  const staff = useAuth((s) => s.staff)!;
  const { data: messages, loading, error } = useLiveQuery<ChatMessage>(
    query(refs.messages(patientId), orderBy('createdAt'), limitToLast(100)),
    `chat-${patientId}`,
  );
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    setSendError(null);
    try {
      await sendMessage(patientId, body, staff);
    } catch (err) {
      setText(body); // keep what they typed
      setSendError(friendlyError(err));
    }
  };

  return (
    <section aria-labelledby="chat-heading" className="flex h-[480px] flex-col rounded-lg border border-line bg-white">
      <header className="border-b border-line px-4 py-3">
        <h3 id="chat-heading" className="font-bold">Care team chat</h3>
        <p className="text-xs text-muted">Visible to all clinic staff. Updates live.</p>
      </header>
      <ol ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite" aria-label="Messages">
        {loading && <li className="text-sm text-muted">Loading messages…</li>}
        {error && <li role="alert" className="text-sm text-critical">{error}</li>}
        {!loading && messages.length === 0 && <li className="text-sm text-muted">No messages yet. Share an update with the team.</li>}
        {messages.map((m) => {
          const mine = m.authorId === staff.id;
          return (
            <li key={m.id} className={clsx('max-w-[85%]', mine && 'ml-auto text-right')}>
              <p className="text-xs text-muted">
                <span className="font-semibold text-ink">{mine ? 'You' : m.authorName}</span>
                <span className="capitalize"> · {m.authorRole}</span> · {fmtDateTime(toDate(m.createdAt))}
              </p>
              <p className={clsx('mt-1 inline-block whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-left text-sm', mine ? 'bg-plum text-white' : 'bg-canvas')}>{m.text}</p>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="border-t border-line p-3">
        {sendError && <p role="alert" className="mb-2 text-xs text-critical">{sendError}</p>}
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Message the care team</label>
          <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Message the care team"
            className="h-10 flex-1 rounded-md border border-line px-3 text-sm focus:border-plum focus:outline-none" />
          <button type="submit" disabled={!text.trim()} className="h-10 rounded-md bg-plum px-4 text-sm font-semibold text-white hover:bg-plum-dark disabled:opacity-50">Send</button>
        </div>
      </form>
    </section>
  );
}
