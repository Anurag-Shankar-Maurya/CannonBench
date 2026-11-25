'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Download,
  GitCompare,
  Play,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { BenchmarkRunRecord } from '@/types/benchmark';
import { computeRunComparison, formatBytes } from '@/lib/diagnostics';

interface RunHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  runs: BenchmarkRunRecord[];
  activeRunId: string | null;
  onSelectRun: (run: BenchmarkRunRecord) => void;
  onDeleteRun: (id: string) => void;
  onClearHistory: () => void;
  onImportRuns: (imported: BenchmarkRunRecord[]) => void;
  onNotify: (msg: string) => void;
}

export default function RunHistoryDrawer({
  open,
  onClose,
  runs,
  activeRunId,
  onSelectRun,
  onDeleteRun,
  onClearHistory,
  onImportRuns,
  onNotify,
}: RunHistoryDrawerProps) {
  const [tab, setTab] = useState<'list' | 'compare'>('list');
  const [search, setSearch] = useState('');
  const [runAId, setRunAId] = useState<string>('');
  const [runBId, setRunBId] = useState<string>('');
  const importRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runs;
    return runs.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.config.url.toLowerCase().includes(q) ||
        r.config.method.toLowerCase().includes(q)
    );
  }, [runs, search]);

  const runA = runs.find((r) => r.id === runAId) ?? runs[1] ?? runs[0] ?? null;
  const runB = runs.find((r) => r.id === runBId) ?? runs[0] ?? null;
  const comparison = useMemo(() => {
    if (!runA || !runB) return null;
    return computeRunComparison(runA, runB);
  }, [runA, runB]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const valid = list.filter(
        (item) => item && typeof item.id === 'string' && item.result && item.config
      ) as BenchmarkRunRecord[];
      if (valid.length === 0) {
        onNotify('No valid run records found in JSON.');
        return;
      }
      onImportRuns(valid);
      onNotify(`Imported ${valid.length} run(s)`);
    } catch {
      onNotify('Invalid JSON file.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Run History</h2>
                <p className="text-xs text-slate-500">
                  {runs.length} benchmark{runs.length === 1 ? '' : 's'} saved in localStorage
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Run History"
                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs + Actions */}
            <div className="px-6 py-3 border-b border-slate-200/80 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTab('list')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Saved Runs
                </button>
                <button
                  type="button"
                  onClick={() => setTab('compare')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tab === 'compare' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={importRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
                {runs.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={onClearHistory}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {runs.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-800">No saved runs yet</p>
                  <p className="text-xs text-slate-500">
                    Run a benchmark from the control bar to record telemetry and diagnostics here.
                  </p>
                </div>
              ) : tab === 'list' ? (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter runs by title, URL, or method..."
                      className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {filtered.map((run) => {
                      const isCurrent = run.id === activeRunId;
                      return (
                        <div
                          key={run.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            isCurrent
                              ? 'border-indigo-300 bg-indigo-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectRun(run);
                                onClose();
                              }}
                              className="text-left min-w-0 flex-1 group"
                            >
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                                {run.title}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                                {run.config.method} {run.result.url}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectRun(run);
                                  onClose();
                                }}
                                title="Load run onto dashboard"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRun(run.id)}
                                title="Delete run"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-600">
                            <span>{Math.round(run.result.requests.average)} req/s</span>
                            <span>
                              p50 {run.result.latency.p50}ms · p99 {run.result.latency.p99}ms
                            </span>
                            <span className="text-slate-400">
                              {new Date(run.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Baseline (Run A)
                      </label>
                      <select
                        value={runA?.id ?? ''}
                        onChange={(e) => setRunAId(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white"
                      >
                        {runs.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} · {Math.round(r.result.requests.average)} req/s
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Candidate (Run B)
                      </label>
                      <select
                        value={runB?.id ?? ''}
                        onChange={(e) => setRunBId(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white"
                      >
                        {runs.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} · {Math.round(r.result.requests.average)} req/s
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {runA && runB && comparison && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <th className="text-left font-medium px-3.5 py-2.5">Metric</th>
                            <th className="text-right font-medium px-3.5 py-2.5">Run A</th>
                            <th className="text-right font-medium px-3.5 py-2.5">Run B</th>
                            <th className="text-right font-medium px-3.5 py-2.5">Delta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                          {[
                            {
                              label: 'Avg RPS',
                              a: `${Math.round(runA.result.requests.average)}`,
                              b: `${Math.round(runB.result.requests.average)}`,
                              delta: `${comparison.rpsDeltaPct >= 0 ? '+' : ''}${comparison.rpsDeltaPct.toFixed(1)}%`,
                              good: comparison.rpsDelta >= 0,
                            },
                            {
                              label: 'p50 Latency',
                              a: `${runA.result.latency.p50}ms`,
                              b: `${runB.result.latency.p50}ms`,
                              delta: `${comparison.p50DeltaMs >= 0 ? '+' : ''}${comparison.p50DeltaMs.toFixed(1)}ms`,
                              good: comparison.p50DeltaMs <= 0,
                            },
                            {
                              label: 'p99 Latency',
                              a: `${runA.result.latency.p99}ms`,
                              b: `${runB.result.latency.p99}ms`,
                              delta: `${comparison.p99DeltaMs >= 0 ? '+' : ''}${comparison.p99DeltaMs.toFixed(1)}ms`,
                              good: comparison.p99DeltaMs <= 0,
                            },
                            {
                              label: 'Transfer',
                              a: `${formatBytes(runA.result.throughput.average)}/s`,
                              b: `${formatBytes(runB.result.throughput.average)}/s`,
                              delta: `${comparison.throughputDeltaPct >= 0 ? '+' : ''}${comparison.throughputDeltaPct.toFixed(1)}%`,
                              good: comparison.throughputDeltaPct >= 0,
                            },
                            {
                              label: 'Error Rate',
                              a: `${comparison.errorRateA.toFixed(2)}%`,
                              b: `${comparison.errorRateB.toFixed(2)}%`,
                              delta: `${comparison.errorRateDeltaPct >= 0 ? '+' : ''}${comparison.errorRateDeltaPct.toFixed(2)}%`,
                              good: comparison.errorRateDeltaPct <= 0,
                            },
                          ].map((row) => (
                            <tr key={row.label}>
                              <td className="px-3.5 py-2.5 font-sans font-medium text-slate-800">
                                {row.label}
                              </td>
                              <td className="px-3.5 py-2.5 text-right text-slate-600">{row.a}</td>
                              <td className="px-3.5 py-2.5 text-right text-slate-900 font-semibold">
                                {row.b}
                              </td>
                              <td
                                className={`px-3.5 py-2.5 text-right font-semibold ${
                                  row.good ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {row.delta}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
