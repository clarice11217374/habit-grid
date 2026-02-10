import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'habits.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#22c55e'
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    UNIQUE(habit_id, date),
    FOREIGN KEY (habit_id) REFERENCES habits(id)
  );
`);

// Seed habits if empty
const count = db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO habits (id, name, color) VALUES (?, ?, ?)');
  insert.run(1, 'Workout', '#22c55e');
  insert.run(2, 'Calories', '#3b82f6');
  insert.run(3, 'Wake Time', '#f59e0b');
  insert.run(4, 'Meditation', '#a855f7');
}

export interface Habit {
  id: number;
  name: string;
  color: string;
}

export interface Entry {
  id: number;
  habit_id: number;
  date: string;
  completed: number;
}

export function getHabits(): Habit[] {
  return db.prepare('SELECT * FROM habits').all() as Habit[];
}

export function getEntries(habitId: number, year: number): Entry[] {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return db.prepare(
    'SELECT * FROM entries WHERE habit_id = ? AND date >= ? AND date <= ?'
  ).all(habitId, startDate, endDate) as Entry[];
}

export function upsertEntry(habitId: number, date: string, completed: boolean): Entry {
  db.prepare(`
    INSERT INTO entries (habit_id, date, completed)
    VALUES (?, ?, ?)
    ON CONFLICT(habit_id, date) DO UPDATE SET completed = excluded.completed
  `).run(habitId, date, completed ? 1 : 0);
  
  return db.prepare(
    'SELECT * FROM entries WHERE habit_id = ? AND date = ?'
  ).get(habitId, date) as Entry;
}

export function createHabit(name: string, color: string): Habit {
  const result = db.prepare('INSERT INTO habits (name, color) VALUES (?, ?)').run(name, color);
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid) as Habit;
}

export function getAllEntriesForYear(year: number): Entry[] {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return db.prepare(
    'SELECT * FROM entries WHERE date >= ? AND date <= ?'
  ).all(startDate, endDate) as Entry[];
}

export default db;
