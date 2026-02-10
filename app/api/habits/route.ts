import { NextRequest, NextResponse } from 'next/server';
import { getHabits, createHabit } from '@/lib/db';

export async function GET() {
  const habits = getHabits();
  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color } = body;
  
  if (!name || !color) {
    return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
  }
  
  try {
    const habit = createHabit(name, color);
    return NextResponse.json(habit);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create habit';
    if (message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A habit with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
