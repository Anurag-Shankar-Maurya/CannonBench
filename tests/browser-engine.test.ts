import { describe, expect, it } from 'vitest';
import {
  extractFromJsonPath,
  resolveVariables,
} from '@/lib/browser-engine/variable-resolver';
import {
  buildLatencySummary,
  buildRateSummary,
  calculatePercentile,
} from '@/lib/browser-engine/percentiles';

describe('Variable Resolver', () => {
  it('resolves [<id>] iteration replacement', () => {
    const template = 'https://api.test/user/[<id>]';
    expect(resolveVariables(template, {}, 42)).toBe('https://api.test/user/42');
  });

  it('resolves {{$timestamp}}, {{$uuid}}, and {{$random_int}}', () => {
    const template = 'id={{$uuid}}&t={{$timestamp}}&rnd={{$random_int}}';
    const out = resolveVariables(template, {}, 1);
    expect(out).not.toContain('{{$uuid}}');
    expect(out).not.toContain('{{$timestamp}}');
    expect(out).not.toContain('{{$random_int}}');
    expect(out).toMatch(/id=[0-9a-f-]+&t=\d+&rnd=\d+/);
  });

  it('interpolates chained extracted variables', () => {
    const template = 'Bearer {{authToken}} for user {{userId}}';
    const vars = { authToken: 'jwt-xyz-123', userId: 'user-99' };
    expect(resolveVariables(template, vars)).toBe('Bearer jwt-xyz-123 for user user-99');
  });

  it('extracts nested variables from JSON data by dot-path', () => {
    const data = {
      user: {
        id: 101,
        profile: {
          token: 'token_abc',
        },
      },
      items: [{ name: 'first' }, { name: 'second' }],
    };

    expect(extractFromJsonPath(data, 'user.id')).toBe('101');
    expect(extractFromJsonPath(data, 'user.profile.token')).toBe('token_abc');
    expect(extractFromJsonPath(data, 'items[0].name')).toBe('first');
    expect(extractFromJsonPath(data, 'nonexistent.field')).toBeUndefined();
  });
});

describe('Percentile Calculations', () => {
  it('computes exact percentiles correctly', () => {
    // 1 to 100
    const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(calculatePercentile(numbers, 50)).toBe(50);
    expect(calculatePercentile(numbers, 90)).toBe(90);
    expect(calculatePercentile(numbers, 99)).toBe(99);
  });

  it('generates full LatencySummary', () => {
    const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const summary = buildLatencySummary(sample);

    expect(summary.min).toBe(10);
    expect(summary.max).toBe(100);
    expect(summary.average).toBe(55);
    expect(summary.p50).toBe(50);
    expect(summary.totalCount).toBe(10);
    expect(summary.stddev).toBeGreaterThan(0);
  });

  it('handles empty latencies gracefully', () => {
    const summary = buildLatencySummary([]);
    expect(summary.min).toBe(0);
    expect(summary.max).toBe(0);
    expect(summary.average).toBe(0);
    expect(summary.totalCount).toBe(0);
  });

  it('computes RateSummary accurately', () => {
    const rpsSamples = [100, 120, 140, 160];
    const rate = buildRateSummary(rpsSamples, 4);

    expect(rate.total).toBe(520);
    expect(rate.average).toBe(130);
    expect(rate.min).toBe(100);
    expect(rate.max).toBe(160);
  });
});
