'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Play,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  label: string;
  badge: string;
  url: string;
  method: string;
  concurrency: number;
  duration: number;
  expectedRps: number;
  p50: number;
  p90: number;
  p99: number;
  max: number;
  slaTarget: string;
  slaStatus: 'PASSED' | 'ALERT';
  description: string;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'checkout',
    label: 'Checkout API',
    badge: 'HIGH BURST',
    url: 'https://api.acme.com/v1/checkout',
    method: 'POST',
    concurrency: 100,
    duration: 15,
    expectedRps: 15420,
    p50: 1.8,
    p90: 4.2,
    p99: 11.4,
    max: 28.1,
    slaTarget: 'p99 < 15ms',
    slaStatus: 'PASSED',
    description: 'Simulates transactional checkout bursts with database connection pool limits.',
  },
  {
    id: 'oauth',
    label: 'OAuth Auth',
    badge: 'CPU INTENSIVE',
    url: 'https://auth.acme.com/oauth/token',
    method: 'POST',
    concurrency: 50,
    duration: 10,
    expectedRps: 6850,
    p50: 3.4,
    p90: 8.9,
    p99: 18.2,
    max: 42.0,
    slaTarget: 'p99 < 20ms',
    slaStatus: 'PASSED',
    description: 'Benchmarks cryptographic JWT signing and token cache contention.',
  },
  {
    id: 'sse',
    label: 'High-Freq SSE',
    badge: 'LONG LIVED',
    url: 'https://stream.acme.com/v2/telemetry',
    method: 'GET',
    concurrency: 250,
    duration: 20,
    expectedRps: 28900,
    p50: 0.9,
    p90: 2.1,
    p99: 5.6,
    max: 14.8,
    slaTarget: 'p99 < 10ms',
    slaStatus: 'PASSED',
    description: 'Tests persistent socket keep-alive buffers and memory leak resistance.',
  },
  {
    id: 'webhook',
    label: 'Webhook Ingest',
    badge: 'EVENT STREAM',
    url: 'https://ingest.acme.com/events',
    method: 'POST',
    concurrency: 80,
    duration: 12,
    expectedRps: 18200,
    p50: 1.4,
    p90: 3.6,
    p99: 8.7,
    max: 22.3,
    slaTarget: 'p99 < 12ms',
    slaStatus: 'PASSED',
    description: 'Evaluates asynchronous queue ingestion backpressure and rate limiting.',
  },
];

