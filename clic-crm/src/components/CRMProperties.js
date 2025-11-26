import React, { useState, useEffect } from 'react';
import {
    Home, Plus, Filter, MapPin, DollarSign,
    X, Users, Search, Download, Upload
} from 'lucide-react';

import PropertyDetail from './PropertyDetail';
import { supabase } from '../services/api';
import PropertyCard from './properties/PropertyCard';
import Pagination from './properties/Pagination';
import usePropertyFilters from '../hooks/usePropertyFilters';
import usePropertyData from '../hooks/usePropertyData';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { exportProperties } from '../utils/exportUtils';

// Componentes de importación y exportación
const PropertyImport = ({ isOpen, onClose, onImport }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Importar Propiedades</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                            Arrastra y suelta tu archivo Excel aquí, o haz clic para seleccionar
                        </p>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            id="import-file"
                        />
                        <label
                            htmlFor="import-file"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                            Seleccionar archivo
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            Formatos soportados: Excel (.xlsx, .xls), CSV
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Implementar lógica de importación
                            onImport && onImport();
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                    >
                        Importar
                    </button>
                </div>
            </div>
        </div>
    );
};

const PropertyExport = ({ isOpen, onClose, onExport, selectedProperties = [], totalProperties = 0 }) => {
    const [exportType, setExportType] = useState('all');
    const [format, setFormat] = useState('excel');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Exportar Propiedades</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Qué propiedades exportar?
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="exportType"
                                    value="all"
                                    checked={exportType === 'all'}
                                    onChange={(e) => setExportType(e.target.value)}
                                    className="text-orange-600 focus:ring-orange-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Todas las propiedades ({totalProperties})
                                </span>
                            </label>
                            {selectedProperties.length > 0 && (
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="exportType"
                                        value="selected"
                                        checked={exportType === 'selected'}
                                        onChange={(e) => setExportType(e.target.value)}
                                        className="text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Solo seleccionadas ({selectedProperties.length})
                                    </span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Formato de exportación
                        </label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="excel">Excel (.xlsx)</option>
                            <option value="csv">CSV</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Implementar lógica de exportación
                            onExport && onExport({ type: exportType, format, selectedProperties });
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                    >
                        <Download className="w-4 h-4 mr-1 inline" />
                        Exportar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Configuración de Supabase
const currencies = ['USD', 'DOP'];
const statuses = ['Publicada', 'Borrador', 'Vendida', 'Alquilada', 'Pre-venta', 'Suspendida'];

// Función para normalizar texto (remover acentos)
const normalizeText = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// Componente InputSearch (con debounce)
const InputSearch = ({ placeholder, value, onSearch, className = '' }) => {
    const [searchValue, setSearchValue] = useState(value || '');

    // Sincronizar con el valor externo cuando cambie
    useEffect(() => {
        setSearchValue(value || '');
    }, [value]);

    // Debounce de búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchValue);
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValue]); // Removido onSearch para evitar renders infinitos

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
        </div>
    );
};

// FilterModal - wrapper del Modal para filtros
const FilterModal = ({ isOpen, onClose, title, children, onApply }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onApply && onApply();
                            onClose();
                        }}
                    >
                        Aplicar
                    </Button>
                </>
            }
        >
            <div className="p-4">
                {children}
            </div>
        </Modal>
    );
};

