import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return handleApiError(new Error('Symbol query parameter is required'));
    }

    const { data, isDemo } = await FinnhubClient.getCompanyProfile(symbol);
    return handleApiSuccess(data, 86400, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}
