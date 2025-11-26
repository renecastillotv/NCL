import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { Home, Search, Plus, Filter, Loader2, AlertCircle } from 'lucide-react';

export default function PropertiesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertiesList, setPropertiesList] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadProperties();
  }, [page]);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);

    console.log('🏠 Cargando propiedades DIRECTAMENTE de la tabla...');

    try {
      // Leer directamente de la tabla properties
      const { data, error: dbError, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (dbError) {
        console.error('❌ Error de base de datos:', dbError);
        setError(dbError.message || 'Error al cargar propiedades');
        setLoading(false);
        return;
      }

      console.log('✅ Propiedades cargadas:', data?.length || 0);
      console.log('📊 Total en DB:', count);

      setPropertiesList(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / 20));
      setLoading(false);
    } catch (err) {
      console.error('❌ Excepción:', err);
      setError(err.message || 'Error desconocido');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">Error al cargar propiedades</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadProperties}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-7 h-7 text-orange-600" />
            Propiedades
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {propertiesList.length} de {totalCount} propiedades
            {user?.scope && (
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                Scope: {user.scope}
              </span>
            )}
          </p>
        </div>

        <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition">
          <Plus className="w-5 h-5" />
          Nueva Propiedad
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar propiedades..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition">
            <Filter className="w-5 h-5 text-gray-600" />
            Filtros
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      {propertiesList.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay propiedades</h3>
          <p className="text-gray-600 mb-4">
            No se encontraron propiedades para tu scope: <strong>{user?.scope}</strong>
          </p>
          <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
            Crear primera propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertiesList.map((property) => (
            <PropertyCard key={property.id} property={property} user={user} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de propiedad
function PropertyCard({ property, user }) {
  const canEdit = user?.scope === 'all' ||
                  user?.scope === 'country' ||
                  user?.scope === 'team' ||
                  property.created_by === user?.auth_user_id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {property.main_image_url ? (
          <img
            src={property.main_image_url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {property.status && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
            {property.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {property.title || 'Sin título'}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {property.address || 'Sin dirección'}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-orange-600">
            ${property.price?.toLocaleString() || 'N/A'}
          </span>
          {canEdit ? (
            <span className="text-xs text-green-600 font-medium">Puedes editar</span>
          ) : (
            <span className="text-xs text-gray-400">Solo lectura</span>
          )}
        </div>
      </div>
    </div>
  );
}
