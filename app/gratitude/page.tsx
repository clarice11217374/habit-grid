'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import type { GratitudeEntry, GratitudeOverview } from '@/lib/db';

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

function grammarSuggestion(value: string) {
  let next = value;
  const replacements: [RegExp, string][] = [
    [/\bI am gratitude for\b/gi, 'I am grateful for'],
    [/\bI gratitude for\b/gi, 'I am grateful for'],
    [/\bI am thankful I\b/gi, 'I am thankful that I'],
    [/\b(it|this|that) help me practice\b/gi, '$1 helps me practice'],
    [/\bI cook myself\b/gi, 'I made myself'],
    [/\barrive today\b/gi, 'arrived today'],
    [/\bwork me up\b/gi, 'woke me up'],
    [/\bit also help me\b/gi, 'it also helps me'],
  ];
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  return next.trim() && next !== value ? next : '';
}

const EMPTY_OVERVIEW: GratitudeOverview = {
  totalGratitudes: 0,
  currentStreak: 0,
  longestStreak: 0,
  uniqueWords: 0,
  topKeywords: [],
  dailyCounts: [],
  timeline: [],
};

function heartColor(count: number) {
  if (count === 0) return 'var(--grid-empty)';
  if (count <= 3) return '#fbcfe8';
  if (count <= 6) return '#f472b6';
  if (count <= 9) return '#db2777';
  return '#ef4444';
}

function HeartHeatmap({ dailyCounts }: { dailyCounts: GratitudeOverview['dailyCounts'] }) {
  const countMap = new Map(dailyCounts.map(day => [day.date, day.count]));
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (364 - index));
    const dateString = localDate(date);
    return { date: dateString, count: countMap.get(dateString) || 0 };
  });

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max">
        {days.map(day => (
          <div
            key={day.date}
            title={`${day.date} - ${day.count} gratitudes`}
            className="w-[12px] h-[12px] text-[10px] leading-[12px] text-center"
            style={{ color: heartColor(day.count) }}
          >
            ♥
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GratitudePage() {
  const today = localDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [overview, setOverview] = useState<GratitudeOverview>(EMPTY_OVERVIEW);
  const [text, setText] = useState('');
  const [dismissedSuggestion, setDismissedSuggestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const suggestion = grammarSuggestion(text);
  const visibleSuggestion = suggestion && suggestion !== dismissedSuggestion ? suggestion : '';

  const loadData = useCallback(async () => {
    const [entriesRes, overviewRes] = await Promise.all([
      fetch(`/api/gratitude?date=${selectedDate}`, { cache: 'no-store' }),
      fetch('/api/gratitude?overview=1', { cache: 'no-store' }),
    ]);
    setEntries(entriesRes.ok ? await entriesRes.json() : []);
    setOverview(overviewRes.ok ? await overviewRes.json() : EMPTY_OVERVIEW);
  }, [selectedDate]);

  useEffect(() => {
    loadData().catch(() => {
      setEntries([]);
      setOverview(EMPTY_OVERVIEW);
    });
  }, [loadData]);

  const maxKeywordCount = useMemo(
    () => Math.max(1, ...overview.topKeywords.map(keyword => keyword.count)),
    [overview.topKeywords],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!text.trim()) {
      setError('Write one thing you are grateful for');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gratitude', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, text: text.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to save gratitude');
      setText('');
      setDismissedSuggestion('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save gratitude');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Clarice Life Commit</p>
            <h1 className="text-3xl font-bold">Gratitude — {selectedDate}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>

        <section className="bg-zinc-800/50 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setSelectedDate(today)} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Today</button>
            <button onClick={() => setSelectedDate(date => shiftDate(date, -1))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Previous Day</button>
            <button onClick={() => setSelectedDate(date => shiftDate(date, 1))} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Next Day</button>
            <input
              type="date"
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value || today)}
              className="px-3 py-2 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <span className="ml-auto text-sm text-zinc-500">{entries.length} / 10 {selectedDate === today ? 'today' : selectedDate}</span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <textarea
            value={text}
            onChange={event => { setText(event.target.value); setDismissedSuggestion(''); }}
            rows={3}
            placeholder="I am grateful for..."
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          {visibleSuggestion && (
            <div className="mt-3 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-4">
              <div className="text-sm font-medium mb-1">Grammar suggestion:</div>
              <p className="text-sm text-zinc-400 mb-3">{visibleSuggestion}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setText(visibleSuggestion); setDismissedSuggestion(''); }} className="px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-sm">Accept suggestion</button>
                <button type="button" onClick={() => setDismissedSuggestion(visibleSuggestion)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Keep original</button>
              </div>
            </div>
          )}
          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading || entries.length >= 10} className="mt-4 px-5 py-2 bg-white text-zinc-950 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Gratitude'}
          </button>
        </form>

        <section className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">Gratitude — {selectedDate}</h2>
          {entries.length === 0 ? <p className="text-zinc-400">No gratitude recorded for this date</p> : (
            <div className="space-y-3">
              {entries.map(entry => <div key={entry.id} className="border-b border-zinc-700/60 last:border-b-0 pb-3 last:pb-0">{entry.text}</div>)}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            ['Total Gratitudes', overview.totalGratitudes],
            ['Current Streak', overview.currentStreak],
            ['Longest Streak', overview.longestStreak],
            ['Unique Words', overview.uniqueWords],
          ].map(([label, value]) => (
            <div key={label} className="bg-zinc-800/50 rounded-xl p-5">
              <div className="text-sm text-zinc-400 mb-1">{label}</div>
              <div className="text-3xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">Heart Heatmap</h2>
          <HeartHeatmap dailyCounts={overview.dailyCounts} />
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-zinc-500">
            {[['0', 0], ['1-3', 1], ['4-6', 4], ['7-9', 7], ['10+', 10]].map(([label, count]) => (
              <span key={label} className="flex items-center gap-1"><span style={{ color: heartColor(Number(count)) }}>♥</span>{label}</span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-800/50 rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Recent Gratitude Timeline</h2>
            {overview.timeline.length === 0 ? <p className="text-zinc-400">No gratitude history yet</p> : overview.timeline.map(group => (
              <div key={group.date} className="mb-5 last:mb-0">
                <h3 className="font-semibold mb-2">{group.date}</h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  {group.entries.map(entry => <div key={entry.id}>- {entry.text}</div>)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-4">Keyword Cloud</h2>
            {overview.topKeywords.length === 0 ? <p className="text-zinc-400">No keywords yet</p> : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {overview.topKeywords.map(keyword => (
                  <span
                    key={keyword.word}
                    title={`${keyword.count} uses`}
                    style={{ fontSize: `${14 + Math.round((keyword.count / maxKeywordCount) * 18)}px`, color: 'var(--text-main)' }}
                  >
                    {keyword.word}
                  </span>
                ))}
              </div>
            )}
            <h3 className="font-semibold mt-8 mb-3">Top Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {overview.topKeywords.slice(0, 10).map(keyword => <span key={keyword.word} className="px-2 py-1 rounded bg-zinc-900/70 text-sm">{keyword.word} · {keyword.count}</span>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
