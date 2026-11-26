'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  ClipboardPaste,
  ShieldAlert,
  GitMerge,
  Check,
  ArrowRight,
  Terminal,
} from 'lucide-react';

const STAGES = [
  {
    id: 'engines',
    label: 'Protocol Execution',
    title: 'Dual socket execution engines',
    description:
      'Run raw TCP sockets via Node.js Autocannon streamed through Server-Sent Events, or switch to browser fetch() with the High-Resolution Resource Timing API.',
    badge: 'PARITY',
    icon: Zap,
    accent: 'indigo',
  },
  {
    id: 'curl',
    label: 'Request Ingestion',
    title: 'Smart cURL auto-import and sanitizer',
    description:
      'Paste any request from Chrome DevTools, Postman, or terminal. CannonBench automatically extracts methods, headers, JSON bodies, and strictly preserves trailing slashes.',
    badge: 'SANITIZER',
    icon: ClipboardPaste,
    accent: 'cyan',
  },
  {
    id: 'slo',
    label: 'Quality Enforcement',
    title: 'Automated SLO quality gates and root-cause analysis',
    description:
      'Enforce strict assertions on p50, p99, error rates, and minimum RPS. Automatically diagnose worker starvation, event-loop lag, and HTTP 429 throttling.',
    badge: 'ASSERTIONS',
    icon: ShieldAlert,
    accent: 'emerald',
  },
  {
    id: 'chaining',
    label: 'Scenario Automation',
    title: 'Multi-step dependent request chaining',
    description:
      'Extract dynamic variables using JSONPath from authentication endpoints and inject tokens into subsequent requests without writing external test scripts.',
    badge: 'WORKFLOW',
    icon: GitMerge,
    accent: 'purple',
  },
];

export default function FeatureWalkthrough() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">
            Engineering Workflow
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            How CannonBench benchmarks HTTP APIs
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Four cohesive stages built for high-throughput stress testing and automated SLA verification.
          </p>
        </motion.div>

        {/* 2-Column Interactive Walkthrough Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Stage Selector Cards */}
          <div className="lg:col-span-5 space-y-3">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStage === idx;
              return (
                <motion.div
                  key={stage.id}
                  onClick={() => setActiveStage(idx)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-white/70 hover:bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                        {stage.label}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                    {stage.title}
                  </h3>

                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {stage.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Visual Stage Showcase */}
          <div className="lg:col-span-7 sticky top-24">
            <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xl min-h-[380px] flex flex-col justify-between overflow-hidden">
              <AnimatePresence mode="wait">
                {activeStage === 0 && (
                  <motion.div
                    key="stage-0"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-mono text-xs text-slate-500">ENGINE_ORCHESTRATOR.ts</span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        RAW_SOCKET_STREAM
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-700 font-semibold">Engine Selection</span>
                        <span className="text-slate-500">Native Node.js (SSE)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Concurrent Raw Sockets</span>
                        <span className="text-slate-900 font-bold tabular-nums">500 Connections</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Pipelining Factor</span>
                        <span className="text-slate-900 font-bold tabular-nums">10 Requests / Socket</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Browser Edge RFC 2616 Bypass</span>
                        <span className="text-emerald-700 font-semibold">Active</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                      <span>Stream: /api/benchmark</span>
                      <span>Tick Rate: 1000ms</span>
                    </div>
                  </motion.div>
                )}

                {activeStage === 1 && (
                  <motion.div
                    key="stage-1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-mono text-xs text-slate-500">CURL_AUTO_SANITIZER.ts</span>
                      <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        PASTE_DETECTED
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
                      <div className="text-slate-400">// Raw DevTools paste:</div>
                      <div className="text-slate-700 truncate bg-white p-2 rounded border border-slate-200">
                        curl &apos;https://api.internal/v1/auth?client_id=987\&amp;mode=live&apos; -H &apos;Authorization: Bearer ...&apos;
                      </div>
                      <div className="text-emerald-700 font-semibold pt-1">
                        ✓ Escapes cleaned: \&amp; → &amp;
                      </div>
                      <div className="text-emerald-700 font-semibold">
                        ✓ Trailing slash preserved: /v1/auth
                      </div>
                      <div className="text-emerald-700 font-semibold">
                        ✓ Method extracted: GET (Auto-selected)
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStage === 2 && (
                  <motion.div
                    key="stage-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-mono text-xs text-slate-500">SLO_EVALUATION_GATE.ts</span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        GATE_PASSED
                      </span>
                    </div>
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600" /> Median p50 Latency
                        </span>
                        <span className="text-emerald-700 font-semibold">2.1ms (Rule: &lt; 10ms)</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600" /> Tail p99 Latency
                        </span>
                        <span className="text-emerald-700 font-semibold">12.4ms (Rule: &lt; 25ms)</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600" /> Error Rate
                        </span>
                        <span className="text-emerald-700 font-semibold">0.00% (Rule: &lt; 0.1%)</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600" /> Apdex Score
                        </span>
                        <span className="text-emerald-700 font-semibold">0.99 (Target: 50ms)</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStage === 3 && (
                  <motion.div
                    key="stage-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-mono text-xs text-slate-500">REQUEST_CHAIN_SCENARIO.json</span>
                      <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        2_STEPS_CONFIGURED
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="text-indigo-600 font-semibold">Step 1: POST /v1/auth/login</div>
                        <div className="text-slate-500 mt-1">Extract JSONPath: $.session.token → &#123;&#123;authToken&#125;&#125;</div>
                      </div>
                      <div className="flex justify-center text-slate-400">
                        <span>↓ Injected variable</span>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="text-purple-600 font-semibold">Step 2: GET /v1/customers/orders</div>
                        <div className="text-slate-700 mt-1">Header: Authorization: Bearer &#123;&#123;authToken&#125;&#125;</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Active Workbench Component</span>
                <Link
                  href="/app"
                  className="text-slate-900 font-medium hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <span>Open in App</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
