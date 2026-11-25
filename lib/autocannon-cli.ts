import type { BenchmarkConfig, HarRequestEntry } from '@/types/benchmark';

function shellQuote(val: string): string {
  if (/^[a-zA-Z0-9_./:@=?&%-]+$/.test(val)) {
    return val;
  }
  return `'${val.replace(/'/g, `'\\''`)}'`;
}

export function resolveDynamicVariables(input: string): string {
  if (!input) return input;
  return input
    .replace(/\{\{\$timestamp\}\}/g, () => String(Date.now()))
    .replace(/\{\{\$uuid\}\}/g, () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    )
    .replace(/\{\{\$random_int\}\}/g, () => String(Math.floor(Math.random() * 100000)));
}

export function buildAutocannonCliCommand(config: BenchmarkConfig): string {
  const parts: string[] = ['npx autocannon'];

  const connections =
    config.pattern === 'ramp'
      ? config.rampConfig.endConnections
      : config.pattern === 'spike'
        ? config.spikeConfig.spikeConnections
        : config.connections;

  const duration =
    config.pattern === 'ramp'
      ? config.rampConfig.steps * config.rampConfig.stepDurationSec
      : config.pattern === 'spike'
        ? config.spikeConfig.baselineDurationSec +
          config.spikeConfig.spikeDurationSec +
          config.spikeConfig.recoveryDurationSec
        : config.duration;

  parts.push(`-c ${connections}`);

  if (config.amount && config.amount > 0) {
    parts.push(`-a ${config.amount}`);
  } else {
    parts.push(`-d ${duration}`);
  }

  if (config.pipelining > 1) {
    parts.push(`-p ${config.pipelining}`);
  }

  if (config.workers > 0) {
    parts.push(`-w ${config.workers}`);
  }

  if (config.timeout !== 10) {
    parts.push(`-t ${config.timeout}`);
  }

  if (config.sampleInt !== 1000) {
    parts.push(`-L ${config.sampleInt}`);
  }

  if (config.method !== 'GET' && !config.useHar) {
    parts.push(`-m ${config.method}`);
  }

  if (config.title.trim()) {
    parts.push(`-T ${shellQuote(config.title.trim())}`);
  }

  if (config.overallRate && config.overallRate > 0) {
    parts.push(`-R ${config.overallRate}`);
  }

  if (config.connectionRate && config.connectionRate > 0) {
    parts.push(`-r ${config.connectionRate}`);
  }

  if (config.ignoreCoordinatedOmission && (config.overallRate || config.connectionRate)) {
    parts.push('-C');
  }

  if (config.bailout && config.bailout > 0) {
    parts.push(`-B ${config.bailout}`);
  }

  if (config.maxConnectionRequests && config.maxConnectionRequests > 0) {
    parts.push(`-M ${config.maxConnectionRequests}`);
  }

  if (config.maxOverallRequests && config.maxOverallRequests > 0) {
    parts.push(`-O ${config.maxOverallRequests}`);
  }

  if (config.reconnectRate && config.reconnectRate > 0) {
    parts.push(`-D ${config.reconnectRate}`);
  }

  if (config.idReplacement) {
    parts.push('-I');
  }

  if (config.excludeErrorStats) {
    parts.push('-x');
  }

  if (config.expectBody.trim() && !config.useHar) {
    parts.push(`-E ${shellQuote(config.expectBody.trim())}`);
  }

  if (config.servername.trim()) {
    parts.push(`-s ${shellQuote(config.servername.trim())}`);
  }

  if (config.warmupEnabled) {
    parts.push(`-W [ -c ${config.warmupConnections} -d ${config.warmupDuration} ]`);
  }

  const activeHeaders = config.headers.filter((h) => h.enabled && h.key.trim());
  for (const h of activeHeaders) {
    parts.push(`-H ${shellQuote(`${h.key.trim()}=${h.value}`)}`);
  }

  if (!config.useHar && config.bodyMode === 'raw' && config.body.trim()) {
    const hasCt = activeHeaders.some((h) => h.key.toLowerCase() === 'content-type');
    if (!hasCt && config.contentType) {
      parts.push(`-H ${shellQuote(`Content-Type=${config.contentType}`)}`);
    }
    parts.push(`-b ${shellQuote(config.body.trim())}`);
  } else if (!config.useHar && config.bodyMode === 'form' && config.formFields.length > 0) {
    const formObj: Record<string, { type: 'text'; value: string }> = {};
    for (const f of config.formFields) {
      if (f.name.trim()) {
        formObj[f.name.trim()] = { type: 'text', value: f.value };
      }
    }
    parts.push(`-F ${shellQuote(JSON.stringify(formObj))}`);
  }

  if (config.useHar && config.harFileName) {
    parts.push(`--har ${shellQuote(config.harFileName)}`);
  }

  parts.push('-l');
  parts.push('--renderStatusCodes');

  const targetUrl = config.url.trim() || 'http://localhost:3000/api/sandbox/target';
  parts.push(shellQuote(targetUrl));

  return parts.join(' ');
}

export interface ParsedHarResult {
  requests: HarRequestEntry[];
  origins: string[];
  sanitizedHar: Record<string, unknown>;
}

const SKIP_STATIC_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|css|map)(\?|$)/i;

export function parseHarFileJson(
  rawText: string,
  ignoreStaticAssets = true
): ParsedHarResult {
  const parsed = JSON.parse(rawText) as {
    log?: {
      version?: string;
      creator?: unknown;
      entries?: Array<{
        request?: {
          method?: string;
          url?: string;
          headers?: Array<{ name: string; value: string }>;
          postData?: { text?: string; mimeType?: string };
        };
      }>;
    };
  };

  if (!parsed?.log || !Array.isArray(parsed.log.entries)) {
    throw new Error('Invalid HAR file: missing log.entries array.');
  }

  const requests: HarRequestEntry[] = [];
  const filteredEntries: typeof parsed.log.entries = [];
  const originSet = new Set<string>();

  for (const entry of parsed.log.entries) {
    const req = entry.request;
    if (!req?.url || !req?.method) continue;
    if (ignoreStaticAssets && SKIP_STATIC_EXTENSIONS.test(req.url)) continue;

    try {
      const u = new URL(req.url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;

      const headerMap: Record<string, string> = {};
      for (const h of req.headers ?? []) {
        const lower = h.name.toLowerCase();
        // Skip pseudo-headers and hop-by-hop headers
        if (
          lower.startsWith(':') ||
          lower === 'host' ||
          lower === 'content-length' ||
          lower === 'connection'
        ) {
          continue;
        }
        headerMap[h.name] = h.value;
      }

      originSet.add(u.origin);
      requests.push({
        method: req.method.toUpperCase(),
        url: u.href,
        origin: u.origin,
        path: `${u.pathname}${u.search}`,
        headers: headerMap,
        body: req.postData?.text,
      });
      filteredEntries.push(entry);
    } catch {
      // Ignore malformed URLs in HAR
    }
  }

  if (requests.length === 0) {
    throw new Error('No replayable HTTP/HTTPS requests found in this HAR archive.');
  }

  return {
    requests: requests.slice(0, 200),
    origins: Array.from(originSet),
    sanitizedHar: {
      log: {
        version: parsed.log.version ?? '1.2',
        creator: parsed.log.creator ?? { name: 'CannonBench HAR Importer', version: '1.0' },
        entries: filteredEntries.slice(0, 200),
      },
    },
  };
}
