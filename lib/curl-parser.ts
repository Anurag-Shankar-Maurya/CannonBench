import type { HttpMethod } from '@/types/benchmark';

export interface ParsedCurlResult {
  url: string;
  method: HttpMethod;
  headers: Array<{ id: string; key: string; value: string; enabled: boolean }>;
  body: string;
  bodyMode: 'none' | 'raw' | 'form';
  contentType: string;
  summary: string;
}

/**
 * Checks if a string looks like a cURL command.
 */
export function isCurlCommand(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  return (
    trimmed.startsWith('curl ') ||
    trimmed.startsWith('curl\n') ||
    trimmed.startsWith('curl\r\n') ||
    trimmed.startsWith('curl\t') ||
    /^curl\s+['"]?https?:\/\//i.test(trimmed) ||
    /^curl\s+-[a-zA-Z]/i.test(trimmed) ||
    /^curl\s+--/i.test(trimmed)
  );
}

/**
 * Tokenizes a command line string respecting single quotes, double quotes,
 * escaped characters, and multi-line continuations (\, `, ^).
 */
export function tokenizeCommandLine(cmd: string): string[] {
  // Normalize line continuations from Bash (\), PowerShell (`), and Windows CMD (^)
  const sanitized = cmd
    .replace(/\\[\r\n]+/g, ' ')
    .replace(/`[\r\n]+/g, ' ')
    .replace(/\^[\r\n]+/g, ' ')
    .trim();

  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Formats, cleans and normalizes a URL:
 * - Unescapes shell copy-paste artifacts like \? or \& or \=
 * - Fixes multiple question marks (e.g. ?a=1?b=2 -> ?a=1&b=2)
 * - Cleans consecutive ampersands (e.g. && -> &)
 * - Removes trailing question mark or ampersand
 * - Normalizes duplicate slashes in path (e.g. //api///blog/ -> /api/blog/)
 * - Preserves critical trailing slash (e.g. Django REST framework /api/blog/)
 * - Ensures valid http:// or https:// protocol
 */
export function normalizeAndFormatUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  let cleaned = rawUrl.trim();

  // Strip wrapping quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  // Strip trailing question marks and ampersands
  cleaned = cleaned.replace(/[?&]+$/, '');

  // Unescape backslash escapes from shell copy-pastes: \?, \&, \=, \/
  cleaned = cleaned.replace(/\\([?&=/])/g, '$1');

  // If no protocol is provided, default to https:// (or http:// if localhost)
  if (!/^https?:\/\//i.test(cleaned)) {
    if (cleaned.startsWith('localhost') || cleaned.startsWith('127.0.0.1')) {
      cleaned = `http://${cleaned}`;
    } else {
      cleaned = `https://${cleaned}`;
    }
  }

  try {
    const parsed = new URL(cleaned);

    // Normalize duplicate slashes in pathname without touching protocol
    // e.g. /api//blog/// -> /api/blog/
    const hasTrailingSlash = parsed.pathname.endsWith('/');
    const cleanedPathSegments = parsed.pathname
      .split('/')
      .filter((seg) => seg.length > 0);

    let normalizedPath = '/' + cleanedPathSegments.join('/');
    if (hasTrailingSlash && normalizedPath !== '/') {
      normalizedPath += '/';
    }

    // Clean query parameters:
    // Handle cases where multiple '?' were used instead of '&'
    let rawSearch = parsed.search;
    if (rawSearch) {
      if (rawSearch.startsWith('?')) {
        rawSearch = rawSearch.slice(1);
      }
      // Replace accidental extra question marks with ampersand
      rawSearch = rawSearch.replace(/\?/g, '&');
      // Replace multiple consecutive ampersands with single ampersand
      rawSearch = rawSearch.replace(/&+/g, '&');
      // Trim leading/trailing ampersands
      rawSearch = rawSearch.replace(/^&+|&+$/g, '');

      if (rawSearch.length > 0) {
        parsed.search = '?' + rawSearch;
      } else {
        parsed.search = '';
      }
    }

    parsed.pathname = normalizedPath;
    return parsed.href;
  } catch {
    // Fallback regex cleaning if URL constructor fails
    let fallback = cleaned;
    // Replace duplicate slashes after protocol
    fallback = fallback.replace(/([^:])\/{2,}/g, '$1/');
    // Clean multiple ? or trailing ? / &
    const firstQ = fallback.indexOf('?');
    if (firstQ !== -1) {
      const base = fallback.slice(0, firstQ);
      let query = fallback.slice(firstQ + 1);
      query = query.replace(/\?/g, '&').replace(/&+/g, '&').replace(/^&+|&+$/g, '');
      return query ? `${base}?${query}` : base;
    }
    return fallback;
  }
}

/**
 * Parses a raw cURL command into CannonBench configuration options.
 */
