import { FINNHUB_CONFIG, isUSStockSymbol, sanitizeSymbol } from '@/lib/config';
import {
  FinnhubBasicFinancials,
  FinnhubBasicFinancialsSchema,
  FinnhubCandles,
  FinnhubCandlesSchema,
  FinnhubCompanyProfile2,
  FinnhubCompanyProfile2Schema,
  FinnhubEarningsCalendarItem,
  FinnhubEarningsCalendarResponseSchema,
  FinnhubEarningsSurprise,
  FinnhubEarningsSurpriseArraySchema,
  FinnhubFilingItem,
  FinnhubFilingsArraySchema,
  FinnhubFinancialsReportedItem,
  FinnhubFinancialsReportedResponseSchema,
  FinnhubInsiderSentimentItem,
  FinnhubInsiderSentimentResponseSchema,
  FinnhubInsiderTransactionItem,
  FinnhubInsiderTransactionsResponseSchema,
  FinnhubIpoItem,
  FinnhubIpoCalendarResponseSchema,
  FinnhubLobbyingItem,
  FinnhubLobbyingResponseSchema,
  FinnhubMarketHolidayItem,
  FinnhubMarketHolidayResponseSchema,
  FinnhubMarketStatus,
  FinnhubMarketStatusSchema,
  FinnhubNewsItem,
  FinnhubNewsArraySchema,
  FinnhubPatentItem,
  FinnhubPatentsResponseSchema,
  FinnhubPeersSchema,
  FinnhubQuote,
  FinnhubQuoteSchema,
  FinnhubRecommendation,
  FinnhubRecommendationArraySchema,
  FinnhubSpendingItem,
  FinnhubSpendingResponseSchema,
  FinnhubStockSymbolItem,
  FinnhubStockSymbolsArraySchema,
  FinnhubSymbolLookup,
  FinnhubSymbolLookupSchema,
  FinnhubVisaItem,
  FinnhubVisaResponseSchema,
} from './schemas';
import { ZodSchema } from 'zod';

