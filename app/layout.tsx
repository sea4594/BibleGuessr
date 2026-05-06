import type { Metadata, Viewport } from 'next';
import { Barlow } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/lib/gameContext';
import { UiSettingsProvider } from '@/lib/uiSettingsContext';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} min-h-screen font-[var(--font-body)] antialiased`}>
        <UiSettingsProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </UiSettingsProvider>
      </body>
    </html>
  );
}
