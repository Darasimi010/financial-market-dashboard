import React from 'react';
import { DashboardShell } from '@/components/dashboard-shell';

interface DashboardPageProps {
  searchParams: Promise<{ symbol?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolved = await searchParams;
  return <DashboardShell initialSymbol={resolved.symbol} />;
}
