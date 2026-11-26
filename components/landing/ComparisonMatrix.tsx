import React from 'react';
import { Check, X, Minus, Sparkles } from 'lucide-react';

export default function ComparisonMatrix() {
  const rows = [
    {
      feature: 'Real-Time Telemetry Streaming',
      cannonbench: true,
      postman: false,
      k6: 'Paid Cloud only',
      jmeter: false,
      terminal: 'Raw numbers',
    },
    {
      feature: '500+ Uncapped Raw TCP Sockets',
      cannonbench: true,
      postman: false,
      k6: true,
      jmeter: true,
      terminal: true,
    },
    {
      feature: 'Zero-Scripting Setup (Instant GUI)',
      cannonbench: true,
      postman: true,
      k6: false,
      jmeter: false,
      terminal: false,
    },
    {
      feature: 'Automated Root-Cause Diagnostics',
      cannonbench: true,
      postman: false,
      k6: false,
      jmeter: false,
      terminal: false,
    },
    {
      feature: 'Zero Database Footprint (100% Privacy)',
      cannonbench: true,
      postman: false,
      k6: true,
      jmeter: true,
      terminal: true,
    },
    {
      feature: 'Binned Logarithmic Histograms',
      cannonbench: true,
      postman: false,
      k6: 'External Grafana',
      jmeter: 'External plugins',
      terminal: false,
    },
    {
      feature: '1-Click Executive PDF/HTML Export',
      cannonbench: true,
      postman: false,
      k6: false,
      jmeter: false,
      terminal: false,
    },
    {
      feature: 'Pricing Model',
      cannonbench: '100% Free / MIT',
      postman: 'Freemium ($14+/mo)',
      k6: 'Paid Cloud ($99+/mo)',
      jmeter: 'Free / Heavyweight',
      terminal: 'Free (CLI)',
    },
  ];

  return (
    <section id="comparisons" className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Competitive Matrix
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Why Engineers Choose CannonBench
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Compare CannonBench with traditional terminal generators, cloud enterprise tools, and
            legacy benchmarking suites.
          </p>
        </div>

        {/* Table Container */}
        <div className="mt-14 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold tracking-wider text-slate-500">
                <th className="py-4 px-6">Capability</th>
                <th className="py-4 px-6 bg-indigo-50/60 text-indigo-700 font-bold border-x border-indigo-100">
                  ⚡ CannonBench
                </th>
                <th className="py-4 px-6">Postman</th>
                <th className="py-4 px-6">Grafana k6</th>
                <th className="py-4 px-6">Apache JMeter</th>
                <th className="py-4 px-6">Autocannon CLI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-800">{row.feature}</td>

                  {/* CannonBench Highlight Column */}
                  <td className="py-4 px-6 bg-indigo-50/30 font-semibold text-indigo-900 border-x border-indigo-100/60">
                    {row.cannonbench === true ? (
                      <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Included</span>
                      </div>
                    ) : (
                      <span>{row.cannonbench}</span>
                    )}
                  </td>

                  {/* Postman */}
                  <td className="py-4 px-6 text-slate-600">
                    {row.postman === true ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : row.postman === false ? (
                      <X className="w-4 h-4 text-slate-300" />
                    ) : (
                      <span>{row.postman}</span>
                    )}
                  </td>

                  {/* k6 */}
                  <td className="py-4 px-6 text-slate-600">
                    {row.k6 === true ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : row.k6 === false ? (
                      <X className="w-4 h-4 text-slate-300" />
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{row.k6}</span>
                    )}
                  </td>

                  {/* JMeter */}
                  <td className="py-4 px-6 text-slate-600">
                    {row.jmeter === true ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : row.jmeter === false ? (
                      <X className="w-4 h-4 text-slate-300" />
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{row.jmeter}</span>
                    )}
                  </td>

                  {/* Autocannon CLI */}
                  <td className="py-4 px-6 text-slate-600">
                    {row.terminal === true ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : row.terminal === false ? (
                      <X className="w-4 h-4 text-slate-300" />
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{row.terminal}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
