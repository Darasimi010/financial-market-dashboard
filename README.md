# Market Dashboard with Finnhub API (MarketDash)

A Progressive Web App (PWA) for tracking US stock market data using the **Finnhub Free REST API**. Built as a non-commercial portfolio project targeting **Vercel (Hobby plan)** with local Docker development and GitHub Actions CI.

---

## What It Is & What It Does

**MarketDash** lets investors and engineers inspect real-time US equity quotes, explore interactive OHLCV candlestick and area charts, maintain a persistent local watchlist, review company fundamentals, analyst recommendation consensus, quarterly EPS surprises, and read real-time financial news—all without creating an account or exposing API credentials to the browser.

### Highlights

- **Zero Client Secret Exposure:** Every Finnhub call goes through Next.js App Router route handlers (`/app/api/*`). `FINNHUB_API_KEY` stays strictly server-side.
- **Rate-Limit Resilience:** Single-source rate-limit config (`lib/config.ts`) paired with per-endpoint server TTL caching, in-flight request deduplication, jittered exponential backoff on HTTP `429`, and visibility-aware 30-second client polling.
- **Runtime Schema Safety:** All upstream Finnhub payloads are validated at runtime with **Zod** before reaching React components.
- **Offline-Ready PWA (Serwist):** Web App Manifest, custom icons (`any` + `maskable` + `apple-touch-icon.png`), in-app install prompt (Chromium/Android + iOS Safari guide), precached app shell, stale-while-revalidate API cache, and `/~offline` fallback displaying last saved quotes.
- **Accessible & Responsive:** Mobile bottom nav, tablet/desktop sidebar, `⌘K` symbol search dialog, zero-flash persisted dark/light theme toggle, `prefers-reduced-motion` support, and ARIA live alert states.

---

## The Problem & The Solution

### Problem

Directly consuming third-party market APIs from a SPA exposes private API keys in browser DevTools, hits free-tier rate limits (`429`) when multiple components mount simultaneously, crashes when upstream JSON fields change or return `null`, and fails blankly when mobile connectivity drops.

### Solution

1. **Server Proxy Layer (`/app/api/*`):** Injects the Finnhub token server-side, normalizes errors into human-readable messages, and strips upstream stack traces.
2. **Deduplicated In-Memory Cache (`lib/finnhub/client.ts`):** Pools identical concurrent requests into a single promise and caches responses per endpoint TTL (quotes `30s`, market status `60s`, news `10m`, metrics/earnings `6h`, company profile `24h`).
3. **Resilient Offline Strategy:** Combines **Serwist** service-worker caching with `localStorage` quote snapshots so users see their most recent quotes with a clear offline indicator when disconnected.

---

## Challenges & Limitations (Finnhub Free Tier)

1. **Free-Tier Rate Limits:** Finnhub enforces **60 API calls/minute** (and a hard burst cap of 30 calls/second). Heavy multi-ticker refreshes can trigger HTTP `429` without server caching and client polling intervals.
2. **US Equities Only:** Free data covers US-listed stocks exclusively. Non-US tickers (e.g., `.TO`, `.L`, `.SW`, `.DE`) are validated and filtered out in search and symbol lookup with clear UI messaging.
3. **Polling Instead of WebSockets:** Connecting to `wss://ws.finnhub.io?token=<key>` directly from the browser leaks the API key in the WebSocket handshake URL, while serverless Vercel Hobby functions cannot hold persistent WebSocket proxy connections. MarketDash uses visibility-aware 30s HTTP polling instead.
4. **Premium Endpoints Excluded:** The following Finnhub endpoints require paid tiers and are intentionally omitted:
   - Full Company Profile (`/stock/profile`) — replaced with free `/stock/profile2`
   - Institutional Ownership & 13-F Portfolios (`/stock/ownership`, `/institutional/*`)
   - Analyst Price Target Consensus & Upgrades/Downgrades (`/stock/price-target`, `/stock/upgrade-downgrade`)
   - Forward EPS / Revenue / EBITDA Estimates (`/stock/eps-estimate`, `/stock/revenue-estimate`)
   - News Sentiment & Social Sentiment (`/news-sentiment`, `/stock/social-sentiment`)
   - Press Releases & Earnings Call Transcripts (`/press-releases`, `/stock/transcripts`)
   - Non-US Exchange Candles, Tick/NBBO Data, ETF/Mutual Fund Holdings, Bonds & Economic Data
   - _(Note: Where `/stock/candle` is restricted on certain free keys with `403`, `/api/candle` gracefully synthesizes a daily trend curve anchored to the live `/quote` endpoint so charts remain interactive.)_

---

## Tradeoffs & Architectural Decisions

