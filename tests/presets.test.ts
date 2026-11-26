import { describe, expect, it } from 'vitest';
import {
  createDefaultBenchmarkConfig,
  getBuiltInPresets,
  resetRequestOptionsToDefault,
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

  it('resets headers, body, chaining, and modifiers while keeping the URL and concurrency', () => {
    const customConfig = createDefaultBenchmarkConfig('http://localhost:3000');
    customConfig.url = 'https://aic.anuragshankarmaurya.in/api/blog/';
    customConfig.method = 'POST';
    customConfig.connections = 100;
    customConfig.duration = 60;
    customConfig.headers = [
      { id: 'h1', key: 'Authorization', value: 'Bearer token-xyz', enabled: true },
      { id: 'h2', key: 'X-CSRFToken', value: 'csrf-123', enabled: true },
    ];
    customConfig.bodyMode = 'raw';
    customConfig.body = '{"foo": "bar"}';
    customConfig.pipelining = 4;
    customConfig.enableChaining = true;
    customConfig.chainedSteps = [
      {
        id: 'step-1',
        name: 'Auth Step',
        method: 'GET',
        url: 'https://api.com/auth',
        headers: [],
        bodyMode: 'none',
        body: '',
        contentType: 'application/json',
        extractVariables: [],
      },
    ];

    const reset = resetRequestOptionsToDefault(customConfig);

    // Kept intact:
    expect(reset.url).toBe('https://aic.anuragshankarmaurya.in/api/blog/');
    expect(reset.connections).toBe(100);
    expect(reset.duration).toBe(60);

    // Reset to defaults:
    expect(reset.method).toBe('GET');
    expect(reset.bodyMode).toBe('none');
    expect(reset.body).toBe('');
    expect(reset.pipelining).toBe(1);
    expect(reset.enableChaining).toBe(false);
    expect(reset.chainedSteps).toEqual([]);
    expect(reset.headers.length).toBe(1);
    expect(reset.headers[0].key).toBe('Accept');
  });
});
