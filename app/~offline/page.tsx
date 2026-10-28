'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { getAllCachedQuotes, StoredQuoteEntry } from '@/lib/quote-storage';
import { FINNHUB_CONFIG } from '@/lib/config';

export default function OfflineFallbackPage() {
  const [cached] = useState<StoredQuoteEntry[]>(() => getAllCachedQuotes());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {FINNHUB_CONFIG.errorMessages.offline}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              MarketDash cannot reach the network right now. Below are the most recent US equity
              quotes saved on this device.
            </p>
          </div>
        </div>

        {cached.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No cached quotes saved yet. Reconnect to the internet and open the dashboard to cache
            live quotes.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cached.map((item) => {
              const up = (item.quote.d ?? 0) >= 0;
              return (
                <div
                  key={item.symbol}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between font-mono"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.symbol}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Saved {new Date(item.savedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      ${item.quote.c.toFixed(2)}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        up ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {up ? '+' : ''}
                      {(item.quote.dp ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
