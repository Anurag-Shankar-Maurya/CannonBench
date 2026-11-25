export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export type LoadPattern = 'constant' | 'ramp' | 'spike' | 'soak' | 'rate';

export type BodyMode = 'none' | 'raw' | 'form';

export interface HeaderEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormFieldEntry {
  id: string;
  name: string;
  value: string;
}

export interface HarRequestEntry {
  method: string;
  url: string;
  origin: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

export interface RampConfig {
  startConnections: number;
  endConnections: number;
  steps: number;
  stepDurationSec: number;
}

export interface SpikeConfig {
  baselineConnections: number;
  spikeConnections: number;
  baselineDurationSec: number;
  spikeDurationSec: number;
  recoveryDurationSec: number;
}

export interface BenchmarkConfig {
  title: string;
  url: string;
  method: HttpMethod;
  pattern: LoadPattern;
  connections: number;
  duration: number;
  amount?: number;
  pipelining: number;
  workers: number;
  timeout: number;
  sampleInt: number;
  overallRate?: number;
  connectionRate?: number;
  ignoreCoordinatedOmission: boolean;
  bailout?: number;
  maxConnectionRequests?: number;
  maxOverallRequests?: number;
  reconnectRate?: number;
  excludeErrorStats: boolean;
  idReplacement: boolean;
  expectBody: string;
  servername: string;
  warmupEnabled: boolean;
  warmupConnections: number;
  warmupDuration: number;
  headers: HeaderEntry[];
  bodyMode: BodyMode;
  body: string;
  contentType: string;
  formFields: FormFieldEntry[];
  useHar: boolean;
  harFileName?: string;
  harRaw?: Record<string, unknown>;
  harRequests: HarRequestEntry[];
  rampConfig: RampConfig;
  spikeConfig: SpikeConfig;
  sloTargetLatencyMs: number;
  sloMaxErrorPct: number;
}

export interface TickSample {
  elapsedSec: number;
  timestamp: number;
  stageLabel: string;
  connections: number;
  rps: number;
  bytesPerSec: number;
  avgLatency: number;
  p50: number;
  p90: number;
  p99: number;
  count2xx: number;
  count3xx: number;
  count4xx: number;
  count5xx: number;
  errors: number;
  timeouts: number;
  mismatches: number;
}

export interface LatencySummary {
  min: number;
  max: number;
  average: number;
  mean: number;
  stddev: number;
  p0_001?: number;
  p0_01?: number;
  p0_1?: number;
  p1: number;
  p2_5: number;
  p10?: number;
  p25?: number;
  p50: number;
  p75: number;
  p90: number;
  p97_5: number;
  p99: number;
  p99_9: number;
  p99_99?: number;
  totalCount: number;
}

export interface RateSummary {
  min: number;
  max: number;
  average: number;
  mean: number;
  stddev: number;
  p1?: number;
  p2_5?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p97_5?: number;
  p99?: number;
  total: number;
  sent?: number;
}

export interface AutocannonResultSummary {
  title?: string;
  url: string;
  connections: number;
  pipelining: number;
  workers: number;
  duration: number;
  samples: number;
  start: string;
  finish: string;
  errors: number;
  timeouts: number;
  mismatches: number;
  non2xx: number;
  resets: number;
  '1xx': number;
  '2xx': number;
  '3xx': number;
  '4xx': number;
  '5xx': number;
  statusCodeStats: Record<string, { count: number }>;
  latency: LatencySummary;
  requests: RateSummary;
  throughput: RateSummary;
  stages?: Array<{
    label: string;
    connections: number;
    duration: number;
    avgRps: number;
    p99Latency: number;
    errors: number;
    non2xx: number;
  }>;
}

export interface DiagnosticFinding {
  id: string;
  severity: 'healthy' | 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  metric: string;
}

export interface BenchmarkRunRecord {
  id: string;
  title: string;
  createdAt: string;
  status: 'completed' | 'aborted' | 'bailed_out';
  config: BenchmarkConfig;
  ticks: TickSample[];
  result: AutocannonResultSummary;
  apdexScore: number;
  diagnostics: DiagnosticFinding[];
  cliCommand: string;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn: boolean;
  config: BenchmarkConfig;
}

export interface RunComparisonMetrics {
  rpsDelta: number;
  rpsDeltaPct: number;
  p50DeltaMs: number;
  p50DeltaPct: number;
  p90DeltaMs: number;
  p90DeltaPct: number;
  p99DeltaMs: number;
  p99DeltaPct: number;
  throughputDeltaBytes: number;
  throughputDeltaPct: number;
  errorRateA: number;
  errorRateB: number;
  errorRateDeltaPct: number;
  apdexDelta: number;
}
