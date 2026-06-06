import { apiError, apiJson } from '@/lib/api';
import { getDashboardStats } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(await getDashboardStats());
  } catch (error: unknown) {
    return apiError('/api/dashboard GET', error);
  }
}
