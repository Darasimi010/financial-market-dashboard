import { NextResponse } from 'next/server';
import { FinnhubApiError } from '@/lib/finnhub/client';
import { FINNHUB_CONFIG } from '@/lib/config';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof FinnhubApiError) {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-store, max-age=0',
    };
    if (error.retryAfterSeconds) {
      headers['Retry-After'] = String(error.retryAfterSeconds);
    }
    return NextResponse.json(
      {
        error: error.userMessage,
        code: error.code,
        status: error.status,
      },
      {
        status: error.status,
        headers,
      }
    );
  }

  console.error('[API Handler Uncaught Error]:', error);
  return NextResponse.json(
    {
      error: FINNHUB_CONFIG.errorMessages.serverError,
      code: 'serverError',
      status: 500,
    },
    {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export function handleApiSuccess<T>(data: T, maxAgeSec: number = 30, isDemo: boolean = false): NextResponse {
  return NextResponse.json(
    {
      data,
      isDemo,
      timestamp: Date.now(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 2}`,
      },
    }
  );
}
