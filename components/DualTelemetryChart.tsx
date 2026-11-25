'use client';

import React, { useState } from 'react';
import { ArrowRight, Gauge, ShieldAlert, Zap } from 'lucide-react';
import type { BenchmarkConfig, EnvironmentPreset, TickSample } from '@/types/benchmark';
import { formatBytes } from '@/lib/diagnostics';

interface DualTelemetryChartProps {
  ticks: TickSample[];
  isRunning: boolean;
  workersCount: number;
  emptyPresets: EnvironmentPreset[];
  onSelectPreset: (config: BenchmarkConfig, runImmediately?: boolean) => void;
}

export default function DualTelemetryChart({
  ticks,
  isRunning,
  workersCount,
  emptyPresets,
  onSelectPreset,
}: DualTelemetryChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 920;
  const height = 280;
  const padL = 56;
  const padR = 56;
  const padT = 20;
  const padB = 34;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const hasTicks = ticks.length > 0;
  const maxRps = hasTicks ? Math.max(10, ...ticks.map((t) => t.rps)) * 1.18 : 100;
  const maxLat = hasTicks
    ? Math.max(10, ...ticks.map((t) => Math.max(t.p99, t.avgLatency))) * 1.18
    : 100;

  const xFor = (i: number) => {
    if (ticks.length <= 1) return padL + innerW / 2;
    return padL + (i / (ticks.length - 1)) * innerW;
  };
  const yRps = (val: number) => padT + innerH - (val / maxRps) * innerH;
  const yLat = (val: number) => padT + innerH - (val / maxLat) * innerH;

  const buildPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  };

  const rpsPts = ticks.map((t, i) => ({ x: xFor(i), y: yRps(t.rps) }));
  const latPts = ticks.map((t, i) => ({ x: xFor(i), y: yLat(t.avgLatency) }));
  const rpsPath = buildPath(rpsPts);
  const latPath = buildPath(latPts);
  const rpsArea =
    rpsPts.length > 1
      ? `${rpsPath} L ${rpsPts[rpsPts.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${rpsPts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : '';

  const hovered = hoverIdx !== null && ticks[hoverIdx] ? ticks[hoverIdx] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (ticks.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    if (relX < padL || relX > width - padR) {
      setHoverIdx(null);
      return;
    }
    if (ticks.length === 1) {
      setHoverIdx(0);
      return;
    }
    const ratio = (relX - padL) / innerW;
    const idx = Math.min(ticks.length - 1, Math.max(0, Math.round(ratio * (ticks.length - 1))));
    setHoverIdx(idx);
  };

  const starterPresets = emptyPresets.slice(0, 3);

  return (
    <section className="min-h-[350px] p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">Real-Time Telemetry</h2>

          {isRunning && (
            <span className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              STREAMING (1s intervals)
            </span>
          )}

          {!isRunning && hasTicks && (
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {ticks.length}s recorded
            </span>
          )}
        </div>

        <div className="flex items-center gap-5 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="w-3 h-0.5 rounded-full bg-indigo-500 inline-block" />
            Requests / sec
          </span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="w-3 h-0.5 rounded-full bg-amber-500 inline-block" />
            Avg Latency (ms)
          </span>
        </div>
      </div>

      {/* Empty State with Instant Presets */}
      {!hasTicks && !isRunning ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="max-w-lg space-y-2 mb-7">
            <h3 className="text-sm font-semibold text-slate-900">
              Ready to benchmark your endpoint
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter any HTTP/HTTPS URL above and press <span className="font-mono text-slate-700">Cmd+Enter</span>, or launch one of these quick presets against the built-in sandbox target.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-left">
            {starterPresets.map((preset, idx) => {
              const Icon = idx === 0 ? Zap : idx === 1 ? Gauge : ShieldAlert;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(structuredClone(preset.config), true)}
                  className="group p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all text-left flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 text-indigo-600" />
                      <span className="text-[11px] font-mono text-slate-500">
                        {preset.config.method} · {preset.config.connections}c
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {preset.name}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600">
                    <span>Run preset</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : !hasTicks && isRunning ? (
        <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span>
              {workersCount > 0
                ? 'Multi-worker threads active — histograms aggregate upon completion...'
                : 'Establishing connections and awaiting first 1-second telemetry tick...'}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Hover Tooltip */}
          {hovered && (
            <div className="mb-3 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono tabular-nums inline-flex flex-wrap items-center gap-4 shadow-sm">
              <span className="text-slate-300">t = {hovered.elapsedSec}s</span>
              <span className="text-indigo-300 font-semibold">
                {hovered.rps.toLocaleString()} req/s
              </span>
              <span className="text-amber-300">
                avg {hovered.avgLatency}ms · p50 {hovered.p50}ms · p99 {hovered.p99}ms
              </span>
              <span className="text-slate-300">{formatBytes(hovered.bytesPerSec)}/s</span>
              {hovered.errors + hovered.count5xx > 0 && (
                <span className="text-rose-300">
                  {hovered.errors + hovered.count5xx} errs
                </span>
              )}
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[265px] select-none overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="pulseRpsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid + Dual Y-Axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = padT + innerH * (1 - frac);
              const rpsVal = Math.round(maxRps * frac);
              const latVal = Math.round(maxLat * frac);
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={width - padR}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray={frac === 0 ? undefined : '4 4'}
                  />
                  <text
                    x={padL - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-indigo-600/80 text-[11px] font-mono tabular-nums"
                  >
                    {rpsVal >= 1000 ? `${(rpsVal / 1000).toFixed(1)}k` : rpsVal}
                  </text>
                  <text
                    x={width - padR + 10}
                    y={y + 3}
                    textAnchor="start"
                    className="fill-amber-600/85 text-[11px] font-mono tabular-nums"
                  >
                    {latVal}ms
                  </text>
                </g>
              );
            })}

            {rpsArea && <path d={rpsArea} fill="url(#pulseRpsFill)" />}

            {rpsPath && (
              <path
                d={rpsPath}
                fill="none"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {latPath && (
              <path
                d={latPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* X-axis labels */}
            {ticks.map((t, i) => {
              const showLabel =
                ticks.length <= 12 ||
                i % Math.ceil(ticks.length / 10) === 0 ||
                i === ticks.length - 1;
              return showLabel ? (
                <text
                  key={t.elapsedSec}
                  x={xFor(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px] font-mono tabular-nums"
                >
                  {t.elapsedSec}s
                </text>
              ) : null;
            })}

            {/* Interactive Hover Crosshair & Nodes */}
            {hoverIdx !== null && ticks[hoverIdx] && (
              <g>
                <line
                  x1={xFor(hoverIdx)}
                  y1={padT}
                  x2={xFor(hoverIdx)}
                  y2={padT + innerH}
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xFor(hoverIdx)}
                  cy={yRps(ticks[hoverIdx].rps)}
                  r={4.5}
                  className="fill-indigo-600 stroke-white"
                  strokeWidth={2}
                />
                <circle
                  cx={xFor(hoverIdx)}
                  cy={yLat(ticks[hoverIdx].avgLatency)}
                  r={4.5}
                  className="fill-amber-500 stroke-white"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        </div>
      )}
    </section>
  );
}
