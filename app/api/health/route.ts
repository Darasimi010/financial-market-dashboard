import { NextResponse } from 'next/server';
import { getFinnhubApiKey } from '@/lib/finnhub/client';
import { FINNHUB_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasApiKey = Boolean(getFinnhubApiKey());
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Finnhub Market Dashboard API Proxy',
    freeTierOnly: true,
    supportedMarket: 'US Stocks',
    hasApiKey,
    mode: hasApiKey ? 'live' : 'demo-fallback',
    rateLimits: FINNHUB_CONFIG.rateLimits,
  });
}
