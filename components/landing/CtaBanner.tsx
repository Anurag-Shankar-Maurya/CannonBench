import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Github } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-14 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-indigo-700 text-xs font-mono mb-4">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Zero signup required</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 max-w-xl mx-auto leading-tight">
            Start stress-testing HTTP endpoints now.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            100% Autocannon terminal parity with real-time socket telemetry and automated SLO gates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition-all shadow-xs"
            >
              <span>Open Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="https://github.com/mcollina/autocannon"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
