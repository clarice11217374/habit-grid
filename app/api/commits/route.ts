import { NextRequest } from 'next/server';
import { apiError, apiJson } from '@/lib/api';
import { COMMIT_TYPES } from '@/lib/constants';
import type { CommitType } from '@/lib/constants';

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
    const { getCommits } = await import('@/lib/data');
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;
    const areaId = searchParams.get('area') ? Number(searchParams.get('area')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    return apiJson(await getCommits({ date, areaId, limit }));
  } catch (error: unknown) {
    return apiError('/api/commits GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.info('[api] /api/commits POST body', {
      title: body?.title,
      description: body?.description,
      date: body?.date,
      areaId: body?.areaId,
      type: body?.type,
      tags: body?.tags,
      seed: body?.seed,
    });

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const date = typeof body.date === 'string' && body.date ? body.date : todayDate();
    const areaId = Number(body.areaId);
    const type = COMMIT_TYPES.includes(body.type) ? body.type as CommitType : 'Reflection';
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag: unknown) => typeof tag === 'string')
      : typeof body.tags === 'string'
        ? body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];
    const seed = typeof body.seed === 'string' ? body.seed.trim() : '';

    if (!title) {
      return apiJson({ error: 'Commit title is required' }, { status: 400 });
    }

    const { createCommit } = await import('@/lib/data');
    const commit = await createCommit({ title, description, date, areaId, type, tags, seed });
    return apiJson(commit, { status: 201 });
  } catch (error: unknown) {
    return apiError('/api/commits POST', error, 'Failed to create commit');
  }
}
