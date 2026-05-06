'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AppTopBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export default function AppTopBar({ title, backHref, backLabel = 'Back' }: AppTopBarProps) {
  const router = useRouter();

  return (
    <header className="topbar app-topbar">
      <div className="topbar-left-slot">
        {backHref ? (
          <button onClick={() => router.push(backHref)} className="btn-outline px-3 py-2 text-sm">
            {backLabel}
          </button>
        ) : (
          <span className="topbar-placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="topbar-title-slot">
        <div className="font-semibold">{title}</div>
      </div>

      <div className="topbar-right-slot">
        <Link href="/profile" className="btn-outline px-3 py-2 text-sm settings-icon-btn" aria-label="Profile settings">
          ⚙
        </Link>
      </div>
    </header>
  );
}