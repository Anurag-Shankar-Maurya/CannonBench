export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    q: 'What is CannonBench and how does it compare to the Autocannon CLI?',
    a: 'CannonBench is an open-source, visual workbench built on top of Autocannon. It provides 100% performance parity with the `npx autocannon` terminal CLI, while adding 1-second real-time streaming telemetry, binned percentile latency histograms, automated SLO assertions, multi-step request chaining, and one-click PDF/HTML report exports—without needing complex Grafana or Prometheus setups.',
  },
  {
    q: 'How does CannonBench achieve raw socket performance inside a browser?',
    a: 'CannonBench utilizes a dual-engine architecture. When you select the Native Engine, the benchmark executes directly on Node.js using unconstrained raw TCP sockets via Server-Sent Events (SSE). This completely bypasses the browser’s RFC 2616 limit of 6 concurrent connections per host, enabling sustained loads of 25 to 500+ concurrent connections.',
  },
  {
    q: 'Can I test internal microservices on localhost and behind a corporate VPN?',
    a: 'Yes, absolutely. Because CannonBench has a Zero-Database architecture and runs directly on your local machine or internal Docker/VPC environment, you can benchmark private microservices, staging environments, and localhost APIs without exposing endpoints or auth tokens to the public internet.',
  },
  {
    q: 'What is the difference between Native Node.js Engine and Browser Edge Engine?',
    a: 'The Native Engine uses Node.js Autocannon for raw TCP socket performance and HTTP pipelining at high concurrency. The Browser Edge Engine uses client-side fetch() with the High-Resolution Resource Timing API, measuring exact real-world end-user latencies, DNS lookups, and browser connection queueing. You can toggle between them depending on your testing goals.',
  },
  {
    q: 'How do automated SLO quality gates work?',
    a: 'You can configure strict Service Level Objective (SLO) thresholds for median p50 latency, tail p99 latency, maximum error rate percentage, and minimum throughput (RPS). At the conclusion of a test, CannonBench automatically evaluates the metrics and provides an instant Pass/Fail gate with root-cause diagnostic advice.',
  },
  {
    q: 'Is CannonBench really 100% free and open-source?',
    a: 'Yes. CannonBench is 100% free under the MIT open-source license. There are no credit limits, no subscription paywalls, and no hidden telemetry tracking. You can self-host it, run it in CI/CD pipelines, or modify it for your team.',
  },
];
