import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { FinnhubClient, FinnhubApiError } from '@/lib/finnhub/client';
import { FINNHUB_CONFIG, isUSStockSymbol } from '@/lib/config';
import { validateServerEnv } from '@/lib/env';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

describe('US Stock Symbol Validation & Startup Env Check', () => {
  it('accepts valid US symbols including share classes and rejects non-US suffixes', () => {
    expect(isUSStockSymbol('AAPL')).toBe(true);
    expect(isUSStockSymbol('nvda')).toBe(true);
    expect(isUSStockSymbol('BRK.B')).toBe(true);

    expect(isUSStockSymbol('AC.TO')).toBe(false);
    expect(isUSStockSymbol('BARC.L')).toBe(false);
    expect(isUSStockSymbol('APC.DE')).toBe(false);
    expect(isUSStockSymbol('BINANCE:BTCUSDT')).toBe(false);
    expect(isUSStockSymbol('')).toBe(false);
  });

  it('throws a clear startup error when strict mode is enabled and FINNHUB_API_KEY is missing', () => {
    const prev = process.env.FINNHUB_API_KEY;
    delete process.env.FINNHUB_API_KEY;
    try {
      expect(() => validateServerEnv({ strict: true })).toThrow(/FINNHUB_API_KEY/);
    } finally {
      process.env.FINNHUB_API_KEY = prev;
    }
  });
});

describe('FinnhubClient: Validation, Caching, Deduplication, and Backoff', () => {
  const originalKey = process.env.FINNHUB_API_KEY;

  beforeEach(() => {
    process.env.FINNHUB_API_KEY = 'test_finnhub_secret_token';
    FinnhubClient.clearCache();
  });

  afterEach(() => {
    process.env.FINNHUB_API_KEY = originalKey;
  });

  it('validates upstream Quote responses with Zod and caches subsequent calls', async () => {
    let upstreamHits = 0;
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        upstreamHits += 1;
        return HttpResponse.json({
          c: 199.25,
          h: 201.0,
          l: 197.5,
          o: 198.0,
          pc: 196.8,
          d: 2.45,
          dp: 1.24,
        });
      })
    );

    const first = await FinnhubClient.getQuote('AAPL');
    expect(first.data.c).toBe(199.25);
    expect(first.fromCache).toBe(false);

    const second = await FinnhubClient.getQuote('AAPL');
    expect(second.data.c).toBe(199.25);
    expect(second.fromCache).toBe(true);
    expect(upstreamHits).toBe(1);
  });

  it('de-duplicates concurrent in-flight requests for the same endpoint', async () => {
    let upstreamHits = 0;
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, async () => {
        upstreamHits += 1;
        await new Promise((r) => setTimeout(r, 30));
        return HttpResponse.json({
          c: 410.0,
          h: 412.0,
          l: 408.0,
          o: 409.0,
          pc: 407.0,
        });
      })
    );

    const [r1, r2, r3] = await Promise.all([
      FinnhubClient.getQuote('MSFT'),
      FinnhubClient.getQuote('MSFT'),
      FinnhubClient.getQuote('MSFT'),
    ]);

    expect(r1.data.c).toBe(410.0);
    expect(r2.data.c).toBe(410.0);
    expect(r3.data.c).toBe(410.0);
    expect(upstreamHits).toBe(1);
  });

  it('rejects malformed payloads at runtime via Zod validation', async () => {
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        return HttpResponse.json({ c: 'invalid_number' });
      })
    );

    await expect(FinnhubClient.getQuote('AAPL')).rejects.toMatchObject({
      status: 500,
      userMessage: FINNHUB_CONFIG.errorMessages.serverError,
    });
  });

  it('retries automatically with backoff on HTTP 429 and succeeds when upstream recovers', async () => {
    let attempts = 0;
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        attempts += 1;
        if (attempts === 1) {
          return new HttpResponse(null, {
            status: 429,
            headers: { 'Retry-After': '0' },
          });
        }
        return HttpResponse.json({
          c: 145.5,
          h: 147.0,
          l: 143.0,
          o: 144.0,
          pc: 142.0,
        });
      })
    );

    const result = await FinnhubClient.getQuote('NVDA');
    expect(attempts).toBe(2);
    expect(result.data.c).toBe(145.5);
  });

  it('rejects non-US ticker requests before calling Finnhub', async () => {
    await expect(FinnhubClient.getQuote('BARC.L')).rejects.toBeInstanceOf(FinnhubApiError);
    await expect(FinnhubClient.getQuote('BARC.L')).rejects.toMatchObject({
      userMessage: FINNHUB_CONFIG.errorMessages.notFoundOrNonUS,
    });
  });
});
