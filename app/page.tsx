'use client';

import { useState, useEffect, useCallback } from 'react';
import HabitGrid from '@/components/HabitGrid';
import MiniHabitGrid from '@/components/MiniHabitGrid';
import ViewToggle from '@/components/ViewToggle';
import AddHabitModal from '@/components/AddHabitModal';
import { Habit, Entry } from '@/lib/db';

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeHabit, setActiveHabit] = useState<number | null>(null); // null = dashboard view
  const [view, setView] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeHabitData = habits.find(h => h.id === activeHabit);

  // Fetch habits on mount
  useEffect(() => {
    fetch('/api/habits')
      .then(res => res.json())
      .then(setHabits);
  }, []);

  // Fetch all entries for dashboard
  useEffect(() => {
    fetch(`/api/entries?habit=all&year=${year}`)
      .then(res => res.json())
      .then(setAllEntries);
  }, [year]);

  // Fetch entries for single habit view
  useEffect(() => {
    if (activeHabit !== null) {
      fetch(`/api/entries?habit=${activeHabit}&year=${year}`)
        .then(res => res.json())
        .then(setEntries);
    }
  }, [activeHabit, year]);

  const handleToggle = useCallback(async (date: string, completed: boolean) => {
    if (activeHabit === null) return;
    
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId: activeHabit, date, completed }),
    });
    
    if (res.ok) {
      const updated = await res.json();
      setEntries(prev => {
        const existing = prev.findIndex(e => e.date === date);
        if (existing >= 0) {
          const newEntries = [...prev];
          newEntries[existing] = updated;
          return newEntries;
        }
        return [...prev, updated];
      });
      // Also update allEntries for dashboard
      setAllEntries(prev => {
        const existing = prev.findIndex(e => e.date === date && e.habit_id === activeHabit);
        if (existing >= 0) {
          const newEntries = [...prev];
          newEntries[existing] = updated;
          return newEntries;
        }
        return [...prev, updated];
      });
    }
  }, [activeHabit]);

  const handleAddHabit = async (name: string, color: string) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create habit');
    }
    
    const newHabit = await res.json();
    setHabits(prev => [...prev, newHabit]);
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Dashboard View
  if (activeHabit === null) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Habit Grid</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Habit
            </button>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold">{year}</h2>
            
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setYear(new Date().getFullYear())}
              className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              This Year
            </button>
          </div>

          {/* Dashboard Grid */}
          {habits.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-400 text-lg mb-4">No habits yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map(habit => {
                const habitEntries = allEntries.filter(e => e.habit_id === habit.id);
                return (
                  <MiniHabitGrid
                    key={habit.id}
                    habitId={habit.id}
                    habitName={habit.name}
                    color={habit.color}
                    year={year}
                    entries={habitEntries}
                    onClick={() => setActiveHabit(habit.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Add Habit Modal */}
          <AddHabitModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddHabit}
          />
        </div>
      </main>
    );
  }

  // Single Habit Detail View
  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveHabit(null)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: activeHabitData?.color }}
            />
            <h1 className="text-3xl font-bold">{activeHabitData?.name}</h1>
          </div>
          
          <div className="flex-1" />
          
          <ViewToggle view={view} onToggle={setView} />
        </div>

        {/* Year/Month Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => view === 'year' ? setYear(y => y - 1) : setMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-semibold min-w-[160px] text-center">
            {view === 'year' ? year : `${MONTHS[month]} ${year}`}
          </h2>
          
          <button
            onClick={() => view === 'year' ? setYear(y => y + 1) : setMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              setYear(new Date().getFullYear());
              setMonth(new Date().getMonth());
            }}
            className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Grid */}
        <div className="bg-zinc-800/50 rounded-xl p-6">
          {activeHabitData && (
            <HabitGrid
              habitId={activeHabit}
              color={activeHabitData.color}
              view={view}
              year={year}
              month={month}
              entries={entries}
              onToggle={handleToggle}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-sm text-zinc-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: activeHabitData?.color, opacity: 0.4 }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: activeHabitData?.color, opacity: 0.7 }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: activeHabitData?.color }}
          />
          <span>More</span>
        </div>

        {/* Stats */}
        <div className="mt-8 p-6 bg-zinc-800/50 rounded-xl">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-zinc-400 text-sm mb-1">Completed</div>
              <div className="text-3xl font-bold">
                {entries.filter(e => e.completed === 1).length}
                <span className="text-lg text-zinc-500 font-normal ml-2">days</span>
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm mb-1">Completion Rate</div>
              <div className="text-3xl font-bold">
                {Math.round((entries.filter(e => e.completed === 1).length / (view === 'year' ? 365 : new Date(year, month + 1, 0).getDate())) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm mb-1">Current Streak</div>
              <div className="text-3xl font-bold" style={{ color: activeHabitData?.color }}>
                {(() => {
                  const entryMap = new Map(entries.map(e => [e.date, e.completed === 1]));
                  let streak = 0;
                  const today = new Date();
                  for (let i = 0; i <= 365; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    if (entryMap.get(dateStr)) {
                      streak++;
                    } else {
                      break;
                    }
                  }
                  return streak;
                })()}
                <span className="text-lg text-zinc-500 font-normal ml-2">🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
