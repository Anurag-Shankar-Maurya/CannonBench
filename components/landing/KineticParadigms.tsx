'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface BenchPattern {
  id: string;
  name: string;
  tag: string;
  detail: string;
  metric: string;
}

const PATTERNS: BenchPattern[] = [
  {
    id: 'cold-start',
    name: 'The cold-start hammer',
    tag: 'Zero-traffic burst',
    detail: 'Bursts dormant serverless functions from 0 to 500 connections in 200ms to expose cold init penalties and un-warmed database pools.',
    metric: 'Handshake latency penalty',
  },
  {
    id: 'soak',
    name: 'Sustained soak test',
    tag: 'Leak detection',
    detail: 'Maintains a constant throughput over prolonged durations to uncover garbage collection pauses, memory creep, and socket leaks.',
    metric: 'Memory degradation rate',
  },
  {
    id: 'spike',
    name: 'Spike and recovery',
    tag: 'Elastic resilience',
    detail: 'Injects sudden 10x traffic spikes followed by sharp drop-offs to observe queue backpressure, circuit breaking, and auto-scaler lag.',
    metric: 'Autoscale stabilization time',
  },
  {
    id: 'p99-budget',
    name: 'P99 tail-latency budget',
    tag: 'Strict SLA gate',
    detail: 'Enforces strict millisecond tail-latency budgets, flagging builds when the slowest 1% of requests drift beyond SLA thresholds.',
    metric: 'Customer perceived delay',
  },
  {
    id: 'tcp-reuse',
    name: 'TCP connection reuse',
    tag: 'Keep-alive efficiency',
    detail: 'Benchmarks persistent HTTP keep-alive sockets against raw TCP handshakes to isolate TLS overhead on client ingress proxies.',
    metric: 'TLS handshake reduction',
  },
  {
    id: 'zero-alloc',
    name: 'Zero-allocation streaming',
    tag: 'SSE pipeline',
    detail: 'Evaluates real-time Server-Sent Events throughput with zero memory buffer duplication or event loop stalling.',
    metric: 'Buffer allocation overhead',
  },
  {
    id: 'browser-parity',
    name: 'Browser socket parity',
    tag: 'Real client timing',
    detail: 'Executes identical benchmarks via browser fetch() and Resource Timing to detect browser-specific connection limits.',
    metric: 'Client pool congestion',
  },
  {
    id: 'ci-gate',
    name: 'Automated CI regression gate',
    tag: 'Headless enforcement',
    detail: 'Outputs machine-readable JSON metrics and non-zero exit codes to block pull requests before performance regressions hit production.',
    metric: 'Pull request pass rate',
  },
  {
    id: 'pipelined',
    name: 'Pipelined socket saturation',
    tag: 'HTTP/1.1 pipelining',
    detail: 'Pumps pipelined request batches through single sockets to measure head-of-line blocking resilience in upstream proxies.',
    metric: 'Multiplexing throughput',
  },
  {
    id: 'quiet-instrument',
    name: 'The quiet instrument',
    tag: 'Zero telemetry tax',
    detail: 'Measures high-frequency microservice transactions with sub-microsecond timer overhead and zero runtime memory allocation.',
    metric: 'Profiling probe impact',
  },
  {
    id: 'pool-exhaust',
    name: 'Connection pool exhaustion',
    tag: 'Database saturation',
    detail: 'Drives concurrent request concurrency beyond connection pool limits to benchmark backpressure rejection behavior.',
    metric: 'Queue rejection speed',
  },
  {
    id: 'gc-pause',
    name: 'Garbage collection pause',
    tag: 'V8 heap profiling',
    detail: 'Analyzes latency spikes produced by V8 major mark-sweep garbage collection pauses under high allocations.',
    metric: 'Max stop-the-world delay',
  },
  {
    id: 'renegotiation',
    name: 'Session renegotiation',
    tag: 'TLS session cache',
    detail: 'Measures TLS session ticket resumption speed under aggressive client reconnect storms.',
    metric: 'Crypto CPU utilization',
  },
  {
    id: 'timeout-cascade',
    name: 'Timeout cascade collapse',
    tag: 'Circuit breaker trip',
    detail: 'Simulates deep RPC downstream dependency latency to verify circuit breaker trip timing and fail-fast isolation.',
    metric: 'Fail-fast recovery time',
  },
  {
    id: 'jit-warmup',
    name: 'JIT warmup stabilization',
    tag: 'Cold code path analysis',
    detail: 'Compares cold-start execution against warm JIT optimized code paths across tens of thousands of iterations.',
    metric: 'Optimization ramp curve',
  },
  {
    id: 'buffer-overflow',
    name: 'Buffer backpressure drain',
    tag: 'Socket high-watermark',
    detail: 'Monitors TCP socket highWaterMark drain events during massive uncompressed JSON ingestion payloads.',
    metric: 'Socket drain latency',
  },
  {
    id: 'queue-drain',
    name: 'Asynchronous queue drain',
    tag: 'Event loop health',
    detail: 'Tracks Node.js libuv event loop latency delay while processing high-concurrency background job dispatch.',
    metric: 'Event loop lag delta',
  },
  {
    id: 'h2-multiplex',
    name: 'HTTP/2 stream concurrency',
    tag: 'Multiplexing limits',
    detail: 'Evaluates single-socket stream concurrency limits and frame parsing overhead under load.',
    metric: 'Concurrent stream capacity',
  },
  {
    id: 'thread-starve',
    name: 'Thread pool starvation',
    tag: 'Worker exhaustion',
    detail: 'Simulates heavy cryptographic and hashing computations to benchmark worker thread pool scheduling under load.',
    metric: 'Thread queue wait time',
  },
  {
    id: 'ping-burst',
    name: 'Zero-payload ping burst',
    tag: 'Raw network ceiling',
    detail: 'Executes minimal HTTP OPTIONS health checks to measure raw network stack and NIC packet processing limits.',
    metric: 'Peak packet handling',
  },
];

