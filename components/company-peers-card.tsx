'use client';

import { useState, useEffect } from 'react';
import { CardSkeleton, ErrorState } from './ui-states';
import { ArrowRight } from 'lucide-react';

interface CompanyPeersCardProps {
  symbol: string;
  onSelectPeer?: (peer: string) => void;
}

export function CompanyPeersCard({ symbol, onSelectPeer }: CompanyPeersCardProps) {
  const [peers, setPeers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/peers?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load peers');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setPeers(json.data || []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching peers');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} />;

  const filteredPeers = peers.filter((p) => p !== symbol);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-xs transition">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Industry Peers &amp; Competitors
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          Free Peer Engine
        </span>
      </div>

      {filteredPeers.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">No industry peers identified.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filteredPeers.map((peer) => (
            <button
              key={peer}
              onClick={() => onSelectPeer?.(peer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/60 text-xs font-mono font-bold transition text-slate-700 dark:text-slate-200"
            >
              <span>{peer}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
