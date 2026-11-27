'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface Step {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 'adhoc',
    number: 1,
    title: 'The ad-hoc script',
    subtitle: 'Uncontrolled shell loops',
    description:
      'Running curl in a bash while loop or firing unmeasured scripts. Requests silently drop, client CPU bottlenecks skew numbers, and there is zero tail-latency visibility.',
  },
  {
    id: 'pooling',
    number: 2,
    title: 'Controlled socket pools',
    subtitle: 'Multiplexing & keep-alive',
    description:
      'Dedicated connection pools reuse TCP sockets with persistent keep-alive, isolating connection overhead from real application response latency.',
  },
  {
    id: 'percentiles',
    number: 3,
    title: 'Unbiased percentiles',
    subtitle: 'True HDR histograms',
    description:
      'Moving beyond meaningless average response times to high-dynamic-range histograms that expose p90, p99, and max tail-latency outliers.',
  },
  {
    id: 'telemetry',
    number: 4,
    title: 'Live visual telemetry',
    subtitle: 'Zero-overhead SSE streams',
    description:
      'Real-time throughput curves and error classification stream continuously over Server-Sent Events to spot degradation as it happens.',
  },
  {
    id: 'quality-gate',
    number: 5,
    title: 'The last 10%: SLA quality gates',
    subtitle: 'Automated CI regression blocking',
    description:
      'Automated budgets that compare p99 latency against your SLA. Pull requests that introduce latency regressions are blocked before reaching production.',
  },
];

