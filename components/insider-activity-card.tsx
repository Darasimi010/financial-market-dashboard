'use client';

import { useState, useEffect, useRef } from 'react';
import { FinnhubInsiderTransactionItem, FinnhubInsiderSentimentItem } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Users, TrendingDown, TrendingUp } from 'lucide-react';

interface InsiderActivityCardProps {
  symbol: string;
}

export function InsiderActivityCard({ symbol }: InsiderActivityCardProps) {
  const [transactions, setTransactions] = useState<FinnhubInsiderTransactionItem[]>([]);
  const [sentiments, setSentiments] = useState<FinnhubInsiderSentimentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchId = ++fetchIdRef.current;

    Promise.all([
      fetch(`/api/insider-transactions?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
      fetch(`/api/insider-sentiment?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
    ])
      .then(([txJson, sentJson]) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setTransactions(txJson.data || []);
          setSentiments(sentJson.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error loading insider data');
        }
      })
      .finally(() => {
        if (!cancelled && fetchId === fetchIdRef.current) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} />;

  const latestSentiment = sentiments[0];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Insider Transactions &amp; Sentiment
          </h3>
        </div>
        {latestSentiment && (
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
            <span className="text-slate-400">MSPR Score:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                (latestSentiment.mspr || 0) >= 0
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              {(latestSentiment.mspr || 0).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          No recent insider transactions recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 5).map((tx, idx) => {
            const isBuy = (tx.change || 0) > 0;
            return (
              <div
                key={tx.id || idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {tx.name || 'Executive / Insider'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>{tx.transactionDate || tx.filingDate || 'Recent'}</span>
                    <span>•</span>
                    <span>Code: {tx.transactionCode || 'S'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-mono font-bold flex items-center justify-end gap-1 ${
                      isBuy ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {isBuy ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {isBuy ? '+' : ''}
                      {tx.change ? Math.abs(tx.change).toLocaleString() : '0'} shs
                    </span>
                  </div>
                  {tx.transactionPrice && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      @ ${tx.transactionPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
