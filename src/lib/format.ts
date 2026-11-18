import type { Timestamp } from 'firebase/firestore';

export function ageFrom(dob: string, today = new Date()): number {
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

const dateTime = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const dayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

export const toDate = (ts: Timestamp | null | undefined) => (ts ? ts.toDate() : null);
export const fmtDateTime = (d: Date | null) => (d ? dateTime.format(d) : 'Just now');
export const fmtDay = (d: Date) => dayLabel.format(d);
export const fmtTime = (d: Date) => time.format(d);
export const fmtShortDate = (d: Date) => shortDate.format(d);
export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
