import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './styles.css';

export const metadata: Metadata = {
  title: 'Kora Market — Inttegro + Next.js',
  description: 'A production-shaped storefront and hosted-checkout integration built with Next.js.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<script src="/demo-ui.js" defer /></body>
    </html>
  );
}
