'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Users, Gamepad2 } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/single-player', label: 'Single', Icon: Gamepad2 },
  { href: '/multiplayer', label: 'Multiplayer', Icon: Users },
  { href: '/profile', label: 'Profile', Icon: User },
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
      {navItems.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'main-nav-item active' : 'main-nav-item'}
          >
            <Icon size={18} className="mx-auto mb-0.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}