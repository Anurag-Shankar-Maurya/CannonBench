import type {
  BenchmarkConfig,
  BenchmarkRunRecord,
  EnvironmentPreset,
} from '@/types/benchmark';

const RUNS_STORAGE_KEY = 'cannonbench_runs_v1';
const PRESETS_STORAGE_KEY = 'cannonbench_presets_v1';
const MAX_STORED_RUNS = 40;

export function createDefaultBenchmarkConfig(origin = ''): BenchmarkConfig {
  const baseUrl = origin
    ? `${origin}/api/sandbox/target?delay=15&jitter=10`
    : 'http://localhost:3000/api/sandbox/target?delay=15&jitter=10';

  return {
    title: 'Sandbox API Baseline',
    url: baseUrl,
    method: 'GET',
    pattern: 'constant',
    connections: 25,
    duration: 10,
    amount: undefined,
    pipelining: 1,
    workers: 0,
    timeout: 10,
    sampleInt: 1000,
    overallRate: undefined,
    connectionRate: undefined,
    ignoreCoordinatedOmission: false,
    bailout: undefined,
    maxConnectionRequests: undefined,
    maxOverallRequests: undefined,
    reconnectRate: undefined,
    excludeErrorStats: false,
    idReplacement: false,
    expectBody: '',
    servername: '',
    warmupEnabled: false,
    warmupConnections: 5,
    warmupDuration: 2,
    headers: [
      { id: 'h-accept', key: 'Accept', value: 'application/json', enabled: true },
    ],
    bodyMode: 'none',
    body: '{\n  "userId": "[<id>]",\n  "timestamp": "{{$timestamp}}",\n  "traceId": "{{$uuid}}"\n}',
    contentType: 'application/json',
    formFields: [],
    useHar: false,
    harFileName: undefined,
    harRaw: undefined,
    harRequests: [],
    rampConfig: {
      startConnections: 10,
      endConnections: 100,
      steps: 4,
      stepDurationSec: 4,
    },
    spikeConfig: {
      baselineConnections: 10,
      spikeConnections: 120,
      baselineDurationSec: 4,
      spikeDurationSec: 5,
      recoveryDurationSec: 4,
    },
    sloTargetLatencyMs: 150,
    sloMaxErrorPct: 1,
    sloMinRps: 50,
    sloMaxP99Ms: 250,
    corsProxyUrl: '',
    enableChaining: false,
    chainedSteps: [],
    engineMode: 'native',
  };
}

/**
 * Resets all request options (headers, body, chaining, HAR, pipelining, engine modifiers)
 * back to clean defaults while keeping the current target URL, concurrency, duration, and engine mode intact.
 */
export function resetRequestOptionsToDefault(config: BenchmarkConfig): BenchmarkConfig {
  return {
    ...config,
    method: 'GET',
    headers: [
      { id: 'h-accept', key: 'Accept', value: 'application/json', enabled: true },
    ],
    bodyMode: 'none',
    body: '',
    contentType: 'application/json',
    formFields: [],
    useHar: false,
    harFileName: undefined,
    harRaw: undefined,
    harRequests: [],
    enableChaining: false,
    chainedSteps: [],
    pipelining: 1,
    workers: 0,
    pattern: 'constant',
    overallRate: undefined,
    connectionRate: undefined,
    timeout: 10,
    sampleInt: 1000,
    ignoreCoordinatedOmission: false,
    bailout: undefined,
    maxConnectionRequests: undefined,
    maxOverallRequests: undefined,
    reconnectRate: undefined,
    excludeErrorStats: false,
    idReplacement: false,
    expectBody: '',
    servername: '',
    warmupEnabled: false,
    corsProxyUrl: '',
    sloTargetLatencyMs: 150,
    sloMaxErrorPct: 1,
    sloMinRps: 50,
    sloMaxP99Ms: 250,
  };
}

