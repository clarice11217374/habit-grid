import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { deleteSeed, getSeeds, renameSeed } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return apiJson(getSeeds());
  } catch (error: unknown) {
    return apiError('/api/seeds GET', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const from = typeof body.from === 'string' ? body.from : '';
    const to = typeof body.to === 'string' ? body.to : '';
    renameSeed(from, to);
    return apiJson({ ok: true });
  } catch (error: unknown) {
    return apiError('/api/seeds PATCH', error, 'Failed to rename seed');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name') || '';
    deleteSeed(name);
    return apiJson({ ok: true });
  } catch (error: unknown) {
    return apiError('/api/seeds DELETE', error, 'Failed to delete seed');
  }
}
