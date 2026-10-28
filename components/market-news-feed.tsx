'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubNewsItem } from '@/lib/finnhub/schemas';
import { Skeleton, ErrorState, EmptyState } from './ui-states';
import { Newspaper, ExternalLink, Clock, Tag } from 'lucide-react';

interface MarketNewsFeedProps {
  symbol?: string;
  limit?: number;
}

function formatTimeAgoPure(unixSeconds: number, nowSec: number): string {
  if (!nowSec) {
    return new Date(unixSeconds * 1000).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }
  const diff = Math.max(0, nowSec - unixSeconds);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function MarketNewsFeed({ symbol, limit = 15 }: MarketNewsFeedProps) {
  const [news, setNews] = useState<FinnhubNewsItem[]>([]);
  const [category, setCategory] = useState<'general' | 'forex' | 'crypto' | 'merger'>('general');
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [referenceNowSec, setReferenceNowSec] = useState<number>(0);

  const requestKey = `${symbol || 'market'}:${category}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = symbol
          ? `/api/news?symbol=${encodeURIComponent(symbol)}`
          : `/api/news?category=${category}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load market news');
        }
        if (!cancelled) {
          setNews(json.data || []);
          setReferenceNowSec(Math.floor(Date.now() / 1000));
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Market data is temporarily unavailable';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoadedKey(requestKey);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, category, requestKey]);

  const filteredNews = news
    .filter((item) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.headline.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {symbol ? `${symbol} Company News` : 'Market News Feed'}
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            Real-time
          </span>
        </div>

        {/* Categories if general news */}
        {!symbol && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs font-medium self-start sm:self-auto">
            {(['general', 'forex', 'crypto', 'merger'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  category === cat
                    ? 'bg-white dark:bg-slate-900 text-emerald-500 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter news by headline or keyword..."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
        />
      </div>

      {/* News Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
              <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      ) : filteredNews.length === 0 ? (
        <EmptyState
          title="No news found"
          description="No recent market articles match your current filter."
          actionLabel="Clear filter"
          onAction={() => setSearchFilter('')}
        />
      ) : (
        <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="pt-3.5 first:pt-0 flex flex-col sm:flex-row items-start gap-4 group"
            >
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.headline}
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-28 h-24 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.source}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgoPure(item.datetime, referenceNowSec)}
                  </span>
                  {item.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{item.category}</span>
                    </>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition line-clamp-2 mb-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    {item.headline}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </a>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
                {item.related && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-slate-400">
                    <Tag className="w-3 h-3" />
                    <span>Tickers: {item.related}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
