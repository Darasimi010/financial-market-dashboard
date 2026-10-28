'use client';

import { useState, useEffect, useCallback } from 'react';
import { sanitizeSymbol, isUSStockSymbol } from '@/lib/config';

const WATCHLIST_STORAGE_KEY = 'marketdash_watchlist';
export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'];

function readInitialWatchlist(): string[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST;
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeSymbol);
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_WATCHLIST;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(readInitialWatchlist);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WATCHLIST_STORAGE_KEY)) {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      }
    } catch {
      // ignore
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WATCHLIST_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWatchlist(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [watchlist]);

  const saveWatchlist = useCallback((newList: string[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
    } catch (err) {
      console.warn('Failed to save watchlist to localStorage:', err);
    }
  }, []);

  const addToWatchlist = useCallback(
    (rawSymbol: string): boolean => {
      const symbol = sanitizeSymbol(rawSymbol);
      if (!isUSStockSymbol(symbol)) return false;
      if (watchlist.includes(symbol)) return true;
      const updated = [symbol, ...watchlist];
      saveWatchlist(updated);
      return true;
    },
    [watchlist, saveWatchlist]
  );

  const removeFromWatchlist = useCallback(
    (rawSymbol: string) => {
      const symbol = sanitizeSymbol(rawSymbol);
      const updated = watchlist.filter((s) => s !== symbol);
      saveWatchlist(updated);
    },
    [watchlist, saveWatchlist]
  );

  const toggleWatchlist = useCallback(
    (rawSymbol: string): boolean => {
      const symbol = sanitizeSymbol(rawSymbol);
      if (watchlist.includes(symbol)) {
        removeFromWatchlist(symbol);
        return false;
      }
      return addToWatchlist(symbol);
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const isInWatchlist = useCallback(
    (rawSymbol: string): boolean => {
      return watchlist.includes(sanitizeSymbol(rawSymbol));
    },
    [watchlist]
  );

  return {
    watchlist,
    isLoaded: true,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    saveWatchlist,
  };
}
