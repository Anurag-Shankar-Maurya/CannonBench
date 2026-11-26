import React from 'react';
import {
  Zap,
  Globe,
  ClipboardPaste,
  ShieldAlert,
  GitMerge,
  BarChart3,
  FileCode,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Engineering-Grade Capabilities
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything You Need to Stress-Test Modern APIs
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate terminal guesswork. CannonBench brings enterprise performance benchmarking,
            distributed telemetry, and automated SLA enforcement into one cohesive workbench.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Dual Execution Engines (Span 2 cols on md) */}
          <div className="md:col-span-2 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Dual Execution Engines: Native Socket vs. Browser Edge
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Choose the exact execution model your test demands. Run high-throughput raw TCP
                sockets directly via Node.js Autocannon streaming SSE, or test real client-side
                latencies via the browser’s High-Resolution Resource Timing API.
              </p>
            </div>

            {/* Visual preview box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Engine Comparison</span>
                <span className="text-emerald-400">100% Terminal Parity</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-400">⚡ Native Node.js</span>
                <span className="text-slate-300">Raw TCP Sockets • 500+ Connections • HTTP Pipelining</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-400">🌐 Browser Edge</span>
                <span className="text-slate-300">Client-Side fetch() • RFC 2616 Accurate • CORS Verified</span>
              </div>
            </div>
          </div>

          {/* Card 2: Smart cURL Auto-Import */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-5">
                <ClipboardPaste className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Smart cURL Auto-Import & Sanitizer
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Copy any cURL request from Chrome DevTools, Postman, or terminal and press{' '}
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">
                  Ctrl+V
                </kbd>{' '}
                anywhere. CannonBench auto-extracts headers, JSON body, slashes, and escapes.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs truncate">
              curl -X POST &apos;https://api.com/v1/checkout/&apos; -H &apos;Auth...&apos;
            </div>
          </div>

          {/* Card 3: Automated SLO Quality Gates */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Automated SLO Quality Gates & Root-Cause Diagnostics
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Define pass/fail rules for $p50$, $p99$, error rates, and minimum RPS. Automatically
                diagnose event-loop blockages, worker thread starvation, and 429 rate limits.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SLO Gate: Passed (p99 &lt; 20ms &amp; Error Rate &lt; 0.1%)
            </div>
          </div>

          {/* Card 4: Multi-Step Request Chaining */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-5">
                <GitMerge className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Multi-Step Request Chaining
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Postman &amp; k6 parity without scripting fatigue. Extract dynamic JSONPath variables
                (e.g., <code className="text-purple-600 font-mono font-semibold">$.token</code>) and
                inject them seamlessly into subsequent test calls.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 font-mono text-xs">
              Step 1: POST /auth/login → &#123;&#123;authToken&#125;&#125;
            </div>
          </div>

          {/* Card 5: Binned Percentile Histograms & Replay */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Binned Latency Histograms & Run Delta Diffs
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Spot multimodal latency spikes instantly. Compare consecutive benchmark runs with
                automatic side-by-side percentage delta indicators and HAR archive replay.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>Run #12 vs Run #11</span>
              <span className="text-emerald-600 font-bold">-24.2% p99 Latency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
