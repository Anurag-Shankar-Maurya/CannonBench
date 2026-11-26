import React from 'react';
import { Cpu, ShieldCheck, Zap, GitBranch, Layers, CheckCircle } from 'lucide-react';

export default function TrustMetricsBar() {
  const metrics = [
    {
      label: 'Core Load Engine',
      val: 'Autocannon 9.x',
      desc: 'Raw TCP sockets & HTTP pipelining',
      icon: Cpu,
    },
    {
      label: 'Max Concurrency',
      val: '500+ Connections',
      desc: 'Zero 6-conn browser throttling',
      icon: Zap,
    },
    {
      label: 'Telemetry Granularity',
      val: '1-Sec Ticks',
      desc: 'Live SSE telemetry curves',
      icon: Layers,
    },
    {
      label: 'Security & Privacy',
      val: 'Zero Database',
      desc: '100% Client-side persistence',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="border-y border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {item.val}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
