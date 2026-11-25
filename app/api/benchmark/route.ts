import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import autocannon, { type AutocannonOptions } from 'autocannon';
import { validateBenchmarkTargetUrl } from '@/lib/url-guard';
import { registerActiveRun, unregisterActiveRun } from '@/lib/benchmark-registry';
import { resolveDynamicVariables } from '@/lib/autocannon-cli';
import type { AutocannonResultSummary, TickSample } from '@/types/benchmark';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const HeaderSchema = z.object({
  id: z.string().optional(),
  key: z.string().max(256),
  value: z.string().max(4096),
  enabled: z.boolean(),
});

const FormFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(256),
  value: z.string().max(8192),
});

const BenchmarkRequestSchema = z.object({
  runId: z.string().min(4).max(128),
  title: z.string().max(160).optional().default('Benchmark Run'),
  url: z.string().min(1).max(2048),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  pattern: z.enum(['constant', 'ramp', 'spike', 'soak', 'rate']).default('constant'),
  connections: z.number().int().min(1).max(500).default(10),
  duration: z.number().int().min(1).max(300).default(10),
  amount: z.number().int().min(1).max(500000).optional().nullable(),
  pipelining: z.number().int().min(1).max(20).default(1),
  workers: z.number().int().min(0).max(4).default(0),
  timeout: z.number().int().min(1).max(60).default(10),
  sampleInt: z.number().int().min(100).max(5000).default(1000),
  overallRate: z.number().int().min(1).max(50000).optional().nullable(),
  connectionRate: z.number().int().min(1).max(50000).optional().nullable(),
  ignoreCoordinatedOmission: z.boolean().default(false),
  bailout: z.number().int().min(1).max(100000).optional().nullable(),
  maxConnectionRequests: z.number().int().min(1).max(500000).optional().nullable(),
  maxOverallRequests: z.number().int().min(1).max(500000).optional().nullable(),
  reconnectRate: z.number().int().min(1).max(500000).optional().nullable(),
  excludeErrorStats: z.boolean().default(false),
  idReplacement: z.boolean().default(false),
  expectBody: z.string().max(2048).optional().default(''),
  servername: z.string().max(255).optional().default(''),
  warmupEnabled: z.boolean().default(false),
  warmupConnections: z.number().int().min(1).max(100).default(5),
  warmupDuration: z.number().int().min(1).max(15).default(2),
  headers: z.array(HeaderSchema).max(50).default([]),
  bodyMode: z.enum(['none', 'raw', 'form']).default('none'),
  body: z.string().max(100000).optional().default(''),
  contentType: z.string().max(128).optional().default('application/json'),
  formFields: z.array(FormFieldSchema).max(30).default([]),
  useHar: z.boolean().default(false),
  harRaw: z.record(z.string(), z.unknown()).optional().nullable(),
  rampConfig: z
    .object({
      startConnections: z.number().int().min(1).max(500),
      endConnections: z.number().int().min(1).max(500),
      steps: z.number().int().min(2).max(10),
      stepDurationSec: z.number().int().min(1).max(30),
    })
    .optional(),
  spikeConfig: z
    .object({
      baselineConnections: z.number().int().min(1).max(500),
      spikeConnections: z.number().int().min(1).max(500),
      baselineDurationSec: z.number().int().min(1).max(60),
      spikeDurationSec: z.number().int().min(1).max(60),
      recoveryDurationSec: z.number().int().min(1).max(60),
    })
    .optional(),
});

type ValidatedInput = z.infer<typeof BenchmarkRequestSchema>;

interface StageSpec {
  label: string;
  connections: number;
  duration: number;
}

