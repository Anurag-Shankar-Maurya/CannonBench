'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';

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
    metric: 'Exposes initial handshake lag',
  },
  {
    id: 'soak',
    name: 'Sustained soak test',
    tag: 'Leak detection',
    detail: 'Maintains a constant throughput over prolonged durations to uncover garbage collection pauses, memory creep, and socket leaks.',
    metric: 'Identifies slow memory degradation',
  },
  {
    id: 'spike',
    name: 'Spike and recovery',
    tag: 'Elastic resilience',
    detail: 'Injects sudden 10x traffic spikes followed by sharp drop-offs to observe queue backpressure, circuit breaking, and auto-scaler lag.',
    metric: 'Measures auto-scale stabilization time',
  },
  {
    id: 'p99-budget',
    name: 'P99 tail-latency budget',
    tag: 'Strict SLA gate',
    detail: 'Enforces strict millisecond tail-latency budgets, flagging builds when the slowest 1% of requests drift beyond SLA thresholds.',
    metric: 'Guards customer-perceived speed',
  },
  {
    id: 'tcp-reuse',
    name: 'TCP connection reuse',
    tag: 'Keep-alive efficiency',
    detail: 'Benchmarks persistent HTTP keep-alive sockets against raw TCP handshakes to isolate TLS overhead on client ingress proxies.',
    metric: 'Pinpoints TLS renegotiation overhead',
  },
  {
    id: 'zero-alloc',
    name: 'Zero-allocation streaming',
    tag: 'SSE pipeline',
    detail: 'Evaluates real-time Server-Sent Events throughput with zero memory buffer duplication or event loop stalling.',
    metric: 'Stress-tests persistent push channels',
  },
  {
    id: 'browser-parity',
    name: 'Browser socket parity',
    tag: 'Real client timing',
    detail: 'Executes identical benchmarks via browser fetch() and Resource Timing to detect browser-specific connection limits.',
    metric: 'Compares server sockets vs browser pools',
  },
  {
    id: 'ci-gate',
    name: 'Automated CI regression gate',
    tag: 'Headless enforcement',
    detail: 'Outputs machine-readable JSON metrics and non-zero exit codes to block pull requests before performance regressions hit production.',
    metric: 'Stops slow code before deployment',
  },
];

export default function KineticParadigms() {
  const [selectedIndex, setSelectedIndex] = useState(3); // Default to P99

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : PATTERNS.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < PATTERNS.length - 1 ? prev + 1 : 0));
  };

  const current = PATTERNS[selectedIndex];

  return (
    <section id="patterns" className="py-20 lg:py-28 bg-[#FBFBFB] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Draw</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Eight testing patterns. One workbench.
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Instead of running generic blind load scripts, CannonBench gives you precision testing archetypes tailored to modern API infrastructure.
          </p>
        </div>

        {/* Kinetic Stack Scrubber like tasteskill.dev */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm"
        >
          {/* Left Column: Index Counter & Arrows */}
          <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
            <div className="font-mono text-xs font-bold text-slate-400">
              <span className="text-2xl font-black text-slate-900 block font-sans">
                {selectedIndex + 1}
              </span>
              <span>of {PATTERNS.length}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                aria-label="Previous pattern"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                aria-label="Next pattern"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Column: Kinetic List */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-2 py-4">
            {PATTERNS.map((item, index) => {
              const isSelected = index === selectedIndex;
              const distance = Math.abs(index - selectedIndex);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`text-left transition-all duration-200 py-1.5 px-3 rounded-lg flex items-center justify-between group ${
                    isSelected
                      ? 'bg-orange-50/70 text-orange-600 scale-[1.02]'
                      : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  style={{
                    opacity: isSelected ? 1 : Math.max(0.25, 0.9 - distance * 0.18),
                  }}
                >
                  <span
                    className={`font-display tracking-tight transition-all ${
                      isSelected
                        ? 'text-xl sm:text-2xl font-bold text-orange-600'
                        : 'text-base sm:text-lg font-medium'
                    }`}
                  >
                    {item.name}
                  </span>

                  {isSelected && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-200/60 text-orange-800">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Pattern Inspector Card */}
          <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">
                    {current.tag}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {current.id}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {current.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {current.detail}
                </p>

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    Workbench Outcome
                  </div>
                  <div className="font-semibold text-slate-900">
                    {current.metric}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 mt-2 border-t border-slate-200/80">
              <Link
                href="/app"
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch this scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
