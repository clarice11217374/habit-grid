import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { getAreaEntries, getAllAreaEntriesForYear } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const areaId = searchParams.get('area');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!areaId || areaId === 'all') {
      return apiJson(await getAllAreaEntriesForYear(year));
    }

    return apiJson(await getAreaEntries(parseInt(areaId), year));
  } catch (error: unknown) {
    return apiError('/api/entries GET', error);
  }
}
