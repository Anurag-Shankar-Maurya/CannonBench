import type {
  AutocannonResultSummary,
  BenchmarkConfig,
  BenchmarkRunRecord,
  DiagnosticFinding,
  RunComparisonMetrics,
} from '@/types/benchmark';

export function computeApdexScore(
  result: AutocannonResultSummary,
  targetLatencyMs: number
): number {
  const totalCompleted = result.requests.total || 0;
  const totalAttempts = totalCompleted + result.errors;
  if (totalAttempts <= 0) return 0;

  const t = Math.max(10, targetLatencyMs);
  const toleratingThreshold = t * 4;
  const p50 = result.latency.p50;
  const p90 = result.latency.p90;
  const p99 = result.latency.p99;

  // Estimate satisfied & tolerating ratio from percentile distribution + 2xx count
  const successCount = result['2xx'] || 0;
  if (successCount === 0) return 0;

  let satisfiedFraction = 0;
  let toleratingFraction = 0;

  if (p99 <= t) {
    satisfiedFraction = 0.99;
    toleratingFraction = 0.01;
  } else if (p90 <= t) {
    satisfiedFraction = 0.9;
    toleratingFraction = p99 <= toleratingThreshold ? 0.09 : 0.04;
  } else if (p50 <= t) {
    satisfiedFraction = 0.55;
    toleratingFraction = p90 <= toleratingThreshold ? 0.35 : 0.18;
  } else if (p50 <= toleratingThreshold) {
    satisfiedFraction = result.latency.p25 && result.latency.p25 <= t ? 0.25 : 0.1;
    toleratingFraction = 0.45;
  } else {
    satisfiedFraction = 0.02;
    toleratingFraction = 0.12;
  }

  const satisfied = successCount * satisfiedFraction;
  const tolerating = successCount * toleratingFraction;
  const score = (satisfied + 0.5 * tolerating) / totalAttempts;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

export function analyzeBottlenecks(
  result: AutocannonResultSummary,
  config: BenchmarkConfig,
  status: BenchmarkRunRecord['status']
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];
  const totalRequests = result.requests.total || 0;
  const totalWithErrors = totalRequests + result.errors;
  const errorRatePct = totalWithErrors > 0 ? (result.errors / totalWithErrors) * 100 : 0;

  if (status === 'bailed_out') {
    findings.push({
      id: 'bailout-triggered',
      severity: 'critical',
      title: 'Circuit-Breaker Bailout Triggered',
      detail: `Execution aborted automatically after hitting your ${config.bailout} error/mismatch threshold to protect the target system.`,
      metric: `${result.errors + result.mismatches} failures`,
    });
  }

  // 1. Rate limiting check (429)
  const count429 = result.statusCodeStats['429']?.count ?? 0;
  if (count429 > 0) {
    const pct429 = totalRequests > 0 ? ((count429 / totalRequests) * 100).toFixed(1) : '0.0';
    findings.push({
      id: 'rate-limiting',
      severity: 'warning',
      title: 'Rate Limiting Detected (HTTP 429)',
      detail: `Target throttled requests above ~${Math.round(result.requests.average)} req/s. Consider testing with a fixed Rate-Paced profile below this threshold.`,
      metric: `${count429.toLocaleString()} hits (${pct429}%)`,
    });
  }

  // 2. Server 5xx errors
  if (result['5xx'] > 0) {
    const pct5xx = totalRequests > 0 ? ((result['5xx'] / totalRequests) * 100).toFixed(2) : '0.00';
    findings.push({
      id: 'server-5xx',
      severity: 'critical',
      title: 'Upstream 5xx Failures Observed',
      detail: 'The target returned server errors under load—commonly caused by database connection pool exhaustion, unhandled exceptions, or upstream gateway timeouts.',
      metric: `${result['5xx'].toLocaleString()} errors (${pct5xx}%)`,
    });
  }

  // 3. Worker starvation / tail latency skew
  const p50 = result.latency.p50 || 0;
  const p99 = result.latency.p99 || 0;
  if (p99 > 500 && (p50 === 0 || p99 / Math.max(p50, 1) >= 4)) {
    findings.push({
      id: 'tail-latency-skew',
      severity: 'warning',
      title: 'Severe Tail-Latency Skew (Worker Starvation)',
      detail: `Median latency stays at ${p50}ms while p99 spikes to ${p99}ms (${(p99 / Math.max(p50, 1)).toFixed(1)}x). This indicates event-loop blocking, GC pauses, or queued DB locks.`,
      metric: `p50 ${p50}ms -> p99 ${p99}ms`,
    });
  }

  // 4. Timeouts / Connection resets
  if (result.timeouts > 0 || result.resets > 0) {
    findings.push({
      id: 'timeouts-resets',
      severity: 'critical',
      title: 'Socket Timeouts & Connection Resets',
      detail: `Sockets timed out (${result.timeouts}) or reset (${result.resets}) during the run. Target keep-alive backlog or load balancer timeouts may be saturated.`,
      metric: `${result.timeouts} timeouts · ${result.resets} resets`,
    });
  }

  // 5. Response body assertion mismatches
  if (result.mismatches > 0) {
    findings.push({
      id: 'body-mismatches',
      severity: 'critical',
      title: 'Response Body Assertion Failures',
      detail: `Expected body substring "${config.expectBody}" failed verification on ${result.mismatches} responses under concurrency.`,
      metric: `${result.mismatches} mismatches`,
    });
  }

  // 6. Coordinated omission warning
  if (
    config.ignoreCoordinatedOmission &&
    (config.overallRate || config.connectionRate)
  ) {
    findings.push({
      id: 'coordinated-omission',
      severity: 'info',
      title: 'Coordinated Omission Correction Disabled',
      detail: 'Running rate-limited tests with -C/--ignoreCoordinatedOmission can under-report queueing latency if the target falls behind the target RPS.',
      metric: 'Flag -C active',
    });
  }

  // 7. Auth / Client 4xx excluding 429
  const other4xx = Math.max(0, result['4xx'] - count429);
  if (other4xx > 0) {
    findings.push({
      id: 'client-4xx',
      severity: 'warning',
      title: 'Non-429 Client Errors Returned (4xx)',
      detail: 'Target returned 400/401/403/404 responses. Verify authorization headers, route paths, or request payload formatting.',
      metric: `${other4xx.toLocaleString()} responses`,
    });
  }

  // 8. Healthy baseline if no critical/warning issues
  const hasProblems = findings.some(
    (f) => f.severity === 'critical' || f.severity === 'warning'
  );
  if (!hasProblems && totalRequests > 0) {
    findings.push({
      id: 'healthy-baseline',
      severity: 'healthy',
      title: 'Target Stable Under Tested Load',
      detail: `Sustained ${Math.round(result.requests.average).toLocaleString()} req/s with ${errorRatePct.toFixed(2)}% transport errors and predictable tail latency.`,
      metric: `p99 ${p99}ms · 2xx ${result['2xx'].toLocaleString()}`,
    });
  }

  return findings;
}

