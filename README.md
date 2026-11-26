# ⚡ CannonBench

<p align="center">
  <strong>The modern HTTP load and stress testing workbench powered by <a href="https://github.com/mcollina/autocannon">Autocannon</a>.</strong><br>
  Real-time streaming telemetry, dual execution engines (Native Node.js raw sockets & Browser Edge), multi-step request chaining, automated SLO quality gates, and zero-database persistence.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Engine-Autocannon-indigo?style=flat-square&logo=node.js" alt="Autocannon" />
  <img src="https://img.shields.io/badge/Tests-Vitest%2034%2F34-emerald?style=flat-square&logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/License-MIT-slate?style=flat-square" alt="License" />
</p>

---

## 🚀 Why CannonBench?

Terminal load generators like `autocannon`, `wrk`, or `k6` are blazingly fast, but visualizing percentile tails, diagnosing concurrency bottlenecks, and replaying complex user journeys shouldn't require stitching together external Grafana dashboards or writing hundreds of lines of boilerplate.

**CannonBench** bridges the gap: it delivers **100% terminal CLI parity** with raw TCP socket performance through an intuitive, beautifully responsive desktop & mobile interface.

```bash
# What you used to type in terminal:
npx autocannon -c 25 -d 30 -m POST -H 'Authorization: Bearer ...' 'https://api.example.com/v1/checkout/'

# What CannonBench gives you:
# Live 1-second telemetry curves • Latency distribution histograms • Automated SLO pass/fail gates
# Multi-step chained workflows • 1-click cURL auto-import • HTML & PDF executive reports
```

---

## ✨ Core Features

### 1. Dual Execution Engines
- **⚡ Native Engine (`native`):** Direct Node.js raw TCP sockets streamed via Server-Sent Events (`/api/benchmark`). 100% identical performance to `npx autocannon` in terminal. Bypasses browser socket pools to sustain 25–500+ concurrent connections.
- **🌐 Browser Edge Engine (`browser`):** Pure client-side `fetch()` load runner with High-Resolution Resource Timing API metrics. Zero backend requirements—ideal for static hosting, edge deployments, and internal dev testing.

### 2. Smart cURL Auto-Import & Shell Quoting
- **Paste cURL Anywhere:** Copy any request from Chrome DevTools, Postman, or terminal, and paste it (`Ctrl+V`) into the URL bar or dashboard. CannonBench automatically extracts the Method, URL, Headers, and formatted JSON body.
- **URL & Query Sanitizer:** Automatically cleans terminal copy-paste artifacts (`\?`, `\&`), fixes duplicate slashes (`//`), cleans multiple `?`/`&` delimiters, and **strictly preserves trailing slashes** (`/`) required by frameworks like Django.
- **Shell-Safe CLI Generator:** Automatically encloses query strings in single quotes (`'https://api.com?a=1&b=2'`) so copying the CLI equivalent command never crashes in Bash, Zsh, or PowerShell.

### 3. Multi-Step Request Chaining (Postman / k6 Parity)
- Chain sequential dependent HTTP requests in a single scenario.
- Extract dynamic response variables via JSONPath (e.g. `$.auth.token` $\to$ `{{authToken}}` or `$.user.id` $\to$ `{{userId}}`).
- Inject dynamic tokens across subsequent requests, URLs, and headers.

### 4. SLO / SLA Quality Gates & Automated Diagnostics
- **Threshold Assertions:** Define strict pass/fail rules for $p50$ median latency, $p99$ tail latency, maximum error rate $\%$, and minimum RPS.
- **Automated Diagnostics:** Real-time root-cause analysis detecting:
  - Worker starvation & event-loop blockages ($p99/p50$ skew)
  - HTTP `429` rate limiting & `5xx` server saturation
  - Browser RFC 2616 connection queueing delays
  - CORS policy origin restrictions

