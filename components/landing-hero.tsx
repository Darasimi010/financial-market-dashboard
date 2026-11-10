'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Zap,
  WifiOff,
  BarChart3,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { Navbar } from './navbar';
import { FINNHUB_CONFIG } from '@/lib/config';

const SAMPLE_TICKERS = [
  { sym: 'NVDA', name: 'NVIDIA Corp', price: '138.85', change: '+3.42%', up: true },
  { sym: 'AAPL', name: 'Apple Inc', price: '228.45', change: '+1.18%', up: true },
  { sym: 'MSFT', name: 'Microsoft Corp', price: '425.22', change: '-0.34%', up: false },
  { sym: 'AMZN', name: 'Amazon.com', price: '186.40', change: '+1.92%', up: true },
];

const FEATURES = [
  {
    icon: <Lock className="w-5 h-5 text-emerald-500" />,
    title: 'Zero Browser Key Exposure',
    description:
      'Every API request routes through Next.js server handlers. The API token never enters client bundles or network DevTools.',
  },
  {
    icon: <Zap className="w-5 h-5 text-emerald-500" />,
    title: 'Rate-Limit Guard & Caching',
    description: `In-memory TTL caching, in-flight request deduplication, and jittered exponential backoff keep usage safely inside the ${FINNHUB_CONFIG.rateLimits.maxCallsPerMinute} req/min free cap.`,
  },
  {
    icon: <Layers className="w-5 h-5 text-emerald-500" />,
    title: 'Runtime Schema Validation',
    description:
      'Upstream API payloads are parsed through strict Zod schemas before reaching React components, preventing malformed data crashes.',
  },
  {
    icon: <WifiOff className="w-5 h-5 text-emerald-500" />,
    title: 'Offline-Ready PWA',
    description:
      'Installable on desktop, iOS, and Android with service-worker stale-while-revalidate caching so your last saved quotes load offline.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-500" />,
    title: 'Interactive Candlestick & Area Charts',
    description:
      'Switch seamlessly between OHLCV candlesticks and line views across 1D to 1Y timeframes with crosshair price & volume inspection.',
  },
  {
    icon: <Clock className="w-5 h-5 text-emerald-500" />,
    title: 'Visibility-Aware Polling',
    description:
      'Replaces browser-exposed WebSockets with smart 30-second background polling that automatically pauses when the browser tab is hidden.',
  },
];

export function LandingHero() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: 'easeOut' as const },
      };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar showSearch={false} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-900">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Copy Column */}
              <motion.div {...fadeUp} className="lg:col-span-7 space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Real-time US market intelligence,{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    engineered for reliability.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Track US stock quotes, inspect OHLCV price action, review analyst consensus, and
                  follow live market news—backed by server-side caching, runtime validation, and
                  offline PWA resilience.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#architecture"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-sm transition"
                  >
                    <span>Explore Architecture</span>
                  </a>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    No login required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Local watchlist persistence
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    US stocks validated
                  </span>
                </div>
              </motion.div>

              {/* Terminal Preview Column */}
              <motion.div
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.97 },
                      animate: { opacity: 1, scale: 1 },
                      transition: { duration: 0.5, delay: 0.1 },
                    })}
                className="lg:col-span-5"
              >
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        US WATCHLIST SNAPSHOT
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">NYSE / NASDAQ</span>
                  </div>

                  <div className="space-y-2.5">
                    {SAMPLE_TICKERS.map((t) => (
                      <Link
                        key={t.sym}
                        href={`/dashboard?symbol=${t.sym}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition group"
                      >
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition">
                            {t.sym}
                          </div>
                          <div className="text-xs text-slate-500">{t.name}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            ${t.price}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              t.up
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {t.change}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Mini Stylized Sparkline */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-[11px] font-mono text-slate-400">
                    <span>Cached proxy • 30s poll</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Architecture & Features Grid */}
        <section id="architecture" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl mb-12 space-y-2">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              System Design
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Built around real-world API constraints
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Free-tier financial APIs enforce strict rate limits and exchange boundaries.
              MarketDash turns those constraints into predictable, resilient UX.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={feat.title}
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 14 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: '-40px' },
                      transition: { duration: 0.35, delay: idx * 0.05 },
                    })}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-900/90 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold">Ready to monitor US equities?</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Search tickers with ⌘K, build your persistent local watchlist, and inspect real-time
                quotes and fundamentals right away.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shrink-0"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-900 py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MarketDash</span>
          <span className="font-mono text-[11px]">US Stocks • Powered by Finnhub API</span>
        </div>
      </footer>
    </div>
  );
}
