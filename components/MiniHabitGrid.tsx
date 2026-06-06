'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/db';
import { heatmapColor, heatmapTooltip } from '@/lib/heatmap';

interface MiniHabitGridProps {
  habitName: string;
  color: string;
  year: number;
  entries: Entry[];
  onClick: () => void;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function MiniHabitGrid({ habitName, color, year, entries = [], onClick }: MiniHabitGridProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, Pick<Entry, 'count' | 'titles'>>();
    entries.forEach(entry => map.set(entry.date, { count: entry.count, titles: entry.titles || [] }));
    return map;
  }, [entries]);

  const weeks = useMemo(() => {
    const days = getDaysInYear(year);
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

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

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length) result.push(currentWeek);

    return result;
  }, [year]);

  const activeDays = entries.filter(entry => entry.completed === 1).length;
  const totalCommits = entries.reduce((sum, entry) => sum + entry.count, 0);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      if ((entryMap.get(dateStr)?.count || 0) > 0) {
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
      className="lc-card p-4 hover:bg-zinc-800 transition-all cursor-pointer group"
    >
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

      <div className="overflow-hidden mb-3">
        <div className="flex gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => {
                const date = day ? formatDate(day) : '';
                const entry = date ? entryMap.get(date) : undefined;
                const count = entry?.count || 0;
                return (
                  <div
                    key={dayIndex}
                    className="w-[8px] h-[8px] rounded-[2px]"
                    style={{
                      backgroundColor: !day ? 'transparent' : heatmapColor(color, count),
                    }}
                    title={day ? heatmapTooltip(date, count, entry?.titles) : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {totalCommits} commits · {activeDays} days
        </span>
        {currentStreak > 0 && (
          <span className="flex items-center gap-1" style={{ color }}>
            {currentStreak} day streak
          </span>
        )}
      </div>
    </div>
  );
}
