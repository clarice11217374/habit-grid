import { NextResponse } from 'next/server';

export function apiError(route: string, error: unknown, fallback = 'Internal server error') {
  console.error(`[api] ${route} failed`, error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
