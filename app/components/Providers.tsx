'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ThemeProvider } from 'next-themes';

export default function Providers({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class">
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
} 