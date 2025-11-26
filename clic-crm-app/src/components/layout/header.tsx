'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/properties': 'Propiedades',
  '/contacts': 'Contactos',
  '/deals': 'Negocios',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
};

export function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    // Check for exact match first
    if (pageTitles[pathname]) return pageTitles[pathname];

    // Check for partial match (e.g., /properties/new)
    const basePath = '/' + pathname.split('/')[1];
    return pageTitles[basePath] || 'CLIC CRM';
  };

  const showNewButton = ['/properties', '/contacts', '/deals'].some(
    (path) => pathname.startsWith(path) && !pathname.includes('/new')
  );

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-10"
          />
        </div>

        {/* New Button */}
        {showNewButton && (
          <Button size="sm">
            <Plus size={16} className="mr-1" />
            Nuevo
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  );
}
