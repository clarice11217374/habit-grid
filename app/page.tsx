'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CommitForm from '@/components/CommitForm';
import DashboardShell from '@/components/DashboardShell';
import HabitGrid from '@/components/HabitGrid';
import MiniHabitGrid from '@/components/MiniHabitGrid';
import ThemeToggle from '@/components/ThemeToggle';
import ViewToggle from '@/components/ViewToggle';
import type { Area, CommitType, DashboardStats, Entry, LifeCommit } from '@/lib/db';
import { getAreaVisual } from '@/lib/constants';

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekStartDate() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return localDate(date);
}

function Recent30Heatmap({ days }: { days: { date: string; count: number }[] }) {
  const counts = new Map(days.map(day => [day.date, day.count]));
  const cells = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const dateStr = localDate(date);
    const count = counts.get(dateStr) || 0;
    return { date: dateStr, count };
  });

  return (
    <div className="flex gap-[3px]">
      {cells.map(cell => (
        <div
          key={cell.date}
          title={`${cell.date} - ${cell.count} commits`}
          className="w-3 h-3 rounded-sm"
          style={{
            backgroundColor: cell.count === 0 ? 'var(--grid-empty)' : cell.count === 1 ? '#22c55e88' : cell.count === 2 ? '#22c55ecc' : '#22c55e',
          }}
        />
      ))}
    </div>
  );
}

function commitImpacts(commit: LifeCommit) {
  if (Array.isArray(commit.impactAreas) && commit.impactAreas.length) return commit.impactAreas;
  if (commit.areaId && commit.areaName) {
    return [{ areaId: commit.areaId, areaName: commit.areaName, areaColor: commit.areaColor || 'var(--text-muted)', impactValue: 1 }];
  }
  return [];
}

function CommitItem({ commit }: { commit: LifeCommit }) {
  return (
    <div className="border-b border-zinc-700/60 last:border-b-0 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{commit.title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">{commit.type}</span>
        {commitImpacts(commit).map(impact => (
          <span key={impact.areaId} className="text-sm" style={{ color: impact.areaColor }}>{impact.areaName}</span>
        ))}
        <span className="text-sm text-zinc-500">{commit.date}</span>
      </div>
      {commit.description && <p className="text-sm text-zinc-400 mt-1">{commit.description}</p>}
      {((commit.tags?.length || 0) > 0 || commit.seed) && (
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-400">
          {(commit.tags || []).map(tag => <span key={tag} className="px-2 py-1 rounded bg-zinc-900/70">{tag}</span>)}
          {commit.seed && <span className="px-2 py-1 rounded bg-zinc-900/70">Seed: {commit.seed}</span>}
        </div>
      )}
    </div>
  );
}

