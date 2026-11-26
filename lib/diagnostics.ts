import type {
  AutocannonResultSummary,
  BenchmarkConfig,
  BenchmarkRunRecord,
  DiagnosticFinding,
  LatencyHistogramBucket,
  RunComparisonMetrics,
} from '@/types/benchmark';

export function evaluateSloThresholds(
  result: AutocannonResultSummary,
  config: BenchmarkConfig
): { status: 'passed' | 'breached'; breaches: string[] } {
  const breaches: string[] = [];
  const totalCompleted = result.requests.total || 0;
  const totalWithErrors = totalCompleted + result.errors;
  const errorRatePct = totalWithErrors > 0 ? (result.errors / totalWithErrors) * 100 : 0;

  if (config.sloMaxErrorPct !== undefined && errorRatePct > config.sloMaxErrorPct) {
    breaches.push(
      `Error rate (${errorRatePct.toFixed(1)}%) exceeded maximum allowed (${config.sloMaxErrorPct}%)`
    );
  }

  if (config.sloMaxP99Ms && result.latency.p99 > config.sloMaxP99Ms) {
    breaches.push(
      `p99 latency (${result.latency.p99} ms) exceeded threshold (${config.sloMaxP99Ms} ms)`
    );
  }

  if (config.sloTargetLatencyMs && result.latency.p50 > config.sloTargetLatencyMs) {
    breaches.push(
      `p50 median latency (${result.latency.p50} ms) exceeded target (${config.sloTargetLatencyMs} ms)`
    );
  }

  if (config.sloMinRps && result.requests.average < config.sloMinRps) {
    breaches.push(
      `Throughput (${Math.round(result.requests.average)} RPS) fell below minimum target (${config.sloMinRps} RPS)`
    );
  }

  return {
    status: breaches.length === 0 ? 'passed' : 'breached',
    breaches,
  };
}

