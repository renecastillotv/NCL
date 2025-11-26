import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/api';

/**
 * Hook useDataFetch - Simplifica el patrón de data fetching
 *
 * Reemplaza el patrón repetido en 25+ componentes de:
 * - useState para data, loading, error
 * - useEffect para fetch inicial
 * - try/catch con setLoading
 * - Manejo de errores
 *
 * @param {string} table - Nombre de la tabla Supabase
 * @param {object} options - Opciones de configuración
 * @param {object} options.filters - Filtros a aplicar { column: value }
 * @param {string} options.select - Campos a seleccionar (default: '*')
 * @param {object|array} options.orderBy - Ordenamiento { column, ascending } o array de ordenamientos
 * @param {number} options.limit - Límite de resultados
 * @param {boolean} options.enabled - Si el fetch está habilitado (default: true)
 * @param {any} options.initialData - Datos iniciales (default: [])
 * @param {function} options.transform - Función para transformar datos
 * @param {array} options.dependencies - Dependencias adicionales para refetch
 *
 * @returns {object} { data, loading, error, refetch, setData }
 *
 * @example
 * // Caso simple - cargar tags activos
 * const { data: tags, loading, error } = useDataFetch('tags', {
 *   filters: { active: true },
 *   orderBy: { column: 'name', ascending: true }
 * });
 *
 * @example
 * // Múltiples ordenamientos
 * const { data: tags } = useDataFetch('tags', {
 *   orderBy: [
 *     { column: 'category', ascending: true },
 *     { column: 'sort_order', ascending: true },
 *     { column: 'name', ascending: true }
 *   ]
 * });
 *
 * @example
 * // Con transformación de datos
 * const { data: properties, refetch } = useDataFetch('properties', {
 *   select: 'id, name, sale_price, cities(name)',
 *   filters: { status: 'active' },
 *   transform: (props) => props.map(p => ({
 *     ...p,
 *     cityName: p.cities?.name
 *   }))
 * });
 *
 * @example
 * // Fetch condicional (solo cuando userId existe)
 * const { data: userProperties } = useDataFetch('properties', {
 *   filters: { user_id: userId },
 *   enabled: !!userId,
 *   dependencies: [userId]
 * });
 *
 * @example
 * // Con refetch manual
 * const { data, loading, refetch } = useDataFetch('contacts');
 *
 * const handleCreate = async () => {
 *   await createContact(newData);
 *   refetch(); // Recargar datos
 * };
 */
export const useDataFetch = (table, options = {}) => {
  const {
    filters = {},
    select = '*',
    orderBy = null,
    limit = null,
    enabled = true,
    initialData = [],
    transform = null,
    dependencies = []
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !table) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construir query base
      let query = supabase.from(table).select(select);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Soporte para diferentes tipos de filtros
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Filtros avanzados: { operator: 'gte', value: 100 }
            query = query[value.operator](key, value.value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenamiento (soporta uno o múltiples)
      if (orderBy) {
        if (Array.isArray(orderBy)) {
          // Múltiples ordenamientos
          orderBy.forEach(order => {
            const ascending = order.ascending !== undefined ? order.ascending : true;
            query = query.order(order.column, { ascending });
          });
        } else {
          // Un solo ordenamiento
          const ascending = orderBy.ascending !== undefined ? orderBy.ascending : true;
          query = query.order(orderBy.column, { ascending });
        }
      }

      // Aplicar límite
      if (limit) {
        query = query.limit(limit);
      }

      // Ejecutar query
      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        console.error(`❌ Error fetching ${table}:`, fetchError);
        throw fetchError;
      }

      // Transformar datos si se proporciona función
      const finalData = transform ? transform(result || []) : (result || []);

      setData(finalData);
      console.log(`✅ Datos cargados de ${table}:`, finalData.length, 'registros');

    } catch (err) {
      console.error(`❌ Error en useDataFetch (${table}):`, err);
      setError(err);
      setData(initialData);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit, enabled, transform, ...dependencies]);

  // Fetch inicial y cuando cambien dependencias
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData, // Para actualizaciones optimistas
  };
};

/**
 * Hook useDataFetchOne - Para obtener un solo registro
 *
 * @example
 * const { data: property, loading } = useDataFetchOne('properties', propertyId, {
 *   select: 'id, name, sale_price, cities(name)'
 * });
 */
export const useDataFetchOne = (table, id, options = {}) => {
  const { select = '*', enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !table || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setData(result);
      console.log(`✅ Registro cargado de ${table}:`, result);

    } catch (err) {
      console.error(`❌ Error en useDataFetchOne (${table}):`, err);
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [table, id, select, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
};

export default useDataFetch;