export class FinnhubApiError extends Error {
  public readonly status: number;
  public readonly code:
    'unauthorized' | 'rateLimited' | 'notFound' | 'serverError' | 'invalidSymbol';
  public readonly userMessage: string;
  public readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: FinnhubApiError['code'],
    userMessage: string,
    retryAfterSeconds?: number
  ) {
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
  if (
    !key ||
    key.trim() === '' ||
    key === 'MY_FINNHUB_API_KEY' ||
    key === 'your_finnhub_api_key_here'
  ) {
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
    if (demoData !== null && demoData !== undefined) {
      const parsed = schema.safeParse(demoData);
      if (parsed.success) {
        cacheStore.set(cacheKey, { data: parsed.data, expiresAt: now + ttlMs });
        return { data: parsed.data, fromCache: false, isDemo: true };
      }
    }
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
          next: { revalidate: Math.floor(ttlMs / 1000) },
        });

        // Handle 429 Rate Limit
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

          if (attempt < FINNHUB_CONFIG.rateLimits.maxRetries) {
            attempt++;
            const hasValidRetryHeader = retryAfterSec !== undefined && !Number.isNaN(retryAfterSec);
            const baseWait = hasValidRetryHeader
              ? retryAfterSec * 1000
              : FINNHUB_CONFIG.rateLimits.backoffBaseMs * Math.pow(2, attempt);
            const jitter = process.env.NODE_ENV === 'test' ? 10 : Math.random() * 500;
            const waitTime = Math.min(baseWait + jitter, FINNHUB_CONFIG.rateLimits.backoffMaxMs);
            console.warn(
              `[Finnhub Client] Rate limit 429 encountered for ${endpoint}. Retrying in ${waitTime.toFixed(0)}ms (attempt ${attempt}).`
            );
            await sleep(waitTime);
            continue;
          }

          throw new FinnhubApiError(
            429,
            'rateLimited',
            FINNHUB_CONFIG.errorMessages.rateLimited,
            retryAfterSec || 15
          );
        }

        // Handle 401 / 403 Authentication / Authorization
        if (response.status === 401 || response.status === 403) {
          console.error(
            `[Finnhub Client] Upstream auth error ${response.status} for endpoint ${endpoint}`
          );
          throw new FinnhubApiError(
            response.status,
            'unauthorized',
            FINNHUB_CONFIG.errorMessages.unauthorized
          );
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          throw new FinnhubApiError(404, 'notFound', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
        }

        // Handle other HTTP errors
        if (!response.ok) {
          console.error(
            `[Finnhub Client] Upstream returned status ${response.status} for ${endpoint}`
          );
          throw new FinnhubApiError(
            response.status,
            'serverError',
            FINNHUB_CONFIG.errorMessages.serverError
          );
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

    console.error(
      `[Finnhub Client] Network/Connection failure for ${endpoint}:`,
      lastError?.message
    );
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
  async getQuote(
    rawSymbol: string
  ): Promise<{ data: FinnhubQuote; fromCache: boolean; isDemo: boolean }> {
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
   * Search for US stocks with query (Symbol Lookup)
   */
  async search(
    query: string
  ): Promise<{ data: FinnhubSymbolLookup; fromCache: boolean; isDemo: boolean }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { data: { count: 0, result: [] }, fromCache: false, isDemo: false };
    }
    return fetchFinnhubEndpoint(
      '/search',
      { q: cleanQuery },
      FinnhubSymbolLookupSchema,
      FINNHUB_CONFIG.cacheTTL.search
    );
  },

  /**
   * Get Market Status
   */
  async getMarketStatus(
    exchange: string = 'US'
  ): Promise<{ data: FinnhubMarketStatus; fromCache: boolean; isDemo: boolean }> {
    return fetchFinnhubEndpoint(
      '/stock/market-status',
      { exchange },
      FinnhubMarketStatusSchema,
      FINNHUB_CONFIG.cacheTTL.marketStatus
    );
  },

  /**
   * Get Market Holidays
   */
  async getMarketHolidays(
    exchange: string = 'US'
  ): Promise<{ data: FinnhubMarketHolidayItem[]; fromCache: boolean; isDemo: boolean }> {
    const res = await fetchFinnhubEndpoint(
      '/stock/market-holiday',
      { exchange },
      FinnhubMarketHolidayResponseSchema,
      FINNHUB_CONFIG.cacheTTL.marketHoliday
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Get Company Profile 2
   */
  async getCompanyProfile2(
    rawSymbol: string
  ): Promise<{ data: FinnhubCompanyProfile2; fromCache: boolean; isDemo: boolean }> {
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
   * Get General Market News
   */
  async getMarketNews(
    category: string = 'general'
  ): Promise<{ data: FinnhubNewsItem[]; fromCache: boolean; isDemo: boolean }> {
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
  async getPeers(
    rawSymbol: string
  ): Promise<{ data: string[]; fromCache: boolean; isDemo: boolean }> {
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
  async getBasicFinancials(
    rawSymbol: string
  ): Promise<{ data: FinnhubBasicFinancials; fromCache: boolean; isDemo: boolean }> {
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
  async getRecommendations(
    rawSymbol: string
  ): Promise<{ data: FinnhubRecommendation[]; fromCache: boolean; isDemo: boolean }> {
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
  async getEarnings(
    rawSymbol: string
  ): Promise<{ data: FinnhubEarningsSurprise[]; fromCache: boolean; isDemo: boolean }> {
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
   * USPTO Patents (/stock/uspto-patent)
   */
  async getPatents(
    rawSymbol: string,
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubPatentItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/uspto-patent',
      { symbol, from, to },
      FinnhubPatentsResponseSchema,
      FINNHUB_CONFIG.cacheTTL.patents
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Visa Applications (/stock/visa-application)
   */
  async getVisaApplications(
    rawSymbol: string,
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubVisaItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/visa-application',
      { symbol, from, to },
      FinnhubVisaResponseSchema,
      FINNHUB_CONFIG.cacheTTL.visas
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Senate Lobbying (/stock/lobbying)
   */
  async getLobbying(
    rawSymbol: string,
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubLobbyingItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/lobbying',
      { symbol, from, to },
      FinnhubLobbyingResponseSchema,
      FINNHUB_CONFIG.cacheTTL.lobbying
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * USA Government Spending (/stock/usa-spending)
   */
  async getUsaSpending(
    rawSymbol: string,
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubSpendingItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/usa-spending',
      { symbol, from, to },
      FinnhubSpendingResponseSchema,
      FINNHUB_CONFIG.cacheTTL.spending
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Earnings Calendar (/calendar/earnings)
   */
  async getEarningsCalendar(
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubEarningsCalendarItem[]; fromCache: boolean; isDemo: boolean }> {
    const res = await fetchFinnhubEndpoint(
      '/calendar/earnings',
      { from, to },
      FinnhubEarningsCalendarResponseSchema,
      FINNHUB_CONFIG.cacheTTL.calendar
    );
    return { data: res.data.earningsCalendar, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * IPO Calendar (/calendar/ipo)
   */
  async getIpoCalendar(
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubIpoItem[]; fromCache: boolean; isDemo: boolean }> {
    const res = await fetchFinnhubEndpoint(
      '/calendar/ipo',
      { from, to },
      FinnhubIpoCalendarResponseSchema,
      FINNHUB_CONFIG.cacheTTL.calendar
    );
    return { data: res.data.ipoCalendar, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * SEC Filings (/stock/filings)
   */
  async getFilings(
    rawSymbol: string
  ): Promise<{ data: FinnhubFilingItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    return fetchFinnhubEndpoint(
      '/stock/filings',
      { symbol },
      FinnhubFilingsArraySchema,
      FINNHUB_CONFIG.cacheTTL.filings
    );
  },

  /**
   * Financials as Reported (/stock/financials-reported)
   */
  async getFinancialsReported(
    rawSymbol: string
  ): Promise<{ data: FinnhubFinancialsReportedItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/financials-reported',
      { symbol },
      FinnhubFinancialsReportedResponseSchema,
      FINNHUB_CONFIG.cacheTTL.financialsReported
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Insider Sentiment (/stock/insider-sentiment)
   */
  async getInsiderSentiment(
    rawSymbol: string,
    from?: string,
    to?: string
  ): Promise<{ data: FinnhubInsiderSentimentItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/insider-sentiment',
      { symbol, from, to },
      FinnhubInsiderSentimentResponseSchema,
      FINNHUB_CONFIG.cacheTTL.insider
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
  },

  /**
   * Insider Transactions (/stock/insider-transactions)
   */
  async getInsiderTransactions(
    rawSymbol: string
  ): Promise<{ data: FinnhubInsiderTransactionItem[]; fromCache: boolean; isDemo: boolean }> {
    const symbol = sanitizeSymbol(rawSymbol);
    if (!isUSStockSymbol(symbol)) {
      throw new FinnhubApiError(400, 'invalidSymbol', FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
    }
    const res = await fetchFinnhubEndpoint(
      '/stock/insider-transactions',
      { symbol },
      FinnhubInsiderTransactionsResponseSchema,
      FINNHUB_CONFIG.cacheTTL.insider
    );
    return { data: res.data.data, fromCache: res.fromCache, isDemo: res.isDemo };
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
      AMZN: 186.4,
      TSLA: 254.3,
      META: 582.1,
    };
    const c = basePrices[symbol] || 150.0;
    const change = +(Math.sin(Date.now() / 10000) * 2.5).toFixed(2);
    const pc = +(c - change).toFixed(2);
    const dp = +((change / pc) * 100).toFixed(2);
    return {
      c,
      h: +(c + 3.1).toFixed(2),
      l: +(c - 2.8).toFixed(2),
      o: +(pc + 0.5).toFixed(2),
      pc,
      d: change,
      dp,
      t: Math.floor(Date.now() / 1000),
    };
  }

  if (endpoint === '/stock/profile2') {
    return {
      country: 'US',
      currency: 'USD',
      exchange: 'NASDAQ/NMS (GLOBAL MARKET)',
      ipo: '1980-12-12',
      marketCapitalization: 3485000,
      name: `${symbol} Inc`,
      phone: '14089961010',
      shareOutstanding: 15204.14,
      ticker: symbol,
      weburl: `https://www.${symbol.toLowerCase()}.com/`,
      logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png',
      finnhubIndustry: 'Technology',
    };
  }

  if (endpoint === '/country') {
    return [
      {
        country: 'United States',
        code2: 'US',
        code3: 'USA',
        currency: 'US Dollars',
        currencyCode: 'USD',
        region: 'Americas',
        subRegion: 'Northern America',
      },
      {
        country: 'United Kingdom',
        code2: 'GB',
        code3: 'GBR',
        currency: 'Pounds',
        currencyCode: 'GBP',
        region: 'Europe',
        subRegion: 'Northern Europe',
      },
      {
        country: 'Germany',
        code2: 'DE',
        code3: 'DEU',
        currency: 'Euros',
        currencyCode: 'EUR',
        region: 'Europe',
        subRegion: 'Western Europe',
      },
      {
        country: 'Japan',
        code2: 'JP',
        code3: 'JPN',
        currency: 'Yen',
        currencyCode: 'JPY',
        region: 'Asia',
        subRegion: 'Eastern Asia',
      },
    ];
  }

  if (endpoint === '/crypto/exchange') {
    return ['BINANCE', 'COINBASE', 'KRAKEN', 'KUCOIN', 'GEMINI', 'BITFINEX'];
  }

  if (endpoint === '/crypto/symbol') {
    return [
      { description: 'Binance BTC/USDT', displaySymbol: 'BTC/USDT', symbol: 'BINANCE:BTCUSDT' },
      { description: 'Binance ETH/USDT', displaySymbol: 'ETH/USDT', symbol: 'BINANCE:ETHUSDT' },
      { description: 'Binance SOL/USDT', displaySymbol: 'SOL/USDT', symbol: 'BINANCE:SOLUSDT' },
    ];
  }

  if (endpoint === '/forex/exchange') {
    return ['oanda', 'fxcm', 'forex.com', 'capital', 'pepperstone'];
  }

  if (endpoint === '/forex/symbol') {
    return [
      { description: 'Oanda EUR/USD', displaySymbol: 'EUR/USD', symbol: 'OANDA:EUR_USD' },
      { description: 'Oanda GBP/USD', displaySymbol: 'GBP/USD', symbol: 'OANDA:GBP_USD' },
      { description: 'Oanda USD/JPY', displaySymbol: 'USD/JPY', symbol: 'OANDA:USD_JPY' },
    ];
  }

  if (endpoint === '/calendar/earnings') {
    return {
      earningsCalendar: [
        {
          symbol: 'AAPL',
          date: '2026-10-30',
          hour: 'amc',
          quarter: 4,
          year: 2026,
          epsEstimate: 1.6,
          epsActual: 1.64,
        },
        {
          symbol: 'MSFT',
          date: '2026-10-29',
          hour: 'amc',
          quarter: 1,
          year: 2027,
          epsEstimate: 3.1,
          epsActual: 3.18,
        },
      ],
    };
  }

  if (endpoint === '/calendar/ipo') {
    return {
      ipoCalendar: [
        {
          date: '2026-11-05',
          exchange: 'NASDAQ',
          name: 'Apex Dynamics Inc',
          numberOfShares: 12000000,
          price: '22.00',
          status: 'expected',
          symbol: 'APXD',
        },
        {
          date: '2026-10-22',
          exchange: 'NYSE',
          name: 'Quantum Leap Labs',
          numberOfShares: 8500000,
          price: '18.50',
          status: 'priced',
          symbol: 'QLL',
        },
      ],
    };
  }

  if (endpoint === '/stock/filings') {
    return [
      {
        accessNumber: '0001140361-26-040540',
        symbol,
        cik: '320193',
        form: '10-Q',
        filedDate: '2026-10-20 00:00:00',
        filingUrl: 'https://www.sec.gov',
      },
      {
        accessNumber: '0001140361-26-030112',
        symbol,
        cik: '320193',
        form: '8-K',
        filedDate: '2026-09-15 00:00:00',
        filingUrl: 'https://www.sec.gov',
      },
    ];
  }

  if (endpoint === '/stock/financials-reported') {
    return {
      cik: '320193',
      symbol,
      data: [
        {
          accessNumber: '0000320193-25-000079',
          symbol,
          year: 2025,
          quarter: 4,
          form: '10-K',
          report: {
            bs: [{ label: 'Cash and cash equivalents', value: 29943000000 }],
            ic: [{ label: 'Total net sales', value: 391035000000 }],
          },
        },
      ],
    };
  }

  if (endpoint === '/stock/insider-sentiment') {
    return {
      symbol,
      data: [
        { symbol, year: 2026, month: 9, change: -45200, mspr: -12.4 },
        { symbol, year: 2026, month: 8, change: 12400, mspr: 8.6 },
      ],
    };
  }

  if (endpoint === '/stock/insider-transactions') {
    return {
      symbol,
      data: [
        {
          name: 'Cook Timothy D',
          share: 3280000,
          change: -50000,
          filingDate: '2026-10-15',
          transactionDate: '2026-10-14',
          transactionCode: 'S',
          transactionPrice: 229.4,
          symbol,
        },
      ],
    };
  }

  if (endpoint === '/stock/uspto-patent') {
    return {
      symbol,
      data: [
        {
          patentNumber: 'US2026029111A1',
          description: 'Neural network acceleration for spatial computing systems',
          filingDate: '2026-05-12',
          patentType: 'Utility',
        },
      ],
    };
  }

  if (endpoint === '/stock/visa-application') {
    return {
      symbol,
      data: [
        {
          year: 2026,
          quarter: 3,
          symbol,
          caseStatus: 'Certified',
          visaClass: 'H-1B',
          jobTitle: 'Senior Machine Learning Scientist',
          wageRangeFrom: 215000,
          worksiteCity: 'Cupertino',
          worksiteState: 'CA',
        },
      ],
    };
  }

  if (endpoint === '/stock/lobbying') {
    return {
      symbol,
      data: [{ symbol, year: 2026, period: 'Q2', expenses: 2100000, name: `${symbol} INC` }],
    };
  }

  if (endpoint === '/stock/usa-spending') {
    return {
      symbol,
      data: [
        {
          symbol,
          awardingAgencyName: 'Department of Defense',
          totalValue: 485000,
          awardDescription: 'Communication Systems Hardware Support',
          actionDate: '2026-08-10',
        },
      ],
    };
  }

  if (endpoint === '/stock/market-holiday') {
    return {
      data: [
        { eventName: 'Thanksgiving Day', atDate: '2026-11-26' },
        { eventName: 'Christmas Day', atDate: '2026-12-25' },
        { eventName: "New Year's Day", atDate: '2027-01-01' },
      ],
      exchange: 'US',
    };
  }

  if (endpoint === '/stock/symbol') {
    return [
      {
        currency: 'USD',
        description: 'APPLE INC',
        displaySymbol: 'AAPL',
        symbol: 'AAPL',
        type: 'Common Stock',
      },
      {
        currency: 'USD',
        description: 'MICROSOFT CORP',
        displaySymbol: 'MSFT',
        symbol: 'MSFT',
        type: 'Common Stock',
      },
      {
        currency: 'USD',
        description: 'NVIDIA CORP',
        displaySymbol: 'NVDA',
        symbol: 'NVDA',
        type: 'Common Stock',
      },
    ];
  }

  if (endpoint === '/search') {
    const q = (params.q || '').toUpperCase();
    const common = [
      { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
      {
        description: 'MICROSOFT CORP',
        displaySymbol: 'MSFT',
        symbol: 'MSFT',
        type: 'Common Stock',
      },
      { description: 'NVIDIA CORP', displaySymbol: 'NVDA', symbol: 'NVDA', type: 'Common Stock' },
      {
        description: 'AMAZON.COM INC',
        displaySymbol: 'AMZN',
        symbol: 'AMZN',
        type: 'Common Stock',
      },
      {
        description: 'ALPHABET INC-CL A',
        displaySymbol: 'GOOGL',
        symbol: 'GOOGL',
        type: 'Common Stock',
      },
      { description: 'TESLA INC', displaySymbol: 'TSLA', symbol: 'TSLA', type: 'Common Stock' },
      {
        description: 'META PLATFORMS INC-CLASS A',
        displaySymbol: 'META',
        symbol: 'META',
        type: 'Common Stock',
      },
    ];
    const filtered = common.filter((s) => s.symbol.includes(q) || s.description.includes(q));
    return { count: filtered.length, result: filtered };
  }

  if (endpoint === '/stock/market-status') {
    return {
      exchange: 'US',
      holiday: null,
      isOpen: true,
      session: 'regular',
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
        image:
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
        related: 'AAPL,MSFT,NVDA',
        source: 'Reuters',
        summary:
          'Major US indices surged during midday trading led by resilient cloud infrastructure demand and semiconductor gains.',
        url: 'https://www.reuters.com',
      },
    ];
  }

  if (endpoint === '/stock/candle') {
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

    return { c: cArr, h: hArr, l: lArr, o: oArr, s: 'ok', t: tArr, v: vArr };
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
    ];
  }

  if (endpoint === '/stock/earnings') {
    return [
      {
        actual: 1.64,
        estimate: 1.6,
        period: '2026-06-30',
        quarter: 3,
        surprise: 0.04,
        surprisePercent: 2.5,
        symbol,
        year: 2026,
      },
    ];
  }

  return null;
}
