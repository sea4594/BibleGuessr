import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/lib/gameContext';

export const metadata: Metadata = {
  title: 'BibleGuessr',
  description: 'A GeoGuessr-style Bible verse guessing game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen font-sans">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
