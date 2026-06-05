'use client';

import { useEffect, useState } from 'react';
import type { Area, CommitType } from '@/lib/db';
import { COMMIT_TYPES } from '@/lib/constants';

const RECOMMENDATION_RULES = [
  {
    keywords: ['read', 'reading', 'book', 'books', 'essay', 'article', 'writing', 'note', 'notes', 'review', 'reflection', 'systems thinking', 'thinking in systems', 'logic', 'argument', 'analysis'],
    area: 'Thinking & Writing',
    type: 'Learning' as CommitType,
    tags: ['Book', 'Writing', 'Reflection', 'Systems Thinking'],
    seed: 'Cognitive Ability',
  },
  {
    keywords: ['github', 'fork', 'codex', 'cursor', 'react', 'next.js', 'nextjs', 'javascript', 'typescript', 'code', 'coding', 'project', 'build', 'building', 'bug', 'deploy', 'vercel'],
    area: 'AI & Tech',
    type: 'Building' as CommitType,
    tags: ['GitHub', 'Codex', 'React', 'Next.js', 'Project'],
    seed: 'Coding Ability, Career Asset',
  },
  {
    keywords: ['resume', 'cv', 'job', 'job search', 'interview', 'jd', 'application', 'apply', 'offer', 'company', 'internship', 'work'],
    area: 'Career',
    type: 'Achievement' as CommitType,
    tags: ['Job Search', 'Resume', 'Interview', 'Application'],
    seed: 'Career Capital',
  },
  {
    keywords: ['english', 'ielts', 'listening', 'speaking', 'reading english', 'writing english', 'vocabulary', 'podcast', 'shadowing', 'translation'],
    area: 'English',
    type: 'Learning' as CommitType,
    tags: ['IELTS', 'English Input', 'Speaking', 'Vocabulary'],
    seed: 'Global Mobility',
  },
  {
    keywords: ['fitness', 'workout', 'training', 'strength', 'zone 2', 'cardio', 'walk', 'running', 'elliptical', 'back', 'glutes', 'legs', 'hip thrust', 'rdl'],
    area: 'Health',
    type: 'Health' as CommitType,
    tags: ['Training', 'Strength', 'Zone 2', 'Recovery'],
    seed: 'Health Foundation',
  },
  {
    keywords: ['money', 'budget', 'saving', 'savings', 'income', 'salary', 'expense', 'spending', 'rent', 'cash flow'],
    area: 'Money',
    type: 'Reflection' as CommitType,
    tags: ['Budget', 'Saving', 'Income', 'Cash Flow'],
    seed: 'Financial Stability',
  },
  {
    keywords: ['friend', 'friends', 'social', 'event', 'meetup', 'talk', 'message', 'connection', 'community', 'mentor'],
    area: 'Relationships',
    type: 'Relationship' as CommitType,
    tags: ['Friends', 'Social', 'Community'],
    seed: 'Support System',
  },
  {
    keywords: ['bu', 'boston university', 'northeastern', 'study abroad', 'master', 'university', 'application', 'america', 'usa', 'europe', 'germany', 'netherlands', 'singapore', 'migration'],
    area: 'Global',
    type: 'Learning' as CommitType,
    tags: ['Study Abroad', 'Migration', 'University'],
    seed: 'Global Option',
  },
  {
    keywords: ['portfolio', 'personal website', 'life commit', 'girlsfitness', 'blog', 'side project', 'product', 'case study', 'demo'],
    area: 'Assets',
    type: 'Building' as CommitType,
    tags: ['Portfolio', 'Product', 'Side Project', 'Case Study'],
    seed: 'Career Asset',
  },
];

interface CommitFormProps {
  areas: Area[];
  onCommit: (input: {
    title: string;
    description: string;
    areaId: number;
    type: CommitType;
    tags: string[];
    seed: string;
  }) => Promise<void>;
}

interface Suggestion {
  areaId: number;
  areaName: string;
  type: CommitType;
  tags: string[];
  seed: string;
}

