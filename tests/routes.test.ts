import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { GET as getQuoteRoute } from '@/app/api/quote/route';
import { GET as getSearchRoute } from '@/app/api/search/route';
import { FinnhubClient } from '@/lib/finnhub/client';
import { FINNHUB_CONFIG } from '@/lib/config';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

describe('API Route Handlers & Error Message Mapping', () => {
  const originalKey = process.env.FINNHUB_API_KEY;

  beforeEach(() => {
    process.env.FINNHUB_API_KEY = 'secret_server_finnhub_key';
    FinnhubClient.clearCache();
  });

  afterEach(() => {
    process.env.FINNHUB_API_KEY = originalKey;
  });

  it('returns 200 and normalized quote payload without leaking the API key', async () => {
    const req = new NextRequest('http://localhost:3000/api/quote?symbol=AAPL');
    const res = await getQuoteRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.c).toBe(230.5);
    expect(JSON.stringify(body)).not.toContain('secret_server_finnhub_key');
  });

  it('maps 401/403 upstream errors to safe user-friendly message without exposing key issues', async () => {
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        return HttpResponse.json({ error: 'Invalid API key secret_server_finnhub_key' }, { status: 401 });
      })
    );

    const req = new NextRequest('http://localhost:3000/api/quote?symbol=AAPL');
    const res = await getQuoteRoute(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Market data is temporarily unavailable');
    expect(JSON.stringify(body)).not.toContain('secret_server_finnhub_key');
  });

  it('maps persistent 429 rate-limit responses to exact backoff message', async () => {
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        return new HttpResponse(null, { status: 429, headers: { 'Retry-After': '0' } });
      })
    );

    const req = new NextRequest('http://localhost:3000/api/quote?symbol=AAPL');
    const res = await getQuoteRoute(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe(FINNHUB_CONFIG.errorMessages.rateLimited);
  });

  it('maps 404 or non-US symbols to exact US-only message', async () => {
    const nonUsReq = new NextRequest('http://localhost:3000/api/quote?symbol=AAPL.SW');
    const nonUsRes = await getQuoteRoute(nonUsReq);
    const nonUsBody = await nonUsRes.json();

    expect(nonUsRes.status).toBe(400);
    expect(nonUsBody.error).toBe(FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);

    const unknownReq = new NextRequest('http://localhost:3000/api/quote?symbol=UNKNW');
    const unknownRes = await getQuoteRoute(unknownReq);
    const unknownBody = await unknownRes.json();

    expect(unknownRes.status).toBe(404);
    expect(unknownBody.error).toBe(FINNHUB_CONFIG.errorMessages.notFoundOrNonUS);
  });

  it('maps 5xx upstream failures to generic server error message', async () => {
    server.use(
      http.get(`${FINNHUB_BASE}/quote`, () => {
        return new HttpResponse('Internal Upstream Crash', { status: 503 });
      })
    );

    const req = new NextRequest('http://localhost:3000/api/quote?symbol=AAPL');
    const res = await getQuoteRoute(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe(FINNHUB_CONFIG.errorMessages.serverError);
  });

  it('filters out non-US exchange listings in /api/search while keeping US share classes', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=apple');
    const res = await getSearchRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    const symbols = body.data.result.map((r: { symbol: string }) => r.symbol);
    expect(symbols).toContain('AAPL');
    expect(symbols).toContain('BRK.B');
    expect(symbols).not.toContain('AAPL.SW');
  });
});
