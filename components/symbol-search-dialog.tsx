'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, History, ShieldCheck } from 'lucide-react';
import { FinnhubSymbolLookupInfo } from '@/lib/finnhub/schemas';

interface SymbolSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
}

const RECENT_SEARCHES_KEY = 'marketdash_recent_searches';

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.slice(0, 5);
    }
  } catch {
    // ignore
  }
  return [];
}

export function SymbolSearchDialog({ isOpen, onClose, onSelectSymbol }: SymbolSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FinnhubSymbolLookupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Debounced search
  useEffect(() => {
    const clean = query.trim();
    if (!clean) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setResults(json.data?.result || []);
        }
      } catch {
        // silent fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = useCallback(
    (sym: string) => {
      const clean = sym.trim().toUpperCase();
      try {
        const next = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 6);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        setRecentSearches(next);
      } catch {
        // ignore
      }
      onSelectSymbol(clean);
      handleClose();
    },
    [recentSearches, onSelectSymbol, handleClose]
  );

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const visibleResults = hasQuery ? results : [];

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) {
                setResults([]);
                setIsLoading(false);
              }
            }}
            placeholder="Search US symbols or companies (e.g. AAPL, NVDA, Microsoft)..."
            className="w-full h-14 pl-3 pr-8 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden text-sm"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsLoading(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
              ESC
            </kbd>
          )}
        </div>

        {/* Free Tier Notice */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            US-listed stocks only
          </span>
        </div>

        {/* Results or Recents */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {isLoading && hasQuery && (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Searching market symbols...
            </div>
          )}

          {!isLoading && hasQuery && visibleResults.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              We couldn&apos;t find that symbol. This covers US stocks only.
            </div>
          )}

          {!isLoading && hasQuery && visibleResults.length > 0 && (
            <div className="space-y-0.5">
              {visibleResults.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition">
                      {item.symbol}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {item.description}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {item.type || 'US Stock'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!hasQuery && (
            <div className="p-2 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <History className="w-3.5 h-3.5" />
                    Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSelect(s)}
                        className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Popular US Tickers
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { sym: 'AAPL', name: 'Apple Inc' },
                    { sym: 'NVDA', name: 'NVIDIA Corp' },
                    { sym: 'MSFT', name: 'Microsoft Corp' },
                    { sym: 'AMZN', name: 'Amazon.com' },
                    { sym: 'GOOGL', name: 'Alphabet Inc' },
                    { sym: 'TSLA', name: 'Tesla Inc' },
                  ].map((stock) => (
                    <button
                      key={stock.sym}
                      onClick={() => handleSelect(stock.sym)}
                      className="flex flex-col items-start px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-left transition"
                    >
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {stock.sym}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate w-full">
                        {stock.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
