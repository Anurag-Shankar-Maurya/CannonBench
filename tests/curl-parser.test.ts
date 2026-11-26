import { describe, expect, it } from 'vitest';
import {
  isCurlCommand,
  normalizeAndFormatUrl,
  parseCurlCommand,
  tokenizeCommandLine,
} from '@/lib/curl-parser';

describe('curl-parser', () => {
  describe('isCurlCommand', () => {
    it('detects single-line curl commands', () => {
      expect(isCurlCommand('curl https://api.example.com/')).toBe(true);
      expect(isCurlCommand('curl -X POST https://api.example.com/')).toBe(true);
      expect(isCurlCommand('  curl -H "Auth: abc" https://api.com  ')).toBe(true);
    });

    it('detects multi-line curl commands with line continuations', () => {
      const multi = `curl 'https://api.example.com/v1/posts/' \\
        -H 'Accept: application/json' \\
        -d '{"title": "Test"}'`;
      expect(isCurlCommand(multi)).toBe(true);
    });

    it('returns false for non-curl inputs', () => {
      expect(isCurlCommand('https://api.example.com/')).toBe(false);
      expect(isCurlCommand('GET /api/v1/users HTTP/1.1')).toBe(false);
      expect(isCurlCommand('')).toBe(false);
    });
  });

  describe('normalizeAndFormatUrl', () => {
    it('preserves trailing slashes when present (e.g. Django endpoints)', () => {
      expect(normalizeAndFormatUrl('https://django.kumbhconnect.com/api/feedback/ratings/')).toBe(
        'https://django.kumbhconnect.com/api/feedback/ratings/'
      );
      expect(normalizeAndFormatUrl('https://aic.anuragshankarmaurya.in/api/blog/')).toBe(
        'https://aic.anuragshankarmaurya.in/api/blog/'
      );
    });

    it('normalizes accidental duplicate slashes in path while preserving protocol and trailing slash', () => {
      expect(normalizeAndFormatUrl('https://api.example.com//v1///users/')).toBe(
        'https://api.example.com/v1/users/'
      );
      expect(normalizeAndFormatUrl('http://localhost:3000//api//sandbox/target')).toBe(
        'http://localhost:3000/api/sandbox/target'
      );
    });

    it('unescapes shell artifacts like \\? and \\& from copy-pasting terminal cURL', () => {
      expect(
        normalizeAndFormatUrl('https://api.example.com/search\\?query\\=load\\&limit\\=50')
      ).toBe('https://api.example.com/search?query=load&limit=50');
    });

    it('fixes multiple question marks and accidental double ampersands', () => {
      expect(normalizeAndFormatUrl('https://api.example.com/items?page=1?sort=desc&&limit=20')).toBe(
        'https://api.example.com/items?page=1&sort=desc&limit=20'
      );
    });

    it('removes trailing question marks and ampersands', () => {
      expect(normalizeAndFormatUrl('https://api.example.com/users?')).toBe(
        'https://api.example.com/users'
      );
      expect(normalizeAndFormatUrl('https://api.example.com/users?active=true&')).toBe(
        'https://api.example.com/users?active=true'
      );
    });

    it('adds https:// protocol if omitted', () => {
      expect(normalizeAndFormatUrl('api.example.com/v1/test')).toBe(
        'https://api.example.com/v1/test'
      );
      expect(normalizeAndFormatUrl('localhost:3000/api/target')).toBe(
        'http://localhost:3000/api/target'
      );
    });
  });

  describe('parseCurlCommand', () => {
    it('parses basic GET cURL', () => {
      const curl = "curl 'https://api.example.com/v1/users?limit=10'";
      const res = parseCurlCommand(curl);
      expect(res).not.toBeNull();
      expect(res?.url).toBe('https://api.example.com/v1/users?limit=10');
      expect(res?.method).toBe('GET');
      expect(res?.headers).toEqual([]);
      expect(res?.bodyMode).toBe('none');
    });

    it('parses POST with headers and formatted JSON body', () => {
      const curl = `curl -X POST "https://django.kumbhconnect.com/api/feedback/ratings/" \\
        -H "Accept: application/json" \\
        -H "Authorization: Bearer my-token-123" \\
        -H "Content-Type: application/json" \\
        --data-raw '{"rating": 5, "comment": "Great load test!"}'`;

      const res = parseCurlCommand(curl);
      expect(res).not.toBeNull();
      expect(res?.url).toBe('https://django.kumbhconnect.com/api/feedback/ratings/');
      expect(res?.method).toBe('POST');
      expect(res?.headers.length).toBe(3);
      expect(res?.headers[0].key).toBe('Accept');
      expect(res?.headers[1].key).toBe('Authorization');
      expect(res?.headers[1].value).toBe('Bearer my-token-123');
      expect(res?.bodyMode).toBe('raw');
      expect(res?.body).toBe(
        JSON.stringify({ rating: 5, comment: 'Great load test!' }, null, 2)
      );
      expect(res?.summary).toContain('POST');
      expect(res?.summary).toContain('3 headers');
      expect(res?.summary).toContain('JSON body');
    });

    it('infers POST when --data or -d is provided without explicit -X flag', () => {
      const curl = `curl https://api.example.com/submit -d "foo=bar&baz=qux"`;
      const res = parseCurlCommand(curl);
      expect(res?.method).toBe('POST');
      expect(res?.body).toBe('foo=bar&baz=qux');
      expect(res?.bodyMode).toBe('raw');
    });

    it('handles curl --json shorthand', () => {
      const curl = `curl --json '{"name": "Alice"}' https://api.example.com/users/`;
      const res = parseCurlCommand(curl);
      expect(res?.method).toBe('POST');
      expect(res?.url).toBe('https://api.example.com/users/');
      expect(res?.headers.some((h) => h.key === 'Content-Type')).toBe(true);
      expect(res?.body).toBe(JSON.stringify({ name: 'Alice' }, null, 2));
    });

    it('handles -I / --head flag', () => {
      const curl = `curl -I https://api.example.com/health`;
      const res = parseCurlCommand(curl);
      expect(res?.method).toBe('HEAD');
    });

    it('filters out hop-by-hop headers like Content-Length and Connection', () => {
      const curl = `curl https://api.example.com/ \\
        -H "Host: api.example.com" \\
        -H "Content-Length: 42" \\
        -H "Connection: keep-alive" \\
        -H "X-Custom-Header: valid-value"`;
      const res = parseCurlCommand(curl);
      expect(res?.headers.length).toBe(1);
      expect(res?.headers[0].key).toBe('X-Custom-Header');
    });
  });
});
