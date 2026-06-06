import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { getAreas } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(getAreas());
  } catch (error: unknown) {
    return apiError('/api/habits GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => null);
    return NextResponse.json(
      { error: 'Life areas are fixed. Use /api/commits to record what you did today.' },
      { status: 405 }
    );
  } catch (error: unknown) {
    return apiError('/api/habits POST', error);
  }
}
