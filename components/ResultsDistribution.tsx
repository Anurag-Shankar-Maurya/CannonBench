'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { BenchmarkRunRecord } from '@/types/benchmark';
import { formatBytes } from '@/lib/diagnostics';

interface ResultsDistributionProps {
  run: BenchmarkRunRecord;
}

export default function ResultsDistribution({ run }: ResultsDistributionProps) {
  const { result, diagnostics, apdexScore, config } = run;

  const percentileRows = [
    { label: '2.5%', value: result.latency.p2_5 },
    { label: '50% (Median)', value: result.latency.p50 },
    { label: '90%', value: result.latency.p90 },
    { label: '97.5%', value: result.latency.p97_5 },
    { label: '99% (Tail)', value: result.latency.p99 },
    { label: 'Max', value: result.latency.max },
  ];

  const maxLatencyVal = Math.max(1, result.latency.max);
  const statusEntries = Object.entries(result.statusCodeStats || {});

  return (
    <div className="space-y-6">
      {/* Two-Column Detailed Results & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Statistical Percentiles Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Statistical Percentiles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latency distribution across {result.latency.totalCount.toLocaleString()} samples
              </p>
            </div>
            <div className="text-right font-mono tabular-nums text-xs text-slate-500">
              <div>Min {result.latency.min} ms</div>
              <div>StdDev {result.latency.stddev.toFixed(2)} ms</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500">
                  <th className="text-left font-medium py-2.5">Percentile</th>
                  <th className="text-left font-medium py-2.5 w-1/2">Distribution</th>
                  <th className="text-right font-medium py-2.5">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {percentileRows.map((row) => {
                  const pctWidth = Math.max(
                    3,
                    Math.min(100, Math.round((row.value / maxLatencyVal) * 100))
                  );
                  const barCls =
                    row.label.startsWith('Max') || row.label.startsWith('99%')
                      ? 'bg-amber-500'
                      : 'bg-indigo-500';
                  return (
                    <tr key={row.label} className="hover:bg-slate-50/70">
                      <td className="py-3 font-sans font-medium text-slate-700">{row.label}</td>
                      <td className="py-3 pr-4">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barCls}`}
                            style={{ width: `${pctWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {row.value} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: HTTP Status Codes & Network Egress */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                HTTP Status Codes & Network Egress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {config.method} {result.url}
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {result.duration}s elapsed
            </span>
          </div>

          {/* Network Egress Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="text-[11px] font-medium text-slate-500">Total Transferred</div>
              <div className="mt-1 text-base font-semibold text-slate-900 font-mono tabular-nums">
                {formatBytes(result.throughput.total)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="text-[11px] font-medium text-slate-500">Avg Transfer Rate</div>
              <div className="mt-1 text-base font-semibold text-slate-900 font-mono tabular-nums">
                {formatBytes(result.throughput.average)}/s
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="text-[11px] font-medium text-slate-500">Socket Errors</div>
              <div
                className={`mt-1 text-base font-semibold font-mono tabular-nums ${
                  result.errors + result.timeouts > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {result.errors} ({result.timeouts} t/o)
              </div>
            </div>
          </div>

          {/* Exact HTTP Status Code Table */}
          <div className="overflow-x-auto">
            {statusEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No HTTP status responses recorded (connection timeouts or socket errors occurred).
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-500">
                    <th className="text-left font-medium py-2">Status Code</th>
                    <th className="text-right font-medium py-2">Count</th>
                    <th className="text-right font-medium py-2">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {statusEntries.map(([code, stat]) => {
                    const num = Number(code);
                    const tone =
                      num >= 500
                        ? 'text-rose-600'
                        : num >= 300
                          ? 'text-amber-600'
                          : 'text-emerald-600';
                    const share =
                      result.requests.total > 0
                        ? ((stat.count / result.requests.total) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={code} className="hover:bg-slate-50/70">
                        <td className={`py-2.5 font-semibold ${tone}`}>HTTP {code}</td>
                        <td className="py-2.5 text-right text-slate-900">
                          {stat.count.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{share}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Stage Breakdown if Ramp/Spike */}
      {result.stages && result.stages.length > 1 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Stress Pattern Stage Breakdown
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {result.stages.length} stages
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500">
                  <th className="text-left font-medium py-2">Stage</th>
                  <th className="text-right font-medium py-2">Connections</th>
                  <th className="text-right font-medium py-2">Duration</th>
                  <th className="text-right font-medium py-2">Avg RPS</th>
                  <th className="text-right font-medium py-2">p99 Latency</th>
                  <th className="text-right font-medium py-2">Errors / Non-2xx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {result.stages.map((st, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-sans font-medium text-slate-800">{st.label}</td>
                    <td className="py-2.5 text-right text-slate-700">{st.connections}</td>
                    <td className="py-2.5 text-right text-slate-700">{st.duration}s</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {st.avgRps.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-slate-700">{st.p99Latency} ms</td>
                    <td className="py-2.5 text-right text-slate-700">
                      {st.non2xx + st.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Automated Bottleneck Diagnostics */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Automated Bottleneck Diagnostics
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            APDEX {apdexScore.toFixed(2)} · SLO {config.sloTargetLatencyMs} ms
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {diagnostics.map((d) => {
            const Icon =
              d.severity === 'critical'
                ? XCircle
                : d.severity === 'warning'
                  ? AlertTriangle
                  : d.severity === 'healthy'
                    ? CheckCircle2
                    : Info;
            const iconCls =
              d.severity === 'critical'
                ? 'text-rose-500'
                : d.severity === 'warning'
                  ? 'text-amber-500'
                  : d.severity === 'healthy'
                    ? 'text-emerald-500'
                    : 'text-indigo-500';
            return (
              <div key={d.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconCls}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{d.title}</span>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {d.metric}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{d.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
