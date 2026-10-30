'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubStockSymbolItem } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Search, Database, ArrowRight } from 'lucide-react';

interface StockSymbolsDirectoryViewProps {
  onSelectSymbol?: (symbol: string) => void;
}

export function StockSymbolsDirectoryView({ onSelectSymbol }: StockSymbolsDirectoryViewProps) {
  const [symbols, setSymbols] = useState<FinnhubStockSymbolItem[]>([]);
  const [exchange, setExchange] = useState<string>('US');
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/stock-symbols?exchange=${encodeURIComponent(exchange)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stock symbols directory');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setSymbols(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching symbols');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [exchange]);

  const filtered = symbols.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      (s.displaySymbol && s.displaySymbol.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stock Symbols &amp; Identifier Lookup
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full directory of exchange-listed stock symbols, FIGI identifiers, and asset descriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker, name, or FIGI..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono shadow-xs"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.slice(0, 48).map((s) => (
            <div
              key={s.symbol}
              className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md space-y-2 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {s.displaySymbol || s.symbol}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {s.currency || 'USD'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={s.description}>
                {s.description || 'Stock Listing'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span className="truncate max-w-[140px]">
                  FIGI: {s.figi || 'N/A'}
                </span>
                {onSelectSymbol && (
                  <button
                    onClick={() => onSelectSymbol(s.symbol)}
                    className="inline-flex items-center gap-1 font-sans font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

