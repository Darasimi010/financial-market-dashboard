import { NextRequest } from 'next/server';
import { FinnhubClient } from '@/lib/finnhub/client';
import { handleApiError, handleApiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, isDemo } = await FinnhubClient.getCountryList();
    return handleApiSuccess(data, 86400, isDemo);
  } catch (err) {
    return handleApiError(err);
  }
}

