'use client';
import type { Metadata, Viewport } from 'next';
import { Barlow } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/lib/gameContext';
import { UiSettingsProvider } from '@/lib/uiSettingsContext';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const bodyFont = Barlow({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BibleGuessr',
  description: 'A GeoGuessr-style Bible verse guessing game',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BibleGuessr',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect /play routes back to home on page refresh
  useEffect(() => {
    const isGameSetupPage = pathname.startsWith('/play/') && !pathname.includes('/game');
    if (isGameSetupPage && typeof window !== 'undefined') {
      // Check if this is a fresh page load (not an intentional navigation)
      if (performance.getEntriesByType('navigation')[0]?.entryType === 'navigate') {
        router.replace('/');
      }
    }
  }, [pathname, router]);

  return children;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} min-h-screen font-[var(--font-body)] antialiased`}>
        <UiSettingsProvider>
          <GameProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </GameProvider>
        </UiSettingsProvider>
      </body>
    </html>
  );
}
