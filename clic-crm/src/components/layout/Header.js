import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: Page Title (será dinámico según la ruta) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-700 font-semibold text-sm">
                {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">{user?.country_code || 'N/A'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Overlay para cerrar el menú */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              ></div>

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user?.roles?.map((role) => (
                      <span
                        key={role.id}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        {role.display_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Menu Items */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: Navegar a perfil
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <User className="w-4 h-4" />
                  Mi Perfil
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
