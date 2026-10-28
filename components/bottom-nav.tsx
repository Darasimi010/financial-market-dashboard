'use client';

import React from 'react';
import { LayoutDashboard, Star, Newspaper, Search } from 'lucide-react';
import { DashboardTab } from './sidebar';

interface BottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenSearch: () => void;
}

export function BottomNav({ activeTab, onSelectTab, onOpenSearch }: BottomNavProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 flex items-center justify-around"
    >
      <button
        onClick={() => onSelectTab('overview')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
          activeTab === 'overview'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Analysis</span>
      </button>

      <button
        onClick={() => onSelectTab('watchlist')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
          activeTab === 'watchlist'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Star className="w-5 h-5" />
        <span>Watchlist</span>
      </button>

      <button
        onClick={() => onSelectTab('news')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
          activeTab === 'news'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Newspaper className="w-5 h-5" />
        <span>News</span>
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition"
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </button>
    </nav>
  );
}
