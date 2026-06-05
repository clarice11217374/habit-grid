import { NextRequest, NextResponse } from 'next/server';
import { getAreaEntries, getAllAreaEntriesForYear } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const areaId = searchParams.get('area');
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  if (!areaId || areaId === 'all') {
    const entries = getAllAreaEntriesForYear(year);
    return NextResponse.json(entries);
  }

  const entries = getAreaEntries(parseInt(areaId), year);
  return NextResponse.json(entries);
}
