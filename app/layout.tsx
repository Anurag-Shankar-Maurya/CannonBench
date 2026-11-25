import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Public_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CannonBench — Autocannon Load & Stress Testing',
  description:
    'Lightweight HTTP/1.1 & HTTP/2 load and stress testing platform powered by Autocannon with live streaming telemetry, HAR replay, bottleneck diagnostics, and run-to-run comparisons.',
  openGraph: {
    title: 'CannonBench — Autocannon Load & Stress Testing',
    description:
      'Lightweight HTTP/1.1 & HTTP/2 load and stress testing platform powered by Autocannon.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CannonBench — Autocannon Load & Stress Testing',
    description:
      'Lightweight HTTP/1.1 & HTTP/2 load and stress testing platform powered by Autocannon.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