function buildStages(input: ValidatedInput): StageSpec[] {
  if (input.pattern === 'ramp' && input.rampConfig) {
    const { startConnections, endConnections, steps, stepDurationSec } = input.rampConfig;
    const list: StageSpec[] = [];
    for (let i = 0; i < steps; i++) {
      const ratio = steps > 1 ? i / (steps - 1) : 1;
      const conns = Math.max(
        1,
        Math.round(startConnections + (endConnections - startConnections) * ratio)
      );
      list.push({
        label: `Step ${i + 1}/${steps} (${conns}c)`,
        connections: conns,
        duration: stepDurationSec,
      });
    }
    return list;
  }

  if (input.pattern === 'spike' && input.spikeConfig) {
    const {
      baselineConnections,
      spikeConnections,
      baselineDurationSec,
      spikeDurationSec,
      recoveryDurationSec,
    } = input.spikeConfig;
    return [
      { label: `Baseline (${baselineConnections}c)`, connections: baselineConnections, duration: baselineDurationSec },
      { label: `Spike (${spikeConnections}c)`, connections: spikeConnections, duration: spikeDurationSec },
      { label: `Recovery (${baselineConnections}c)`, connections: baselineConnections, duration: recoveryDurationSec },
    ];
  }

  return [
    {
      label:
        input.pattern === 'rate'
          ? 'Rate-Paced'
          : input.pattern === 'soak'
            ? 'Soak'
            : 'Constant',
      connections: input.connections,
      duration: input.duration,
    },
  ];
}

function percentileFromSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Number(sorted[idx].toFixed(2));
}

function normalizeAutocannonResult(
  raw: Record<string, unknown>,
  displayUrl: string
): AutocannonResultSummary {
  const latency = (raw.latency ?? {}) as Record<string, number>;
  const requests = (raw.requests ?? {}) as Record<string, number>;
  const throughput = (raw.throughput ?? {}) as Record<string, number>;
  const statusCodeStats = (raw.statusCodeStats ?? {}) as Record<string, { count: number }>;

  return {
    title: typeof raw.title === 'string' ? raw.title : undefined,
    url: displayUrl,
    connections: Number(raw.connections ?? 0),
    pipelining: Number(raw.pipelining ?? 1),
    workers: Number(raw.workers ?? 0),
    duration: Number(raw.duration ?? 0),
    samples: Number(raw.samples ?? 0),
    start: raw.start ? new Date(String(raw.start)).toISOString() : new Date().toISOString(),
    finish: raw.finish ? new Date(String(raw.finish)).toISOString() : new Date().toISOString(),
    errors: Number(raw.errors ?? 0),
    timeouts: Number(raw.timeouts ?? 0),
    mismatches: Number(raw.mismatches ?? 0),
    non2xx: Number(raw.non2xx ?? 0),
    resets: Number(raw.resets ?? 0),
    '1xx': Number(raw['1xx'] ?? 0),
    '2xx': Number(raw['2xx'] ?? 0),
    '3xx': Number(raw['3xx'] ?? 0),
    '4xx': Number(raw['4xx'] ?? 0),
    '5xx': Number(raw['5xx'] ?? 0),
    statusCodeStats,
    latency: {
      min: Number(latency.min ?? 0),
      max: Number(latency.max ?? 0),
      average: Number(latency.average ?? 0),
      mean: Number(latency.mean ?? 0),
      stddev: Number(latency.stddev ?? 0),
      p0_001: latency.p0_001,
      p0_01: latency.p0_01,
      p0_1: latency.p0_1,
      p1: Number(latency.p1 ?? 0),
      p2_5: Number(latency.p2_5 ?? 0),
      p10: latency.p10,
      p25: latency.p25,
      p50: Number(latency.p50 ?? 0),
      p75: Number(latency.p75 ?? 0),
      p90: Number(latency.p90 ?? 0),
      p97_5: Number(latency.p97_5 ?? 0),
      p99: Number(latency.p99 ?? 0),
      p99_9: Number(latency.p99_9 ?? 0),
      p99_99: latency.p99_99,
      totalCount: Number(latency.totalCount ?? 0),
    },
    requests: {
      min: Number(requests.min ?? 0),
      max: Number(requests.max ?? 0),
      average: Number(requests.average ?? 0),
      mean: Number(requests.mean ?? 0),
      stddev: Number(requests.stddev ?? 0),
      p1: requests.p1,
      p2_5: requests.p2_5,
      p50: requests.p50,
      p75: requests.p75,
      p90: requests.p90,
      p97_5: requests.p97_5,
      p99: requests.p99,
      total: Number(requests.total ?? 0),
      sent: Number(requests.sent ?? 0),
    },
    throughput: {
      min: Number(throughput.min ?? 0),
      max: Number(throughput.max ?? 0),
      average: Number(throughput.average ?? 0),
      mean: Number(throughput.mean ?? 0),
      stddev: Number(throughput.stddev ?? 0),
      total: Number(throughput.total ?? 0),
    },
  };
}