export function buildLatencyHistogram(latencies: number[]): LatencyHistogramBucket[] {
  if (latencies.length === 0) return [];
  const boundaries = [5, 10, 25, 50, 100, 200, 400, 800, 1500, 3000];
  const counts = new Array(boundaries.length + 1).fill(0);

  for (const lat of latencies) {
    let placed = false;
    for (let i = 0; i < boundaries.length; i++) {
      if (lat <= boundaries[i]) {
        counts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      counts[boundaries.length]++;
    }
  }

  const total = latencies.length;
  const buckets: LatencyHistogramBucket[] = [];

  for (let i = 0; i < counts.length; i++) {
    let label = '';
    let bucketMs = 0;
    if (i === 0) {
      label = `≤${boundaries[0]}ms`;
      bucketMs = boundaries[0];
    } else if (i === boundaries.length) {
      label = `>${boundaries[boundaries.length - 1]}ms`;
      bucketMs = boundaries[boundaries.length - 1] * 1.5;
    } else {
      label = `${boundaries[i - 1]}-${boundaries[i]}ms`;
      bucketMs = boundaries[i];
    }

    buckets.push({
      bucketMs,
      label,
      count: counts[i],
      percentage: total > 0 ? Number(((counts[i] / total) * 100).toFixed(1)) : 0,
    });
  }

  return buckets;
}

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
  const { result, config, diagnostics, apdexScore, ticks } = run;

  const totalAttempts =
    result['2xx'] + result.non2xx + result.errors + result.mismatches;
  const successRate =
    totalAttempts > 0 ? Math.round((result['2xx'] / totalAttempts) * 1000) / 10 : 0;

  // Dual-line SVG chart (Throughput + Avg Latency)
  const chartW = 840;
  const chartH = 220;
  const padL = 52;
  const padR = 52;
  const padT = 18;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  let timelineSvg =
    '<div style="padding:36px;text-align:center;color:#64748b;font-size:13px;border:1px dashed #cbd5e1;border-radius:12px;">No per-second tick telemetry captured for this run (multi-worker mode aggregates histograms upon completion).</div>';

  if (ticks && ticks.length > 0) {
    const maxRps = Math.max(10, ...ticks.map((t) => t.rps)) * 1.15;
    const maxLat =
      Math.max(10, ...ticks.map((t) => Math.max(t.p99, t.avgLatency))) * 1.15;

    const xFor = (i: number) =>
      ticks.length <= 1
        ? padL + innerW / 2
        : padL + (i / (ticks.length - 1)) * innerW;
    const yRps = (v: number) => padT + innerH - (v / maxRps) * innerH;
    const yLat = (v: number) => padT + innerH - (v / maxLat) * innerH;

    const rpsPts = ticks.map((t, i) => `${xFor(i).toFixed(1)},${yRps(t.rps).toFixed(1)}`);
    const latPts = ticks.map(
      (t, i) => `${xFor(i).toFixed(1)},${yLat(t.avgLatency).toFixed(1)}`
    );
    const rpsLine =
      ticks.length === 1
        ? `M ${rpsPts[0]} L ${(padL + innerW).toFixed(1)},${yRps(ticks[0].rps).toFixed(1)}`
        : `M ${rpsPts.join(' L ')}`;
    const latLine =
      ticks.length === 1
        ? `M ${latPts[0]} L ${(padL + innerW).toFixed(1)},${yLat(ticks[0].avgLatency).toFixed(1)}`
        : `M ${latPts.join(' L ')}`;

    const rpsArea =
      ticks.length > 1
        ? `${rpsLine} L ${xFor(ticks.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L ${xFor(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`
        : '';

    const gridLines = [0, 0.25, 0.5, 0.75, 1]
      .map((f) => {
        const gy = (padT + innerH * (1 - f)).toFixed(1);
        const rpsLbl = Math.round(maxRps * f);
        const latLbl = Math.round(maxLat * f);
        return `<line x1="${padL}" y1="${gy}" x2="${chartW - padR}" y2="${gy}" stroke="#e2e8f0" ${f === 0 ? '' : 'stroke-dasharray="4 4"'} />
          <text x="${padL - 8}" y="${Number(gy) + 3}" text-anchor="end" fill="#6366f1" font-size="10" font-family="ui-monospace,monospace">${rpsLbl >= 1000 ? `${(rpsLbl / 1000).toFixed(1)}k` : rpsLbl}</text>
          <text x="${chartW - padR + 8}" y="${Number(gy) + 3}" text-anchor="start" fill="#d97706" font-size="10" font-family="ui-monospace,monospace">${latLbl}ms</text>`;
      })
      .join('');

    const xLabels = ticks
      .map((t, i) => {
        const show =
          ticks.length <= 12 ||
          i % Math.ceil(ticks.length / 10) === 0 ||
          i === ticks.length - 1;
        return show
          ? `<text x="${xFor(i).toFixed(1)}" y="${chartH - 6}" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="ui-monospace,monospace">${t.elapsedSec}s</text>`
          : '';
      })
      .join('');

    timelineSvg = `<svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto;display:block;">
      <defs>
        <linearGradient id="cbRpsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${gridLines}
      ${rpsArea ? `<path d="${rpsArea}" fill="url(#cbRpsGrad)" />` : ''}
      <path d="${rpsLine}" fill="none" stroke="#6366f1" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />
      <path d="${latLine}" fill="none" stroke="#f59e0b" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round" />
      ${xLabels}
    </svg>`;
  }

  // Percentile Spectrum Bar Chart SVG
  const pctBars = [
    { label: 'min', val: result.latency.min },
    { label: 'p1', val: result.latency.p1 },
    { label: 'p2.5', val: result.latency.p2_5 },
    { label: 'p50', val: result.latency.p50 },
    { label: 'p75', val: result.latency.p75 },
    { label: 'p90', val: result.latency.p90 },
    { label: 'p97.5', val: result.latency.p97_5 },
    { label: 'p99', val: result.latency.p99 },
    { label: 'p99.9', val: result.latency.p99_9 },
    { label: 'max', val: result.latency.max },
  ];
  const maxPctBar = Math.max(1, ...pctBars.map((b) => b.val));
  const barSvgCols = pctBars
    .map((b, idx) => {
      const x = 14 + idx * 44;
      const h = Math.max(6, Math.round((b.val / maxPctBar) * 86));
      const y = 104 - h;
      const fill =
        b.label === 'max' || b.label === 'p99.9'
          ? '#ef4444'
          : b.label === 'p99' || b.label === 'p97.5'
            ? '#f59e0b'
            : '#6366f1';
      return `<g>
        <text x="${x + 14}" y="${y - 5}" text-anchor="middle" fill="#334155" font-size="9" font-family="ui-monospace,monospace">${b.val}</text>
        <rect x="${x}" y="18" width="28" height="86" rx="4" fill="#f1f5f9" />
        <rect x="${x}" y="${y}" width="28" height="${h}" rx="4" fill="${fill}" />
        <text x="${x + 14}" y="120" text-anchor="middle" fill="#64748b" font-size="9" font-family="ui-monospace,monospace">${b.label}</text>
      </g>`;
    })
    .join('');

  // APDEX & Success SVG Ring
  const ringR = 22;
  const ringC = 2 * Math.PI * ringR;
  const apdexOffset = (ringC - Math.max(0, Math.min(1, apdexScore)) * ringC).toFixed(1);
  const apdexColor =
    apdexScore >= 0.85 ? '#10b981' : apdexScore >= 0.65 ? '#f59e0b' : '#ef4444';

  // Status Stacked Proportion Bar
  const totalCodes = Math.max(1, totalAttempts);
  const pct2xx = (result['2xx'] / totalCodes) * 100;
  const pctWarn = ((result['3xx'] + result['4xx']) / totalCodes) * 100;
  const pctCrit = ((result['5xx'] + result.errors + result.mismatches) / totalCodes) * 100;

  const statusEntries = Object.entries(result.statusCodeStats || {})
    .map(([code, info]) => {
      const n = Number(code);
      const color = n >= 500 ? '#dc2626' : n >= 300 ? '#d97706' : '#059669';
      const share =
        result.requests.total > 0
          ? ((info.count / result.requests.total) * 100).toFixed(1)
          : '0.0';
      return `<tr><td style="color:${color};font-weight:600;font-family:ui-monospace,monospace">HTTP ${escapeHtml(code)}</td><td style="text-align:right;font-family:ui-monospace,monospace">${info.count.toLocaleString()}</td><td style="text-align:right;color:#64748b;font-family:ui-monospace,monospace">${share}%</td></tr>`;
    })
    .join('');

  const diagHtml = diagnostics
    .map(
      (d) =>
        `<div class="diag ${d.severity}">
          <div class="diag-head">
            <strong>${escapeHtml(d.title)}</strong>
            <span class="metric">${escapeHtml(d.metric)}</span>
          </div>
          <p>${escapeHtml(d.detail)}</p>
        </div>`
    )
    .join('');

  const stagesHtml =
    result.stages && result.stages.length > 1
      ? `<div class="card" style="margin-bottom:20px;">
          <div class="card-title">Stress Pattern Stage Breakdown</div>
          <table>
            <thead><tr><th>Stage</th><th class="r">Connections</th><th class="r">Duration</th><th class="r">Avg RPS</th><th class="r">p99</th><th class="r">Errors / Non-2xx</th></tr></thead>
            <tbody>${result.stages
              .map(
                (st) =>
                  `<tr><td>${escapeHtml(st.label)}</td><td class="r mono">${st.connections}</td><td class="r mono">${st.duration}s</td><td class="r mono">${st.avgRps.toLocaleString()}</td><td class="r mono">${st.p99Latency} ms</td><td class="r mono">${st.non2xx + st.errors}</td></tr>`
              )
              .join('')}</tbody>
          </table>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CannonBench Report — ${escapeHtml(run.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 36px 20px 60px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container { max-width: 1020px; margin: 0 auto; }
    .header {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .logo {
      width: 28px; height: 28px; border-radius: 8px; background: #0f172a; color: #818cf8;
      display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
    }
    .brand-name { font-weight: 700; font-size: 14px; letter-spacing: -0.01em; color: #0f172a; }
    h1 { font-size: 22px; margin: 0 0 6px; letter-spacing: -0.02em; }
    .meta { color: #64748b; font-size: 12px; font-family: ui-monospace, monospace; word-break: break-all; }
    .apdex-box { display: flex; align-items: center; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 20px; }
    @media (max-width: 780px) { .grid-4, .grid-2 { grid-template-columns: 1fr; } }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px 22px;
    }
    .card-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .card-sub { font-size: 12px; color: #64748b; margin-bottom: 14px; }
    .kpi-label { font-size: 12px; color: #64748b; font-weight: 500; }
    .kpi-val { font-size: 22px; font-weight: 700; font-family: ui-monospace, monospace; margin-top: 8px; color: #0f172a; }
    .kpi-sub { font-size: 11px; color: #64748b; font-family: ui-monospace, monospace; margin-top: 4px; }
    .legend { display: flex; gap: 16px; font-size: 11px; color: #475569; font-weight: 500; }
    .dot { display: inline-block; width: 10px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #f1f5f9; padding: 8px 6px; text-align: left; }
    th { color: #64748b; font-weight: 600; border-bottom-color: #e2e8f0; }
    .r { text-align: right; }
    .mono { font-family: ui-monospace, monospace; }
    .bar-track { height: 10px; width: 100%; border-radius: 99px; background: #f1f5f9; overflow: hidden; display: flex; margin-bottom: 14px; }
    .diag { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; background: #f8fafc; }
    .diag:last-child { margin-bottom: 0; }
    .diag.critical { background: #fef2f2; border-color: #fecaca; }
    .diag.warning { background: #fffbeb; border-color: #fde68a; }
    .diag.healthy { background: #f0fdf4; border-color: #bbf7d0; }
    .diag-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px; }
    .diag p { margin: 5px 0 0; font-size: 12px; color: #475569; }
    .metric { font-family: ui-monospace, monospace; font-size: 11px; color: #334155; }
    pre { background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 14px 16px; overflow-x: auto; font-size: 12px; font-family: ui-monospace, monospace; margin: 0; }
    @media print {
      body { background: #ffffff; padding: 12px; }
      .card, .header { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">
          <span class="logo">CB</span>
          <span class="brand-name">CannonBench Executive Report</span>
        </div>
        <h1>${escapeHtml(run.title)}</h1>
        <div class="meta">${escapeHtml(config.method)} ${escapeHtml(result.url)} · ${escapeHtml(new Date(run.createdAt).toLocaleString())} · ${escapeHtml(config.pattern)} · ${result.connections}c / ${result.duration}s</div>
      </div>
      <div class="apdex-box">
        <svg width="54" height="54" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="${ringR}" fill="none" stroke="#e2e8f0" stroke-width="5" />
          <circle cx="27" cy="27" r="${ringR}" fill="none" stroke="${apdexColor}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${ringC.toFixed(1)}" stroke-dashoffset="${apdexOffset}" transform="rotate(-90 27 27)" />
          <text x="27" y="31" text-anchor="middle" font-size="11" font-weight="700" font-family="ui-monospace,monospace" fill="#0f172a">${apdexScore.toFixed(2)}</text>
        </svg>
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:600;">APDEX Score</div>
          <div style="font-size:12px;color:#0f172a;font-family:ui-monospace,monospace;">SLO T = ${config.sloTargetLatencyMs}ms</div>
          <div style="font-size:11px;color:#64748b;">${successRate}% HTTP 2xx</div>
        </div>
      </div>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="kpi-label">Average Throughput</div>
        <div class="kpi-val">${Math.round(result.requests.average).toLocaleString()} <span style="font-size:12px;font-weight:500;color:#64748b;">req/s</span></div>
        <div class="kpi-sub">Peak ${Math.round(result.requests.max).toLocaleString()} req/s</div>
      </div>
      <div class="card">
        <div class="kpi-label">Median / Tail Latency</div>
        <div class="kpi-val">${result.latency.p50} / ${result.latency.p99} <span style="font-size:12px;font-weight:500;color:#64748b;">ms</span></div>
        <div class="kpi-sub">Max ${result.latency.max} ms · StdDev ${result.latency.stddev.toFixed(1)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Completed Requests</div>
        <div class="kpi-val">${result.requests.total.toLocaleString()}</div>
        <div class="kpi-sub">Sent ${(result.requests.sent ?? result.requests.total).toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Network Egress</div>
        <div class="kpi-val">${formatBytes(result.throughput.average)}<span style="font-size:12px;font-weight:500;color:#64748b;">/s</span></div>
        <div class="kpi-sub">Total ${formatBytes(result.throughput.total)}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
        <div>
          <div class="card-title">Throughput &amp; Latency Timeline</div>
          <div class="card-sub" style="margin-bottom:0;">1-second streaming interval telemetry</div>
        </div>
        <div class="legend">
          <span><span class="dot" style="background:#6366f1;"></span>Requests/sec</span>
          <span><span class="dot" style="background:#f59e0b;"></span>Avg Latency (ms)</span>
        </div>
      </div>
      ${timelineSvg}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Latency Percentile Spectrum (ms)</div>
        <div class="card-sub">HDRHistogram distribution from min to worst-case tail</div>
        <svg viewBox="0 0 460 132" style="width:100%;height:auto;display:block;margin-bottom:14px;">
          ${barSvgCols}
        </svg>
        <table>
          <thead><tr><th>Percentile</th><th class="r">Latency</th></tr></thead>
          <tbody>
            <tr><td>Min</td><td class="r mono">${result.latency.min} ms</td></tr>
            <tr><td>2.5%</td><td class="r mono">${result.latency.p2_5} ms</td></tr>
            <tr><td>50% (Median)</td><td class="r mono">${result.latency.p50} ms</td></tr>
            <tr><td>90%</td><td class="r mono">${result.latency.p90} ms</td></tr>
            <tr><td>97.5%</td><td class="r mono">${result.latency.p97_5} ms</td></tr>
            <tr><td>99% (Tail)</td><td class="r mono">${result.latency.p99} ms</td></tr>
            <tr><td>Max</td><td class="r mono">${result.latency.max} ms</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title">HTTP Status Codes &amp; Reliability</div>
        <div class="card-sub">Response code share across ${totalAttempts.toLocaleString()} total attempts</div>
        <div class="bar-track">
          ${pct2xx > 0 ? `<div style="width:${pct2xx.toFixed(2)}%;background:#10b981;"></div>` : ''}
          ${pctWarn > 0 ? `<div style="width:${pctWarn.toFixed(2)}%;background:#f59e0b;"></div>` : ''}
          ${pctCrit > 0 ? `<div style="width:${pctCrit.toFixed(2)}%;background:#ef4444;"></div>` : ''}
        </div>
        <table style="margin-bottom:14px;">
          <thead><tr><th>Status</th><th class="r">Count</th><th class="r">Share</th></tr></thead>
          <tbody>${statusEntries || '<tr><td colspan="3">No HTTP responses recorded</td></tr>'}</tbody>
        </table>
        <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px;font-family:ui-monospace,monospace;color:#475569;padding-top:8px;border-top:1px solid #f1f5f9;">
          <span>Errors: ${result.errors}</span>
          <span>Timeouts: ${result.timeouts}</span>
          <span>Resets: ${result.resets}</span>
          <span>Mismatches: ${result.mismatches}</span>
        </div>
      </div>
    </div>

    ${stagesHtml}

    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">Automated Bottleneck Diagnostics</div>
      <div class="card-sub">Heuristic analysis of tail latency skew, throttling, and upstream errors</div>
      ${diagHtml}
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px;">Autocannon CLI Equivalent</div>
      <pre>${escapeHtml(run.cliCommand)}</pre>
    </div>
  </div>
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
