import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange');

    if (exchange) {
      const { data, isDemo } = await FinnhubClient.getForexSymbols(exchange);
      return handleApiSuccess(data, 3600, isDemo);
    }

    const { data, isDemo } = await FinnhubClient.getForexExchanges();
    return handleApiSuccess(data, 86400, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}

