'use client';

interface ViewToggleProps {
  view: 'year' | 'month';
  onToggle: (view: 'year' | 'month') => void;
}

export default function ViewToggle({ view, onToggle }: ViewToggleProps) {
  return (
    <div className="lc-tabs" role="tablist" aria-label="Contribution view">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'year'}
        onClick={() => onToggle('year')}
        className={view === 'year' ? 'active' : ''}
      >
        Year
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'month'}
        onClick={() => onToggle('month')}
        className={view === 'month' ? 'active' : ''}
      >
        Month
      </button>
    </div>
  );
}
