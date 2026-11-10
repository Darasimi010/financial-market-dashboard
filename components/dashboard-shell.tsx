'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './navbar';
import { Sidebar, DashboardTab } from './sidebar';
import { BottomNav } from './bottom-nav';
import { SymbolSearchDialog } from './symbol-search-dialog';
import { QuoteCard } from './quote-card';
import { CompanyProfileCard } from './company-profile-card';
import { FinancialsCard } from './financials-card';
import { AnalystRecommendationsCard } from './analyst-recommendations-card';
import { EarningsSurprisesCard } from './earnings-surprises-card';
import { MarketNewsFeed } from './market-news-feed';
import { SecFilingsCard } from './sec-filings-card';
import { FinancialsReportedCard } from './financials-reported-card';
import { InsiderActivityCard } from './insider-activity-card';
import { GovPatentCard } from './gov-patent-card';
import { CompanyPeersCard } from './company-peers-card';
import { MarketCalendarsView } from './market-calendars-view';
import { ChartSkeleton, EmptyState } from './ui-states';
import { useWatchlist } from '@/hooks/use-watchlist';
import { FINNHUB_CONFIG, isUSStockSymbol, sanitizeSymbol } from '@/lib/config';
import { Star, Search } from 'lucide-react';
import { toast } from 'sonner';

// Dynamically lazy-load the interactive PriceChart component
const DynamicPriceChart = dynamic(() => import('./price-chart').then((mod) => mod.PriceChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

interface DashboardShellProps {
  initialSymbol?: string;
}

export function DashboardShell({ initialSymbol }: DashboardShellProps) {
  const {
    watchlist,
    isLoaded: watchlistLoaded,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  } = useWatchlist();

  const validInitial =
    initialSymbol && isUSStockSymbol(initialSymbol) ? sanitizeSymbol(initialSymbol) : 'AAPL';

  const [activeSymbol, setActiveSymbol] = useState<string>(validInitial);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global Cmd+K / Ctrl+K shortcut to open search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectSymbol = (rawSym: string) => {
    const sym = sanitizeSymbol(rawSym);
    if (!isUSStockSymbol(sym)) {
      toast.error(FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
      return;
    }
    setActiveSymbol(sym);
    setActiveTab('overview');
  };

  const starred = isInWatchlist(activeSymbol);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0">
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} showSearch />

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeSymbol={activeSymbol}
          onSelectSymbol={handleSelectSymbol}
          watchlist={watchlist}
          onAddSymbol={addToWatchlist}
          onRemoveSymbol={removeFromWatchlist}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Active Ticker Analysis View */}
          {activeTab === 'overview' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {activeSymbol} Market Overview
                  </h1>
                  <button
                    onClick={() => {
                      const added = toggleWatchlist(activeSymbol);
                      toast.success(
                        added
                          ? `Added ${activeSymbol} to watchlist`
                          : `Removed ${activeSymbol} from watchlist`
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                      starred
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Switch Ticker</span>
                </button>
              </div>

              {/* Mobile Horizontal Watchlist Strip */}
              {watchlistLoaded && watchlist.length > 0 && (
                <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
                  {watchlist.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setActiveSymbol(sym)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 border transition ${
                        sym === activeSymbol
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              )}

              {/* Primary Chart + Multi-Card Financials Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 space-y-6">
                  <DynamicPriceChart symbol={activeSymbol} />
                  <CompanyPeersCard symbol={activeSymbol} onSelectPeer={handleSelectSymbol} />
                  <GovPatentCard symbol={activeSymbol} />
                  <FinancialsReportedCard symbol={activeSymbol} />
                  <SecFilingsCard symbol={activeSymbol} />
                  <MarketNewsFeed symbol={activeSymbol} limit={6} />
                </div>

                <div className="xl:col-span-4 space-y-6">
                  <QuoteCard
                    symbol={activeSymbol}
                    pollingIntervalMs={FINNHUB_CONFIG.clientPollingIntervalMs}
                  />
                  <CompanyProfileCard symbol={activeSymbol} />
                  <FinancialsCard symbol={activeSymbol} />
                  <InsiderActivityCard symbol={activeSymbol} />
                  <AnalystRecommendationsCard symbol={activeSymbol} />
                  <EarningsSurprisesCard symbol={activeSymbol} />
                </div>
              </div>
            </>
          )}

          {/* Watchlist Grid View */}
          {activeTab === 'watchlist' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Your US Watchlist
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Stored locally in your browser • Auto-refreshes every{' '}
                    {FINNHUB_CONFIG.clientPollingIntervalMs / 1000} seconds while visible.
                  </p>
                </div>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Add Symbol</span>
                </button>
              </div>

              {watchlist.length === 0 ? (
                <EmptyState
                  title="Your watchlist is empty"
                  description="Your watchlist is empty. Search for a symbol to add one."
                  actionLabel="Search US Symbols"
                  onAction={() => setIsSearchOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.map((sym) => (
                    <QuoteCard
                      key={sym}
                      symbol={sym}
                      isSelected={sym === activeSymbol}
                      onSelect={(selected) => {
                        setActiveSymbol(selected);
                        setActiveTab('overview');
                      }}
                      pollingIntervalMs={FINNHUB_CONFIG.clientPollingIntervalMs}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Market News Full View */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Live Market News
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Curated real-time financial dispatches across General, Forex, Crypto, and M&amp;A
                  categories.
                </p>
              </div>
              <MarketNewsFeed limit={20} />
            </div>
          )}

          {/* Market Calendars (Earnings, IPO, Holidays) */}
          {activeTab === 'calendars' && <MarketCalendarsView />}
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <SymbolSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
      />
    </div>
  );
}
