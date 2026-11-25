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
  };
}

export function getBuiltInPresets(origin = ''): EnvironmentPreset[] {
  const host = origin || 'http://localhost:3000';
  const base = createDefaultBenchmarkConfig(origin);

  return [
    {
      id: 'preset-sandbox-fast',
      name: 'Sandbox Echo — Fast Baseline',
      description: 'Low-latency 15ms response baseline to verify throughput and p99 stability.',
      category: 'Baseline',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Sandbox Echo — Fast Baseline',
        url: `${host}/api/sandbox/target?delay=15&jitter=10`,
        connections: 30,
        duration: 10,
      },
    },
    {
      id: 'preset-sandbox-ratelimit',
      name: 'Rate Limiter & Tail Latency Probe',
      description: 'Simulates 429 throttling above 120 req/s plus jittery database queries.',
      category: 'Reliability',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Rate Limiter & Tail Latency Probe',
        url: `${host}/api/sandbox/target?delay=45&jitter=90&rateLimitRps=120`,
        connections: 40,
        duration: 12,
        bailout: 250,
      },
    },
    {
      id: 'preset-sandbox-post',
      name: 'JSON Write + Dynamic ID Injection',
      description: 'Tests POST payload throughput using [<id>] replacement and {{$uuid}} tokens.',
      category: 'Payloads',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'JSON Write + Dynamic ID Injection',
        url: `${host}/api/sandbox/target?delay=20&jitter=15`,
        method: 'POST',
        connections: 25,
        duration: 10,
        idReplacement: true,
        bodyMode: 'raw',
        body: '{\n  "sessionId": "[<id>]",\n  "eventId": "{{$uuid}}",\n  "createdAt": "{{$timestamp}}",\n  "score": {{$random_int}}\n}',
        expectBody: '"ok":true',
      },
    },
    {
      id: 'preset-sandbox-ramp',
      name: 'Step Ramp-Up Saturation Test',
      description: 'Steps concurrency from 10 to 120 connections to expose breaking points.',
      category: 'Stress Pattern',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Step Ramp-Up Saturation Test',
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
      id: 'preset-sandbox-rate',
      name: 'Fixed-Rate Paced Benchmark (150 RPS)',
      description: 'Enforces 150 req/s overallRate with Coordinated Omission correction enabled.',
      category: 'Rate-Paced',
      isBuiltIn: true,
      config: {
        ...base,
        title: 'Fixed-Rate Paced Benchmark',
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
