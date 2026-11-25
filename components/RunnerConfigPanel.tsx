'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileUp,
  KeyRound,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type {
  BenchmarkConfig,
  BodyMode,
  EnvironmentPreset,
  HttpMethod,
  LoadPattern,
} from '@/types/benchmark';
import { buildAutocannonCliCommand, parseHarFileJson } from '@/lib/autocannon-cli';

interface RunnerConfigPanelProps {
  config: BenchmarkConfig;
  onChange: (next: BenchmarkConfig) => void;
  presets: EnvironmentPreset[];
  isRunning: boolean;
  onNotify: (msg: string) => void;
}

type ConfigTab = 'load' | 'headers' | 'payload' | 'engine' | 'har';

const HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

const PATTERNS: Array<{ id: LoadPattern; label: string }> = [
  { id: 'constant', label: 'Constant' },
  { id: 'ramp', label: 'Ramp-Up' },
  { id: 'spike', label: 'Spike' },
  { id: 'soak', label: 'Soak' },
  { id: 'rate', label: 'Rate-Paced' },
];

export default function RunnerConfigPanel({
  config,
  onChange,
  presets,
  isRunning,
  onNotify,
}: RunnerConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('load');
  const [copiedCli, setCopiedCli] = useState(false);
  const [ignoreStaticHar, setIgnoreStaticHar] = useState(true);
  const [harError, setHarError] = useState<string | null>(null);
  const [authHelperType, setAuthHelperType] = useState<'bearer' | 'apikey' | 'basic' | 'cookie'>(
    'bearer'
  );
  const [authHelperValue, setAuthHelperValue] = useState('');
  const [authHeaderName, setAuthHeaderName] = useState('X-API-Key');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cliCommand = useMemo(() => buildAutocannonCliCommand(config), [config]);

  const update = <K extends keyof BenchmarkConfig>(key: K, val: BenchmarkConfig[K]) => {
    onChange({ ...config, [key]: val });
  };

  const handlePatternSelect = (pattern: LoadPattern) => {
    if (pattern === 'soak') {
      onChange({
        ...config,
        pattern,
        connections: Math.min(config.connections, 15),
        duration: Math.max(config.duration, 60),
      });
    } else if (pattern === 'rate') {
      onChange({
        ...config,
        pattern,
        overallRate: config.overallRate ?? 100,
      });
    } else {
      onChange({ ...config, pattern });
    }
  };

  const handleApplyAuthHelper = () => {
    const val = authHelperValue.trim();
    if (!val) return;
    let key = 'Authorization';
    let finalVal = val;

    if (authHelperType === 'bearer') {
      key = 'Authorization';
      finalVal = val.startsWith('Bearer ') ? val : `Bearer ${val}`;
    } else if (authHelperType === 'basic') {
      key = 'Authorization';
      finalVal = val.startsWith('Basic ')
        ? val
        : `Basic ${typeof btoa === 'function' ? btoa(val) : val}`;
    } else if (authHelperType === 'apikey') {
      key = authHeaderName.trim() || 'X-API-Key';
      finalVal = val;
    } else if (authHelperType === 'cookie') {
      key = 'Cookie';
      finalVal = val;
    }

    const existingIdx = config.headers.findIndex(
      (h) => h.key.toLowerCase() === key.toLowerCase()
    );
    const nextHeaders = [...config.headers];
    if (existingIdx >= 0) {
      nextHeaders[existingIdx] = { ...nextHeaders[existingIdx], key, value: finalVal, enabled: true };
    } else {
      nextHeaders.push({
        id: `h-${Date.now()}`,
        key,
        value: finalVal,
        enabled: true,
      });
    }
    update('headers', nextHeaders);
    setAuthHelperValue('');
    onNotify(`Applied ${key} header`);
  };

  const handleHarFile = async (file: File) => {
    setHarError(null);
    try {
      const text = await file.text();
      const parsed = parseHarFileJson(text, ignoreStaticHar);
      onChange({
        ...config,
        useHar: true,
        harFileName: file.name,
        harRaw: parsed.sanitizedHar,
        harRequests: parsed.requests,
        url: parsed.origins[0] ? parsed.requests[0].url : config.url,
      });
      onNotify(`Loaded ${parsed.requests.length} requests from ${file.name}`);
    } catch (err) {
      setHarError(err instanceof Error ? err.message : 'Failed to parse HAR file.');
    }
  };

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopiedCli(true);
      onNotify('Copied npx autocannon command');
      setTimeout(() => setCopiedCli(false), 1800);
    } catch {
      onNotify('Clipboard unavailable');
    }
  };

  const insertBodyToken = (token: string) => {
    const nextBodyMode: BodyMode = config.bodyMode === 'none' ? 'raw' : config.bodyMode;
    const nextBody = config.body ? `${config.body}\n${token}` : token;
    onChange({
      ...config,
      bodyMode: nextBodyMode,
      body: nextBody,
      idReplacement: token === '[<id>]' ? true : config.idReplacement,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Primary Target Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <select
              aria-label="HTTP Method"
              disabled={isRunning || config.useHar}
              value={config.method}
              onChange={(e) => update('method', e.target.value as HttpMethod)}
              className="h-10 px-3 text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-50"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="url"
              aria-label="Target URL"
              disabled={isRunning}
              value={config.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://api.example.com/v1/health"
              className="h-10 flex-1 min-w-0 px-3 text-sm font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Load Preset"
              disabled={isRunning}
              value=""
              onChange={(e) => {
                const chosen = presets.find((p) => p.id === e.target.value);
                if (chosen) {
                  onChange(structuredClone(chosen.config));
                  onNotify(`Loaded preset: ${chosen.name}`);
                }
              }}
              className="h-10 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="" disabled>
                Load Preset...
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                update('url', `${origin}/api/sandbox/target?delay=15&jitter=10`);
                onNotify('Target set to built-in Sandbox Echo');
              }}
              className="h-10 px-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Use Sandbox
            </button>
          </div>
        </div>

        {/* Pattern Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md overflow-x-auto">
            {PATTERNS.map((p) => {
              const active = config.pattern === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => handlePatternSelect(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  } disabled:opacity-50`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {config.useHar
                ? `HAR Replay Active (${config.harRequests.length} requests)`
                : `${config.connections} conn · ${config.duration}s`}
            </span>
            <span aria-hidden="true">·</span>
            <span>Pipelining {config.pipelining}x</span>
            {config.workers > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{config.workers} workers</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-5 overflow-x-auto">
        {(
          [
            { id: 'load', label: 'Load & Timing' },
            {
              id: 'headers',
              label: `Headers & Auth (${config.headers.filter((h) => h.enabled && h.key).length})`,
            },
            { id: 'payload', label: 'Payload & Form' },
            { id: 'engine', label: 'Autocannon Engine' },
            {
              id: 'har',
              label: config.useHar ? `HAR Replay (${config.harRequests.length})` : 'HAR Replay',
            },
          ] as Array<{ id: ConfigTab; label: string }>
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-4">
        {activeTab === 'load' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Run Title (-T)
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="API Baseline"
                  className="w-full h-9 px-3 text-xs text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Connections (-c):{' '}
                  <span className="font-mono tabular-nums text-slate-900">
                    {config.connections}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={500}
                    disabled={isRunning || config.pattern === 'ramp' || config.pattern === 'spike'}
                    value={config.connections}
                    onChange={(e) => update('connections', Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min={1}
                    max={500}
                    disabled={isRunning || config.pattern === 'ramp' || config.pattern === 'spike'}
                    value={config.connections}
                    onChange={(e) =>
                      update('connections', Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                    }
                    className="w-16 h-9 px-2 text-xs font-mono tabular-nums text-right border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Duration (-d sec):{' '}
                  <span className="font-mono tabular-nums text-slate-900">{config.duration}s</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={300}
                    disabled={
                      isRunning ||
                      Boolean(config.amount && config.amount > 0) ||
                      config.pattern === 'ramp' ||
                      config.pattern === 'spike'
                    }
                    value={config.duration}
                    onChange={(e) => update('duration', Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    min={1}
                    max={300}
                    disabled={
                      isRunning ||
                      Boolean(config.amount && config.amount > 0) ||
                      config.pattern === 'ramp' ||
                      config.pattern === 'spike'
                    }
                    value={config.duration}
                    onChange={(e) =>
                      update('duration', Math.max(1, Math.min(300, Number(e.target.value) || 1)))
                    }
                    className="w-16 h-9 px-2 text-xs font-mono tabular-nums text-right border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fixed Request Count (-a)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500000}
                  disabled={isRunning || config.pattern === 'ramp' || config.pattern === 'spike'}
                  value={config.amount ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    update('amount', val > 0 ? val : undefined);
                  }}
                  placeholder="Optional (overrides -d)"
                  className="w-full h-9 px-3 text-xs font-mono tabular-nums text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Pattern-specific Stage Controls */}
            {config.pattern === 'ramp' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Connections
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    disabled={isRunning}
                    value={config.rampConfig.startConnections}
                    onChange={(e) =>
                      update('rampConfig', {
                        ...config.rampConfig,
                        startConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Connections
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    disabled={isRunning}
                    value={config.rampConfig.endConnections}
                    onChange={(e) =>
                      update('rampConfig', {
                        ...config.rampConfig,
                        endConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Step Count
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    disabled={isRunning}
                    value={config.rampConfig.steps}
                    onChange={(e) =>
                      update('rampConfig', {
                        ...config.rampConfig,
                        steps: Math.max(2, Math.min(10, Number(e.target.value) || 2)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sec per Step
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    disabled={isRunning}
                    value={config.rampConfig.stepDurationSec}
                    onChange={(e) =>
                      update('rampConfig', {
                        ...config.rampConfig,
                        stepDurationSec: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            )}

            {config.pattern === 'spike' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Baseline Conn
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    disabled={isRunning}
                    value={config.spikeConfig.baselineConnections}
                    onChange={(e) =>
                      update('spikeConfig', {
                        ...config.spikeConfig,
                        baselineConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Spike Burst Conn
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    disabled={isRunning}
                    value={config.spikeConfig.spikeConnections}
                    onChange={(e) =>
                      update('spikeConfig', {
                        ...config.spikeConfig,
                        spikeConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Baseline (s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    disabled={isRunning}
                    value={config.spikeConfig.baselineDurationSec}
                    onChange={(e) =>
                      update('spikeConfig', {
                        ...config.spikeConfig,
                        baselineDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Spike (s)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    disabled={isRunning}
                    value={config.spikeConfig.spikeDurationSec}
                    onChange={(e) =>
                      update('spikeConfig', {
                        ...config.spikeConfig,
                        spikeDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Recovery (s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    disabled={isRunning}
                    value={config.spikeConfig.recoveryDurationSec}
                    onChange={(e) =>
                      update('spikeConfig', {
                        ...config.spikeConfig,
                        recoveryDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                      })
                    }
                    className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                </div>
              </div>
            )}

            {/* Warmup Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-700 font-medium">
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.warmupEnabled}
                  onChange={(e) => update('warmupEnabled', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                Warmup Phase (-W)
              </label>
              {config.warmupEnabled && (
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-slate-600">
                    Conn:
                    <input
                      type="number"
                      min={1}
                      max={100}
                      disabled={isRunning}
                      value={config.warmupConnections}
                      onChange={(e) =>
                        update('warmupConnections', Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                      }
                      className="w-16 h-7 px-2 font-mono tabular-nums border border-slate-200 rounded"
                    />
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-slate-600">
                    Duration (s):
                    <input
                      type="number"
                      min={1}
                      max={15}
                      disabled={isRunning}
                      value={config.warmupDuration}
                      onChange={(e) =>
                        update('warmupDuration', Math.max(1, Math.min(15, Number(e.target.value) || 1)))
                      }
                      className="w-16 h-7 px-2 font-mono tabular-nums border border-slate-200 rounded"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-4">
            {/* Quick Auth Builder */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-wrap items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                Quick Auth:
              </span>
              <select
                value={authHelperType}
                onChange={(e) =>
                  setAuthHelperType(e.target.value as 'bearer' | 'apikey' | 'basic' | 'cookie')
                }
                className="h-8 px-2 text-xs bg-white border border-slate-200 rounded"
              >
                <option value="bearer">Bearer JWT</option>
                <option value="apikey">API Key Header</option>
                <option value="basic">Basic Auth (user:pass)</option>
                <option value="cookie">Cookie Header</option>
              </select>
              {authHelperType === 'apikey' && (
                <input
                  type="text"
                  value={authHeaderName}
                  onChange={(e) => setAuthHeaderName(e.target.value)}
                  placeholder="X-API-Key"
                  className="h-8 w-32 px-2 text-xs font-mono bg-white border border-slate-200 rounded"
                />
              )}
              <input
                type="text"
                value={authHelperValue}
                onChange={(e) => setAuthHelperValue(e.target.value)}
                placeholder={
                  authHelperType === 'basic'
                    ? 'username:password'
                    : authHelperType === 'cookie'
                      ? 'session_id=abc123'
                      : 'Paste token or secret...'
                }
                className="h-8 flex-1 min-w-[180px] px-2.5 text-xs font-mono bg-white border border-slate-200 rounded"
              />
              <button
                type="button"
                onClick={handleApplyAuthHelper}
                className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                Apply Header
              </button>
            </div>

            {/* Key-Value Table */}
            <div className="space-y-2">
              {config.headers.map((header, idx) => (
                <div key={header.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => {
                      const next = [...config.headers];
                      next[idx] = { ...header, enabled: e.target.checked };
                      update('headers', next);
                    }}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => {
                      const next = [...config.headers];
                      next[idx] = { ...header, key: e.target.value };
                      update('headers', next);
                    }}
                    placeholder="Header-Name"
                    className="w-1/3 h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => {
                      const next = [...config.headers];
                      next[idx] = { ...header, value: e.target.value };
                      update('headers', next);
                    }}
                    placeholder="Value (supports {{$uuid}}, {{$timestamp}})"
                    className="flex-1 h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                  />
                  <button
                    type="button"
                    aria-label="Remove header"
                    onClick={() =>
                      update(
                        'headers',
                        config.headers.filter((h) => h.id !== header.id)
                      )
                    }
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  update('headers', [
                    ...config.headers,
                    { id: `h-${Date.now()}`, key: '', value: '', enabled: true },
                  ])
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Header
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payload' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                {(['none', 'raw', 'form'] as BodyMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update('bodyMode', mode)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      config.bodyMode === mode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'none'
                      ? 'No Body'
                      : mode === 'raw'
                        ? 'Raw JSON / Text (-b)'
                        : 'Multipart Form (-F)'}
                  </button>
                ))}
              </div>

              {config.bodyMode === 'raw' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Insert token:</span>
                  {['[<id>]', '{{$uuid}}', '{{$timestamp}}', '{{$random_int}}'].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => insertBodyToken(tok)}
                      className="px-2 py-1 text-[11px] font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {config.bodyMode === 'raw' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    Content-Type:
                    <select
                      value={config.contentType}
                      onChange={(e) => update('contentType', e.target.value)}
                      className="h-7 px-2 text-xs font-mono border border-slate-200 rounded bg-white"
                    >
                      <option value="application/json">application/json</option>
                      <option value="text/plain">text/plain</option>
                      <option value="application/x-www-form-urlencoded">
                        application/x-www-form-urlencoded
                      </option>
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.idReplacement}
                      onChange={(e) => update('idReplacement', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Enable native Autocannon [&lt;id&gt;] replacement (-I)
                  </label>
                </div>
                <textarea
                  rows={5}
                  value={config.body}
                  onChange={(e) => update('body', e.target.value)}
                  className="w-full p-3 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            {config.bodyMode === 'form' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Sends multipart/form-data text fields via Autocannon&apos;s -F option.
                </p>
                {config.formFields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const next = [...config.formFields];
                        next[idx] = { ...field, name: e.target.value };
                        update('formFields', next);
                      }}
                      placeholder="field_name"
                      className="w-1/3 h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const next = [...config.formFields];
                        next[idx] = { ...field, value: e.target.value };
                        update('formFields', next);
                      }}
                      placeholder="value"
                      className="flex-1 h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          'formFields',
                          config.formFields.filter((f) => f.id !== field.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update('formFields', [
                      ...config.formFields,
                      { id: `f-${Date.now()}`, name: '', value: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Form Field
                </button>
              </div>
            )}

            {config.bodyMode === 'none' && (
              <p className="text-xs text-slate-500 py-2">
                No request body configured. Switch to Raw JSON / Text or Multipart Form above for
                write benchmarks.
              </p>
            )}
          </div>
        )}

        {activeTab === 'engine' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pipelining (-p)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  disabled={isRunning}
                  value={config.pipelining}
                  onChange={(e) =>
                    update('pipelining', Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                  }
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Worker Threads (-w)
                </label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  disabled={isRunning}
                  value={config.workers}
                  onChange={(e) =>
                    update('workers', Math.max(0, Math.min(4, Number(e.target.value) || 0)))
                  }
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Timeout (-t sec)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  disabled={isRunning}
                  value={config.timeout}
                  onChange={(e) =>
                    update('timeout', Math.max(1, Math.min(60, Number(e.target.value) || 10)))
                  }
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sample Int (-L ms)
                </label>
                <input
                  type="number"
                  min={100}
                  max={5000}
                  step={100}
                  disabled={isRunning}
                  value={config.sampleInt}
                  onChange={(e) =>
                    update(
                      'sampleInt',
                      Math.max(100, Math.min(5000, Number(e.target.value) || 1000))
                    )
                  }
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Overall Rate (-R req/s)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  disabled={isRunning}
                  value={config.overallRate ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('overallRate', v > 0 ? v : undefined);
                  }}
                  placeholder="Unlimited"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Conn Rate (-r req/s)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  disabled={isRunning}
                  value={config.connectionRate ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('connectionRate', v > 0 ? v : undefined);
                  }}
                  placeholder="Unlimited"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Error Bailout (-B)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  disabled={isRunning}
                  value={config.bailout ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('bailout', v > 0 ? v : undefined);
                  }}
                  placeholder="Disabled"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reconnect Rate (-D)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500000}
                  disabled={isRunning}
                  value={config.reconnectRate ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('reconnectRate', v > 0 ? v : undefined);
                  }}
                  placeholder="Keep-alive"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Max Conn Reqs (-M)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500000}
                  disabled={isRunning}
                  value={config.maxConnectionRequests ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('maxConnectionRequests', v > 0 ? v : undefined);
                  }}
                  placeholder="Unlimited"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Max Overall Reqs (-O)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500000}
                  disabled={isRunning}
                  value={config.maxOverallRequests ?? ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    update('maxOverallRequests', v > 0 ? v : undefined);
                  }}
                  placeholder="Unlimited"
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Expect Body (-E)
                </label>
                <input
                  type="text"
                  disabled={isRunning || config.useHar}
                  value={config.expectBody}
                  onChange={(e) => update('expectBody', e.target.value)}
                  placeholder='e.g. "ok":true'
                  className="w-full h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  TLS SNI (-s)
                </label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.servername}
                  onChange={(e) => update('servername', e.target.value)}
                  placeholder="Hostname override"
                  className="w-full h-8 px-2.5 text-xs font-mono border border-slate-200 rounded"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={isRunning || (!config.overallRate && !config.connectionRate)}
                  checked={config.ignoreCoordinatedOmission}
                  onChange={(e) => update('ignoreCoordinatedOmission', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                Ignore Coordinated Omission (-C, requires -R or -r)
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.excludeErrorStats}
                  onChange={(e) => update('excludeErrorStats', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                Exclude Non-2xx from Latency Stats (-x)
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.idReplacement}
                  onChange={(e) => update('idReplacement', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                ID Replacement [&lt;id&gt;] (-I)
              </label>
            </div>
          </div>
        )}

        {activeTab === 'har' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    disabled={isRunning || config.harRequests.length === 0}
                    checked={config.useHar}
                    onChange={(e) => update('useHar', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Enable HAR Replay (--har)
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={ignoreStaticHar}
                    onChange={(e) => setIgnoreStaticHar(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Skip images, fonts & CSS
                </label>
              </div>

              {config.harRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      useHar: false,
                      harFileName: undefined,
                      harRaw: undefined,
                      harRequests: [],
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear HAR
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleHarFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-300 rounded-md p-5 text-center bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".har,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHarFile(file);
                }}
              />
              <FileUp className="w-5 h-5 mx-auto text-slate-500 mb-1.5" />
              <div className="text-xs font-medium text-slate-800">
                {config.harFileName
                  ? `Loaded ${config.harFileName} (${config.harRequests.length} endpoints)`
                  : 'Drop a Chrome DevTools .har recording here or click to browse'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Autocannon replays requests matching your target origin while preserving cookies and
                headers.
              </div>
            </div>

            {harError && <p className="text-xs text-red-600">{harError}</p>}

            {config.harRequests.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr className="text-slate-600">
                      <th className="text-left font-medium px-3 py-1.5">Method</th>
                      <th className="text-left font-medium px-3 py-1.5">Origin</th>
                      <th className="text-left font-medium px-3 py-1.5">Path</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {config.harRequests.slice(0, 25).map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 font-semibold text-slate-800">{r.method}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.origin}</td>
                        <td className="px-3 py-1.5 text-slate-700 truncate max-w-[320px]">
                          {r.path}
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

      {/* Live CLI Command Strip */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 shrink-0">CLI Equivalent:</span>
          <code className="text-xs font-mono text-slate-800 truncate select-all">
            {cliCommand}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopyCli}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedCli ? 'Copied' : 'Copy CLI'}
        </button>
      </div>
    </div>
  );
}
