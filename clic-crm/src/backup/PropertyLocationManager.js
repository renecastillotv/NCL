import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    MapPin, AlertCircle, CheckCircle, Navigation, Save, Globe, Map,
    Link, Plus, X, HelpCircle, Target, RefreshCw, ChevronDown, Building2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const GOOGLE_MAPS_API_KEY = 'AIzaSyCpzGsbg52e2HqFXCXA6_5alq2OYwVjvSU';

// Estado principal del componente
const usePerfectLocationState = (initialProperty) => {
    const [state, setState] = useState({
        // Coordenadas del pin
        coordinates: null,

        // Jerarquía de IDs seleccionados
        hierarchy: {
            country_id: '',
            province_id: '',
            city_id: '',
            sector_id: ''
        },

        // Dirección exacta
        exact_address: '',
        show_exact_location: false,

        // Estados de control
        loading: false,
        error: '',

        // Datos de resolución
        google_data: null,
        db_hierarchy: null,
        last_action: null,

        // Confirmaciones pendientes
        pending_confirmation: null,

        // Control de sincronización
        syncing_from_map: false,
        syncing_from_dropdown: false
    });

    useEffect(() => {
        if (initialProperty) {
            setState(prev => ({
                ...prev,
                hierarchy: {
                    country_id: initialProperty.country_id || '',
                    province_id: initialProperty.province_id || '',
                    city_id: initialProperty.city_id || '',
                    sector_id: initialProperty.sector_id || ''
                },
                exact_address: initialProperty.exact_address || '',
                show_exact_location: initialProperty.show_exact_location || false,
                coordinates: parseCoordinates(initialProperty.exact_coordinates)
            }));
        }
    }, [initialProperty]);

    return [state, setState];
};

// Hook para cargar location insights
const useLocationInsights = () => {
    const [insights, setInsights] = useState({
        countries: [],
        provinces: [],
        cities: [],
        sectors: [],
        loading: false,
        last_updated: null
    });

    const loadInsights = useCallback(async () => {
        setInsights(prev => ({ ...prev, loading: true }));

        try {
            const { data, error } = await supabase
                .from('location_insights')
                .select('id, location_name, canonical_name, display_name, location_type, parent_location_id, coordinates, usage_count, status')
                .eq('status', 'active')
                .order('usage_count', { ascending: false })
                .order('canonical_name');

            if (error) throw error;

            const organized = {
                countries: data?.filter(i => i.location_type === 'country') || [],
                provinces: data?.filter(i => i.location_type === 'province') || [],
                cities: data?.filter(i => i.location_type === 'city') || [],
                sectors: data?.filter(i => i.location_type === 'sector') || [],
                loading: false,
                last_updated: new Date().toISOString()
            };

            setInsights(organized);

        } catch (error) {
            console.error('❌ Error cargando insights:', error);
            setInsights(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        loadInsights();
    }, [loadInsights]);

    return [insights, loadInsights];
};

// Servicio de comunicación con la edge function
const LocationService = {
    async resolveFromPin(lat, lng, propertyId = null) {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lng: lng.toString(),
                mode: 'resolve'
            });

            if (propertyId) {
                params.append('property_id', propertyId);
            }

            const response = await fetch(
                `${supabaseUrl}/functions/v1/geo-location-manager?${params}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${supabaseAnonKey}`,
                        'apikey': supabaseAnonKey
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error en resolución:', error);
            return { success: false, error: error.message };
        }
    },

    async confirmAction(confirmationData) {
        try {
            const response = await fetch(
                `${supabaseUrl}/functions/v1/geo-location-manager?mode=confirm`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseAnonKey}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(confirmationData)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error en confirmación:', error);
            return { success: false, error: error.message };
        }
    }
};

