import React from 'react';
import { ShieldCheck, Lock, Network, Server, HardDrive, Cpu } from 'lucide-react';

export default function ArchitecturePrivacy() {
  return (
    <section id="architecture" className="py-20 sm:py-28 bg-[#F8FAFC] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Security First
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Zero Database. Zero Leaks. <br />
              100% On-Premise &amp; VPC Safe.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Most SaaS load-testing platforms require sending authentication tokens, private
              customer cookies, and internal API payloads to third-party cloud servers.
            </p>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              <strong>CannonBench does not have a database.</strong> All benchmark configs and run
              histories live strictly in your browser’s <code className="text-slate-800 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">localStorage</code>.
              Your secrets, API tokens, and customer request bodies never leave your host.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">VPC &amp; Intranet Ready</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Run inside your Docker clusters, Kubernetes pods, or local dev machine to test
                    internal microservices behind strict corporate firewalls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Raw TCP Socket Streaming</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Streams live 1-second benchmark metrics over Server-Sent Events (SSE) with
                    minimal CPU and memory overhead.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">1-Click JSON Backup &amp; Restore</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Export your full run history to encrypted JSON backup files or import past runs
                    without signing in to any account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Architecture Diagram Box */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-mono text-xs text-slate-400">DATA_FLOW_ARCHITECTURE.md</span>
              <span className="text-[11px] font-mono text-emerald-400">STATUS: ZERO_EGRESS</span>
            </div>

            <div className="mt-6 space-y-4 font-mono text-xs">
              {/* Box 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-200">CannonBench UI (Next.js 15)</span>
                </div>
                <span className="text-slate-400 text-[11px]">Client Browser</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-500">
                <span>↓ SSE Stream (/api/benchmark)</span>
              </div>

              {/* Box 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-200">Node.js Autocannon Engine</span>
                </div>
                <span className="text-emerald-400 text-[11px]">Raw TCP Sockets</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-slate-500">
                <span>↓ Direct Load Traffic (No intermediary proxy)</span>
              </div>

              {/* Box 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200">Target HTTP / HTTP/2 Server</span>
                </div>
                <span className="text-slate-400 text-[11px]">Your API</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              🛡️ <strong>Zero Cloud Analytics:</strong> Your benchmark targets, payload bodies, and
              test results never travel to any telemetry server or external third-party analytics.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
