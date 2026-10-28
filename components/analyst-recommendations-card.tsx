'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubRecommendation } from '@/lib/finnhub/schemas';
import { Skeleton, ErrorState, EmptyState } from './ui-states';
import { Users } from 'lucide-react';

interface AnalystRecommendationsCardProps {
  symbol: string;
}

export function AnalystRecommendationsCard({ symbol }: AnalystRecommendationsCardProps) {
  const [trends, setTrends] = useState<FinnhubRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${symbol}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/recommendation?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load analyst trends');
        }
        if (!cancelled) {
          setTrends(json.data || []);
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
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-6 w-full rounded-full" />
        <div className="grid grid-cols-5 gap-2 pt-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
          Analyst Consensus
        </h4>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  const latest = trends[0];
  if (!latest) {
    return (
      <EmptyState
        title="No Analyst Consensus"
        description={`No recent analyst recommendations available for ${symbol}.`}
      />
    );
  }

  const total =
    latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell || 1;

  const pct = (val: number) => `${((val / total) * 100).toFixed(1)}%`;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Analyst Consensus
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Period: {latest.period}</span>
      </div>

      {/* Stacked Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-4">
        {latest.strongBuy > 0 && (
          <div
            style={{ width: pct(latest.strongBuy) }}
            className="bg-emerald-600 h-full"
            title={`Strong Buy: ${latest.strongBuy}`}
          />
        )}
        {latest.buy > 0 && (
          <div
            style={{ width: pct(latest.buy) }}
            className="bg-emerald-400 h-full"
            title={`Buy: ${latest.buy}`}
          />
        )}
        {latest.hold > 0 && (
          <div
            style={{ width: pct(latest.hold) }}
            className="bg-amber-400 h-full"
            title={`Hold: ${latest.hold}`}
          />
        )}
        {latest.sell > 0 && (
          <div
            style={{ width: pct(latest.sell) }}
            className="bg-rose-400 h-full"
            title={`Sell: ${latest.sell}`}
          />
        )}
        {latest.strongSell > 0 && (
          <div
            style={{ width: pct(latest.strongSell) }}
            className="bg-rose-600 h-full"
            title={`Strong Sell: ${latest.strongSell}`}
          />
        )}
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {latest.strongBuy}
          </div>
          <div className="text-[9px] text-slate-500 uppercase">Str Buy</div>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <div className="text-xs font-bold text-emerald-500">{latest.buy}</div>
          <div className="text-[9px] text-slate-500 uppercase">Buy</div>
        </div>
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {latest.hold}
          </div>
          <div className="text-[9px] text-slate-500 uppercase">Hold</div>
        </div>
        <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
          <div className="text-xs font-bold text-rose-500">{latest.sell}</div>
          <div className="text-[9px] text-slate-500 uppercase">Sell</div>
        </div>
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
            {latest.strongSell}
          </div>
          <div className="text-[9px] text-slate-500 uppercase">Str Sell</div>
        </div>
      </div>
    </div>
  );
}
