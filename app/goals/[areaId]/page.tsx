'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import HabitGrid from '@/components/HabitGrid';
import type { Area, AreaGoal, Entry, LifeCommit } from '@/lib/db';
import { getAreaVisual } from '@/lib/constants';

function localYear() {
  return new Date().getFullYear();
}

function CommitRow({ commit }: { commit: LifeCommit }) {
  return (
    <div className="border-b border-zinc-700/60 last:border-b-0 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-zinc-500">{commit.date}</span>
        <span className="font-medium">{commit.title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900/70 text-zinc-400">{commit.type}</span>
      </div>
      {commit.description && <p className="text-sm text-zinc-400 mt-1">{commit.description}</p>}
    </div>
  );
}

export default function GoalPage() {
  const params = useParams<{ areaId: string }>();
  const areaId = Number(params.areaId);
  const [area, setArea] = useState<Area | null>(null);
  const [goal, setGoal] = useState<AreaGoal | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [commits, setCommits] = useState<LifeCommit[]>([]);
  const [year, setYear] = useState(localYear());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const areaVisual = getAreaVisual(areaId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [goalRes, entriesRes, commitsRes] = await Promise.all([
        fetch(`/api/goals/${areaId}`, { cache: 'no-store' }),
        fetch(`/api/entries?area=${areaId}&year=${year}`, { cache: 'no-store' }),
        fetch(`/api/commits?area=${areaId}&limit=20`, { cache: 'no-store' }),
      ]);

      if (cancelled) return;

      if (goalRes.ok) {
        const body = await goalRes.json();
        setArea(body?.area || null);
        setGoal(body?.goal || null);
      } else {
        setError('Area not found');
      }
      const [entriesData, commitsData] = await Promise.all([entriesRes.json(), commitsRes.json()]);
      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setCommits(Array.isArray(commitsData) ? commitsData : []);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [areaId, year]);

  const updateField = (key: keyof Omit<AreaGoal, 'areaId' | 'updatedAt' | 'visionImages'>, value: string) => {
    setGoal(current => current ? { ...current, [key]: value } : current);
  };

  const updateImages = (value: string) => {
    setGoal(current => current ? { ...current, visionImages: value.split('\n').map(url => url.trim()).filter(Boolean) } : current);
  };

  const saveGoal = async () => {
    if (!goal) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`/api/goals/${areaId}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sixMonthGoal: goal.sixMonthGoal,
          threeYearGoal: goal.threeYearGoal,
          focusPoints: goal.focusPoints,
          visionText: goal.visionText,
          visionImages: goal.visionImages,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save goal');
      }

      const goalData = await res.json();
      setGoal(goalData && typeof goalData === 'object' && !Array.isArray(goalData) ? goalData : goal);
      const [entriesRes, commitsRes] = await Promise.all([
        fetch(`/api/entries?area=${areaId}&year=${year}`, { cache: 'no-store' }),
        fetch(`/api/commits?area=${areaId}&limit=20`, { cache: 'no-store' }),
      ]);
      const [entriesData, commitsData] = await Promise.all([entriesRes.json(), commitsRes.json()]);
      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setCommits(Array.isArray(commitsData) ? commitsData : []);
      setMessage('Saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title={area?.name || 'Area Goal'} description="Goals, recent commits, and contribution history.">
      <div className="lc-grid">
        <section className="area-hero" style={{ backgroundImage: `url("${areaVisual.coverImage}")`, borderBottom: `3px solid ${area?.color || 'var(--border-color)'}` }}>
          <div className="area-hero-content">
            <span className="area-hero-emoji">{areaVisual.emoji}</span>
            <div>
              <h2>{area?.name || 'Area'}</h2>
              <p>{entries.reduce((sum, entry) => sum + entry.count, 0)} commits recorded in {year}</p>
            </div>
          </div>
        </section>

        <section className="lc-card lc-card-content">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="lc-section-title">Goals</h2>
            <button type="button" onClick={saveGoal} disabled={!goal || saving} className="lc-button lc-button-primary">
              {saving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
          <div className="goal-summary-grid">
            <article className="goal-summary-card">
              <h3>6-month goal</h3>
              <span className="goal-summary-status">{goal?.sixMonthGoal ? 'In Progress' : 'Not Set'}</span>
              <p>{goal?.sixMonthGoal || 'Define the next meaningful milestone for this area.'}</p>
            </article>
            <article className="goal-summary-card">
              <h3>3-year goal</h3>
              <span className="goal-summary-status">{goal?.threeYearGoal ? 'In Progress' : 'Not Set'}</span>
              <p>{goal?.threeYearGoal || 'Describe the longer-term direction for this area.'}</p>
            </article>
          </div>
        </section>

        <section className="lc-card lc-card-content">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="lc-section-title">Goal details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">6-month goal</label>
              <textarea
                value={goal?.sixMonthGoal || ''}
                onChange={(event) => updateField('sixMonthGoal', event.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">3-year goal</label>
              <textarea
                value={goal?.threeYearGoal || ''}
                onChange={(event) => updateField('threeYearGoal', event.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Focus points</label>
              <textarea
                value={goal?.focusPoints || ''}
                onChange={(event) => updateField('focusPoints', event.target.value)}
                rows={5}
                placeholder="One focus point per line"
                className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Vision text</label>
              <textarea
                value={goal?.visionText || ''}
                onChange={(event) => updateField('visionText', event.target.value)}
                rows={5}
                className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-zinc-400 mb-2">Vision images</label>
            <textarea
              value={(goal?.visionImages || []).join('\n')}
              onChange={(event) => updateImages(event.target.value)}
              rows={3}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
          </div>

          {(message || error) && (
            <div className={`mt-4 text-sm ${error ? 'text-red-400' : 'text-zinc-400'}`}>
              {error || message}
            </div>
          )}
        </section>

        {goal && goal.visionImages.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {goal.visionImages.map(url => (
              <div key={url} className="bg-zinc-800/50 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-48 object-cover" />
              </div>
            ))}
          </section>
        )}

        <section className="lc-card lc-card-content">
          <h2 className="lc-section-title mb-4">Recent commits under this area</h2>
          {commits.length === 0 ? <p className="text-zinc-400">No commits in this area yet</p> : commits.map(commit => <CommitRow key={commit.id} commit={commit} />)}
        </section>

        <section className="lc-card lc-card-content">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setYear(value => value - 1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">‹</button>
            <h2 className="lc-section-title">{year} contributions</h2>
            <button onClick={() => setYear(value => value + 1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">›</button>
          </div>
          {area && <HabitGrid habitId={area.id} color={area.color} view="year" year={year} month={0} entries={entries} />}
        </section>
      </div>
    </DashboardShell>
  );
}
