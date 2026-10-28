'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '@/components/ui-states';
import { Navbar } from '@/components/navbar';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Route Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar showSearch={false} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <ErrorState
            message="Something went wrong on our side. Please try again."
            onRetry={reset}
          />
        </div>
      </div>
    </div>
  );
}
