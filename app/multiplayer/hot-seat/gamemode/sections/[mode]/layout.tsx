import { sectionModeIds } from '@/lib/gameModes';

export function generateStaticParams() {
  return sectionModeIds.map(mode => ({ mode }));
}

export default function HotSeatSectionModeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
