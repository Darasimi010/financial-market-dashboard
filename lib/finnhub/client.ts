import { FINNHUB_CONFIG, isUSStockSymbol, sanitizeSymbol } from '@/lib/config';
import {
  FinnhubBasicFinancials,
  FinnhubBasicFinancialsSchema,
  FinnhubCandles,
  FinnhubCandlesSchema,
  FinnhubCompanyProfile2,
  FinnhubCompanyProfile2Schema,
  FinnhubEarningsSurprise,
  FinnhubEarningsSurpriseArraySchema,
  FinnhubMarketStatus,
  FinnhubMarketStatusSchema,
  FinnhubNewsItem,
  FinnhubNewsArraySchema,
  FinnhubPeersSchema,
  FinnhubQuote,
  FinnhubQuoteSchema,
  FinnhubRecommendation,
  FinnhubRecommendationArraySchema,
  FinnhubSymbolLookup,
  FinnhubSymbolLookupSchema,
} from './schemas';
import { ZodSchema } from 'zod';

export class FinnhubApiError extends Error {
  public readonly status: number;
  public readonly code: 'unauthorized' | 'rateLimited' | 'notFound' | 'serverError' | 'invalidSymbol';
  public readonly userMessage: string;
  public readonly retryAfterSeconds?: number;