function combineStageResults(
  stageOutputs: Array<{ stage: StageSpec; summary: AutocannonResultSummary }>,
  displayUrl: string
): AutocannonResultSummary {
  if (stageOutputs.length === 1) {
    return stageOutputs[0].summary;
  }

  const first = stageOutputs[0].summary;
  const last = stageOutputs[stageOutputs.length - 1].summary;

  let totalDuration = 0;
  let totalSamples = 0;
  let totalErrors = 0;
  let totalTimeouts = 0;
  let totalMismatches = 0;
  let totalNon2xx = 0;
  let totalResets = 0;
  let s1xx = 0;
  let s2xx = 0;
  let s3xx = 0;
  let s4xx = 0;
  let s5xx = 0;
  let totalReqCompleted = 0;
  let totalReqSent = 0;
  let totalThroughputBytes = 0;
  let totalLatencyCount = 0;
  let maxConnections = 0;

  const statusCodeStats: Record<string, { count: number }> = {};

  let weightedLatAvg = 0;
  let weightedLatStd = 0;
  let weightedP1 = 0;
  let weightedP2_5 = 0;
  let weightedP25 = 0;
  let weightedP50 = 0;
  let weightedP75 = 0;
  let weightedP90 = 0;
  let weightedP97_5 = 0;
  let weightedP99 = 0;
  let weightedP99_9 = 0;
  let minLat = Infinity;
  let maxLat = 0;

  let minRps = Infinity;
  let maxRps = 0;
  let minTp = Infinity;
  let maxTp = 0;

  for (const { stage, summary } of stageOutputs) {
    maxConnections = Math.max(maxConnections, stage.connections);
    totalDuration += summary.duration;
    totalSamples += summary.samples;
    totalErrors += summary.errors;
    totalTimeouts += summary.timeouts;
    totalMismatches += summary.mismatches;
    totalNon2xx += summary.non2xx;
    totalResets += summary.resets;
    s1xx += summary['1xx'];
    s2xx += summary['2xx'];
    s3xx += summary['3xx'];
    s4xx += summary['4xx'];
    s5xx += summary['5xx'];
    totalReqCompleted += summary.requests.total;
    totalReqSent += summary.requests.sent ?? summary.requests.total;
    totalThroughputBytes += summary.throughput.total;

    for (const [code, stat] of Object.entries(summary.statusCodeStats)) {
      if (!statusCodeStats[code]) statusCodeStats[code] = { count: 0 };
      statusCodeStats[code].count += stat.count;
    }

    const weight = Math.max(1, summary.latency.totalCount || summary.requests.total);
    totalLatencyCount += weight;
    weightedLatAvg += summary.latency.average * weight;
    weightedLatStd += summary.latency.stddev * weight;
    weightedP1 += summary.latency.p1 * weight;
    weightedP2_5 += summary.latency.p2_5 * weight;
    weightedP25 += (summary.latency.p25 ?? summary.latency.p50) * weight;
    weightedP50 += summary.latency.p50 * weight;
    weightedP75 += summary.latency.p75 * weight;
    weightedP90 += summary.latency.p90 * weight;
    weightedP97_5 += summary.latency.p97_5 * weight;
    weightedP99 += summary.latency.p99 * weight;
    weightedP99_9 += summary.latency.p99_9 * weight;

    if (summary.latency.min > 0) minLat = Math.min(minLat, summary.latency.min);
    maxLat = Math.max(maxLat, summary.latency.max);
    if (summary.requests.min > 0) minRps = Math.min(minRps, summary.requests.min);
    maxRps = Math.max(maxRps, summary.requests.max);
    if (summary.throughput.min > 0) minTp = Math.min(minTp, summary.throughput.min);
    maxTp = Math.max(maxTp, summary.throughput.max);
  }

  const denom = Math.max(1, totalLatencyCount);
  const durSafe = Math.max(0.1, totalDuration);

  return {
    title: first.title,
    url: displayUrl,
    connections: maxConnections,
    pipelining: first.pipelining,
    workers: first.workers,
    duration: Number(totalDuration.toFixed(2)),
    samples: totalSamples,
    start: first.start,
    finish: last.finish,
    errors: totalErrors,
    timeouts: totalTimeouts,
    mismatches: totalMismatches,
    non2xx: totalNon2xx,
    resets: totalResets,
    '1xx': s1xx,
    '2xx': s2xx,
    '3xx': s3xx,
    '4xx': s4xx,
    '5xx': s5xx,
    statusCodeStats,
    latency: {
      min: minLat === Infinity ? 0 : minLat,
      max: maxLat,
      average: Number((weightedLatAvg / denom).toFixed(2)),
      mean: Number((weightedLatAvg / denom).toFixed(2)),
      stddev: Number((weightedLatStd / denom).toFixed(2)),
      p1: Number((weightedP1 / denom).toFixed(2)),
      p2_5: Number((weightedP2_5 / denom).toFixed(2)),
      p25: Number((weightedP25 / denom).toFixed(2)),
      p50: Number((weightedP50 / denom).toFixed(2)),
      p75: Number((weightedP75 / denom).toFixed(2)),
      p90: Number((weightedP90 / denom).toFixed(2)),
      p97_5: Number((weightedP97_5 / denom).toFixed(2)),
      p99: Number((weightedP99 / denom).toFixed(2)),
      p99_9: Number((weightedP99_9 / denom).toFixed(2)),
      totalCount: totalLatencyCount,
    },
    requests: {
      min: minRps === Infinity ? 0 : minRps,
      max: maxRps,
      average: Number((totalReqCompleted / durSafe).toFixed(2)),
      mean: Number((totalReqCompleted / durSafe).toFixed(2)),
      stddev: 0,
      total: totalReqCompleted,
      sent: totalReqSent,
    },
    throughput: {
      min: minTp === Infinity ? 0 : minTp,
      max: maxTp,
      average: Number((totalThroughputBytes / durSafe).toFixed(2)),
      mean: Number((totalThroughputBytes / durSafe).toFixed(2)),
      stddev: 0,
      total: totalThroughputBytes,
    },
    stages: stageOutputs.map(({ stage, summary }) => ({
      label: stage.label,
      connections: stage.connections,
      duration: summary.duration,
      avgRps: Number(summary.requests.average.toFixed(1)),
      p99Latency: summary.latency.p99,
      errors: summary.errors,
      non2xx: summary.non2xx,
    })),
  };
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const parsed = BenchmarkRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid benchmark configuration.' },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const hostHeader = req.headers.get('host');

  let guarded;
  try {
    const resolvedTarget = resolveDynamicVariables(input.url);
    guarded = await validateBenchmarkTargetUrl(resolvedTarget, hostHeader);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Target URL validation failed.' },
      { status: 400 }
    );
  }

  // Validate HAR entries if HAR replay is active
  let sanitizedHar: Record<string, unknown> | undefined;
  if (input.useHar && input.harRaw) {
    const log = input.harRaw.log as { entries?: Array<{ request?: { url?: string } }> } | undefined;
    if (!log || !Array.isArray(log.entries) || log.entries.length === 0) {
      return NextResponse.json({ error: 'HAR archive contains no entries.' }, { status: 400 });
    }
    const execOrigin = new URL(guarded.executionUrl).origin;
    const rewrittenEntries = [];
    for (const entry of log.entries.slice(0, 200)) {
      const entryUrl = entry?.request?.url;
      if (!entryUrl) continue;
      try {
        const validatedEntry = await validateBenchmarkTargetUrl(entryUrl, hostHeader);
        const cloned = structuredClone(entry);
        if (guarded.isSandbox && validatedEntry.isSandbox && cloned.request) {
          const u = new URL(validatedEntry.executionUrl);
          cloned.request.url = `${execOrigin}${u.pathname}${u.search}`;
        }
        rewrittenEntries.push(cloned);
      } catch {
        // Skip invalid/blocked entries inside HAR
      }
    }
    if (rewrittenEntries.length === 0) {
      return NextResponse.json(
        { error: 'No permitted HTTP/HTTPS URLs remained in HAR archive after security validation.' },
        { status: 400 }
      );
    }
    sanitizedHar = {
      log: {
        ...(typeof log === 'object' ? log : {}),
        entries: rewrittenEntries,
      },
    };
  }

  const stages = buildStages(input);
  const totalEstimatedDuration = stages.reduce((acc, s) => acc + s.duration, 0);
  if (totalEstimatedDuration > 300) {
    return NextResponse.json(
      { error: 'Total multi-stage benchmark duration cannot exceed 300 seconds.' },
      { status: 400 }
    );
  }

  // Build headers map
  const headersMap: Record<string, string> = {};
  for (const h of input.headers) {
    if (h.enabled && h.key.trim()) {
      headersMap[h.key.trim()] = resolveDynamicVariables(h.value);
    }
  }

  // Build body or form
  let requestBody: string | undefined;
  let formPayload: Record<string, { type: 'text'; value: string }> | undefined;
  if (!sanitizedHar) {
    if (input.bodyMode === 'raw' && input.body.trim()) {
      requestBody = resolveDynamicVariables(input.body);
      const hasContentType = Object.keys(headersMap).some(
        (k) => k.toLowerCase() === 'content-type'
      );
      if (!hasContentType && input.contentType) {
        headersMap['Content-Type'] = input.contentType;
      }
    } else if (input.bodyMode === 'form' && input.formFields.length > 0) {
      const fields: Record<string, { type: 'text'; value: string }> = {};
      for (const f of input.formFields) {
        if (f.name.trim()) {
          fields[f.name.trim()] = {
            type: 'text',
            value: resolveDynamicVariables(f.value),
          };
        }
      }
      if (Object.keys(fields).length > 0) {
        formPayload = fields;
      }
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let aborted = false;
      let currentInstance: ReturnType<typeof autocannon> | null = null;
      let elapsedCounter = 0;

      const sendEvent = (eventName: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      const stopAll = () => {
        aborted = true;
        if (currentInstance && typeof currentInstance.stop === 'function') {
          try {
            currentInstance.stop();
          } catch {
            // ignore stop errors
          }
        }
      };

      registerActiveRun(input.runId, stopAll);
      req.signal.addEventListener('abort', stopAll);

      sendEvent('start', {
        runId: input.runId,
        targetUrl: guarded.displayUrl,
        stages: stages.map((s) => ({ label: s.label, connections: s.connections, duration: s.duration })),
      });

      const stageOutputs: Array<{ stage: StageSpec; summary: AutocannonResultSummary }> = [];
      let bailedOut = false;

      try {
        for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
          if (aborted) break;
          const stage = stages[stageIdx];

          sendEvent('stage', {
            stageIndex: stageIdx,
            totalStages: stages.length,
            label: stage.label,
            connections: stage.connections,
            duration: stage.duration,
          });

          const opts: AutocannonOptions = {
            url: guarded.executionUrl,
            connections: stage.connections,
            duration: stage.duration,
            pipelining: input.pipelining,
            workers: input.workers > 0 ? input.workers : 0,
            timeout: input.timeout,
            sampleInt: input.sampleInt,
            method: sanitizedHar ? undefined : input.method,
            title: input.title || undefined,
            headers: Object.keys(headersMap).length > 0 ? headersMap : undefined,
            body: requestBody,
            form: formPayload,
            har: sanitizedHar,
            idReplacement: input.idReplacement,
            excludeErrorStats: input.excludeErrorStats,
            servername: input.servername.trim() || undefined,
            expectBody: !sanitizedHar && input.expectBody.trim() ? input.expectBody.trim() : undefined,
            renderProgressBar: false,
            renderLatencyTable: false,
            renderResultsTable: false,
            renderStatusCodes: false,
          };

          if (input.amount && input.amount > 0 && stages.length === 1) {
            opts.amount = input.amount;
          }
          if (input.overallRate && input.overallRate > 0) {
            opts.overallRate = input.overallRate;
          }
          if (input.connectionRate && input.connectionRate > 0) {
            opts.connectionRate = input.connectionRate;
          }
          if (input.ignoreCoordinatedOmission && (opts.overallRate || opts.connectionRate)) {
            opts.ignoreCoordinatedOmission = true;
          }
          if (input.bailout && input.bailout > 0) {
            opts.bailout = input.bailout;
          }
          if (input.maxConnectionRequests && input.maxConnectionRequests > 0) {
            opts.maxConnectionRequests = input.maxConnectionRequests;
          }
          if (input.maxOverallRequests && input.maxOverallRequests > 0) {
            opts.maxOverallRequests = input.maxOverallRequests;
          }
          if (input.reconnectRate && input.reconnectRate > 0) {
            opts.reconnectRate = input.reconnectRate;
          }
          if (input.warmupEnabled && stageIdx === 0) {
            opts.warmup = {
              connections: input.warmupConnections,
              duration: input.warmupDuration,
            };
          }

          const rawResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
            let latenciesWindow: number[] = [];
            let win2xx = 0;
            let win3xx = 0;
            let win4xx = 0;
            let win5xx = 0;
            let winErrors = 0;
            let winTimeouts = 0;
            let winMismatches = 0;
            let workerHeartbeat: ReturnType<typeof setInterval> | null = null;
            let settled = false;

            const instance = autocannon(opts, (err, res) => {
              if (workerHeartbeat) clearInterval(workerHeartbeat);
              if (settled) return;
              settled = true;
              if (err) return reject(err);
              resolve(res);
            });

            currentInstance = instance;

            if (input.workers > 0) {
              workerHeartbeat = setInterval(() => {
                elapsedCounter += 1;
                sendEvent('worker_heartbeat', {
                  elapsedSec: elapsedCounter,
                  stageLabel: stage.label,
                  connections: stage.connections,
                });
              }, 1000);
            }

            instance.on('response', (_client, statusCode, _resBytes, responseTime) => {
              const codeGroup = Math.floor(Number(statusCode) / 100);
              if (codeGroup === 2) win2xx += 1;
              else if (codeGroup === 3) win3xx += 1;
              else if (codeGroup === 4) win4xx += 1;
              else if (codeGroup === 5) win5xx += 1;

              // Cap per-second sample array to avoid excessive sorting cost at >10k RPS
              if (latenciesWindow.length < 4000) {
                latenciesWindow.push(Number(responseTime));
              }
            });

            instance.on('reqError', (err) => {
              winErrors += 1;
              if (err?.message?.toLowerCase().includes('timed out')) {
                winTimeouts += 1;
              }
            });

            instance.on('reqMismatch', () => {
              winMismatches += 1;
            });

            instance.on('tick', ({ counter, bytes }) => {
              elapsedCounter += 1;
              const sorted = latenciesWindow.slice().sort((a, b) => a - b);
              const avgLat =
                sorted.length > 0
                  ? Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2))
                  : 0;

              const tick: TickSample = {
                elapsedSec: elapsedCounter,
                timestamp: Date.now(),
                stageLabel: stage.label,
                connections: stage.connections,
                rps: counter,
                bytesPerSec: bytes,
                avgLatency: avgLat,
                p50: percentileFromSorted(sorted, 50),
                p90: percentileFromSorted(sorted, 90),
                p99: percentileFromSorted(sorted, 99),
                count2xx: win2xx,
                count3xx: win3xx,
                count4xx: win4xx,
                count5xx: win5xx,
                errors: winErrors,
                timeouts: winTimeouts,
                mismatches: winMismatches,
              };

              latenciesWindow = [];
              win2xx = 0;
              win3xx = 0;
              win4xx = 0;
              win5xx = 0;
              winErrors = 0;
              winTimeouts = 0;
              winMismatches = 0;

              sendEvent('tick', tick);
            });

            instance.on('error', (err) => {
              if (workerHeartbeat) clearInterval(workerHeartbeat);
              if (settled) return;
              settled = true;
              reject(err);
            });
          });

          const normalized = normalizeAutocannonResult(rawResult, guarded.displayUrl);
          stageOutputs.push({ stage, summary: normalized });

          if (
            input.bailout &&
            input.bailout > 0 &&
            normalized.errors + normalized.mismatches >= input.bailout
          ) {
            bailedOut = true;
            break;
          }
        }

        if (stageOutputs.length > 0) {
          const combined = combineStageResults(stageOutputs, guarded.displayUrl);
          sendEvent('done', {
            status: bailedOut ? 'bailed_out' : aborted ? 'aborted' : 'completed',
            result: combined,
          });
        } else {
          sendEvent('error', { message: 'Benchmark stopped before any stage completed.' });
        }
      } catch (err) {
        sendEvent('error', {
          message: err instanceof Error ? err.message : 'Autocannon execution failed.',
        });
      } finally {
        unregisterActiveRun(input.runId);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // ignore close error
          }
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
