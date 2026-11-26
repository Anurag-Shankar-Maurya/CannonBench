export async function GET() {
  const content = `# CannonBench
> The modern HTTP load and stress testing workbench powered by Autocannon.

## Summary
CannonBench is an open-source Developer Tool and Testing-as-a-Service (TaaS) workbench designed for performance engineering, API benchmarking, and automated Service Level Objective (SLO) enforcement. It brings 100% terminal parity with \`npx autocannon\` while providing a real-time visual interface with zero-database footprint.

## Key Capabilities & Technical Specifications
- **Dual Execution Engines:**
  - *Native Node.js Engine (\`native\`):* Executes directly via raw Node.js TCP sockets through Server-Sent Events (SSE) streaming (/api/benchmark). Bypasses browser connection limits to sustain 25–500+ concurrent connections.
  - *Browser Edge Engine (\`browser\`):* Runs directly in the client browser using the High-Resolution Resource Timing API and fetch() for real-world client latency measurement.
- **Real-Time Telemetry:**
  - 1-second interval streaming telemetry curves for Requests/sec, Network Egress (KB/s), and Latency (p50, p90, p99).
  - Binned logarithmic latency histograms (<= 5ms to > 3000ms) to identify multimodal distribution spikes and tail outliers.
- **Smart cURL Auto-Import:**
  - Paste any cURL command (Ctrl+V) anywhere on the page to auto-extract Method, URL, Headers, and formatted JSON bodies.
  - Automatically cleans terminal copy-paste artifacts (\\?, \\&), duplicate slashes (//), and preserves trailing slashes (/) for frameworks like Django.
- **Multi-Step Request Chaining:**
  - Enables sequential dependent HTTP requests with JSONPath variable extraction (e.g. $.auth.token -> {{authToken}}).
- **Automated SLO Quality Gates & Diagnostics:**
  - Set thresholds for p50, p99, max error rates, and minimum RPS.
  - Automated diagnostic rules detecting event-loop blockages, worker thread starvation, and HTTP 429 rate limits.
- **Privacy & Security Architecture:**
  - 100% Zero-Database architecture: Run history and configurations are stored in browser localStorage. No API payloads or authentication secrets leave the user's host or VPC perimeter.

## Product Classification
- **Category:** Developer Tool (DevTool), API Testing, Load & Stress Testing Workbench, Testing-as-a-Service (TaaS).
- **License:** MIT Open Source.
- **Website:** https://cannonbench.dev
- **Workbench App:** https://cannonbench.dev/app
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
