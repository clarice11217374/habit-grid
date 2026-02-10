# Habit Grid

A beautiful, GitHub-style habit tracking app built with Next.js 16, React 19, and SQLite.

![Dashboard View](https://via.placeholder.com/800x400/18181b/22c55e?text=Habit+Grid+Dashboard)

## ✨ Features

- **📊 Dashboard View** - See all your habits at a glance with mini contribution grids
- **📅 Year & Month Views** - Toggle between yearly overview and detailed monthly view
- **➕ Dynamic Habit Creation** - Add new habits with custom names and colors
- **🎨 10 Preset Colors** - Plus a custom color picker for unlimited choices
- **🔥 Streak Tracking** - Track your current streak for each habit
- **📈 Progress Stats** - Completion count, percentage, and streaks per habit
- **🌙 Dark Theme** - Easy on the eyes with a sleek dark interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/amzqvc/habit-grid.git
cd habit-grid

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be running at [http://localhost:3001](http://localhost:3001)

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI**: [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📁 Project Structure

```
habit-grid/
├── app/
│   ├── api/
│   │   ├── habits/route.ts    # GET/POST habits
│   │   └── entries/route.ts   # GET/POST entries
│   ├── layout.tsx
│   └── page.tsx               # Main dashboard + detail view
├── components/
│   ├── AddHabitModal.tsx      # Create new habits
│   ├── HabitGrid.tsx          # Full year/month grid
│   ├── MiniHabitGrid.tsx      # Dashboard mini grids
│   └── ViewToggle.tsx         # Year/Month toggle
├── lib/
│   └── db.ts                  # Database setup + queries
├── data/
│   └── habits.db              # SQLite database
└── public/
```

## 🎯 Default Habits

The app comes seeded with 4 habits:

| Habit | Color |
|-------|-------|
| 🟢 Workout | Green (#22c55e) |
| 🔵 Calories | Blue (#3b82f6) |
| 🟠 Wake Time | Amber (#f59e0b) |
| 🟣 Meditation | Purple (#a855f7) |

## 📝 API Endpoints

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create a new habit
  ```json
  { "name": "Reading", "color": "#ec4899" }
  ```

### Entries
- `GET /api/entries?habit=1&year=2026` - Get entries for a habit
- `GET /api/entries?habit=all&year=2026` - Get all entries for a year
- `POST /api/entries` - Toggle a day
  ```json
  { "habitId": 1, "date": "2026-02-10", "completed": true }
  ```

## 🙏 Acknowledgments

Inspired by GitHub's contribution graph and apps like [Streaks](https://streaksapp.com/).

## 📄 License

MIT
