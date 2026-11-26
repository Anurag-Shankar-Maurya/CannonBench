'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Terminal,
  Zap,
  Activity,
  Check,
  Copy,
  Play,
  Gauge,
  ShieldCheck,
  Cpu,
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
      setSimulatedRps(Math.floor(13500 + Math.random() * 4000));
      setSimulatedP99(Number((8.5 + Math.random() * 7.5).toFixed(1)));
      if (count >= 7) {
        clearInterval(interval);
        setIsRunningSim(false);
      }
    }, 320);
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-12 lg:py-16 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Header Block */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono mb-4 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Autocannon 9.x Socket Engine</span>
            <span className="text-slate-300">/</span>
            <span>Zero Database</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08]">
            Autocannon load testing in a visual workbench.
          </h1>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Direct Node.js raw TCP sockets streaming 1-second telemetry curves, binned percentile
            histograms, and automated SLO quality gates. 100% terminal parity.
          </p>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition-all shadow-xs"
            >
              <span>Open Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleCopyCli}
              className="inline-flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-mono text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>{cliSnippet}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 ml-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* The Real Product Shown Whole: app-frame */}
        <div className="mt-10 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          {/* App Frame Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="ml-2 font-mono text-xs text-slate-500">
                cannonbench://benchmarks/active
              </span>
            </div>

            {/* Engine Switcher */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveEngine('native')}
                className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
                  activeEngine === 'native'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Native Sockets
              </button>
              <button
                type="button"
                onClick={() => setActiveEngine('browser')}
                className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
                  activeEngine === 'browser'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Browser Edge
              </button>
            </div>
          </div>

          {/* Workbench Controls & Target Bar */}
          <div className="p-4 sm:p-5 space-y-4 bg-white">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold rounded border border-emerald-200 shrink-0">
                POST
              </span>
              <span className="text-xs font-mono text-slate-700 flex-1 truncate w-full sm:w-auto px-1">
                https://api.internal.cloud/v1/checkout/stress-test
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  onClick={runSimulatedBurst}
                  disabled={isRunningSim}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors"
                >
                  <Play className={`w-3 h-3 ${isRunningSim ? 'animate-spin' : ''}`} />
                  <span>{isRunningSim ? 'Streaming...' : 'Run 15k Burst'}</span>
                </button>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors"
                >
                  <span>Launch Live</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 4 True-size Telemetry Readout Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Throughput</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {simulatedRps.toLocaleString()}
                  <span className="text-xs font-sans font-normal text-slate-500 ml-1">req/s</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-600 mt-0.5">
                  50 connections / pipelining 10
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>p99 Latency</span>
                  <Gauge className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-amber-700 tabular-nums">
                  {simulatedP99}
                  <span className="text-xs font-sans font-normal text-slate-500 ml-1">ms</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  p50: 2.1ms • p90: 5.8ms
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Error Rate</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                  0.00%
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  0 timeouts / 225,000 req
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>SLO Gate</span>
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                  PASSED
                </div>
                <div className="text-[11px] font-mono text-emerald-600 mt-0.5">
                  p99 &lt; 25ms • Err &lt; 0.1%
                </div>
              </div>
            </div>

            {/* Binned Latency Histogram */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                <span>Latency Distribution (Logarithmic Bins)</span>
                <span>Sample: 225,000 Requests</span>
              </div>
              <div className="h-14 flex items-end gap-1.5 pt-1">
                {[12, 28, 48, 92, 100, 68, 30, 16, 8, 4, 2, 1, 0, 1].map((pct, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className={`w-full rounded-t-xs transition-all duration-200 ${
                        idx < 6
                          ? 'bg-emerald-500'
                          : idx < 9
                          ? 'bg-indigo-600'
                          : idx < 11
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ height: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 border-t border-slate-200 pt-1">
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
