import { NextResponse } from 'next/server';
import { VAPID_PUBLIC_KEY } from '@/lib/push';

export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: 'Rappels distants non configurés' }, { status: 503 });
  }
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  });
}
