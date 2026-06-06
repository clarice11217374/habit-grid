import { COMMIT_TYPES, LIFE_AREAS } from './constants';
import { getSupabaseClient } from './supabase';
import type {
  Area,
  AreaGoal,
  CreateCommitInput,
  DashboardStats,
  Entry,
  GratitudeEntry,
  GratitudeOverview,
  LifeCommit,
} from './db';

export type { Area, AreaGoal, CreateCommitInput, DashboardStats, Entry, GratitudeEntry, GratitudeOverview, LifeCommit };

const USER_ID = 'clarice';
const STOP_WORDS = new Set(['i', "i'm", 'im', 'am', 'the', 'a', 'an', 'to', 'for', 'and', 'of', 'in', 'is', 'it', 'that', 'my', 'me', 'with', 'today']);

async function localDb() {
  return import('./db');
}

function assertData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Supabase returned no data');
  return data;
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function mapCommit(row: Record<string, unknown>, areas: Map<number, Area>): LifeCommit {
  const areaId = Number(row.area_id);
  const area = areas.get(areaId) || LIFE_AREAS.find(item => item.id === areaId) || LIFE_AREAS[0];
  return {
    id: Number(row.id),
    title: String(row.title || ''),
    description: String(row.description || ''),
    date: String(row.date || ''),
    areaId,
    areaName: area.name,
    areaColor: area.color,
    type: COMMIT_TYPES.includes(row.type as never) ? row.type as LifeCommit['type'] : 'Reflection',
    tags: Array.isArray(row.tags) ? row.tags.filter(tag => typeof tag === 'string') as string[] : [],
    seed: String(row.seed || ''),
    createdAt: String(row.created_at || ''),
  };
}

async function supabaseAreas() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const result = await supabase.from('areas').select('id,name,color').eq('user_id', USER_ID).order('id');
  return assertData(result.data, result.error) as Area[];
}

export async function getAreas(): Promise<Area[]> {
  const areas = await supabaseAreas();
  return areas || (await localDb()).getAreas();
}

export async function getArea(areaId: number): Promise<Area | null> {
  const areas = await supabaseAreas();
  return areas ? areas.find(area => area.id === areaId) || null : (await localDb()).getArea(areaId);
}

export async function getCommits(options: { date?: string; areaId?: number; limit?: number } = {}): Promise<LifeCommit[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getCommits(options);

  let query = supabase.from('commits').select('*').eq('user_id', USER_ID).order('date', { ascending: false }).order('created_at', { ascending: false });
  if (options.date) query = query.eq('date', options.date);
  if (options.areaId) query = query.eq('area_id', options.areaId);
  if (options.limit) query = query.limit(options.limit);
  const result = await query;
  const areas = new Map((await getAreas()).map(area => [area.id, area]));
  return (assertData(result.data, result.error) as Record<string, unknown>[]).map(row => mapCommit(row, areas));
}

export async function createCommit(input: CreateCommitInput): Promise<LifeCommit> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).createCommit(input);

  const result = await supabase.from('commits').insert({
    user_id: USER_ID,
    title: input.title,
    description: input.description,
    date: input.date,
    area_id: input.areaId,
    type: input.type,
    tags: [...new Set(input.tags.map(tag => tag.trim()).filter(Boolean))],
    seed: input.seed.trim(),
  }).select('*').single();
  const row = assertData(result.data, result.error) as Record<string, unknown>;

  if (input.tags.length) {
    const tags = [...new Set(input.tags.map(name => name.trim()).filter(Boolean))].map(name => ({ user_id: USER_ID, name }));
    if (tags.length) await supabase.from('tags').upsert(tags, { onConflict: 'user_id,name' });
  }
  if (input.seed.trim()) {
    await supabase.from('seeds').upsert({ user_id: USER_ID, name: input.seed.trim() }, { onConflict: 'user_id,name' });
  }

  const areas = new Map((await getAreas()).map(area => [area.id, area]));
  return mapCommit(row, areas);
}

