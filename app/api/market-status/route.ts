import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange') || 'US';

    const { data, isDemo } = await FinnhubClient.getMarketStatus(exchange);
    return handleApiSuccess(data, 60, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}
