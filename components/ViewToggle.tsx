'use client';

interface ViewToggleProps {
  view: 'year' | 'month';
  onToggle: (view: 'year' | 'month') => void;
}

export default function ViewToggle({ view, onToggle }: ViewToggleProps) {
  return (
    <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
      <button
        onClick={() => onToggle('year')}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          view === 'year'
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Year
      </button>
      <button
        onClick={() => onToggle('month')}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          view === 'month'
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Month
      </button>
    </div>
  );
}
