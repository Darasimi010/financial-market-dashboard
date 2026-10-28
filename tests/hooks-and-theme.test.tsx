import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useWatchlist, DEFAULT_WATCHLIST } from '@/hooks/use-watchlist';
import { ThemeProvider, useTheme } from '@/components/theme-provider';

function ThemeTester() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{resolvedTheme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe('useWatchlist Hook', () => {
  it('initializes with default US watchlist and persists additions and removals', () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual(DEFAULT_WATCHLIST);

    act(() => {
      const added = result.current.addToWatchlist('tsla');
      expect(added).toBe(true);
    });
    expect(result.current.watchlist[0]).toBe('TSLA');
    expect(result.current.isInWatchlist('TSLA')).toBe(true);

    // Rejects non-US ticker
    act(() => {
      const addedNonUs = result.current.addToWatchlist('AC.TO');
      expect(addedNonUs).toBe(false);
    });
    expect(result.current.isInWatchlist('AC.TO')).toBe(false);

    act(() => {
      result.current.removeFromWatchlist('TSLA');
    });
    expect(result.current.isInWatchlist('TSLA')).toBe(false);
  });
});

describe('ThemeProvider & Toggle', () => {
  it('toggles between dark and light themes and persists choice in localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    const status = screen.getByTestId('current-theme');
    expect(status.textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByText('Toggle Theme'));

    expect(status.textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('marketdash_theme')).toBe('light');
  });
});
