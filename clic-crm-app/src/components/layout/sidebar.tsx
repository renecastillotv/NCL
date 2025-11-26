'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrganization, useUser, OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import {
  Home,
  Building2,
  Users,
  Briefcase,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Propiedades', href: '/properties', icon: Building2 },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Negocios', href: '/deals', icon: Briefcase },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Org */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {organization?.name?.[0] || 'C'}
              </span>
            </div>
            <span className="font-semibold text-sidebar-foreground truncate">
              {organization?.name || 'CLIC CRM'}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Organization Switcher */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: 'w-full',
                organizationSwitcherTrigger:
                  'w-full justify-start px-3 py-2 rounded-lg hover:bg-sidebar-accent',
              },
            }}
          />
        ) : (
          <div className="flex justify-center">
            <UserButton afterSignOutUrl="/login" />
          </div>
        )}
      </div>

      {/* User */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/login" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
