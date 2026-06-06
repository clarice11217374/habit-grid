import Database from 'better-sqlite3';
import path from 'path';
import { COMMIT_TYPES, LIFE_AREAS } from './constants';
import type { CommitType } from './constants';

function resolveDatabasePath() {
  if (process.env.VERCEL === '1') {
    throw new Error('SQLite fallback is disabled on Vercel. Configure Supabase persistence.');
  }
  return path.resolve(process.cwd(), 'data', 'habits.db');
}

const dbPath = resolveDatabasePath();
const db = new Database(dbPath);

export { COMMIT_TYPES, LIFE_AREAS };
export type { CommitType };

export interface Area {
  id: number;
  name: string;
  color: string;
}

export type Habit = Area;

export interface CommitImpact {
  areaId: number;
  areaName: string;
  areaColor: string;
  impactValue: number;
}

export interface Entry {
  id: number;
  area_id: number;
  date: string;
  count: number;
  completed: number;
  titles: string[];
}

export interface LifeCommit {
  id: number;
  title: string;
  description: string;
  date: string;
  areaId: number;
  areaName: string;
  areaColor: string;
  impactAreas: CommitImpact[];
  type: CommitType;
  tags: string[];
  seed: string;
  createdAt: string;
}

export interface GratitudeEntry {
  id: number;
  date: string;
  text: string;
  createdAt: string;
}

