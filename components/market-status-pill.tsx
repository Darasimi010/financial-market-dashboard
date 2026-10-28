'use client';

import React, { useEffect, useState } from 'react';
import { FinnhubMarketStatus } from '@/lib/finnhub/schemas';

export function MarketStatusPill() {
  const [status, setStatus] = useState<FinnhubMarketStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/market-status?exchange=US');
        if (res.ok) {
          const json = await res.json();
          if (mounted) setStatus(json.data);
        }
      } catch {
        // silent fallback
      }
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (!status) {
    return (
      <div className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
        <span>US Market</span>
      </div>
    );
  }

  const isOpen = status.isOpen;
  const sessionLabel = status.session
    ? status.session.replace('-', ' ')
    : isOpen
      ? 'Regular'
      : 'Closed';

  return (
    <div
      className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-700 dark:text-slate-300"
      title={`Exchange: ${status.exchange} (${status.timezone || 'America/New_York'})`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span className="font-semibold">NYSE/NASDAQ:</span>
      <span className="capitalize text-slate-500 dark:text-slate-400">{sessionLabel}</span>
    </div>
  );
}