| Decision                              | Alternative Considered                              | Reason Chosen                                                                                                                                                                                                                   |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Polling (30s) + Server Cache** | Browser WebSocket / SSE relay                       | Prevents token leakage in client WS URLs and works natively on Vercel Hobby serverless functions.                                                                                                                               |
| **Serwist (`@serwist/next`)**         | Legacy `next-pwa`                                   | `next-pwa` is unmaintained and incompatible with modern Next.js App Router builds; Serwist is actively maintained and lightweight.                                                                                              |
| **Custom SVG Candlestick/Area Chart** | Heavy charting libraries (e.g. TradingView/ECharts) | Keeps client bundle tiny, zero external runtime dependencies, instant dynamic chunk loading, and crisp dark/light theming.                                                                                                      |
| **`localStorage` Watchlist**          | Authenticated cloud DB                              | Prompt specifies zero user authentication; `localStorage` with multi-tab `storage` event sync gives instant persistence with zero friction.                                                                                     |
| **Startup Check + Demo Fallback**     | Hard crash in all environments                      | `instrumentation.ts` runs `validateServerEnv()` at boot; setting `STRICT_FINNHUB_KEY=true` enforces a hard startup failure if the key is missing, while unset preview environments gracefully serve deterministic US demo data. |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, `output: "standalone"`), React 19, TypeScript (`strict: true`)
- **Styling & UI:** Tailwind CSS v4, Lucide Icons, Sonner Toast Notifications
- **Animation:** Motion (`motion/react`) respecting `prefers-reduced-motion`
- **Validation:** Zod runtime schemas (`lib/finnhub/schemas.ts`)
- **PWA:** Serwist (`@serwist/next`, `serwist`), `app/manifest.ts`, `app/sw.ts`
- **Testing:** Vitest, React Testing Library, MSW (Mock Service Worker), `@vitest/coverage-v8`
- **CI & Containers:** GitHub Actions (`.github/workflows/ci.yml`), Multi-stage `Dockerfile`, `docker-compose.yml`

---

## Architecture Overview

```text
├── app/
│   ├── api/                  # Server-only Finnhub proxy routes (quote, search, profile, candle, news, metrics, earnings, recommendation, market-status, health)
│   ├── dashboard/            # Dashboard route (/dashboard) + loading.tsx & error.tsx boundaries
│   ├── ~offline/             # Offline fallback route displaying cached quotes
│   ├── layout.tsx            # Root layout, fonts, metadata, zero-flash theme script
│   ├── page.tsx              # Animated landing page (/)
│   ├── manifest.ts           # Web App Manifest
│   └── sw.ts                 # Serwist service worker source
├── components/               # Modular typed UI components (QuoteCard, PriceChart, Navbar, Sidebar, BottomNav, SymbolSearchDialog, etc.)
├── hooks/                    # Client hooks (useWatchlist, useOnlineStatus, usePWAInstall)
├── lib/
│   ├── config.ts             # Rate limits, TTLs, US symbol regex, user-facing error map
│   ├── env.ts                # Server startup environment validation
│   ├── api-response.ts       # Standardized Cache-Control & error HTTP responses
│   ├── quote-storage.ts      # Offline quote persistence in localStorage
│   └── finnhub/              # Zod schemas & deduplicated/cached Finnhub server client
└── tests/                    # Vitest + RTL + MSW unit & integration suites
```

---

## Secrets Management

- **Local Development:** Copy `.env.example` to `.env.local` (git-ignored) and set `FINNHUB_API_KEY="your_key"`.
- **Strict Startup Check:** Set `STRICT_FINNHUB_KEY="true"` in production if you want the server boot (`instrumentation.ts`) to fail immediately when `FINNHUB_API_KEY` is missing.
- **GitHub Actions CI:** Add `FINNHUB_API_KEY` under _Repository Settings → Secrets and variables → Actions_.
- **Vercel Production/Preview:** Add `FINNHUB_API_KEY` under _Vercel Project Settings → Environment Variables_. Never prefix with `NEXT_PUBLIC_`.

---

## How to Run Locally

### Without Docker (pnpm)

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local and add your FINNHUB_API_KEY
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With Docker Compose (Hot Reload)

```bash
cp .env.example .env.local
docker compose up
```

### Production Standalone Container Test

```bash
docker build -t marketdash .
docker run --rm -p 3000:3000 -e FINNHUB_API_KEY="your_key" marketdash
```

---

## Testing & Bundle Analysis

```bash
# Run unit & integration tests once
pnpm run test

# Run tests with V8 coverage report
pnpm run test:coverage

# Strict TypeScript check & ESLint
pnpm run typecheck
pnpm run lint

# Analyze client/server bundle sizes (@next/bundle-analyzer)
pnpm run analyze
```

---

## Debugging Guide

1. **"Market data is temporarily unavailable" (HTTP 401/403):**
   - Check server terminal logs for `[Finnhub Client] Upstream auth error`. Verify `FINNHUB_API_KEY` in `.env.local` has no trailing quotes/spaces and hit `/api/health` to confirm `"hasApiKey": true`.
2. **"We're fetching data too quickly. Retrying shortly." (HTTP 429):**
   - Inspect response headers on `/api/quote` in DevTools _Network_ tab for `Retry-After`. Ensure you are not running multiple apps sharing the same free Finnhub key simultaneously.
3. **Inspecting the Service Worker & Offline Mode:**
   - Run a production build (`pnpm run build && pnpm run start`), open Chrome DevTools → _Application_ → _Service Workers_, verify `sw.js` is `activated`, check _Cache Storage_ (`marketdash-api-swr`), and toggle **Offline** in the _Network_ tab to test cached quote fallback and `/~offline`.

---

## Deployment (Vercel Hobby)

1. Push the repository to GitHub (`main` branch).
2. Import the repository into **Vercel** using the native Vercel Git Integration.
3. In Vercel Project Settings → **Environment Variables**, add `FINNHUB_API_KEY` (and optionally `STRICT_FINNHUB_KEY=true`).
4. Every push to `main` deploys to Production; every Pull Request automatically gets an isolated Preview Deployment while GitHub Actions runs `typecheck`, `lint`, `test:coverage`, and `build`.
