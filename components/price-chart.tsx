'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FinnhubCandles } from '@/lib/finnhub/schemas';
import { ChartSkeleton, ErrorState } from './ui-states';
import { BarChart3, LineChart as LineChartIcon, ShieldAlert } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  currentPrice?: number;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y';
type ChartType = 'candles' | 'line';

interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateStr: string;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 340;
const PRICE_HEIGHT = 250;
const VOLUME_HEIGHT = 60;

export function PriceChart({ symbol, currentPrice }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [candles, setCandles] = useState<FinnhubCandles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<CandlePoint | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const requestKey = `${symbol}:${timeframe}:${retryCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      let fromSec = nowSec - 30 * 86400;
      let resolution = 'D';

      if (timeframe === '1D') {
        fromSec = nowSec - 86400;
        resolution = '5';
      } else if (timeframe === '1W') {
        fromSec = nowSec - 7 * 86400;
        resolution = '60';
      } else if (timeframe === '1M') {
        fromSec = nowSec - 30 * 86400;
        resolution = 'D';
      } else if (timeframe === '3M') {
        fromSec = nowSec - 90 * 86400;
        resolution = 'D';
      } else if (timeframe === '1Y') {
        fromSec = nowSec - 365 * 86400;
        resolution = 'W';
      }

      try {
        const res = await fetch(
          `/api/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${fromSec}&to=${nowSec}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load chart data');
        }
        if (!cancelled) {
          setCandles(json.data);
          setIsDemo(Boolean(json.isDemo));
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Market data is temporarily unavailable';
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoadedKey(requestKey);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, requestKey]);

  const points: CandlePoint[] = useMemo(() => {
    if (!candles || !candles.c || candles.c.length === 0) return [];
    const count = candles.c.length;
    const pts: CandlePoint[] = [];

    for (let i = 0; i < count; i++) {
      const t = candles.t[i];
      const d = new Date(t * 1000);
      const dateStr =
        timeframe === '1D'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: timeframe === '1Y' ? '2-digit' : undefined,
            });

      pts.push({
        time: t,
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
        volume: candles.v ? candles.v[i] : 0,
        dateStr,
      });
    }

    return pts;
  }, [candles, timeframe]);

  const { minPrice, maxPrice, maxVolume, priceChange, percentChange, isPositive } = useMemo(() => {
    if (points.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 100,
        maxVolume: 1,
        priceChange: 0,
        percentChange: 0,
        isPositive: true,
      };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const p of points) {
      if (p.low < min) min = p.low;
      if (p.high > max) max = p.high;
      if (p.volume > maxVol) maxVol = p.volume;
    }

    const padding = (max - min) * 0.08 || 2;
    const firstClose = points[0].close;
    const lastClose = points[points.length - 1].close;
    const change = +(lastClose - firstClose).toFixed(2);
    const pChange = +((change / firstClose) * 100).toFixed(2);

    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol || 1,
      priceChange: change,
      percentChange: pChange,
      isPositive: change >= 0,
    };
  }, [points]);

  const getYForPrice = useCallback(
    (p: number) => {
      return PRICE_HEIGHT - ((p - minPrice) / (maxPrice - minPrice)) * (PRICE_HEIGHT - 20) - 10;
    },
    [minPrice, maxPrice]
  );

  const getYForVolume = useCallback(
    (v: number) => {
      return CHART_HEIGHT - (v / maxVolume) * VOLUME_HEIGHT;
    },
    [maxVolume]
  );

  const getXForIndex = useCallback(
    (i: number) => {
      if (points.length <= 1) return CHART_WIDTH / 2;
      return 30 + (i / (points.length - 1)) * (CHART_WIDTH - 60);
    },
    [points.length]
  );

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'} ${getXForIndex(i).toFixed(1)} ${getYForPrice(p.close).toFixed(1)}`
      )
      .join(' ');
  }, [points, getXForIndex, getYForPrice]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = getXForIndex(0);
    const lastX = getXForIndex(points.length - 1);
    return `${linePath} L ${lastX.toFixed(1)} ${PRICE_HEIGHT} L ${firstX.toFixed(1)} ${PRICE_HEIGHT} Z`;
  }, [linePath, points.length, getXForIndex]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * CHART_WIDTH;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((_, i) => {
      const diff = Math.abs(getXForIndex(i) - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setHoveredPoint(points[closestIdx]);
    setCursorX(getXForIndex(closestIdx));
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setCursorX(null);
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {symbol} Market Chart
          </h3>
          <span className="text-xs text-slate-500 font-mono">Finnhub Free Tier</span>
        </div>
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    );
  }

  const activePoint = hoveredPoint || (points.length > 0 ? points[points.length - 1] : null);
  const activeColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      {/* Header with Title, Live Price & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {symbol}
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              US Equity
            </span>
            {isDemo && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" />
                Demo Feed
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              ${activePoint ? activePoint.close.toFixed(2) : (currentPrice || 0).toFixed(2)}
            </span>
            <span
              className={`text-xs font-semibold font-mono ${
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
              {percentChange}%)
            </span>
            {activePoint && (
              <span className="text-xs text-slate-400 ml-2">{activePoint.dateStr}</span>
            )}
          </div>
        </div>

        {/* Timeframe & View Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setChartType('candles')}
              className={`p-1.5 rounded-md text-xs transition ${
                chartType === 'candles'
                  ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Candlestick Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-md text-xs transition ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Smooth Line Chart"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            {(['1D', '1W', '1M', '3M', '1Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition ${
                  timeframe === tf
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candlestick / Line SVG Canvas */}
      <div className="relative w-full h-[320px] select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
            </linearGradient>
            <pattern id="chartGrid" width="100" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeOpacity="0.06" />
            </pattern>
          </defs>

          <rect
            width={CHART_WIDTH}
            height={PRICE_HEIGHT}
            fill="url(#chartGrid)"
            className="text-slate-900 dark:text-slate-100"
          />
          <line
            x1="0"
            y1={PRICE_HEIGHT}
            x2={CHART_WIDTH}
            y2={PRICE_HEIGHT}
            stroke="currentColor"
            strokeOpacity="0.1"
          />

          {points.map((p, i) => {
            const x = getXForIndex(i);
            const y = getYForVolume(p.volume);
            const barW = Math.max(2, (CHART_WIDTH / points.length) * 0.6);
            const isUp = p.close >= p.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - barW / 2}
                y={y}
                width={barW}
                height={Math.max(1, CHART_HEIGHT - y)}
                fill={isUp ? '#10b981' : '#f43f5e'}
                opacity={0.35}
                rx={1}
              />
            );
          })}

          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke={activeColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {chartType === 'candles' &&
            points.map((p, i) => {
              const x = getXForIndex(i);
              const yHigh = getYForPrice(p.high);
              const yLow = getYForPrice(p.low);
              const yOpen = getYForPrice(p.open);
              const yClose = getYForPrice(p.close);
              const isUp = p.close >= p.open;
              const candleW = Math.max(3, (CHART_WIDTH / points.length) * 0.75);
              const rectY = Math.min(yOpen, yClose);
              const rectH = Math.max(2, Math.abs(yClose - yOpen));
              const color = isUp ? '#10b981' : '#f43f5e';

              return (
                <g key={`candle-${i}`}>
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <rect
                    x={x - candleW / 2}
                    y={rectY}
                    width={candleW}
                    height={rectH}
                    fill={color}
                    rx={1.5}
                  />
                </g>
              );
            })}

          {cursorX !== null && activePoint && (
            <>
              <line
                x1={cursorX}
                y1={0}
                x2={cursorX}
                y2={CHART_HEIGHT}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.7}
              />
              <circle
                cx={cursorX}
                cy={getYForPrice(activePoint.close)}
                r={5}
                fill={activeColor}
                stroke="#ffffff"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {hoveredPoint && (
          <div className="absolute top-2 left-3 z-10 flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-[11px] font-mono shadow-md border border-slate-700/50 pointer-events-none">
            <div>
              <span className="text-slate-400">Date:</span> {hoveredPoint.dateStr}
            </div>
            <div>
              <span className="text-slate-400">O:</span> ${hoveredPoint.open.toFixed(2)}
            </div>
            <div>
              <span className="text-slate-400">H:</span> ${hoveredPoint.high.toFixed(2)}
            </div>
            <div>
              <span className="text-slate-400">L:</span> ${hoveredPoint.low.toFixed(2)}
            </div>
            <div>
              <span className="text-slate-400">C:</span> ${hoveredPoint.close.toFixed(2)}
            </div>
            {hoveredPoint.volume > 0 && (
              <div>
                <span className="text-slate-400">Vol:</span>{' '}
                {(hoveredPoint.volume / 1000000).toFixed(1)}M
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <span>Low: ${minPrice.toFixed(2)}</span>
        <span>Vol Sub-chart (Relative)</span>
        <span>High: ${maxPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}
