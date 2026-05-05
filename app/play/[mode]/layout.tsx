import { gameModes } from '@/lib/gameModes';

export function generateStaticParams() {
  return Object.keys(gameModes).map(mode => ({ mode }));
}

export default function ModeLayout({ children }: { children: React.ReactNode }) {
  return children;
}