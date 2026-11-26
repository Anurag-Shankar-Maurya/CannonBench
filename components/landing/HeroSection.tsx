'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Terminal,
  Zap,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Gauge,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function HeroSection() {
  const [copied, setCopied] = useState(false);
  const [simulatedRps, setSimulatedRps] = useState(14850);
  const [simulatedP99, setSimulatedP99] = useState(12.4);
  const [activeEngine, setActiveEngine] = useState<'native' | 'browser'>('native');
  const [isRunningSim, setIsRunningSim] = useState(false);

  const cliSnippet = "npx autocannon -c 50 -d 15 'https://api.example.com/v1/bench'";

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulatedBurst = () => {
    setIsRunningSim(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setSimulatedRps(Math.floor(13000 + Math.random() * 4500));
      setSimulatedP99(Number((8 + Math.random() * 9).toFixed(1)));
      if (count >= 8) {
        clearInterval(interval);
        setIsRunningSim(false);
      }
    }, 350);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-radial from-indigo-50/70 via-[#F8FAFC] to-[#F8FAFC]">
      {/* Background Glow Orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-400/10 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Announcement Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-medium shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-semibold">CannonBench v1.0</span>
            <span className="text-indigo-300">•</span>
            <span className="text-indigo-600/90 hidden sm:inline">
              Autocannon Dual Execution Engines & SLO Gates
            </span>
            <span className="text-indigo-600/90 sm:hidden">Dual Engines</span>
            <ArrowRight className="w-3 h-3 text-indigo-500" />
          </div>
        </div>

        {/* Main H1 Headline */}
        <div className="mt-6 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            The Modern HTTP <br className="hidden sm:inline" />
            <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Stress-Testing Workbench
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            100% Autocannon terminal parity with real-time socket telemetry, automated SLO
            pass/fail gates, and multi-step request chaining. <strong>Zero database</strong>, 100%
            open source.
          </p>

          {/* Primary Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all group"
            >
              <Zap className="w-4 h-4 fill-current text-indigo-200" />
              <span>Launch Free Workbench</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Quick CLI Snippet Button */}
            <button
              type="button"
              onClick={handleCopyCli}
              className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-3 px-4 py-3 text-xs sm:text-sm font-mono text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-colors"
              title="Click to copy CLI command"
            >
              <div className="flex items-center gap-2 truncate">
                <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-500">$</span>
                <span className="truncate max-w-[220px] sm:max-w-none text-slate-800">
                  {cliSnippet}
                </span>
              </div>
              <div className="shrink-0 text-slate-400 pl-2">
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 hover:text-slate-600" />
                )}
              </div>
            </button>
          </div>

          {/* Sub-text trust line */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No signup required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero database footprint
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> MIT Open Source
            </span>
          </div>
        </div>

        {/* Interactive Live Hero Preview Widget */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6 text-white overflow-hidden">
            {/* Header / Mac style window bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">
                  cannonbench://workbench-preview
                </span>
              </div>

              {/* Engine Switcher */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveEngine('native')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    activeEngine === 'native'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Native Sockets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEngine('browser')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    activeEngine === 'browser'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌐 Browser Edge
                </button>
              </div>
            </div>

            {/* Target URL mock input bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded-lg border border-emerald-500/20">
                POST
              </span>
              <span className="text-xs font-mono text-slate-300 flex-1 truncate w-full sm:w-auto px-1">
                https://api.cloudservices.io/v1/checkout/stress-test
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={runSimulatedBurst}
                  disabled={isRunningSim}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningSim ? 'animate-spin' : ''}`} />
                  <span>{isRunningSim ? 'Simulating...' : 'Simulate 15k RPS'}</span>
                </button>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                >
                  <span>Open Full</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Realtime KPI Telemetry Cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Throughput</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {simulatedRps.toLocaleString()}
                  <span className="text-xs font-sans font-normal text-slate-400 ml-1">req/s</span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span>▲ +18.4%</span>
                  <span className="text-slate-500">vs target</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>p99 Latency</span>
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 tabular-nums">
                  {simulatedP99}
                  <span className="text-xs font-sans font-normal text-slate-400 ml-1">ms</span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium">
                  SLO Passed (&lt; 25ms)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Error Rate</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
                  0.00%
                </div>
                <div className="mt-1 text-[11px] text-slate-500">0 timeouts / 240,000 reqs</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Apdex Score</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-cyan-300 tabular-nums">
                  0.99
                </div>
                <div className="mt-1 text-[11px] text-emerald-400 font-medium">Excellent (T=50ms)</div>
              </div>
            </div>

            {/* Visual Simulated Histogram and Timeline */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Real-time Latency Distribution Histogram (Logarithmic)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Sample: 240,000 Requests
                </span>
              </div>

              {/* Binned bars visual representation */}
              <div className="h-16 flex items-end gap-1.5 pt-2">
                {[12, 28, 45, 88, 100, 72, 34, 18, 9, 4, 2, 1, 0, 1].map((pct, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-xs transition-all duration-300 ${
                        idx < 6
                          ? 'bg-emerald-500'
                          : idx < 9
                          ? 'bg-indigo-500'
                          : idx < 11
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ height: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>&le; 2ms</span>
                <span>5ms</span>
                <span>10ms (p50)</span>
                <span>25ms (p99)</span>
                <span>&gt; 100ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
