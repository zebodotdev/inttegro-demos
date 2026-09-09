import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { InttegroDemoCheckoutAdapter } from './inttegro-demo-checkout';
import './styles.css';

export const metadata: Metadata = {
  title: 'Kora Market — Inttegro + Next.js',
  description: 'A production-shaped storefront and hosted-checkout integration built with Next.js.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><link rel="stylesheet" href="/checkout-presentations.css" /></head>
      <body>
        {children}
        <InttegroDemoCheckoutAdapter />
        <Script type="module" src="/checkout-presentations.js" strategy="afterInteractive" />
        <Script src="/demo-ui.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
