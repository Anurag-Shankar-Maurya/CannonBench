'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  FileText,
  Gauge,
  History,
  Layers,
  Menu,
  Play,
  Square,
  X,
} from 'lucide-react';
import type {
  AutocannonResultSummary,
  BenchmarkConfig,
  BenchmarkRunRecord,
  EnvironmentPreset,
  TickSample,
} from '@/types/benchmark';
import { buildAutocannonCliCommand } from '@/lib/autocannon-cli';
import { analyzeBottlenecks, computeApdexScore } from '@/lib/diagnostics';
import {
  createDefaultBenchmarkConfig,
  getBuiltInPresets,
  loadCustomPresets,
  loadStoredRuns,
  saveCustomPresets,
  saveStoredRuns,
} from '@/lib/presets';
import RunnerConfigPanel from './RunnerConfigPanel';
import RunResultPanel from './RunResultPanel';
import PresetsHarView from './PresetsHarView';
import HistoryCompareView from './HistoryCompareView';
import ReportsCiView from './ReportsCiView';

type ActiveView = 'runner' | 'presets' | 'history' | 'reports';

export default function CannonBenchApp() {
  const [activeView, setActiveView] = useState<ActiveView>('runner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [config, setConfig] = useState<BenchmarkConfig>(() =>
    createDefaultBenchmarkConfig('')
  );
  const [runs, setRuns] = useState<BenchmarkRunRecord[]>([]);
  const [customPresets, setCustomPresets] = useState<EnvironmentPreset[]>([]);
  const [origin, setOrigin] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeStageLabel, setActiveStageLabel] = useState('');
  const [liveTicks, setLiveTicks] = useState<TickSample[]>([]);
  const [workerElapsedSec, setWorkerElapsedSec] = useState(0);
  const [latestRun, setLatestRun] = useState<BenchmarkRunRecord | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [compareRunAId, setCompareRunAId] = useState<string | null>(null);
  const [compareRunBId, setCompareRunBId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2600);
  };

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
      const storedRuns = loadStoredRuns();
      setRuns(storedRuns);
      if (storedRuns.length > 0) {
        setLatestRun(storedRuns[0]);
        setCompareRunBId(storedRuns[0].id);
        if (storedRuns.length > 1) {
          setCompareRunAId(storedRuns[1].id);
        }
      }
      setCustomPresets(loadCustomPresets());
    });
    return () => {
      active = false;
    };
  }, []);

  const allPresets = useMemo(
    () => [...getBuiltInPresets(origin), ...customPresets],
    [origin, customPresets]
  );

  const handleStopBenchmark = async () => {
    if (!isRunning || !activeRunId) return;
    try {
      await fetch('/api/benchmark/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeRunId }),
      });
      notify('Stopping benchmark...');
    } catch {
      abortControllerRef.current?.abort();
    }
  };

  const handleStartBenchmark = async () => {
    if (isRunning) return;
    setActiveView('runner');
    setErrorBanner(null);
    setLiveTicks([]);
    setLatestRun(null);
    setWorkerElapsedSec(0);
    setActiveStageLabel('');

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const snapshotConfig = structuredClone(config);
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
          setWorkerElapsedSec(Number(payload.elapsedSec || 0));
          setActiveStageLabel(String(payload.stageLabel || ''));
        } else if (eventName === 'tick') {
          const tick = payload as TickSample;
          collectedTicks.push(tick);
          setLiveTicks([...collectedTicks]);
          setWorkerElapsedSec(tick.elapsedSec);
        } else if (eventName === 'error') {
          setErrorBanner(String(payload.message || 'Benchmark execution failed.'));
        } else if (eventName === 'done') {
          const finalStatus = payload.status as BenchmarkRunRecord['status'];
          const summary = payload.result as AutocannonResultSummary;
          const apdexScore = computeApdexScore(summary, snapshotConfig.sloTargetLatencyMs);
          const diagnostics = analyzeBottlenecks(summary, snapshotConfig, finalStatus);

          // Avoid storing huge raw HAR JSON repeatedly inside localStorage history
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

          setLatestRun(record);
          setRuns((prev) => {
            const next = [record, ...prev];
            saveStoredRuns(next);
            return next;
          });
          setCompareRunBId(record.id);
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
        notify('Benchmark aborted');
      } else {
        setErrorBanner(err instanceof Error ? err.message : 'Unable to execute benchmark.');
      }
    } finally {
      setIsRunning(false);
      setActiveRunId(null);
      abortControllerRef.current = null;
    }
  };

  const handleSavePreset = (
    name: string,
    description: string,
    presetConfig: BenchmarkConfig
  ) => {
    const newPreset: EnvironmentPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: 'Custom',
      isBuiltIn: false,
      config: structuredClone(presetConfig),
    };
    setCustomPresets((prev) => {
      const next = [newPreset, ...prev];
      saveCustomPresets(next);
      return next;
    });
    notify(`Saved preset "${name}"`);
  };

  const handleQuickSavePreset = (presetConfig: BenchmarkConfig) => {
    const label = presetConfig.title.trim() || `${presetConfig.method} Preset`;
    handleSavePreset(label, `${presetConfig.method} ${presetConfig.url}`, presetConfig);
  };

  const breadcrumbLabel =
    activeView === 'runner'
      ? 'Test Runner'
      : activeView === 'presets'
        ? 'Presets & HAR Replay'
        : activeView === 'history'
          ? 'Run History & Compare'
          : 'Reports & CI Gate';

  const navItems: Array<{ id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'runner', label: 'Runner', icon: Gauge },
    { id: 'presets', label: 'Presets & HAR', icon: Layers },
    { id: 'history', label: 'History & Compare', icon: History },
    { id: 'reports', label: 'Reports & CI', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden"
        />
      )}

      {/* Left Sidebar (248px) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[248px] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-150 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              CannonBench
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-slate-500 hover:text-slate-900 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Clean Local Storage Summary Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Saved Runs</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              {runs.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Presets</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              {allPresets.length}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Stored locally in browser
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Contextual Bar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <span className="font-medium text-slate-900 whitespace-nowrap">Workspace</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-600 truncate">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isRunning && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-blue-700">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {activeStageLabel || 'Streaming'} · {workerElapsedSec}s
                </span>
              </div>
            )}

            {isRunning ? (
              <button
                type="button"
                onClick={handleStopBenchmark}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Test
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartBenchmark}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Benchmark
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-5">
          {errorBanner && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 text-xs text-red-800">
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="text-red-700 hover:text-red-900 font-medium whitespace-nowrap shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeView === 'runner' && (
            <div className="space-y-5">
              <RunnerConfigPanel
                config={config}
                onChange={setConfig}
                presets={allPresets}
                isRunning={isRunning}
                onNotify={notify}
              />

              <RunResultPanel
                run={latestRun}
                liveTicks={liveTicks}
                isRunning={isRunning}
                activeStageLabel={activeStageLabel}
                activeConfig={config}
                onSaveAsPreset={handleQuickSavePreset}
                onSendToCompare={(id) => {
                  setCompareRunBId(id);
                  setActiveView('history');
                }}
              />
            </div>
          )}

          {activeView === 'presets' && (
            <PresetsHarView
              presets={allPresets}
              currentConfig={config}
              onLoadPreset={(nextCfg) => {
                setConfig(nextCfg);
                setActiveView('runner');
              }}
              onSavePreset={handleSavePreset}
              onDeletePreset={(id) => {
                setCustomPresets((prev) => {
                  const next = prev.filter((p) => p.id !== id);
                  saveCustomPresets(next);
                  return next;
                });
                notify('Preset deleted');
              }}
              onNotify={notify}
            />
          )}

          {activeView === 'history' && (
            <HistoryCompareView
              runs={runs}
              compareRunAId={compareRunAId}
              compareRunBId={compareRunBId}
              onSelectCompareA={setCompareRunAId}
              onSelectCompareB={setCompareRunBId}
              onDeleteRun={(id) => {
                setRuns((prev) => {
                  const next = prev.filter((r) => r.id !== id);
                  saveStoredRuns(next);
                  return next;
                });
                if (latestRun?.id === id) setLatestRun(null);
                notify('Run removed from history');
              }}
              onClearHistory={() => {
                setRuns([]);
                saveStoredRuns([]);
                setLatestRun(null);
                notify('Cleared run history');
              }}
              onImportRuns={(imported) => {
                setRuns((prev) => {
                  const existingIds = new Set(prev.map((r) => r.id));
                  const merged = [
                    ...imported.filter((r) => !existingIds.has(r.id)),
                    ...prev,
                  ];
                  saveStoredRuns(merged);
                  return merged;
                });
              }}
              onRerunConfig={(nextCfg) => {
                setConfig(nextCfg);
                setActiveView('runner');
                notify('Loaded configuration into Runner');
              }}
              onSavePreset={handleQuickSavePreset}
              onGoToRunner={() => setActiveView('runner')}
              onNotify={notify}
            />
          )}

          {activeView === 'reports' && (
            <ReportsCiView
              runs={runs}
              activeConfig={config}
              onUpdateSlo={(targetLatencyMs, maxErrorPct) => {
                setConfig((prev) => ({
                  ...prev,
                  sloTargetLatencyMs: targetLatencyMs,
                  sloMaxErrorPct: maxErrorPct,
                }));
              }}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {/* Non-blocking Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-md">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
