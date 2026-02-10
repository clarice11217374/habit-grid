import { NextRequest, NextResponse } from 'next/server';
import { getEntries, upsertEntry, getAllEntriesForYear } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const habitId = searchParams.get('habit');
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  
  // If no habit specified, return all entries for the year
  if (!habitId || habitId === 'all') {
    const entries = getAllEntriesForYear(year);
    return NextResponse.json(entries);
  }
  
  const entries = getEntries(parseInt(habitId), year);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { habitId, date, completed } = body;
  
  if (!habitId || !date || completed === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const entry = upsertEntry(habitId, date, completed);
  return NextResponse.json(entry);
}
