'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import type { LifeCommit } from '@/lib/db';

interface SeedGroup {
  seed: string;
  count: number;
  lastDate: string;
  commits: LifeCommit[];
}

interface TagGroup {
  tag: string;
  count: number;
  lastDate: string;
  commits: LifeCommit[];
}

export default function SeedsPage() {
  const [seeds, setSeeds] = useState<SeedGroup[]>([]);
  const [tags, setTags] = useState<TagGroup[]>([]);
  const [editingSeed, setEditingSeed] = useState('');
  const [editingTag, setEditingTag] = useState('');
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    const [seedRes, tagRes] = await Promise.all([
      fetch('/api/seeds', { cache: 'no-store' }),
      fetch('/api/tags', { cache: 'no-store' }),
    ]);
    setSeeds(await seedRes.json());
    setTags(await tagRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function renameSeed(from: string) {
    setError('');
    const to = draftName.trim();
    if (!to) return;

    const res = await fetch('/api/seeds', {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to rename seed');
      return;
    }

    setEditingSeed('');
    setDraftName('');
    await loadData();
  }

  async function removeSeed(name: string) {
    if (!confirm(`Delete seed "${name}" from all related commits?`)) return;
    setError('');

    const res = await fetch(`/api/seeds?name=${encodeURIComponent(name)}`, { method: 'DELETE', cache: 'no-store' });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to delete seed');
      return;
    }

    await loadData();
  }

  async function renameTag(from: string) {
    setError('');
    const to = draftName.trim();
    if (!to) return;

    const res = await fetch('/api/tags', {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to rename tag');
      return;
    }

    setEditingTag('');
    setDraftName('');
    await loadData();
  }

  async function removeTag(name: string) {
    if (!confirm(`Delete tag "${name}" from all related commits?`)) return;
    setError('');

    const res = await fetch(`/api/tags?name=${encodeURIComponent(name)}`, { method: 'DELETE', cache: 'no-store' });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || 'Failed to delete tag');
      return;
    }

    await loadData();
  }

  return (
    <DashboardShell title="Seeds & Tags" description="Manage reusable labels and long-term value.">
      <div className="lc-grid">

        <section className="bg-zinc-800/50 rounded-xl p-5 mb-6">
          <p className="text-zinc-300">
            Manage long-term seeds and reusable tags. Renaming updates related commits; deleting removes the reference from related commits.
          </p>
        </section>

        {error && <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-sm text-red-400">{error}</div>}

        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Seed Manager</h2>
          {seeds.length === 0 ? (
            <div className="bg-zinc-800/50 rounded-xl p-8 text-center text-zinc-400">
              Add a Future Seed when creating a commit to see it here.
            </div>
          ) : seeds.map(group => (
            <section key={group.seed} className="bg-zinc-800/50 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{group.seed}</h3>
                  <p className="text-sm text-zinc-500">{group.count} commits - latest {group.lastDate}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {editingSeed === group.seed ? (
                    <>
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        className="px-3 py-1.5 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                      <button onClick={() => renameSeed(group.seed)} className="px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-sm">Save</button>
                      <button onClick={() => setEditingSeed('')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingSeed(group.seed); setEditingTag(''); setDraftName(group.seed); }} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Rename</button>
                      <button onClick={() => removeSeed(group.seed)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-red-400">Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {group.commits.slice(0, 6).map(commit => (
                  <div key={commit.id} className="border-b border-zinc-700/60 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-zinc-500">{commit.date}</span>
                      <span className="font-medium">{commit.title}</span>
                      {commit.impactAreas.map(impact => (
                        <span key={impact.areaId} className="text-sm" style={{ color: impact.areaColor }}>{impact.areaName}</span>
                      ))}
                    </div>
                    {commit.description && <p className="text-sm text-zinc-400 mt-1">{commit.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Tag Manager</h2>
          {tags.length === 0 ? (
            <div className="bg-zinc-800/50 rounded-xl p-8 text-center text-zinc-400">
              Add tags when creating commits to manage them here.
            </div>
          ) : tags.map(group => (
            <section key={group.tag} className="bg-zinc-800/50 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{group.tag}</h3>
                  <p className="text-sm text-zinc-500">{group.count} commits - latest {group.lastDate}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {editingTag === group.tag ? (
                    <>
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        className="px-3 py-1.5 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                      <button onClick={() => renameTag(group.tag)} className="px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-sm">Save</button>
                      <button onClick={() => setEditingTag('')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingTag(group.tag); setEditingSeed(''); setDraftName(group.tag); }} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Rename</button>
                      <button onClick={() => removeTag(group.tag)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-red-400">Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.commits.slice(0, 8).map(commit => (
                  <span key={commit.id} className="px-2 py-1 rounded bg-zinc-900/70 text-sm">
                    {commit.date} - {commit.title}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