// Modal para confirmación de alias
const AliasConfirmationModal = ({ isOpen, onClose, confirmationData, onConfirm, loading }) => {
    const [selectedLocationId, setSelectedLocationId] = useState('');

    useEffect(() => {
        if (confirmationData?.alias_confirmations?.[0]?.nearby_locations?.length > 0) {
            setSelectedLocationId(confirmationData.alias_confirmations[0].nearby_locations[0].id);
        }
    }, [confirmationData]);

    if (!isOpen || !confirmationData || confirmationData.confirmation_type !== 'alias') return null;

    const aliasConfirmation = confirmationData.alias_confirmations[0];

    const handleCreateAlias = () => {
        if (selectedLocationId) {
            onConfirm({
                type: 'alias',
                create_alias: true,
                google_name: aliasConfirmation.google_name,
                existing_location_id: selectedLocationId,
                level: aliasConfirmation.level,
                lat: confirmationData.coordinates.lat,
                lng: confirmationData.coordinates.lng
            });
        }
    };

    const handleCreateNew = () => {
        onConfirm({
            type: 'alias',
            create_alias: false,
            google_name: aliasConfirmation.google_name,
            level: aliasConfirmation.level,
            lat: confirmationData.coordinates.lat,
            lng: confirmationData.coordinates.lng
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link className="w-6 h-6" />
                            <div>
                                <h3 className="text-lg font-semibold">Confirmación de Alias</h3>
                                <p className="text-sm text-orange-100">
                                    Google detectó: "{aliasConfirmation.google_name}" ({aliasConfirmation.level})
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-2 hover:bg-orange-600 rounded-lg disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-orange-600" />
                            Ubicación del Pin
                        </h4>
                        <div className="text-sm text-gray-600">
                            📍 {confirmationData.coordinates.lat.toFixed(6)}, {confirmationData.coordinates.lng.toFixed(6)}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                            Ubicaciones cercanas encontradas:
                        </h4>

                        <div className="space-y-2">
                            {aliasConfirmation.nearby_locations.map((location) => (
                                <label
                                    key={location.id}
                                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${selectedLocationId === location.id
                                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="radio"
                                            name="location"
                                            value={location.id}
                                            checked={selectedLocationId === location.id}
                                            onChange={(e) => setSelectedLocationId(e.target.value)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">
                                                {location.display_name || location.canonical_name || location.location_name}
                                            </div>
                                            {location.canonical_name && location.canonical_name !== location.display_name && (
                                                <div className="text-sm text-gray-600">
                                                    También conocido como: {location.canonical_name}
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {location.distance?.toFixed(2) || '?'} km
                                                </span>
                                                <span className="flex items-center">
                                                    <Target className="w-3 h-3 mr-1" />
                                                    {location.usage_count || 0} usos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <HelpCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-yellow-800 mb-1">¿Qué significa esto?</p>
                                <div className="text-yellow-700 space-y-1">
                                    <p>• <strong>Crear alias:</strong> "{aliasConfirmation.google_name}" será un nombre alternativo para la ubicación seleccionada</p>
                                    <p>• <strong>Crear nueva:</strong> Se creará una ubicación independiente con el nombre "{aliasConfirmation.google_name}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleCreateNew}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            <span>Crear Nueva</span>
                        </button>

                        <button
                            onClick={handleCreateAlias}
                            disabled={loading || !selectedLocationId}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Link className="w-4 h-4" />
                            )}
                            <span>Crear Alias</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal para niveles faltantes
const MissingLevelsModal = ({ isOpen, onClose, confirmationData, onConfirm, loading }) => {
    const [selections, setSelections] = useState({});
    const [newNames, setNewNames] = useState({});

    useEffect(() => {
        if (confirmationData?.confirmation_type === 'missing_levels') {
            setSelections({});
            setNewNames({});
        }
    }, [confirmationData]);

    if (!isOpen || !confirmationData || confirmationData.confirmation_type !== 'missing_levels') return null;

    const handleSelectionChange = (level, type, value) => {
        setSelections(prev => ({
            ...prev,
            [level]: { type, id: type === 'existing' ? value : null }
        }));
    };

    const handleNewNameChange = (level, name) => {
        setNewNames(prev => ({ ...prev, [level]: name }));
        setSelections(prev => ({
            ...prev,
            [level]: { type: 'new', name }
        }));
    };

    const handleConfirm = () => {
        onConfirm({
            type: 'missing_levels',
            selections,
            lat: confirmationData.coordinates.lat,
            lng: confirmationData.coordinates.lng
        });
    };

    const isValid = () => {
        return confirmationData.missing_levels.every(level => {
            const selection = selections[level];
            return selection && (
                (selection.type === 'existing' && selection.id) ||
                (selection.type === 'new' && selection.name?.trim())
            );
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Building2 className="w-6 h-6" />
                            <div>
                                <h3 className="text-lg font-semibold">Completar Jerarquía</h3>
                                <p className="text-sm text-blue-100">
                                    Faltan algunos niveles administrativos
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-2 hover:bg-blue-600 rounded-lg disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Nivel más alto identificado: {confirmationData.highest_resolved.level}
                        </h4>
                        <div className="text-sm text-gray-600">
                            📍 {confirmationData.highest_resolved.location.display_name || confirmationData.highest_resolved.location.location_name}
                        </div>
                    </div>

                    {confirmationData.missing_levels.map(level => {
                        const options = confirmationData.missing_level_options?.[level];

                        return (
                            <div key={level} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                                    Seleccionar {level}
                                </h4>

                                {options?.existing_options?.length > 0 && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="radio"
                                                    name={`${level}_type`}
                                                    checked={selections[level]?.type === 'existing'}
                                                    onChange={() => handleSelectionChange(level, 'existing', '')}
                                                />
                                                <span className="font-medium">Seleccionar existente</span>
                                            </label>
                                            {selections[level]?.type === 'existing' && (
                                                <select
                                                    value={selections[level]?.id || ''}
                                                    onChange={(e) => handleSelectionChange(level, 'existing', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Seleccionar {level}...</option>
                                                    {options.existing_options.map(option => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.display_name || option.canonical_name || option.location_name}
                                                            {option.usage_count > 0 && ` (${option.usage_count} usos)`}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {options.nearby_suggestions?.length > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                                <p className="text-sm font-medium text-yellow-800 mb-2">
                                                    Sugerencias cercanas:
                                                </p>
                                                <div className="text-sm text-yellow-700">
                                                    {options.nearby_suggestions.map(suggestion => (
                                                        <div key={suggestion.id} className="flex justify-between">
                                                            <span>{suggestion.display_name || suggestion.location_name}</span>
                                                            <span>{suggestion.distance?.toFixed(2)} km</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {options?.can_create_new && (
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`${level}_type`}
                                                checked={selections[level]?.type === 'new'}
                                                onChange={() => handleSelectionChange(level, 'new', '')}
                                            />
                                            <span className="font-medium">Crear nuevo {level}</span>
                                        </label>
                                        {selections[level]?.type === 'new' && (
                                            <input
                                                type="text"
                                                value={newNames[level] || ''}
                                                onChange={(e) => handleNewNameChange(level, e.target.value)}
                                                placeholder={`Nombre del nuevo ${level}...`}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={loading || !isValid()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Confirmar Jerarquía</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Select inteligente mejorado
const SmartSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    icon,
    showUsage = false,
    loading = false
}) => {
    const sortedOptions = useMemo(() => {
        if (!options) return [];

        return [...options].sort((a, b) => {
            const usageA = a.usage_count || 0;
            const usageB = b.usage_count || 0;

            if (usageA !== usageB) {
                return usageB - usageA;
            }

            const nameA = a.display_name || a.canonical_name || a.location_name || '';
            const nameB = b.display_name || b.canonical_name || b.location_name || '';

            return nameA.localeCompare(nameB);
        });
    }, [options]);

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {loading && <span className="ml-2 text-xs text-blue-600">🔄</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <select
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    disabled={disabled || loading}
                    className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-8 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors ${disabled || loading
                            ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                            : 'bg-white hover:border-gray-400'
                        }`}
                >
                    <option value="">{placeholder}</option>
                    {sortedOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.display_name || option.canonical_name || option.location_name}
                            {showUsage && option.usage_count > 0 && ` (${option.usage_count})`}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente principal
const PropertyLocationManager = ({
    property,
    onLocationUpdate,
    mode = 'edit'
}) => {
    const [locationState, setLocationState] = usePerfectLocationState(property);
    const [locationInsights, reloadInsights] = useLocationInsights();

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const marker = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    // Notificar cambios al padre
    const notifyParent = useCallback((updates) => {
        if (onLocationUpdate) {
            onLocationUpdate({
                ...property,
                ...updates
            });
        }
    }, [property, onLocationUpdate]);

    // Clic en mapa - Flujo principal
    const handleMapClick = useCallback(async (lat, lng) => {
        console.log('🎯 Clic en mapa:', { lat, lng });

        setLocationState(prev => ({
            ...prev,
            loading: true,
            error: '',
            coordinates: { lat, lng },
            syncing_from_map: true,
            last_action: 'map_click',
            pending_confirmation: null
        }));

        updateMapMarker({ lat, lng });

        try {
            const propertyId = property?.id && property.id !== 'temp' && !property.id.startsWith('temp-')
                ? property.id
                : null;

            const result = await LocationService.resolveFromPin(lat, lng, propertyId);

            if (result.success) {
                if (result.result.requires_confirmation) {
                    setLocationState(prev => ({
                        ...prev,
                        loading: false,
                        pending_confirmation: result.result,
                        syncing_from_map: false
                    }));
                } else {
                    await applyLocationResult(result.result);
                }
            } else {
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    error: result.error || 'Error procesando ubicación',
                    syncing_from_map: false
                }));
            }
        } catch (error) {
            console.error('❌ Error en clic de mapa:', error);
            setLocationState(prev => ({
                ...prev,
                loading: false,
                error: 'Error procesando ubicación',
                syncing_from_map: false
            }));
        }
    }, [property]);

    // Cambio en dropdown
    const handleDropdownChange = useCallback(async (field, value) => {
        console.log('🔄 Cambio en dropdown:', field, value);

        if (locationState.syncing_from_map) {
            return;
        }

        setLocationState(prev => ({ ...prev, syncing_from_dropdown: true }));

        let newHierarchy = { ...locationState.hierarchy };

        if (field === 'country_id') {
            newHierarchy = { ...newHierarchy, country_id: value, province_id: '', city_id: '', sector_id: '' };
        } else if (field === 'province_id') {
            newHierarchy = { ...newHierarchy, province_id: value, city_id: '', sector_id: '' };
        } else if (field === 'city_id') {
            newHierarchy = { ...newHierarchy, city_id: value, sector_id: '' };
        } else {
            newHierarchy[field] = value;
        }

        setLocationState(prev => ({
            ...prev,
            hierarchy: newHierarchy,
            last_action: 'dropdown_change'
        }));

        notifyParent(newHierarchy);

        if (value) {
            await moveMapToLocation(field, value, newHierarchy);
        }

        setLocationState(prev => ({ ...prev, syncing_from_dropdown: false }));
    }, [locationState.hierarchy, locationState.syncing_from_map, notifyParent]);

    // Aplicar resultado de resolución
    const applyLocationResult = useCallback(async (result) => {
        console.log('🎯 Aplicando resultado:', result);

        if (result.hierarchy?.location_ids) {
            const newHierarchy = {
                country_id: result.hierarchy.location_ids.country || '',
                province_id: result.hierarchy.location_ids.province || '',
                city_id: result.hierarchy.location_ids.city || '',
                sector_id: result.hierarchy.location_ids.sector || ''
            };

            setLocationState(prev => ({
                ...prev,
                loading: false,
                hierarchy: newHierarchy,
                exact_address: prev.exact_address,
                db_hierarchy: result.hierarchy,
                syncing_from_map: false,
                last_action: result.action,
                pending_confirmation: null
            }));

            notifyParent({
                ...newHierarchy,
                exact_coordinates: locationState.coordinates
            });

            await reloadInsights();
            showSuccessToast(result);
        }
    }, [locationState.coordinates, notifyParent, reloadInsights]);

    // Confirmar acción (alias o niveles faltantes)
    const handleConfirmation = useCallback(async (confirmationData) => {
        console.log('🏷️ Confirmando acción:', confirmationData);

        setLocationState(prev => ({ ...prev, loading: true }));

        try {
            const propertyId = property?.id && property.id !== 'temp' && !property.id.startsWith('temp-')
                ? property.id
                : null;

            const result = await LocationService.confirmAction({
                ...confirmationData,
                property_id: propertyId
            });

            if (result.success) {
                await applyLocationResult(result.processing_result);
            } else {
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    error: result.error || 'Error confirmando acción'
                }));
            }
        } catch (error) {
            console.error('❌ Error en confirmación:', error);
            setLocationState(prev => ({
                ...prev,
                loading: false,
                error: 'Error confirmando acción'
            }));
        }
    }, [property, applyLocationResult]);

    // Mover mapa a ubicación
    const moveMapToLocation = useCallback(async (field, locationId, hierarchy) => {
        let targetLocation = null;
        let zoomLevel = 12;

        if (field === 'sector_id') {
            targetLocation = locationInsights.sectors.find(s => s.id === locationId);
            zoomLevel = 16;
        } else if (field === 'city_id') {
            targetLocation = locationInsights.cities.find(c => c.id === locationId);
            zoomLevel = 14;
        } else if (field === 'province_id') {
            targetLocation = locationInsights.provinces.find(p => p.id === locationId);
            zoomLevel = 11;
        } else if (field === 'country_id') {
            targetLocation = locationInsights.countries.find(c => c.id === locationId);
            zoomLevel = 9;
        }

        if (targetLocation?.coordinates) {
            const coords = parseCoordinates(targetLocation.coordinates);
            if (coords) {
                if (mapInstance.current) {
                    mapInstance.current.panTo(coords);
                    mapInstance.current.setZoom(zoomLevel);
                }

                if (field === 'sector_id') {
                    setLocationState(prev => ({
                        ...prev,
                        coordinates: coords,
                        exact_address: targetLocation.display_name || targetLocation.canonical_name || targetLocation.location_name
                    }));

                    updateMapMarker(coords);

                    notifyParent({
                        exact_coordinates: coords,
                        exact_address: targetLocation.display_name || targetLocation.canonical_name || targetLocation.location_name
                    });
                } else {
                    setLocationState(prev => ({ ...prev, coordinates: null }));
                    clearMapMarker();
                }
            }
        }
    }, [locationInsights, notifyParent]);

    // Inicializar mapa
    const initializeMap = useCallback(async () => {
        if (!mapRef.current || mapInstance.current) return;

        const center = locationState.coordinates || { lat: 18.4861, lng: -69.9312 };
        const zoom = locationState.coordinates ? 15 : 12;

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            gestureHandling: 'greedy'
        });

        mapInstance.current = map;

        map.addListener('click', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            handleMapClick(lat, lng);
        });

        if (locationState.coordinates) {
            updateMapMarker(locationState.coordinates);
        }

        setMapReady(true);
    }, [locationState.coordinates, handleMapClick]);

    // Actualizar marcador
    const updateMapMarker = useCallback((coords) => {
        if (!mapInstance.current || !coords) return;

        clearMapMarker();

        marker.current = new window.google.maps.Marker({
            position: coords,
            map: mapInstance.current,
            title: 'Ubicación exacta',
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#dc2626',
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: '#ffffff'
            }
        });
    }, []);

    // Limpiar marcador
    const clearMapMarker = useCallback(() => {
        if (marker.current) {
            marker.current.setMap(null);
            marker.current = null;
        }
    }, []);

    // Obtener ubicación actual
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationState(prev => ({ ...prev, error: 'Geolocalización no disponible' }));
            return;
        }

        setLocationState(prev => ({ ...prev, loading: true, error: '' }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                handleMapClick(lat, lng);
            },
            (error) => {
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'No se pudo obtener tu ubicación'
                }));
            }
        );
    }, [handleMapClick]);

    // Guardar ubicación
    const saveLocation = useCallback(async () => {
        if (!locationState.coordinates || mode !== 'edit') return;

        setLocationState(prev => ({ ...prev, loading: true, error: '' }));

        try {
            const updateData = {
                exact_coordinates: toPostgreSQLPoint(locationState.coordinates),
                exact_address: locationState.exact_address,
                show_exact_location: locationState.show_exact_location,
                ...locationState.hierarchy
            };

            const { error } = await supabase
                .from('properties')
                .update(updateData)
                .eq('id', property.id);

            if (error) throw error;

            setLocationState(prev => ({
                ...prev,
                loading: false,
                last_action: 'saved'
            }));

            notifyParent(updateData);
            showSuccessToast({ action: 'saved' });

        } catch (error) {
            setLocationState(prev => ({
                ...prev,
                loading: false,
                error: 'Error guardando: ' + error.message
            }));
        }
    }, [locationState, mode, property, notifyParent]);

    // Filtros jerárquicos
    const filteredOptions = useMemo(() => {
        return {
            provinces: locationState.hierarchy.country_id
                ? locationInsights.provinces.filter(p => p.parent_location_id === locationState.hierarchy.country_id)
                : [],
            cities: locationState.hierarchy.province_id
                ? locationInsights.cities.filter(c => c.parent_location_id === locationState.hierarchy.province_id)
                : [],
            sectors: locationState.hierarchy.city_id
                ? locationInsights.sectors.filter(s => s.parent_location_id === locationState.hierarchy.city_id)
                : []
        };
    }, [locationState.hierarchy, locationInsights]);

    // Cargar Google Maps
    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google?.maps) {
                initializeMap();
                return;
            }

            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
                const checkGoogle = setInterval(() => {
                    if (window.google?.maps) {
                        clearInterval(checkGoogle);
                        initializeMap();
                    }
                }, 100);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.onload = initializeMap;
            document.head.appendChild(script);
        };

        loadGoogleMaps();
    }, [initializeMap]);

    // Sincronizar marcador
    useEffect(() => {
        if (locationState.coordinates && !locationState.syncing_from_dropdown) {
            updateMapMarker(locationState.coordinates);
        } else if (!locationState.coordinates) {
            clearMapMarker();
        }
    }, [locationState.coordinates, locationState.syncing_from_dropdown, updateMapMarker, clearMapMarker]);

    // Mensajes de éxito
    const showSuccessToast = (result) => {
        const messages = {
            'existing_hierarchy_used': '✅ Jerarquía existente reconocida',
            'new_hierarchy_created': '🆕 Nueva jerarquía creada',
            'alias_created': '🔗 Alias creado exitosamente',
            'new_location_created': '📍 Nueva ubicación creada',
            'missing_levels_resolved': '🏗️ Jerarquía completada',
            'saved': '💾 Ubicación guardada'
        };

        const message = messages[result.action] || '✅ Operación completada';
        showToast(message, 'success');
    };

    const showToast = (message, type = 'info') => {
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white rounded-lg shadow-lg p-4 z-40 max-w-sm`;
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
                <div class="font-medium">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                🎯 Sistema Perfecto de Ubicaciones
                            </h3>
                            <p className="text-sm text-gray-600">
                                Flujo completo con alias automático y jerarquía inteligente
                            </p>
                        </div>
                    </div>
                    {locationState.last_action && (
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            ⚡ {locationState.last_action}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {locationState.loading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-blue-800 font-medium">
                                {locationState.syncing_from_map ? 'Procesando ubicación del mapa...' : 'Procesando...'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Base de Datos de Ubicaciones
                        </h4>
                        <button
                            onClick={reloadInsights}
                            disabled={locationInsights.loading}
                            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                            <RefreshCw className={`w-4 h-4 ${locationInsights.loading ? 'animate-spin' : ''}`} />
                            <span>{locationInsights.loading ? 'Cargando...' : 'Actualizar'}</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{locationInsights.countries.length}</div>
                            <div className="text-gray-600">Países</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{locationInsights.provinces.length}</div>
                            <div className="text-gray-600">Provincias</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{locationInsights.cities.length}</div>
                            <div className="text-gray-600">Ciudades</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{locationInsights.sectors.length}</div>
                            <div className="text-gray-600">Sectores</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Map className="w-4 h-4 mr-2" />
                        Jerarquía Administrativa
                        {locationState.syncing_from_map && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                🔄 Actualizando desde mapa
                            </span>
                        )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SmartSelect
                            label="País"
                            value={locationState.hierarchy.country_id}
                            onChange={(value) => handleDropdownChange('country_id', value)}
                            options={locationInsights.countries}
                            placeholder="Seleccionar país"
                            icon={<Globe className="w-4 h-4" />}
                            disabled={locationState.syncing_from_map}
                            loading={locationInsights.loading}
                            showUsage={true}
                        />

                        <SmartSelect
                            label="Provincia"
                            value={locationState.hierarchy.province_id}
                            onChange={(value) => handleDropdownChange('province_id', value)}
                            options={filteredOptions.provinces}
                            placeholder="Seleccionar provincia"
                            disabled={!locationState.hierarchy.country_id || locationState.syncing_from_map}
                            icon={<Map className="w-4 h-4" />}
                            showUsage={true}
                        />

                        <SmartSelect
                            label="Ciudad"
                            value={locationState.hierarchy.city_id}
                            onChange={(value) => handleDropdownChange('city_id', value)}
                            options={filteredOptions.cities}
                            placeholder="Seleccionar ciudad"
                            disabled={!locationState.hierarchy.province_id || locationState.syncing_from_map}
                            icon={<MapPin className="w-4 h-4" />}
                            showUsage={true}
                        />

                        <SmartSelect
                            label="Sector"
                            value={locationState.hierarchy.sector_id}
                            onChange={(value) => handleDropdownChange('sector_id', value)}
                            options={filteredOptions.sectors}
                            placeholder="Seleccionar sector"
                            disabled={!locationState.hierarchy.city_id || locationState.syncing_from_map}
                            icon={<MapPin className="w-4 h-4" />}
                            showUsage={true}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Mapa Inteligente con Alias
                    </h4>
                    <button
                        onClick={getCurrentLocation}
                        disabled={locationState.loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <Navigation className="w-4 h-4" />
                        <span>Mi Ubicación</span>
                    </button>
                </div>

                <div className="relative">
                    <div
                        ref={mapRef}
                        className="w-full h-80 border border-gray-300 rounded-lg"
                    />

                    {!mapReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Cargando Google Maps...</p>
                            </div>
                        </div>
                    )}

                    {locationState.syncing_from_dropdown && (
                        <div className="absolute top-4 left-4 bg-white rounded-lg shadow p-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Sincronizando desde dropdown...</span>
                            </div>
                        </div>
                    )}
                </div>

                {locationState.coordinates && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Coordenadas Exactas
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-orange-800">Latitud:</span>
                                <span className="ml-2 text-orange-900 font-mono">
                                    {locationState.coordinates.lat.toFixed(6)}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-orange-800">Longitud:</span>
                                <span className="ml-2 text-orange-900 font-mono">
                                    {locationState.coordinates.lng.toFixed(6)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {locationState.exact_address && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Dirección Exacta
                        </label>
                        <input
                            type="text"
                            value={locationState.exact_address}
                            onChange={(e) => {
                                const newAddress = e.target.value;
                                setLocationState(prev => ({ ...prev, exact_address: newAddress }));
                                notifyParent({ exact_address: newAddress });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ingresa la dirección exacta..."
                        />
                    </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm font-medium text-gray-900">
                                Mostrar ubicación exacta al público
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                                {locationState.show_exact_location
                                    ? 'Los visitantes verán la ubicación exacta'
                                    : 'Los visitantes verán una ubicación aproximada'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const newValue = !locationState.show_exact_location;
                                setLocationState(prev => ({ ...prev, show_exact_location: newValue }));
                                notifyParent({ show_exact_location: newValue });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${locationState.show_exact_location ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${locationState.show_exact_location ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {locationState.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-red-700">{locationState.error}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    {mode === 'edit' && locationState.coordinates && (
                        <button
                            onClick={saveLocation}
                            disabled={locationState.loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {locationState.loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>Guardar Ubicación</span>
                        </button>
                    )}
                </div>

                {locationState.coordinates && !locationState.loading && !locationState.error && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-700">
                                ✅ Sistema inteligente activo - Manejo automático de alias y jerarquías
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación de alias */}
            <AliasConfirmationModal
                isOpen={!!locationState.pending_confirmation && locationState.pending_confirmation.confirmation_type === 'alias'}
                onClose={() => setLocationState(prev => ({ ...prev, pending_confirmation: null }))}
                confirmationData={locationState.pending_confirmation}
                onConfirm={handleConfirmation}
                loading={locationState.loading}
            />

            {/* Modal de niveles faltantes */}
            <MissingLevelsModal
                isOpen={!!locationState.pending_confirmation && locationState.pending_confirmation.confirmation_type === 'missing_levels'}
                onClose={() => setLocationState(prev => ({ ...prev, pending_confirmation: null }))}
                confirmationData={locationState.pending_confirmation}
                onConfirm={handleConfirmation}
                loading={locationState.loading}
            />
        </div>
    );
};

// Utilidades
function parseCoordinates(coords) {
    if (!coords) return null;

    try {
        if (typeof coords === 'object' && coords.lat && coords.lng) {
            return coords;
        }

        if (typeof coords === 'string') {
            const match = coords.match(/\(([^,\s]+)[,\s]\s*([^)]+)\)/);
            if (match) {
                const lng = parseFloat(match[1].trim());
                const lat = parseFloat(match[2].trim());
                return { lat, lng };
            }
        }
    } catch (err) {
        console.error('Error parseando coordenadas:', err);
    }

    return null;
}

function toPostgreSQLPoint(coords) {
    return `(${coords.lng},${coords.lat})`;
}

export default PropertyLocationManager;