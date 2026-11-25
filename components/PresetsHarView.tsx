'use client';

import React, { useRef, useState } from 'react';
import { ArrowRight, FileUp, Plus, Trash2 } from 'lucide-react';
import type { BenchmarkConfig, EnvironmentPreset } from '@/types/benchmark';
import { parseHarFileJson } from '@/lib/autocannon-cli';

interface PresetsHarViewProps {
  presets: EnvironmentPreset[];
  currentConfig: BenchmarkConfig;
  onLoadPreset: (config: BenchmarkConfig) => void;
  onSavePreset: (name: string, description: string, config: BenchmarkConfig) => void;
  onDeletePreset: (id: string) => void;
  onNotify: (msg: string) => void;
}

export default function PresetsHarView({
  presets,
  currentConfig,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  onNotify,
}: PresetsHarViewProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [harError, setHarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSavePreset(name.trim(), description.trim() || 'Custom saved load profile.', currentConfig);
    setName('');
    setDescription('');
  };

  const handleImportHar = async (file: File) => {
    setHarError(null);
    try {
      const text = await file.text();
      const parsed = parseHarFileJson(text, true);
      onLoadPreset({
        ...currentConfig,
        title: `HAR Replay — ${file.name}`,
        useHar: true,
        harFileName: file.name,
        harRaw: parsed.sanitizedHar,
        harRequests: parsed.requests,
        url: parsed.requests[0]?.url || currentConfig.url,
      });
      onNotify(`Loaded ${parsed.requests.length} requests from ${file.name} into Runner`);
    } catch (err) {
      setHarError(err instanceof Error ? err.message : 'Unable to parse HAR file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Current Configuration + HAR Quick Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Save Current Runner Config as Preset
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Persisted locally in your browser for instant reuse.
            </p>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Preset name (e.g. Staging Auth API Stress)"
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what this scenario tests..."
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 font-mono truncate max-w-[260px]">
              {currentConfig.method} {currentConfig.url}
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Preset
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              HAR Real-User Session Importer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Export Network logs as .har from Chrome DevTools and replay multi-endpoint flows
              directly with Autocannon.
            </p>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-slate-300 rounded-md p-4 text-center bg-slate-50/70 hover:bg-slate-50 cursor-pointer"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".har,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportHar(file);
              }}
            />
            <FileUp className="w-5 h-5 mx-auto text-slate-500 mb-1" />
            <div className="text-xs font-medium text-slate-800">
              Select .har File to Load into Runner
            </div>
          </div>
          {harError && <p className="text-xs text-red-600">{harError}</p>}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Environment Presets</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {presets.length} available
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{preset.name}</span>
                  <span className="text-xs text-slate-500">· {preset.category}</span>
                  {preset.isBuiltIn ? (
                    <span className="text-xs text-slate-400">· Built-in</span>
                  ) : (
                    <span className="text-xs text-blue-600">· Custom</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{preset.description}</p>
                <div className="text-xs font-mono text-slate-500 truncate">
                  {preset.config.method} {preset.config.url} · {preset.config.pattern} ·{' '}
                  {preset.config.connections}c / {preset.config.duration}s
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!preset.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    aria-label="Delete preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onLoadPreset(structuredClone(preset.config))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  Open in Runner
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
