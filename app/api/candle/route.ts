import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const resolution = searchParams.get('resolution') || 'D';
    
    const nowSec = Math.floor(Date.now() / 1000);
    const to = parseInt(searchParams.get('to') || String(nowSec), 10);
    const from = parseInt(searchParams.get('from') || String(nowSec - 30 * 86400), 10);

    if (!symbol) {
      return handleApiError(new Error('Symbol parameter is required'));
    }

    try {
      const { data, isDemo } = await FinnhubClient.getCandles(symbol, resolution, from, to);
      return handleApiSuccess(data, 300, isDemo);
    } catch {
      // Finnhub Free Tier /stock/candle is restricted behind Finnhub paid tiers.
      // Return 403 Forbidden with exact clear message indicating it is behind a paywall.
      return Response.json(
        {
          error: 'Historical candle chart data is behind a Finnhub paid tier or paywall. Free tier access is restricted.',
          paywalled: true,
          status: 403,
        },
        { status: 403 }
      );
    }
  } catch (err) {
    return handleApiError(err);
  }
}
