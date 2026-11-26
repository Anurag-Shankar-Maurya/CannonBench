import React from 'react';
import {
  Zap,
  ClipboardPaste,
  ShieldAlert,
  GitMerge,
  BarChart3,
  Check,
} from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">
            Workbench Capabilities
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Autocannon performance. Live socket telemetry.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every feature runs on raw socket execution, automated assertions, and client-side
            persistence.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Dual Execution Engines (Span 2 cols on md) */}
          <div className="md:col-span-2 rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-mono mb-2">
                <Zap className="w-4 h-4 fill-current" />
                <span>EXECUTION_MODEL</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Dual Execution Engines: Native Socket &amp; Browser Edge
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                Run high-concurrency Node.js Autocannon sockets via Server-Sent Events, or switch to
                client-side fetch() with the High-Resolution Resource Timing API for real browser
                conditions.
              </p>
            </div>

            {/* True-size UI Fragment cut by panel */}
            <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-2 mb-3">
                <span>Engine Comparison</span>
                <span className="text-emerald-700 font-semibold">100% Terminal Parity</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-700 font-semibold">⚡ Native Node.js Sockets</span>
                  <span className="text-slate-700">500+ Connections • HTTP Pipelining • SSE Stream</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyan-700 font-semibold">🌐 Browser Edge fetch()</span>
                  <span className="text-slate-600">Resource Timing API • RFC 2616 Accurate • Local CORS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Smart cURL Auto-Import */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all">
            <div>
              <div className="flex items-center gap-2 text-cyan-600 text-xs font-mono mb-2">
                <ClipboardPaste className="w-4 h-4" />
                <span>CURL_PARSER</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                cURL Auto-Import &amp; Sanitizer
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Copy any cURL request from Chrome DevTools, Postman, or terminal and press{' '}
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono text-slate-700">
                  Ctrl+V
                </kbd>{' '}
                anywhere. Method, headers, bodies, and trailing slashes are extracted automatically.
              </p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 truncate">
              <span className="text-slate-400">$</span> curl -X POST &apos;https://api.com/v1/checkout/&apos;
            </div>
          </div>

          {/* Card 3: Automated SLO Quality Gates */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-mono mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>SLO_EVALUATOR</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Automated SLO Quality Gates
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Define pass/fail rules for $p50$, $p99$, error rates, and minimum RPS. Automatically
                detect worker starvation and HTTP 429 throttling.
              </p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> p99 &lt; 25ms
                </span>
                <span className="text-slate-500">12.4ms (Pass)</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Error Rate &lt; 0.1%
                </span>
                <span className="text-slate-500">0.00% (Pass)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Multi-Step Request Chaining */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all">
            <div>
              <div className="flex items-center gap-2 text-purple-600 text-xs font-mono mb-2">
                <GitMerge className="w-4 h-4" />
                <span>REQUEST_CHAIN</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Multi-Step Request Chaining
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Extract dynamic JSONPath tokens like{' '}
                <code className="text-purple-700 font-mono text-xs bg-purple-50 px-1 py-0.5 rounded">
                  $.auth.token
                </code>{' '}
                and inject them into subsequent dependent calls without writing scripts.
              </p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1">
              <div className="text-slate-600">Step 1: POST /api/login → $.token</div>
              <div className="text-purple-700 font-medium">Step 2: GET /api/orders [Bearer &#123;&#123;token&#125;&#125;]</div>
            </div>
          </div>

          {/* Card 5: Binned Latency Histograms */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all">
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-xs font-mono mb-2">
                <BarChart3 className="w-4 h-4" />
                <span>HISTOGRAM_METRICS</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                Binned Latency Histograms
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Identify multimodal latency spikes and queueing delays. Compare consecutive runs with
                automatic side-by-side percentage delta indicators.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-600">Run #14 vs #13</span>
              <span className="text-emerald-700 font-semibold">-24.2% p99 Latency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
