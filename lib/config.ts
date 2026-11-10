/**
 * Finnhub Market Dashboard Configuration
 * Enforces Free Tier constraints, rate limits, caching TTLs, and standard error mappings.
 */

export const FINNHUB_CONFIG = {
  baseUrl: 'https://finnhub.io/api/v1',

  // Finnhub Free Tier rate limits: 30 API calls/second and 60 calls/minute
  rateLimits: {
    maxCallsPerSecond: 30,
    maxCallsPerMinute: 60,
    backoffBaseMs: 1000,
    backoffMaxMs: 16000,
    maxRetries: 3,
  },

  // Per-endpoint response caching TTL in milliseconds
  cacheTTL: {
    quote: 30 * 1000, // 30 seconds (real-time price updates)
    candle: 5 * 60 * 1000, // 5 minutes
    profile: 24 * 60 * 60 * 1000, // 24 hours (company info rarely changes)
    metrics: 6 * 60 * 60 * 1000, // 6 hours (financial ratios)
    search: 60 * 60 * 1000, // 1 hour
    news: 10 * 60 * 1000, // 10 minutes (market news feed)
    marketStatus: 60 * 1000, // 1 minute
    peers: 24 * 60 * 60 * 1000, // 24 hours
    earnings: 6 * 60 * 60 * 1000, // 6 hours
    recommendation: 6 * 60 * 60 * 1000, // 6 hours
    patents: 12 * 60 * 60 * 1000, // 12 hours
    visas: 12 * 60 * 60 * 1000, // 12 hours
    lobbying: 12 * 60 * 60 * 1000, // 12 hours
    spending: 12 * 60 * 60 * 1000, // 12 hours
    calendar: 6 * 60 * 60 * 1000, // 6 hours
    filings: 2 * 60 * 60 * 1000, // 2 hours
    insider: 6 * 60 * 60 * 1000, // 6 hours
    financialsReported: 12 * 60 * 60 * 1000, // 12 hours
    marketHoliday: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Client-side polling interval (never exceeds the rate limit)
  clientPollingIntervalMs: 30 * 1000, // 30 seconds default
  minPollingIntervalMs: 15 * 1000, // 15 seconds minimum allowed

  // US Stock Symbol regex: 1 to 5 uppercase letters, optional .A/.B/.C US share class (e.g., BRK.B)
  usSymbolRegex: /^[A-Z]{1,5}(\.[ABC])?$/,

  // Allowed Free Tier Endpoints
  freeEndpoints: [
    '/stock/uspto-patent',
    '/stock/visa-application',
    '/stock/lobbying',
    '/stock/usa-spending',
    '/quote',
    '/stock/earnings',
    '/calendar/earnings',
    '/stock/recommendation',
    '/calendar/ipo',
    '/stock/filings',
    '/stock/financials-reported',
    '/stock/insider-sentiment',
    '/stock/insider-transactions',
    '/stock/metric',
    '/stock/peers',
    '/company-news',
    '/news',
    '/stock/profile2',
    '/stock/market-holiday',
    '/stock/market-status',
    '/stock/symbol',
    '/search',
  ],

  // Exact error messages as specified in the requirements
  errorMessages: {
    unauthorized: 'Market data is temporarily unavailable',
    rateLimited: "We're fetching data too quickly. Retrying shortly.",
    notFoundOrNonUS: "We couldn't find that symbol. Free data covers US stocks only.",
    offline: "You're offline. Showing the last saved data.",
    serverError: 'Something went wrong on our side. Please try again.',
  },
} as const;

/**
 * Validates whether a symbol is a valid US equity ticker.
 * Finnhub Free tier exclusively supports US stocks.
 */
export function isUSStockSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  const clean = symbol.trim().toUpperCase();
  if (clean.includes(':')) {
    return false;
  }
  return FINNHUB_CONFIG.usSymbolRegex.test(clean);
}

/**
 * Formats a clean US symbol.
 */
export function sanitizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}
