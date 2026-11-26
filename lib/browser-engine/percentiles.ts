import type { LatencySummary, RateSummary } from '@/types/benchmark';

export function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return Number(sorted[idx].toFixed(2));
}

export function buildLatencySummary(latencies: number[]): LatencySummary {
  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      mean: 0,
      stddev: 0,
      p1: 0,
      p2_5: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p97_5: 0,
      p99: 0,
      p99_9: 0,
      totalCount: 0,
    };
  }

  const sorted = latencies.slice().sort((a, b) => a - b);
  const total = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / total).toFixed(2));

  // Compute variance & stddev
  const variance =
    sorted.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / total;
  const stddev = Number(Math.sqrt(variance).toFixed(2));

  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[total - 1].toFixed(2)),
    average: avg,
    mean: avg,
    stddev,
    p1: calculatePercentile(sorted, 1),
    p2_5: calculatePercentile(sorted, 2.5),
    p10: calculatePercentile(sorted, 10),
    p25: calculatePercentile(sorted, 25),
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p90: calculatePercentile(sorted, 90),
    p97_5: calculatePercentile(sorted, 97.5),
    p99: calculatePercentile(sorted, 99),
    p99_9: calculatePercentile(sorted, 99.9),
    totalCount: total,
  };
}

export function buildRateSummary(perSecSamples: number[], durationSec: number): RateSummary {
  const safeDur = Math.max(1, durationSec);
  const total = perSecSamples.reduce((a, b) => a + b, 0);
  if (perSecSamples.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      mean: 0,
      stddev: 0,
      total: 0,
    };
  }

  const sorted = perSecSamples.slice().sort((a, b) => a - b);
  const avg = Number((total / safeDur).toFixed(2));
  const variance =
    perSecSamples.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) /
    perSecSamples.length;
  const stddev = Number(Math.sqrt(variance).toFixed(2));

  return {
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    average: avg,
    mean: avg,
    stddev,
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p99: calculatePercentile(sorted, 99),
    total,
  };
}
