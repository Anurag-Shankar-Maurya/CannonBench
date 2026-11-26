import type { Metadata } from 'next';
import CannonBenchApp from '@/components/CannonBenchApp';

export const metadata: Metadata = {
  title: 'Workbench — HTTP Load & Stress Testing Dashboard',
  description:
    'Interactive HTTP/1.1 & HTTP/2 load testing workbench with real-time streaming telemetry, percentile distributions, cURL auto-import, and SLO quality gates.',
  alternates: {
    canonical: '/app',
  },
};

export default function AppWorkbenchPage() {
  return <CannonBenchApp />;
}
