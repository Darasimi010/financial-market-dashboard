'use client';

import React, { useState, useEffect } from 'react';
import { FinnhubCompanyProfile2 } from '@/lib/finnhub/schemas';
import { Skeleton, ErrorState } from './ui-states';
import { Building2, Globe, Calendar, DollarSign, Layers } from 'lucide-react';

interface CompanyProfileCardProps {
  symbol: string;
}

export function CompanyProfileCard({ symbol }: CompanyProfileCardProps) {
  const [profile, setProfile] = useState<FinnhubCompanyProfile2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${symbol}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/profile?symbol=${encodeURIComponent(symbol)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load company profile');
        }
        if (!cancelled) {
          setProfile(json.data);
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
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
          Company Overview
        </h4>
        <ErrorState
          message={error || 'Failed to load profile'}
          onRetry={() => setRetryCount((c) => c + 1)}
        />
      </div>
    );
  }

  const formatMarketCap = (capMln?: number | null) => {
    if (!capMln) return 'N/A';
    if (capMln >= 1000000) {
      return `$${(capMln / 1000000).toFixed(2)}T`;
    }
    if (capMln >= 1000) {
      return `$${(capMln / 1000).toFixed(2)}B`;
    }
    return `$${capMln.toFixed(0)}M`;
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          {profile.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo}
              alt={`${profile.name || symbol} logo`}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-contain bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700 font-bold font-mono text-sm">
              {symbol.slice(0, 2)}
            </div>
          )}
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {profile.name || symbol}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{profile.exchange || 'US Market'}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {profile.finnhubIndustry || 'General'}
              </span>
            </div>
          </div>
        </div>

        {profile.weburl && (
          <a
            href={profile.weburl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
            title="Visit company website"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Fundamentals Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <DollarSign className="w-3 h-3" />
            Market Cap
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatMarketCap(profile.marketCapitalization)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Layers className="w-3 h-3" />
            Shares Out.
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {profile.shareOutstanding ? `${profile.shareOutstanding.toFixed(1)}M` : 'N/A'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Calendar className="w-3 h-3" />
            IPO Date
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {profile.ipo || 'N/A'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
            <Building2 className="w-3 h-3" />
            Country
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {profile.country || 'USA'}
          </div>
        </div>
      </div>
    </div>
  );
}
