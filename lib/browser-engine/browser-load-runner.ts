import type {
  AutocannonResultSummary,
  BenchmarkConfig,
  BenchmarkRunRecord,
  ChainedStep,
  TickSample,
} from '@/types/benchmark';
import {
  analyzeBottlenecks,
  buildLatencyHistogram,
  computeApdexScore,
  evaluateSloThresholds,
} from '@/lib/diagnostics';
import { buildAutocannonCliCommand } from '@/lib/autocannon-cli';
import { buildLatencySummary, buildRateSummary, calculatePercentile } from './percentiles';
import { extractFromJsonPath, resolveVariables } from './variable-resolver';

export interface RunnerCallbacks {
  onStart?: (info: { runId: string; totalStages: number }) => void;
  onStage?: (info: { stageIndex: number; totalStages: number; label: string; connections: number }) => void;
  onTick: (sample: TickSample) => void;
  onDone: (record: BenchmarkRunRecord) => void;
  onError: (error: string) => void;
}

interface StagePlan {
  label: string;
  connections: number;
  durationSec: number;
}

function buildStagePlans(config: BenchmarkConfig): StagePlan[] {
  if (config.pattern === 'ramp' && config.rampConfig) {
    const { startConnections, endConnections, steps, stepDurationSec } = config.rampConfig;
    const stages: StagePlan[] = [];
    for (let i = 0; i < steps; i++) {
      const ratio = steps > 1 ? i / (steps - 1) : 1;
      const conns = Math.max(
        1,
        Math.round(startConnections + (endConnections - startConnections) * ratio)
      );
      stages.push({
        label: `Step ${i + 1}/${steps} (${conns}c)`,
        connections: conns,
        durationSec: stepDurationSec,
      });
    }
    return stages;
  }

  if (config.pattern === 'spike' && config.spikeConfig) {
    const {
      baselineConnections,
      spikeConnections,
      baselineDurationSec,
      spikeDurationSec,
      recoveryDurationSec,
    } = config.spikeConfig;
    return [
      { label: `Baseline (${baselineConnections}c)`, connections: baselineConnections, durationSec: baselineDurationSec },
      { label: `Spike (${spikeConnections}c)`, connections: spikeConnections, durationSec: spikeDurationSec },
      { label: `Recovery (${baselineConnections}c)`, connections: baselineConnections, durationSec: recoveryDurationSec },
    ];
  }

  return [
    {
      label:
        config.pattern === 'rate'
          ? 'Rate-Paced'
          : config.pattern === 'soak'
            ? 'Soak'
            : 'Constant',
      connections: config.connections,
      durationSec: config.duration,
    },
  ];
}

