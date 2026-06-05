'use client';

import { useMemo } from 'react';
import type { Entry } from '@/lib/db';

interface HabitGridProps {
  habitId: number;
  color: string;
  view: 'year' | 'month';
  year: number;
  month: number;
  entries: Entry[];
}

function getColorIntensity(baseColor: string, count: number): string {
  if (count <= 0) return 'var(--grid-empty)';
  if (count === 1) return `${baseColor}88`;
  if (count === 2) return `${baseColor}cc`;
  return baseColor;
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
    const map = new Map<string, number>();
    entries.forEach(entry => map.set(entry.date, entry.count));
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
  entryMap: Map<string, number>;
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
      <div className="flex mb-2 text-xs text-zinc-500 pl-8">
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            style={{ marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels.find(label => label.weekIndex < weekIndex)?.weekIndex || 0)) * 14 - 20}px` }}
            className="first:ml-0"
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
                  count={day ? entryMap.get(formatDate(day)) || 0 : 0}
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
                count={day ? entryMap.get(formatDate(day)) || 0 : 0}
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
  count: number;
  size: 'small' | 'large';
  showDate?: boolean;
}

function DayCell({ day, color, count, size, showDate }: DayCellProps) {
  if (!day) {
    return <div className={size === 'small' ? 'w-[11px] h-[11px]' : 'w-10 h-10'} />;
  }

  const isToday = formatDate(day) === formatDate(new Date());
  const bgColor = getColorIntensity(color, count);

  return (
    <div
      className={`
        ${size === 'small' ? 'w-[11px] h-[11px] rounded-sm' : 'w-10 h-10 rounded-md'}
        transition-all hover:scale-110 hover:ring-2 hover:ring-white/30
        ${isToday ? 'ring-2 ring-white/50' : ''}
        flex items-center justify-center
      `}
      style={{ backgroundColor: bgColor }}
      title={`${day.toDateString()}${count > 0 ? ` - ${count} commits` : ''}`}
    >
      {showDate && size === 'large' && (
        <span className={`text-xs ${count > 0 ? 'text-white/90' : 'text-zinc-500'}`}>
          {day.getDate()}
        </span>
      )}
    </div>
  );
}
