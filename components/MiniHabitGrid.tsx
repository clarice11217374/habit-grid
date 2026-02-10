'use client';

import { useMemo } from 'react';
import { Entry } from '@/lib/db';

interface MiniHabitGridProps {
  habitId: number;
  habitName: string;
  color: string;
  year: number;
  entries: Entry[];
  onClick: () => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysInYear(year: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MiniHabitGrid({ habitId, habitName, color, year, entries, onClick }: MiniHabitGridProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, boolean>();
    entries.forEach(e => map.set(e.date, e.completed === 1));
    return map;
  }, [entries]);

  const weeks = useMemo(() => {
    const days = getDaysInYear(year);
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    // Pad the first week
    const firstDay = days[0].getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
    
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Pad the last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length) result.push(currentWeek);
    
    return result;
  }, [year]);

  // Stats
  const completed = entries.filter(e => e.completed === 1).length;
  const total = 365 + (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 1 : 0);
  const percentage = Math.round((completed / total) * 100);

  // Calculate streaks
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      if (entryMap.get(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [entryMap]);

  return (
    <div 
      onClick={onClick}
      className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-lg">{habitName}</h3>
        </div>
        <svg 
          className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Mini Grid */}
      <div className="overflow-hidden mb-3">
        <div className="flex gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => {
                const completed = day ? entryMap.get(formatDate(day)) || false : false;
                return (
                  <div
                    key={dayIndex}
                    className="w-[8px] h-[8px] rounded-[2px]"
                    style={{ 
                      backgroundColor: !day ? 'transparent' : completed ? color : '#27272a'
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {completed} days ({percentage}%)
        </span>
        {currentStreak > 0 && (
          <span className="flex items-center gap-1" style={{ color }}>
            🔥 {currentStreak} day streak
          </span>
        )}
      </div>
    </div>
  );
}
