/**
 * Resolves dynamic tokens like {{$uuid}}, {{$timestamp}}, {{$random_int}}, [<id>],
 * and user-extracted variables from chained steps (e.g. {{authToken}}).
 */
export function resolveVariables(
  template: string,
  customVars: Record<string, string> = {},
  iterationId = 0
): string {
  if (!template) return '';

  let out = template;

  // 1. [<id>] replacement
  if (out.includes('[<id>]')) {
    out = out.replaceAll('[<id>]', String(iterationId));
  }

  // 2. Built-in dynamic tokens
  out = out.replace(/\{\{\$uuid\}\}/g, () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  });

  out = out.replace(/\{\{\$timestamp\}\}/g, () => String(Date.now()));
  out = out.replace(/\{\{\$random_int\}\}/g, () => String(Math.floor(Math.random() * 100000)));

  // 3. Custom extracted variables (e.g. {{authToken}})
  for (const [key, val] of Object.entries(customVars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    out = out.replace(pattern, val);
  }

  return out;
}

/**
 * Extracts a value from a JSON object by dot-path (e.g. "token", "data.user.id", "items[0].name").
 */
export function extractFromJsonPath(data: unknown, path: string): string | undefined {
  if (!data || !path) return undefined;
  try {
    const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
    const segments = cleanPath.split('.');
    let current: any = data;

    for (const segment of segments) {
      if (current === null || current === undefined) return undefined;
      current = current[segment];
    }

    if (current === undefined || current === null) return undefined;
    return typeof current === 'object' ? JSON.stringify(current) : String(current);
  } catch {
    return undefined;
  }
}
