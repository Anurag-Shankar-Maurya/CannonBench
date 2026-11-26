import React from 'react';
import Link from 'next/link';
import { Zap, Github, Heart, Globe, Terminal, Shield } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info (Span 2) */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-current text-indigo-400" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                CannonBench
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              The modern HTTP load and stress testing workbench powered by Autocannon. Dual raw TCP
              socket &amp; browser edge engines with zero database footprint.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> Global Edge Ready
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> 100% Zero-DB Privacy
              </span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/app" className="hover:text-indigo-600 transition-colors font-medium text-indigo-600">
                  Launch Workbench →
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#dual-engines" className="hover:text-slate-900 transition-colors">
                  Dual Engines
                </a>
              </li>
              <li>
                <a href="#comparisons" className="hover:text-slate-900 transition-colors">
                  Comparison Matrix
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-slate-900 transition-colors">
                  Architecture &amp; Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources & SEO */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://github.com/mcollina/autocannon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors"
                >
                  Autocannon Engine
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" className="hover:text-slate-900 transition-colors">
                  Sitemap XML
                </a>
              </li>
              <li>
                <a href="/llms.txt" className="hover:text-slate-900 transition-colors">
                  llms.txt (AI Index)
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-slate-900 transition-colors">
                  FAQ &amp; Guides
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Open Source & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Open Source
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://github.com/mcollina/autocannon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li className="text-xs text-slate-500 pt-1">
                Licensed under MIT
              </li>
              <li className="text-xs text-slate-500">
                100% Free &amp; Open Source
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} CannonBench. Built for high-performance engineering teams.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">
              HTTP/1.1 • HTTP/2 • Raw TCP • SSE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
