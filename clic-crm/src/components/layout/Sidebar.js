import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Home,
  Users,
  Handshake,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';

const MODULES = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    requiredRoles: [], // Todos pueden acceder
  },
  {
    name: 'properties',
    label: 'Propiedades',
    icon: Home,
    path: '/properties',
    requiredRoles: [],
  },
  {
    name: 'contacts',
    label: 'Contactos',
    icon: Users,
    path: '/contacts',
    requiredRoles: [],
  },
  {
    name: 'deals',
    label: 'Ventas',
    icon: Handshake,
    path: '/deals',
    requiredRoles: [],
  },
  {
    name: 'content',
    label: 'Contenido',
    icon: FileText,
    path: '/content',
    requiredRoles: [],
  },
  {
    name: 'users',
    label: 'Usuarios',
    icon: Users,
    path: '/users',
    requiredRoles: ['admin', 'super_admin', 'manager'],
  },
  {
    name: 'config',
    label: 'Configuración',
    icon: Settings,
    path: '/config',
    requiredRoles: ['admin', 'super_admin'],
  },
];

export default function Sidebar() {
  const { user, canAccess } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-orange-600">CLIC CRM</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {MODULES.map((module) => {
            // Verificar si el usuario puede acceder a este módulo
            if (module.requiredRoles.length > 0 && !canAccess(module.name)) {
              return null;
            }

            const Icon = module.icon;

            return (
              <NavLink
                key={module.name}
                to={module.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                    <span className="flex-1">{module.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-orange-600" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-700 font-semibold text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.roles?.[0]?.display_name || 'Usuario'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
