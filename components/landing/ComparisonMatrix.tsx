'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

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
      feature: 'Zero-Scripting Setup (Visual GUI)',
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
      feature: 'Zero Database Footprint',
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
      feature: 'License & Cost',
      cannonbench: '100% Free / MIT',
      postman: 'Freemium ($14+/mo)',
      k6: 'Paid Cloud ($99+/mo)',
      jmeter: 'Free / Heavyweight',
      terminal: 'Free (CLI)',
    },
  ];

  return (
    <section id="comparisons" className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">
            Tool Comparison
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Architecture and tooling comparison
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Comparing CannonBench with CLI generators, enterprise test platforms, and desktop tools.
          </p>
        </motion.div>

        {/* Animated Table Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs"
        >
          <table className="w-full text-left border-collapse min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-xs">
                <th className="py-3.5 px-5">Capability</th>
                <th className="py-3.5 px-5 bg-indigo-50/70 text-indigo-900 font-semibold border-x border-indigo-100">
                  ⚡ CannonBench
                </th>
                <th className="py-3.5 px-5">Postman</th>
                <th className="py-3.5 px-5">Grafana k6</th>
                <th className="py-3.5 px-5">Apache JMeter</th>
                <th className="py-3.5 px-5">Autocannon CLI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-slate-900">{row.feature}</td>

                  {/* CannonBench Highlight Column */}
                  <td className="py-3.5 px-5 bg-indigo-50/30 font-semibold text-slate-900 border-x border-indigo-100/50">
                    {row.cannonbench === true ? (
                      <div className="inline-flex items-center gap-1.5 text-emerald-700 font-medium font-mono text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Native</span>
                      </div>
                    ) : (
                      <span>{row.cannonbench}</span>
                    )}
                  </td>

                  {/* Postman */}
                  <td className="py-3.5 px-5 text-slate-600">
                    {row.postman === true ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : row.postman === false ? (
                      <X className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <span>{row.postman}</span>
                    )}
                  </td>

                  {/* k6 */}
                  <td className="py-3.5 px-5 text-slate-600">
                    {row.k6 === true ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : row.k6 === false ? (
                      <X className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <span className="font-mono text-xs">{row.k6}</span>
                    )}
                  </td>

                  {/* JMeter */}
                  <td className="py-3.5 px-5 text-slate-600">
                    {row.jmeter === true ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : row.jmeter === false ? (
                      <X className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <span className="font-mono text-xs">{row.jmeter}</span>
                    )}
                  </td>

                  {/* Autocannon CLI */}
                  <td className="py-3.5 px-5 text-slate-600">
                    {row.terminal === true ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : row.terminal === false ? (
                      <X className="w-3.5 h-3.5 text-slate-300" />
                    ) : (
                      <span className="font-mono text-xs">{row.terminal}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
