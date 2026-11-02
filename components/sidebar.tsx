'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Star,
  Newspaper,
  Calendar,
  Coins,
  Globe,
  Database,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { FINNHUB_CONFIG, isUSStockSymbol, sanitizeSymbol } from '@/lib/config';
import { toast } from 'sonner';

export type DashboardTab = 'overview' | 'watchlist' | 'news' | 'calendars';

interface SidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  watchlist: string[];
  onAddSymbol: (symbol: string) => boolean;
  onRemoveSymbol: (symbol: string) => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  activeSymbol,
  onSelectSymbol,
  watchlist,
  onAddSymbol,
  onRemoveSymbol,
}: SidebarProps) {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = sanitizeSymbol(quickInput);
    if (!sym) return;
    if (!isUSStockSymbol(sym)) {
      toast.error(FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
      return;
    }
    const ok = onAddSymbol(sym);
    if (ok) {
      toast.success(`Added ${sym} to watchlist`);
      onSelectSymbol(sym);
      setQuickInput('');
    }
  };

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Ticker Analysis', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'watchlist', label: 'Watchlist Grid', icon: <Star className="w-4 h-4" /> },
    { id: 'news', label: 'Market News', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'calendars', label: 'Earnings & IPOs', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 p-4 justify-between sticky top-20 overflow-y-auto h-[calc(100vh-5rem)] h-[calc(100dvh-5rem)] min-h-[calc(100vh-5rem)] min-h-[calc(100dvh-5rem)] pt-4">
      <div className="space-y-6">
        {/* Main Navigation */}
        <nav aria-label="Dashboard sections" className="space-y-1">
          <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Views
          </p>
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Watchlist Quick Switcher */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Watchlist ({watchlist.length})
            </span>
          </div>

          <form onSubmit={handleQuickAdd} className="flex gap-1.5">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Add US ticker..."
              aria-label="Add US stock symbol to watchlist"
              maxLength={8}
              className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="submit"
              aria-label="Add symbol"
              className="p-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white transition shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {watchlist.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-slate-400">
              Empty watchlist. Search or type a US symbol above.
            </p>
          ) : (
            <ul className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {watchlist.map((sym) => {
                const selected = sym === activeSymbol;
                return (
                  <li key={sym} className="group flex items-center gap-1">
                    <button
                      onClick={() => {
                        onSelectSymbol(sym);
                        if (activeTab !== 'overview') onSelectTab('overview');
                      }}
                      className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                        selected
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span>{sym}</span>
                      <span className="text-[10px] font-sans font-normal text-slate-400">US</span>
                    </button>
                    <button
                      onClick={() => {
                        onRemoveSymbol(sym);
                        toast.info(`Removed ${sym} from watchlist`);
                      }}
                      aria-label={`Remove ${sym} from watchlist`}
                      className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Rate Limit / Architecture Footer */}
      <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Finnhub Free Hub</span>
        </div>
        <p className="leading-snug text-[10px]">
          25+ Free Endpoints active • Server caching &amp; deduplication enabled.
        </p>
      </div>
    </aside>
  );
}
