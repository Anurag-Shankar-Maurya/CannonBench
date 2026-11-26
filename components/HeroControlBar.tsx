'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, Globe, Play, SlidersHorizontal, Square, Zap } from 'lucide-react';
import type { BenchmarkConfig, HttpMethod } from '@/types/benchmark';

interface HeroControlBarProps {
  config: BenchmarkConfig;
  onChange: (next: BenchmarkConfig) => void;
  isRunning: boolean;
  elapsedSec: number;
  totalEstimatedSec: number;
  activeStageLabel: string;
  onStart: () => void;
  onStop: () => void;
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const CONCURRENCY_OPTIONS = [10, 25, 50, 100, 250];
const DURATION_OPTIONS = [10, 30, 60];

function methodPillClasses(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'POST':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'DELETE':
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default function HeroControlBar({
  config,
  onChange,
  isRunning,
  elapsedSec,
  totalEstimatedSec,
  activeStageLabel,
  onStart,
  onStop,
}: HeroControlBarProps) {
  const [showCustomConn, setShowCustomConn] = useState(false);

  const progressPct =
    totalEstimatedSec > 0
      ? Math.min(100, Math.round((elapsedSec / totalEstimatedSec) * 100))
      : 0;
  const remainingSec = Math.max(0, totalEstimatedSec - elapsedSec);

  const update = <K extends keyof BenchmarkConfig>(key: K, val: BenchmarkConfig[K]) => {
    onChange({ ...config, [key]: val });
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs overflow-visible space-y-3">
      {/* Row 1: Method Selector + Full-Width Target URL Input + Start Benchmark CTA (Desktop) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
        {/* Method + URL Input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <select
              aria-label="HTTP Method"
              disabled={isRunning || config.useHar}
              value={config.method}
              onChange={(e) => update('method', e.target.value as HttpMethod)}
              className={`h-11 pl-3.5 pr-8 text-xs font-mono font-semibold rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-colors ${methodPillClasses(
                config.method
              )}`}
            >
              {METHODS.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900">
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60" />
          </div>

          <div className="relative flex-1 min-w-0 flex items-center">
            <input
              type="url"
              aria-label="Target URL"
              disabled={isRunning}
              value={config.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://api.example.com/v1/..."
              className="h-11 w-full min-w-0 pl-4 pr-24 text-sm font-mono text-slate-900 placeholder:text-slate-400 bg-slate-50/70 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                update('url', `${origin}/api/sandbox/target?delay=18&jitter=12`);
              }}
              className="absolute right-2 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Sandbox
            </button>
          </div>
        </div>

        {/* Primary CTA on Desktop / Tablet (Row 1 right) */}
        <div className="hidden sm:block shrink-0">
          {isRunning ? (
            <button
              type="button"
              onClick={onStop}
              className="h-11 px-5 lg:px-6 inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Test</span>
              <span className="font-mono tabular-nums text-[11px] bg-rose-700/80 px-2 py-0.5 rounded-md">
                {remainingSec}s
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="h-11 px-5 lg:px-6 inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-xl shadow-xs transition-colors whitespace-nowrap group"
            >
              <Play className="w-3.5 h-3.5 fill-current text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span>Start Benchmark</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700 rounded">
                ⌘↵
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Concurrency + Duration + Engine Mode (+ Primary CTA on Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100/90">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          {/* Concurrency Preset Selector + Custom Slider Popover */}
          <div className="relative flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl">
            <span className="px-2 text-[11px] font-medium text-slate-500 whitespace-nowrap">
              Conn
            </span>
            {CONCURRENCY_OPTIONS.map((c) => {
              const active =
                config.connections === c &&
                config.pattern !== 'ramp' &&
                config.pattern !== 'spike';
              return (
                <button
                  key={c}
                  type="button"
                  disabled={isRunning}
                  onClick={() =>
                    onChange({
                      ...config,
                      pattern: config.pattern === 'ramp' || config.pattern === 'spike' ? 'constant' : config.pattern,
                      connections: c,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs font-mono tabular-nums font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  } disabled:opacity-50`}
                >
                  {c}
                </button>
              );
            })}
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setShowCustomConn((v) => !v)}
              aria-label="Custom concurrency slider"
              className={`px-2 py-1.5 text-xs font-mono rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                !CONCURRENCY_OPTIONS.includes(config.connections)
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {!CONCURRENCY_OPTIONS.includes(config.connections) && (
                <span className="tabular-nums">{config.connections}</span>
              )}
            </button>

            {showCustomConn && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-64 p-4 bg-white border border-slate-200 rounded-xl shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Custom Connections</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {config.connections}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={config.connections}
                  onChange={(e) => update('connections', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={config.connections}
                    onChange={(e) =>
                      update('connections', Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                    }
                    className="w-20 h-8 px-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomConn(false)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Duration Preset Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl">
            {DURATION_OPTIONS.map((d) => {
              const active =
                config.duration === d &&
                !config.amount &&
                config.pattern !== 'ramp' &&
                config.pattern !== 'spike';
              return (
                <button
                  key={d}
                  type="button"
                  disabled={isRunning}
                  onClick={() =>
                    onChange({
                      ...config,
                      amount: undefined,
                      pattern: config.pattern === 'ramp' || config.pattern === 'spike' ? 'constant' : config.pattern,
                      duration: d,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs font-mono tabular-nums font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  } disabled:opacity-50`}
                >
                  {d}s
                </button>
              );
            })}
          </div>

          {/* Engine Mode Toggle: Native Node.js Autocannon vs Browser Edge */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl relative group">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => update('engineMode', 'native')}
              title="Native Node.js Autocannon Engine: Raw TCP sockets, 100% terminal parity with npx autocannon (supports 25-500 connections, bypasses browser 6-socket limit)"
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                config.engineMode !== 'browser'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              } disabled:opacity-50`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
              <span>Native</span>
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => update('engineMode', 'browser')}
              title="Browser Edge Engine: Client-side fetch() without server (HTTP/1.1 capped at 6 concurrent connections per host by browser)"
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                config.engineMode === 'browser'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              } disabled:opacity-50`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Browser</span>
            </button>

            {config.engineMode === 'browser' && config.connections > 6 && (
              <span
                title="Browsers enforce a hard limit of 6 simultaneous TCP connections per host for HTTP/1.1. Concurrency > 6 causes browser queueing delay. Switch to Native for full raw socket concurrency."
                className="hidden lg:inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md shrink-0 cursor-help"
              >
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Browser 6-conn cap
              </span>
            )}
          </div>
        </div>

        {/* Primary CTA on Mobile Viewports (<640px) */}
        <div className="sm:hidden shrink-0 w-full pt-1">
          {isRunning ? (
            <button
              type="button"
              onClick={onStop}
              className="w-full h-11 px-6 inline-flex items-center justify-center gap-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Test</span>
              <span className="font-mono tabular-nums text-[11px] bg-rose-700/80 px-2 py-0.5 rounded-md">
                {remainingSec}s
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="w-full h-11 px-6 inline-flex items-center justify-center gap-2.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-xl shadow-xs transition-colors whitespace-nowrap group"
            >
              <Play className="w-3.5 h-3.5 fill-current text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span>Start Benchmark</span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown Progress Bar while running */}
      {isRunning && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
            <span className="inline-flex items-center gap-2 text-indigo-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {activeStageLabel || 'Running benchmark'}
            </span>
            <span>
              {elapsedSec}s / {totalEstimatedSec}s ({progressPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
