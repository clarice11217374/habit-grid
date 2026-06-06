'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', mark: 'D' },
  { href: '/seeds', label: 'Seeds & Tags', mark: 'S' },
  { href: '/gratitude', label: 'Gratitude', mark: 'G' },
];

export default function DashboardShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/" className="dashboard-brand">
          <span className="dashboard-brand-mark">LC</span>
          <span>
            <strong>Life Commit</strong>
            <small>Clarice&apos;s dashboard</small>
          </span>
        </Link>
        <nav className="dashboard-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
                <span className="dashboard-nav-mark">{item.mark}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="dashboard-sidebar-footer">
          <p>GitHub records code.</p>
          <p>Life Commit records life.</p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          <div className="dashboard-header-actions">
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
