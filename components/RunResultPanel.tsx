'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode2,
  GitCompare,
  Info,
  Save,
  XCircle,
} from 'lucide-react';
import type { BenchmarkConfig, BenchmarkRunRecord, TickSample } from '@/types/benchmark';
import { formatBytes, generateHtmlExecutiveReport } from '@/lib/diagnostics';
import TelemetryCharts from './TelemetryCharts';

interface RunResultPanelProps {
  run: BenchmarkRunRecord | null;
  liveTicks: TickSample[];
  isRunning: boolean;
  activeStageLabel: string;
  activeConfig: BenchmarkConfig;
  onSaveAsPreset?: (config: BenchmarkConfig) => void;
  onSendToCompare?: (runId: string) => void;
}

export default function RunResultPanel({
  run,
  liveTicks,
  isRunning,
  activeStageLabel,
  activeConfig,
  onSaveAsPreset,
  onSendToCompare,
}: RunResultPanelProps) {
  const latestTick = liveTicks.length > 0 ? liveTicks[liveTicks.length - 1] : null;
  const res = run?.result;

  const totalTicksReq = liveTicks.reduce((s, t) => s + t.rps, 0);
  const avgTicksRps =
    liveTicks.length > 0 ? Math.round(totalTicksReq / liveTicks.length) : 0;

  const displayRps = res
    ? Math.round(res.requests.average).toLocaleString()
    : latestTick
      ? latestTick.rps.toLocaleString()
      : '0';

  const displayRpsSub = res
    ? `Peak ${res.requests.max.toLocaleString()} · Total ${res.requests.total.toLocaleString()}`
    : liveTicks.length > 0
      ? `Avg ${avgTicksRps.toLocaleString()} req/s · ${totalTicksReq.toLocaleString()} completed`
      : 'Waiting for execution';

  const displayLat = res
    ? `${res.latency.p50} / ${res.latency.p99} ms`
    : latestTick
      ? `${latestTick.p50} / ${latestTick.p99} ms`
      : '0 / 0 ms';

  const displayLatSub = res
    ? `Avg ${res.latency.average}ms · Max ${res.latency.max}ms`
    : latestTick
      ? `Avg ${latestTick.avgLatency}ms · p90 ${latestTick.p90}ms`
      : 'p50 median / p99 tail';

  const displayBw = res
    ? `${formatBytes(res.throughput.average)}/s`
    : latestTick
      ? `${formatBytes(latestTick.bytesPerSec)}/s`
      : '0 B/s';

  const displayBwSub = res
    ? `Total transferred ${formatBytes(res.throughput.total)}`
    : latestTick
      ? `Stage: ${activeStageLabel || latestTick.stageLabel}`
      : 'Network read throughput';

  const live2xx = liveTicks.reduce((s, t) => s + t.count2xx, 0);
  const liveNon2xx = liveTicks.reduce((s, t) => s + t.count3xx + t.count4xx + t.count5xx, 0);
  const liveErrs = liveTicks.reduce((s, t) => s + t.errors + t.mismatches, 0);

  const totalSuccess = res ? res['2xx'] : live2xx;
  const totalNon2xx = res ? res.non2xx : liveNon2xx;
  const totalErrors = res ? res.errors + res.mismatches : liveErrs;
  const totalCombined = totalSuccess + totalNon2xx + totalErrors;
  const successPct =
    totalCombined > 0 ? ((totalSuccess / totalCombined) * 100).toFixed(1) : '0.0';

  const handleDownloadJson = () => {
    if (!run) return;
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    if (!run) return;
    const html = generateHtmlExecutiveReport(run);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-report-${run.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusEntries = res ? Object.entries(res.statusCodeStats || {}) : [];

  return (
    <div className="space-y-4">
      {/* 4-column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">
            {res ? 'Average Throughput' : 'Current RPS'}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {displayRps} <span className="text-xs font-normal text-slate-500">req/s</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums truncate">
            {displayRpsSub}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">p50 / p99 Latency</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {displayLat}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums truncate">
            {displayLatSub}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">Data Bandwidth</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {displayBw}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums truncate">
            {displayBwSub}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">HTTP 2xx Success</span>
            {run && (
              <span className="text-xs font-mono tabular-nums text-slate-600">
                APDEX {run.apdexScore.toFixed(2)}
              </span>
            )}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {successPct}%
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums truncate">
            {totalNon2xx.toLocaleString()} non-2xx · {totalErrors.toLocaleString()} errors
          </div>
        </div>
      </div>

      {/* Live / Final Charts */}
      <TelemetryCharts
        ticks={run ? run.ticks : liveTicks}
        latencySummary={res?.latency}
        isRunning={isRunning}
        workersCount={activeConfig.workers}
      />

      {/* Completed Run Details */}
      {run && res && (
        <>
          {/* Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{run.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{run.config.method}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{res.duration}s elapsed</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{res.connections} connections</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  run.status === 'completed'
                    ? 'text-emerald-700 font-medium'
                    : 'text-amber-700 font-medium'
                }
              >
                {run.status === 'bailed_out'
                  ? 'Bailed out (error threshold)'
                  : run.status === 'aborted'
                    ? 'Stopped early'
                    : 'Completed'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSaveAsPreset && (
                <button
                  type="button"
                  onClick={() => onSaveAsPreset(run.config)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Preset
                </button>
              )}
              {onSendToCompare && (
                <button
                  type="button"
                  onClick={() => onSendToCompare(run.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare Run
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                HTML Report
              </button>
            </div>
          </div>

          {/* Multi-Stage Table (Ramp / Spike) */}
          {res.stages && res.stages.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Stress Pattern Stage Breakdown
                </h3>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {res.stages.length} stages
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="text-left font-medium px-4 py-2.5">Stage</th>
                      <th className="text-right font-medium px-4 py-2.5">Connections</th>
                      <th className="text-right font-medium px-4 py-2.5">Duration</th>
                      <th className="text-right font-medium px-4 py-2.5">Avg RPS</th>
                      <th className="text-right font-medium px-4 py-2.5">p99 Latency</th>
                      <th className="text-right font-medium px-4 py-2.5">Non-2xx / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {res.stages.map((st, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                          {st.label}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{st.connections}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{st.duration}s</td>
                        <td className="px-4 py-2.5 text-right text-slate-900 font-medium">
                          {st.avgRps.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{st.p99Latency} ms</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">
                          {st.non2xx + st.errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status Codes + Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Status Code Breakdown */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Status Code Breakdown</h3>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Sent {(res.requests.sent ?? res.requests.total).toLocaleString()}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-5 gap-2 text-center font-mono tabular-nums">
                  {[
                    { label: '1xx', count: res['1xx'], tone: 'text-slate-700' },
                    { label: '2xx', count: res['2xx'], tone: 'text-emerald-700' },
                    { label: '3xx', count: res['3xx'], tone: 'text-amber-700' },
                    { label: '4xx', count: res['4xx'], tone: 'text-amber-700' },
                    { label: '5xx', count: res['5xx'], tone: 'text-red-700' },
                  ].map((g) => (
                    <div
                      key={g.label}
                      className="border border-slate-200 rounded-md py-2 px-1 bg-slate-50/60"
                    >
                      <div className="text-[11px] text-slate-500">{g.label}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${g.tone}`}>
                        {g.count.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-2">
                  {statusEntries.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No HTTP status codes recorded (connection errors or timeouts occurred).
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="text-left font-medium py-1.5">Code</th>
                          <th className="text-right font-medium py-1.5">Responses</th>
                          <th className="text-right font-medium py-1.5">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {statusEntries.map(([code, stat]) => {
                          const share =
                            res.requests.total > 0
                              ? ((stat.count / res.requests.total) * 100).toFixed(1)
                              : '0.0';
                          const num = Number(code);
                          const labelTone =
                            num >= 500
                              ? 'text-red-700'
                              : num >= 300
                                ? 'text-amber-700'
                                : 'text-emerald-700';
                          return (
                            <tr key={code}>
                              <td className={`py-1.5 font-semibold ${labelTone}`}>HTTP {code}</td>
                              <td className="py-1.5 text-right text-slate-800">
                                {stat.count.toLocaleString()}
                              </td>
                              <td className="py-1.5 text-right text-slate-500">{share}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
                  <span>Errors: {res.errors}</span>
                  <span>Timeouts: {res.timeouts}</span>
                  <span>Resets: {res.resets}</span>
                  <span>Mismatches: {res.mismatches}</span>
                </div>
              </div>
            </div>

            {/* Automated Bottleneck Diagnosis */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Automated Bottleneck Diagnostics
                </h3>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  APDEX {run.apdexScore.toFixed(2)} (SLO {run.config.sloTargetLatencyMs}ms)
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {run.diagnostics.map((item) => {
                  const Icon =
                    item.severity === 'critical'
                      ? XCircle
                      : item.severity === 'warning'
                        ? AlertTriangle
                        : item.severity === 'healthy'
                          ? CheckCircle2
                          : Info;
                  const iconColor =
                    item.severity === 'critical'
                      ? 'text-red-600'
                      : item.severity === 'warning'
                        ? 'text-amber-600'
                        : item.severity === 'healthy'
                          ? 'text-emerald-600'
                          : 'text-blue-600';
                  const severityLabel =
                    item.severity === 'critical'
                      ? 'Critical'
                      : item.severity === 'warning'
                        ? 'Warning'
                        : item.severity === 'healthy'
                          ? 'Healthy'
                          : 'Info';

                  return (
                    <div key={item.id} className="p-4 flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-900">
                            {severityLabel} · {item.title}
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-600">
                            {item.metric}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
