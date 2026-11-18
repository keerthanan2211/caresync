import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import { AuthListener } from '@/components/auth-listener';
import './globals.css';

const publicSans = Public_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-public', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'CareSync', template: '%s · CareSync' },
  description: 'Clinic dashboard for patient records, vital signs, appointments and care-team chat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className="font-sans">
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
