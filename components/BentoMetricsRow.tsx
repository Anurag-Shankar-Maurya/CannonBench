'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { BenchmarkConfig, BenchmarkRunRecord, TickSample } from '@/types/benchmark';

interface BentoMetricsRowProps {
  run: BenchmarkRunRecord | null;
  previousRun: BenchmarkRunRecord | null;
  liveTicks: TickSample[];
  isRunning: boolean;
  config: BenchmarkConfig;
}

export default function BentoMetricsRow({
  run,
  previousRun,
  liveTicks,
  isRunning,
  config,
}: BentoMetricsRowProps) {
  const latestTick = liveTicks.length > 0 ? liveTicks[liveTicks.length - 1] : null;
  const res = run?.result;

  // Card 1: Throughput
  const currentOrAvgRps = res
    ? res.requests.average
    : latestTick
      ? latestTick.rps
      : 0;
  const prevRps = previousRun?.result.requests.average ?? 0;
  const rpsDeltaPct =
    res && prevRps > 0 ? ((res.requests.average - prevRps) / prevRps) * 100 : null;

  // Card 2: Median Latency (p50) + Sparkline
  const p50Ms = res ? res.latency.p50 : latestTick ? latestTick.p50 : 0;
  const avgMs = res ? res.latency.average : latestTick ? latestTick.avgLatency : 0;
  const sparkSource = run ? run.ticks : liveTicks;
  const sparkValues = sparkSource.slice(-20).map((t) => t.p50 || t.avgLatency);
  const maxSpark = sparkValues.length > 0 ? Math.max(1, ...sparkValues) : 1;
  const minSpark = sparkValues.length > 0 ? Math.min(...sparkValues) : 0;
  const sparkPath =
    sparkValues.length > 1
      ? sparkValues
          .map((v, i) => {
            const x = (i / (sparkValues.length - 1)) * 112;
            const norm = maxSpark === minSpark ? 0.5 : (v - minSpark) / (maxSpark - minSpark);
            const y = 26 - norm * 22;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  // Card 3: Tail Latency (p99) + Health Badge
  const p99Ms = res ? res.latency.p99 : latestTick ? latestTick.p99 : 0;
  const p90Ms = res ? res.latency.p90 : latestTick ? latestTick.p90 : 0;
  const maxMs = res ? res.latency.max : latestTick ? latestTick.p99 : 0;
  const sloTarget = config.sloTargetLatencyMs || 150;
  const hasLatencyData = Boolean(res || latestTick);
  const tailHealth = !hasLatencyData
    ? { label: 'Idle', cls: 'bg-slate-100 text-slate-600' }
    : p99Ms <= sloTarget * 1.5
      ? { label: 'Healthy', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' }
      : p99Ms <= sloTarget * 3
        ? { label: 'Elevated', cls: 'bg-amber-50 text-amber-700 border border-amber-200/70' }
        : { label: 'Critical', cls: 'bg-rose-50 text-rose-700 border border-rose-200/70' };

  // Card 4: Success vs Error Rate + Progress Ring
  const live2xx = liveTicks.reduce((s, t) => s + t.count2xx, 0);
  const liveNon2xx = liveTicks.reduce((s, t) => s + t.count3xx + t.count4xx + t.count5xx, 0);
  const liveErrs = liveTicks.reduce((s, t) => s + t.errors + t.mismatches, 0);

  const count2xx = res ? res['2xx'] : live2xx;
  const totalErrors = res ? res.errors + res.mismatches + res.non2xx : liveErrs + liveNon2xx;
  const totalAttempts = count2xx + totalErrors;
  const successRate =
    totalAttempts > 0 ? Math.round((count2xx / totalAttempts) * 1000) / 10 : 0;
  const ringCircumference = 2 * Math.PI * 18;
  const ringOffset =
    ringCircumference - (Math.min(100, Math.max(0, successRate)) / 100) * ringCircumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Card 1: Throughput */}
      <motion.div
        layout
        className={`p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between transition-colors ${
          isRunning ? 'ring-1 ring-indigo-500/15' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">
            {res ? 'Avg Throughput' : 'Current Throughput'}
          </span>
          {rpsDeltaPct !== null ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono tabular-nums font-medium rounded-full ${
                rpsDeltaPct >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/70'
              }`}
            >
              {rpsDeltaPct >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {rpsDeltaPct >= 0 ? '+' : ''}
              {rpsDeltaPct.toFixed(1)}%
            </span>
          ) : isRunning ? (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              Live
            </span>
          ) : res ? (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Peak {Math.round(res.requests.max).toLocaleString()}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {currentOrAvgRps > 0 ? currentOrAvgRps.toFixed(1) : '0.0'}{' '}
            <span className="text-sm font-medium text-slate-500">req/s</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums truncate">
            {res
              ? `${res.requests.total.toLocaleString()} total requests`
              : latestTick
                ? `Peak ${Math.max(...liveTicks.map((t) => t.rps)).toLocaleString()} req/s`
                : 'Awaiting benchmark run'}
          </p>
        </div>
      </motion.div>

      {/* Card 2: Median Latency */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">Median Latency (p50)</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            Mean {avgMs > 0 ? `${avgMs} ms` : '—'}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {p50Ms} <span className="text-sm font-medium text-slate-500">ms</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
              {res ? `Min ${res.latency.min} ms` : '50th percentile'}
            </p>
          </div>

          <svg
            viewBox="0 0 112 28"
            className="w-28 h-8 shrink-0 overflow-visible"
            aria-label="Median latency sparkline"
          >
            {sparkPath ? (
              <path
                d={sparkPath}
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <line
                x1="0"
                y1="20"
                x2="112"
                y2="20"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Card 3: Tail Latency */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">Tail Latency (p99)</span>
          <span
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap ${tailHealth.cls}`}
          >
            {tailHealth.label}
          </span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {p99Ms} <span className="text-sm font-medium text-slate-500">ms</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
            p90 {p90Ms} ms · Max {maxMs} ms
          </p>
        </div>
      </div>

      {/* Card 4: Success vs Error Rate */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">Success vs Error Rate</span>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            {totalErrors.toLocaleString()} errors
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {count2xx.toLocaleString()}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
              2xx responses · {totalAttempts > 0 ? `${successRate}%` : '—'}
            </p>
          </div>

          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={
                  totalAttempts === 0
                    ? '#CBD5E1'
                    : successRate >= 99
                      ? '#10B981'
                      : successRate >= 95
                        ? '#F59E0B'
                        : '#EF4444'
                }
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={totalAttempts === 0 ? ringCircumference : ringOffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute text-[10px] font-mono tabular-nums font-semibold text-slate-800">
              {totalAttempts > 0 ? `${Math.round(successRate)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
