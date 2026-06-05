import { NextResponse } from 'next/server';
import { getSeeds } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getSeeds());
}