export interface GratitudeOverview {
  totalGratitudes: number;
  currentStreak: number;
  longestStreak: number;
  uniqueWords: number;
  topKeywords: { word: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
  timeline: { date: string; entries: GratitudeEntry[] }[];
}

export interface AreaGoal {
  areaId: number;
  sixMonthGoal: string;
  threeYearGoal: string;
  focusPoints: string;
  visionText: string;
  visionImages: string[];
  updatedAt: string;
}

export interface CreateCommitInput {
  title: string;
  description: string;
  date: string;
  areaId?: number;
  impactAreaIds: number[];
  type: CommitType;
  tags: string[];
  seed: string;
}

export interface DashboardStats {
  totalCommits: number;
  streakDays: number;
  recent30: { date: string; count: number }[];
  areaDistribution: { areaId: number; areaName: string; color: string; count: number }[];
  topTags: { name: string; count: number }[];
  topSeeds: { name: string; count: number }[];
}

db.exec(`
  CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS commits (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    area_id INTEGER,
    type TEXT NOT NULL DEFAULT 'Reflection',
    tags TEXT NOT NULL DEFAULT '[]',
    seed TEXT NOT NULL DEFAULT '',
    duration TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    primary_area_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id)
  );

  CREATE TABLE IF NOT EXISTS gratitude_entries (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commit_impacts (
    id INTEGER PRIMARY KEY,
    commit_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    impact_value REAL NOT NULL DEFAULT 1,
    UNIQUE(commit_id, area_id),
    FOREIGN KEY (commit_id) REFERENCES commits(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id)
  );

  CREATE TABLE IF NOT EXISTS area_goals (
    area_id INTEGER PRIMARY KEY,
    six_month_goal TEXT NOT NULL DEFAULT '',
    three_year_goal TEXT NOT NULL DEFAULT '',
    focus_points TEXT NOT NULL DEFAULT '',
    vision_text TEXT NOT NULL DEFAULT '',
    vision_images TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id)
  );
`);

function columnNames(tableName: string) {
  return new Set((db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[]).map(column => column.name));
}

function ensureColumn(tableName: string, columnName: string, definition: string) {
  const columns = columnNames(tableName);
  if (!columns.has(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

ensureColumn('commits', 'description', "TEXT NOT NULL DEFAULT ''");
ensureColumn('commits', 'area_id', 'INTEGER');
ensureColumn('commits', 'type', "TEXT NOT NULL DEFAULT 'Reflection'");
ensureColumn('commits', 'tags', "TEXT NOT NULL DEFAULT '[]'");
ensureColumn('commits', 'seed', "TEXT NOT NULL DEFAULT ''");

function syncFixedAreas() {
  const upsert = db.prepare(`
    INSERT INTO areas (id, name, color)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, color = excluded.color
  `);

  const allowedIds = LIFE_AREAS.map(area => area.id);
  const transaction = db.transaction(() => {
    for (const area of LIFE_AREAS) {
      upsert.run(area.id, area.name, area.color);
    }
    db.prepare(`DELETE FROM areas WHERE id NOT IN (${allowedIds.map(() => '?').join(',')})`).run(...allowedIds);
  });

  transaction();
}

syncFixedAreas();

db.prepare(`
  UPDATE commits
  SET area_id = COALESCE(area_id, primary_area_id, 1),
      description = CASE WHEN description = '' AND note IS NOT NULL THEN note ELSE description END
  WHERE area_id IS NULL OR description = ''
`).run();

db.prepare(`
  INSERT OR IGNORE INTO commit_impacts (commit_id, area_id, impact_value)
  SELECT id, area_id, 1 FROM commits WHERE area_id IS NOT NULL
`).run();

function parseTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(tag => typeof tag === 'string') : [];
  } catch {
    return value.split(',').map(tag => tag.trim()).filter(Boolean);
  }
}

function normalizeList(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function parseImages(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(url => typeof url === 'string' && url.trim()).map(url => url.trim()) : [];
  } catch {
    return value.split('\n').map(url => url.trim()).filter(Boolean);
  }
}

type CommitRow = {
  id: number;
  title: string;
  description: string;
  date: string;
  area_id: number;
  area_name: string;
  area_color: string;
  type: string;
  tags: string;
  seed: string;
  created_at: string;
};

function toCommit(row: CommitRow, impacts: CommitImpact[]): LifeCommit {
  const type = COMMIT_TYPES.includes(row.type as CommitType) ? row.type as CommitType : 'Reflection';
  const fallbackImpact = {
    areaId: row.area_id,
    areaName: row.area_name,
    areaColor: row.area_color,
    impactValue: 1,
  };
  const resolvedImpacts = impacts.length ? impacts : [fallbackImpact];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    areaId: resolvedImpacts[0].areaId,
    areaName: resolvedImpacts[0].areaName,
    areaColor: resolvedImpacts[0].areaColor,
    impactAreas: resolvedImpacts,
    type,
    tags: parseTags(row.tags),
    seed: row.seed,
    createdAt: row.created_at,
  };
}

function commitSelect(where = '') {
  return `
    SELECT c.id, c.title, c.description, c.date, c.area_id, c.type, c.tags, c.seed, c.created_at,
           a.name as area_name, a.color as area_color
    FROM commits c
    JOIN areas a ON a.id = c.area_id
    ${where}
  `;
}

export function getAreas(): Area[] {
  return db.prepare('SELECT * FROM areas ORDER BY id').all() as Area[];
}

export function getArea(areaId: number): Area | null {
  return db.prepare('SELECT * FROM areas WHERE id = ?').get(areaId) as Area | undefined || null;
}

function emptyAreaGoal(areaId: number): AreaGoal {
  return {
    areaId,
    sixMonthGoal: '',
    threeYearGoal: '',
    focusPoints: '',
    visionText: '',
    visionImages: [],
    updatedAt: '',
  };
}

export function getAreaGoal(areaId: number): AreaGoal {
  const row = db.prepare(`
    SELECT area_id as areaId,
           six_month_goal as sixMonthGoal,
           three_year_goal as threeYearGoal,
           focus_points as focusPoints,
           vision_text as visionText,
           vision_images as visionImages,
           updated_at as updatedAt
    FROM area_goals
    WHERE area_id = ?
  `).get(areaId) as (Omit<AreaGoal, 'visionImages'> & { visionImages: string }) | undefined;

  if (!row) return emptyAreaGoal(areaId);
  return { ...row, visionImages: parseImages(row.visionImages) };
}

export function updateAreaGoal(areaId: number, input: Omit<AreaGoal, 'areaId' | 'updatedAt'>): AreaGoal {
  const areaIds = new Set<number>(LIFE_AREAS.map(area => area.id));
  if (!areaIds.has(areaId)) {
    throw new Error('Area must be one of the fixed life areas');
  }

  const visionImages = normalizeList(input.visionImages);
  db.prepare(`
    INSERT INTO area_goals (area_id, six_month_goal, three_year_goal, focus_points, vision_text, vision_images, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(area_id) DO UPDATE SET
      six_month_goal = excluded.six_month_goal,
      three_year_goal = excluded.three_year_goal,
      focus_points = excluded.focus_points,
      vision_text = excluded.vision_text,
      vision_images = excluded.vision_images,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    areaId,
    input.sixMonthGoal.trim(),
    input.threeYearGoal.trim(),
    input.focusPoints.trim(),
    input.visionText.trim(),
    JSON.stringify(visionImages),
  );

  return getAreaGoal(areaId);
}

export function getAreaEntries(areaId: number, year: number): Entry[] {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const rows = db.prepare(`
    SELECT MIN(c.id) as id, ci.area_id, c.date, COUNT(*) as count, 1 as completed, json_group_array(c.title) as titles
    FROM commit_impacts ci
    JOIN commits c ON c.id = ci.commit_id
    WHERE ci.area_id = ? AND c.date >= ? AND c.date <= ?
    GROUP BY ci.area_id, c.date
    ORDER BY date
  `).all(areaId, startDate, endDate) as (Omit<Entry, 'titles'> & { titles: string })[];
  return rows.map(row => ({ ...row, titles: parseTags(row.titles) }));
}

export function getAllAreaEntriesForYear(year: number): Entry[] {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const rows = db.prepare(`
    SELECT MIN(c.id) as id, ci.area_id, c.date, COUNT(*) as count, 1 as completed, json_group_array(c.title) as titles
    FROM commit_impacts ci
    JOIN commits c ON c.id = ci.commit_id
    WHERE c.date >= ? AND c.date <= ?
    GROUP BY ci.area_id, c.date
    ORDER BY date
  `).all(startDate, endDate) as (Omit<Entry, 'titles'> & { titles: string })[];
  return rows.map(row => ({ ...row, titles: parseTags(row.titles) }));
}

export function getCommits(options: { date?: string; areaId?: number; limit?: number } = {}): LifeCommit[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (options.date) {
    clauses.push('c.date = ?');
    params.push(options.date);
  }
  if (options.areaId) {
    clauses.push('EXISTS (SELECT 1 FROM commit_impacts ci WHERE ci.commit_id = c.id AND ci.area_id = ?)');
    params.push(options.areaId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = options.limit ? `LIMIT ${options.limit}` : '';
  const rows = db.prepare(`${commitSelect(where)} ORDER BY c.date DESC, c.created_at DESC, c.id DESC ${limit}`).all(...params) as CommitRow[];
  if (!rows.length) return [];
  const placeholders = rows.map(() => '?').join(',');
  const impactRows = db.prepare(`
    SELECT ci.commit_id, ci.area_id as areaId, a.name as areaName, a.color as areaColor, ci.impact_value as impactValue
    FROM commit_impacts ci
    JOIN areas a ON a.id = ci.area_id
    WHERE ci.commit_id IN (${placeholders})
    ORDER BY ci.id
  `).all(...rows.map(row => row.id)) as (CommitImpact & { commit_id: number })[];
  const impactMap = new Map<number, CommitImpact[]>();
  for (const impact of impactRows) {
    impactMap.set(impact.commit_id, [...(impactMap.get(impact.commit_id) || []), impact]);
  }
  return rows.map(row => toCommit(row, impactMap.get(row.id) || []));
}

export function createCommit(input: CreateCommitInput): LifeCommit {
  const areaIds = new Set<number>(LIFE_AREAS.map(area => area.id));
  const impactAreaIds = [...new Set(input.impactAreaIds)];
  if (!impactAreaIds.length || impactAreaIds.some(areaId => !areaIds.has(areaId))) {
    throw new Error('Select at least one valid impact area');
  }
  if (!COMMIT_TYPES.includes(input.type)) {
    throw new Error('Commit type is not supported');
  }

  const tags = input.tags.map(tag => tag.trim()).filter(Boolean);
  const primaryAreaId = input.areaId && impactAreaIds.includes(input.areaId) ? input.areaId : impactAreaIds[0];
  const insertCommit = db.prepare(`
    INSERT INTO commits (title, description, date, area_id, type, tags, seed, duration, note, primary_area_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?)
  `);
  const insertImpact = db.prepare('INSERT INTO commit_impacts (commit_id, area_id, impact_value) VALUES (?, ?, 1)');
  const commitId = db.transaction(() => {
    const result = insertCommit.run(input.title, input.description, input.date, primaryAreaId, input.type, JSON.stringify(tags), input.seed, input.description, primaryAreaId);
    const id = Number(result.lastInsertRowid);
    for (const areaId of impactAreaIds) insertImpact.run(id, areaId);
    return id;
  })();
  const commit = getCommits({ limit: 5000 }).find(item => item.id === commitId);
  if (!commit) throw new Error('Commit was saved but could not be read back');
  return commit;
}

export function getSeeds() {
  const rows = db.prepare(`
    SELECT seed, COUNT(*) as count, MAX(date) as lastDate
    FROM commits
    WHERE seed != ''
    GROUP BY seed
    ORDER BY lastDate DESC, count DESC
  `).all() as { seed: string; count: number; lastDate: string }[];

  return rows.map(row => ({
    seed: row.seed,
    count: row.count,
    lastDate: row.lastDate,
    commits: getCommits({ limit: 200 }).filter(commit => commit.seed === row.seed),
  }));
}

export function renameSeed(from: string, to: string) {
  const source = from.trim();
  const target = to.trim();
  if (!source || !target) {
    throw new Error('Seed names are required');
  }
  db.prepare('UPDATE commits SET seed = ? WHERE seed = ?').run(target, source);
}

export function deleteSeed(name: string) {
  const seed = name.trim();
  if (!seed) {
    throw new Error('Seed name is required');
  }
  db.prepare("UPDATE commits SET seed = '' WHERE seed = ?").run(seed);
}

export function getTags() {
  const commits = getCommits({ limit: 5000 });
  const counts = new Map<string, { count: number; lastDate: string; commits: LifeCommit[] }>();

  for (const commit of commits) {
    for (const tag of commit.tags) {
      const current = counts.get(tag) || { count: 0, lastDate: commit.date, commits: [] };
      current.count += 1;
      current.lastDate = current.lastDate > commit.date ? current.lastDate : commit.date;
      current.commits.push(commit);
      counts.set(tag, current);
    }
  }

  return [...counts.entries()]
    .map(([tag, data]) => ({ tag, ...data }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate) || b.count - a.count);
}

export function renameTag(from: string, to: string) {
  const source = from.trim();
  const target = to.trim();
  if (!source || !target) {
    throw new Error('Tag names are required');
  }

  const rows = db.prepare('SELECT id, tags FROM commits WHERE tags LIKE ?').all(`%${source}%`) as { id: number; tags: string }[];
  const update = db.prepare('UPDATE commits SET tags = ? WHERE id = ?');
  const transaction = db.transaction(() => {
    for (const row of rows) {
      const tags = parseTags(row.tags);
      if (!tags.includes(source)) continue;
      update.run(JSON.stringify(normalizeList(tags.map(tag => tag === source ? target : tag))), row.id);
    }
  });
  transaction();
}

export function deleteTag(name: string) {
  const target = name.trim();
  if (!target) {
    throw new Error('Tag name is required');
  }

  const rows = db.prepare('SELECT id, tags FROM commits WHERE tags LIKE ?').all(`%${target}%`) as { id: number; tags: string }[];
  const update = db.prepare('UPDATE commits SET tags = ? WHERE id = ?');
  const transaction = db.transaction(() => {
    for (const row of rows) {
      const tags = parseTags(row.tags);
      if (!tags.includes(target)) continue;
      update.run(JSON.stringify(tags.filter(tag => tag !== target)), row.id);
    }
  });
  transaction();
}

export function getGratitudeEntries(date: string): GratitudeEntry[] {
  return db.prepare(`
    SELECT id, date, text, created_at as createdAt
    FROM gratitude_entries
    WHERE date = ?
    ORDER BY created_at DESC, id DESC
  `).all(date) as GratitudeEntry[];
}

export function createGratitudeEntry(date: string, text: string): GratitudeEntry {
  const count = db.prepare('SELECT COUNT(*) as count FROM gratitude_entries WHERE date = ?').get(date) as { count: number };
  if (count.count >= 10) {
    throw new Error('You can record up to 10 gratitude items per day');
  }
  const result = db.prepare('INSERT INTO gratitude_entries (date, text) VALUES (?, ?)').run(date, text);
  return db.prepare(`
    SELECT id, date, text, created_at as createdAt
    FROM gratitude_entries
    WHERE id = ?
  `).get(result.lastInsertRowid) as GratitudeEntry;
}

const GRATITUDE_STOP_WORDS = new Set([
  'i', "i'm", 'im', 'am', 'the', 'a', 'an', 'to', 'for', 'and', 'of', 'in', 'is', 'it', 'that', 'my', 'me', 'with', 'today',
]);

function gratitudeWords(text: string) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || [])
    .filter(word => word.length > 1 && !GRATITUDE_STOP_WORDS.has(word));
}

function nextDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getGratitudeOverview(): GratitudeOverview {
  const entries = db.prepare(`
    SELECT id, date, text, created_at as createdAt
    FROM gratitude_entries
    ORDER BY date DESC, created_at DESC, id DESC
  `).all() as GratitudeEntry[];

  const dailyCounts = db.prepare(`
    SELECT date, COUNT(*) as count
    FROM gratitude_entries
    GROUP BY date
    ORDER BY date
  `).all() as { date: string; count: number }[];

  const dates = dailyCounts.map(day => day.date);
  const dateSet = new Set(dates);
  let currentStreak = 0;
  for (let date = dateDaysAgo(0); dateSet.has(date); date = nextDate(date, -1)) {
    currentStreak++;
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate = '';
  for (const date of dates) {
    runningStreak = previousDate && nextDate(previousDate, 1) === date ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = date;
  }

  const wordCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const word of gratitudeWords(entry.text)) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  const timelineMap = new Map<string, GratitudeEntry[]>();
  for (const entry of entries.slice(0, 100)) {
    timelineMap.set(entry.date, [...(timelineMap.get(entry.date) || []), entry]);
  }

  return {
    totalGratitudes: entries.length,
    currentStreak,
    longestStreak,
    uniqueWords: wordCounts.size,
    topKeywords: [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 30)
      .map(([word, count]) => ({ word, count })),
    dailyCounts,
    timeline: [...timelineMap.entries()].map(([date, groupedEntries]) => ({ date, entries: groupedEntries })),
  };
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDashboardStats(): DashboardStats {
  const total = db.prepare('SELECT COUNT(*) as count FROM commits').get() as { count: number };
  const recent30 = db.prepare(`
    SELECT date, COUNT(*) as count
    FROM commits
    WHERE date >= ?
    GROUP BY date
    ORDER BY date
  `).all(dateDaysAgo(29)) as { date: string; count: number }[];

  const commitDates = new Set((db.prepare('SELECT DISTINCT date FROM commits').all() as { date: string }[]).map(row => row.date));
  let streakDays = 0;
  for (let i = 0; i < 3650; i++) {
    if (commitDates.has(dateDaysAgo(i))) {
      streakDays++;
    } else {
      break;
    }
  }

  const areaDistribution = db.prepare(`
    SELECT a.id as areaId, a.name as areaName, a.color, COUNT(ci.commit_id) as count
    FROM areas a
    LEFT JOIN commit_impacts ci ON ci.area_id = a.id
    GROUP BY a.id
    ORDER BY a.id
  `).all() as DashboardStats['areaDistribution'];

  const commits = getCommits({ limit: 1000 });
  const countValues = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  };

  return {
    totalCommits: total.count,
    streakDays,
    recent30,
    areaDistribution,
    topTags: countValues(commits.flatMap(commit => commit.tags)),
    topSeeds: countValues(commits.map(commit => commit.seed)),
  };
}

export default db;
