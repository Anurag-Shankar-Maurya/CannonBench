'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Terminal, Zap, ShieldCheck, Check, Cpu } from 'lucide-react';

export default function HowItWorksCards() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Scroll Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>How it works</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Performance engineering, packaged as a workbench.
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            One tool gives your team automated cURL ingestion, dual socket execution engines, and automated SLA regression gates to verify APIs under real load.
          </p>
        </motion.div>

        {/* 3 Detailed Feature Cards matching tasteskill.dev with Staggered Scroll Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: cURL Ingestion */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#FBFBFB] rounded-3xl p-6 sm:p-8 border border-slate-200/90 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 mb-5">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-orange-600 font-bold uppercase mb-1">
                Zero Configuration
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Smart cURL Auto-Import
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Paste any raw cURL command straight from DevTools, Postman, or your terminal. CannonBench parses headers, formats JSON bodies, and sanitizes authorization tokens instantly.
              </p>

              {/* Mockup Element */}
              <div className="rounded-xl bg-slate-900 p-3.5 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800 space-y-1.5">
                <div className="text-slate-400">// Ingested command</div>
                <div className="text-emerald-400">curl -X POST https://api.io/pay \</div>
                <div className="text-slate-300 pl-2">-H &quot;Authorization: Bearer ***&quot; \</div>
                <div className="text-slate-300 pl-2">-d &apos;{JSON.stringify({ amount: 4900 })}&apos;</div>
                <div className="pt-2 text-xs flex items-center justify-between border-t border-slate-800 text-slate-400">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Sanitized
                  </span>
                  <span>Method: POST</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">
                1-click parameter extraction
              </span>
            </div>
          </motion.div>

          {/* Card 2: Dual Socket Engine */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#FBFBFB] rounded-3xl p-6 sm:p-8 border border-slate-200/90 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-indigo-600 font-bold uppercase mb-1">
                Dual Execution
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Raw Sockets & Browser Parity
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Toggle directly between raw Node.js TCP sockets via Autocannon streamed over SSE, and browser-native fetch() execution with High-Resolution Resource Timing.
              </p>

              {/* Mockup Element */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <span className="font-semibold text-indigo-900">Node.js Sockets</span>
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                    35k req/s
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Browser fetch()</span>
                  <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                    2.8k req/s
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 text-center">
                  Live SSE stream: 0 memory overhead
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">
                Detect client vs server bottleneck
              </span>
            </div>
          </motion.div>

          {/* Card 3: Quality Gates */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#FBFBFB] rounded-3xl p-6 sm:p-8 border border-slate-200/90 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-[11px] font-mono text-emerald-600 font-bold uppercase mb-1">
                Quality Assurance
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                Automated SLA Quality Gates
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Define millisecond latency thresholds, error rate tolerances, and minimum throughput. CannonBench automatically calculates SLA verdicts and flags regressions.
              </p>

              {/* Mockup Element */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">p99 Latency &lt; 20ms</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 11.4ms PASS
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Errors &lt; 0.1%</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 0.00% PASS
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Throughput &gt; 10k</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 15.4k PASS
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">
                Fails CI pull requests automatically
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
