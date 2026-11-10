'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FinnhubFilingItem } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { FileText, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';

interface SecFilingsCardProps {
  symbol: string;
}

export function SecFilingsCard({ symbol }: SecFilingsCardProps) {
  const [filings, setFilings] = useState<FinnhubFilingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchId = ++fetchIdRef.current;

    fetch(`/api/sec-filings?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load SEC filings');
        return res.json();
      })
      .then((json) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setFilings(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error fetching filings');
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

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            SEC Filings &amp; Disclosures
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          EDGAR Free Feed
        </span>
      </div>

      {filings.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">No recent SEC filings reported.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-none">
          {filings.slice(0, 10).map((f, i) => (
            <div
              key={f.accessNumber || i}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                    Form {f.form || 'Filing'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {f.filedDate ? f.filedDate.split(' ')[0] : 'N/A'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  CIK: {f.cik || 'N/A'} • Acc: {f.accessNumber || 'N/A'}
                </div>
              </div>

              {f.filingUrl ? (
                <a
                  href={f.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 transition shrink-0"
                  title="View Official SEC Filing"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
