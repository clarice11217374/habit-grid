import { apiError, apiJson } from '@/lib/api';
import { getAreas } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(getAreas());
  } catch (error: unknown) {
    return apiError('/api/areas GET', error);
  }
}
