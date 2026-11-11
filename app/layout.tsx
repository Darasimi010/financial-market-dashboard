import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { OfflineIndicator } from '@/components/offline-indicator';
import { ClientErrorBoundary } from '@/components/error-boundary';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'MarketDash - Financial Market Dashboard',
  description:
    'Progressive Web App for tracking US stock market data with live quotes, interactive charts, company profiles, and market news powered by the Finnhub REST API.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MarketDash',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'MarketDash - Financial Market Dashboard',
    description:
      'Progressive Web App for tracking US stock market data with live quotes, interactive charts, company profiles, and market news powered by the Finnhub REST API.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketDash - Financial Market Dashboard',
    description:
      'Progressive Web App for tracking US stock market data with live quotes, interactive charts, company profiles, and market news powered by the Finnhub REST API.',
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('marketdash_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (!stored && prefersDark) || (stored === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400"
      >
        <ThemeProvider>
          <ClientErrorBoundary>{children}</ClientErrorBoundary>
          <OfflineIndicator />
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
