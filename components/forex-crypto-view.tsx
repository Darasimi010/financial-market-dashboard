'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubPairSymbol } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Coins, ArrowLeftRight, Search } from 'lucide-react';

export function ForexCryptoView() {
  const [assetType, setAssetType] = useState<'crypto' | 'forex'>('crypto');
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [symbols, setSymbols] = useState<FinnhubPairSymbol[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load exchanges when assetType changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const endpoint = assetType === 'crypto' ? '/api/crypto' : '/api/forex';
    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${assetType} exchanges`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          const list: string[] = json.data || [];
          setExchanges(list);
          const defaultEx = assetType === 'crypto' ? (list.includes('BINANCE') ? 'BINANCE' : list[0]) : (list.includes('oanda') ? 'oanda' : list[0]);
          setSelectedExchange(defaultEx || '');
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching exchanges');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assetType]);

  // Load symbols when selectedExchange changes
  useEffect(() => {
    if (!selectedExchange) return;
    let cancelled = false;
    setIsLoading(true);

    const endpoint =
      assetType === 'crypto'
        ? `/api/crypto?exchange=${encodeURIComponent(selectedExchange)}`
        : `/api/forex?exchange=${encodeURIComponent(selectedExchange)}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load symbols for ${selectedExchange}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setSymbols(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching symbols');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assetType, selectedExchange]);

  const filteredSymbols = symbols.filter(
    (s) =>
      s.symbol.toLowerCase().includes(filterText.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(filterText.toLowerCase())) ||
      (s.displaySymbol && s.displaySymbol.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Forex &amp; Crypto Markets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supported free Finnhub multi-asset feeds across global crypto and currency exchanges.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50">
          <button
            onClick={() => setAssetType('crypto')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              assetType === 'crypto'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Crypto Pairs</span>
          </button>
          <button
            onClick={() => setAssetType('forex')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              assetType === 'forex'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Forex FX</span>
          </button>
        </div>
      </div>

      {/* Exchange Switcher + Filter Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 shrink-0 uppercase font-mono">Exchanges:</span>
          {exchanges.map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedExchange(ex)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition ${
                selectedExchange === ex
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={`Filter ${symbols.length} pairs...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSymbols.slice(0, 48).map((pair) => (
            <div
              key={pair.symbol}
              className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md space-y-1 hover:border-emerald-500/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {pair.displaySymbol || pair.symbol}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {selectedExchange}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate" title={pair.description}>
                {pair.description || pair.symbol}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

