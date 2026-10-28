import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { EmptyState, ErrorState } from '@/components/ui-states';
import { QuoteCard } from '@/components/quote-card';
import { saveCachedQuote } from '@/lib/quote-storage';

describe('UI States & QuoteCard Component', () => {
  it('renders EmptyState with friendly message and triggers next action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Your watchlist is empty"
        description="Your watchlist is empty. Search for a symbol to add one."
        actionLabel="Search Symbols"
        onAction={onAction}
      />
    );

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Search Symbols' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorState with accessible alert role and Retry button', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        message="Market data is temporarily unavailable"
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Market data is temporarily unavailable');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders QuoteCard from loading skeleton to live quote success state', async () => {
    server.use(
      http.get('/api/quote', () => {
        return HttpResponse.json({
          data: {
            c: 228.45,
            h: 230.1,
            l: 225.8,
            o: 226.5,
            pc: 225.0,
            d: 3.45,
            dp: 1.53,
          },
        });
      })
    );

    render(<QuoteCard symbol="AAPL" pollingIntervalMs={60000} />);

    await waitFor(() => {
      expect(screen.getByText('$228.45')).toBeInTheDocument();
    });
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText(/\+3\.45/)).toBeInTheDocument();
  });

  it('renders QuoteCard error state when API returns an error and no offline cache exists', async () => {
    server.use(
      http.get('/api/quote', () => {
        return HttpResponse.json(
          { error: 'Market data is temporarily unavailable' },
          { status: 401 }
        );
      })
    );

    render(<QuoteCard symbol="MSFT" pollingIntervalMs={60000} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Market data is temporarily unavailable');
    });
  });

  it('falls back to last saved quote in QuoteCard when network fails offline', async () => {
    saveCachedQuote('NVDA', {
      c: 138.85,
      h: 140.0,
      l: 136.0,
      o: 137.0,
      pc: 135.0,
      d: 3.85,
      dp: 2.85,
    });

    server.use(
      http.get('/api/quote', () => {
        return HttpResponse.error();
      })
    );

    render(<QuoteCard symbol="NVDA" pollingIntervalMs={60000} />);

    await waitFor(() => {
      expect(screen.getByText('$138.85')).toBeInTheDocument();
    });
    expect(screen.getByText('Cached')).toBeInTheDocument();
  });
});
