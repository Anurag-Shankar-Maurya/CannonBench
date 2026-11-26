import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#F8FAFC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://cannonbench.dev'),
  title: {
    default: 'CannonBench — Autocannon HTTP Load Testing Workbench',
    template: '%s | CannonBench',
  },
  description:
    'Open-source HTTP/1.1 and HTTP/2 stress testing workbench powered by Autocannon. Real-time streaming socket telemetry, percentile distributions, automated SLO quality gates, and zero database footprint.',
  keywords: [
    'load testing',
    'stress testing',
    'autocannon',
    'autocannon gui',
    'api benchmark',
    'http benchmarking',
    'p99 latency',
    'developer tools',
    'k6 alternative',
    'postman alternative',
    'jmeter alternative',
    'rest api load testing',
    'http stress testing tool',
    'real-time telemetry',
    'slo quality gates',
  ],
  authors: [{ name: 'CannonBench Team' }],
  creator: 'CannonBench',
  publisher: 'CannonBench',
  category: 'Developer Tools',
  applicationName: 'CannonBench',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://cannonbench.dev',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cannonbench.dev',
    siteName: 'CannonBench',
    title: 'CannonBench — Autocannon HTTP Load Testing Workbench',
    description:
      'Autocannon raw socket performance meets real-time streaming telemetry, binned percentile histograms, and automated SLO gates. Zero database footprint.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CannonBench — Autocannon HTTP Load Testing Workbench',
    description:
      'Autocannon raw socket performance meets real-time streaming telemetry, binned percentile histograms, and automated SLO gates.',
    creator: '@cannonbench',
  },
  other: {
    'page-type': 'software',
    'site-kind': 'software',
    'geo.region': 'US',
    'geo.placename': 'Global Edge',
    'rating': 'general',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-type="software" className="scroll-smooth light">
      <head>
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="Global Edge" />
      </head>
      <body
        className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-indigo-100 selection:text-indigo-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
