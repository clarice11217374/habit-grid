import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { getAreaEntries, getAllAreaEntriesForYear } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const areaId = searchParams.get('area');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!areaId || areaId === 'all') {
      return NextResponse.json(getAllAreaEntriesForYear(year));
    }

    return NextResponse.json(getAreaEntries(parseInt(areaId), year));
  } catch (error: unknown) {
    return apiError('/api/entries GET', error);
  }
}
