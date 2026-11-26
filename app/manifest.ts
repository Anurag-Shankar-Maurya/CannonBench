import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CannonBench — Autocannon Load & Stress Testing',
    short_name: 'CannonBench',
    description:
      'Modern HTTP/1.1 & HTTP/2 load and stress testing dashboard powered by Autocannon with real-time streaming telemetry and automated SLO quality gates.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#0B0F19',
    theme_color: '#4F46E5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
