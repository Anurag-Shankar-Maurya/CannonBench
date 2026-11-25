import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const rateWindow = new Map<number, number>();

function checkRateLimit(limitRps: number): boolean {
  if (limitRps <= 0) return false;
  const currentSec = Math.floor(Date.now() / 1000);
  // Prune old seconds
  for (const sec of rateWindow.keys()) {
    if (sec < currentSec - 2) {
      rateWindow.delete(sec);
    }
  }
  const currentCount = rateWindow.get(currentSec) ?? 0;
  if (currentCount >= limitRps) {
    return true;
  }
  rateWindow.set(currentSec, currentCount + 1);
  return false;
}

async function handleSandbox(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const delayMs = Math.min(2000, Math.max(0, Number(sp.get('delay') ?? 15) || 0));
  const jitterMs = Math.min(2000, Math.max(0, Number(sp.get('jitter') ?? 0) || 0));
  const failRate = Math.min(1, Math.max(0, Number(sp.get('failRate') ?? 0) || 0));
  const rateLimitRps = Math.min(50000, Math.max(0, Number(sp.get('rateLimitRps') ?? 0) || 0));
  const forcedStatus = Number(sp.get('status') ?? 0) || 0;

  if (rateLimitRps > 0 && checkRateLimit(rateLimitRps)) {
    return NextResponse.json(
      { ok: false, error: 'Too Many Requests', limitRps: rateLimitRps },
      { status: 429, headers: { 'Retry-After': '1' } }
    );
  }

  const totalDelay = delayMs + (jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0);
  if (totalDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, totalDelay));
  }

  if (failRate > 0 && Math.random() < failRate) {
    return NextResponse.json(
      { ok: false, error: 'Simulated upstream 503 failure' },
      { status: 503 }
    );
  }

  let bodySnippet: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      const txt = await req.text();
      if (txt) bodySnippet = txt.slice(0, 256);
    } catch {
      // ignore body read error
    }
  }

  const status = forcedStatus >= 200 && forcedStatus <= 599 ? forcedStatus : 200;

  if (req.method === 'HEAD') {
    return new NextResponse(null, { status });
  }

  return NextResponse.json(
    {
      ok: status >= 200 && status < 300,
      method: req.method,
      timestamp: Date.now(),
      simulatedLatencyMs: totalDelay,
      echo: bodySnippet ?? null,
    },
    { status }
  );
}

export async function GET(req: NextRequest) {
  return handleSandbox(req);
}
export async function POST(req: NextRequest) {
  return handleSandbox(req);
}
export async function PUT(req: NextRequest) {
  return handleSandbox(req);
}
export async function PATCH(req: NextRequest) {
  return handleSandbox(req);
}
export async function DELETE(req: NextRequest) {
  return handleSandbox(req);
}
export async function HEAD(req: NextRequest) {
  return handleSandbox(req);
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
    },
  });
}
