import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { createGratitudeEntry, getGratitudeEntries, getGratitudeOverview } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('overview') === '1') {
      return apiJson(await getGratitudeOverview());
    }
    const date = request.nextUrl.searchParams.get('date') || todayDate();
    return apiJson(await getGratitudeEntries(date));
  } catch (error: unknown) {
    return apiError('/api/gratitude GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const date = typeof body.date === 'string' && body.date ? body.date : todayDate();

    if (!text) {
      return apiJson({ error: 'Gratitude text is required' }, { status: 400 });
    }

    return apiJson(await createGratitudeEntry(date, text), { status: 201 });
  } catch (error: unknown) {
    return apiError('/api/gratitude POST', error, 'Failed to save gratitude');
  }
}
