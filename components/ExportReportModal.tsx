'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Download, FileCode2, FileText, Printer, X } from 'lucide-react';
import type { BenchmarkConfig, BenchmarkRunRecord } from '@/types/benchmark';
import { buildAutocannonCliCommand } from '@/lib/autocannon-cli';
import {
  formatBytes,
  generateGithubActionsWorkflow,
  generateHtmlExecutiveReport,
} from '@/lib/diagnostics';
import { downloadPdfExecutiveReport } from '@/lib/pdf-export';

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  run: BenchmarkRunRecord | null;
  activeConfig: BenchmarkConfig;
  onNotify: (msg: string) => void;
}

export default function ExportReportModal({
  open,
  onClose,
  run,
  activeConfig,
  onNotify,
}: ExportReportModalProps) {
  const [maxP99Gate, setMaxP99Gate] = useState(250);
  const [maxErrGate, setMaxErrGate] = useState(1);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const targetConfig = run ? run.config : activeConfig;
  const cliCommand = useMemo(
    () => buildAutocannonCliCommand(targetConfig),
    [targetConfig]
  );
  const ciYaml = useMemo(
    () => generateGithubActionsWorkflow(targetConfig, cliCommand, maxP99Gate, maxErrGate),
    [targetConfig, cliCommand, maxP99Gate, maxErrGate]
  );

  const handleDownloadHtml = () => {
    if (!run) return;
    const html = generateHtmlExecutiveReport(run);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-report-${run.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Downloaded HTML executive report');
  };

  const handleDownloadPdf = () => {
    if (!run) return;
    try {
      downloadPdfExecutiveReport(run);
      onNotify('Downloaded PDF executive report');
    } catch {
      onNotify('Failed to generate PDF report');
    }
  };

  const handleDownloadJson = () => {
    if (!run) return;
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Downloaded raw JSON results');
  };

  const handleDownloadMarkdown = () => {
    if (!run) return;
    const md = [
      `# ${run.title}`,
      ``,
      `- Target: \`${run.config.method} ${run.result.url}\``,
      `- Avg RPS: ${Math.round(run.result.requests.average).toLocaleString()} req/s`,
      `- p50 / p99: ${run.result.latency.p50} / ${run.result.latency.p99} ms`,
      `- Transfer: ${formatBytes(run.result.throughput.average)}/s`,
      `- APDEX: ${run.apdexScore.toFixed(2)}`,
      ``,
      `\`\`\`bash`,
      run.cliCommand,
      `\`\`\``,
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cannonbench-${run.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Downloaded Markdown report');
  };

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(ciYaml);
      setCopiedYaml(true);
      onNotify('Copied GitHub Actions workflow');
      setTimeout(() => setCopiedYaml(false), 1800);
    } catch {
      onNotify('Clipboard unavailable');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Export Report & CI Gate</h2>
                  <p className="text-xs text-slate-500">
                    {run
                      ? `Selected run: ${run.title} (${Math.round(run.result.requests.average)} req/s)`
                      : 'Complete a benchmark run to export HTML/PDF/JSON reports, or copy the CI gate.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close export modal"
                  className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Report Download Actions */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={!run}
                    onClick={handleDownloadHtml}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    HTML Report
                  </button>
                  <button
                    type="button"
                    disabled={!run}
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl disabled:opacity-40"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    PDF Report
                  </button>
                  <button
                    type="button"
                    disabled={!run}
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Markdown
                  </button>
                  <button
                    type="button"
                    disabled={!run}
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    Raw JSON
                  </button>
                  <button
                    type="button"
                    disabled={!run}
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-40"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>

                {/* CI Gate YAML */}
                <div className="space-y-3 pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">
                        GitHub Actions SLO Gate
                      </h3>
                      <p className="text-xs text-slate-500">
                        Fail CI builds if p99 latency or error rate exceeds thresholds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyYaml}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      {copiedYaml ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedYaml ? 'Copied' : 'Copy YAML'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Max p99 Latency (ms)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={60000}
                        value={maxP99Gate}
                        onChange={(e) => setMaxP99Gate(Math.max(10, Number(e.target.value) || 250))}
                        className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Max Error Rate (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={maxErrGate}
                        onChange={(e) => setMaxErrGate(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-8 px-2.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto leading-relaxed">
                    {ciYaml}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
