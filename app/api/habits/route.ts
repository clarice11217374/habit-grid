import { NextRequest, NextResponse } from 'next/server';
import { getAreas } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getAreas());
}

export async function POST(request: NextRequest) {
  await request.json().catch(() => null);
  return NextResponse.json(
    { error: 'Life areas are fixed. Use /api/commits to record what you did today.' },
    { status: 405 }
  );
}
