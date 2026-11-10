'use client';
import { Lock } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  currentPrice?: number;
}

export function PriceChart({ symbol, currentPrice }: PriceChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {symbol} Price Chart
            </span>
            {/* <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Premium Feature
            </span> */}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Candlestick charts is restricted to paid subscribers only.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="text-slate-400 font-mono">Current Live Price:</span>
          <span className="text-lg font-mono font-bold text-emerald-500">
            ${currentPrice?.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="my-8 py-8 px-6 rounded-xl bg-slate-100/90 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h4 className="text-base font-bold text-slate-100">Candle Chart Behind Paywall</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Historical OHLCV candle streams require a paid subscription. All free APIs (real-time
            quotes, financials, filings, senate lobbying, USPTO patents, crypto, forex, and news)
            remain fully functional and unlimited on this dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <a
            href="https://github.com/Darasimi010"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition"
          >
            <span>Contact the developer</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Real-Time Quote</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Financials &amp; SEC</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Gov &amp; Patents</div>
          <div className="font-bold text-emerald-500 mt-0.5">Included Free</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Candlesticks</div>
          <div className="font-bold text-amber-500 mt-0.5">Paid Tier Only</div>
        </div>
      </div>
    </div>
  );
}
