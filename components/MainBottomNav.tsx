'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/single-player', label: 'Single' },
  { href: '/multiplayer', label: 'Multi' },
  { href: '/profile', label: 'Profile' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  if (href === '/profile') {
    return pathname === '/profile' || pathname === '/settings';
  }
  return pathname === href;
}

export default function MainBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="main-bottom-nav" aria-label="Primary">
      {navItems.map(item => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? 'main-nav-item active' : 'main-nav-item'}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}