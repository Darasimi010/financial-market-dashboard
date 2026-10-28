import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export const handlers = [
  http.get(`${FINNHUB_BASE}/quote`, ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    if (symbol === 'UNKNW') {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      c: 230.5,
      h: 232.1,
      l: 228.0,
      o: 229.0,
      pc: 227.5,
      d: 3.0,
      dp: 1.32,
      t: 1700000000,
    });
  }),

  http.get(`${FINNHUB_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    return HttpResponse.json({
      count: 3,
      result: [
        {
          description: `${q.toUpperCase()} INC`,
          displaySymbol: 'AAPL',
          symbol: 'AAPL',
          type: 'Common Stock',
        },
        {
          description: 'APPLE SWISS LISTING',
          displaySymbol: 'AAPL.SW',
          symbol: 'AAPL.SW',
          type: 'Common Stock',
        },
        {
          description: 'BERKSHIRE HATHAWAY B',
          displaySymbol: 'BRK.B',
          symbol: 'BRK.B',
          type: 'Common Stock',
        },
      ],
    });
  }),

  http.get(`${FINNHUB_BASE}/stock/profile2`, ({ request }) => {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol') || 'AAPL';
    return HttpResponse.json({
      country: 'US',
      currency: 'USD',
      exchange: 'NASDAQ',
      ipo: '1980-12-12',
      marketCapitalization: 3450000,
      name: `${symbol} Inc`,
      phone: '14089961010',
      shareOutstanding: 15200,
      ticker: symbol,
      weburl: 'https://www.apple.com/',
      logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png',
      finnhubIndustry: 'Technology',
    });
  }),
];

export const server = setupServer(...handlers);
