'use client';

import { useMemo } from 'react';
import { Entry } from '@/lib/db';

interface HabitGridProps {
  habitId: number;
  color: string;
  view: 'year' | 'month';
  year: number;
  month: number;
  entries: Entry[];
  onToggle: (date: string, completed: boolean) => void;
}

function getColorIntensity(baseColor: string, completed: boolean): string {
  if (!completed) return '#27272a'; // zinc-800
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

export default function HabitGrid({ habitId, color, view, year, month, entries, onToggle }: HabitGridProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, boolean>();
    entries.forEach(e => map.set(e.date, e.completed === 1));
    return map;
  }, [entries]);

  const handleClick = (date: Date) => {
    const dateStr = formatDate(date);
    const currentlyCompleted = entryMap.get(dateStr) || false;
    onToggle(dateStr, !currentlyCompleted);
  };

  if (view === 'year') {
    return <YearGrid year={year} color={color} entryMap={entryMap} onToggle={handleClick} />;
  }
  return <MonthGrid year={year} month={month} color={color} entryMap={entryMap} onToggle={handleClick} />;
}

interface GridProps {
  year: number;
  month?: number;
  color: string;
  entryMap: Map<string, boolean>;
  onToggle: (date: Date) => void;
}

function YearGrid({ year, color, entryMap, onToggle }: GridProps) {
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

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d !== null);
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
      {/* Month labels */}
      <div className="flex mb-2 text-xs text-zinc-500 pl-8">
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            style={{ marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels.find(l => l.weekIndex < weekIndex)?.weekIndex || 0)) * 14 - 20}px` }}
            className="first:ml-0"
          >
            {month}
          </span>
        ))}
      </div>
      
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-around mr-2 text-xs text-zinc-500">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>
        
        {/* Grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <DayCell
                  key={dayIndex}
                  day={day}
                  color={color}
                  completed={day ? entryMap.get(formatDate(day)) || false : false}
                  onToggle={onToggle}
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

function MonthGrid({ year, month, color, entryMap, onToggle }: GridProps & { month: number }) {
  const weeks = useMemo(() => {
    const days = getDaysInMonth(year, month);
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
  }, [year, month]);

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS.map(day => (
          <div key={day} className="text-center text-sm text-zinc-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid */}
      <div className="flex flex-col gap-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => (
              <DayCell
                key={dayIndex}
                day={day}
                color={color}
                completed={day ? entryMap.get(formatDate(day)) || false : false}
                onToggle={onToggle}
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
  completed: boolean;
  onToggle: (date: Date) => void;
  size: 'small' | 'large';
  showDate?: boolean;
}

function DayCell({ day, color, completed, onToggle, size, showDate }: DayCellProps) {
  if (!day) {
    return <div className={size === 'small' ? 'w-[11px] h-[11px]' : 'w-10 h-10'} />;
  }
  
  const isToday = formatDate(day) === formatDate(new Date());
  const bgColor = getColorIntensity(color, completed);
  
  return (
    <button
      onClick={() => onToggle(day)}
      className={`
        ${size === 'small' ? 'w-[11px] h-[11px] rounded-sm' : 'w-10 h-10 rounded-md'}
        transition-all hover:scale-110 hover:ring-2 hover:ring-white/30
        ${isToday ? 'ring-2 ring-white/50' : ''}
        flex items-center justify-center
      `}
      style={{ backgroundColor: bgColor }}
      title={`${day.toDateString()}${completed ? ' ✓' : ''}`}
    >
      {showDate && size === 'large' && (
        <span className={`text-xs ${completed ? 'text-white/90' : 'text-zinc-500'}`}>
          {day.getDate()}
        </span>
      )}
    </button>
  );
}
