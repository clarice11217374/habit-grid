import { apiError, apiJson } from '@/lib/api';
import { getAreas } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return apiJson(await getAreas());
  } catch (error: unknown) {
    return apiError('/api/areas GET', error);
  }
}