async function entriesForYear(year: number, areaId?: number): Promise<Entry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return areaId ? (await localDb()).getAreaEntries(areaId, year) : (await localDb()).getAllAreaEntriesForYear(year);

  let query = supabase.from('commits').select('id,area_id,date,title').eq('user_id', USER_ID).gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  if (areaId) query = query.eq('area_id', areaId);
  const result = await query;
  const groups = new Map<string, Entry>();
  for (const row of assertData(result.data, result.error) as { id: number; area_id: number; date: string; title: string }[]) {
    const key = `${row.area_id}:${row.date}`;
    const current = groups.get(key) || { id: row.id, area_id: row.area_id, date: row.date, count: 0, completed: 1, titles: [] };
    current.count++;
    current.titles.push(row.title);
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getAreaEntries(areaId: number, year: number) {
  return entriesForYear(year, areaId);
}

export function getAllAreaEntriesForYear(year: number) {
  return entriesForYear(year);
}

export async function getAreaGoal(areaId: number): Promise<AreaGoal> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getAreaGoal(areaId);
  const result = await supabase.from('area_goals').select('*').eq('user_id', USER_ID).eq('area_id', areaId).maybeSingle();
  const row = assertData(result.data ?? {}, result.error) as Record<string, unknown>;
  return {
    areaId,
    sixMonthGoal: String(row.six_month_goal || ''),
    threeYearGoal: String(row.three_year_goal || ''),
    focusPoints: String(row.focus_points || ''),
    visionText: String(row.vision_text || ''),
    visionImages: Array.isArray(row.vision_images) ? row.vision_images as string[] : [],
    updatedAt: String(row.updated_at || ''),
  };
}

export async function updateAreaGoal(areaId: number, input: Omit<AreaGoal, 'areaId' | 'updatedAt'>): Promise<AreaGoal> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).updateAreaGoal(areaId, input);
  const result = await supabase.from('area_goals').upsert({
    user_id: USER_ID,
    area_id: areaId,
    six_month_goal: input.sixMonthGoal.trim(),
    three_year_goal: input.threeYearGoal.trim(),
    focus_points: input.focusPoints.trim(),
    vision_text: input.visionText.trim(),
    vision_images: [...new Set(input.visionImages.map(url => url.trim()).filter(Boolean))],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,area_id' }).select('*').single();
  assertData(result.data, result.error);
  return getAreaGoal(areaId);
}

export async function getGratitudeEntries(date: string): Promise<GratitudeEntry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getGratitudeEntries(date);
  const result = await supabase.from('gratitudes').select('id,date,text,created_at').eq('user_id', USER_ID).eq('date', date).order('created_at', { ascending: false });
  return (assertData(result.data, result.error) as { id: number; date: string; text: string; created_at: string }[]).map(row => ({ ...row, createdAt: row.created_at }));
}

export async function createGratitudeEntry(date: string, text: string): Promise<GratitudeEntry> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).createGratitudeEntry(date, text);
  const count = await supabase.from('gratitudes').select('id', { count: 'exact', head: true }).eq('user_id', USER_ID).eq('date', date);
  if (count.error) throw new Error(count.error.message);
  if ((count.count || 0) >= 10) throw new Error('You can record up to 10 gratitude items per day');
  const result = await supabase.from('gratitudes').insert({ user_id: USER_ID, date, text }).select('id,date,text,created_at').single();
  const row = assertData(result.data, result.error) as { id: number; date: string; text: string; created_at: string };
  return { ...row, createdAt: row.created_at };
}

export async function getGratitudeOverview(): Promise<GratitudeOverview> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getGratitudeOverview();
  const result = await supabase.from('gratitudes').select('id,date,text,created_at').eq('user_id', USER_ID).order('date', { ascending: false }).order('created_at', { ascending: false });
  const entries = (assertData(result.data, result.error) as { id: number; date: string; text: string; created_at: string }[]).map(row => ({ ...row, createdAt: row.created_at }));
  const counts = new Map<string, number>();
  const words = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.date, (counts.get(entry.date) || 0) + 1);
    for (const word of entry.text.toLowerCase().match(/[a-z0-9']+/g) || []) {
      if (word.length > 1 && !STOP_WORDS.has(word)) words.set(word, (words.get(word) || 0) + 1);
    }
  }
  const dates = [...counts.keys()].sort();
  const dateSet = new Set(dates);
  let currentStreak = 0;
  for (let date = dateDaysAgo(0); dateSet.has(date); date = nextDate(date, -1)) currentStreak++;
  let longestStreak = 0;
  let running = 0;
  let previous = '';
  for (const date of dates) {
    running = previous && nextDate(previous, 1) === date ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
    previous = date;
  }
  const timelineMap = new Map<string, GratitudeEntry[]>();
  for (const entry of entries.slice(0, 100)) timelineMap.set(entry.date, [...(timelineMap.get(entry.date) || []), entry]);
  return {
    totalGratitudes: entries.length,
    currentStreak,
    longestStreak,
    uniqueWords: words.size,
    topKeywords: [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([word, count]) => ({ word, count })),
    dailyCounts: dates.map(date => ({ date, count: counts.get(date) || 0 })),
    timeline: [...timelineMap.entries()].map(([date, grouped]) => ({ date, entries: grouped })),
  };
}

