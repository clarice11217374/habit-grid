'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import type { GratitudeEntry } from '@/lib/db';

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function GratitudePage() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const today = localDate();

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      const res = await fetch(`/api/gratitude?date=${today}`);
      if (!cancelled) {
        setEntries(await res.json());
      }
    }

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, [today]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, text: text.trim() }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save gratitude');
      }
      setText('');
      const nextEntries = await fetch(`/api/gratitude?date=${today}`);
      setEntries(await nextEntries.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save gratitude');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Clarice Life Commit</p>
            <h1 className="text-3xl font-bold">Gratitude</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm text-zinc-400">Today</label>
            <span className="text-sm text-zinc-500">{entries.length}/10</span>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="I am grateful for..."
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading || entries.length >= 10}
            className="mt-4 px-5 py-2 bg-white text-zinc-950 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Gratitude'}
          </button>
        </form>

        <section className="bg-zinc-800/50 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-4">Today&apos;s Gratitude</h2>
          {entries.length === 0 ? (
            <p className="text-zinc-400">No gratitude recorded today</p>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <div key={entry.id} className="border-b border-zinc-700/60 last:border-b-0 pb-3 last:pb-0">
                  {entry.text}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
