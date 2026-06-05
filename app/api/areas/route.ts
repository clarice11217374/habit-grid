import { NextResponse } from 'next/server';
import { getAreas } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getAreas());
}
