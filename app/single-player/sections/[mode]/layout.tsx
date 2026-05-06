import { sectionModeIds } from '@/lib/gameModes';

export function generateStaticParams() {
  return sectionModeIds.map(mode => ({ mode }));
}

export default function SectionModeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
