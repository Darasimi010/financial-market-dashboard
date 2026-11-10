'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FinnhubPatentItem,
  FinnhubVisaItem,
  FinnhubLobbyingItem,
  FinnhubSpendingItem,
} from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Award, Briefcase, Landmark, Building2, ExternalLink } from 'lucide-react';

interface GovPatentCardProps {
  symbol: string;
}

type Tab = 'patents' | 'visas' | 'lobbying' | 'spending';

export function GovPatentCard({ symbol }: GovPatentCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('visas');
  const [patents, setPatents] = useState<FinnhubPatentItem[]>([]);
  const [visas, setVisas] = useState<FinnhubVisaItem[]>([]);
  const [lobbying, setLobbying] = useState<FinnhubLobbyingItem[]>([]);
  const [spending, setSpending] = useState<FinnhubSpendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchId = ++fetchIdRef.current;

    Promise.all([
      fetch(`/api/visas?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
      fetch(`/api/usa-spending?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
      fetch(`/api/patents?symbol=${encodeURIComponent(symbol)}&from=2020-01-01`).then((r) =>
        r.json()
      ),
      fetch(`/api/lobbying?symbol=${encodeURIComponent(symbol)}&from=2020-01-01`).then((r) =>
        r.json()
      ),
    ])
      .then(([visaJson, spendJson, patentJson, lobbJson]) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setVisas(visaJson.data || []);
          setSpending(spendJson.data || []);
          setPatents(patentJson.data || []);
          setLobbying(lobbJson.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error fetching government data');
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

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'visas',
      label: 'Visa H-1B',
      count: visas.length,
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    {
      id: 'spending',
      label: 'USA Spending',
      count: spending.length,
      icon: <Landmark className="w-3.5 h-3.5" />,
    },
    {
      id: 'patents',
      label: 'USPTO Patents',
      count: patents.length,
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      id: 'lobbying',
      label: 'Lobbying',
      count: lobbying.length,
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Corporate &amp; Government Intelligence
        </h3>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          US Public Records
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
              activeTab === t.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            <span className="text-[10px] opacity-75 font-mono">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
        {activeTab === 'visas' &&
          (visas.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No visa applications recorded.
            </p>
          ) : (
            visas.slice(0, 6).map((v, i) => (
              <div
                key={v.caseNumber || i}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {v.jobTitle || 'Specialist Role'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {v.worksiteCity}, {v.worksiteState} • {v.visaClass || 'H-1B'} (
                    {v.caseStatus || 'Certified'})
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-500 shrink-0">
                  ${v.wageRangeFrom ? `${Math.round(v.wageRangeFrom / 1000)}k` : 'N/A'}/yr
                </div>
              </div>
            ))
          ))}

        {activeTab === 'spending' &&
          (spending.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No government contract awards found.
            </p>
          ) : (
            spending.slice(0, 6).map((s, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div
                    className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                    title={s.awardDescription}
                  >
                    {s.awardDescription || 'Government Contract'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {s.awardingAgencyName || 'Federal Agency'} • {s.actionDate || 'Recent'}
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-500 shrink-0">
                  ${s.totalValue ? `${(s.totalValue / 1000).toFixed(0)}k` : 'N/A'}
                </div>
              </div>
            ))
          ))}

        {activeTab === 'patents' &&
          (patents.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No patent disclosures logged.</p>
          ) : (
            patents.slice(0, 6).map((p, i) => (
              <div
                key={p.patentNumber || i}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    {p.patentNumber || 'USPTO Patent'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.filingDate ? p.filingDate.split(' ')[0] : 'N/A'}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 line-clamp-2 text-[11px] leading-snug">
                  {p.description || 'Patent filing details'}
                </div>
              </div>
            ))
          ))}

        {activeTab === 'lobbying' &&
          (lobbying.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No senate lobbying records filed.
            </p>
          ) : (
            lobbying.slice(0, 6).map((l, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Senate Filing {l.period} {l.year}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Reg: {l.registrantId || 'N/A'} • Senate ID: {l.senateId || 'N/A'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="font-mono text-xs font-bold text-amber-500">
                    ${l.expenses ? `${(l.expenses / 1e6).toFixed(2)}M` : 'N/A'}
                  </div>
                  {l.documentUrl && (
                    <a
                      href={l.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-emerald-500"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
