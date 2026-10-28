import { NextRequest, NextResponse } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { isUSStockSymbol } from '@/lib/config';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || !q.trim()) {
      return NextResponse.json({ data: { count: 0, result: [] } });
    }

    const { data, isDemo } = await FinnhubClient.search(q);

    // Filter out non-US symbols to communicate and enforce free tier US constraint
    const usResults = {
      ...data,
      result: data.result.filter((item) => isUSStockSymbol(item.symbol)),
    };
    usResults.count = usResults.result.length;

    return handleApiSuccess(usResults, 3600, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}
