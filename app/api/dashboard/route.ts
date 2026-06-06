import { apiError, apiJson } from '@/lib/api';
import { getDashboardStats } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return apiJson(getDashboardStats());
  } catch (error: unknown) {
    return apiError('/api/dashboard GET', error);
  }
}
