'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal, Copy, Check, Zap, Github } from 'lucide-react';

export default function RadiantCtaAndFooter() {
  const [copied, setCopied] = useState(false);
  const command = 'npx cannonbench run https://api.acme.com/v1/bench';

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Radiant Glowing Horizon Banner matching tasteskill.dev (00:22-00:24) */}
      <section className="relative py-24 sm:py-36 overflow-hidden bg-radiant-bottom border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Stop guessing throughput. <br className="hidden sm:inline" />
              <span className="text-orange-600">Start measuring reality.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Verify your API concurrency, eliminate tail-latency outliers, and enforce SLA quality gates in local development and CI pipelines.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 text-slate-200 px-4 py-3 rounded-full font-mono text-xs shadow-lg border border-slate-800 w-full sm:w-auto">
                <span className="text-orange-400 select-none">$</span>
                <span className="text-slate-100">{command}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                  title="Copy command"
                  aria-label="Copy command line snippet"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full transition-all shadow-md w-full sm:w-auto"
              >
                <span>Open Workbench</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Footer with Giant Watermark matching tasteskill.dev (00:25-00:29) */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 relative overflow-hidden border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-900">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2 text-white group">
                <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-white text-white" />
                </div>
                <span className="text-base font-bold tracking-tight text-white">
                  CannonBench
                </span>
              </Link>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                The open-source API benchmarking workbench. Dual socket execution engines, real-time SSE telemetry, and automated SLA regression gates.
              </p>
              <div className="text-xs text-slate-500 font-mono">
                MIT Licensed. Zero analytics. 100% local execution.
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Workbench
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/app" className="hover:text-white transition-colors">
                    Live Workbench
                  </Link>
                </li>
                <li>
                  <a href="#patterns" className="hover:text-white transition-colors">
                    Eight Patterns
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#transformation" className="hover:text-white transition-colors">
                    Before & After
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Architecture */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Architecture
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    Node.js Socket Engine
                  </a>
                </li>
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    Browser Fetch Parity
                  </a>
                </li>
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    SSE Streaming Pipeline
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Security & Isolation
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Community */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Open Source
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://github.com/mcollina/autocannon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Autocannon Engine</span>
                  </a>
                </li>
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    Docker Image
                  </a>
                </li>
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    GitHub Actions
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal / Bottom Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              &copy; {new Date().getFullYear()} CannonBench Project. Released under the MIT License.
            </div>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-slate-400 transition-colors">
                Privacy
              </a>
              <a href="#faq" className="hover:text-slate-400 transition-colors">
                Terms
              </a>
              <a href="#install" className="hover:text-slate-400 transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Giant Stylized Cutout Watermark Text across the bottom like tasteskill.dev */}
        <div className="w-full flex justify-center overflow-hidden pt-8 select-none pointer-events-none opacity-20">
          <span className="watermark-text text-white">
            CANNONBENCH
          </span>
        </div>
      </footer>
    </>
  );
}
