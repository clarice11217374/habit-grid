import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { getArea, getAreaGoal, updateAreaGoal } from '@/lib/db';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ areaId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { areaId } = await context.params;
    const id = Number(areaId);
    const area = getArea(id);

    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    return NextResponse.json({ area, goal: getAreaGoal(id) });
  } catch (error: unknown) {
    return apiError('/api/goals/[areaId] GET', error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { areaId } = await context.params;
    const id = Number(areaId);
    const body = await request.json();
    const visionImages = Array.isArray(body.visionImages)
      ? body.visionImages.filter((url: unknown) => typeof url === 'string')
      : typeof body.visionImages === 'string'
        ? body.visionImages.split('\n')
        : [];

    const goal = updateAreaGoal(id, {
      sixMonthGoal: typeof body.sixMonthGoal === 'string' ? body.sixMonthGoal : '',
      threeYearGoal: typeof body.threeYearGoal === 'string' ? body.threeYearGoal : '',
      focusPoints: typeof body.focusPoints === 'string' ? body.focusPoints : '',
      visionText: typeof body.visionText === 'string' ? body.visionText : '',
      visionImages,
    });
    return NextResponse.json(goal);
  } catch (error: unknown) {
    return apiError('/api/goals/[areaId] PUT', error, 'Failed to save goal');
  }
}
