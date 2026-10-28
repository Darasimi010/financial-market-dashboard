'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '@/components/ui-states';

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Route Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg">
        <ErrorState
          message="Something went wrong on our side. Please try again."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
