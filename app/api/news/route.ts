import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const category = searchParams.get('category') || 'general';

    if (symbol) {
      // Company news: past 30 days
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);

      const toStr = toDate.toISOString().split('T')[0];
      const fromStr = fromDate.toISOString().split('T')[0];

      const { data, isDemo } = await FinnhubClient.getCompanyNews(symbol, fromStr, toStr);
      return handleApiSuccess(data.slice(0, 20), 600, isDemo);
    }

    const { data, isDemo } = await FinnhubClient.getMarketNews(category);
    return handleApiSuccess(data.slice(0, 25), 600, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}
