'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  GitCompare,
  Play,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { BenchmarkConfig, BenchmarkRunRecord } from '@/types/benchmark';
import { computeRunComparison, formatBytes } from '@/lib/diagnostics';
import RunResultPanel from './RunResultPanel';

interface HistoryCompareViewProps {
  runs: BenchmarkRunRecord[];
  compareRunAId: string | null;
  compareRunBId: string | null;
  onSelectCompareA: (id: string | null) => void;
  onSelectCompareB: (id: string | null) => void;
  onDeleteRun: (id: string) => void;
  onClearHistory: () => void;
  onImportRuns: (imported: BenchmarkRunRecord[]) => void;
  onRerunConfig: (config: BenchmarkConfig) => void;
  onSavePreset: (config: BenchmarkConfig) => void;
  onGoToRunner: () => void;
  onNotify: (msg: string) => void;
}

type HistoryFilter = 'all' | 'completed' | 'errors' | 'aborted';

export default function HistoryCompareView({
  runs,
  compareRunAId,
  compareRunBId,
  onSelectCompareA,
  onSelectCompareB,
  onDeleteRun,
  onClearHistory,
  onImportRuns,
  onRerunConfig,
  onSavePreset,
  onGoToRunner,
  onNotify,
}: HistoryCompareViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [inspectedRunId, setInspectedRunId] = useState<string | null>(null);
  const [subMode, setSubMode] = useState<'history' | 'compare'>('history');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const inspectedRun = useMemo(
    () => runs.find((r) => r.id === inspectedRunId) ?? null,
    [runs, inspectedRunId]
  );

  const filteredRuns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return runs.filter((run) => {
      if (filter === 'completed' && run.status !== 'completed') return false;
      if (filter === 'aborted' && run.status === 'completed') return false;
      if (
        filter === 'errors' &&
        run.result.errors + run.result.non2xx + run.result.mismatches === 0
      ) {
        return false;
      }
      if (!q) return true;
      return (
        run.title.toLowerCase().includes(q) ||
        run.config.url.toLowerCase().includes(q) ||
        run.config.method.toLowerCase().includes(q) ||
        run.config.pattern.toLowerCase().includes(q)
      );
    });
  }, [runs, searchQuery, filter]);

  const runA = useMemo(
    () => runs.find((r) => r.id === compareRunAId) ?? runs[1] ?? runs[0] ?? null,
    [runs, compareRunAId]
  );
  const runB = useMemo(
    () => runs.find((r) => r.id === compareRunBId) ?? runs[0] ?? null,
    [runs, compareRunBId]
  );

  const comparison = useMemo(() => {
    if (!runA || !runB) return null;
    return computeRunComparison(runA, runB);
  }, [runA, runB]);

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const valid = list.filter(
        (item) => item && typeof item.id === 'string' && item.result && item.config
      ) as BenchmarkRunRecord[];
      if (valid.length === 0) {
        onNotify('No valid CannonBench run records found in JSON.');
        return;
      }
      onImportRuns(valid);
      onNotify(`Imported ${valid.length} benchmark run(s)`);
    } catch {
      onNotify('Invalid JSON file');
    }
  };

  if (inspectedRun) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setInspectedRunId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Run History
          </button>

          <button
            type="button"
            onClick={() => onRerunConfig(structuredClone(inspectedRun.config))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Load Config in Runner
          </button>
        </div>

        <RunResultPanel
          run={inspectedRun}
          liveTicks={inspectedRun.ticks}
          isRunning={false}
          activeStageLabel=""
          activeConfig={inspectedRun.config}
          onSaveAsPreset={onSavePreset}
          onSendToCompare={(id) => {
            onSelectCompareB(id);
            setInspectedRunId(null);
            setSubMode('compare');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Switch + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            type="button"
            onClick={() => setSubMode('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              subMode === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Run History ({runs.length})
          </button>
          <button
            type="button"
            onClick={() => setSubMode('compare')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              subMode === 'compare'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Side-by-Side Compare
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
          {runs.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export All
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-slate-200 rounded-md hover:bg-red-50 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">No Benchmark Runs Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Completed benchmarks are automatically saved to your browser&apos;s localStorage so
            you can inspect diagnostics and compare regressions side by side.
          </p>
          <button
            type="button"
            onClick={onGoToRunner}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Open Test Runner
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : subMode === 'history' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, URL, method, or pattern..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'errors', label: 'With Errors' },
                  { id: 'aborted', label: 'Aborted / Bailed' },
                ] as Array<{ id: HistoryFilter; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="text-left font-medium px-4 py-2.5">Run & Endpoint</th>
                  <th className="text-left font-medium px-4 py-2.5">Pattern</th>
                  <th className="text-right font-medium px-4 py-2.5">Avg RPS</th>
                  <th className="text-right font-medium px-4 py-2.5">p50 / p99</th>
                  <th className="text-right font-medium px-4 py-2.5">APDEX</th>
                  <th className="text-right font-medium px-4 py-2.5">Non-2xx / Err</th>
                  <th className="text-right font-medium px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No runs match the current search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((run) => {
                    const errTotal = run.result.errors + run.result.non2xx + run.result.mismatches;
                    return (
                      <tr
                        key={run.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setInspectedRunId(run.id)}
                            className="text-left group"
                          >
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                              {run.title}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate max-w-[300px]">
                              {run.config.method} {run.result.url} ·{' '}
                              {new Date(run.createdAt).toLocaleString()}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-700 capitalize">
                          {run.config.pattern} ·{' '}
                          <span className="font-mono tabular-nums">
                            {run.result.connections}c / {run.result.duration}s
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {Math.round(run.result.requests.average).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                          {run.result.latency.p50} / {run.result.latency.p99} ms
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                          {run.apdexScore.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono tabular-nums ${
                            errTotal > 0 ? 'text-amber-700 font-medium' : 'text-emerald-700'
                          }`}
                        >
                          {errTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectedRunId(run.id)}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCompareB(run.id);
                                setSubMode('compare');
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                            >
                              Compare
                            </button>
                            <button
                              type="button"
                              aria-label="Delete run"
                              onClick={() => onDeleteRun(run.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison Matrix */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Baseline (Run A)
              </label>
              <select
                value={runA?.id ?? ''}
                onChange={(e) => onSelectCompareA(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md bg-white"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({Math.round(r.result.requests.average)} req/s ·{' '}
                    {new Date(r.createdAt).toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Candidate (Run B)
              </label>
              <select
                value={runB?.id ?? ''}
                onChange={(e) => onSelectCompareB(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md bg-white"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({Math.round(r.result.requests.average)} req/s ·{' '}
                    {new Date(r.createdAt).toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {runA && runB && comparison && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Regression & Throughput Delta Matrix
                </h3>
                <span className="text-xs text-slate-500">
                  Candidate (B) relative to Baseline (A)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="text-left font-medium px-4 py-2.5">Metric</th>
                      <th className="text-right font-medium px-4 py-2.5">Baseline (A)</th>
                      <th className="text-right font-medium px-4 py-2.5">Candidate (B)</th>
                      <th className="text-right font-medium px-4 py-2.5">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {[
                      {
                        label: 'Average RPS',
                        a: `${Math.round(runA.result.requests.average).toLocaleString()} req/s`,
                        b: `${Math.round(runB.result.requests.average).toLocaleString()} req/s`,
                        delta: `${comparison.rpsDelta >= 0 ? '+' : ''}${Math.round(comparison.rpsDelta)} req/s (${comparison.rpsDeltaPct >= 0 ? '+' : ''}${comparison.rpsDeltaPct.toFixed(1)}%)`,
                        good: comparison.rpsDelta >= 0,
                      },
                      {
                        label: 'p50 Median Latency',
                        a: `${runA.result.latency.p50} ms`,
                        b: `${runB.result.latency.p50} ms`,
                        delta: `${comparison.p50DeltaMs >= 0 ? '+' : ''}${comparison.p50DeltaMs.toFixed(1)} ms (${comparison.p50DeltaPct >= 0 ? '+' : ''}${comparison.p50DeltaPct.toFixed(1)}%)`,
                        good: comparison.p50DeltaMs <= 0,
                      },
                      {
                        label: 'p90 Latency',
                        a: `${runA.result.latency.p90} ms`,
                        b: `${runB.result.latency.p90} ms`,
                        delta: `${comparison.p90DeltaMs >= 0 ? '+' : ''}${comparison.p90DeltaMs.toFixed(1)} ms (${comparison.p90DeltaPct >= 0 ? '+' : ''}${comparison.p90DeltaPct.toFixed(1)}%)`,
                        good: comparison.p90DeltaMs <= 0,
                      },
                      {
                        label: 'p99 Tail Latency',
                        a: `${runA.result.latency.p99} ms`,
                        b: `${runB.result.latency.p99} ms`,
                        delta: `${comparison.p99DeltaMs >= 0 ? '+' : ''}${comparison.p99DeltaMs.toFixed(1)} ms (${comparison.p99DeltaPct >= 0 ? '+' : ''}${comparison.p99DeltaPct.toFixed(1)}%)`,
                        good: comparison.p99DeltaMs <= 0,
                      },
                      {
                        label: 'Bandwidth',
                        a: `${formatBytes(runA.result.throughput.average)}/s`,
                        b: `${formatBytes(runB.result.throughput.average)}/s`,
                        delta: `${comparison.throughputDeltaPct >= 0 ? '+' : ''}${comparison.throughputDeltaPct.toFixed(1)}%`,
                        good: comparison.throughputDeltaPct >= 0,
                      },
                      {
                        label: 'Error + Non-2xx Rate',
                        a: `${comparison.errorRateA.toFixed(2)}%`,
                        b: `${comparison.errorRateB.toFixed(2)}%`,
                        delta: `${comparison.errorRateDeltaPct >= 0 ? '+' : ''}${comparison.errorRateDeltaPct.toFixed(2)} pts`,
                        good: comparison.errorRateDeltaPct <= 0,
                      },
                      {
                        label: 'APDEX Score',
                        a: runA.apdexScore.toFixed(2),
                        b: runB.apdexScore.toFixed(2),
                        delta: `${comparison.apdexDelta >= 0 ? '+' : ''}${comparison.apdexDelta.toFixed(2)}`,
                        good: comparison.apdexDelta >= 0,
                      },
                    ].map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-900">
                          {row.label}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{row.a}</td>
                        <td className="px-4 py-2.5 text-right text-slate-900 font-medium">
                          {row.b}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-medium ${
                            row.good ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {row.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
