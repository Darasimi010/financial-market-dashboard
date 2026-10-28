'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FinnhubQuote } from '@/lib/finnhub/schemas';
import { QuoteCardSkeleton, ErrorState } from './ui-states';
import { useWatchlist } from '@/hooks/use-watchlist';
import { saveCachedQuote, getCachedQuote } from '@/lib/quote-storage';
import { FINNHUB_CONFIG } from '@/lib/config';
import { Star, RefreshCw, ArrowUpRight, ArrowDownRight, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteCardProps {
  symbol: string;
  isSelected?: boolean;
  onSelect?: (symbol: string) => void;
  pollingIntervalMs?: number;
}

export function QuoteCard({
  symbol,
  isSelected = false,
  onSelect,
  pollingIntervalMs = 30000,
}: QuoteCardProps) {
  const [quote, setQuote] = useState<FinnhubQuote | null>(null);
  const [loadedSymbol, setLoadedSymbol] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isShowingCachedOffline, setIsShowingCachedOffline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const isStarred = isInWatchlist(symbol);
  const isLoading = loadedSymbol !== symbol;

  const performFetch = useCallback(
    async (isManualRefresh: boolean) => {
      try {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || FINNHUB_CONFIG.errorMessages.unauthorized);
        }
        setQuote(json.data);
        setIsShowingCachedOffline(false);
        setError(null);
        saveCachedQuote(symbol, json.data);
      } catch (err: unknown) {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const cached = getCachedQuote(symbol);
        if (cached && (isOffline || err instanceof TypeError)) {
          setQuote(cached.quote);
          setIsShowingCachedOffline(true);
          setError(null);
          if (isManualRefresh) {
            toast.warning(FINNHUB_CONFIG.errorMessages.offline);
          }
        } else {
          const msg = isOffline
            ? FINNHUB_CONFIG.errorMessages.offline
            : err instanceof Error
              ? err.message
              : FINNHUB_CONFIG.errorMessages.unauthorized;
          setError(msg);
          if (isManualRefresh) {
            toast.error(msg);
          }
        }
      } finally {
        setLoadedSymbol(symbol);
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [symbol]
  );

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);
    void performFetch(true);
  }, [performFetch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await performFetch(false);
      }
    })();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void performFetch(false);
      }
    }, pollingIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [performFetch, pollingIntervalMs]);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleWatchlist(symbol);
    if (added) {
      toast.success(`Added ${symbol} to watchlist`);
    } else {
      toast.info(`Removed ${symbol} from watchlist`);
    }
  };

  if (isLoading) {
    return <QuoteCardSkeleton />;
  }

  if (error || !quote) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{symbol}</span>
          <button
            onClick={handleManualRefresh}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <ErrorState message={error || 'Failed to load quote'} onRetry={handleManualRefresh} />
      </div>
    );
  }

  const isPositive = (quote.d ?? 0) >= 0;
  const changeValue = Math.abs(quote.d ?? 0);
  const changePct = Math.abs(quote.dp ?? 0);

  const rangeSpan = quote.h - quote.l;
  const rangeProgress =
    rangeSpan > 0 ? Math.min(100, Math.max(0, ((quote.c - quote.l) / rangeSpan) * 100)) : 50;

  return (
    <div
      onClick={() => onSelect?.(symbol)}
      className={`group relative rounded-2xl border p-5 transition cursor-pointer ${
        isSelected
          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30'
          : 'border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      {/* Top Header: Symbol & Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition">
            {symbol}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500">
            US
          </span>
          {isShowingCachedOffline && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-600 dark:text-amber-400"
              title={FINNHUB_CONFIG.errorMessages.offline}
            >
              <WifiOff className="w-3 h-3" />
              Cached
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualRefresh();
            }}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Refresh quote"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`}
            />
          </button>
          <button
            onClick={handleToggleWatchlist}
            className={`p-1.5 rounded-lg transition ${
              isStarred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
            }`}
            title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Primary Price & Change */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
          ${quote.c.toFixed(2)}
        </span>
        <div
          className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {isPositive ? '+' : '-'}
            {changeValue.toFixed(2)} ({changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Daily High / Low Progress Bar */}
      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex justify-between items-center text-[10px]">
          <span>Low: ${quote.l.toFixed(2)}</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Day Range</span>
          <span>High: ${quote.h.toFixed(2)}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPositive ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${rangeProgress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
          <span>Open: ${quote.o.toFixed(2)}</span>
          <span>Prev Close: ${quote.pc.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
