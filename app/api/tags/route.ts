import { NextRequest, NextResponse } from 'next/server';
import { deleteTag, getTags, renameTag } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getTags());
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const from = typeof body.from === 'string' ? body.from : '';
  const to = typeof body.to === 'string' ? body.to : '';

  try {
    renameTag(from, to);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to rename tag';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';

  try {
    deleteTag(name);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete tag';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
