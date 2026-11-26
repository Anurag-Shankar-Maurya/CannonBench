'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Github, ArrowRight, Laptop, Check } from 'lucide-react';

export default function DesktopShowcase() {
  return (
    <section className="py-20 lg:py-28 bg-[#FBFBFB] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-slate-900 text-slate-100 p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle orange accent glow in background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-orange-400 mb-6">
              <Laptop className="w-3.5 h-3.5" />
              <span>CannonBench Studio v2.4</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              CannonBench as a local desktop workbench.
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              A dedicated load testing studio for high-concurrency microservices. Run tests locally, stream real-time percentile telemetry over SSE, and guarantee 100% privacy with zero outbound data transmission.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 transition-all shadow-md shadow-orange-600/20"
              >
                <span>Launch Web Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://github.com/mcollina/autocannon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <Github className="w-4 h-4" />
                <span>View GitHub Source</span>
              </a>
            </div>

            {/* Checklist */}
            <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>100% Local Execution</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Dependencies</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>MIT Open Source</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
