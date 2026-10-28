'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubEarningsSurprise } from '@/lib/finnhub/schemas';
import { Skeleton, ErrorState, EmptyState } from './ui-states';
import { Award } from 'lucide-react';

interface EarningsSurprisesCardProps {
  symbol: string;
}

export function EarningsSurprisesCard({ symbol }: EarningsSurprisesCardProps) {
  const [earnings, setEarnings] = useState<FinnhubEarningsSurprise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${symbol}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/earnings?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load earnings surprises');
        }
        if (!cancelled) {
          setEarnings(json.data || []);
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
  }, [symbol, requestKey]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
          EPS Surprises
        </h4>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <EmptyState
        title="No Earnings History"
        description={`No quarterly EPS surprise history found for ${symbol}.`}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Quarterly EPS Surprises
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Last 4Q</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
        <div className="grid grid-cols-4 py-1.5 text-[10px] text-slate-400 uppercase font-sans font-semibold">
          <span>Period</span>
          <span className="text-right">Est.</span>
          <span className="text-right">Actual</span>
          <span className="text-right">Surprise</span>
        </div>
        {earnings.slice(0, 4).map((q) => {
          const surprise = q.surprisePercent ?? 0;
          const beat = surprise >= 0;
          return (
            <div key={q.period} className="grid grid-cols-4 py-2.5 items-center">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                {q.quarter ? `Q${q.quarter} '${String(q.year || '').slice(-2)}` : q.period}
              </span>
              <span className="text-right text-slate-500">
                {q.estimate != null ? `$${q.estimate.toFixed(2)}` : '—'}
              </span>
              <span className="text-right font-bold text-slate-900 dark:text-slate-100">
                {q.actual != null ? `$${q.actual.toFixed(2)}` : '—'}
              </span>
              <span
                className={`text-right font-semibold ${
                  beat ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {beat ? '+' : ''}
                {surprise.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