export function computeRunComparison(
  baseline: BenchmarkRunRecord,
  candidate: BenchmarkRunRecord
): RunComparisonMetrics {
  const rpsA = baseline.result.requests.average || 0;
  const rpsB = candidate.result.requests.average || 0;
  const rpsDelta = rpsB - rpsA;
  const rpsDeltaPct = rpsA > 0 ? (rpsDelta / rpsA) * 100 : 0;

  const p50A = baseline.result.latency.p50 || 0;
  const p50B = candidate.result.latency.p50 || 0;
  const p50DeltaMs = p50B - p50A;
  const p50DeltaPct = p50A > 0 ? (p50DeltaMs / p50A) * 100 : 0;

  const p90A = baseline.result.latency.p90 || 0;
  const p90B = candidate.result.latency.p90 || 0;
  const p90DeltaMs = p90B - p90A;
  const p90DeltaPct = p90A > 0 ? (p90DeltaMs / p90A) * 100 : 0;

  const p99A = baseline.result.latency.p99 || 0;
  const p99B = candidate.result.latency.p99 || 0;
  const p99DeltaMs = p99B - p99A;
  const p99DeltaPct = p99A > 0 ? (p99DeltaMs / p99A) * 100 : 0;

  const tpA = baseline.result.throughput.average || 0;
  const tpB = candidate.result.throughput.average || 0;
  const throughputDeltaBytes = tpB - tpA;
  const throughputDeltaPct = tpA > 0 ? (throughputDeltaBytes / tpA) * 100 : 0;

  const totA = (baseline.result.requests.total || 0) + baseline.result.errors;
  const errCountA = baseline.result.errors + baseline.result.non2xx;
  const errorRateA = totA > 0 ? (errCountA / totA) * 100 : 0;

  const totB = (candidate.result.requests.total || 0) + candidate.result.errors;
  const errCountB = candidate.result.errors + candidate.result.non2xx;
  const errorRateB = totB > 0 ? (errCountB / totB) * 100 : 0;

  return {
    rpsDelta,
    rpsDeltaPct,
    p50DeltaMs,
    p50DeltaPct,
    p90DeltaMs,
    p90DeltaPct,
    p99DeltaMs,
    p99DeltaPct,
    throughputDeltaBytes,
    throughputDeltaPct,
    errorRateA,
    errorRateB,
    errorRateDeltaPct: errorRateB - errorRateA,
    apdexDelta: Number((candidate.apdexScore - baseline.apdexScore).toFixed(2)),
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateHtmlExecutiveReport(run: BenchmarkRunRecord): string {
  const { result, config, diagnostics, apdexScore } = run;
  const statusEntries = Object.entries(result.statusCodeStats || {})
    .map(
      ([code, info]) =>
        `<tr><td>HTTP ${escapeHtml(code)}</td><td style="text-align:right;font-family:monospace">${info.count.toLocaleString()}</td></tr>`
    )
    .join('');

  const diagHtml = diagnostics
    .map(
      (d) =>
        `<div class="diag ${d.severity}"><strong>${escapeHtml(d.title)}</strong> <span class="metric">${escapeHtml(d.metric)}</span><p>${escapeHtml(d.detail)}</p></div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CannonBench Report — ${escapeHtml(run.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #ffffff; max-width: 960px; margin: 40px auto; padding: 0 24px; line-height: 1.5; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
    .label { font-size: 12px; color: #64748b; }
    .val { font-size: 22px; font-weight: 600; font-family: monospace; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .diag { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
    .diag.critical { background: #fef2f2; border-color: #fecaca; }
    .diag.warning { background: #fffbeb; border-color: #fde68a; }
    .diag.healthy { background: #f0fdf4; border-color: #bbf7d0; }
    .metric { float: right; font-family: monospace; font-size: 12px; color: #334155; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; overflow-x: auto; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(run.title)}</h1>
  <div class="meta">${escapeHtml(config.method)} ${escapeHtml(result.url)} · ${escapeHtml(new Date(run.createdAt).toLocaleString())} · Pattern: ${escapeHtml(config.pattern)} · APDEX: ${apdexScore.toFixed(2)}</div>
  <div class="grid">
    <div class="box"><div class="label">Avg Throughput</div><div class="val">${Math.round(result.requests.average).toLocaleString()} req/s</div></div>
    <div class="box"><div class="label">p50 / p99 Latency</div><div class="val">${result.latency.p50} / ${result.latency.p99} ms</div></div>
    <div class="box"><div class="label">Total Completed</div><div class="val">${result.requests.total.toLocaleString()}</div></div>
    <div class="box"><div class="label">Bandwidth</div><div class="val">${formatBytes(result.throughput.average)}/s</div></div>
  </div>
  <h2>Latency Distribution (ms)</h2>
  <table>
    <thead><tr><th>Min</th><th>p50</th><th>p90</th><th>p97.5</th><th>p99</th><th>p99.9</th><th>Max</th><th>StdDev</th></tr></thead>
    <tbody><tr>
      <td style="font-family:monospace">${result.latency.min}</td>
      <td style="font-family:monospace">${result.latency.p50}</td>
      <td style="font-family:monospace">${result.latency.p90}</td>
      <td style="font-family:monospace">${result.latency.p97_5}</td>
      <td style="font-family:monospace">${result.latency.p99}</td>
      <td style="font-family:monospace">${result.latency.p99_9}</td>
      <td style="font-family:monospace">${result.latency.max}</td>
      <td style="font-family:monospace">${result.latency.stddev.toFixed(2)}</td>
    </tr></tbody>
  </table>
  <h2>Status Code Breakdown</h2>
  <table>
    <thead><tr><th>Status</th><th style="text-align:right">Count</th></tr></thead>
    <tbody>${statusEntries || '<tr><td colspan="2">No HTTP responses recorded</td></tr>'}</tbody>
  </table>
  <h2>Automated Bottleneck Diagnostics</h2>
  ${diagHtml}
  <h2>CLI Command</h2>
  <pre>${escapeHtml(run.cliCommand)}</pre>
</body>
</html>`;
}

export function generateGithubActionsWorkflow(
  config: BenchmarkConfig,
  cliCommand: string,
  maxP99Ms: number,
  maxErrorPct: number
): string {
  const safeTarget = config.url || 'https://staging.example.com/api/health';
  return `name: Autocannon Performance Gate

on:
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run Autocannon Benchmark
        run: |
          ${cliCommand.replace(config.url, safeTarget)} --json > autocannon-results.json

      - name: Enforce Latency & Error SLO Gate
        run: |
          node -e '
            const fs = require("fs");
            const data = JSON.parse(fs.readFileSync("autocannon-results.json", "utf8"));
            const total = (data.requests?.total || 0) + (data.errors || 0);
            const errPct = total > 0 ? ((data.errors + data.non2xx) / total) * 100 : 100;
            const p99 = data.latency?.p99 || 0;
            console.log({ avgRps: data.requests?.average, p99, errPct: errPct.toFixed(2) });
            if (p99 > ${maxP99Ms}) {
              console.error(\`FAIL: p99 latency \${p99}ms exceeded ${maxP99Ms}ms\`);
              process.exit(1);
            }
            if (errPct > ${maxErrorPct}) {
              console.error(\`FAIL: error rate \${errPct.toFixed(2)}% exceeded ${maxErrorPct}%\`);
              process.exit(1);
            }
          '`;
}
