# Habit Grid — Spec

A personal habit tracker with GitHub-style contribution grid visualization.

## Habits to Track
1. **Workout** — Did you work out today? (yes/no)
2. **Calories** — Did you eat under 1700 calories? (yes/no)  
3. **Wake Time** — Did you wake up before 6 AM? (yes/no)

## Views
1. **Year View** — Full year grid (like GitHub profile), 52 weeks × 7 days
2. **Month View** — Current month focused, larger squares

## Grid Design
- Each habit has its own grid/calendar
- Days are colored by completion:
  - Empty/gray: no data or missed
  - Green (light to dark): completed (intensity could show streaks)
- Hover shows date and status
- Click to toggle completion for that day

## Tech Stack
- **Next.js 14** (App Router)
- **SQLite** via better-sqlite3 (simple, file-based)
- **Tailwind CSS** for styling
- **No auth** — personal use only

## Data Model
```sql
CREATE TABLE habits (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#22c55e'
);

CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  habit_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  completed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(habit_id, date),
  FOREIGN KEY (habit_id) REFERENCES habits(id)
);
```

## API Routes
- `GET /api/habits` — list all habits
- `GET /api/entries?habit=<id>&year=<year>` — get entries for a habit/year
- `POST /api/entries` — create/update entry `{ habitId, date, completed }`

## UI Components
1. **HabitGrid** — reusable grid component
   - Props: habitId, view ('year' | 'month'), year, month
   - Renders the GitHub-style grid
2. **ViewToggle** — switch between year/month
3. **HabitTabs** — switch between habits (Workout, Calories, Wake)

## Layout
- Header with habit tabs
- View toggle (Year / Month)
- Grid display area
- Legend showing colors

## File Structure
```
habit-grid/
├── app/
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── api/
│       ├── habits/route.ts
│       └── entries/route.ts
├── components/
│   ├── HabitGrid.tsx
│   ├── ViewToggle.tsx
│   └── HabitTabs.tsx
├── lib/
│   └── db.ts              # Database setup
├── data/
│   └── habits.db          # SQLite database
└── package.json
```

## Seed Data
Pre-populate habits table with:
1. Workout (id: 1, color: #22c55e green)
2. Calories (id: 2, color: #3b82f6 blue)
3. Wake Time (id: 3, color: #f59e0b amber)

## Port
Run on **localhost:3001** (3000 is sabrina-tasks)
