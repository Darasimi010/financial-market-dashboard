import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const { data, isDemo } = await FinnhubClient.getIpoCalendar(from, to);
    return handleApiSuccess(data, 21600, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}

