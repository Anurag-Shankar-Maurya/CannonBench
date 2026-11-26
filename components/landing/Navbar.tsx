'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Github, ArrowRight, Menu, X, Star } from 'lucide-react';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Announcement Bar like tasteskill.dev */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-mono">
          v2.4
        </span>
        <span className="text-slate-300">
          Zero-overhead Server-Sent Events engine with live percentile telemetry.
        </span>
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 ml-1"
        >
          <span>Try live demo</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <header className="sticky top-0 z-50 w-full bg-[#FBFBFB]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
              <Zap className="w-4 h-4 fill-current text-orange-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                CannonBench
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#patterns" className="hover:text-slate-900 transition-colors">
              Patterns
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it works
            </a>
            <a href="#transformation" className="hover:text-slate-900 transition-colors">
              Before & After
            </a>
            <a href="#install" className="hover:text-slate-900 transition-colors">
              Install
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              Questions
            </a>
          </nav>

          {/* Right Actions: GitHub Star Pill + Primary CTA */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/mcollina/autocannon"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-colors shadow-2xs"
            >
              <Github className="w-3.5 h-3.5 text-slate-900" />
              <span>GitHub</span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono text-[11px]">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                14.8k
              </span>
            </a>

            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full transition-all shadow-2xs"
            >
              <span>Open Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(mobileMenuOpen ? false : true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            <a
              href="#patterns"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Patterns
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              How it works
            </a>
            <a
              href="#transformation"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Before & After
            </a>
            <a
              href="#install"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Install
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Questions
            </a>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/app"
                className="w-full text-center py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
              >
                Open Workbench
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
