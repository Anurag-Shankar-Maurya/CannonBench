import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stopActiveRun } from '@/lib/benchmark-registry';

export const runtime = 'nodejs';

const StopSchema = z.object({
  runId: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = StopSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid runId' }, { status: 400 });
    }
    const stopped = stopActiveRun(parsed.data.runId);
    return NextResponse.json({ ok: true, stopped });
  } catch {
    return NextResponse.json({ error: 'Failed to stop benchmark' }, { status: 500 });
  }
}
