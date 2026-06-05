'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import type { LifeCommit } from '@/lib/db';

interface SeedGroup {
  seed: string;
  count: number;
  lastDate: string;
  commits: LifeCommit[];
}

export default function SeedsPage() {
  const [seeds, setSeeds] = useState<SeedGroup[]>([]);

  useEffect(() => {
    fetch('/api/seeds')
      .then(res => res.json())
      .then(setSeeds);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-1">Clarice Life Commit</p>
            <h1 className="text-3xl font-bold">Seeds</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>

        <section className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <p className="text-zinc-300">
            Seeds are commits that may grow long-term value: future applications, career capital, health foundations, skills, and relationships.
          </p>
        </section>

        {seeds.length === 0 ? (
          <div className="bg-zinc-800/50 rounded-xl p-8 text-center text-zinc-400">
            Add a Future Seed when creating a commit to see it here.
          </div>
        ) : (
          <div className="space-y-4">
            {seeds.map(group => (
              <section key={group.seed} className="bg-zinc-800/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{group.seed}</h2>
                    <p className="text-sm text-zinc-500">{group.count} commits · latest {group.lastDate}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.commits.slice(0, 6).map(commit => (
                    <div key={commit.id} className="border-b border-zinc-700/60 last:border-b-0 pb-3 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-zinc-500">{commit.date}</span>
                        <span className="font-medium">{commit.title}</span>
                        <span className="text-sm" style={{ color: commit.areaColor }}>{commit.areaName}</span>
                      </div>
                      {commit.description && <p className="text-sm text-zinc-400 mt-1">{commit.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
