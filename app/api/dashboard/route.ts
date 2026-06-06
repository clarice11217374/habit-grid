import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { getDashboardStats } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(getDashboardStats());
  } catch (error: unknown) {
    return apiError('/api/dashboard GET', error);
  }
}
