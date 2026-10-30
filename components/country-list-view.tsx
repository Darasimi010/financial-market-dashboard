'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubCountry } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Globe, Search, ShieldCheck } from 'lucide-react';

export function CountryListView() {
  const [countries, setCountries] = useState<FinnhubCountry[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch('/api/country')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load global country dataset');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setCountries(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching countries');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      (c.currency && c.currency.toLowerCase().includes(search.toLowerCase())) ||
      (c.currencyCode && c.currencyCode.toLowerCase().includes(search.toLowerCase())) ||
      (c.region && c.region.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Global Country Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Finnhub country directory with currencies, geographical regions, and sovereign credit parameters.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country, currency, or region..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono shadow-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, 60).map((c) => (
            <div
              key={c.code3 || c.code2 || c.country}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md space-y-2 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={c.country}>
                    {c.country}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {c.code2 || c.code3 || 'XX'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Currency</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                    {c.currencyCode || c.currency || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Region</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                    {c.region || 'Global'}
                  </span>
                </div>
                {c.rating && (
                  <div className="col-span-2 flex items-center gap-1 text-[11px] text-amber-500 pt-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Credit Rating: {c.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

