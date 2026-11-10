'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FinnhubEarningsCalendarItem,
  FinnhubIpoItem,
  FinnhubMarketHolidayItem,
} from '@/lib/finnhub/schemas';
import { CardSkeleton, ErrorState } from './ui-states';
import { Calendar, Rocket, SunMedium, Clock } from 'lucide-react';

type CalendarTab = 'earnings' | 'ipos' | 'holidays';

export function MarketCalendarsView() {
  const [tab, setTab] = useState<CalendarTab>('earnings');
  const [earnings, setEarnings] = useState<FinnhubEarningsCalendarItem[]>([]);
  const [ipos, setIpos] = useState<FinnhubIpoItem[]>([]);
  const [holidays, setHolidays] = useState<FinnhubMarketHolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchId = ++fetchIdRef.current;

    Promise.all([
      fetch('/api/earnings-calendar').then((r) => r.json()),
      fetch('/api/ipo-calendar').then((r) => r.json()),
      fetch('/api/market-holiday?exchange=US').then((r) => r.json()),
    ])
      .then(([earnJson, ipoJson, holiJson]) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setEarnings(earnJson.data || []);
          setIpos(ipoJson.data || []);
          setHolidays(holiJson.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && fetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Error fetching calendar feeds');
        }
      })
      .finally(() => {
        if (!cancelled && fetchId === fetchIdRef.current) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Market Schedules &amp; Calendars
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time corporate earnings releases, upcoming IPO offerings, and exchange holiday
            closures.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50">
          <button
            onClick={() => setTab('earnings')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'earnings'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Earnings ({earnings.length})</span>
          </button>
          <button
            onClick={() => setTab('ipos')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'ipos'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>IPOs ({ipos.length})</span>
          </button>
          <button
            onClick={() => setTab('holidays')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'holidays'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span>Holidays ({holidays.length})</span>
          </button>
        </div>
      </div>

      {tab === 'earnings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnings.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-slate-400">
              No earnings reports scheduled for this window.
            </p>
          ) : (
            earnings.map((e, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {e.symbol}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {e.hour ? `${e.hour.toUpperCase()} session` : 'During Day'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Report Date</span>
                    <span className="font-mono font-semibold">{e.date || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Fiscal Quarter</span>
                    <span className="font-mono font-semibold">
                      Q{e.quarter || '1'} {e.year || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">EPS Est.</span>
                    <span className="font-mono font-semibold">
                      {e.epsEstimate !== null && e.epsEstimate !== undefined
                        ? `$${e.epsEstimate.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">EPS Actual</span>
                    <span className="font-mono font-semibold text-emerald-500">
                      {e.epsActual !== null && e.epsActual !== undefined
                        ? `$${e.epsActual.toFixed(2)}`
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'ipos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ipos.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-slate-400">
              No recent or upcoming IPO filings discovered.
            </p>
          ) : (
            ipos.map((ipo, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {ipo.symbol || 'TBD'}
                    </span>
                    <p className="text-xs text-slate-500 truncate" title={ipo.name || ''}>
                      {ipo.name || 'Company IPO'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {ipo.status || 'Priced'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Date</span>
                    <span className="font-mono font-semibold">{ipo.date || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Offering Price</span>
                    <span className="font-mono font-semibold text-emerald-500">
                      {ipo.price ? `$${ipo.price}` : 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Exchange</span>
                    <span className="font-mono font-semibold">{ipo.exchange || 'US Market'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-slate-400">
              No holiday closures recorded.
            </p>
          ) : (
            holidays.map((h, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {h.eventName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{h.atDate}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold shrink-0">
                  Market Closed
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
