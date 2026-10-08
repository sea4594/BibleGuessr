'use client';

import { useEffect } from 'react';

const isGitHubPages = process.env.NEXT_PUBLIC_IS_GITHUB_PAGES === 'true';
const basePath = isGitHubPages ? '/BibleGuessr' : '';

export default function OfflineSupport() {
  useEffect(() => {
    if (!isGitHubPages || !('serviceWorker' in navigator)) return;

    void navigator.serviceWorker
      .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
      .then(registration => registration.update())
      .catch(() => undefined);

    if (navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => false);
    }
  }, []);

  return null;
}
