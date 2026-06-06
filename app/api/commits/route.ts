import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { COMMIT_TYPES, createCommit, getCommits } from '@/lib/db';
import type { CommitType } from '@/lib/db';

export const runtime = 'nodejs';

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;
    const areaId = searchParams.get('area') ? Number(searchParams.get('area')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    return NextResponse.json(getCommits({ date, areaId, limit }));
  } catch (error: unknown) {
    return apiError('/api/commits GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      return NextResponse.json({ error: 'Commit title is required' }, { status: 400 });
    }

    const commit = createCommit({ title, description, date, areaId, type, tags, seed });
    return NextResponse.json(commit, { status: 201 });
  } catch (error: unknown) {
    return apiError('/api/commits POST', error, 'Failed to create commit');
  }
}
