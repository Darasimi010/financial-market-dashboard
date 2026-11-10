'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  currentPrice?: number;
}

export function PriceChart({ symbol, currentPrice: externalPrice }: PriceChartProps) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loadedSymbol, setLoadedSymbol] = useState<string | null>(null);

  const isLoading = loadedSymbol !== symbol;

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setLivePrice(json.data.c);
      }
    } catch {
      // silently fail – externalPrice fallback will be used
    } finally {
      setLoadedSymbol(symbol);
    }
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await fetchQuote();
      }
    })();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchQuote();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchQuote]);

  const displayPrice = livePrice ?? externalPrice ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {symbol} Price Chart
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Candlestick charts is restricted to paid subscribers only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && !displayPrice ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching price…</span>
            </div>
          ) : displayPrice != null ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 font-mono">Current Live Price:</span>
                <span className="text-lg font-mono font-bold text-emerald-500">
                  ${displayPrice?.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-400">Price unavailable</span>
          )}
        </div>
      </div>

      <div className="my-8 py-8 px-6 rounded-xl bg-slate-100/90 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h4 className="text-base font-bold text-slate-100">Candle Chart Behind Paywall</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Historical OHLCV candle streams require a paid subscription. All free APIs (real-time
            quotes, financials, filings, senate lobbying, USPTO patents, crypto, forex, and news)
            remain fully functional and unlimited on this dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <a
            href="https://github.com/Darasimi010"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition"
          >
            <span>Contact the developer</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Real-Time Quote</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Financials &amp; SEC</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Gov &amp; Patents</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Candlesticks</div>
          <div className="font-bold text-amber-500 mt-0.5">Paid Tier Only</div>
        </div>
      </div>
    </div>
  );
}