export class BrowserLoadRunner {
  private abortController: AbortController | null = null;
  private isRunning = false;

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }

  public async run(config: BenchmarkConfig, callbacks: RunnerCallbacks): Promise<void> {
    this.abortController = new AbortController();
    this.isRunning = true;
    const signal = this.abortController.signal;

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stages = buildStagePlans(config);

    callbacks.onStart?.({ runId, totalStages: stages.length });

    const allRecordedLatencies: number[] = [];
    const allPerSecRps: number[] = [];
    const allPerSecBytes: number[] = [];
    const recordedTicks: TickSample[] = [];
    const globalStatusCodes: Record<string, { count: number }> = {};

    let totalErrors = 0;
    let totalTimeouts = 0;
    let totalMismatches = 0;
    let totalNon2xx = 0;
    let count1xx = 0;
    let count2xx = 0;
    let count3xx = 0;
    let count4xx = 0;
    let count5xx = 0;

    let elapsedSeconds = 0;
    const startTimeIso = new Date().toISOString();
    let status: BenchmarkRunRecord['status'] = 'completed';
    let isBailedOut = false;

    // Stage metrics tracking
    const stageOutputs: Array<{
      label: string;
      connections: number;
      duration: number;
      avgRps: number;
      p99Latency: number;
      errors: number;
      non2xx: number;
    }> = [];

    try {
      for (let sIdx = 0; sIdx < stages.length; sIdx++) {
        if (signal.aborted) {
          status = 'aborted';
          break;
        }

        const stage = stages[sIdx];
        callbacks.onStage?.({
          stageIndex: sIdx,
          totalStages: stages.length,
          label: stage.label,
          connections: stage.connections,
        });

        const stageLatencies: number[] = [];
        let stageReqs = 0;
        let stageErrors = 0;
        let stageNon2xx = 0;

        // Window accumulators for 1-second ticks
        let winLatencies: number[] = [];
        let winBytes = 0;
        let win2xx = 0;
        let win3xx = 0;
        let win4xx = 0;
        let win5xx = 0;
        let winErrors = 0;
        let winTimeouts = 0;
        let winMismatches = 0;
        let winCorsErrors = 0;

        const stageEndTime = Date.now() + stage.durationSec * 1000;
        let stageActive = true;

        // Ticking interval
        const tickInterval = setInterval(() => {
          if (!stageActive) return;
          elapsedSeconds += 1;

          const sortedWin = winLatencies.slice().sort((a, b) => a - b);
          const rps = sortedWin.length;
          allPerSecRps.push(rps);
          allPerSecBytes.push(winBytes);

          const avgLat =
            sortedWin.length > 0
              ? Number((sortedWin.reduce((a, b) => a + b, 0) / sortedWin.length).toFixed(2))
              : 0;

          const sample: TickSample = {
            elapsedSec: elapsedSeconds,
            timestamp: Date.now(),
            stageLabel: stage.label,
            connections: stage.connections,
            rps,
            bytesPerSec: winBytes,
            avgLatency: avgLat,
            p50: calculatePercentile(sortedWin, 50),
            p90: calculatePercentile(sortedWin, 90),
            p99: calculatePercentile(sortedWin, 99),
            count2xx: win2xx,
            count3xx: win3xx,
            count4xx: win4xx,
            count5xx: win5xx,
            errors: winErrors,
            timeouts: winTimeouts,
            mismatches: winMismatches,
            corsErrors: winCorsErrors,
          };

          recordedTicks.push(sample);
          callbacks.onTick(sample);

          // Reset window
          winLatencies = [];
          winBytes = 0;
          win2xx = 0;
          win3xx = 0;
          win4xx = 0;
          win5xx = 0;
          winErrors = 0;
          winTimeouts = 0;
          winMismatches = 0;
          winCorsErrors = 0;
        }, 1000);

        // Concurrency loop
        const workerConcurrency = Math.min(stage.connections, 200);
        let requestSeq = 0;

        const executeSingleRequest = async (
          method: string,
          url: string,
          headers: Record<string, string>,
          body?: string
        ): Promise<{ status: number; text: string; bytes: number; duration: number }> => {
          let targetUrl = url;
          if (config.corsProxyUrl && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            targetUrl = `${config.corsProxyUrl.replace(/\/$/, '')}/${encodeURIComponent(url)}`;
          }

          const reqInit: RequestInit = {
            method,
            headers,
            body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : body,
            signal,
          };

          const timeoutMs = (config.timeout || 10) * 1000;
          const reqTimeoutController = new AbortController();
          const combinedSignal = signal;

          const t0 = performance.now();
          const timer = setTimeout(() => reqTimeoutController.abort(), timeoutMs);

          try {
            const resp = await fetch(targetUrl, {
              ...reqInit,
              signal: combinedSignal,
            });
            clearTimeout(timer);
            const duration = performance.now() - t0;
            const text = await resp.text();
            const bytes = text.length;

            return { status: resp.status, text, bytes, duration };
          } catch (err: any) {
            clearTimeout(timer);
            const duration = performance.now() - t0;
            if (err.name === 'AbortError' && signal.aborted) {
              throw err;
            }
            throw {
              isFetchError: true,
              isTimeout: err.name === 'AbortError',
              isCors: err instanceof TypeError && !signal.aborted,
              duration,
              message: err.message || 'Request failed',
            };
          }
        };

        const runWorkerLoop = async () => {
          while (stageActive && !signal.aborted && Date.now() < stageEndTime) {
            requestSeq++;
            const iterId = requestSeq;

            // Rate-pacing throttle if overallRate is set
            if (config.overallRate && config.overallRate > 0) {
              const expectedDelayMs = 1000 / (config.overallRate / workerConcurrency);
              if (expectedDelayMs > 1) {
                await new Promise((r) => setTimeout(r, expectedDelayMs));
              }
            }

            try {
              if (config.enableChaining && config.chainedSteps && config.chainedSteps.length > 0) {
                // Multi-step request chaining
                const chainVars: Record<string, string> = {};
                let chainDuration = 0;
                let lastStatus = 200;
                let chainBytes = 0;

                for (const step of config.chainedSteps) {
                  if (!stageActive || signal.aborted) break;

                  const resolvedUrl = resolveVariables(step.url, chainVars, iterId);
                  const headersObj: Record<string, string> = {};
                  for (const h of step.headers) {
                    if (h.enabled && h.key.trim()) {
                      headersObj[h.key.trim()] = resolveVariables(h.value, chainVars, iterId);
                    }
                  }
                  if (step.contentType && !headersObj['Content-Type']) {
                    headersObj['Content-Type'] = step.contentType;
                  }

                  const resolvedBody = step.body
                    ? resolveVariables(step.body, chainVars, iterId)
                    : undefined;

                  const res = await executeSingleRequest(step.method, resolvedUrl, headersObj, resolvedBody);
                  chainDuration += res.duration;
                  chainBytes += res.bytes;
                  lastStatus = res.status;

                  // Extract chained variables
                  if (step.extractVariables && step.extractVariables.length > 0) {
                    try {
                      const json = JSON.parse(res.text);
                      for (const ext of step.extractVariables) {
                        const val = extractFromJsonPath(json, ext.jsonPath);
                        if (val !== undefined) {
                          chainVars[ext.varName] = val;
                        }
                      }
                    } catch {
                      // non-json response
                    }
                  }

                  // Expect body assertion
                  if (step.expectBody && !res.text.includes(step.expectBody)) {
                    winMismatches++;
                    totalMismatches++;
                  }
                }

                // Record chain summary
                stageReqs++;
                winBytes += chainBytes;
                winLatencies.push(chainDuration);
                stageLatencies.push(chainDuration);
                allRecordedLatencies.push(chainDuration);

                const grp = Math.floor(lastStatus / 100);
                if (grp === 2) { win2xx++; count2xx++; }
                else if (grp === 3) { win3xx++; count3xx++; }
                else if (grp === 4) { win4xx++; count4xx++; stageNon2xx++; totalNon2xx++; }
                else if (grp === 5) { win5xx++; count5xx++; stageNon2xx++; totalNon2xx++; }

                const statusStr = String(lastStatus);
                globalStatusCodes[statusStr] = globalStatusCodes[statusStr] || { count: 0 };
                globalStatusCodes[statusStr].count += 1;
              } else {
                // Standard single request
                const resolvedUrl = resolveVariables(config.url, {}, iterId);
                const headersObj: Record<string, string> = {};
                for (const h of config.headers) {
                  if (h.enabled && h.key.trim()) {
                    headersObj[h.key.trim()] = resolveVariables(h.value, {}, iterId);
                  }
                }
                if (config.contentType && !headersObj['Content-Type'] && config.bodyMode === 'raw') {
                  headersObj['Content-Type'] = config.contentType;
                }

                const resolvedBody =
                  config.bodyMode === 'raw'
                    ? resolveVariables(config.body, {}, iterId)
                    : undefined;

                const res = await executeSingleRequest(config.method, resolvedUrl, headersObj, resolvedBody);

                stageReqs++;
                winBytes += res.bytes;
                winLatencies.push(res.duration);
                stageLatencies.push(res.duration);
                allRecordedLatencies.push(res.duration);

                const grp = Math.floor(res.status / 100);
                if (grp === 2) { win2xx++; count2xx++; }
                else if (grp === 3) { win3xx++; count3xx++; }
                else if (grp === 4) { win4xx++; count4xx++; stageNon2xx++; totalNon2xx++; }
                else if (grp === 5) { win5xx++; count5xx++; stageNon2xx++; totalNon2xx++; }

                const statusStr = String(res.status);
                globalStatusCodes[statusStr] = globalStatusCodes[statusStr] || { count: 0 };
                globalStatusCodes[statusStr].count += 1;

                if (config.expectBody && !res.text.includes(config.expectBody)) {
                  winMismatches++;
                  totalMismatches++;
                }
              }
            } catch (err: any) {
              if (signal.aborted) break;
              winErrors++;
              stageErrors++;
              totalErrors++;
              if (err.isTimeout) {
                winTimeouts++;
                totalTimeouts++;
              }
              if (err.isCors) {
                winCorsErrors++;
              }
            }

            // Bailout check
            if (config.bailout && totalErrors + totalMismatches >= config.bailout) {
              isBailedOut = true;
              status = 'bailed_out';
              stageActive = false;
              break;
            }
          }
        };

        const workers = Array.from({ length: workerConcurrency }, () => runWorkerLoop());
        await Promise.all(workers);

        stageActive = false;
        clearInterval(tickInterval);

        // Record stage summary
        const sortedStageLat = stageLatencies.slice().sort((a, b) => a - b);
        stageOutputs.push({
          label: stage.label,
          connections: stage.connections,
          duration: stage.durationSec,
          avgRps: Number((stageReqs / Math.max(1, stage.durationSec)).toFixed(1)),
          p99Latency: calculatePercentile(sortedStageLat, 99),
          errors: stageErrors,
          non2xx: stageNon2xx,
        });

        if (isBailedOut) break;
      }
    } catch (err: any) {
      callbacks.onError(err?.message || 'Benchmark execution failed.');
      return;
    } finally {
      this.isRunning = false;
    }

    const totalSeconds = Math.max(1, elapsedSeconds);
    const latencySummary = buildLatencySummary(allRecordedLatencies);
    const requestSummary = buildRateSummary(allPerSecRps, totalSeconds);
    const throughputSummary = buildRateSummary(allPerSecBytes, totalSeconds);
    const histogram = buildLatencyHistogram(allRecordedLatencies);

    const resultSummary: AutocannonResultSummary = {
      title: config.title,
      url: config.url,
      connections: config.connections,
      pipelining: config.pipelining,
      workers: config.workers,
      duration: totalSeconds,
      samples: allRecordedLatencies.length,
      start: startTimeIso,
      finish: new Date().toISOString(),
      errors: totalErrors,
      timeouts: totalTimeouts,
      mismatches: totalMismatches,
      non2xx: totalNon2xx,
      resets: 0,
      '1xx': count1xx,
      '2xx': count2xx,
      '3xx': count3xx,
      '4xx': count4xx,
      '5xx': count5xx,
      statusCodeStats: globalStatusCodes,
      latency: latencySummary,
      requests: requestSummary,
      throughput: throughputSummary,
      stages: stageOutputs,
      histogram,
    };

    const sloEval = evaluateSloThresholds(resultSummary, config);
    resultSummary.sloStatus = sloEval.status;
    resultSummary.sloBreaches = sloEval.breaches;

    const apdexScore = computeApdexScore(resultSummary, config.sloTargetLatencyMs || 150);
    const diagnostics = analyzeBottlenecks(resultSummary, config, status);
    const cliCommand = buildAutocannonCliCommand(config);

    const record: BenchmarkRunRecord = {
      id: runId,
      title: config.title,
      createdAt: startTimeIso,
      status,
      config,
      ticks: recordedTicks,
      result: resultSummary,
      apdexScore,
      diagnostics,
      cliCommand,
      sloStatus: sloEval.status,
      sloBreaches: sloEval.breaches,
    };

    callbacks.onDone(record);
  }
}
