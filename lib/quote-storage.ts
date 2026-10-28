import { FinnhubQuote } from '@/lib/finnhub/schemas';

const CACHED_QUOTES_KEY = 'marketdash_cached_quotes';

export interface StoredQuoteEntry {
  symbol: string;
  quote: FinnhubQuote;
  savedAt: number;
}

export function saveCachedQuote(symbol: string, quote: FinnhubQuote): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CACHED_QUOTES_KEY);
    const map: Record<string, StoredQuoteEntry> = raw ? JSON.parse(raw) : {};
    map[symbol.toUpperCase()] = {
      symbol: symbol.toUpperCase(),
      quote,
      savedAt: Date.now(),
    };
    localStorage.setItem(CACHED_QUOTES_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function getCachedQuote(symbol: string): StoredQuoteEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_QUOTES_KEY);
    if (!raw) return null;
    const map: Record<string, StoredQuoteEntry> = JSON.parse(raw);
    return map[symbol.toUpperCase()] || null;
  } catch {
    return null;
  }
}

export function getAllCachedQuotes(): StoredQuoteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHED_QUOTES_KEY);
    if (!raw) return [];
    const map: Record<string, StoredQuoteEntry> = JSON.parse(raw);
    return Object.values(map).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}
