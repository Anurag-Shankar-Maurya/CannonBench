'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, Printer } from 'lucide-react';
import type { BenchmarkConfig, BenchmarkRunRecord } from '@/types/benchmark';
import { buildAutocannonCliCommand } from '@/lib/autocannon-cli';
import {
  formatBytes,
  generateGithubActionsWorkflow,
  generateHtmlExecutiveReport,
} from '@/lib/diagnostics';

interface ReportsCiViewProps {
  runs: BenchmarkRunRecord[];
  activeConfig: BenchmarkConfig;
  onUpdateSlo: (targetLatencyMs: number, maxErrorPct: number) => void;
  onNotify: (msg: string) => void;
}

export default function ReportsCiView({
  runs,
  activeConfig,
  onUpdateSlo,
  onNotify,
}: ReportsCiViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.id ?? '');
  const [maxP99Gate, setMaxP99Gate] = useState<number>(
    Math.max(50, activeConfig.sloTargetLatencyMs * 2)
  );
  const [maxErrGate, setMaxErrGate] = useState<number>(activeConfig.sloMaxErrorPct);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  const targetConfig = selectedRun ? selectedRun.config : activeConfig;
  const cliCommand = useMemo(
    () => buildAutocannonCliCommand(targetConfig),
    [targetConfig]
  );

  const ciYaml = useMemo(
    () => generateGithubActionsWorkflow(targetConfig, cliCommand, maxP99Gate, maxErrGate),
    [targetConfig, cliCommand, maxP99Gate, maxErrGate]
  );

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(ciYaml);
      setCopiedYaml(true);
      onNotify('Copied GitHub Actions workflow YAML');
      setTimeout(() => setCopiedYaml(false), 1800);
    } catch {
      onNotify('Clipboard unavailable');
    }
  };

  const handleDownloadHtml = () => {
    if (!selectedRun) return;
    const html = generateHtmlExecutiveReport(selectedRun);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-report-${selectedRun.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    if (!selectedRun) return;
    const r = selectedRun;
    const md = [
      `# ${r.title}`,
      ``,
      `- **Target:** \`${r.config.method} ${r.result.url}\``,
      `- **Date:** ${new Date(r.createdAt).toISOString()}`,
      `- **Pattern:** ${r.config.pattern} (${r.result.connections} connections, ${r.result.duration}s)`,
      `- **APDEX:** ${r.apdexScore.toFixed(2)}`,
      ``,
      `## Key Metrics`,
      `| Metric | Value |`,
      `| :--- | :--- |`,
      `| Avg RPS | ${Math.round(r.result.requests.average).toLocaleString()} req/s |`,
      `| Total Completed | ${r.result.requests.total.toLocaleString()} |`,
      `| Bandwidth | ${formatBytes(r.result.throughput.average)}/s |`,
      `| p50 / p90 / p99 | ${r.result.latency.p50} / ${r.result.latency.p90} / ${r.result.latency.p99} ms |`,
      `| Errors / Non-2xx | ${r.result.errors} / ${r.result.non2xx} |`,
      ``,
      `## Diagnostics`,
      ...r.diagnostics.map((d) => `- **[${d.severity.toUpperCase()}] ${d.title}** (${d.metric}): ${d.detail}`),
      ``,
      `## CLI Command`,
      `\`\`\`bash`,
      r.cliCommand,
      `\`\`\``,
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-report-${r.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Executive Reports & SLO Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Executive Report & SLO Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure APDEX latency targets and export shareable reports.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                APDEX Target T (ms)
              </label>
              <input
                type="number"
                min={10}
                max={10000}
                value={activeConfig.sloTargetLatencyMs}
                onChange={(e) =>
                  onUpdateSlo(
                    Math.max(10, Number(e.target.value) || 150),
                    activeConfig.sloMaxErrorPct
                  )
                }
                className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Error SLO (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={activeConfig.sloMaxErrorPct}
                onChange={(e) =>
                  onUpdateSlo(
                    activeConfig.sloTargetLatencyMs,
                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                  )
                }
                className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
              />
            </div>
          </div>

          {selectedRun ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Run to Export
                </label>
                <select
                  value={selectedRun.id}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md bg-white"
                >
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} · {Math.round(r.result.requests.average)} req/s
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export HTML
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Markdown
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Complete at least one benchmark run to generate HTML, Markdown, or PDF reports.
            </p>
          )}
        </div>

        {/* GitHub Actions CI Gate Generator */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                GitHub Actions CI Performance Gate
              </h2>
              <p className="text-xs text-slate-500">
                Fail pull requests automatically when p99 latency or error rate exceeds thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyYaml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {copiedYaml ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedYaml ? 'Copied YAML' : 'Copy Workflow'}
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fail Gate if p99 &gt; (ms)
                </label>
                <input
                  type="number"
                  min={10}
                  max={60000}
                  value={maxP99Gate}
                  onChange={(e) => setMaxP99Gate(Math.max(10, Number(e.target.value) || 250))}
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fail Gate if Error Rate &gt; (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={maxErrGate}
                  onChange={(e) => setMaxErrGate(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded"
                />
              </div>
            </div>

            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 overflow-x-auto leading-relaxed">
              {ciYaml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
