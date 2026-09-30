import type { Metadata, Viewport } from 'next';
import { Barlow } from 'next/font/google';
import Script from 'next/script';
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

const isGitHubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubPages ? '/BibleGuessr' : '';

const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  const fallback = { color: 'ocean', mode: 'light' };
  const byPreset = {
    light: { color: 'bw', mode: 'light' },
    dark: { color: 'bw', mode: 'dark' },
    clay: { color: 'clay', mode: 'light' },
    'ocean-light': { color: 'ocean', mode: 'light' },
    'ocean-dark': { color: 'ocean', mode: 'dark' },
    forest: { color: 'forest', mode: 'light' },
    berry: { color: 'berry', mode: 'light' },
  };

  try {
    const raw = localStorage.getItem('bg-ui-settings-v1');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const preset = parsed && typeof parsed.themePreset === 'string' ? parsed.themePreset : '';
    const resolved = byPreset[preset] || fallback;
    document.documentElement.setAttribute('data-theme', resolved.color);
    document.documentElement.setAttribute('data-mode', resolved.mode);
  } catch {
    // no-op
  }
})();
`;

const THEME_COLOR_SYNC_SCRIPT = `
(() => {
  const sync = () => requestAnimationFrame(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
  });
  sync();
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-mode'],
  });
})();
`;

export const metadata: Metadata = {
  title: 'BibleGuessr',
  description: 'A GeoGuessr-style Bible verse guessing game',
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${base}/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${base}/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
      { url: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [`${base}/favicon-32x32.png`],
    apple: [{ url: `${base}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
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
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
  themeColor: '#edf2f7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="ocean" data-mode="light">
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
        <Script id="theme-color-sync" strategy="beforeInteractive">
          {THEME_COLOR_SYNC_SCRIPT}
        </Script>
      </head>
      <body className={`${bodyFont.variable} font-[var(--font-body)] antialiased`}>
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
