import { FirebaseError } from 'firebase/app';

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Use a password of at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your connection, or start the Firebase emulators.',
  'permission-denied': 'You don’t have permission to do that, or some details are invalid.',
  unavailable: 'The database is offline. Changes will sync when the connection returns.',
};

export function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) return MESSAGES[err.code] ?? err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}
