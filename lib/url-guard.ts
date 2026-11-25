import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (net.isIPv4(clean)) {
    return isPrivateOrReservedIpv4(clean);
  }
  if (net.isIPv6(clean)) {
    if (clean === '::1' || clean === '::') return true;
    if (clean.startsWith('::ffff:')) {
      return isPrivateOrReservedIpv4(clean.slice(7));
    }
    if (clean.startsWith('fc') || clean.startsWith('fd')) return true; // Unique local
    if (clean.startsWith('fe80')) return true; // Link-local
    return false;
  }
  return true;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
  'metadata',
  '169.254.169.254',
]);

export interface GuardedTargetResult {
  executionUrl: string;
  displayUrl: string;
  isSandbox: boolean;
}

export async function validateBenchmarkTargetUrl(
  rawUrl: string,
  requestHostHeader?: string | null
): Promise<GuardedTargetResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid target URL. Please include http:// or https://.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are supported.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const requestHostOnly = (requestHostHeader || '').split(':')[0].toLowerCase();
  const localPort = process.env.PORT || '3000';

  // Permit the built-in safe sandbox endpoint via loopback routing
  const isLocalHostMatch =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    (requestHostOnly !== '' && hostname === requestHostOnly);

  if (isLocalHostMatch && parsed.pathname === '/api/sandbox/target') {
    // Locally / on containers, route straight to localhost; on Vercel serverless,
    // route through the deployment's public HTTPS URL if not localhost.
    const useLoopback =
      !process.env.VERCEL || hostname === 'localhost' || hostname === '127.0.0.1';
    if (useLoopback) {
      return {
        executionUrl: `http://127.0.0.1:${localPort}/api/sandbox/target${parsed.search}`,
        displayUrl: parsed.href,
        isSandbox: true,
      };
    }
    return {
      executionUrl: parsed.href,
      displayUrl: parsed.href,
      isSandbox: true,
    };
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error(
      'Private, loopback, and metadata hostnames are blocked. Use a public URL or the built-in Sandbox Target.'
    );
  }

  if (net.isIP(hostname.replace(/^\[|\]$/g, ''))) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error(
        'Private and loopback IP addresses are blocked. Use a public endpoint or the built-in Sandbox Target.'
      );
    }
    return {
      executionUrl: parsed.href,
      displayUrl: parsed.href,
      isSandbox: false,
    };
  }

  // Resolve DNS and verify target does not resolve to private/loopback ranges
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length || records.some((r) => isPrivateOrReservedIp(r.address))) {
      throw new Error(
        'Target hostname resolved to a private or restricted IP address.'
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('private or restricted')) {
      throw err;
    }
    throw new Error(`Could not resolve target hostname "${hostname}".`);
  }

  return {
    executionUrl: parsed.href,
    displayUrl: parsed.href,
    isSandbox: false,
  };
}
