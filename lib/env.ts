/**
 * Server Environment Validation
 * Validates required Finnhub configuration at server startup without ever logging secret values.
 */

export function validateServerEnv(options?: { strict?: boolean }): {
  hasKey: boolean;
  mode: 'live' | 'demo-fallback';
} {
  const raw = process.env.FINNHUB_API_KEY;
  const hasKey = Boolean(
    raw &&
      raw.trim().length > 0 &&
      raw !== 'your_finnhub_api_key_here' &&
      raw !== 'MY_FINNHUB_API_KEY'
  );

  const shouldFailHard = options?.strict ?? process.env.STRICT_FINNHUB_KEY === 'true';

  if (!hasKey && shouldFailHard) {
    throw new Error(
      '[Startup Check Failed] Missing FINNHUB_API_KEY environment variable. ' +
        'Add FINNHUB_API_KEY to .env.local for local development, GitHub Actions secrets for CI, ' +
        'or Vercel Project Environment Variables for production.'
    );
  }

  if (!hasKey && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[Startup Notice] FINNHUB_API_KEY is not configured. Running with deterministic US demo market data. ' +
        'Set FINNHUB_API_KEY (and optionally STRICT_FINNHUB_KEY=true) to enforce live upstream Finnhub calls.'
    );
  }

  return {
    hasKey,
    mode: hasKey ? 'live' : 'demo-fallback',
  };
}
