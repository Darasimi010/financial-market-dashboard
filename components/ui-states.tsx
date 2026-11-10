'use client';

import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch, Clock } from 'lucide-react';

export function Skeleton({ className = 'h-6 w-full' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function QuoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 shadow-sm space-y-4 h-[380px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-12 rounded-lg" />
          <Skeleton className="h-8 w-12 rounded-lg" />
          <Skeleton className="h-8 w-12 rounded-lg" />
        </div>
      </div>
      <div className="w-full flex-1 flex items-end gap-2 pt-8 pb-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t animate-pulse"
            style={{ height: `${20 + ((i * 17) % 75)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = <FolderSearch className="w-10 h-10 text-slate-400" />,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
      <div className="p-3 mb-3 rounded-full bg-slate-100 dark:bg-slate-800/80">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-lg shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCountdown?: number;
}

export function ErrorState({
  message = 'Something went wrong on our side. Please try again.',
  onRetry,
  isRetrying = false,
  retryCountdown,
}: ErrorStateProps) {
  const isRateLimited =
    message.includes('fetching data too quickly') || retryCountdown !== undefined;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 gap-3"
    >
      <div className="flex items-center gap-3">
        {isRateLimited ? (
          <Clock className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium">{message}</p>
          {retryCountdown !== undefined && retryCountdown > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Automatic retry in {retryCountdown}s...
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shadow-xs disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}
