import React from 'react';
import { ShieldCheck, Lock, Network, Server, HardDrive, Cpu } from 'lucide-react';

export default function ArchitecturePrivacy() {
  return (
    <section id="architecture" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Direct Copy */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-600 mb-2">
              Security Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Zero Database. 100% On-Premise &amp; VPC Safe.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Standard SaaS load testers require transmitting auth tokens, private customer cookies,
              and internal API payloads to third-party cloud infrastructure.
            </p>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              CannonBench has no database. Benchmark configurations and run histories reside
              strictly in your browser’s{' '}
              <code className="text-slate-800 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                localStorage
              </code>
              . Payloads and secrets never exit your machine or internal VPC perimeter.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">VPC &amp; Intranet Ready</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Deploy inside Docker or Kubernetes clusters to test microservices behind
                    corporate firewalls without opening external inbound ports.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Direct Socket Streaming</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Streams live 1-second benchmark metrics over Server-Sent Events (SSE) with
                    minimal CPU and memory overhead.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Encrypted JSON Export &amp; Backup</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Export full benchmark runs to JSON backup files, print-ready HTML, or PDF reports
                    without signing in to any account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Flow Diagram */}
          <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-mono text-xs text-slate-500">DATA_FLOW_PIPELINE.spec</span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ZERO_EXTERNAL_STORAGE
              </span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-800">CannonBench UI (Next.js 15)</span>
                </div>
                <span className="text-slate-500 text-[11px]">Client Browser</span>
              </div>

              <div className="flex justify-center text-slate-400 text-[11px]">
                <span>↓ SSE Stream (/api/benchmark)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-800">Node.js Autocannon Engine</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px]">Raw TCP Sockets</span>
              </div>

              <div className="flex justify-center text-slate-400 text-[11px]">
                <span>↓ Direct POSIX Socket Traffic</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-600" />
                  <span className="text-slate-800">Target HTTP / HTTP/2 Server</span>
                </div>
                <span className="text-slate-500 text-[11px]">Your API</span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500 leading-relaxed">
              No telemetry, credentials, or payloads leave your machine.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
