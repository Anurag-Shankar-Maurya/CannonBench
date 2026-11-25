'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Download, History, Zap } from 'lucide-react';
import type {
  AutocannonResultSummary,
  BenchmarkConfig,
  BenchmarkRunRecord,
  TickSample,
} from '@/types/benchmark';
import { buildAutocannonCliCommand } from '@/lib/autocannon-cli';
import { analyzeBottlenecks, computeApdexScore } from '@/lib/diagnostics';
import {
  createDefaultBenchmarkConfig,
  getBuiltInPresets,
  loadStoredRuns,
  saveStoredRuns,
} from '@/lib/presets';
import HeroControlBar from './HeroControlBar';
import RequestOptionsAccordion from './RequestOptionsAccordion';
import BentoMetricsRow from './BentoMetricsRow';
import DualTelemetryChart from './DualTelemetryChart';
import ResultsDistribution from './ResultsDistribution';
import RunHistoryDrawer from './RunHistoryDrawer';
import ExportReportModal from './ExportReportModal';

export default function CannonBenchApp() {
  const [config, setConfig] = useState<BenchmarkConfig>(() =>
    createDefaultBenchmarkConfig('')
  );
  const [origin, setOrigin] = useState('');
  const [runs, setRuns] = useState<BenchmarkRunRecord[]>([]);
  const [selectedRun, setSelectedRun] = useState<BenchmarkRunRecord | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeStageLabel, setActiveStageLabel] = useState('');
  const [liveTicks, setLiveTicks] = useState<TickSample[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const currentOrigin = window.location.origin;
      setOrigin(currentOrigin);
      setConfig((prev) => {
        if (prev.url.startsWith('http://localhost:3000/api/sandbox/target')) {
          return {
            ...prev,
            url: prev.url.replace('http://localhost:3000', currentOrigin),
          };
        }
        return prev;
      });
      const stored = loadStoredRuns();
      setRuns(stored);
      if (stored.length > 0) {
        setSelectedRun(stored[0]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const builtInPresets = useMemo(() => getBuiltInPresets(origin), [origin]);

  const totalEstimatedSec = useMemo(() => {
    if (config.pattern === 'ramp') {
      return config.rampConfig.steps * config.rampConfig.stepDurationSec;
    }
    if (config.pattern === 'spike') {
      return (
        config.spikeConfig.baselineDurationSec +
        config.spikeConfig.spikeDurationSec +
        config.spikeConfig.recoveryDurationSec
      );
    }
    return config.duration;
  }, [config]);

  const previousRunForTrend = useMemo(() => {
    if (!selectedRun) return null;
    const idx = runs.findIndex((r) => r.id === selectedRun.id);
    return idx >= 0 && runs[idx + 1] ? runs[idx + 1] : null;
  }, [runs, selectedRun]);

  const handleStopBenchmark = useCallback(async () => {
    if (!isRunning || !activeRunId) return;
    try {
      const res = await fetch('/api/benchmark/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeRunId }),
      });
      const data = (await res.json().catch(() => ({}))) as { stopped?: boolean };
      if (!data.stopped) {
        abortControllerRef.current?.abort();
      }
      notify('Stopping benchmark...');
    } catch {
      abortControllerRef.current?.abort();
    }
  }, [isRunning, activeRunId, notify]);

  const executeBenchmark = useCallback(
    async (overrideConfig?: BenchmarkConfig) => {
      if (isRunning) return;
      const snapshotConfig = structuredClone(overrideConfig ?? config);
      if (overrideConfig) {
        setConfig(snapshotConfig);
      }

      setErrorBanner(null);
      setLiveTicks([]);
      setSelectedRun(null);
      setElapsedSec(0);
      setActiveStageLabel('');

      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsRunning(true);
      setActiveRunId(runId);

      const collectedTicks: TickSample[] = [];

      try {
        const response = await fetch('/api/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            runId,
            title: snapshotConfig.title,
            url: snapshotConfig.url,
            method: snapshotConfig.method,
            pattern: snapshotConfig.pattern,
            connections: snapshotConfig.connections,
            duration: snapshotConfig.duration,
            amount: snapshotConfig.amount ?? null,
            pipelining: snapshotConfig.pipelining,
            workers: snapshotConfig.workers,
            timeout: snapshotConfig.timeout,
            sampleInt: snapshotConfig.sampleInt,
            overallRate: snapshotConfig.overallRate ?? null,
            connectionRate: snapshotConfig.connectionRate ?? null,
            ignoreCoordinatedOmission: snapshotConfig.ignoreCoordinatedOmission,
            bailout: snapshotConfig.bailout ?? null,
            maxConnectionRequests: snapshotConfig.maxConnectionRequests ?? null,
            maxOverallRequests: snapshotConfig.maxOverallRequests ?? null,
            reconnectRate: snapshotConfig.reconnectRate ?? null,
            excludeErrorStats: snapshotConfig.excludeErrorStats,
            idReplacement: snapshotConfig.idReplacement,
            expectBody: snapshotConfig.expectBody,
            servername: snapshotConfig.servername,
            warmupEnabled: snapshotConfig.warmupEnabled,
            warmupConnections: snapshotConfig.warmupConnections,
            warmupDuration: snapshotConfig.warmupDuration,
            headers: snapshotConfig.headers,
            bodyMode: snapshotConfig.bodyMode,
            body: snapshotConfig.body,
            contentType: snapshotConfig.contentType,
            formFields: snapshotConfig.formFields,
            useHar: snapshotConfig.useHar,
            harRaw: snapshotConfig.harRaw ?? null,
            rampConfig: snapshotConfig.rampConfig,
            spikeConfig: snapshotConfig.spikeConfig,
          }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || `Server rejected benchmark (${response.status})`);
        }

        if (!response.body) {
          throw new Error('Streaming response body unavailable.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processBlock = (block: string) => {
          const lines = block.split('\n');
          let eventName = 'message';
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) return;
          const payload = JSON.parse(dataLines.join('\n'));

          if (eventName === 'stage') {
            setActiveStageLabel(String(payload.label || ''));
          } else if (eventName === 'worker_heartbeat') {
            setElapsedSec(Number(payload.elapsedSec || 0));
            setActiveStageLabel(String(payload.stageLabel || ''));
          } else if (eventName === 'tick') {
            const tick = payload as TickSample;
            collectedTicks.push(tick);
            setLiveTicks([...collectedTicks]);
            setElapsedSec(tick.elapsedSec);
          } else if (eventName === 'error') {
            setErrorBanner(String(payload.message || 'Benchmark execution failed.'));
          } else if (eventName === 'done') {
            const finalStatus = payload.status as BenchmarkRunRecord['status'];
            const summary = payload.result as AutocannonResultSummary;
            const apdexScore = computeApdexScore(summary, snapshotConfig.sloTargetLatencyMs);
            const diagnostics = analyzeBottlenecks(summary, snapshotConfig, finalStatus);

            const lightweightConfig: BenchmarkConfig = {
              ...snapshotConfig,
              harRaw: undefined,
            };

            const record: BenchmarkRunRecord = {
              id: runId,
              title: snapshotConfig.title.trim() || 'Benchmark Run',
              createdAt: new Date().toISOString(),
              status: finalStatus,
              config: lightweightConfig,
              ticks: collectedTicks,
              result: summary,
              apdexScore,
              diagnostics,
              cliCommand: buildAutocannonCliCommand(snapshotConfig),
            };

            setSelectedRun(record);
            setRuns((prev) => {
              const next = [record, ...prev];
              saveStoredRuns(next);
              return next;
            });
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            if (part.trim()) processBlock(part);
          }
        }

        if (buffer.trim()) {
          processBlock(buffer);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          notify('Benchmark stopped');
        } else {
          setErrorBanner(err instanceof Error ? err.message : 'Unable to execute benchmark.');
        }
      } finally {
        setIsRunning(false);
        setActiveRunId(null);
        abortControllerRef.current = null;
      }
    },
    [config, isRunning, notify]
  );

  // Global Cmd+Enter / Ctrl+Enter shortcut to start/stop benchmark
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isRunning) {
          handleStopBenchmark();
        } else {
          executeBenchmark();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRunning, handleStopBenchmark, executeBenchmark]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto h-full px-6 sm:px-8 flex items-center justify-between gap-6">
          {/* Brand + Breadcrumbs */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-current text-indigo-400" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                CannonBench
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 truncate">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-500 whitespace-nowrap">Benchmarks</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-slate-800 truncate max-w-[260px]">
                {selectedRun ? selectedRun.title : config.title || 'Active Workspace'}
              </span>
            </div>
          </div>

          {/* Right Triggers */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors whitespace-nowrap shrink-0"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Run History</span>
              {runs.length > 0 && (
                <span className="font-mono tabular-nums text-[11px] text-slate-500">
                  ({runs.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Spacious Canvas */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6">
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-xs text-rose-800">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="font-semibold text-rose-700 hover:text-rose-900 whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Test Control Bar */}
        <HeroControlBar
          config={config}
          onChange={setConfig}
          isRunning={isRunning}
          elapsedSec={elapsedSec}
          totalEstimatedSec={totalEstimatedSec}
          activeStageLabel={activeStageLabel}
          onStart={() => executeBenchmark()}
          onStop={handleStopBenchmark}
        />

        {/* Collapsible Request Options Tabs */}
        <RequestOptionsAccordion
          config={config}
          onChange={setConfig}
          isRunning={isRunning}
          onNotify={notify}
        />

        {/* Live Bento Metrics Row */}
        <BentoMetricsRow
          run={selectedRun}
          previousRun={previousRunForTrend}
          liveTicks={liveTicks}
          isRunning={isRunning}
          config={config}
        />

        {/* Live Telemetry Area (Dual-Line Graph / Empty State Presets) */}
        <DualTelemetryChart
          ticks={selectedRun ? selectedRun.ticks : liveTicks}
          isRunning={isRunning}
          workersCount={config.workers}
          emptyPresets={builtInPresets}
          onSelectPreset={(presetConfig, runImmediately) => {
            if (runImmediately) {
              executeBenchmark(presetConfig);
            } else {
              setConfig(presetConfig);
            }
          }}
        />

        {/* Two-Column Detailed Results & Distribution */}
        {selectedRun && <ResultsDistribution run={selectedRun} />}
      </main>

      {/* Run History Slide-Over Drawer */}
      <RunHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        runs={runs}
        activeRunId={selectedRun?.id ?? null}
        onSelectRun={(run) => {
          setSelectedRun(run);
          setConfig(structuredClone(run.config));
          notify(`Loaded run: ${run.title}`);
        }}
        onDeleteRun={(id) => {
          setRuns((prev) => {
            const next = prev.filter((r) => r.id !== id);
            saveStoredRuns(next);
            return next;
          });
          if (selectedRun?.id === id) setSelectedRun(null);
          notify('Run deleted');
        }}
        onClearHistory={() => {
          setRuns([]);
          saveStoredRuns([]);
          setSelectedRun(null);
          notify('Run history cleared');
        }}
        onImportRuns={(imported) => {
          setRuns((prev) => {
            const existing = new Set(prev.map((r) => r.id));
            const merged = [...imported.filter((r) => !existing.has(r.id)), ...prev];
            saveStoredRuns(merged);
            return merged;
          });
        }}
        onNotify={notify}
      />

      {/* Export Report & CI Gate Modal */}
      <ExportReportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        run={selectedRun}
        activeConfig={config}
        onNotify={notify}
      />

      {/* Subtle Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
