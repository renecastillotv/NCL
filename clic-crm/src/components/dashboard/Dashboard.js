import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Users,
  Home,
  Handshake,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const quickStats = [
    {
      label: 'Propiedades',
      value: '0',
      icon: Home,
      color: 'orange',
      description: 'Próximamente',
    },
    {
      label: 'Contactos',
      value: '0',
      icon: Users,
      color: 'blue',
      description: 'Próximamente',
    },
    {
      label: 'Ventas',
      value: '0',
      icon: Handshake,
      color: 'green',
      description: 'Próximamente',
    },
    {
      label: 'Contenido',
      value: '0',
      icon: FileText,
      color: 'purple',
      description: 'Próximamente',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenido, {user?.name || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-orange-100">
              Estás conectado al CRM v2.0 con permisos manejados por edge functions
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-orange-600" />
          Perfil del Usuario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Correo Electrónico</p>
              <p className="text-base font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          {/* Country */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">País</p>
              <p className="text-base font-medium text-gray-900">
                {user?.country_code || 'No asignado'}
              </p>
            </div>
          </div>

          {/* Roles */}
          <div className="flex items-start gap-3 md:col-span-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2">Roles y Permisos</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <span
                      key={role.id}
                      className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
                    >
                      {role.display_name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Sin roles asignados</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Scope de datos: <span className="font-semibold">{user?.scope || 'own'}</span>
              </p>
            </div>
          </div>

          {/* Team */}
          {user?.team_id && (
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Equipo</p>
                <p className="text-base font-medium text-gray-900">{user.team_id}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = getColorClasses(stat.color);

            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          CRM v2.0 - Arquitectura Edge Functions
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Nota importante:</strong> Este es el nuevo CRM v2.0 que utiliza edge functions
            para todo el manejo de permisos y datos.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Todos los permisos se verifican en el backend (edge functions)</li>
            <li>El frontend solo pide datos y confía en la respuesta</li>
            <li>Filtrado automático por rol: {user?.scope || 'own'}</li>
            <li>
              Regla de propiedades: Todos pueden ver propiedades de su país, pero solo pueden
              editar/eliminar las suyas (o las de su equipo si son manager)
            </li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Módulos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Propiedades</p>
              <p className="text-xs text-gray-500">Sprint 2</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Contactos</p>
              <p className="text-xs text-gray-500">Sprint 3</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Handshake className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Ventas</p>
              <p className="text-xs text-gray-500">Sprint 4</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Contenido</p>
              <p className="text-xs text-gray-500">Sprint 5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
