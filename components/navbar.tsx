'use client';

import Link from 'next/link';
import { Search, Sun, Moon, BarChart2 } from 'lucide-react';
import { useTheme } from './theme-provider';
import { MarketStatusPill } from './market-status-pill';
import { PWAInstallButton } from './pwa-install-button';

interface NavbarProps {
  onOpenSearch?: () => void;
  showSearch?: boolean;
}

export function Navbar({ onOpenSearch, showSearch = true }: NavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-screen h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md overflow-x-hidden">
      <div className="h-full max-w-[1600px] mx-auto px-4 flex items-center justify-between gap-4">
        {/* Left: Brand & Market Status */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                MarketDash
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                US Stocks • Free
              </span>
            </div>
          </Link>

          <MarketStatusPill />
        </div>

        {/* Center/Right: Search, Install, Theme */}
        <div className="flex items-center gap-2.5">
          {showSearch && onOpenSearch && (
            <button
              onClick={onOpenSearch}
              aria-label="Search US stock symbols"
              className="flex items-center justify-between gap-3 px-3 py-1.5 w-10 xs:w-16 sm:w-64 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Search US ticker...</span>
              </span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-400">
                ⌘K
              </kbd>
            </button>
          )}

          <PWAInstallButton />

          <button
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
