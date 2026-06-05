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

  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  return next.trim() && next !== value ? next : '';
}

export default function GratitudePage() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [text, setText] = useState('');
  const [dismissedSuggestion, setDismissedSuggestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const today = localDate();
  const suggestion = grammarSuggestion(text);
  const visibleSuggestion = suggestion && suggestion !== dismissedSuggestion ? suggestion : '';

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
      setDismissedSuggestion('');
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
            onChange={(event) => {
              setText(event.target.value);
              setDismissedSuggestion('');
            }}
            rows={3}
            placeholder="I am grateful for..."
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          {visibleSuggestion && (
            <div className="mt-3 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-4">
              <div className="text-sm font-medium mb-1">Grammar suggestion:</div>
              <p className="text-sm text-zinc-400 mb-3">{visibleSuggestion}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setText(visibleSuggestion);
                    setDismissedSuggestion('');
                  }}
                  className="px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-sm"
                >
                  Accept suggestion
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedSuggestion(visibleSuggestion)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                >
                  Keep original
                </button>
              </div>
            </div>
          )}
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
