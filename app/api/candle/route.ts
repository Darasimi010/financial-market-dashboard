import { NextRequest } from 'next/server';
import { FinnhubClient, FinnhubApiError } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const resolution = searchParams.get('resolution') || 'D';
    
    // Default timeframe: last 30 days
    const nowSec = Math.floor(Date.now() / 1000);
    const to = parseInt(searchParams.get('to') || String(nowSec), 10);
    const from = parseInt(searchParams.get('from') || String(nowSec - 30 * 86400), 10);

    if (!symbol) {
      return handleApiError(new Error('Symbol parameter is required'));
    }

    try {
      const { data, isDemo } = await FinnhubClient.getCandles(symbol, resolution, from, to);
      return handleApiSuccess(data, 300, isDemo);
    } catch (candleErr) {
      // If candle endpoint is restricted on the free tier (401 or 403), synthesize a trend from quote
      if (candleErr instanceof FinnhubApiError && (candleErr.status === 401 || candleErr.status === 403)) {
        console.warn(`[API Candle] Free tier access restricted on /stock/candle for ${symbol}. Synthesizing chart from quote.`);
        const { data: quote } = await FinnhubClient.getQuote(symbol);
        
        const count = 30;
        const daySec = 86400;
        const cArr: number[] = [];
        const oArr: number[] = [];
        const hArr: number[] = [];
        const lArr: number[] = [];
        const tArr: number[] = [];
        const vArr: number[] = [];

        let current = quote.c * 0.92;
        const target = quote.c;
        const step = (target - current) / count;

        for (let i = count - 1; i >= 0; i--) {
          const t = nowSec - i * daySec;
          const open = +current.toFixed(2);
          const variation = (Math.sin(i * 0.4) * (quote.c * 0.015));
          current = +(current + step + variation).toFixed(2);
          const close = i === 0 ? quote.c : +current.toFixed(2);
          const high = +(Math.max(open, close) + quote.c * 0.008).toFixed(2);
          const low = +(Math.min(open, close) - quote.c * 0.008).toFixed(2);
          const volume = Math.floor(15000000 + Math.random() * 20000000);

          oArr.push(open);
          cArr.push(close);
          hArr.push(high);
          lArr.push(low);
          tArr.push(t);
          vArr.push(volume);
        }

        return handleApiSuccess(
          {
            c: cArr,
            h: hArr,
            l: lArr,
            o: oArr,
            s: 'ok',
            t: tArr,
            v: vArr,
          },
          300,
          true
        );
      }
      throw candleErr;
    }
  } catch (err) {
    return handleApiError(err);
  }
}
