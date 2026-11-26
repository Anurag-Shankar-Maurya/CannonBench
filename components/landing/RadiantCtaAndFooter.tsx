'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Check, Zap, Github } from 'lucide-react';

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
      <section className="relative py-28 sm:py-40 overflow-hidden bg-[radial-gradient(ellipse_120%_90%_at_50%_60%,_rgba(249,115,22,0.32)_0%,_rgba(254,215,170,0.22)_40%,_#FFF7ED_75%,_#FBFBFB_100%)] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.02]">
              Stop guessing, <br />
              <span className="text-slate-950">start measuring.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed pt-2">
              Dual-engine socket execution, real-time percentile telemetry, and automated SLA regression gates in one local command.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 text-slate-200 px-5 py-3 rounded-full font-mono text-xs sm:text-sm shadow-xl border border-slate-800 w-full sm:w-auto">
                <span className="text-orange-400 select-none font-bold">$</span>
                <span className="text-slate-100 font-medium">{command}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-3 text-slate-400 hover:text-white p-1 rounded transition-colors"
                  title="Copy command"
                  aria-label="Copy command line snippet"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] rounded-full transition-all shadow-lg shadow-orange-600/30 w-full sm:w-auto"
              >
                <span>Open Workbench</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Footer with Blazing Sunset Horizon & Giant Watermark matching tasteskill.dev (00:25-00:29) */}
      <footer className="bg-[#0A0D14] text-slate-400 pt-20 pb-0 relative overflow-hidden border-t border-slate-900">
        {/* Blazing orange sunset glow rising from the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[480px] bg-[radial-gradient(ellipse_110%_90%_at_50%_100%,_rgba(249,115,22,0.9)_0%,_rgba(234,88,12,0.65)_30%,_rgba(194,65,12,0.35)_60%,_transparent_90%)] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5 text-white group">
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-md shadow-orange-600/40">
                  <Zap className="w-4 h-4 fill-white text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                  CannonBench
                </span>
              </Link>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                The open-source API benchmarking workbench. Dual socket execution engines, real-time SSE telemetry, and automated SLA regression gates.
              </p>
              <div className="text-xs text-slate-400 font-mono">
                MIT Licensed. Zero analytics. 100% local execution.
              </div>
            </div>

            {/* Col 2: Workbench */}
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
                    Twenty Patterns
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

            {/* Col 4: Open Source */}
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
          <div className="pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-4">
            <div>
              &copy; {new Date().getFullYear()} CannonBench Project. Released under the MIT License.
            </div>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#install" className="hover:text-white transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Giant Watermark Text illuminated by the fiery horizon matching tasteskill.dev */}
        <div className="w-full flex justify-center items-end overflow-hidden pt-6 relative z-10 select-none pointer-events-none">
          <span className="font-display text-[clamp(4.5rem,14vw,15rem)] font-extrabold tracking-tight text-white leading-none drop-shadow-[0_4px_30px_rgba(249,115,22,0.8)] pb-0 translate-y-3 sm:translate-y-6">
            CannonBench
          </span>
        </div>
      </footer>
    </>
  );
}
