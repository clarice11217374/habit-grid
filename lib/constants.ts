export const LIFE_AREAS = [
  { id: 1, name: 'Career', color: '#22c55e' },
  { id: 2, name: 'English', color: '#3b82f6' },
  { id: 3, name: 'Health', color: '#f59e0b' },
  { id: 4, name: 'AI & Tech', color: '#a855f7' },
  { id: 5, name: 'Thinking & Writing', color: '#ef4444' },
  { id: 6, name: 'Money', color: '#ec4899' },
  { id: 7, name: 'Relationships', color: '#14b8a6' },
  { id: 8, name: 'Global', color: '#f97316' },
  { id: 9, name: 'Assets', color: '#06b6d4' },
] as const;

export const COMMIT_TYPES = [
  'Achievement',
  'Learning',
  'Building',
  'Health',
  'Relationship',
  'Reflection',
  'Gratitude',
  'Adventure',
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];
