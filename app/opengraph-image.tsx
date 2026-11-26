import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CannonBench — The Modern HTTP Load & Stress Testing Workbench';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0B0F19',
          backgroundImage:
            'radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.18) 0%, transparent 45%)',
          padding: '60px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top Brand Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
              CannonBench
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#818CF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Autocannon Load Testing Workbench
            </span>
          </div>
        </div>

        {/* Center Main Punchline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
          <h1
            style={{
              fontSize: '62px',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              margin: 0,
              color: '#FFFFFF',
            }}
          >
            Terminal Socket Speed.{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #818CF8 0%, #38BDF8 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Visual Telemetry.
            </span>
          </h1>

          <p
            style={{
              fontSize: '24px',
              color: '#94A3B8',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Real-time 1-sec streaming telemetry, binned latency histograms, and automated SLO quality gates. Zero-DB privacy.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
            }}
          >
            <span style={{ color: '#34D399', fontSize: '18px' }}>●</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>100% Autocannon Parity</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
            }}
          >
            <span style={{ color: '#818CF8', fontSize: '18px' }}>⚡</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>Dual Socket Engines</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
            }}
          >
            <span style={{ color: '#38BDF8', fontSize: '18px' }}>🛡️</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>Zero Database Storage</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
            }}
          >
            <span style={{ color: '#FCD34D', fontSize: '18px' }}>★</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>100% MIT Open Source</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
