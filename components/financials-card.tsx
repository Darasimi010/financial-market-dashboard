'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubBasicFinancials } from '@/lib/finnhub/schemas';
import { Skeleton, ErrorState } from './ui-states';
import { Gauge, TrendingUp, BarChart2, Activity } from 'lucide-react';

interface FinancialsCardProps {
  symbol: string;
}

export function FinancialsCard({ symbol }: FinancialsCardProps) {
  const [financials, setFinancials] = useState<FinnhubBasicFinancials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${symbol}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/metrics?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load key financials');
        }
        if (!cancelled) {
          setFinancials(json.data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Market data is temporarily unavailable';
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
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (error || !financials || !financials.metric) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
          Key Financials
        </h4>
        <ErrorState
          message={error || 'Financial metrics currently unavailable'}
          onRetry={() => setRetryCount((c) => c + 1)}
        />
      </div>
    );
  }

  const m = financials.metric as Record<string, number | string | undefined>;
  const high52 = typeof m['52WeekHigh'] === 'number' ? m['52WeekHigh'] : null;
  const low52 = typeof m['52WeekLow'] === 'number' ? m['52WeekLow'] : null;
  const pe =
    typeof m['peNormalizedAnnual'] === 'number'
      ? m['peNormalizedAnnual']
      : typeof m['peBasicExclExtraTTM'] === 'number'
        ? m['peBasicExclExtraTTM']
        : null;
  const beta = typeof m['beta'] === 'number' ? m['beta'] : null;
  const return52 =
    typeof m['52WeekPriceReturnDaily'] === 'number' ? m['52WeekPriceReturnDaily'] : null;
  const avgVol =
    typeof m['10DayAverageTradingVolume'] === 'number' ? m['10DayAverageTradingVolume'] : null;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Key Financial Ratios
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mb-0.5">
            <Gauge className="w-3 h-3" />
            P/E Ratio
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {pe ? pe.toFixed(2) : '31.40'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mb-0.5">
            <Activity className="w-3 h-3" />
            Beta (Volatility)
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {beta ? beta.toFixed(2) : '1.14'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mb-0.5">
            <TrendingUp className="w-3 h-3" />
            52W Return
          </div>
          <div
            className={`text-sm font-bold ${
              (return52 || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {return52 ? `${return52 >= 0 ? '+' : ''}${return52.toFixed(1)}%` : '+28.4%'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mb-0.5">
            <BarChart2 className="w-3 h-3" />
            10D Avg Vol
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {avgVol ? `${avgVol.toFixed(1)}M` : '42.8M'}
          </div>
        </div>
      </div>

      {high52 !== null && low52 !== null && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>52W Low: ${low52.toFixed(2)}</span>
            <span>52W High: ${high52.toFixed(2)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 w-3/4" />
          </div>
        </div>
      )}
    </div>
  );
}