// Componente CheckboxGroup mejorado con búsqueda sin acentos
const CheckboxGroup = ({ options, selectedValues, onChange, searchPlaceholder }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar opciones únicas y con búsqueda mejorada
    const uniqueOptions = [...new Set(options)];
    const filteredOptions = uniqueOptions.filter(option => {
        const normalizedOption = normalizeText(option);
        const normalizedSearch = normalizeText(searchTerm);
        return normalizedOption.includes(normalizedSearch);
    });

    const handleToggle = (option) => {
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter(val => val !== option));
        } else {
            onChange([...selectedValues, option]);
        }
    };

    return (
        <div className="space-y-3">
            <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredOptions.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={() => handleToggle(option)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

// Componente CounterButtons sin "Exacto"
const CounterButtons = ({ value, onChange }) => {
    const options = ['1', '2', '3', '4', '5+'];

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(value === option ? '' : option)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${value === option
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};

// Componente para botones de condición
const ConditionButtons = ({ value, onChange }) => {
    const options = [
        { key: '', label: 'Todos' },
        { key: 'unfurnished', label: 'Sin amueblar' },
        { key: 'furnished', label: 'Amueblado' }
    ];

    return (
        <div className="grid grid-cols-3 gap-2">
            {options.map((option) => (
                <button
                    key={option.key}
                    onClick={() => onChange(value === option.key ? '' : option.key)}
                    className={`py-2 px-3 text-sm border rounded-lg transition-colors ${value === option.key
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

const CRMProperties = ({ user, permissions }) => {
    // ✅ HOOK: Manejo de filtros centralizado
    const filters = usePropertyFilters();

    // Estados de navegación
    const [viewMode, setViewMode] = useState('list');
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(36);
    const [sortBy, setSortBy] = useState('recent');

    // Estados para modales
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showAgentsModal, setShowAgentsModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Estados para datos de Supabase (maestros)
    const [categoriesData, setCategoriesData] = useState([]);
    const [citiesData, setCitiesData] = useState([]);
    const [sectorsData, setSectorsData] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(1);

    // ✅ HOOK: Carga de datos de propiedades con filtros y paginación
    const { properties, loading, error, totalCount, agents, refetch } = usePropertyData(
        filters,
        currentPage,
        itemsPerPage,
        categoriesData,
        citiesData,
        sectorsData,
        user
    )

    // Función para cargar configuraciones desde Supabase
    const loadConfigurations = async () => {
        try {
            // Cargar tasa de cambio USD/DOP
            const { data: configData, error: configError } = await supabase
                .from('configurations')
                .select('key, value, description, updated_at')
                .eq('key', 'usd_to_dop_rate')
                .eq('active', true)
                .single();

            if (configError) {
                console.warn('No se pudo cargar la tasa de cambio:', configError);
                // Valor por defecto si no existe en la DB
                setExchangeRate(60); // Tasa aproximada USD a DOP
            } else {
                const rate = parseFloat(configData.value) || 60;
                setExchangeRate(rate);
                console.log(`✅ Tasa de cambio cargada: 1 USD = ${rate} DOP (actualizada: ${configData.updated_at})`);
            }

        } catch (err) {
            console.error('Error cargando configuraciones:', err);
            setExchangeRate(60); // Fallback
        }
    };

    // Función para normalizar precios a DOP para comparación
    const normalizePrice = (price, currency) => {
        if (!price) return 0;
        if (currency === 'DOP') return price;
        if (currency === 'USD') return price * exchangeRate;
        return price; // Para otras monedas, devolver tal como está
    };

    // Función para cargar datos maestros desde Supabase
    const loadMasterData = async () => {
        try {
            // Cargar categorías
            const { data: categoriesResult, error: categoriesError } = await supabase
                .from('property_categories')
                .select('id, name')
                .eq('active', true)
                .order('name');

            if (categoriesError) throw categoriesError;
            setCategoriesData(categoriesResult || []);

            // Cargar ciudades
            const { data: citiesResult, error: citiesError } = await supabase
                .from('cities')
                .select('id, name, province_id')
                .order('name');

            if (citiesError) throw citiesError;
            setCitiesData(citiesResult || []);

            // Cargar sectores
            const { data: sectorsResult, error: sectorsError } = await supabase
                .from('sectors')
                .select('id, name, city_id')
                .order('name');

            if (sectorsError) throw sectorsError;
            setSectorsData(sectorsResult || []);

            console.log('✅ Datos maestros cargados:', {
                categories: categoriesResult?.length,
                cities: citiesResult?.length,
                sectors: sectorsResult?.length
            });

        } catch (err) {
            console.error('Error cargando datos maestros:', err);
        }
    };

    // Cargar datos maestros y configuraciones SOLO AL INICIO
    useEffect(() => {
        const loadAllData = async () => {
            await loadMasterData();
            await loadConfigurations();
            // NO llamar refetch() aquí - el hook usePropertyData se encarga de cargar al inicio
        };
        loadAllData();
    }, []);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [
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
        filters.showMyProperties
    ]);

    // Navegación a detalle de propiedad
    const handleNavigateToProperty = (propertyId) => {
        console.log('Navegando a propiedad:', propertyId);
        setSelectedPropertyId(propertyId);
        setViewMode('detail');
    };

    // Volver a la lista y refrescar datos
    const handleBackToList = (shouldRefresh = false) => {
        setViewMode('list');
        setSelectedPropertyId(null);
        // Si se editó la propiedad, refrescar la lista
        if (shouldRefresh) {
            refetch();
        }
    };

    // Filtrar y ordenar propiedades (SERVER-SIDE ya aplica mayoría de filtros)
    const filteredAndSortedProperties = (() => {
        // ⚠️ NOTA: La mayoría de filtros ahora se aplican en el servidor
        // Solo mantenemos filtros client-side que no están en servidor

        let filtered = properties;

        // Filtro de precio SOLO cuando no hay filterOperation (porque necesita OR)
        // Si hay filterOperation, el filtro ya se aplicó en el servidor
        if (!filters.filterOperation && (filters.priceRange.min || filters.priceRange.max || filters.filterCurrency)) {
            filtered = filtered.filter(property => {
                const minPrice = parseFloat(filters.priceRange.min) || 0;
                const maxPrice = parseFloat(filters.priceRange.max) || Infinity;

                const saleMatch = property.sale_price &&
                    property.sale_price >= minPrice && property.sale_price <= maxPrice &&
                    (!filters.filterCurrency || property.sale_currency === filters.filterCurrency);
                const rentalMatch = property.rental_price &&
                    property.rental_price >= minPrice && property.rental_price <= maxPrice &&
                    (!filters.filterCurrency || property.rental_currency === filters.filterCurrency);
                return saleMatch || rentalMatch;
            });
        }

        // Luego ordenar
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'price-high':
                    const priceAHigh = Math.max(
                        normalizePrice(a.sale_price, a.sale_currency),
                        normalizePrice(a.rental_price, a.rental_currency)
                    );
                    const priceBHigh = Math.max(
                        normalizePrice(b.sale_price, b.sale_currency),
                        normalizePrice(b.rental_price, b.rental_currency)
                    );
                    return priceBHigh - priceAHigh;
                case 'price-low':
                    const priceALow = Math.max(
                        normalizePrice(a.sale_price, a.sale_currency),
                        normalizePrice(a.rental_price, a.rental_currency)
                    );
                    const priceBLow = Math.max(
                        normalizePrice(b.sale_price, b.sale_currency),
                        normalizePrice(b.rental_price, b.rental_currency)
                    );
                    return priceALow - priceBLow;
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'bedrooms':
                    return (b.bedrooms || 0) - (a.bedrooms || 0);
                case 'area':
                    return (b.built_area || 0) - (a.built_area || 0);
                case 'status':
                    return (a.property_status || '').localeCompare(b.property_status || '');
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });
    })();

    // Manejar selección
    const handleSelectProperty = (propertyId, checked) => {
        if (checked) {
            setSelectedProperties([...selectedProperties, propertyId]);
        } else {
            setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
        }
    };

    // Acciones
    const handlePropertyAction = (action, propertyId) => {
        if (action === 'view') {
            handleNavigateToProperty(propertyId);
        } else if (action === 'create') {
            console.log('Crear nueva propiedad');
        } else {
            console.log(`Acción ${action} para propiedad ${propertyId}`);
        }
    };

    const handleBulkAction = (action) => {
        console.log(`Acción ${action} para propiedades:`, selectedProperties);
    };

    // Manejar importación y exportación
    const handleImport = (data) => {
        console.log('Importar propiedades:', data);
        // TODO: Implementar lógica de importación
    };

    const handleExport = async (options) => {
        const { type, format, selectedProperties: selectedIds } = options;

        try {
            let propertiesToExport = [];

            if (type === 'selected' && selectedIds.length > 0) {
                // Exportar solo las propiedades seleccionadas
                propertiesToExport = properties.filter(p => selectedIds.includes(p.id));
            } else {
                // Exportar todas las propiedades (necesitamos cargar todas desde el servidor)
                const { data: propertiesData, error: propertiesError } = await supabase
                    .from('properties')
                    .select(`
                        *,
                        property_category:category_id (id, name),
                        property_city:city_id (id, name),
                        property_sector:sector_id (id, name)
                    `)
                    .order('created_at', { ascending: false });

                if (propertiesError) throw propertiesError;

                // Cargar agentes por separado
                const agentIds = [...new Set(propertiesData?.map(p => p.agent_id).filter(Boolean))];
                let agentsData = [];

                if (agentIds.length > 0) {
                    const { data: agentsResult, error: agentsError } = await supabase
                        .from('users')
                        .select('id, name')
                        .in('id', agentIds);

                    if (!agentsError) {
                        agentsData = agentsResult || [];
                    }
                }

                // Combinar propiedades con agentes
                propertiesToExport = propertiesData?.map(property => ({
                    ...property,
                    agent: agentsData.find(agent => agent.id === property.agent_id) || null
                })) || [];
            }

            if (propertiesToExport.length === 0) {
                alert('No hay propiedades para exportar');
                return;
            }

            // Ejecutar la exportación
            const result = exportProperties(propertiesToExport, format, 'propiedades_clic');

            if (result.success) {
                alert(`✅ Se exportaron ${result.count} propiedades exitosamente`);
            } else {
                alert(`❌ Error al exportar: ${result.error}`);
            }
        } catch (error) {
            console.error('Error al exportar propiedades:', error);
            alert(`❌ Error al exportar: ${error.message}`);
        }
    };

    const clearFilters = () => {
        filters.setSearchTerm('');
        filters.setFilterCategory('');
        filters.setFilterStatus('');
        filters.setFilterCities([]);
        filters.setFilterSectors([]);
        filters.setFilterAgents([]);
        filters.setFilterType('');
        filters.setFilterOperation('');
        filters.setFilterCurrency('');
        filters.setPriceRange({ min: '', max: '' });
        filters.setFilterBedrooms('');
        filters.setFilterBathrooms('');
        filters.setFilterParking('');
        filters.setFilterCondition('');
        filters.setAreaRange({ min: '', max: '' });
        filters.setLandAreaRange({ min: '', max: '' });
        filters.setShowMyProperties(false);
    };

    // Paginación SERVER-SIDE
    // Ya no necesitamos slice() porque el servidor ya nos envía solo la página actual
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const currentProperties = filteredAndSortedProperties; // Ya vienen filtrados del servidor

    // Si estamos en modo detalle, mostrar PropertyDetail
    if (viewMode === 'detail' && selectedPropertyId) {
        return (
            <PropertyDetail
                propertyId={selectedPropertyId}
                onBack={handleBackToList}
                onPropertyUpdate={(updatedProperty) => {
                    console.log('Propiedad actualizada:', updatedProperty.id);
                    // La lista se refrescará cuando volvamos con handleBackToList(true)
                }}
            />
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando propiedades...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">⚠️</div>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button variant="primary" onClick={refetch}>
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header con contador y botones de acción */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Propiedades</h2>
                    <p className="text-sm text-gray-600">
                        {totalCount} {totalCount === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Importar
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
                    >
                        <Upload className="w-4 h-4 mr-1" />
                        Exportar
                    </button>
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => handlePropertyAction('create')}
                    >
                        Nueva Propiedad
                    </Button>
                </div>
            </div>

            {/* Barra de filtros completa en una sola línea - sin duplicar contador */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Lado izquierdo: Búsqueda y filtros */}
                    <div className="flex items-center space-x-3 flex-1">
                        {/* Búsqueda compacta */}
                        <div className="w-72">
                            <InputSearch
                                placeholder="Buscar por código / nombre"
                                value={filters.searchTerm}
                                onSearch={filters.setSearchTerm}
                                className=""
                            />
                        </div>

                        {/* Filtros principales */}
                        <button
                            onClick={() => {
                                filters.setTempFilterCities(filters.filterCities);
                                filters.setTempFilterSectors(filters.filterSectors);
                                setShowLocationModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${filters.filterCities.length || filters.filterSectors.length
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <MapPin className="w-4 h-4 mr-1" />
                            Ubicación
                            {(filters.filterCities.length + filters.filterSectors.length > 0) && (
                                <span className="ml-1 text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">
                                    {filters.filterCities.length + filters.filterSectors.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                filters.setTempFilterOperation(filters.filterOperation);
                                filters.setTempPriceRange(filters.priceRange);
                                filters.setTempFilterCurrency(filters.filterCurrency);
                                setShowPriceModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${filters.filterOperation || filters.priceRange.min || filters.priceRange.max || filters.filterCurrency
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Precio
                        </button>

                        <button
                            onClick={() => {
                                filters.setTempFilterAgents(filters.filterAgents);
                                filters.setTempShowMyProperties(filters.showMyProperties);
                                setShowAgentsModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${filters.filterAgents.length
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Users className="w-4 h-4 mr-1" />
                            Agentes
                            {filters.filterAgents.length > 0 && (
                                <span className="ml-1 text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">
                                    {filters.filterAgents.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                filters.setTempFilterCategory(filters.filterCategory);
                                filters.setTempFilterStatus(filters.filterStatus);
                                filters.setTempFilterType(filters.filterType);
                                filters.setTempFilterCondition(filters.filterCondition);
                                setShowTypeModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${filters.filterCategory || filters.filterStatus || filters.filterType || filters.filterCondition
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Filter className="w-4 h-4 mr-1" />
                            Tipo y Estado
                        </button>

                        <button
                            onClick={() => {
                                filters.setTempFilterBedrooms(filters.filterBedrooms);
                                filters.setTempFilterBathrooms(filters.filterBathrooms);
                                filters.setTempFilterParking(filters.filterParking);
                                filters.setTempAreaRange(filters.areaRange);
                                filters.setTempLandAreaRange(filters.landAreaRange);
                                setShowAdvancedModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${filters.filterBedrooms || filters.filterBathrooms || filters.filterParking || filters.areaRange.min || filters.areaRange.max
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Más Filtros
                        </button>

                        {/* Botón limpiar */}
                        {(filters.searchTerm || filters.filterCategory || filters.filterStatus || filters.filterCities.length || filters.filterSectors.length ||
                            filters.filterAgents.length || filters.filterType || filters.filterOperation || filters.filterCurrency || filters.priceRange.min ||
                            filters.priceRange.max || filters.filterBedrooms || filters.filterBathrooms || filters.filterParking || filters.filterCondition ||
                            filters.areaRange.min || filters.areaRange.max || filters.landAreaRange.min || filters.landAreaRange.max || filters.showMyProperties) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-orange-600 hover:text-orange-700 text-sm font-medium px-2 py-1 hover:bg-orange-50 rounded"
                                >
                                    Limpiar
                                </button>
                            )}
                    </div>

                    {/* Lado derecho: Solo ordenamiento */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {/* Ordenamiento funcional */}
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Ordenar por</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="recent">Más recientes</option>
                                <option value="price-high">Precio más alto</option>
                                <option value="price-low">Precio más bajo</option>
                                <option value="name">Nombre A-Z</option>
                                <option value="bedrooms">Más habitaciones</option>
                                <option value="area">Mayor área</option>
                                <option value="status">Por estado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Selecciones múltiples */}
                {selectedProperties.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                {selectedProperties.length} propiedades seleccionadas
                            </span>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                                    Exportar selección
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales de filtros */}
            <FilterModal
                isOpen={showLocationModal}
                onClose={() => {
                    setShowLocationModal(false);
                    // Restaurar valores al cerrar sin aplicar
                    filters.setTempFilterCities(filters.filterCities);
                    filters.setTempFilterSectors(filters.filterSectors);
                }}
                title="Ubicación"
                onApply={() => {
                    // Aplicar filtros temporales
                    filters.setFilterCities(filters.tempFilterCities);
                    filters.setFilterSectors(filters.tempFilterSectors);
                    setShowLocationModal(false);
                }}
            >
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Ciudades:</h4>
                        <CheckboxGroup
                            options={citiesData.map(city => city.name)}
                            selectedValues={filters.tempFilterCities}
                            onChange={filters.setTempFilterCities}
                            searchPlaceholder="Busca una o más ciudades"
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Sectores:</h4>
                        <CheckboxGroup
                            options={sectorsData.map(sector => sector.name)}
                            selectedValues={filters.tempFilterSectors}
                            onChange={filters.setTempFilterSectors}
                            searchPlaceholder="Busca uno o más sectores"
                        />
                    </div>
                </div>
            </FilterModal>

            <FilterModal
                isOpen={showPriceModal}
                onClose={() => {
                    setShowPriceModal(false);
                    // Restaurar valores al cerrar sin aplicar
                    filters.setTempFilterOperation(filters.filterOperation);
                    filters.setTempPriceRange(filters.priceRange);
                    filters.setTempFilterCurrency(filters.filterCurrency);
                }}
                title="Precio"
                onApply={() => {
                    // Aplicar filtros temporales
                    filters.setFilterOperation(filters.tempFilterOperation);
                    filters.setPriceRange(filters.tempPriceRange);
                    filters.setFilterCurrency(filters.tempFilterCurrency);
                    setShowPriceModal(false);
                }}
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                            Operación <span className="text-orange-600">*</span>
                        </label>
                        <select
                            value={filters.tempFilterOperation}
                            onChange={(e) => filters.setTempFilterOperation(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Seleccionar</option>
                            <option value="venta">Venta</option>
                            <option value="alquiler">Alquiler</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Precio desde</label>
                            <input
                                type="number"
                                placeholder="Desde"
                                value={filters.tempPriceRange.min}
                                onChange={(e) => filters.setTempPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                            <input
                                type="number"
                                placeholder="Hasta"
                                value={filters.tempPriceRange.max}
                                onChange={(e) => filters.setTempPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                        <select
                            value={filters.tempFilterCurrency}
                            onChange={(e) => filters.setTempFilterCurrency(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Seleccionar</option>
                            {currencies.map(currency => (
                                <option key={currency} value={currency}>
                                    {currency === 'USD' ? 'USD ($)' : currency === 'DOP' ? 'DOP (RD$)' : currency}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </FilterModal>

            <FilterModal
                isOpen={showAgentsModal}
                onClose={() => {
                    setShowAgentsModal(false);
                    // Restaurar valores al cerrar sin aplicar
                    filters.setTempFilterAgents(filters.filterAgents);
                    filters.setTempShowMyProperties(filters.showMyProperties);
                }}
                title="Agentes"
                onApply={() => {
                    // Aplicar filtros temporales
                    filters.setFilterAgents(filters.tempFilterAgents);
                    filters.setShowMyProperties(filters.tempShowMyProperties);
                    setShowAgentsModal(false);
                }}
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.tempShowMyProperties}
                                onChange={(e) => filters.setTempShowMyProperties(e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div>
                                <h4 className="text-sm font-medium text-orange-900">Mis Propiedades</h4>
                                <p className="text-xs text-orange-700">Mostrar solo mis propiedades asignadas</p>
                            </div>
                        </label>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Agentes:</h4>
                        <CheckboxGroup
                            options={agents}
                            selectedValues={filters.tempFilterAgents}
                            onChange={filters.setTempFilterAgents}
                            searchPlaceholder="Seleccionar agente"
                        />
                    </div>
                </div>
            </FilterModal>

            <FilterModal
                isOpen={showTypeModal}
                onClose={() => {
                    setShowTypeModal(false);
                    // Restaurar valores al cerrar sin aplicar
                    filters.setTempFilterCategory(filters.filterCategory);
                    filters.setTempFilterStatus(filters.filterStatus);
                    filters.setTempFilterType(filters.filterType);
                    filters.setTempFilterCondition(filters.filterCondition);
                }}
                title="Tipo y Estado"
                onApply={() => {
                    // Aplicar filtros temporales
                    filters.setFilterCategory(filters.tempFilterCategory);
                    filters.setFilterStatus(filters.tempFilterStatus);
                    filters.setFilterType(filters.tempFilterType);
                    filters.setFilterCondition(filters.tempFilterCondition);
                    setShowTypeModal(false);
                }}
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Categoría:</label>
                        <select
                            value={filters.tempFilterCategory}
                            onChange={(e) => filters.setTempFilterCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Seleccionar</option>
                            {categoriesData.map(category => (
                                <option key={category.id} value={category.name}>{category.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Estatus:</label>
                        <select
                            value={filters.tempFilterStatus}
                            onChange={(e) => filters.setTempFilterStatus(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Seleccionar</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Tipo:</label>
                        <select
                            value={filters.tempFilterType}
                            onChange={(e) => filters.setTempFilterType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Cualquiera</option>
                            <option value="Normal">Propiedades Normales</option>
                            <option value="Proyecto">Proyectos</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Condición:</label>
                        <ConditionButtons
                            value={filters.tempFilterCondition}
                            onChange={filters.setTempFilterCondition}
                        />
                    </div>
                </div>
            </FilterModal>

            <FilterModal
                isOpen={showAdvancedModal}
                onClose={() => {
                    setShowAdvancedModal(false);
                    // Restaurar valores al cerrar sin aplicar
                    filters.setTempFilterBedrooms(filters.filterBedrooms);
                    filters.setTempFilterBathrooms(filters.filterBathrooms);
                    filters.setTempFilterParking(filters.filterParking);
                    filters.setTempAreaRange(filters.areaRange);
                    filters.setTempLandAreaRange(filters.landAreaRange);
                }}
                title="Más Filtros"
                onApply={() => {
                    // Aplicar filtros temporales
                    filters.setFilterBedrooms(filters.tempFilterBedrooms);
                    filters.setFilterBathrooms(filters.tempFilterBathrooms);
                    filters.setFilterParking(filters.tempFilterParking);
                    filters.setAreaRange(filters.tempAreaRange);
                    filters.setLandAreaRange(filters.tempLandAreaRange);
                    setShowAdvancedModal(false);
                }}
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Habitaciones:</label>
                        <CounterButtons
                            value={filters.tempFilterBedrooms}
                            onChange={filters.setTempFilterBedrooms}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Baños:</label>
                        <CounterButtons
                            value={filters.tempFilterBathrooms}
                            onChange={filters.setTempFilterBathrooms}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Estacionamientos:</label>
                        <CounterButtons
                            value={filters.tempFilterParking}
                            onChange={filters.setTempFilterParking}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Nivel del Inmueble:</label>
                        <input
                            type="text"
                            placeholder="Piso/Nivel en el que se encuentra"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Área Construida (m²):</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="number"
                                    placeholder="Desde"
                                    value={filters.tempAreaRange.min}
                                    onChange={(e) => filters.setTempAreaRange(prev => ({ ...prev, min: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <span className="text-xs text-gray-500 mt-1 block">m²</span>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Hasta"
                                    value={filters.tempAreaRange.max}
                                    onChange={(e) => filters.setTempAreaRange(prev => ({ ...prev, max: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <span className="text-xs text-gray-500 mt-1 block">m²</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Código Interno:</label>
                        <input
                            type="text"
                            placeholder="Buscar por código interno"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Fecha de Entrega:</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Disponibilidad:</label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                            <option value="">Todas</option>
                            <option value="1">Disponibles</option>
                            <option value="0">No disponibles</option>
                        </select>
                    </div>
                </div>
            </FilterModal>

            {/* Grid de propiedades */}
            <div className="flex-1 overflow-y-auto">
                {currentProperties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                            {currentProperties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    isSelected={selectedProperties.includes(property.id)}
                                    onSelect={handleSelectProperty}
                                    onViewDetails={() => handlePropertyAction('view', property.id)}
                                />
                            ))}
                        </div>

                        {/* Paginación */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </>
                ) : (
                    /* Mensaje cuando no hay resultados */
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron propiedades</h3>
                        <p className="text-gray-500 mb-4">
                            {filters.searchTerm || filters.filterCategory || filters.filterStatus || filters.filterCities.length || filters.filterSectors.length ||
                                filters.filterAgents.length || filters.filterType || filters.filterOperation || filters.filterCurrency || filters.priceRange.min ||
                                filters.priceRange.max || filters.filterBedrooms || filters.filterBathrooms || filters.filterParking || filters.filterCondition ||
                                filters.areaRange.min || filters.areaRange.max ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza agregando tu primera propiedad.'
                            }
                        </p>
                        {(filters.searchTerm || filters.filterCategory || filters.filterStatus || filters.filterCities.length || filters.filterSectors.length ||
                            filters.filterAgents.length || filters.filterType || filters.filterOperation || filters.filterCurrency || filters.priceRange.min ||
                            filters.priceRange.max || filters.filterBedrooms || filters.filterBathrooms || filters.filterParking || filters.filterCondition ||
                            filters.areaRange.min || filters.areaRange.max) ? (
                            <Button variant="outline" onClick={clearFilters}>
                                Limpiar Filtros
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={() => handlePropertyAction('create')}
                            >
                                Crear Primera Propiedad
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Información de resultados más discreta */}
            {filteredAndSortedProperties.length > 0 && totalPages > 1 && (
                <div className="mt-4 text-center text-xs text-gray-500">
                    Página {currentPage} de {totalPages}
                </div>
            )}

            {/* Modales de Importación y Exportación */}
            <PropertyImport
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
            />

            <PropertyExport
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                selectedProperties={selectedProperties}
                totalProperties={filteredAndSortedProperties.length}
            />
        </div>
    );
};

export default CRMProperties;