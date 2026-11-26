import React from 'react';
import type { Metadata } from 'next';
import LandingNavbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import TrustMetricsBar from '@/components/landing/TrustMetricsBar';
import FeatureWalkthrough from '@/components/landing/FeatureWalkthrough';
import BentoFeatures from '@/components/landing/BentoFeatures';
import ComparisonMatrix from '@/components/landing/ComparisonMatrix';
import ArchitecturePrivacy from '@/components/landing/ArchitecturePrivacy';
import FaqAccordion from '@/components/landing/FaqAccordion';
import { FAQ_DATA } from '@/lib/faq-data';
import CtaBanner from '@/components/landing/CtaBanner';
import LandingFooter from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'CannonBench — The Modern HTTP Load & Stress Testing Workbench',
  description:
    'Free, open-source HTTP/1.1 & HTTP/2 load testing workbench powered by Autocannon. Real-time streaming telemetry, p50/p99 latency histograms, automated SLO quality gates, and zero database footprint.',
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
        operatingSystem: 'Cross-platform (Web, Node.js, Docker)',
        applicationCategory: 'DeveloperApplication',
        description:
          'Open-source HTTP load and stress testing workbench powered by Autocannon with real-time streaming telemetry and automated SLO quality gates.',
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
          'Automated SLO / SLA Quality Gates and Root-Cause Diagnostics',
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-indigo-100 selection:text-indigo-950">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <TrustMetricsBar />
        <FeatureWalkthrough />
        <BentoFeatures />
        <ComparisonMatrix />
        <ArchitecturePrivacy />
        <FaqAccordion />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
