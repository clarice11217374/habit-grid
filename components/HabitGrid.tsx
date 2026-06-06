'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/db';
import { heatmapColor, heatmapTooltip } from '@/lib/heatmap';

interface HabitGridProps {
  habitId: number;
  color: string;
  view: 'year' | 'month';
  year: number;
  month: number;
  entries: Entry[];
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

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitGrid({ color, view, year, month, entries }: HabitGridProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, Pick<Entry, 'count' | 'titles'>>();
    entries.forEach(entry => map.set(entry.date, { count: entry.count, titles: entry.titles || [] }));
    return map;
  }, [entries]);

  if (view === 'year') {
    return <YearGrid year={year} color={color} entryMap={entryMap} />;
  }
  return <MonthGrid year={year} month={month} color={color} entryMap={entryMap} />;
}

interface GridProps {
  year: number;
  month?: number;
  color: string;
  entryMap: Map<string, Pick<Entry, 'count' | 'titles'>>;
}

function YearGrid({ year, color, entryMap }: GridProps) {
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

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(day => day !== null);
      if (firstValidDay) {
        const month = firstValidDay.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid mb-2 text-xs text-zinc-500 pl-8"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)`, columnGap: '3px' }}
      >
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            style={{ gridColumnStart: weekIndex + 1 }}
          >
            {month}
          </span>
        ))}
      </div>

      <div className="flex">
        <div className="flex flex-col justify-around mr-2 text-xs text-zinc-500">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>

        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <DayCell
                  key={dayIndex}
                  day={day}
                  color={color}
                  entry={day ? entryMap.get(formatDate(day)) : undefined}
                  size="small"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function MonthGrid({ year, month, color, entryMap }: GridProps & { month: number }) {
  const weeks = useMemo(() => {
    const days = getDaysInMonth(year, month);
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
  }, [year, month]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-sm text-zinc-500">
            {day}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => (
              <DayCell
                key={dayIndex}
                day={day}
                color={color}
                entry={day ? entryMap.get(formatDate(day)) : undefined}
                size="large"
                showDate
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DayCellProps {
  day: Date | null;
  color: string;
  entry?: Pick<Entry, 'count' | 'titles'>;
  size: 'small' | 'large';
  showDate?: boolean;
}

function DayCell({ day, color, entry, size, showDate }: DayCellProps) {
  if (!day) {
    return <div className={size === 'small' ? 'w-[11px] h-[11px]' : 'w-10 h-10'} />;
  }

  const isToday = formatDate(day) === formatDate(new Date());
  const count = entry?.count || 0;
  const bgColor = heatmapColor(color, count);

  return (
    <div
      className={`
        ${size === 'small' ? 'w-[11px] h-[11px] rounded-sm' : 'w-10 h-10 rounded-md'}
        transition-all hover:scale-110 hover:ring-2 hover:ring-white/30
        ${isToday ? 'ring-2 ring-white/50' : ''}
        flex items-center justify-center
      `}
      style={{ backgroundColor: bgColor }}
      title={heatmapTooltip(formatDate(day), count, entry?.titles)}
    >
      {showDate && size === 'large' && (
        <span className={`text-xs ${count > 0 ? 'text-white/90' : 'text-zinc-500'}`}>
          {day.getDate()}
        </span>
      )}
    </div>
  );
}
