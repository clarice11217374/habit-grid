import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { getAreas } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(await getAreas());
  } catch (error: unknown) {
    return apiError('/api/habits GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => null);
    return apiJson(
      { error: 'Life areas are fixed. Use /api/commits to record what you did today.' },
      { status: 405 }
    );
  } catch (error: unknown) {
    return apiError('/api/habits POST', error);
  }
}