export function getBuiltInPresets(origin = ''): EnvironmentPreset[] {
  const host = origin || 'http://localhost:3000';
  const base = createDefaultBenchmarkConfig(origin);

  return [
    {
      id: 'preset-json-api',
      name: 'Test JSON API',
      description: 'POST JSON payload with [<id>] replacement, {{$uuid}} injection, and response body assertion.',
      category: 'Baseline',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Test JSON API',
        url: `${host}/api/sandbox/target?delay=18&jitter=12`,
        method: 'POST',
        connections: 25,
        duration: 10,
        idReplacement: true,
        bodyMode: 'raw',
        body: '{\n  "sessionId": "[<id>]",\n  "eventId": "{{$uuid}}",\n  "timestamp": "{{$timestamp}}",\n  "score": {{$random_int}}\n}',
        expectBody: '"ok":true',
      },
    },
    {
      id: 'preset-high-concurrency',
      name: 'High Concurrency Stress Test',
      description: 'Saturates the endpoint with 100 concurrent connections and 2x pipelining to test tail latency.',
      category: 'Stress',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'High Concurrency Stress Test',
        url: `${host}/api/sandbox/target?delay=25&jitter=35&failRate=0.01`,
        method: 'GET',
        pattern: 'constant',
        connections: 100,
        duration: 10,
        pipelining: 2,
      },
    },
    {
      id: 'preset-rate-limit',
      name: 'Rate Limit Validation',
      description: 'Drives high-rate traffic against a 120 req/s limiter to validate HTTP 429 throttling.',
      category: 'Reliability',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Rate Limit Validation',
        url: `${host}/api/sandbox/target?delay=20&jitter=25&rateLimitRps=120`,
        method: 'GET',
        connections: 50,
        duration: 10,
        bailout: 500,
      },
    },
    {
      id: 'preset-ramp-saturation',
      name: 'Step Ramp-Up Saturation Probe',
      description: 'Gradually steps connections from 10 to 120 to locate the exact breaking point.',
      category: 'Pattern',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Step Ramp-Up Saturation Probe',
        url: `${host}/api/sandbox/target?delay=25&jitter=35&failRate=0.02`,
        pattern: 'ramp',
        rampConfig: {
          startConnections: 10,
          endConnections: 120,
          steps: 4,
          stepDurationSec: 4,
        },
      },
    },
    {
      id: 'preset-fixed-rate',
      name: 'Fixed-Rate Paced (150 RPS)',
      description: 'Enforces 150 req/s overallRate with Coordinated Omission correction enabled.',
      category: 'Rate-Paced',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Fixed-Rate Paced (150 RPS)',
        url: `${host}/api/sandbox/target?delay=30&jitter=25`,
        pattern: 'rate',
        connections: 25,
        duration: 10,
        overallRate: 150,
        ignoreCoordinatedOmission: false,
      },
    },
  ];
}

export function loadStoredRuns(): BenchmarkRunRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RUNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredRuns(runs: BenchmarkRunRecord[]): void {
  if (typeof window === 'undefined') return;
  const trimmed = runs.slice(0, MAX_STORED_RUNS);
  try {
    window.localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // If quota is exceeded, drop older runs and retry once
    try {
      window.localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(trimmed.slice(0, 12)));
    } catch {
      // Ignore storage failure cleanly
    }
  }
}

export function loadCustomPresets(): EnvironmentPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: EnvironmentPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PRESETS_STORAGE_KEY,
      JSON.stringify(presets.filter((p) => !p.isBuiltIn))
    );
  } catch {
    // Ignore storage failure cleanly
  }
}

export function exportAllUserDataJson(): string {
  const runs = loadStoredRuns();
  const presets = loadCustomPresets();
  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    runs,
    presets,
  };
  return JSON.stringify(bundle, null, 2);
}

export function importUserDataJson(jsonStr: string): { runsImported: number; presetsImported: number } {
  const parsed = JSON.parse(jsonStr);
  let runsImported = 0;
  let presetsImported = 0;

  if (Array.isArray(parsed.runs)) {
    const existing = loadStoredRuns();
    const existingIds = new Set(existing.map((r) => r.id));
    const merged = [...parsed.runs.filter((r: BenchmarkRunRecord) => !existingIds.has(r.id)), ...existing];
    saveStoredRuns(merged);
    runsImported = parsed.runs.length;
  }

  if (Array.isArray(parsed.presets)) {
    const existingPresets = loadCustomPresets();
    const existingPresetIds = new Set(existingPresets.map((p) => p.id));
    const mergedPresets = [
      ...parsed.presets.filter((p: EnvironmentPreset) => !existingPresetIds.has(p.id)),
      ...existingPresets,
    ];
    saveCustomPresets(mergedPresets);
    presetsImported = parsed.presets.length;
  }

  return { runsImported, presetsImported };
}
