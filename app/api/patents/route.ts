import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    if (!symbol) {
      return handleApiError(new Error('Symbol parameter is required'));
    }

    const { data, isDemo } = await FinnhubClient.getPatents(symbol, from, to);
    return handleApiSuccess(data, 43200, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}

