import type { Metadata, Viewport } from 'next';
import { Barlow } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/lib/gameContext';
import { UiSettingsProvider } from '@/lib/uiSettingsContext';
import { AccountSyncProvider } from '@/lib/accountSync';
import EnsureHomeOnLaunch from '@/components/EnsureHomeOnLaunch';
import { SettingsModalProvider } from '@/components/SettingsModalProvider';

const bodyFont = Barlow({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BibleGuessr',
  description: 'A GeoGuessr-style Bible verse guessing game',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon-32x32.png'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
        <AccountSyncProvider>
          <UiSettingsProvider>
            <GameProvider>
              <SettingsModalProvider>
                <EnsureHomeOnLaunch />
                {children}
              </SettingsModalProvider>
            </GameProvider>
          </UiSettingsProvider>
        </AccountSyncProvider>
      </body>
    </html>
  );
}
