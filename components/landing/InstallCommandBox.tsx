'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, Check, Box, Cpu, GitBranch, Layers } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  command: string;
  comment: string;
}

const TABS: Tab[] = [
  {
    id: 'npx',
    label: 'npx (Instant)',
    command: 'npx cannonbench run https://api.acme.com/v1/checkout -c 100 -d 15',
    comment: '// Runs directly without installing any local packages',
  },
  {
    id: 'npm',
    label: 'npm global',
    command: 'npm install -g cannonbench && cannonbench',
    comment: '// Installs the global CLI binary and interactive workbench',
  },
  {
    id: 'docker',
    label: 'Docker',
    command: 'docker run -p 3000:3000 ghcr.io/cannonbench/workbench:latest',
    comment: '// Isolated containerized workbench with zero host dependencies',
  },
  {
    id: 'github',
    label: 'GitHub Actions',
    command: 'uses: cannonbench/action@v2\nwith:\n  target: "https://staging.api.com"\n  max-p99-ms: "15"',
    comment: '// Enforces automated SLA quality gates on pull requests',
  },
];

const PLATFORMS = [
  { name: 'Node.js 18+', detail: 'Raw TCP sockets', icon: Cpu },
  { name: 'Next.js 15', detail: 'Native App Router', icon: Layers },
  { name: 'Docker', detail: 'Alpine container', icon: Box },
  { name: 'GitHub Actions', detail: 'PR regression gates', icon: GitBranch },
  { name: 'Terminal CLI', detail: 'Direct stdout telemetry', icon: Terminal },
];

export default function InstallCommandBox() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Install & Run</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Works in the environment you already use.
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Run CannonBench as a one-liner command, mount it in Docker, or drop it into CI/CD pipelines to block regressions before production.
          </p>
        </div>

        {/* Tabbed Command Box matching tasteskill.dev */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl rounded-3xl bg-slate-900 text-slate-200 border border-slate-800 p-6 sm:p-8 shadow-xl"
        >
          {/* Tab Headers */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const isSelected = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Command Snippet Body */}
          <div className="py-6 flex items-start justify-between gap-4">
            <div className="font-mono text-xs sm:text-sm space-y-2 overflow-x-auto">
              <div className="text-slate-500">{activeTab.comment}</div>
              <pre className="text-orange-400 font-bold whitespace-pre-wrap">
                {activeTab.command}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
              title="Copy snippet"
              aria-label="Copy installation command"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Platform Support Row */}
          <div className="pt-6 border-t border-slate-800">
            <div className="text-[11px] font-mono uppercase text-slate-500 mb-3">
              Supported Environments
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PLATFORMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5"
                  >
                    <Icon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
