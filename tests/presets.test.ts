import { describe, expect, it } from 'vitest';
import {
  createDefaultBenchmarkConfig,
  getBuiltInPresets,
} from '@/lib/presets';

describe('Presets & Configuration', () => {
  it('creates default configuration with chaining & SLO properties', () => {
    const config = createDefaultBenchmarkConfig('http://localhost:3000');
    expect(config.title).toBe('Sandbox API Baseline');
    expect(config.method).toBe('GET');
    expect(config.pattern).toBe('constant');
    expect(config.enableChaining).toBe(false);
    expect(config.chainedSteps).toEqual([]);
    expect(config.sloTargetLatencyMs).toBe(150);
    expect(config.sloMaxErrorPct).toBe(1);
    expect(config.sloMaxP99Ms).toBe(250);
    expect(config.sloMinRps).toBe(50);
    expect(config.engineMode).toBe('native');
  });

  it('provides built-in presets covering multiple patterns', () => {
    const presets = getBuiltInPresets('http://localhost:3000');
    expect(presets.length).toBeGreaterThanOrEqual(3);

    const patterns = presets.map((p) => p.config.pattern);
    expect(patterns).toContain('rate');
  });
});
