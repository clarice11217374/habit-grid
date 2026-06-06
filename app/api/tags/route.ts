import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { deleteTag, getTags, renameTag } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(await getTags());
  } catch (error: unknown) {
    return apiError('/api/tags GET', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const from = typeof body.from === 'string' ? body.from : '';
    const to = typeof body.to === 'string' ? body.to : '';
    await renameTag(from, to);
    return apiJson(await getTags());
  } catch (error: unknown) {
    return apiError('/api/tags PATCH', error, 'Failed to rename tag');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name') || '';
    await deleteTag(name);
    return apiJson(await getTags());
  } catch (error: unknown) {
    return apiError('/api/tags DELETE', error, 'Failed to delete tag');
  }
}
