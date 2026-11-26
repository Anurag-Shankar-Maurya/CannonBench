import React from 'react';
import Link from 'next/link';
import { Zap, Github } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-white text-slate-600 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info (Span 2) */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-current text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-slate-900 tracking-tight">
                CannonBench
              </span>
            </Link>
            <p className="mt-3 text-xs text-slate-500 max-w-sm leading-relaxed">
              Autocannon load and stress testing workbench. Dual execution engines (Node.js raw sockets
              and browser edge fetch) with zero database footprint.
            </p>
          </div>

          {/* Column 1: Workbench */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-800 mb-3">
              Workbench
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/app" className="hover:text-slate-900 transition-colors text-indigo-600 font-medium">
                  Open Workbench →
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  Dual Engines
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-slate-900 transition-colors">
                  VPC Architecture
                </a>
              </li>
              <li>
                <a href="#comparisons" className="hover:text-slate-900 transition-colors">
                  Comparison Matrix
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Documentation */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-800 mb-3">
              Index
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/sitemap.xml" className="hover:text-slate-900 transition-colors">
                  Sitemap XML
                </a>
              </li>
              <li>
                <a href="/llms.txt" className="hover:text-slate-900 transition-colors">
                  llms.txt
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-slate-900 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Open Source */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-800 mb-3">
              Open Source
            </h4>
            <ul className="space-y-2 text-xs">
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
              <li className="text-slate-500 pt-1">
                MIT License
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} CannonBench. Open-source software.
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            HTTP/1.1 • HTTP/2 • Raw Sockets • Server-Sent Events
          </div>
        </div>
      </div>
    </footer>
  );
}
