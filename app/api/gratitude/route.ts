import { NextRequest, NextResponse } from 'next/server';
import { createGratitudeEntry, getGratitudeEntries } from '@/lib/db';

function todayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || todayDate();
  return NextResponse.json(getGratitudeEntries(date));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const date = typeof body.date === 'string' && body.date ? body.date : todayDate();

  if (!text) {
    return NextResponse.json({ error: 'Gratitude text is required' }, { status: 400 });
  }

  try {
    return NextResponse.json(createGratitudeEntry(date, text), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save gratitude';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
