import React from 'react';
import { Cpu, Terminal, Server, Layers, Shield, Zap, GitBranch, Box } from 'lucide-react';

const INTEGRATIONS = [
  { name: 'Autocannon Native', detail: 'Raw TCP sockets', icon: Zap },
  { name: 'Node.js Engine', detail: 'v18, v20, v22+', icon: Terminal },
  { name: 'Fastify & Express', detail: 'Framework parity', icon: Server },
  { name: 'Browser Fetch API', detail: 'Resource Timing', icon: Layers },
  { name: 'Prometheus & Grafana', detail: 'Metrics export', icon: Cpu },
  { name: 'GitHub Actions', detail: 'CI/CD SLA gates', icon: GitBranch },
];

export default function EcosystemLogos() {
  return (
    <section className="py-10 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Built for modern engineering ecosystems
          </span>
          <span className="text-xs font-mono text-slate-500">
            Zero proprietary agent install required
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-100/70 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <Icon className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {item.detail}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
