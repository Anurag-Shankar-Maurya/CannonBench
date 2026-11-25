declare module 'autocannon' {
  import type { EventEmitter } from 'node:events';

  export interface AutocannonOptions {
    url: string | string[];
    connections?: number;
    duration?: number;
    amount?: number;
    pipelining?: number;
    workers?: number;
    timeout?: number;
    sampleInt?: number;
    method?: string;
    title?: string;
    body?: string | Buffer;
    form?: Record<string, { type: 'text'; value: string }>;
    headers?: Record<string, string>;
    har?: Record<string, unknown>;
    overallRate?: number;
    connectionRate?: number;
    ignoreCoordinatedOmission?: boolean;
    bailout?: number;
    maxConnectionRequests?: number;
    maxOverallRequests?: number;
    reconnectRate?: number;
    excludeErrorStats?: boolean;
    idReplacement?: boolean;
    expectBody?: string;
    servername?: string;
    warmup?: {
      connections?: number;
      duration?: number;
    };
    renderStatusCodes?: boolean;
    renderProgressBar?: boolean;
    renderLatencyTable?: boolean;
    renderResultsTable?: boolean;
  }

  export interface AutocannonInstance extends EventEmitter {
    stop: () => void;
    on(event: 'start', listener: () => void): this;
    on(event: 'tick', listener: (stats: { counter: number; bytes: number }) => void): this;
    on(
      event: 'response',
      listener: (client: unknown, statusCode: number, resBytes: number, responseTime: number) => void
    ): this;
    on(event: 'reqError', listener: (err: Error) => void): this;
    on(event: 'reqMismatch', listener: (bodyStr: string) => void): this;
    on(event: 'done', listener: (result: Record<string, unknown>) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  function autocannon(
    opts: AutocannonOptions,
    cb?: (err: Error | null, result: Record<string, unknown>) => void
  ): AutocannonInstance;

  export default autocannon;
}
