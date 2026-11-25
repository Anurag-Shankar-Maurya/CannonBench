interface ActiveRunHandle {
  stop: () => void;
  createdAt: number;
}

const globalForRegistry = globalThis as unknown as {
  __cannonbenchActiveRuns?: Map<string, ActiveRunHandle>;
};

const activeRuns =
  globalForRegistry.__cannonbenchActiveRuns ?? new Map<string, ActiveRunHandle>();
globalForRegistry.__cannonbenchActiveRuns = activeRuns;

export function registerActiveRun(runId: string, stop: () => void): void {
  activeRuns.set(runId, { stop, createdAt: Date.now() });
}

export function unregisterActiveRun(runId: string): void {
  activeRuns.delete(runId);
}

export function stopActiveRun(runId: string): boolean {
  const handle = activeRuns.get(runId);
  if (!handle) return false;
  try {
    handle.stop();
  } finally {
    activeRuns.delete(runId);
  }
  return true;
}