  constructor(status: number, code: FinnhubApiError['code'], userMessage: string, retryAfterSeconds?: number) {
    super(userMessage);
    this.name = 'FinnhubApiError';
    this.status = status;
    this.code = code;
    this.userMessage = userMessage;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache singleton across server requests
const cacheStore = new Map<string, CacheEntry<unknown>>();

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Checks if the API key is configured and valid
 */
export function getFinnhubApiKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  if (!key || key.trim() === '' || key === 'MY_FINNHUB_API_KEY' || key === 'your_finnhub_api_key_here') {
    return null;
  }
  return key.trim();
}

/**
 * Sleeps with promise
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an HTTP fetch with caching, request de-duplication, and exponential backoff
 */
async function fetchFinnhubEndpoint<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  schema: ZodSchema<T>,
  ttlMs: number
): Promise<{ data: T; fromCache: boolean; isDemo: boolean }> {
  // Construct search params
  const cleanParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      cleanParams[k] = String(v);
    }
  }

  const queryString = new URLSearchParams(cleanParams).toString();
  const cacheKey = `${endpoint}?${queryString}`;

  // 1. Check in-memory cache
  const cached = cacheStore.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return { data: cached.data as T, fromCache: true, isDemo: false };
  }

  // 2. Request deduplication: if request is currently inflight, await it
  if (inFlightRequests.has(cacheKey)) {
    const inflight = (await inFlightRequests.get(cacheKey)) as T;
    return { data: inflight, fromCache: false, isDemo: false };
  }

  const apiKey = getFinnhubApiKey();

  // If no API key configured, use high-fidelity mock demo data
  if (!apiKey) {
    const demoData = getDemoFallbackData(endpoint, cleanParams);
    if (demoData) {
      const parsed = schema.safeParse(demoData);
      if (parsed.success) {
        // Cache demo data shortly
        cacheStore.set(cacheKey, { data: parsed.data, expiresAt: now + ttlMs });
        return { data: parsed.data, fromCache: false, isDemo: true };
      }
    }
    // If no demo fallback is available, return 401 error
    throw new FinnhubApiError(401, 'unauthorized', FINNHUB_CONFIG.errorMessages.unauthorized);
  }

  // 3. Initiate upstream request with retry & backoff
  const requestPromise = (async (): Promise<T> => {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= FINNHUB_CONFIG.rateLimits.maxRetries) {
      try {
        const fullUrl = new URL(`${FINNHUB_CONFIG.baseUrl}${endpoint}`);
        for (const [k, v] of Object.entries(cleanParams)) {
          fullUrl.searchParams.set(k, v);
        }
        fullUrl.searchParams.set('token', apiKey);

        const response = await fetch(fullUrl.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          // Cache control for Next.js fetch
          next: { revalidate: Math.floor(ttlMs / 1000) },
        });

        // Handle 429 Rate Limit
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
          
          if (attempt < FINNHUB_CONFIG.rateLimits.maxRetries) {
            attempt++;
            // Exponential backoff with jitter
            const hasValidRetryHeader =
              retryAfterSec !== undefined && !Number.isNaN(retryAfterSec);
            const baseWait = hasValidRetryHeader
              ? retryAfterSec * 1000
              : FINNHUB_CONFIG.rateLimits.backoffBaseMs * Math.pow(2, attempt);
            const jitter = process.env.NODE_ENV === 'test' ? 10 : Math.random() * 500;
            const waitTime = Math.min(baseWait + jitter, FINNHUB_CONFIG.rateLimits.backoffMaxMs);
            console.warn(`[Finnhub Client] Rate limit 429 encountered for ${endpoint}. Retrying in ${waitTime.toFixed(0)}ms (attempt ${attempt}).`);
            await sleep(waitTime);
            continue;
          }

          throw new FinnhubApiError(429, 'rateLimited', FINNHUB_CONFIG.errorMessages.rateLimited, retryAfterSec || 15);
        }

        // Handle 401 / 403 Authentication / Authorization
        if (response.status === 401 || response.status === 403) {
          console.error(`[Finnhub Client] Upstream auth error ${response.status} for endpoint ${endpoint}`);
          throw new FinnhubApiError(response.status, 'unauthorized', FINNHUB_CONFIG.errorMessages.unauthorized);
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          throw new FinnhubApiError(404, 'notFound', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
        }

        // Handle other HTTP errors
        if (!response.ok) {
          console.error(`[Finnhub Client] Upstream returned status ${response.status} for ${endpoint}`);
          throw new FinnhubApiError(response.status, 'serverError', FINNHUB_CONFIG.errorMessages.serverError);
        }

        const rawJson: unknown = await response.json();

        // Validate response with Zod
        const parsed = schema.safeParse(rawJson);
        if (!parsed.success) {
          console.error(`[Finnhub Client] Validation failed for ${endpoint}:`, parsed.error.issues);
          throw new FinnhubApiError(500, 'serverError', FINNHUB_CONFIG.errorMessages.serverError);
        }

        // Cache the successful parsed response
        cacheStore.set(cacheKey, {
          data: parsed.data,
          expiresAt: Date.now() + ttlMs,
        });

        return parsed.data;
      } catch (err) {
        if (err instanceof FinnhubApiError) {
          throw err;
        }
        lastError = err as Error;
        attempt++;
        if (attempt <= FINNHUB_CONFIG.rateLimits.maxRetries) {
          const waitTime = FINNHUB_CONFIG.rateLimits.backoffBaseMs * Math.pow(2, attempt);
          await sleep(waitTime);
        }
      }
    }

    console.error(`[Finnhub Client] Network/Connection failure for ${endpoint}:`, lastError?.message);
    throw new FinnhubApiError(500, 'serverError', FINNHUB_CONFIG.errorMessages.serverError);
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return { data: result, fromCache: false, isDemo: false };
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Typed Finnhub Client Methods
 */
