import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/api';

/**
 * Hook personalizado para manejar la carga de datos de propiedades
 * Incluye paginación, filtros server-side y manejo de errores
 */
const usePropertyData = (filters, currentPage, itemsPerPage, categoriesData, citiesData, sectorsData, user) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [agents, setAgents] = useState([]);

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🏠 Obteniendo propiedades con paginación y filtros server-side...');

            // Calcular offset para paginación
            const offset = (currentPage - 1) * itemsPerPage;

            // ===== CONSTRUIR QUERY CON FILTROS SERVER-SIDE =====

            // Query base para COUNT
            let countQuery = supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('availability', 1);

            // Query base para DATA
            let dataQuery = supabase
                .from('properties')
                .select(`
                    *,
                    property_categories!inner(id, name),
                    countries(id, name),
                    provinces(id, name),
                    cities(id, name),
                    sectors(id, name),
                    property_images(
                        id,
                        url,
                        title,
                        description,
                        is_main,
                        sort_order
                    )
                `)
                .eq('availability', 1);

            // FILTRO: Búsqueda por texto
            if (filters.searchTerm && filters.searchTerm.trim()) {
                const term = filters.searchTerm.trim();
                countQuery = countQuery.ilike('name', `%${term}%`);
                dataQuery = dataQuery.ilike('name', `%${term}%`);
            }

            // FILTRO: Categoría
            if (filters.filterCategory) {
                const category = categoriesData.find(cat => cat.name === filters.filterCategory);
                if (category) {
                    countQuery = countQuery.eq('category_id', category.id);
                    dataQuery = dataQuery.eq('category_id', category.id);
                } else {
                    setProperties([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }
            }

            // FILTRO: Status
            if (filters.filterStatus) {
                countQuery = countQuery.eq('property_status', filters.filterStatus);
                dataQuery = dataQuery.eq('property_status', filters.filterStatus);
            }

            // FILTRO: Precio y Moneda
            if (filters.priceRange.min || filters.priceRange.max || filters.filterCurrency) {
                const minPrice = parseFloat(filters.priceRange.min) || 0;
                const maxPrice = parseFloat(filters.priceRange.max);

                if (filters.filterOperation === 'venta') {
                    if (minPrice > 0) {
                        countQuery = countQuery.gte('sale_price', minPrice);
                        dataQuery = dataQuery.gte('sale_price', minPrice);
                    }
                    if (maxPrice) {
                        countQuery = countQuery.lte('sale_price', maxPrice);
                        dataQuery = dataQuery.lte('sale_price', maxPrice);
                    }
                    if (filters.filterCurrency) {
                        countQuery = countQuery.eq('sale_currency', filters.filterCurrency);
                        dataQuery = dataQuery.eq('sale_currency', filters.filterCurrency);
                    }
                } else if (filters.filterOperation === 'alquiler') {
                    if (minPrice > 0) {
                        countQuery = countQuery.gte('rental_price', minPrice);
                        dataQuery = dataQuery.gte('rental_price', minPrice);
                    }
                    if (maxPrice) {
                        countQuery = countQuery.lte('rental_price', maxPrice);
                        dataQuery = dataQuery.lte('rental_price', maxPrice);
                    }
                    if (filters.filterCurrency) {
                        countQuery = countQuery.eq('rental_currency', filters.filterCurrency);
                        dataQuery = dataQuery.eq('rental_currency', filters.filterCurrency);
                    }
                }
            }

            // FILTRO: Ciudades
            if (filters.filterCities && filters.filterCities.length > 0) {
                const cityIds = citiesData
                    .filter(city => filters.filterCities.includes(city.name))
                    .map(city => city.id);

                if (cityIds.length > 0) {
                    countQuery = countQuery.in('city_id', cityIds);
                    dataQuery = dataQuery.in('city_id', cityIds);
                } else {
                    setProperties([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }
            }

            // FILTRO: Sectores
            if (filters.filterSectors && filters.filterSectors.length > 0) {
                const sectorIds = sectorsData
                    .filter(sector => filters.filterSectors.includes(sector.name))
                    .map(sector => sector.id);

                if (sectorIds.length > 0) {
                    countQuery = countQuery.in('sector_id', sectorIds);
                    dataQuery = dataQuery.in('sector_id', sectorIds);
                } else {
                    setProperties([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }
            }

            // FILTRO: Tipo (Proyecto vs Normal)
            if (filters.filterType) {
                if (filters.filterType === 'Proyecto') {
                    countQuery = countQuery.eq('is_project', true);
                    dataQuery = dataQuery.eq('is_project', true);
                } else if (filters.filterType === 'Normal') {
                    countQuery = countQuery.eq('is_project', false);
                    dataQuery = dataQuery.eq('is_project', false);
                }
            }

            // FILTRO: Operación (venta/alquiler)
            if (filters.filterOperation) {
                if (filters.filterOperation === 'venta') {
                    countQuery = countQuery.gt('sale_price', 0);
                    dataQuery = dataQuery.gt('sale_price', 0);
                } else if (filters.filterOperation === 'alquiler') {
                    countQuery = countQuery.gt('rental_price', 0);
                    dataQuery = dataQuery.gt('rental_price', 0);
                }
            }

            // FILTRO: Habitaciones
            if (filters.filterBedrooms) {
                const bedroomsNum = filters.filterBedrooms === '5+' ? 5 : parseInt(filters.filterBedrooms.replace('+', ''));
                countQuery = countQuery.gte('bedrooms', bedroomsNum);
                dataQuery = dataQuery.gte('bedrooms', bedroomsNum);
            }

            // FILTRO: Baños
            if (filters.filterBathrooms) {
                const bathroomsNum = filters.filterBathrooms === '5+' ? 5 : parseInt(filters.filterBathrooms.replace('+', ''));
                countQuery = countQuery.gte('bathrooms', bathroomsNum);
                dataQuery = dataQuery.gte('bathrooms', bathroomsNum);
            }

            // FILTRO: Parqueos
            if (filters.filterParking) {
                const parkingNum = filters.filterParking === '5+' ? 5 : parseInt(filters.filterParking.replace('+', ''));
                countQuery = countQuery.gte('parking_spots', parkingNum);
                dataQuery = dataQuery.gte('parking_spots', parkingNum);
            }

            // FILTRO: Condición
            if (filters.filterCondition) {
                if (filters.filterCondition === 'furnished') {
                    countQuery = countQuery.eq('is_furnished', true);
                    dataQuery = dataQuery.eq('is_furnished', true);
                } else if (filters.filterCondition === 'unfurnished') {
                    countQuery = countQuery.eq('is_furnished', false);
                    dataQuery = dataQuery.eq('is_furnished', false);
                }
            }

            // FILTRO: Área construida
            if (filters.areaRange.min || filters.areaRange.max) {
                if (filters.areaRange.min) {
                    countQuery = countQuery.gte('built_area', parseFloat(filters.areaRange.min));
                    dataQuery = dataQuery.gte('built_area', parseFloat(filters.areaRange.min));
                }
                if (filters.areaRange.max) {
                    countQuery = countQuery.lte('built_area', parseFloat(filters.areaRange.max));
                    dataQuery = dataQuery.lte('built_area', parseFloat(filters.areaRange.max));
                }
            }

            // FILTRO: Área de terreno
            if (filters.landAreaRange.min || filters.landAreaRange.max) {
                if (filters.landAreaRange.min) {
                    countQuery = countQuery.gte('land_area', parseFloat(filters.landAreaRange.min));
                    dataQuery = dataQuery.gte('land_area', parseFloat(filters.landAreaRange.min));
                }
                if (filters.landAreaRange.max) {
                    countQuery = countQuery.lte('land_area', parseFloat(filters.landAreaRange.max));
                    dataQuery = dataQuery.lte('land_area', parseFloat(filters.landAreaRange.max));
                }
            }

            // FILTRO: Mis Propiedades
            if (filters.showMyProperties && user?.id) {
                countQuery = countQuery.eq('agent_id', user.id);
                dataQuery = dataQuery.eq('agent_id', user.id);
            }

            // FILTRO: Agentes
            if (filters.filterAgents && filters.filterAgents.length > 0) {
                const { data: allUsers, error: usersError } = await supabase
                    .from('users')
                    .select('id, first_name, last_name')
                    .eq('active', true);

                if (!usersError && allUsers) {
                    const agentIds = allUsers
                        .filter(u => {
                            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                            return filters.filterAgents.includes(fullName);
                        })
                        .map(u => u.id);

                    if (agentIds.length > 0) {
                        countQuery = countQuery.in('agent_id', agentIds);
                        dataQuery = dataQuery.in('agent_id', agentIds);
                    } else {
                        setProperties([]);
                        setTotalCount(0);
                        setLoading(false);
                        return;
                    }
                }
            }

            // Ejecutar COUNT
            const { count, error: countError } = await countQuery;
            if (countError) throw countError;

            console.log('📊 Total de propiedades filtradas:', count);
            setTotalCount(count || 0);

            // Ejecutar DATA query con paginación
            const { data: propertiesData, error: propertiesError } = await dataQuery
                .order('created_at', { ascending: false })
                .range(offset, offset + itemsPerPage - 1);

            if (propertiesError) throw propertiesError;

            console.log(`📋 Propiedades obtenidas - Página ${currentPage}:`, propertiesData?.length);

            // Obtener agent_ids únicos
            const agentIds = [...new Set(
                propertiesData
                    ?.map(p => p.agent_id)
                    .filter(id => id !== null && id !== undefined)
            )];

            console.log('🆔 Agent IDs únicos encontrados:', agentIds.length);

            let agentsData = [];

            // Obtener usuarios
            if (agentIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select(`
                        id,
                        first_name,
                        last_name,
                        email,
                        profile_photo_url,
                        active
                    `)
                    .in('id', agentIds)
                    .eq('active', true);

                if (usersError) {
                    console.error('❌ Error obteniendo usuarios:', usersError);
                    throw usersError;
                }

                agentsData = usersData || [];

                // Actualizar lista de agentes para filtros
                setAgents(agentsData.map(agent =>
                    `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
                ).filter(name => name));
            }

            // Combinar propiedades con asesores
            const propertiesWithAgents = propertiesData?.map(property => ({
                ...property,
                users: agentsData.find(agent => agent.id === property.agent_id) || null
            })) || [];

            setProperties(propertiesWithAgents);

        } catch (err) {
            console.error('Error al cargar propiedades:', err);
            setError('Error al cargar las propiedades: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [
        currentPage,
        itemsPerPage,
        filters.searchTerm,
        filters.filterCategory,
        filters.filterStatus,
        filters.filterCities,
        filters.filterSectors,
        filters.filterAgents,
        filters.filterType,
        filters.filterOperation,
        filters.filterCurrency,
        filters.priceRange,
        filters.filterBedrooms,
        filters.filterBathrooms,
        filters.filterParking,
        filters.filterCondition,
        filters.areaRange,
        filters.landAreaRange,
        filters.showMyProperties,
        user,
        categoriesData,
        citiesData,
        sectorsData
    ]);

    // Ejecutar fetch cuando cambia currentPage
    useEffect(() => {
        fetchProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    return {
        properties,
        loading,
        error,
        totalCount,
        agents,
        refetch: fetchProperties
    };
};

export default usePropertyData;
