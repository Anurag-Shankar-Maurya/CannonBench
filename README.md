# CannonBench

A lightweight, clean web workbench for HTTP/1.1 and HTTP/2 load and stress testing powered by **[Autocannon](https://github.com/mcollina/autocannon)**—complete with real-time SSE telemetry, stress pattern orchestration, HAR session replay, automated bottleneck diagnostics, run-to-run comparisons, and zero-database browser persistence.

---

## Features

### 1. Full `npx autocannon` Engine Parity
- **HTTP Methods & Payloads:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` with raw JSON/text bodies (`-b`), multipart `form-data` text fields (`-F`), custom headers (`-H`), and 1-click Auth helpers (Bearer JWT, API Key, Basic Auth, Cookies).
- **Concurrency & Rate Controls:** Connections (`-c`), Duration (`-d`), Fixed Request Count (`-a`), Pipelining (`-p`), Worker Threads (`-w`), Warmup phase (`-W`), Overall Rate (`-R`), Connection Rate (`-r`), and Coordinated Omission toggle (`-C`).
- **Reliability & Assertions:** Error Bailout threshold (`-B`), Response Body verification (`-E`), Connection/Overall request caps (`-M`, `-O`), Reconnect rate (`-D`), Timeout (`-t`), SNI servername (`-s`), and native `[<id>]` replacement (`-I`) plus dynamic `{{$uuid}}`, `{{$timestamp}}`, and `{{$random_int}}` tokens.
- **Live CLI Command Strip:** Generates the exact mirrored `npx autocannon ...` terminal command as you configure your test.

### 2. Advanced Stress Testing Patterns
- **Constant:** Steady concurrency for baseline throughput and latency profiling.
- **Ramp-Up:** Stepped concurrency progression (e.g., `10 → 40 → 70 → 100` connections) stitched into one continuous timeline to pinpoint saturation points.
- **Spike:** Automated `Baseline → Burst → Recovery` stages to test autoscaling and queue drain behavior.
- **Soak:** Lower-concurrency extended duration runs to uncover memory or connection leaks.
- **Rate-Paced:** Fixed RPS targets with Coordinated Omission correction enabled by default.

### 3. Developer Workflows & Diagnostics
- **Live Streaming Telemetry:** Server-Sent Events (`text/event-stream`) stream 1-second Requests/sec, network bandwidth, and `Avg / p90 / p99` latency curves directly from Autocannon's native `tick` and `response` events.
- **HAR File Replay (`--har`):** Drag and drop a Chrome DevTools `.har` recording to filter static assets and replay real multi-endpoint user flows.
- **Built-In Sandbox Target (`/api/sandbox/target`):** Instant safe testing endpoint supporting configurable `delay`, `jitter`, `failRate`, and `rateLimitRps` (`429`) simulation.
- **Automated Bottleneck Diagnostics & APDEX:** Detects HTTP `429` throttling, `5xx` saturation, `p99/p50` worker starvation skew, socket timeouts, and assertion mismatches.
- **Local History, Compare & CI Export:** Stores runs and custom presets in browser `localStorage` with side-by-side delta comparisons, HTML/Markdown/JSON report exports, and GitHub Actions CI gate workflow generation.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Node.js Runtime)
- **Load Engine:** `autocannon` programmatic API
- **Validation:** `zod`
- **Styling & Icons:** Tailwind CSS v4, `lucide-react`, `Plus Jakarta Sans` / `Public Sans` / `JetBrains Mono`
- **Persistence:** Browser `localStorage` (zero external database required)

---

## Local Development

### Prerequisites
- Node.js `>= 20.0.0`
- `npm`, `pnpm`, or `bun`

### Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and click **Start Benchmark** to run your first test against the built-in Sandbox API.

### Production Build Check

```bash
npm run lint
npm run build
npm run start
```

---

## Deploying to Vercel

CannonBench is pre-configured for **Vercel** deployments (`vercel.json`, `next.config.ts`, and Fluid Compute `maxDuration` exports).

### Option A: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B: Deploy via GitHub Integration
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Leave the framework preset as **Next.js** (no environment variables are required).
4. Click **Deploy**.

### Important Vercel Notes
- **Streaming & Timeout (`maxDuration`):** `/api/benchmark` exports `maxDuration = 300` (configured in both `app/api/benchmark/route.ts` and `vercel.json`), enabling up to 5-minute streaming benchmarks on Vercel Fluid Compute (including Hobby plans).
- **Worker Threads (`-w`):** Standard single-process mode (`workers: 0`) streams live 1-second charts and supports high throughput cleanly inside serverless functions. Keep `workers: 0` on serverless deployments if you want real-time tick charts, as `autocannon` worker threads aggregate histograms only upon completion.
- **Built-In Sandbox Target & Deployment Protection:** If Vercel **Deployment Protection** (Authentication) is enabled on Preview deployments, external HTTP requests from `/api/benchmark` to `/api/sandbox/target` will receive `401` unless Deployment Protection is disabled or you test external public URLs.

---

## Security Safeguards

- **SSRF Protection:** `/api/benchmark` validates all target URLs and HAR entries (`http:`/`https:` only), resolves DNS records, and blocks private IPv4/IPv6 ranges, loopback addresses, and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
- **Resource Caps:** Connections (`<= 500`), duration (`<= 300s`), pipelining (`<= 20`), and worker threads (`<= 4`) are strictly validated via `zod`.
- **Programmatic Execution:** Options are passed directly to `autocannon` as structured objects—never interpolated into shell commands. Multipart forms only permit text fields to prevent server file access.

---

## License

MIT
