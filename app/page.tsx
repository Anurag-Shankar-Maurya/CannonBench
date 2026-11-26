import React from 'react';
import type { Metadata } from 'next';
import LandingNavbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import EcosystemLogos from '@/components/landing/EcosystemLogos';
import KineticParadigms from '@/components/landing/KineticParadigms';
import HowItWorksCards from '@/components/landing/HowItWorksCards';
import TransformationStepper from '@/components/landing/TransformationStepper';
import InstallCommandBox from '@/components/landing/InstallCommandBox';
import DesktopShowcase from '@/components/landing/DesktopShowcase';
import FaqGrid from '@/components/landing/FaqGrid';
import RadiantCtaAndFooter from '@/components/landing/RadiantCtaAndFooter';
import { FAQ_DATA } from '@/lib/faq-data';

export const metadata: Metadata = {
  title: 'CannonBench — The Load Testing Workbench for High-Throughput APIs',
  description:
    'Dual-engine HTTP load testing streamed in real-time. Run raw TCP Autocannon sockets or high-precision browser fetch timing with instant percentile histograms, cURL auto-import, and automated SLA regression gates.',
  alternates: {
    canonical: '/',
  },
};

export default function LandingHomePage() {
  // Structured Data (JSON-LD) for Google Rich Snippets & AI Search
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'CannonBench',
        operatingSystem: 'Cross-platform (Web, Node.js, Docker, Linux, macOS, Windows)',
        applicationCategory: 'DeveloperApplication',
        description:
          'Open-source HTTP load and stress testing workbench powered by Autocannon with real-time streaming telemetry and automated SLA quality gates.',
        license: 'https://opensource.org/licenses/MIT',
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
        },
        featureList: [
          'Dual Execution Engines (Native Raw TCP Sockets & Browser Edge fetch)',
          '1-second Real-Time Streaming Telemetry (RPS, Latency, Egress)',
          'Smart cURL Auto-Import with URL/Query Sanitization',
          'Multi-Step Request Chaining with JSONPath variable injection',
          'Automated SLA Quality Gates and Root-Cause Diagnostics',
          'Logarithmic Binned Latency Histograms (p50 to p99.9)',
          'Zero-Database Architecture with local-only persistence',
        ],
      },
      {
        '@type': 'WebSite',
        name: 'CannonBench',
        url: 'https://cannonbench.dev',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://cannonbench.dev/app?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_DATA.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0F172A] flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Search Engine & AI Agent Microdata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navbar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero with radiant horizon, preset pills, and interactive workbench */}
        <HeroSection />

        {/* 2. Ecosystem integration logos */}
        <EcosystemLogos />

        {/* 3. The Draw: Kinetic paradigms vertical scrubber */}
        <KineticParadigms />

        {/* 4. How it works: 3 detailed feature cards */}
        <HowItWorksCards />

        {/* 5. Before and After: 5-stage transformation stepper */}
        <TransformationStepper />

        {/* 6. Install & Run: Tabbed CLI & CI/CD box */}
        <InstallCommandBox />

        {/* 7. Desktop & Workbench app showcase card */}
        <DesktopShowcase />

        {/* 8. Questions: 2-column FAQ grid */}
        <FaqGrid />
      </main>

      {/* 9. Radiant CTA Banner & Dark Footer with Giant Watermark */}
      <RadiantCtaAndFooter />
    </div>
  );
}
