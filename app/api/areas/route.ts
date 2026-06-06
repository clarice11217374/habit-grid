import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { getAreas } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(getAreas());
  } catch (error: unknown) {
    return apiError('/api/areas GET', error);
  }
}
