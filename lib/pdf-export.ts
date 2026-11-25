import { jsPDF } from 'jspdf';
import type { BenchmarkRunRecord } from '@/types/benchmark';
import { formatBytes } from './diagnostics';

export function downloadPdfExecutiveReport(run: BenchmarkRunRecord): void {
  const { result, config, diagnostics, apdexScore, ticks } = run;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = 44;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 44) {
      doc.addPage();
      y = 44;
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, 22, 22, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CB', margin + 11, y + 14.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CannonBench', margin + 30, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated ${new Date(run.createdAt).toLocaleString()}`,
    pageW - margin,
    y + 14,
    { align: 'right' }
  );

  y += 34;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // Title & Target Metadata
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(run.title || 'Load Test Report', margin, y);
  y += 16;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const metaLine = `${config.method} ${result.url}`;
  const wrappedMeta = doc.splitTextToSize(metaLine, contentW);
  doc.text(wrappedMeta, margin, y);
  y += wrappedMeta.length * 11 + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Pattern: ${config.pattern}  |  Connections: ${result.connections}  |  Duration: ${result.duration}s  |  APDEX: ${apdexScore.toFixed(2)}`,
    margin,
    y
  );
  y += 20;

  // 4 KPI Boxes
  const kpiGap = 10;
  const kpiW = (contentW - kpiGap * 3) / 4;
  const kpiH = 56;
  const totalAttempts = result['2xx'] + result.non2xx + result.errors + result.mismatches;
  const successPct =
    totalAttempts > 0 ? ((result['2xx'] / totalAttempts) * 100).toFixed(1) : '0.0';

  const kpis = [
    {
      label: 'Avg Throughput',
      value: `${Math.round(result.requests.average).toLocaleString()} req/s`,
      sub: `Peak ${Math.round(result.requests.max).toLocaleString()} req/s`,
    },
    {
      label: 'p50 / p99 Latency',
      value: `${result.latency.p50} / ${result.latency.p99} ms`,
      sub: `Max ${result.latency.max} ms`,
    },
    {
      label: 'Completed Reqs',
      value: result.requests.total.toLocaleString(),
      sub: `${formatBytes(result.throughput.average)}/s egress`,
    },
    {
      label: 'Success Rate',
      value: `${successPct}%`,
      sub: `${result.errors + result.non2xx} non-2xx/err`,
    },
  ];

  kpis.forEach((k, idx) => {
    const x = margin + idx * (kpiW + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiW, kpiH, 6, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + 10, y + 15);

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, x + 10, y + 32);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub, x + 10, y + 46);
  });

  y += kpiH + 22;

  // Vector Dual-Line Telemetry Chart (if ticks exist)
  if (ticks.length > 1) {
    ensureSpace(165);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Throughput & Latency Timeline', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(99, 102, 241);
    doc.text('Req/sec (Indigo)', pageW - margin - 95, y);
    doc.setTextColor(217, 119, 6);
    doc.text('Avg Latency ms (Amber)', pageW - margin, y, { align: 'right' });
    y += 10;

    const chartX = margin;
    const chartY = y;
    const chartW = contentW;
    const chartH = 120;
    const padL = 34;
    const padR = 34;
    const padT = 10;
    const padB = 18;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(chartX, chartY, chartW, chartH, 6, 6, 'FD');

    const maxRps = Math.max(10, ...ticks.map((t) => t.rps)) * 1.15;
    const maxLat = Math.max(10, ...ticks.map((t) => Math.max(t.p99, t.avgLatency))) * 1.15;

    // Gridlines
    for (let g = 0; g <= 4; g++) {
      const gy = chartY + padT + innerH * (1 - g / 4);
      doc.setDrawColor(241, 245, 249);
      doc.line(chartX + padL, gy, chartX + chartW - padR, gy);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(99, 102, 241);
      doc.text(String(Math.round((maxRps * g) / 4)), chartX + padL - 4, gy + 2, {
        align: 'right',
      });

      doc.setTextColor(217, 119, 6);
      doc.text(`${Math.round((maxLat * g) / 4)}ms`, chartX + chartW - padR + 4, gy + 2);
    }

    const xFor = (i: number) => chartX + padL + (i / (ticks.length - 1)) * innerW;

    // Indigo RPS Line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1.4);
    for (let i = 1; i < ticks.length; i++) {
      const x1 = xFor(i - 1);
      const y1 = chartY + padT + innerH - (ticks[i - 1].rps / maxRps) * innerH;
      const x2 = xFor(i);
      const y2 = chartY + padT + innerH - (ticks[i].rps / maxRps) * innerH;
      doc.line(x1, y1, x2, y2);
    }

    // Amber Latency Line
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.2);
    for (let i = 1; i < ticks.length; i++) {
      const x1 = xFor(i - 1);
      const y1 = chartY + padT + innerH - (ticks[i - 1].avgLatency / maxLat) * innerH;
      const x2 = xFor(i);
      const y2 = chartY + padT + innerH - (ticks[i].avgLatency / maxLat) * innerH;
      doc.line(x1, y1, x2, y2);
    }
    doc.setLineWidth(0.75);

    // X-axis tick labels
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const step = Math.max(1, Math.ceil(ticks.length / 8));
    for (let i = 0; i < ticks.length; i += step) {
      doc.text(`${ticks[i].elapsedSec}s`, xFor(i), chartY + chartH - 5, { align: 'center' });
    }

    y += chartH + 22;
  }

  // Two-Column Percentiles & Status Breakdown
  ensureSpace(150);
  const colGap = 18;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Statistical Percentiles (ms)', leftX, y);
  doc.text('HTTP Status & Egress', rightX, y);
  y += 12;

  const pctRows = [
    ['Min', `${result.latency.min} ms`],
    ['2.5%', `${result.latency.p2_5} ms`],
    ['50% (Median)', `${result.latency.p50} ms`],
    ['90%', `${result.latency.p90} ms`],
    ['97.5%', `${result.latency.p97_5} ms`],
    ['99% (Tail)', `${result.latency.p99} ms`],
    ['Max', `${result.latency.max} ms`],
  ];

  const statusRows: Array<[string, string]> = Object.entries(result.statusCodeStats || {}).map(
    ([code, stat]) => [`HTTP ${code}`, stat.count.toLocaleString()]
  );
  if (statusRows.length === 0) {
    statusRows.push(['HTTP Responses', '0']);
  }
  statusRows.push(['Total Transferred', formatBytes(result.throughput.total)]);
  statusRows.push(['Transfer Rate', `${formatBytes(result.throughput.average)}/s`]);
  statusRows.push(['Errors / Timeouts', `${result.errors} / ${result.timeouts}`]);

  const maxRows = Math.max(pctRows.length, statusRows.length);
  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * 16;
    if (pctRows[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(pctRows[i][0], leftX, rowY);
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(pctRows[i][1], leftX + colW, rowY, { align: 'right' });
      doc.setDrawColor(241, 245, 249);
      doc.line(leftX, rowY + 4, leftX + colW, rowY + 4);
    }

    if (statusRows[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(statusRows[i][0], rightX, rowY);
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(statusRows[i][1], rightX + colW, rowY, { align: 'right' });
      doc.setDrawColor(241, 245, 249);
      doc.line(rightX, rowY + 4, rightX + colW, rowY + 4);
    }
  }

  y += maxRows * 16 + 20;

  // Diagnostics Section
  ensureSpace(90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Automated Bottleneck Diagnostics', margin, y);
  y += 14;

  for (const diag of diagnostics) {
    const detailLines = doc.splitTextToSize(diag.detail, contentW - 20);
    const boxH = 26 + detailLines.length * 10;
    ensureSpace(boxH + 8);

    if (diag.severity === 'critical') {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
    } else if (diag.severity === 'warning') {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(253, 230, 138);
    } else if (diag.severity === 'healthy') {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }

    doc.roundedRect(margin, y, contentW, boxH, 5, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`[${diag.severity.toUpperCase()}] ${diag.title}`, margin + 10, y + 14);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(diag.metric, pageW - margin - 10, y + 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(detailLines, margin + 10, y + 26);

    y += boxH + 8;
  }

  // CLI Command
  const cliLines = doc.splitTextToSize(run.cliCommand, contentW - 20);
  const cliBoxH = 18 + cliLines.length * 10;
  ensureSpace(cliBoxH + 24);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Autocannon CLI Equivalent', margin, y);
  y += 10;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentW, cliBoxH, 5, 5, 'FD');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(cliLines, margin + 10, y + 14);

  doc.save(`cannonbench-report-${run.id}.pdf`);
}