export default function CommitForm({ areas, onCommit }: CommitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState(areas[0]?.id ?? 1);
  const [type, setType] = useState<CommitType>('Building');
  const [tags, setTags] = useState('');
  const [seed, setSeed] = useState('');
  const [seedOptions, setSeedOptions] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (areas.length > 0 && !areas.some(area => area.id === areaId)) {
      setAreaId(areas[0].id);
    }
  }, [areas, areaId]);

  useEffect(() => {
    Promise.all([
      fetch('/api/seeds').then(res => res.json()),
      fetch('/api/tags').then(res => res.json()),
    ]).then(([seedGroups, tagGroups]) => {
      setSeedOptions(Array.isArray(seedGroups) ? seedGroups.map(group => group.seed).filter(Boolean) : []);
      setTagOptions(Array.isArray(tagGroups) ? tagGroups.map(group => group.tag).filter(Boolean) : []);
    }).catch(() => {
      setSeedOptions([]);
      setTagOptions([]);
    });
  }, []);

  useEffect(() => {
    const text = `${title} ${description}`.toLowerCase();
    if (!text.trim() || areas.length === 0) {
      setSuggestion(null);
      return;
    }

    const rule = RECOMMENDATION_RULES.find(item =>
      item.keywords.some(keyword => text.includes(keyword.toLowerCase()))
    );
    if (!rule) {
      setSuggestion(null);
      return;
    }

    const recommendedArea = areas.find(area => area.name === rule.area);
    if (recommendedArea) {
      setSuggestion({
        areaId: recommendedArea.id,
        areaName: recommendedArea.name,
        type: rule.type,
        tags: rule.tags,
        seed: rule.seed,
      });
    } else {
      setSuggestion(null);
    }
  }, [title, description, areas]);

  const applySuggestion = () => {
    if (!suggestion) return;
    setAreaId(suggestion.areaId);
    setType(suggestion.type);
    setTags(suggestion.tags.join(', '));
    setSeed(suggestion.seed);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    try {
      await onCommit({
        title: title.trim(),
        description: description.trim(),
        areaId,
        type,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        seed: seed.trim(),
      });
      setTitle('');
      setDescription('');
      setTags('');
      setSeed('');
      setSuggestion(null);
      const [seedGroups, tagGroups] = await Promise.all([
        fetch('/api/seeds').then(res => res.json()),
        fetch('/api/tags').then(res => res.json()),
      ]);
      setSeedOptions(Array.isArray(seedGroups) ? seedGroups.map(group => group.seed).filter(Boolean) : []);
      setTagOptions(Array.isArray(tagGroups) ? tagGroups.map(group => group.tag).filter(Boolean) : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save commit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/50 rounded-xl p-5 mb-6">
      {suggestion && (
        <div className="mb-4 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Smart suggestion</div>
              <div className="text-sm text-zinc-400">
                {suggestion.areaName} / {suggestion.type} / {suggestion.tags.join(', ')} / Seed: {suggestion.seed}
              </div>
            </div>
            <button
              type="button"
              onClick={applySuggestion}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              Apply suggestion
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_180px] gap-4 mb-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Forked my first GitHub project"
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Area</label>
          <select
            value={areaId}
            onChange={(event) => setAreaId(Number(event.target.value))}
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as CommitType)}
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {COMMIT_TYPES.map(commitType => (
              <option key={commitType} value={commitType}>{commitType}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="What did this move forward, create, teach, or reveal?"
          className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Tags</label>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            list="tag-options"
            placeholder="GitHub, React, Next.js"
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <datalist id="tag-options">
            {tagOptions.map(tag => <option key={tag} value={tag} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Future Seed</label>
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            list="seed-options"
            placeholder="Life Commit, career growth"
            className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <datalist id="seed-options">
            {seedOptions.map(option => <option key={option} value={option} />)}
          </datalist>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-white text-zinc-950 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Commit'}
      </button>
    </form>
  );
}
