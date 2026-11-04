'use client';

import React from 'react';
import { LayoutDashboard, Star, Newspaper, Calendar } from 'lucide-react';
import { DashboardTab } from './sidebar';

interface BottomNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenSearch: () => void;
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const items: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Analysis', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star className="w-4 h-4" /> },
    { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'calendars', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 flex items-center justify-around overflow-x-auto"
    >
      {items.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition shrink-0 ${
              active
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
