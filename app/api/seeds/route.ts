import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { deleteSeed, getSeeds, renameSeed } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(await getSeeds());
  } catch (error: unknown) {
    return apiError('/api/seeds GET', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const from = typeof body.from === 'string' ? body.from : '';
    const to = typeof body.to === 'string' ? body.to : '';
    await renameSeed(from, to);
    return apiJson(await getSeeds());
  } catch (error: unknown) {
    return apiError('/api/seeds PATCH', error, 'Failed to rename seed');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name') || '';
    await deleteSeed(name);
    return apiJson(await getSeeds());
  } catch (error: unknown) {
    return apiError('/api/seeds DELETE', error, 'Failed to delete seed');
  }
}