export const FinnhubClient = {
  /**
   * Get real-time quote for a US symbol
   */
  async getQuote(rawSymbol: string): Promise<{ data: FinnhubQuote; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/quote',
      { symbol },
      FinnhubQuoteSchema,
      FINNHUB_CONFIG.cacheTTL.quote
    );
  },

  /**
   * Search for US stocks with query
   */
  async search(query: string): Promise<{ data: FinnhubSymbolLookup; fromCache: boolean; isDemo: boolean }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { data: { count: 0, result: [] }, fromCache: false, isDemo: false };
    }
    return fetchFinnhubEndpoint(
      '/search',
      { q: cleanQuery, exchange: 'US' },
      FinnhubSymbolLookupSchema,
      FINNHUB_CONFIG.cacheTTL.search
    );
  },

  /**
   * Get Company Profile 2 (Free tier)
   */
  async getCompanyProfile(rawSymbol: string): Promise<{ data: FinnhubCompanyProfile2; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/profile2',
      { symbol },
      FinnhubCompanyProfile2Schema,
      FINNHUB_CONFIG.cacheTTL.profile
    );
  },

  /**
   * Get Market Status for US exchange
   */
  async getMarketStatus(exchange: string = 'US'): Promise<{ data: FinnhubMarketStatus; fromCache: boolean; isDemo: boolean }> {
    return fetchFinnhubEndpoint(
      '/stock/market-status',
      { exchange },
      FinnhubMarketStatusSchema,
      FINNHUB_CONFIG.cacheTTL.marketStatus
    );
  },

  /**
   * Get General Market News
   */
  async getMarketNews(category: string = 'general'): Promise<{ data: FinnhubNewsItem[]; fromCache: boolean; isDemo: boolean }> {
    return fetchFinnhubEndpoint(
      '/news',
      { category },
      FinnhubNewsArraySchema,
      FINNHUB_CONFIG.cacheTTL.news
    );
  },

  /**
   * Get Company News by symbol and date range
   */
  async getCompanyNews(
    rawSymbol: string,
    from: string,
    to: string
  ): Promise<{ data: FinnhubNewsItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/company-news',
      { symbol, from, to },
      FinnhubNewsArraySchema,
      FINNHUB_CONFIG.cacheTTL.news
    );
  },

  /**
   * Get Stock Candles
   */
  async getCandles(
    rawSymbol: string,
    resolution: string = 'D',
    from: number,
    to: number
  ): Promise<{ data: FinnhubCandles; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/candle',
      { symbol, resolution, from, to },
      FinnhubCandlesSchema,
      FINNHUB_CONFIG.cacheTTL.candle
    );
  },

  /**
   * Get Company Peers
   */
  async getPeers(rawSymbol: string): Promise<{ data: string[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/peers',
      { symbol },
      FinnhubPeersSchema,
      FINNHUB_CONFIG.cacheTTL.peers
    );
  },

  /**
   * Get Basic Financials (P/E, Beta, 52-week High/Low)
   */
  async getBasicFinancials(rawSymbol: string): Promise<{ data: FinnhubBasicFinancials; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/metric',
      { symbol, metric: 'all' },
      FinnhubBasicFinancialsSchema,
      FINNHUB_CONFIG.cacheTTL.metrics
    );
  },

  /**
   * Get Recommendation Trends
   */
  async getRecommendations(rawSymbol: string): Promise<{ data: FinnhubRecommendation[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/recommendation',
      { symbol },
      FinnhubRecommendationArraySchema,
      FINNHUB_CONFIG.cacheTTL.recommendation
    );
  },

  /**
   * Get Earnings Surprises (Last 4 quarters)
   */
  async getEarnings(rawSymbol: string): Promise<{ data: FinnhubEarningsSurprise[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/earnings',
      { symbol, limit: 4 },
      FinnhubEarningsSurpriseArraySchema,
      FINNHUB_CONFIG.cacheTTL.earnings
    );
  },

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    cacheStore.clear();
    inFlightRequests.clear();
  },
};

/**
 * Realistic Mock fallback data for demonstration when FINNHUB_API_KEY is not configured
 */
