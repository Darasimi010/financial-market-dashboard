'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-600/90 dark:bg-amber-500/90 backdrop-blur-md text-white text-xs font-medium shadow-lg border border-amber-400/30"
    >
      <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
      <span>You&apos;re offline. Showing the last saved data.</span>
    </div>
  );
}