export default function HeroSection() {
  const [activePreset, setActivePreset] = useState<ScenarioPreset>(PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveRps, setLiveRps] = useState(PRESETS[0].expectedRps);
  const [liveP99, setLiveP99] = useState(PRESETS[0].p99);

  const cliSnippet = `npx cannonbench run ${activePreset.url} -c ${activePreset.concurrency} -d ${activePreset.duration}`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePresetSelect = (preset: ScenarioPreset) => {
    setActivePreset(preset);
    setLiveRps(preset.expectedRps);
    setLiveP99(preset.p99);
  };

  const triggerLiveSimulation = () => {
    setIsSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const jitter = (Math.random() - 0.5) * 1200;
      setLiveRps(Math.round(activePreset.expectedRps + jitter));
      setLiveP99(Number((activePreset.p99 + (Math.random() - 0.5) * 2).toFixed(1)));
      if (step >= 8) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 250);
  };

  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-radiant-horizon border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Centered Announcement Pill */}
        <div className="flex justify-center mb-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-orange-200/80 text-slate-800 text-xs font-medium hover:border-orange-400 hover:bg-white transition-all shadow-2xs group"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="font-semibold text-orange-600">CannonBench Live:</span>
            <span>Zero-overhead SSE socket workbench</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Monumental Hero Headline like tasteskill.dev */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.04]">
            The load testing workbench for high-throughput APIs.
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Dual-engine load testing streamed in real-time. Run raw TCP Autocannon sockets or high-precision browser fetch timing with instant percentile histograms, cURL auto-import, and automated SLA regression gates.
          </p>

          {/* Centered Command Box + Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 text-slate-200 px-4 py-2.5 rounded-full font-mono text-xs shadow-md border border-slate-800 w-full sm:w-auto">
              <span className="text-orange-400 select-none">$</span>
              <span className="truncate max-w-[280px] sm:max-w-[340px] text-slate-100">
                {cliSnippet}
              </span>
              <button
                type="button"
                onClick={handleCopyCli}
                className="ml-2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                title="Copy command"
                aria-label="Copy command line snippet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] rounded-full transition-all shadow-md shadow-orange-500/20 w-full sm:w-auto"
            >
              <span>Open Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Interactive Scenario Switcher Pills (like Coffee shop / Club night / Architects) */}
        <div className="mt-12 lg:mt-16 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PRESETS.map((preset) => {
              const isSelected = activePreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {preset.expectedRps.toLocaleString()} rps
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Embedded Live Workbench Preview Frame */}
          <div className="mt-4 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden transition-all">
            {/* Window Title Bar */}
            <div className="bg-slate-900 px-4 py-3 text-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                    {activePreset.method}
                  </span>
                  <span className="text-slate-300 truncate max-w-[200px] sm:max-w-md">
                    {activePreset.url}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>STREAMING SSE</span>
                </span>
                <button
                  type="button"
                  onClick={triggerLiveSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin text-orange-400' : ''}`} />
                  <span>{isSimulating ? 'Bursting...' : 'Simulate'}</span>
                </button>
              </div>
            </div>

            {/* Workbench Live Telemetry Canvas */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Throughput & Latency Curve */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Live Socket Throughput</div>
                    <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono flex items-baseline gap-2">
                      <span>{liveRps.toLocaleString()}</span>
                      <span className="text-xs font-sans font-medium text-slate-500">req/s</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-500">Tail Latency (p99)</div>
                    <div className="text-3xl font-extrabold tracking-tight text-orange-600 font-mono flex items-baseline justify-end gap-1">
                      <span>{liveP99}</span>
                      <span className="text-xs font-sans font-medium text-slate-500">ms</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Live SVG Curve */}
                <div className="h-36 w-full rounded-xl bg-slate-50 border border-slate-200/80 p-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Throughput Waveform</span>
                    <span>100 Connections / 15s</span>
                  </div>

                  <svg className="w-full h-20 text-orange-500" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q50,15 100,35 T200,20 T300,10 T400,25 L400,60 L0,60 Z"
                      fill="url(#curveGradient)"
                    />
                    <path
                      d="M0,45 Q50,15 100,35 T200,20 T300,10 T400,25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200/60 pt-1">
                    <span>200 OK: 100% (0 errors)</span>
                    <span className="text-emerald-600 font-semibold">SLA: PASSED</span>
                  </div>
                </div>

                {/* Percentile Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <div className="text-[10px] text-slate-500">p50</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">{activePreset.p50}ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <div className="text-[10px] text-slate-500">p90</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">{activePreset.p90}ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200">
                    <div className="text-[10px] text-orange-700 font-semibold">p99</div>
                    <div className="text-xs sm:text-sm font-bold text-orange-600">{activePreset.p99}ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <div className="text-[10px] text-slate-500">Max</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">{activePreset.max}ms</div>
                  </div>
                </div>
              </div>

              {/* Right Col: Scenario Details & Quality Gate */}
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-1 flex items-center justify-between">
                    <span>Scenario Parameters</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {activePreset.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activePreset.description}
                  </p>

                  <div className="mt-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                      <span>Engine</span>
                      <span className="font-semibold text-slate-900">Node.js (Raw TCP)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                      <span>Connections</span>
                      <span className="font-semibold text-slate-900">{activePreset.concurrency}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                      <span>Duration</span>
                      <span className="font-semibold text-slate-900">{activePreset.duration} seconds</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                      <span>SLA Rule</span>
                      <span className="font-semibold text-orange-600">{activePreset.slaTarget}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>SLA Verified: 0% dropped connections</span>
                  </div>

                  <Link
                    href="/app"
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Inspect In Workbench</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
