'use client';

import { Habit } from '@/lib/db';

interface HabitTabsProps {
  habits: Habit[];
  activeHabit: number;
  onSelect: (id: number) => void;
}

export default function HabitTabs({ habits, activeHabit, onSelect }: HabitTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      {habits.map((habit) => (
        <button
          key={habit.id}
          onClick={() => onSelect(habit.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeHabit === habit.id
              ? 'text-white shadow-lg scale-105'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
          style={activeHabit === habit.id ? { backgroundColor: habit.color } : {}}
        >
          {habit.name}
        </button>
      ))}
    </div>
  );
}
