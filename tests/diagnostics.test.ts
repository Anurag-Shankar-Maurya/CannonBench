import { describe, expect, it } from 'vitest';
import {
  analyzeBottlenecks,
  buildLatencyHistogram,
  computeApdexScore,
  evaluateSloThresholds,
} from '@/lib/diagnostics';
import type { AutocannonResultSummary, BenchmarkConfig } from '@/types/benchmark';
import { createDefaultBenchmarkConfig } from '@/lib/presets';

function createMockSummary(overrides: Partial<AutocannonResultSummary> = {}): AutocannonResultSummary {
  return {
    url: 'http://test.local',
    connections: 10,
    pipelining: 1,
    workers: 0,
    duration: 10,
    samples: 1000,
    start: new Date().toISOString(),
    finish: new Date().toISOString(),
    errors: 0,
    timeouts: 0,
    mismatches: 0,
    non2xx: 0,
    resets: 0,
    '1xx': 0,
    '2xx': 1000,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    statusCodeStats: { '200': { count: 1000 } },
    latency: {
      min: 10,
      max: 150,
      average: 45,
      mean: 45,
      stddev: 12,
      p1: 12,
      p2_5: 14,
      p50: 40,
      p75: 55,
      p90: 80,
      p97_5: 110,
      p99: 130,
      p99_9: 145,
      totalCount: 1000,
    },
    requests: {
      min: 90,
      max: 110,
      average: 100,
      mean: 100,
      stddev: 5,
      total: 1000,
    },
    throughput: {
      min: 10000,
      max: 20000,
      average: 15000,
      mean: 15000,
      stddev: 1000,
      total: 150000,
    },
    ...overrides,
  };
}

describe('SLO Quality Gates Evaluation', () => {
  const config = createDefaultBenchmarkConfig('http://test.local');

  it('passes when all metrics meet SLO thresholds', () => {
    const summary = createMockSummary();
    const slo = evaluateSloThresholds(summary, {
      ...config,
      sloTargetLatencyMs: 150,
      sloMaxP99Ms: 200,
      sloMaxErrorPct: 1,
      sloMinRps: 50,
    });

    expect(slo.status).toBe('passed');
    expect(slo.breaches).toHaveLength(0);
  });

  it('flags breach when error rate exceeds threshold', () => {
    const summary = createMockSummary({
      errors: 50,
      requests: { min: 90, max: 110, average: 100, mean: 100, stddev: 5, total: 1000 },
    });
    const slo = evaluateSloThresholds(summary, {
      ...config,
      sloMaxErrorPct: 1, // 50 / 1050 = 4.7%
    });

    expect(slo.status).toBe('breached');
    expect(slo.breaches[0]).toContain('Error rate');
  });

  it('flags breach when tail latency p99 exceeds threshold', () => {
    const summary = createMockSummary({
      latency: {
        ...createMockSummary().latency,
        p99: 450,
      },
    });
    const slo = evaluateSloThresholds(summary, {
      ...config,
      sloMaxP99Ms: 300,
    });

    expect(slo.status).toBe('breached');
    expect(slo.breaches[0]).toContain('p99 latency (450 ms) exceeded threshold');
  });

  it('flags breach when RPS capacity is insufficient', () => {
    const summary = createMockSummary({
      requests: { min: 20, max: 30, average: 25, mean: 25, stddev: 2, total: 250 },
    });
    const slo = evaluateSloThresholds(summary, {
      ...config,
      sloMinRps: 100,
    });

    expect(slo.status).toBe('breached');
    expect(slo.breaches[0]).toContain('Throughput (25 RPS) fell below minimum target');
  });
});

describe('Latency Histogram Generation', () => {
  it('correctly categorizes latencies into buckets with percentages', () => {
    const latencies = [2, 3, 4, 8, 15, 30, 75, 120, 350, 900, 2000];
    const buckets = buildLatencyHistogram(latencies);

    expect(buckets.length).toBeGreaterThan(0);
    const sumCount = buckets.reduce((acc, b) => acc + b.count, 0);
    expect(sumCount).toBe(latencies.length);

    // Check first bucket <=5ms has 3 samples
    expect(buckets[0].label).toBe('≤5ms');
    expect(buckets[0].count).toBe(3);
  });
});

describe('Apdex & Bottleneck Heuristics', () => {
  it('calculates APDEX score above 0.9 for healthy responses', () => {
    const summary = createMockSummary();
    const score = computeApdexScore(summary, 100);
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('identifies 429 rate-limiting bottleneck', () => {
    const summary = createMockSummary({
      statusCodeStats: {
        '200': { count: 800 },
        '429': { count: 200 },
      },
    });
    const findings = analyzeBottlenecks(summary, createDefaultBenchmarkConfig(), 'completed');
    const rateLimiting = findings.find((f) => f.id === 'rate-limiting');
    expect(rateLimiting).toBeDefined();
    expect(rateLimiting?.severity).toBe('warning');
  });

  it('identifies 5xx server failure bottleneck', () => {
    const summary = createMockSummary({
      '5xx': 50,
      statusCodeStats: {
        '200': { count: 950 },
        '500': { count: 50 },
      },
    });
    const findings = analyzeBottlenecks(summary, createDefaultBenchmarkConfig(), 'completed');
    const server5xx = findings.find((f) => f.id === 'server-5xx');
    expect(server5xx).toBeDefined();
    expect(server5xx?.severity).toBe('critical');
  });
});
