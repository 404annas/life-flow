'use client';

import { useState } from 'react';

interface FilterBarProps {
  onFilterChange?: (filters: string[]) => void;
  onViewChange?: (view: 'grid' | 'list') => void;
}

export const FilterBar = ({ onFilterChange, onViewChange }: FilterBarProps) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const priorities = [
    { id: 'urgent', label: 'Urgent', emoji: '🔴' },
    { id: 'high', label: 'High', emoji: '🟠' },
    { id: 'medium', label: 'Medium', emoji: '🟡' },
    { id: 'low', label: 'Low', emoji: '🟢' },
  ];

  const toggleFilter = (filterId: string) => {
    const updated = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(updated);
    onFilterChange?.(updated);
  };

  const toggleView = (view: 'grid' | 'list') => {
    setViewMode(view);
    onViewChange?.(view);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    onFilterChange?.([]);
  };

  return (
    <div className="sticky top-0 z-40 bg-[#0a0a0f] border-b border-white/10 backdrop-blur-sm">
      <div className="px-4 py-4 space-y-4">
        {/* Priority Filters */}
        <div className="flex flex-wrap gap-2">
          {priorities.map(priority => (
            <button
              key={priority.id}
              onClick={() => toggleFilter(priority.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilters.includes(priority.id)
                  ? 'glass bg-white/20'
                  : 'glass bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{priority.emoji}</span>
              {priority.label}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-full text-sm font-medium glass bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleView('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'glass bg-white/20'
                : 'glass bg-white/5 hover:bg-white/10'
            }`}
            title="Grid view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM12 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM12 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          <button
            onClick={() => toggleView('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'glass bg-white/20'
                : 'glass bg-white/5 hover:bg-white/10'
            }`}
            title="List view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