const CYLINDER_RADIUS = 210; // Radius in px of the 3D cylinder
const ANGLE_STEP_DEG = 22; // Degrees between items around the cylinder

export default function KineticParadigms() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(3); // Default to P99
  const [manualOffset, setManualOffset] = useState<number | null>(null);

  // Generous scroll track for smooth, unhurried drum rolling
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Gradually hide heading, eyebrow tag, and sub-heading with fade & slide up on scroll
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.05], [0, -42]);

  // Map scroll progress across all 20 patterns once heading has cleanly disappeared
  const rawProgress = useTransform(
    scrollYProgress,
    [0.06, 0.96],
    [0, PATTERNS.length - 1]
  );

  // Tuned spring physics for natural mechanical drum roll inertia
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 60,
    damping: 18,
    mass: 0.7,
    restDelta: 0.001,
  });

  const [currentFloat, setCurrentFloat] = useState(3);

  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      if (manualOffset === null) {
        const clamped = Math.max(0, Math.min(PATTERNS.length - 1, latest));
        setCurrentFloat(clamped);
        setActiveIndex(Math.round(clamped));
      }
    });
  }, [smoothProgress, manualOffset]);

  const handleStepSelect = (index: number) => {
    setManualOffset(index);
    setActiveIndex(index);
    setCurrentFloat(index);
    setTimeout(() => {
      setManualOffset(null);
    }, 1200);
  };

  const handlePrev = () => {
    const nextIndex = activeIndex > 0 ? activeIndex - 1 : PATTERNS.length - 1;
    handleStepSelect(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = activeIndex < PATTERNS.length - 1 ? activeIndex + 1 : 0;
    handleStepSelect(nextIndex);
  };

  const activePattern = PATTERNS[activeIndex];

  return (
    <section
      id="patterns"
      ref={containerRef}
      className="relative min-h-[320vh] bg-[#FAF8F5] border-b border-slate-200/80"
    >
      {/* Section Header with Gradual Fade and Up Scroll Animation */}
      <div className="pt-20 pb-8 text-center max-w-4xl mx-auto px-4 select-none pointer-events-none">
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Draw</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            Twenty testing patterns. One workbench.
          </h2>
          <p className="mt-2 text-slate-500 text-xs sm:text-sm">
            Scroll to roll through high-concurrency API testing archetypes.
          </p>
        </motion.div>
      </div>

      {/* Sticky Viewport Stage with generous edge-to-edge breathing room */}
      <div className="sticky top-16 h-[calc(100vh-5rem)] max-h-[780px] flex flex-col justify-between py-6 w-full overflow-hidden select-none">
        {/* 3D Cylindrical Drum Reel Stage */}
        <div
          className="relative w-full h-[480px] flex items-center justify-center my-auto overflow-hidden"
          style={{ perspective: 1100 }}
        >
          {/* Edge-to-Edge Hairline Guideline Slot with Inward Calipers */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[68px] border-y border-slate-300/80 bg-[radial-gradient(ellipse_75%_100%_at_50%_50%,_rgba(249,115,22,0.14)_0%,_transparent_100%)] pointer-events-none z-20 flex items-center justify-between px-6 sm:px-14 lg:px-24">
            {/* Left Caliper: "4 of 20 ▶" (Inward pointing triangle) */}
            <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm font-semibold text-slate-700 pointer-events-auto">
              <span>
                {activeIndex + 1} of {PATTERNS.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                className="text-orange-600 hover:text-orange-500 transition-transform active:scale-90 p-1"
                aria-label="Previous pattern"
              >
                <span className="text-xs sm:text-sm font-bold">▶</span>
              </button>
            </div>

            {/* Right Caliper: "◀ Descriptor" (Inward pointing triangle) */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 pointer-events-auto">
              <button
                type="button"
                onClick={handleNext}
                className="text-orange-600 hover:text-orange-500 transition-transform active:scale-90 p-1"
                aria-label="Next pattern"
              >
                <span className="text-xs sm:text-sm font-bold">◀</span>
              </button>
              <span className="font-semibold text-slate-900 truncate max-w-[170px] sm:max-w-xs">
                {activePattern.tag}
              </span>
            </div>
          </div>

          {/* Symmetrical 3D Cylindrical Barrel */}
          <div
            className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {PATTERNS.map((item, index) => {
              const distance = index - currentFloat;
              const absDistance = Math.abs(distance);

              // Don't render items that have rotated past the back hemisphere of the cylinder
              if (absDistance > 5.2) return null;

              // Cylindrical angle in radians and degrees
              const angleDeg = distance * ANGLE_STEP_DEG;
              const angleRad = (angleDeg * Math.PI) / 180;

              // Cylindrical projection coordinates:
              // Y position follows the sine of the angle (compresses symmetrically toward both poles)
              const y = Math.sin(angleRad) * CYLINDER_RADIUS;

              // Z depth follows cosine (recedes symmetrically into negative Z away from center)
              const z = (Math.cos(angleRad) - 1) * CYLINDER_RADIUS * 0.9;

              // Tangent rotation around X-axis: bends symmetrically on the cylinder surface
              const rotateX = -angleDeg;

              // Natural vertical foreshortening (cosVal drops as items curve away)
              // Note: scale is strictly <= 1, no artificial ballooning.
              const cosVal = Math.max(0.1, Math.cos(angleRad));
              const scaleY = cosVal;
              const scaleX = 1;

              // Smooth cosine opacity: 1 at equator, fades as it curves around the cylinder
              const opacity = Math.max(0.04, Math.pow(cosVal, 1.7));

              // Colors matching reference: vibrant orange at equator, ink gray near, light gray far
              const isCenter = absDistance < 0.45;
              let color = '#EA580C';

              if (isCenter) {
                color = '#EA580C'; // Active vibrant orange
              } else if (absDistance < 1.4) {
                color = '#475569'; // Mid ink slate
              } else if (absDistance < 2.5) {
                color = '#94A3B8'; // Receding gray
              } else {
                color = '#CBD5E1'; // Faint horizon gray
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleStepSelect(index)}
                  className="absolute cursor-pointer select-none transition-colors duration-100 whitespace-nowrap text-center focus:outline-none px-6"
                  style={{
                    transform: `translate3d(0, ${y}px, ${z}px) rotateX(${rotateX}deg) scale(${scaleX}, ${scaleY})`,
                    opacity,
                    color,
                    zIndex: isCenter ? 30 : Math.round(20 - absDistance),
                  }}
                >
                  <span
                    className={`font-display tracking-tight block text-2xl sm:text-3xl lg:text-4xl ${
                      isCenter ? 'font-extrabold' : 'font-semibold'
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Details Footer Bar with wide padding */}
        <div className="max-w-5xl mx-auto w-full px-6 sm:px-12 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-mono flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-900">{activePattern.name}:</span>
            <span className="text-slate-500">{activePattern.detail}</span>
          </div>

          <Link
            href="/app"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm"
          >
            <span>Open Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
