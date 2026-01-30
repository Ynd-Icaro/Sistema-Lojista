'use client';

import { LayoutGrid, List } from 'lucide-react';
import { useState, useEffect } from 'react';

type ViewMode = 'card' | 'list';

interface ViewToggleProps {
  storageKey: string;
  defaultView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

export function ViewToggle({ 
  storageKey, 
  defaultView = 'card',
  onViewChange 
}: ViewToggleProps) {
  const [view, setView] = useState<ViewMode>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(`view-${storageKey}`);
    if (stored === 'card' || stored === 'list') {
      setView(stored);
      onViewChange?.(stored);
    }
  }, [storageKey, onViewChange]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    localStorage.setItem(`view-${storageKey}`, newView);
    onViewChange?.(newView);
  };

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => handleViewChange('card')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === 'card'
            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Visualização em cards"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => handleViewChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          view === 'list'
            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Visualização em lista"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Lista</span>
      </button>
    </div>
  );
}

export function useViewMode(storageKey: string, defaultView: ViewMode = 'card') {
  const [view, setView] = useState<ViewMode>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(`view-${storageKey}`);
    if (stored === 'card' || stored === 'list') {
      setView(stored);
    }
  }, [storageKey]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    localStorage.setItem(`view-${storageKey}`, newView);
  };

  return { view, setView: handleViewChange };
}
