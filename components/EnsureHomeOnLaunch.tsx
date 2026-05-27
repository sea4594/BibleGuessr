'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SESSION_KEY = 'bg-launch-seen-v1';

function isStandaloneLaunch() {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const mediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || mediaStandalone;
}

export default function EnsureHomeOnLaunch() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isStandaloneLaunch()) return;

    let hasSeenLaunch = false;
    try {
      hasSeenLaunch = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return;
    }

    if (hasSeenLaunch) return;

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      return;
    }

    if (pathname !== '/') {
      router.replace('/');
    }
  }, [pathname, router]);

  return null;
}