function TodayProgress({ areas, todayCommits }: { areas: Area[]; todayCommits: LifeCommit[] }) {
  const activeAreaIds = new Set(todayCommits.flatMap(commit => commitImpacts(commit).map(impact => impact.areaId)));
  const commitCount = todayCommits.length;
  const percent = Math.min(100, (commitCount / 10) * 100);

  return (
    <section className="bg-zinc-800/50 rounded-xl p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-xl font-semibold">Today Progress</h2>
        <span className="text-sm text-zinc-500">{commitCount} / 10 commits today</span>
      </div>
      <div className="h-3 rounded-full bg-zinc-900/60 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #22c55e, #3b82f6, #a855f7, #06b6d4)',
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {areas.map(area => {
          const active = activeAreaIds.has(area.id);
          return (
            <span
              key={area.id}
              className="px-2.5 py-1 rounded-full text-sm border border-zinc-700/60"
              style={{
                backgroundColor: active ? `${area.color}22` : 'var(--card-soft)',
                color: active ? area.color : 'var(--text-muted)',
                borderColor: active ? `${area.color}55` : 'var(--border-color)',
              }}
            >
              {area.name}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeArea, setActiveArea] = useState<number | null>(null);
  const [view, setView] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [areaEntries, setAreaEntries] = useState<Entry[]>([]);
  const [todayCommits, setTodayCommits] = useState<LifeCommit[]>([]);
  const [recentCommits, setRecentCommits] = useState<LifeCommit[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

  const today = localDate();
  const activeAreaData = areas.find(area => area.id === activeArea);

  async function refresh() {
    const [areasRes, entriesRes, todayRes, recentRes, dashboardRes] = await Promise.all([
      fetch('/api/areas', { cache: 'no-store' }),
      fetch(`/api/entries?area=all&year=${year}`, { cache: 'no-store' }),
      fetch(`/api/commits?date=${today}`, { cache: 'no-store' }),
      fetch('/api/commits?limit=30', { cache: 'no-store' }),
      fetch('/api/dashboard', { cache: 'no-store' }),
    ]);
    const [areasData, entriesData, todayData, recentData, dashboardData] = await Promise.all([
      areasRes.json(), entriesRes.json(), todayRes.json(), recentRes.json(), dashboardRes.json(),
    ]);
    setAreas(Array.isArray(areasData) ? areasData : []);
    setAllEntries(Array.isArray(entriesData) ? entriesData : []);
    setTodayCommits(Array.isArray(todayData) ? todayData : []);
    setRecentCommits(Array.isArray(recentData) ? recentData : []);
    setDashboard(dashboardData && typeof dashboardData === 'object' && !Array.isArray(dashboardData) && !('error' in dashboardData) ? dashboardData : null);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const [areasRes, entriesRes, todayRes, recentRes, dashboardRes] = await Promise.all([
        fetch('/api/areas', { cache: 'no-store' }),
        fetch(`/api/entries?area=all&year=${year}`, { cache: 'no-store' }),
        fetch(`/api/commits?date=${today}`, { cache: 'no-store' }),
        fetch('/api/commits?limit=30', { cache: 'no-store' }),
        fetch('/api/dashboard', { cache: 'no-store' }),
      ]);

      if (!cancelled) {
        const [areasData, entriesData, todayData, recentData, dashboardData] = await Promise.all([
          areasRes.json(), entriesRes.json(), todayRes.json(), recentRes.json(), dashboardRes.json(),
        ]);
        setAreas(Array.isArray(areasData) ? areasData : []);
        setAllEntries(Array.isArray(entriesData) ? entriesData : []);
        setTodayCommits(Array.isArray(todayData) ? todayData : []);
        setRecentCommits(Array.isArray(recentData) ? recentData : []);
        setDashboard(dashboardData && typeof dashboardData === 'object' && !Array.isArray(dashboardData) && !('error' in dashboardData) ? dashboardData : null);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [year, today]);

  useEffect(() => {
    if (activeArea !== null) {
      Promise.all([
        fetch(`/api/entries?area=${activeArea}&year=${year}`, { cache: 'no-store' }),
        fetch(`/api/commits?area=${activeArea}&limit=20`, { cache: 'no-store' }),
      ]).then(async ([entriesRes, commitsRes]) => {
        const [entriesData, commitsData] = await Promise.all([entriesRes.json(), commitsRes.json()]);
        setAreaEntries(Array.isArray(entriesData) ? entriesData : []);
        setRecentCommits(Array.isArray(commitsData) ? commitsData : []);
      });
    }
  }, [activeArea, year]);

  const thisWeekCommits = useMemo(() => {
    const start = weekStartDate();
    return recentCommits.filter(commit => commit.date >= start);
  }, [recentCommits]);

  const weekByType = useMemo(() => {
    const counts = new Map<CommitType, number>();
    for (const commit of thisWeekCommits) {
      counts.set(commit.type, (counts.get(commit.type) || 0) + 1);
    }
    return [...counts.entries()];
  }, [thisWeekCommits]);

  const handleCreateCommit = async (input: {
    title: string;
    description: string;
    impactAreas: string[];
    type: CommitType;
    tags: string[];
    seed: string;
  }) => {
    const res = await fetch('/api/commits', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, date: today }),
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const error = contentType.includes('application/json')
        ? await res.json()
        : { error: `Save Commit failed with HTTP ${res.status}. The server returned a non-JSON response.` };
      throw new Error(error.error || 'Failed to save commit');
    }
    await refresh();
  };

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  if (activeArea !== null) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setActiveArea(null)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeAreaData?.color }} />
              <h1 className="text-3xl font-bold">{activeAreaData?.name}</h1>
            </div>
            <div className="flex-1" />
            <ThemeToggle />
            <ViewToggle view={view} onToggle={setView} />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => view === 'year' ? setYear(value => value - 1) : setMonth(value => value === 0 ? (setYear(yearValue => yearValue - 1), 11) : value - 1)}
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
              onClick={() => view === 'year' ? setYear(value => value + 1) : setMonth(value => value === 11 ? (setYear(yearValue => yearValue + 1), 0) : value + 1)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 mb-6">
            {activeAreaData && (
              <HabitGrid habitId={activeArea} color={activeAreaData.color} view={view} year={year} month={month} entries={areaEntries} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-5">
              <div className="text-zinc-400 text-sm mb-1">Commit Total</div>
              <div className="text-4xl font-bold">{areaEntries.reduce((sum, entry) => sum + entry.count, 0)}</div>
            </div>
            <section className="bg-zinc-800/50 rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-4">Recent Commits</h2>
              {recentCommits.length === 0 ? <p className="text-zinc-400">No commits in this area yet</p> : recentCommits.map(commit => <CommitItem key={commit.id} commit={commit} />)}
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell title="Clarice Life Commit" description="What did you commit today?">
      <div className="lc-grid">

        <TodayProgress areas={areas} todayCommits={todayCommits} />

        <CommitForm areas={areas} onCommit={handleCreateCommit} />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="lc-card lc-stat">
            <div className="text-zinc-400 text-sm mb-1">Total Commits</div>
            <div className="text-4xl font-bold">{dashboard?.totalCommits ?? 0}</div>
          </div>
          <div className="lc-card lc-stat">
            <div className="text-zinc-400 text-sm mb-1">Commit Streak</div>
            <div className="text-4xl font-bold">{dashboard?.streakDays ?? 0}</div>
          </div>
          <div className="lc-card lc-stat">
            <div className="text-zinc-400 text-sm mb-3">Last 30 Days</div>
            <Recent30Heatmap days={dashboard?.recent30 ?? []} />
          </div>
        </section>

        <section className="lc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today</h2>
            <span className="text-sm text-zinc-500">{today}</span>
          </div>
          {todayCommits.length === 0 ? <p className="text-zinc-400">No commits yet today</p> : todayCommits.map(commit => <CommitItem key={commit.id} commit={commit} />)}
        </section>

        <section className="lc-card p-5">
          <h2 className="text-xl font-semibold mb-4">This Week</h2>
          {thisWeekCommits.length === 0 ? (
            <p className="text-zinc-400">No commits this week yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {weekByType.map(([type, count]) => (
                <div key={type} className="bg-zinc-900/60 rounded-lg p-3">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-zinc-400">{type}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lc-card p-5">
          <h2 className="text-xl font-semibold mb-4">Recent Commits</h2>
          {recentCommits.length === 0 ? <p className="text-zinc-400">No commits yet</p> : recentCommits.slice(0, 12).map(commit => <CommitItem key={commit.id} commit={commit} />)}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="lc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Top Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(dashboard?.topTags || []).map(tag => <span key={tag.name} className="px-2 py-1 rounded bg-zinc-900/70 text-sm">{tag.name} · {tag.count}</span>)}
            </div>
          </div>
          <div className="lc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Top Seeds</h2>
            <div className="flex flex-wrap gap-2">
              {(dashboard?.topSeeds || []).map(seed => <span key={seed.name} className="px-2 py-1 rounded bg-zinc-900/70 text-sm">{seed.name} · {seed.count}</span>)}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button onClick={() => setYear(value => value - 1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">{year}</h2>
          <button onClick={() => setYear(value => value + 1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={() => setYear(new Date().getFullYear())} className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            This Year
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map(area => (
            <MiniHabitGrid
              key={area.id}
              habitName={area.name}
              color={area.color}
              emoji={getAreaVisual(area.id).emoji}
              coverImage={getAreaVisual(area.id).coverImage}
              year={year}
              entries={allEntries.filter(entry => entry.area_id === area.id)}
              onClick={() => router.push(`/goals/${area.id}`)}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