export function parseCurlCommand(curlText: string): ParsedCurlResult | null {
  if (!isCurlCommand(curlText)) return null;

  const tokens = tokenizeCommandLine(curlText);
  if (tokens.length === 0 || tokens[0] !== 'curl') return null;

  let rawUrl = '';
  let method: HttpMethod = 'GET';
  let explicitMethod = false;
  const headers: Array<{ id: string; key: string; value: string; enabled: boolean }> = [];
  let body = '';
  let contentType = 'application/json';
  let isJsonBody = false;

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Method flags: -X POST, --request POST
    if (token === '-X' || token === '--request') {
      const next = tokens[++i];
      if (next) {
        const upper = next.toUpperCase();
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(upper)) {
          method = upper as HttpMethod;
          explicitMethod = true;
        }
      }
      continue;
    }

    // HEAD shorthand: -I, --head
    if (token === '-I' || token === '--head') {
      method = 'HEAD';
      explicitMethod = true;
      continue;
    }

    // Headers: -H "Accept: application/json", --header "Auth: Bearer ..."
    if (token === '-H' || token === '--header') {
      const headerStr = tokens[++i];
      if (headerStr) {
        let key = '';
        let val = '';
        const colonIdx = headerStr.indexOf(':');
        const eqIdx = headerStr.indexOf('=');

        if (colonIdx !== -1) {
          key = headerStr.slice(0, colonIdx).trim();
          val = headerStr.slice(colonIdx + 1).trim();
        } else if (eqIdx !== -1) {
          key = headerStr.slice(0, eqIdx).trim();
          val = headerStr.slice(eqIdx + 1).trim();
        } else {
          key = headerStr.trim();
          val = '';
        }

        if (key) {
          const lowerKey = key.toLowerCase();
          // Filter out hop-by-hop & pseudo headers
          if (
            !lowerKey.startsWith(':') &&
            lowerKey !== 'content-length' &&
            lowerKey !== 'connection' &&
            lowerKey !== 'host'
          ) {
            headers.push({
              id: `h-curl-${Date.now()}-${headers.length}`,
              key,
              value: val,
              enabled: true,
            });

            if (lowerKey === 'content-type') {
              contentType = val;
              if (val.toLowerCase().includes('application/json')) {
                isJsonBody = true;
              }
            }
          }
        }
      }
      continue;
    }

    // Data / Body flags: -d, --data, --data-raw, --data-binary, --data-ascii, --data-urlencode
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii' ||
      token === '--data-urlencode'
    ) {
      const dataVal = tokens[++i];
      if (dataVal !== undefined) {
        body = dataVal;
        if (!explicitMethod) {
          method = 'POST';
        }
      }
      continue;
    }

    // curl --json '{"key": "value"}' shorthand
    if (token === '--json') {
      const jsonVal = tokens[++i];
      if (jsonVal !== undefined) {
        body = jsonVal;
        isJsonBody = true;
        if (!explicitMethod) {
          method = 'POST';
        }
        // Ensure Content-Type & Accept are present
        if (!headers.some((h) => h.key.toLowerCase() === 'content-type')) {
          headers.push({
            id: `h-curl-${Date.now()}-ct`,
            key: 'Content-Type',
            value: 'application/json',
            enabled: true,
          });
        }
        if (!headers.some((h) => h.key.toLowerCase() === 'accept')) {
          headers.push({
            id: `h-curl-${Date.now()}-acc`,
            key: 'Accept',
            value: 'application/json',
            enabled: true,
          });
        }
      }
      continue;
    }

    // URL token (non-flag token starting with http or domain, or plain argument)
    if (!token.startsWith('-')) {
      if (!rawUrl) {
        rawUrl = token;
      }
    }
  }

  if (!rawUrl) {
    return null;
  }

  // Normalize the extracted URL
  const normalizedUrl = normalizeAndFormatUrl(rawUrl);

  // Format body if JSON
  let formattedBody = body;
  if (body.trim()) {
    try {
      const parsedJson = JSON.parse(body);
      formattedBody = JSON.stringify(parsedJson, null, 2);
      isJsonBody = true;
    } catch {
      // Keep raw body if not valid JSON
    }
  }

  const bodyMode: 'none' | 'raw' = formattedBody.trim() ? 'raw' : 'none';

  // Build summary message
  const parts: string[] = [method];
  if (headers.length > 0) {
    parts.push(`${headers.length} header${headers.length === 1 ? '' : 's'}`);
  }
  if (bodyMode === 'raw') {
    parts.push(isJsonBody ? 'JSON body' : 'body');
  }

  return {
    url: normalizedUrl,
    method,
    headers,
    body: formattedBody,
    bodyMode,
    contentType,
    summary: `Imported cURL (${parts.join(' • ')})`,
  };
}
