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

export const AREA_VISUALS = [
  { id: 1, emoji: '💼', coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80' },
  { id: 2, emoji: '🌍', coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80' },
  { id: 3, emoji: '🏃', coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80' },
  { id: 4, emoji: '💻', coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { id: 5, emoji: '✍️', coverImage: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80' },
  { id: 6, emoji: '💰', coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80' },
  { id: 7, emoji: '🤝', coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' },
  { id: 8, emoji: '🧭', coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80' },
  { id: 9, emoji: '🏗️', coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80' },
] as const;

export function getAreaVisual(areaId: number) {
  return AREA_VISUALS.find(area => area.id === areaId) || AREA_VISUALS[0];
}

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
