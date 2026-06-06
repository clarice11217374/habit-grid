import { NextResponse } from 'next/server';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

export function apiJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...init.headers },
  });
}

export function apiError(route: string, error: unknown, fallback = 'Internal server error') {
  console.error(`[api] ${route} failed`, error);
  const message = error instanceof Error ? error.message : fallback;
  return apiJson({ error: message }, { status: 500 });
}