### 5. Advanced Telemetry & Percentile Distributions
- **Interactive Telemetry:** Live dual-line charts showing Requests/sec, Network Egress (KB/s), and Latency ($p50, p90, p99$) with 1-second tick resolution.
- **Timeline Zoom & Scrubbing:** Switch between Full (100%), Last 30s, and Last 10s with toggleable Error Breakdown layers.
- **Binned Latency Histogram:** Logarithmic frequency curve ($\le 5\text{ms}$ to $> 3000\text{ms}$) revealing multimodal distribution patterns and tail outliers.

### 6. Full Autocannon CLI Options
- **Load Patterns:** Constant, Ramp-Up (`10 → 40 → 70 → 100`), Spike (Baseline $\to$ Burst $\to$ Recovery), Soak, and Rate-Paced.
- **Advanced Modifiers:** HTTP Pipelining (`-p`), Worker Threads (`-w`), Error Bailout threshold (`-B`), Response Body verification (`-E`), Warmup phase (`-W`), and Coordinated Omission correction (`-C`).
- **Dynamic Token Generators:** `{{$uuid}}`, `{{$timestamp}}`, `{{$random_int}}`, and native `[<id>]` replacements.

### 7. Developer Ergonomics & Zero-DB Persistence
- **1-Click Reset Options:** Wipe stale headers and request bodies back to clean defaults when testing new APIs without losing your target URL.
- **HAR File Replay:** Drag & drop Chrome DevTools `.har` archives with automatic static asset filtering.
- **Local History & JSON Backup:** Full run history stored in `localStorage` with side-by-side run delta comparisons and complete JSON backup import/export.
- **Executive Export:** One-click export to print-ready HTML, PDF, Markdown, and GitHub Actions CI workflow templates.

---

## 🛠️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                       CannonBench UI                          │
│     (Next.js 15 App Router • Tailwind CSS v4 • Lucide)        │
└──────────────┬────────────────────────────────┬───────────────┘
               │                                │
    [⚡ Native Engine]                   [🌐 Browser Engine]
               │                                │
  POST /api/benchmark (SSE Stream)      Client-side fetch() +
               │                        Resource Timing API
               ▼                                │
     Node.js Autocannon Engine                  ▼
   (Raw TCP Sockets • No 6-conn cap)    Client Browser Thread
               │                        (Capped at 6 conn / host)
               ▼                                │
      Target HTTP/S Server ◄────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js `>= 20.0.0`
- `npm`, `pnpm`, or `bun`

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cannonbench.git
cd cannonbench

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Click **Sandbox** to load the safe, built-in test target (`/api/sandbox/target`) and hit **Start Benchmark** (or press `⌘ + Enter`).

---

## 🧪 Testing & Verification

CannonBench comes with a comprehensive Vitest automated test suite covering variable resolution, percentile computations, cURL parsing, and configuration presets:

```bash
# Run unit and integration tests
npm test

# Check TypeScript types across the project
npx tsc --noEmit

# Production build verification
npm run build
```

---

## 🚢 Deployment

### Deploying to Vercel

CannonBench is optimized for Vercel Fluid Compute and serverless streaming:

```bash
npm i -g vercel
vercel
```

- **Streaming Duration:** `/api/benchmark` exports `maxDuration = 300` (5 minutes) for long-duration load tests.
- **Zero Database Required:** All runs and settings persist locally in browser `localStorage`.
- **Static / Edge Hosting:** Set Engine Mode to `Browser` to deploy CannonBench as a purely static client-side dashboard on GitHub Pages, Cloudflare Pages, or Netlify.

---

## 🔒 Security & Safe Testing

- **Server-Side Request Forgery (SSRF) Guard:** `/api/benchmark` resolves DNS and blocks private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) and cloud metadata endpoints (`169.254.169.254`).
- **Resource Constraints:** Concurrency ($\le 500$), duration ($\le 300\text{s}$), and worker threads ($\le 4$) are strictly validated with Zod.
- **Safe Sandboxing:** Built-in `/api/sandbox/target` route lets you simulate latency, jitter, error rates, and HTTP 429 throttling without hitting external production APIs.

---

## 📄 License

MIT © [Anurag Shankar Maurya](https://github.com/anuragshankarmaurya)