function getDemoFallbackData(endpoint: string, params: Record<string, string>): unknown {
  const symbol = (params.symbol || 'AAPL').toUpperCase();

  if (endpoint === '/quote') {
    const basePrices: Record<string, number> = {
      AAPL: 228.45,
      MSFT: 425.22,
      NVDA: 138.85,
      GOOGL: 168.14,
      AMZN: 186.40,
      TSLA: 254.30,
      META: 582.10,
    };
    const c = basePrices[symbol] || 150.00;
    const change = +(Math.sin(Date.now() / 10000) * 2.5).toFixed(2);
    const pc = +(c - change).toFixed(2);
    const dp = +((change / pc) * 100).toFixed(2);
    return {
      c,
      h: +(c + 3.10).toFixed(2),
      l: +(c - 2.80).toFixed(2),
      o: +(pc + 0.50).toFixed(2),
      pc,
      d: change,
      dp,
      t: Math.floor(Date.now() / 1000),
    };
  }

  if (endpoint === '/stock/profile2') {
    const profiles: Record<string, FinnhubCompanyProfile2> = {
      AAPL: {
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ/NMS (GLOBAL MARKET)',
        ipo: '1980-12-12',
        marketCapitalization: 3485000,
        name: 'Apple Inc',
        phone: '14089961010',
        shareOutstanding: 15204.14,
        ticker: 'AAPL',
        weburl: 'https://www.apple.com/',
        logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png',
        finnhubIndustry: 'Technology',
      },
      MSFT: {
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ/NMS (GLOBAL MARKET)',
        ipo: '1986-03-13',
        marketCapitalization: 3160000,
        name: 'Microsoft Corp',
        phone: '14258828080',
        shareOutstanding: 7430.40,
        ticker: 'MSFT',
        weburl: 'https://www.microsoft.com/',
        logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/MSFT.png',
        finnhubIndustry: 'Technology',
      },
      NVDA: {
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ/NMS (GLOBAL MARKET)',
        ipo: '1999-01-22',
        marketCapitalization: 3390000,
        name: 'NVIDIA Corp',
        phone: '14084862000',
        shareOutstanding: 24500.00,
        ticker: 'NVDA',
        weburl: 'https://www.nvidia.com/',
        logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/NVDA.png',
        finnhubIndustry: 'Semiconductors',
      },
    };
    return profiles[symbol] || {
      country: 'US',
      currency: 'USD',
      exchange: 'NASDAQ',
      ipo: '2000-01-01',
      marketCapitalization: 500000,
      name: `${symbol} Corporation`,
      phone: '18005550199',
      shareOutstanding: 1000,
      ticker: symbol,
      weburl: `https://www.${symbol.toLowerCase()}.com/`,
      logo: '',
      finnhubIndustry: 'General Industry',
    };
  }

  if (endpoint === '/search') {
    const q = (params.q || '').toUpperCase();
    const common = [
      { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
      { description: 'MICROSOFT CORP', displaySymbol: 'MSFT', symbol: 'MSFT', type: 'Common Stock' },
      { description: 'NVIDIA CORP', displaySymbol: 'NVDA', symbol: 'NVDA', type: 'Common Stock' },
      { description: 'AMAZON.COM INC', displaySymbol: 'AMZN', symbol: 'AMZN', type: 'Common Stock' },
      { description: 'ALPHABET INC-CL A', displaySymbol: 'GOOGL', symbol: 'GOOGL', type: 'Common Stock' },
      { description: 'TESLA INC', displaySymbol: 'TSLA', symbol: 'TSLA', type: 'Common Stock' },
      { description: 'META PLATFORMS INC-CLASS A', displaySymbol: 'META', symbol: 'META', type: 'Common Stock' },
    ];
    const filtered = common.filter(s => s.symbol.includes(q) || s.description.includes(q));
    return {
      count: filtered.length,
      result: filtered,
    };
  }

  if (endpoint === '/stock/market-status') {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const isWeekday = nyTime.getDay() >= 1 && nyTime.getDay() <= 5;
    const isOpen = isWeekday && totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60;
    const session = !isWeekday ? null : isOpen ? 'regular' : totalMinutes < 9 * 60 + 30 ? 'pre-market' : 'post-market';

    return {
      exchange: 'US',
      holiday: null,
      isOpen,
      session,
      timezone: 'America/New_York',
      t: Math.floor(Date.now() / 1000),
    };
  }

  if (endpoint === '/news' || endpoint === '/company-news') {
    return [
      {
        category: 'business',
        datetime: Math.floor(Date.now() / 1000) - 1800,
        headline: 'Wall Street Rallies as Tech Earnings Exceed Analyst Expectations',
        id: 101,
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
        related: 'AAPL,MSFT,NVDA',
        source: 'Reuters',
        summary: 'Major US indices surged during midday trading led by resilient cloud infrastructure demand and semiconductor gains.',
        url: 'https://www.reuters.com',
      },
      {
        category: 'technology',
        datetime: Math.floor(Date.now() / 1000) - 7200,
        headline: 'Semiconductor Shipments Reach Record High Ahead of Next-Gen Computing Cycles',
        id: 102,
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=60',
        related: 'NVDA,AMD',
        source: 'Bloomberg',
        summary: 'Global chipmakers report robust order books through the upcoming fiscal quarters, driven by datacenter expansion.',
        url: 'https://www.bloomberg.com',
      },
      {
        category: 'markets',
        datetime: Math.floor(Date.now() / 1000) - 14400,
        headline: 'Federal Reserve Monetary Policy Outlook Signals Economic Resilience',
        id: 103,
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=60',
        related: 'SPY,QQQ',
        source: 'CNBC',
        summary: 'Central bankers highlight stabilizing inflation metrics alongside steady labor market strength in recent addresses.',
        url: 'https://www.cnbc.com',
      },
    ];
  }

  if (endpoint === '/stock/candle') {
    // Generate realistic candles
    const count = 30;
    const nowSec = Math.floor(Date.now() / 1000);
    const daySec = 86400;
    const cArr: number[] = [];
    const oArr: number[] = [];
    const hArr: number[] = [];
    const lArr: number[] = [];
    const tArr: number[] = [];
    const vArr: number[] = [];

    let current = 215.0;
    for (let i = count - 1; i >= 0; i--) {
      const t = nowSec - i * daySec;
      const variation = (Math.sin(i * 0.5) + (Math.random() - 0.48)) * 3;
      const open = +current.toFixed(2);
      current = +(current + variation).toFixed(2);
      const close = +current.toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * 2).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 2).toFixed(2);
      const volume = Math.floor(25000000 + Math.random() * 15000000);

      oArr.push(open);
      cArr.push(close);
      hArr.push(high);
      lArr.push(low);
      tArr.push(t);
      vArr.push(volume);
    }

    return {
      c: cArr,
      h: hArr,
      l: lArr,
      o: oArr,
      s: 'ok',
      t: tArr,
      v: vArr,
    };
  }

  if (endpoint === '/stock/peers') {
    return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
  }

  if (endpoint === '/stock/metric') {
    return {
      symbol,
      metricType: 'all',
      metric: {
        '10DayAverageTradingVolume': 48.25,
        '52WeekHigh': 237.23,
        '52WeekLow': 164.08,
        '52WeekPriceReturnDaily': 34.5,
        beta: 1.12,
        peNormalizedAnnual: 33.4,
        dividendYieldIndicatedAnnual: 0.52,
        marketCapitalization: 3450000,
      },
    };
  }

  if (endpoint === '/stock/recommendation') {
    return [
      { buy: 28, hold: 10, period: '2026-10-01', sell: 2, strongBuy: 18, strongSell: 0, symbol },
      { buy: 26, hold: 12, period: '2026-09-01', sell: 2, strongBuy: 17, strongSell: 0, symbol },
      { buy: 24, hold: 13, period: '2026-08-01', sell: 3, strongBuy: 16, strongSell: 1, symbol },
    ];
  }

  if (endpoint === '/stock/earnings') {
    return [
      { actual: 1.64, estimate: 1.60, period: '2026-06-30', quarter: 3, surprise: 0.04, surprisePercent: 2.5, symbol, year: 2026 },
      { actual: 1.53, estimate: 1.50, period: '2026-03-31', quarter: 2, surprise: 0.03, surprisePercent: 2.0, symbol, year: 2026 },
      { actual: 2.18, estimate: 2.10, period: '2025-12-31', quarter: 1, surprise: 0.08, surprisePercent: 3.8, symbol, year: 2026 },
      { actual: 1.46, estimate: 1.39, period: '2025-09-30', quarter: 4, surprise: 0.07, surprisePercent: 5.0, symbol, year: 2025 },
    ];
  }

  return null;
}
