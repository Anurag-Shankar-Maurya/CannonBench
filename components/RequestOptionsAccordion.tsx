'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Copy,
  FileUp,
  KeyRound,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
} from 'lucide-react';
import type { BenchmarkConfig, ChainedStep, LoadPattern } from '@/types/benchmark';
import { buildAutocannonCliCommand, parseHarFileJson } from '@/lib/autocannon-cli';

interface RequestOptionsAccordionProps {
  config: BenchmarkConfig;
  onChange: (next: BenchmarkConfig) => void;
  isRunning: boolean;
  onNotify: (msg: string) => void;
}

type OptionTab = 'headers' | 'body' | 'form' | 'chaining' | 'slo' | 'advanced';

const PATTERNS: Array<{ id: LoadPattern; label: string }> = [
  { id: 'constant', label: 'Constant' },
  { id: 'ramp', label: 'Ramp-Up' },
  { id: 'spike', label: 'Spike' },
  { id: 'soak', label: 'Soak' },
  { id: 'rate', label: 'Rate-Paced' },
];

export default function RequestOptionsAccordion({
  config,
  onChange,
  isRunning,
  onNotify,
}: RequestOptionsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OptionTab>('headers');
  const [copiedCli, setCopiedCli] = useState(false);
  const [authType, setAuthType] = useState<'bearer' | 'apikey' | 'basic' | 'cookie'>('bearer');
  const [authVal, setAuthVal] = useState('');
  const [authKeyName, setAuthKeyName] = useState('X-API-Key');
  const [ignoreStaticHar, setIgnoreStaticHar] = useState(true);
  const [harError, setHarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const cliCommand = useMemo(() => buildAutocannonCliCommand(config), [config]);

  const update = <K extends keyof BenchmarkConfig>(key: K, val: BenchmarkConfig[K]) => {
    onChange({ ...config, [key]: val });
  };

  const activeHeaderCount = config.headers.filter((h) => h.enabled && h.key.trim()).length;
  const bodyLines = useMemo(() => (config.body || '').split('\n'), [config.body]);

  const handleApplyAuth = () => {
    const raw = authVal.trim();
    if (!raw) return;
    let key = 'Authorization';
    let value = raw;
    if (authType === 'bearer') {
      value = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
    } else if (authType === 'basic') {
      value = raw.startsWith('Basic ')
        ? raw
        : `Basic ${typeof btoa === 'function' ? btoa(raw) : raw}`;
    } else if (authType === 'apikey') {
      key = authKeyName.trim() || 'X-API-Key';
    } else {
      key = 'Cookie';
    }

    const idx = config.headers.findIndex((h) => h.key.toLowerCase() === key.toLowerCase());
    const next = [...config.headers];
    if (idx >= 0) {
      next[idx] = { ...next[idx], key, value, enabled: true };
    } else {
      next.push({ id: `h-${Date.now()}`, key, value, enabled: true });
    }
    update('headers', next);
    setAuthVal('');
    onNotify(`Applied ${key} header`);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(config.body);
      onChange({
        ...config,
        bodyMode: 'raw',
        body: JSON.stringify(parsed, null, 2),
      });
      onNotify('Formatted JSON body');
    } catch {
      onNotify('Body is not strict JSON (dynamic tokens like {{$random_int}} can remain unquoted)');
    }
  };

  const handleHarFile = async (file: File) => {
    setHarError(null);
    try {
      const text = await file.text();
      const parsed = parseHarFileJson(text, ignoreStaticHar);
      onChange({
        ...config,
        useHar: true,
        harFileName: file.name,
        harRaw: parsed.sanitizedHar,
        harRequests: parsed.requests,
        url: parsed.requests[0]?.url || config.url,
      });
      onNotify(`Loaded ${parsed.requests.length} requests from ${file.name}`);
    } catch (err) {
      setHarError(err instanceof Error ? err.message : 'Unable to parse HAR file.');
    }
  };

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopiedCli(true);
      onNotify('Copied npx autocannon command');
      setTimeout(() => setCopiedCli(false), 1800);
    } catch {
      onNotify('Clipboard unavailable');
    }
  };

  const tabs: Array<{ id: OptionTab; label: string }> = [
    { id: 'headers', label: `Headers & Auth (${activeHeaderCount})` },
    { id: 'body', label: 'Body (JSON)' },
    {
      id: 'form',
      label:
        config.formFields.length > 0 ? `Form Data (${config.formFields.length})` : 'Form Data',
    },
    {
      id: 'chaining',
      label: config.enableChaining
        ? `Request Chaining (${config.chainedSteps?.length || 0} steps)`
        : 'Request Chaining',
    },
    { id: 'slo', label: 'SLO Quality Gates' },
    { id: 'advanced', label: 'Advanced Engine Options' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Accordion Summary Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            Request & Engine Options
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-mono truncate">
            {activeHeaderCount} headers ·{' '}
            {config.useHar
              ? `HAR (${config.harRequests.length} reqs)`
              : config.bodyMode === 'raw'
                ? 'JSON body'
                : config.bodyMode === 'form'
                  ? `Form (${config.formFields.length})`
                  : 'No body'}{' '}
            · {config.pattern} · Pipelining {config.pipelining}x
            {config.overallRate ? ` · ${config.overallRate} req/s cap` : ''}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-200/80"
          >
            {/* Tabs Navigation */}
            <div className="px-4 sm:px-5 bg-slate-50/60 border-b border-slate-200/80 flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-indigo-600 text-indigo-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 space-y-5">
              {activeTab === 'headers' && (
                <div className="space-y-4">
                  {/* Auth Quick Helper */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap shrink-0">
                      Quick Auth
                    </span>
                    <select
                      value={authType}
                      onChange={(e) =>
                        setAuthType(e.target.value as 'bearer' | 'apikey' | 'basic' | 'cookie')
                      }
                      className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg shrink-0"
                    >
                      <option value="bearer">Bearer JWT</option>
                      <option value="apikey">API Key Header</option>
                      <option value="basic">Basic Auth</option>
                      <option value="cookie">Cookie</option>
                    </select>
                    {authType === 'apikey' && (
                      <input
                        type="text"
                        value={authKeyName}
                        onChange={(e) => setAuthKeyName(e.target.value)}
                        placeholder="X-API-Key"
                        className="h-8 w-28 sm:w-32 min-w-0 px-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg shrink-0"
                      />
                    )}
                    <input
                      type="text"
                      value={authVal}
                      onChange={(e) => setAuthVal(e.target.value)}
                      placeholder={
                        authType === 'basic'
                          ? 'user:password'
                          : authType === 'cookie'
                            ? 'sid=abc123'
                            : 'Paste token or API key...'
                      }
                      className="h-8 flex-1 min-w-[160px] sm:min-w-[200px] px-3 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleApplyAuth}
                      className="h-8 px-3.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
                    >
                      Apply Header
                    </button>
                  </div>

                  {/* Key-Value Rows */}
                  <div className="space-y-2">
                    {config.headers.map((header, idx) => (
                      <div key={header.id} className="flex items-center gap-2 sm:gap-2.5 w-full">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={(e) => {
                            const next = [...config.headers];
                            next[idx] = { ...header, enabled: e.target.checked };
                            update('headers', next);
                          }}
                          className="rounded border-slate-300 text-indigo-600 shrink-0"
                        />
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => {
                            const next = [...config.headers];
                            next[idx] = { ...header, key: e.target.value };
                            update('headers', next);
                          }}
                          placeholder="Header name"
                          className="w-1/3 min-w-0 h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => {
                            const next = [...config.headers];
                            next[idx] = { ...header, value: e.target.value };
                            update('headers', next);
                          }}
                          placeholder="Value (supports {{$uuid}}, {{$timestamp}})"
                          className="flex-1 min-w-0 h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          aria-label="Remove header"
                          onClick={() =>
                            update(
                              'headers',
                              config.headers.filter((h) => h.id !== header.id)
                            )
                          }
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        update('headers', [
                          ...config.headers,
                          { id: `h-${Date.now()}`, key: '', value: '', enabled: true },
                        ])
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Header Row
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={config.bodyMode === 'raw'}
                          onChange={(e) =>
                            update('bodyMode', e.target.checked ? 'raw' : 'none')
                          }
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        Send Raw Request Body (-b)
                      </label>

                      <select
                        value={config.contentType}
                        onChange={(e) => update('contentType', e.target.value)}
                        className="h-8 px-2.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="application/json">application/json</option>
                        <option value="text/plain">text/plain</option>
                        <option value="application/x-www-form-urlencoded">
                          application/x-www-form-urlencoded
                        </option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {['[<id>]', '{{$uuid}}', '{{$timestamp}}', '{{$random_int}}'].map((tok) => (
                        <button
                          key={tok}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              bodyMode: 'raw',
                              idReplacement: tok === '[<id>]' ? true : config.idReplacement,
                              body: config.body ? `${config.body}\n${tok}` : tok,
                            })
                          }
                          className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          + {tok}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleFormatJson}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Format JSON
                      </button>
                    </div>
                  </div>

                  {/* Clean Line-Numbered Code Editor */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden flex font-mono text-xs">
                    <div
                      aria-hidden="true"
                      className="py-3 px-3 bg-slate-100/80 border-r border-slate-200 text-right text-slate-400 select-none leading-6"
                    >
                      {bodyLines.map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                      ))}
                    </div>
                    <textarea
                      rows={Math.max(6, Math.min(14, bodyLines.length))}
                      value={config.body}
                      onChange={(e) =>
                        onChange({ ...config, bodyMode: 'raw', body: e.target.value })
                      }
                      spellCheck={false}
                      placeholder='{"key": "value"}'
                      className="flex-1 p-3 bg-transparent text-slate-900 leading-6 focus:outline-none resize-y"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={config.idReplacement}
                      onChange={(e) => update('idReplacement', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    Enable native Autocannon [&lt;id&gt;] replacement (-I)
                  </label>
                </div>
              )}

              {activeTab === 'form' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.bodyMode === 'form'}
                        onChange={(e) =>
                          update('bodyMode', e.target.checked ? 'form' : 'none')
                        }
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Send Multipart Form-Data (-F)
                    </label>
                    <span className="text-xs text-slate-500">
                      Text fields sent via Autocannon&apos;s multipart builder
                    </span>
                  </div>

                  <div className="space-y-2">
                    {config.formFields.map((field, idx) => (
                      <div key={field.id} className="flex items-center gap-2.5">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => {
                            const next = [...config.formFields];
                            next[idx] = { ...field, name: e.target.value };
                            onChange({ ...config, bodyMode: 'form', formFields: next });
                          }}
                          placeholder="field_name"
                          className="w-1/3 h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => {
                            const next = [...config.formFields];
                            next[idx] = { ...field, value: e.target.value };
                            onChange({ ...config, bodyMode: 'form', formFields: next });
                          }}
                          placeholder="value"
                          className="flex-1 h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'formFields',
                              config.formFields.filter((f) => f.id !== field.id)
                            )
                          }
                          className="p-2 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          bodyMode: 'form',
                          formFields: [
                            ...config.formFields,
                            { id: `f-${Date.now()}`, name: '', value: '' },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Form Field
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'chaining' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">
                        Multi-Step Request Chaining (k6 / Postman Parity)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chain sequential API requests. Extract tokens or IDs from JSON responses and inject them into subsequent steps using <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">{'{{varName}}'}</code>.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(config.enableChaining)}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          const steps: ChainedStep[] = (config.chainedSteps && config.chainedSteps.length > 0)
                            ? config.chainedSteps
                            : [
                                {
                                  id: 'step-1',
                                  name: '1. Authenticate',
                                  method: 'POST',
                                  url: config.url,
                                  headers: [{ id: 'h-1', key: 'Content-Type', value: 'application/json', enabled: true }],
                                  bodyMode: 'raw',
                                  body: '{\n  "username": "demo",\n  "password": "password"\n}',
                                  contentType: 'application/json',
                                  extractVariables: [{ jsonPath: 'token', varName: 'authToken' }],
                                },
                                {
                                  id: 'step-2',
                                  name: '2. Fetch User Profile',
                                  method: 'GET',
                                  url: config.url.replace('/target', '/target?user={{authToken}}'),
                                  headers: [{ id: 'h-2', key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
                                  bodyMode: 'none',
                                  body: '',
                                  contentType: 'application/json',
                                  extractVariables: [],
                                },
                              ];
                          onChange({
                            ...config,
                            enableChaining: enabled,
                            chainedSteps: steps,
                          });
                          onNotify(enabled ? 'Enabled request chaining' : 'Disabled request chaining');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {config.enableChaining && (
                    <div className="space-y-4">
                      {(config.chainedSteps || []).map((step, idx) => (
                        <div
                          key={step.id}
                          className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={step.name}
                              onChange={(e) => {
                                const next = [...(config.chainedSteps || [])];
                                next[idx] = { ...step, name: e.target.value };
                                update('chainedSteps', next);
                              }}
                              className="text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = (config.chainedSteps || []).filter((_, i) => i !== idx);
                                update('chainedSteps', next);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-12 gap-2">
                            <select
                              value={step.method}
                              onChange={(e) => {
                                const next = [...(config.chainedSteps || [])];
                                next[idx] = { ...step, method: e.target.value as any };
                                update('chainedSteps', next);
                              }}
                              className="col-span-3 sm:col-span-2 h-8 px-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                            >
                              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={step.url}
                              onChange={(e) => {
                                const next = [...(config.chainedSteps || [])];
                                next[idx] = { ...step, url: e.target.value };
                                update('chainedSteps', next);
                              }}
                              placeholder="https://api.example.com/endpoint"
                              className="col-span-9 sm:col-span-10 h-8 px-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:border-indigo-600"
                            />
                          </div>

                          {/* Variable Extraction List */}
                          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-700">
                                Extract Variables from JSON Response
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...(config.chainedSteps || [])];
                                  next[idx] = {
                                    ...step,
                                    extractVariables: [
                                      ...step.extractVariables,
                                      { jsonPath: '', varName: '' },
                                    ],
                                  };
                                  update('chainedSteps', next);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                <Plus className="w-3 h-3" /> Add Extractor
                              </button>
                            </div>

                            {step.extractVariables.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">No variables extracted from this step.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {step.extractVariables.map((ext, extIdx) => (
                                  <div key={extIdx} className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono text-slate-400">JSON Path:</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. data.token or id"
                                      value={ext.jsonPath}
                                      onChange={(e) => {
                                        const next = [...(config.chainedSteps || [])];
                                        const nextExts = [...step.extractVariables];
                                        nextExts[extIdx] = { ...ext, jsonPath: e.target.value };
                                        next[idx] = { ...step, extractVariables: nextExts };
                                        update('chainedSteps', next);
                                      }}
                                      className="h-7 px-2 text-[11px] font-mono bg-white border border-slate-200 rounded flex-1"
                                    />
                                    <span className="text-[11px] font-mono text-slate-400">→ Variable:</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. authToken"
                                      value={ext.varName}
                                      onChange={(e) => {
                                        const next = [...(config.chainedSteps || [])];
                                        const nextExts = [...step.extractVariables];
                                        nextExts[extIdx] = { ...ext, varName: e.target.value };
                                        next[idx] = { ...step, extractVariables: nextExts };
                                        update('chainedSteps', next);
                                      }}
                                      className="h-7 px-2 text-[11px] font-mono bg-white border border-slate-200 rounded w-36"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...(config.chainedSteps || [])];
                                        next[idx] = {
                                          ...step,
                                          extractVariables: step.extractVariables.filter((_, i) => i !== extIdx),
                                        };
                                        update('chainedSteps', next);
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const steps = config.chainedSteps || [];
                          const newStep: ChainedStep = {
                            id: `step-${Date.now()}`,
                            name: `${steps.length + 1}. Action Step`,
                            method: 'GET',
                            url: config.url,
                            headers: [{ id: `h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
                            bodyMode: 'none',
                            body: '',
                            contentType: 'application/json',
                            extractVariables: [],
                          };
                          update('chainedSteps', [...steps, newStep]);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Step to Chain
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'slo' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <h4 className="text-xs font-semibold text-slate-800">
                      Service Level Objective (SLO) Quality Gates
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configure hard acceptance criteria for production performance. The test runner checks your final latency, throughput, and error rates against these thresholds and flags breach violations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Target Latency (p50 Median)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={5}
                          max={10000}
                          value={config.sloTargetLatencyMs || 150}
                          onChange={(e) => update('sloTargetLatencyMs', Number(e.target.value) || 150)}
                          className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <span className="text-xs text-slate-500 font-mono">ms</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Target response time for APDEX satisfaction.</p>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Max Tail Latency (p99 Gate)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={10}
                          max={30000}
                          value={config.sloMaxP99Ms || 250}
                          onChange={(e) => update('sloMaxP99Ms', Number(e.target.value) || 250)}
                          className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <span className="text-xs text-slate-500 font-mono">ms</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Fails if 99th percentile exceeds this threshold.</p>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Max Error Rate (%)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={100}
                          value={config.sloMaxErrorPct ?? 1}
                          onChange={(e) => update('sloMaxErrorPct', Number(e.target.value) || 0)}
                          className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <span className="text-xs text-slate-500 font-mono">%</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Fails if non-2xx/network errors exceed this %.</p>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Min Throughput (RPS)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={config.sloMinRps || 50}
                          onChange={(e) => update('sloMinRps', Number(e.target.value) || 0)}
                          className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <span className="text-xs text-slate-500 font-mono">req/s</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Fails if average RPS drops below this capacity.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  {/* Pattern Mode */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-800">
                        Stress Testing Pattern
                      </span>
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                        {PATTERNS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            disabled={isRunning}
                            onClick={() => {
                              if (p.id === 'rate') {
                                onChange({
                                  ...config,
                                  pattern: p.id,
                                  overallRate: config.overallRate ?? 150,
                                });
                              } else {
                                update('pattern', p.id);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                              config.pattern === p.id
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.pattern === 'ramp' && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Start Conn
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={config.rampConfig.startConnections}
                            onChange={(e) =>
                              update('rampConfig', {
                                ...config.rampConfig,
                                startConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            End Conn
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={config.rampConfig.endConnections}
                            onChange={(e) =>
                              update('rampConfig', {
                                ...config.rampConfig,
                                endConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Steps
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={config.rampConfig.steps}
                            onChange={(e) =>
                              update('rampConfig', {
                                ...config.rampConfig,
                                steps: Math.max(2, Math.min(10, Number(e.target.value) || 2)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Step Sec
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={config.rampConfig.stepDurationSec}
                            onChange={(e) =>
                              update('rampConfig', {
                                ...config.rampConfig,
                                stepDurationSec: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {config.pattern === 'spike' && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Base Conn
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={config.spikeConfig.baselineConnections}
                            onChange={(e) =>
                              update('spikeConfig', {
                                ...config.spikeConfig,
                                baselineConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Spike Conn
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={config.spikeConfig.spikeConnections}
                            onChange={(e) =>
                              update('spikeConfig', {
                                ...config.spikeConfig,
                                spikeConnections: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Base (s)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={config.spikeConfig.baselineDurationSec}
                            onChange={(e) =>
                              update('spikeConfig', {
                                ...config.spikeConfig,
                                baselineDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Spike (s)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={config.spikeConfig.spikeDurationSec}
                            onChange={(e) =>
                              update('spikeConfig', {
                                ...config.spikeConfig,
                                spikeDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Recover (s)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={config.spikeConfig.recoveryDurationSec}
                            onChange={(e) =>
                              update('spikeConfig', {
                                ...config.spikeConfig,
                                recoveryDurationSec: Math.max(1, Math.min(60, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-full h-8 px-2.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Engine Flags Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Run Title (-T)
                      </label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => update('title', e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Pipelining (-p)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={config.pipelining}
                        onChange={(e) =>
                          update('pipelining', Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                        }
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Overall Rate (-R req/s)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50000}
                        value={config.overallRate ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('overallRate', v > 0 ? v : undefined);
                        }}
                        placeholder="Unlimited"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Conn Rate (-r req/s)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50000}
                        value={config.connectionRate ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('connectionRate', v > 0 ? v : undefined);
                        }}
                        placeholder="Unlimited"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Error Bailout (-B)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        value={config.bailout ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('bailout', v > 0 ? v : undefined);
                        }}
                        placeholder="Disabled"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Fixed Amount (-a reqs)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500000}
                        value={config.amount ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('amount', v > 0 ? v : undefined);
                        }}
                        placeholder="Use duration"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Timeout (-t sec)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={config.timeout}
                        onChange={(e) =>
                          update('timeout', Math.max(1, Math.min(60, Number(e.target.value) || 10)))
                        }
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Workers (-w threads)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={4}
                        value={config.workers}
                        onChange={(e) =>
                          update('workers', Math.max(0, Math.min(4, Number(e.target.value) || 0)))
                        }
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Expect Body (-E)
                      </label>
                      <input
                        type="text"
                        value={config.expectBody}
                        onChange={(e) => update('expectBody', e.target.value)}
                        placeholder='e.g. "ok":true'
                        className="w-full h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Max Conn Reqs (-M)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500000}
                        value={config.maxConnectionRequests ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('maxConnectionRequests', v > 0 ? v : undefined);
                        }}
                        placeholder="Unlimited"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Reconnect Rate (-D)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500000}
                        value={config.reconnectRate ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          update('reconnectRate', v > 0 ? v : undefined);
                        }}
                        placeholder="Keep-alive"
                        className="w-full h-9 px-3 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        TLS SNI (-s)
                      </label>
                      <input
                        type="text"
                        value={config.servername}
                        onChange={(e) => update('servername', e.target.value)}
                        placeholder="Hostname"
                        className="w-full h-9 px-3 text-xs font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Boolean Flags */}
                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!config.overallRate && !config.connectionRate}
                        checked={config.ignoreCoordinatedOmission}
                        onChange={(e) => update('ignoreCoordinatedOmission', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Ignore Coordinated Omission (-C)
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.excludeErrorStats}
                        onChange={(e) => update('excludeErrorStats', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Exclude Non-2xx Stats (-x)
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.warmupEnabled}
                        onChange={(e) => update('warmupEnabled', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      Warmup Phase (-W)
                    </label>
                  </div>

                  {/* HAR File Replay Section */}
                  <div className="pt-4 border-t border-slate-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            disabled={config.harRequests.length === 0}
                            checked={config.useHar}
                            onChange={(e) => update('useHar', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          HAR File Replay (--har)
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={ignoreStaticHar}
                            onChange={(e) => setIgnoreStaticHar(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          Filter images, CSS & fonts
                        </label>
                      </div>
                      {config.harRequests.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              useHar: false,
                              harFileName: undefined,
                              harRaw: undefined,
                              harRequests: [],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Clear HAR
                        </button>
                      )}
                    </div>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleHarFile(f);
                      }}
                      onClick={() => fileRef.current?.click()}
                      className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".har,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleHarFile(f);
                        }}
                      />
                      <FileUp className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <div className="text-xs font-medium text-slate-700">
                        {config.harFileName
                          ? `Loaded ${config.harFileName} (${config.harRequests.length} endpoints)`
                          : 'Drop Chrome DevTools .har recording or click to upload'}
                      </div>
                    </div>
                    {harError && <p className="text-xs text-rose-600">{harError}</p>}
                  </div>

                  {/* CORS Proxy Relay Setting for Edge Benchmarking */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        CORS Proxy / Relay (For External APIs)
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">Edge Device Mode</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      When benchmarking external APIs directly from your browser, target servers that lack CORS headers can be reached through an optional CORS proxy URL. Leave blank for direct access (e.g. localhost or CORS-enabled APIs).
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. https://corsproxy.io/? or custom proxy"
                      value={config.corsProxyUrl || ''}
                      onChange={(e) => update('corsProxyUrl', e.target.value)}
                      className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live CLI Command Preview Strip */}
            <div className="px-6 py-3 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">
                  CLI Equivalent
                </span>
                <code className="text-xs font-mono text-slate-800 truncate select-all">
                  {cliCommand}
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopyCli}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {copiedCli ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedCli ? 'Copied' : 'Copy CLI'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