export default function TransformationStepper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [manualOffset, setManualOffset] = useState<number | null>(null);

  // Scroll driven animation across the 250vh track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress across the 5 steps
  const stepProgress = useTransform(
    scrollYProgress,
    [0.08, 0.92],
    [0, STEPS.length - 1]
  );

  const smoothStep = useSpring(stepProgress, {
    stiffness: 85,
    damping: 20,
    restDelta: 0.001,
  });

  useEffect(() => {
    return smoothStep.on('change', (latest) => {
      if (manualOffset === null) {
        const clamped = Math.max(0, Math.min(STEPS.length - 1, Math.round(latest)));
        setActiveStepIndex(clamped);
      }
    });
  }, [smoothStep, manualOffset]);

  const handleManualSelect = (index: number) => {
    setManualOffset(index);
    setActiveStepIndex(index);
    setTimeout(() => {
      setManualOffset(null);
    }, 1400);
  };

  const handlePrev = () => {
    const nextIndex = activeStepIndex > 0 ? activeStepIndex - 1 : STEPS.length - 1;
    handleManualSelect(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = activeStepIndex < STEPS.length - 1 ? activeStepIndex + 1 : 0;
    handleManualSelect(nextIndex);
  };

  const activeStep = STEPS[activeStepIndex];

  return (
    <section
      id="transformation"
      ref={containerRef}
      className="relative min-h-[250vh] bg-[#FBFBFB] border-b border-slate-200/80"
    >
      {/* Sticky Viewport Stage */}
      <div className="sticky top-16 min-h-[85vh] max-h-[780px] flex flex-col justify-between py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
        {/* Section Header */}
        <div className="max-w-3xl mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Before & After</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            From blind load testing to surgical benchmarking.
          </h2>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Scroll down to watch primitive shell scripts evolve into automated regression gates.
          </p>
        </div>

        {/* 2-Column Stepper Layout driven by page scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
          {/* Left Column: Step List Navigation */}
          <div className="lg:col-span-5 space-y-2 pointer-events-auto">
            {STEPS.map((step, index) => {
              const isCurrent = index === activeStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleManualSelect(index)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border cursor-pointer ${
                    isCurrent
                      ? 'bg-white border-orange-300 shadow-md ring-1 ring-orange-200'
                      : 'bg-transparent border-transparent hover:bg-white/60 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isCurrent ? 'text-orange-600' : 'text-slate-400'
                      }`}
                    >
                      Step {step.number} of {STEPS.length}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {step.subtitle}
                    </span>
                  </div>

                  <div
                    className={`font-display text-base sm:text-lg font-bold tracking-tight ${
                      isCurrent ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {step.title}
                  </div>

                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-xs text-slate-600 leading-relaxed"
                    >
                      {step.description}
                    </motion.p>
                  )}
                </button>
              );
            })}

            {/* Stepper Controls */}
            <div className="pt-2 flex items-center justify-between px-2">
              <span className="text-xs font-mono text-slate-500">
                Scroll page or click steps
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  aria-label="Next step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Preview Window that Transforms on Scroll */}
          <div className="lg:col-span-7 pointer-events-auto">
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lg overflow-hidden min-h-[440px] flex flex-col justify-between">
              {/* Window Header */}
              <div className="bg-slate-900 px-5 py-3 text-slate-200 flex items-center justify-between text-xs border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-slate-400 ml-2">
                    {activeStepIndex === 0
                      ? 'bash ~/run-test.sh'
                      : 'cannonbench workbench --target api.acme.com'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      activeStepIndex === 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : activeStepIndex === 4
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {activeStepIndex === 0
                      ? 'BEFORE: AD-HOC'
                      : activeStepIndex === 4
                      ? 'AFTER: SURGICAL'
                      : `TRANSFORMATION: STAGE ${activeStepIndex + 1}`}
                  </span>
                </div>
              </div>

              {/* Window Canvas Body */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {/* Step 1: Ad-hoc Script */}
                  {activeStepIndex === 0 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 space-y-2">
                        <div className="text-slate-500"># Primitive shell loop without pooling</div>
                        <div className="text-orange-400">while true; do</div>
                        <div className="pl-4 text-slate-200">curl -s -o /dev/null &quot;https://api.acme.com/v1/checkout&quot; &amp;</div>
                        <div className="text-orange-400">done</div>
                      </div>

                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Blind Results</span>
                        </div>
                        <div className="text-xs text-red-800">
                          Total requests: ~2,400. Dropped sockets: Unknown. Percentiles: None.
                        </div>
                        <div className="text-[11px] text-red-600">
                          Warning: Client socket starvation caused artificial 502 errors.
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Controlled Socket Pools */}
                  {activeStepIndex === 1 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="text-[10px] uppercase text-slate-500">Connection Pool</div>
                          <div className="text-xl font-bold text-slate-900 font-sans">100 Sockets</div>
                          <div className="text-emerald-600 text-[11px]">HTTP Keep-Alive: Active</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="text-[10px] uppercase text-slate-500">Pipelining Factor</div>
                          <div className="text-xl font-bold text-slate-900 font-sans">1 (Strict Order)</div>
                          <div className="text-slate-500 text-[11px]">Zero Socket Leaks</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                        <span className="font-bold">Socket State:</span> TCP handshakes are reused across 15,000 requests, eliminating false TCP RST spikes.
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Unbiased Percentiles */}
                  {activeStepIndex === 2 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div className="text-slate-500 text-xs">HDR Latency Histogram (15,420 samples)</div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <div className="text-[10px] text-slate-400">p50 Median</div>
                          <div className="text-lg font-bold text-slate-900">1.8 ms</div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <div className="text-[10px] text-slate-400">p90 Latency</div>
                          <div className="text-lg font-bold text-slate-900">4.2 ms</div>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                          <div className="text-[10px] text-orange-600 font-bold">p99 Outliers</div>
                          <div className="text-lg font-bold text-orange-600">11.4 ms</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs">
                        Unlike average latencies, the p99 metric proves that the slowest percentile of requests finishes in 11.4ms.
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Live Visual Telemetry */}
                  {activeStepIndex === 3 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Live SSE Telemetry Stream</span>
                        <span className="text-orange-600 font-bold">15,420 req/s</span>
                      </div>

                      <div className="h-28 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-end justify-between gap-1 overflow-hidden">
                        {[40, 55, 65, 80, 95, 90, 85, 92, 98, 100, 94, 91, 96, 92, 94].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-orange-500 rounded-t-sm"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-50 border border-slate-200">
                          200 OK: <span className="font-bold text-emerald-600">154,200</span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 border border-slate-200">
                          Errors: <span className="font-bold text-slate-700">0</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: The Last 10%: SLA Quality Gates */}
                  {activeStepIndex === 4 && (
                    <motion.div
                      key="step-5"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-emerald-900 text-sm">
                              SLA VERDICT: PASSED
                            </span>
                          </div>
                          <span className="text-xs font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded font-bold">
                            CI GATE 0 EXIT
                          </span>
                        </div>

                        <div className="space-y-2 text-xs font-mono text-emerald-800">
                          <div className="flex justify-between py-1 border-b border-emerald-100">
                            <span>p99 Latency Target (&lt; 15.0ms)</span>
                            <span className="font-bold">11.4 ms (PASS)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-emerald-100">
                            <span>Error Rate Budget (&lt; 0.1%)</span>
                            <span className="font-bold">0.00% (PASS)</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Throughput Target (&gt; 10,000 req/s)</span>
                            <span className="font-bold">15,420 req/s (PASS)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 font-mono text-center">
                        PR #142 passed all quality checks. Ready for production deployment.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Window Footer Action */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  Step {activeStep.number} of {STEPS.length}: {activeStep.title}
                </span>

                <Link
                  href="/app"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-orange-600 transition-colors"
                >
                  <span>Open Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
