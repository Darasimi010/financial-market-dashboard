'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FinnhubFinancialsReportedItem } from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Landmark, TrendingUp, DollarSign } from 'lucide-react';

interface ReportLineItem {
  label?: string;
  concept?: string;
  value?: string | number;
  unit?: string;
}

interface FinancialsReportedCardProps {
  symbol: string;
}

export function FinancialsReportedCard({ symbol }: FinancialsReportedCardProps) {
  const [reports, setReports] = useState<FinnhubFinancialsReportedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchId = ++fetchIdRef.current;

    fetch(`/api/financials-reported?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reported financials');
        return res.json();
      })
      .then((json) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setReports(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error fetching financials as reported');
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

  const latest = reports[0];
  const bsItems: ReportLineItem[] = (latest?.report?.bs as ReportLineItem[]) || [];
  const icItems: ReportLineItem[] = (latest?.report?.ic as ReportLineItem[]) || [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Financials as Reported (GAAP/SEC)
          </h3>
        </div>
        {latest && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            FY {latest.year} {latest.form || 'Report'}
          </span>
        )}
      </div>

      {!latest ? (
        <p className="text-xs text-slate-400 py-3 text-center">No reported financials available.</p>
      ) : (
        <div className="space-y-3">
          {icItems.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>Income Statement Highlights</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {icItems.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-500 truncate max-w-[130px]" title={item.label || item.concept}>
                      {item.label || item.concept}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {typeof item.value === 'number'
                        ? `$${(item.value / 1e9).toFixed(2)}B`
                        : String(item.value || 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bsItems.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span>Balance Sheet Highlights</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bsItems.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-500 truncate max-w-[130px]" title={item.label || item.concept}>
                      {item.label || item.concept}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {typeof item.value === 'number'
                        ? `$${(item.value / 1e9).toFixed(2)}B`
                        : String(item.value || 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

