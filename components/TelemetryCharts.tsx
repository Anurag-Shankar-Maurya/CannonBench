'use client';

import React, { useState } from 'react';
import type { LatencySummary, TickSample } from '@/types/benchmark';
import { formatBytes } from '@/lib/diagnostics';

interface TelemetryChartsProps {
  ticks: TickSample[];
  latencySummary?: LatencySummary;
  isRunning?: boolean;
  workersCount?: number;
}

export default function TelemetryCharts({
  ticks,
  latencySummary,
  isRunning = false,
  workersCount = 0,
}: TelemetryChartsProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 560;
  const height = 210;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const hasTicks = ticks.length > 0;
  const maxRps = hasTicks ? Math.max(10, ...ticks.map((t) => t.rps)) * 1.15 : 100;
  const maxLat = hasTicks
    ? Math.max(10, ...ticks.map((t) => Math.max(t.p99, t.p90, t.avgLatency))) * 1.15
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
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  const rpsPoints = ticks.map((t, i) => ({ x: xFor(i), y: yRps(t.rps) }));
  const rpsLine = buildPath(rpsPoints);
  const rpsArea =
    rpsPoints.length > 1
      ? `${rpsLine} L ${rpsPoints[rpsPoints.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${rpsPoints[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : '';

  const avgLatLine = buildPath(ticks.map((t, i) => ({ x: xFor(i), y: yLat(t.avgLatency) })));
  const p90LatLine = buildPath(ticks.map((t, i) => ({ x: xFor(i), y: yLat(t.p90) })));
  const p99LatLine = buildPath(ticks.map((t, i) => ({ x: xFor(i), y: yLat(t.p99) })));

  const hoveredTick = hoverIdx !== null && ticks[hoverIdx] ? ticks[hoverIdx] : null;

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

  const percentileBars = latencySummary
    ? [
        { label: 'min', val: latencySummary.min },
        { label: 'p1', val: latencySummary.p1 },
        { label: 'p50', val: latencySummary.p50 },
        { label: 'p75', val: latencySummary.p75 },
        { label: 'p90', val: latencySummary.p90 },
        { label: 'p97.5', val: latencySummary.p97_5 },
        { label: 'p99', val: latencySummary.p99 },
        { label: 'p99.9', val: latencySummary.p99_9 },
        { label: 'max', val: latencySummary.max },
      ]
    : [];

  const maxPercentile = percentileBars.length
    ? Math.max(1, ...percentileBars.map((b) => b.val))
    : 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Throughput / RPS Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Requests per Second</h3>
              <p className="text-xs text-slate-500">
                {hoveredTick
                  ? `${hoveredTick.elapsedSec}s · ${hoveredTick.stageLabel} · ${hoveredTick.rps.toLocaleString()} req/s (${formatBytes(hoveredTick.bytesPerSec)}/s)`
                  : 'Live 1-second throughput stream'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono tabular-nums whitespace-nowrap shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-blue-600 inline-block" />
                Req/s
              </span>
            </div>
          </div>

          {!hasTicks ? (
            <div className="h-[210px] flex items-center justify-center border border-dashed border-slate-200 rounded bg-slate-50/50 text-xs text-slate-500">
              {isRunning && workersCount > 0
                ? 'Multi-worker mode aggregates histograms upon completion...'
                : isRunning
                  ? 'Waiting for first 1s Autocannon tick...'
                  : 'Run a benchmark to stream real-time throughput.'}
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[210px] select-none overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padT + innerH * (1 - frac);
                const val = Math.round(maxRps * frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={width - padR}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray={frac === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padL - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono tabular-nums"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    </text>
                  </g>
                );
              })}

              {rpsArea && <path d={rpsArea} fill="#2563EB" fillOpacity="0.08" />}
              {rpsLine && (
                <path
                  d={rpsLine}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {ticks.map((t, i) => {
                const showLabel =
                  ticks.length <= 10 || i % Math.ceil(ticks.length / 8) === 0 || i === ticks.length - 1;
                return (
                  <g key={t.elapsedSec}>
                    {ticks.length <= 35 && (
                      <circle
                        cx={xFor(i)}
                        cy={yRps(t.rps)}
                        r={hoverIdx === i ? 4 : 2.5}
                        className={hoverIdx === i ? 'fill-blue-700' : 'fill-blue-600'}
                      />
                    )}
                    {showLabel && (
                      <text
                        x={xFor(i)}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-mono tabular-nums"
                      >
                        {t.elapsedSec}s
                      </text>
                    )}
                  </g>
                );
              })}

              {hoverIdx !== null && ticks[hoverIdx] && (
                <line
                  x1={xFor(hoverIdx)}
                  y1={padT}
                  x2={xFor(hoverIdx)}
                  y2={padT + innerH}
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                />
              )}
            </svg>
          )}
        </div>

        {/* Latency Percentiles Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Latency Percentiles (ms)</h3>
              <p className="text-xs text-slate-500">
                {hoveredTick
                  ? `${hoveredTick.elapsedSec}s · Avg ${hoveredTick.avgLatency}ms · p90 ${hoveredTick.p90}ms · p99 ${hoveredTick.p99}ms`
                  : 'Per-second Average, p90, and p99 response time'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono tabular-nums whitespace-nowrap shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
                Avg
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
                p90
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-red-600 inline-block" />
                p99
              </span>
            </div>
          </div>

          {!hasTicks ? (
            <div className="h-[210px] flex items-center justify-center border border-dashed border-slate-200 rounded bg-slate-50/50 text-xs text-slate-500">
              {isRunning && workersCount > 0
                ? 'Latency histogram computes at multi-worker completion...'
                : isRunning
                  ? 'Collecting live response latency samples...'
                  : 'Latency percentiles will stream here during execution.'}
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[210px] select-none overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padT + innerH * (1 - frac);
                const val = Math.round(maxLat * frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={width - padR}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray={frac === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padL - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono tabular-nums"
                    >
                      {val}ms
                    </text>
                  </g>
                );
              })}

              {p99LatLine && (
                <path
                  d={p99LatLine}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              )}
              {p90LatLine && (
                <path
                  d={p90LatLine}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              )}
              {avgLatLine && (
                <path
                  d={avgLatLine}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}

              {ticks.map((t, i) => {
                const showLabel =
                  ticks.length <= 10 || i % Math.ceil(ticks.length / 8) === 0 || i === ticks.length - 1;
                return showLabel ? (
                  <text
                    key={t.elapsedSec}
                    x={xFor(i)}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-mono tabular-nums"
                  >
                    {t.elapsedSec}s
                  </text>
                ) : null;
              })}

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
                  <circle cx={xFor(hoverIdx)} cy={yLat(ticks[hoverIdx].avgLatency)} r={3.5} className="fill-emerald-600" />
                  <circle cx={xFor(hoverIdx)} cy={yLat(ticks[hoverIdx].p90)} r={3.5} className="fill-amber-600" />
                  <circle cx={xFor(hoverIdx)} cy={yLat(ticks[hoverIdx].p99)} r={3.5} className="fill-red-600" />
                </g>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Percentile Bar Distribution when summary exists */}
      {latencySummary && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Latency Percentile Spectrum
              </h3>
              <p className="text-xs text-slate-500">
                Full HDRHistogram distribution from minimum to worst-case tail latency
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              StdDev {latencySummary.stddev.toFixed(2)} ms · Samples{' '}
              {latencySummary.totalCount.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-9 gap-2 items-end h-28 pt-3">
            {percentileBars.map((bar) => {
              const pctHeight = Math.max(8, Math.round((bar.val / maxPercentile) * 100));
              const barColor =
                bar.label === 'max' || bar.label === 'p99.9'
                  ? 'bg-red-500/85'
                  : bar.label === 'p99' || bar.label === 'p97.5'
                    ? 'bg-amber-500/85'
                    : 'bg-blue-600/85';
              return (
                <div key={bar.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-mono tabular-nums text-slate-700">
                    {bar.val}ms
                  </span>
                  <div className="w-full max-w-[44px] bg-slate-100 rounded-t h-16 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t transition-all duration-200 ${barColor}`}
                      style={{ height: `${pctHeight}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
