import React from 'react';
import { ChartSkeleton, QuoteCardSkeleton, Skeleton } from '@/components/ui-states';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <ChartSkeleton />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="xl:col-span-4 space-y-6">
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
        </div>
      </div>
    </div>
  );
}
