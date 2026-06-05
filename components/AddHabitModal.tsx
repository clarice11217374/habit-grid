'use client';

import { useState } from 'react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export default function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter a commit name');
      return;
    }
    
    setLoading(true);
    try {
      await onAdd(name.trim(), color);
      setName('');
      setColor(PRESET_COLORS[0]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create commit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add New Commit</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">Commit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Writing, Health, Money..."
              className="w-full px-4 py-2 bg-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === presetColor ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm text-zinc-400">Custom:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
              <span className="text-sm text-zinc-500">{color}</span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 text-red-400 text-sm">{error}</div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {loading ? 'Adding...' : 'Add Commit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
