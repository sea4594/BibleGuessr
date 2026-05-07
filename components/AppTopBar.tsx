'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Settings } from 'lucide-react';
import { useSettingsModal } from './SettingsModalProvider';

interface AppTopBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export default function AppTopBar({ title, backHref, backLabel = 'Back' }: AppTopBarProps) {
  const router = useRouter();
  const { openSettings } = useSettingsModal();

  return (
    <header className="topbar app-topbar">
      <div className="topbar-left-slot">
        {backHref ? (
          <button onClick={() => router.push(backHref)} className="btn-outline px-2 py-2 text-sm inline-flex items-center gap-1">
            <ChevronLeft size={15} />{backLabel}
          </button>
        ) : (
          <span className="topbar-placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="topbar-title-slot">
        <div className="font-semibold">{title}</div>
      </div>

      <div className="topbar-right-slot">
        <button onClick={openSettings} className="btn-outline p-2 settings-icon-btn inline-flex items-center justify-center" aria-label="Open settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}