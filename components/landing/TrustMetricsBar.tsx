import React from 'react';
import { Cpu, Zap, Layers, ShieldCheck } from 'lucide-react';

export default function TrustMetricsBar() {
  const specs = [
    {
      label: 'Core Engine',
      val: 'Autocannon 9.x',
      desc: 'POSIX raw TCP sockets & HTTP pipelining',
      icon: Cpu,
    },
    {
      label: 'Socket Concurrency',
      val: '500+ Connections',
      desc: 'Bypasses browser 6-connection domain lock',
      icon: Zap,
    },
    {
      label: 'Resolution',
      val: '1-Sec Tick Rate',
      desc: 'Live streaming telemetry curves',
      icon: Layers,
    },
    {
      label: 'Data Persistence',
      val: 'Zero Database',
      desc: 'Configs & runs remain in localStorage',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {specs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    {item.label}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
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