export async function getSeeds() {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getSeeds();
  const commits = await getCommits({ limit: 5000 });
  const groups = new Map<string, LifeCommit[]>();
  for (const commit of commits) if (commit.seed) groups.set(commit.seed, [...(groups.get(commit.seed) || []), commit]);
  return [...groups.entries()].map(([seed, items]) => ({ seed, count: items.length, lastDate: items[0].date, commits: items }));
}

export async function renameSeed(from: string, to: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).renameSeed(from, to);
  const update = await supabase.from('commits').update({ seed: to.trim() }).eq('user_id', USER_ID).eq('seed', from.trim());
  if (update.error) throw new Error(update.error.message);
  await supabase.from('seeds').delete().eq('user_id', USER_ID).eq('name', from.trim());
  if (to.trim()) await supabase.from('seeds').upsert({ user_id: USER_ID, name: to.trim() }, { onConflict: 'user_id,name' });
}

export async function deleteSeed(name: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).deleteSeed(name);
  const update = await supabase.from('commits').update({ seed: '' }).eq('user_id', USER_ID).eq('seed', name.trim());
  if (update.error) throw new Error(update.error.message);
  await supabase.from('seeds').delete().eq('user_id', USER_ID).eq('name', name.trim());
}

export async function getTags() {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getTags();
  const commits = await getCommits({ limit: 5000 });
  const groups = new Map<string, LifeCommit[]>();
  for (const commit of commits) for (const tag of commit.tags) groups.set(tag, [...(groups.get(tag) || []), commit]);
  return [...groups.entries()].map(([tag, items]) => ({ tag, count: items.length, lastDate: items[0].date, commits: items }));
}

export async function renameTag(from: string, to: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).renameTag(from, to);
  const commits = await getCommits({ limit: 5000 });
  for (const commit of commits.filter(item => item.tags.includes(from.trim()))) {
    const tags = [...new Set(commit.tags.map(tag => tag === from.trim() ? to.trim() : tag).filter(Boolean))];
    const result = await supabase.from('commits').update({ tags }).eq('user_id', USER_ID).eq('id', commit.id);
    if (result.error) throw new Error(result.error.message);
  }
  await supabase.from('tags').delete().eq('user_id', USER_ID).eq('name', from.trim());
  if (to.trim()) await supabase.from('tags').upsert({ user_id: USER_ID, name: to.trim() }, { onConflict: 'user_id,name' });
}

export async function deleteTag(name: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).deleteTag(name);
  const commits = await getCommits({ limit: 5000 });
  for (const commit of commits.filter(item => item.tags.includes(name.trim()))) {
    const result = await supabase.from('commits').update({ tags: commit.tags.filter(tag => tag !== name.trim()) }).eq('user_id', USER_ID).eq('id', commit.id);
    if (result.error) throw new Error(result.error.message);
  }
  await supabase.from('tags').delete().eq('user_id', USER_ID).eq('name', name.trim());
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseClient();
  if (!supabase) return (await localDb()).getDashboardStats();
  const [commits, areas] = await Promise.all([getCommits({ limit: 5000 }), getAreas()]);
  const recent = new Map<string, number>();
  const commitDates = new Set<string>();
  const areaCounts = new Map<number, number>();
  const countValues = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  };
  for (const commit of commits) {
    commitDates.add(commit.date);
    areaCounts.set(commit.areaId, (areaCounts.get(commit.areaId) || 0) + 1);
    if (commit.date >= dateDaysAgo(29)) recent.set(commit.date, (recent.get(commit.date) || 0) + 1);
  }
  let streakDays = 0;
  for (let i = 0; commitDates.has(dateDaysAgo(i)); i++) streakDays++;
  return {
    totalCommits: commits.length,
    streakDays,
    recent30: [...recent.entries()].sort().map(([date, count]) => ({ date, count })),
    areaDistribution: areas.map(area => ({ areaId: area.id, areaName: area.name, color: area.color, count: areaCounts.get(area.id) || 0 })),
    topTags: countValues(commits.flatMap(commit => commit.tags)),
    topSeeds: countValues(commits.map(commit => commit.seed)),
  };
}
