import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    MapPin, AlertCircle, CheckCircle, Navigation, Save, Globe, Map,
    Link, Plus, X, HelpCircle, Target, RefreshCw, ChevronDown, Building2,
    TrendingUp, Hash, Eye, Users, Layers, Coffee, ShoppingCart, GraduationCap,
    Car, Heart, Briefcase, Wifi, TreePine
} from 'lucide-react';

// Tu configuración de APIs
const LOCATIONIQ_API_KEY = 'pk.71673d1326498447b3ff67cf5daaef6c';
const FOURSQUARE_API_KEY = 'fsq3RYi1Kc5Q1LPRHn10JxuVqTDr26BkefhVeU9L85quM2A=';

// Mock de datos para demo (en producción vendrían de Supabase)
const mockLocationData = {
    countries: [
        { id: '1', location_name: 'República Dominicana', location_type: 'country', popularity_score: 100 }
    ],
    provinces: [
        { id: '2', location_name: 'Distrito Nacional', parent_location_id: '1', location_type: 'province', popularity_score: 95 },
        { id: '3', location_name: 'Santo Domingo', parent_location_id: '1', location_type: 'province', popularity_score: 90 },
        { id: '4', location_name: 'San Juan', parent_location_id: '1', location_type: 'province', popularity_score: 75 }
    ],
    cities: [
        { id: '5', location_name: 'Santo Domingo Este', parent_location_id: '3', location_type: 'city', popularity_score: 85 },
        { id: '6', location_name: 'Santo Domingo Norte', parent_location_id: '3', location_type: 'city', popularity_score: 80 },
        { id: '7', location_name: 'San Juan de la Maguana', parent_location_id: '4', location_type: 'city', popularity_score: 70 }
    ],
    sectors: [
        { id: '8', location_name: 'Arroyo Hondo', parent_location_id: '5', location_type: 'sector', popularity_score: 95 },
        { id: '9', location_name: 'Piantini', parent_location_id: '5', location_type: 'sector', popularity_score: 90 },
        { id: '10', location_name: 'Los Jardines', parent_location_id: '7', location_type: 'sector', popularity_score: 85 }
    ]
};

// Servicios de APIs
const LocationIQService = {
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            
            if (!response.ok) throw new Error('LocationIQ API error');
            
            const data = await response.json();
            return {
                success: true,
                data: {
                    display_name: data.display_name,
                    address: data.address,
                    country: data.address?.country,
                    state: data.address?.state || data.address?.province,
                    city: data.address?.city || data.address?.town,
                    suburb: data.address?.suburb || data.address?.neighbourhood
                }
            };
        } catch (error) {
            console.error('LocationIQ error:', error);
            return { success: false, error: error.message };
        }
    },

    async geocode(address) {
        try {
            const response = await fetch(
                `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`
            );
            
            if (!response.ok) throw new Error('LocationIQ geocoding error');
            
            const data = await response.json();
            if (data.length === 0) return { success: false, error: 'No results found' };
            
            return {
                success: true,
                data: {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    display_name: data[0].display_name
                }
            };
        } catch (error) {
            console.error('LocationIQ geocoding error:', error);
            return { success: false, error: error.message };
        }
    }
};

const FoursquareService = {
    async getNearbyPlaces(lat, lng, radius = 1000) {
        try {
            const response = await fetch(
                `https://api.foursquare.com/v3/places/nearby?ll=${lat},${lng}&limit=20&radius=${radius}`,
                {
                    headers: {
                        'Authorization': FOURSQUARE_API_KEY,
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Foursquare API error');
            
            const data = await response.json();
            return {
                success: true,
                places: data.results || []
            };
        } catch (error) {
            console.error('Foursquare error:', error);
            return { success: false, error: error.message, places: [] };
        }
    }
};

// Componente para mostrar lugares cercanos
const NearbyPlaces = ({ lat, lng, onPlaceClick }) => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (lat && lng) {
            loadNearbyPlaces(lat, lng);
        }
    }, [lat, lng]);

    const loadNearbyPlaces = async (latitude, longitude) => {
        setLoading(true);
        setError(null);
        
        const result = await FoursquareService.getNearbyPlaces(latitude, longitude);
        
        if (result.success) {
            setPlaces(result.places.slice(0, 10)); // Limitar a 10
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    const getCategoryIcon = (categories) => {
        if (!categories || categories.length === 0) return <MapPin className="w-4 h-4" />;
        
        const category = categories[0];
        const name = category.name.toLowerCase();
        
        if (name.includes('restaurant') || name.includes('food')) return <Coffee className="w-4 h-4" />;
        if (name.includes('shop') || name.includes('store')) return <ShoppingCart className="w-4 h-4" />;
        if (name.includes('school') || name.includes('education')) return <GraduationCap className="w-4 h-4" />;
        if (name.includes('gas') || name.includes('fuel')) return <Car className="w-4 h-4" />;
        if (name.includes('health') || name.includes('hospital')) return <Heart className="w-4 h-4" />;
        if (name.includes('office') || name.includes('business')) return <Briefcase className="w-4 h-4" />;
        if (name.includes('wifi') || name.includes('internet')) return <Wifi className="w-4 h-4" />;
        if (name.includes('park') || name.includes('recreation')) return <TreePine className="w-4 h-4" />;
        
        return <MapPin className="w-4 h-4" />;
    };

    if (!lat || !lng) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Lugares Cercanos
                {loading && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
            </h4>

            {error && (
                <div className="text-sm text-red-600 mb-3">
                    Error cargando lugares: {error}
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {places.map((place, index) => (
                    <div
                        key={place.fsq_id || index}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => onPlaceClick && onPlaceClick(place)}
                    >
                        <div className="text-blue-500">
                            {getCategoryIcon(place.categories)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                                {place.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {place.categories?.[0]?.name || 'Lugar'}
                            </div>
                            {place.distance && (
                                <div className="text-xs text-gray-400">
                                    ~{Math.round(place.distance)}m
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {places.length === 0 && !loading && (
                    <div className="text-sm text-gray-500 text-center py-4">
                        No se encontraron lugares cercanos
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de mapa con Leaflet + LocationIQ
const LocationMap = ({ 
    coordinates, 
    onLocationClick, 
    loading, 
    nearbyPlaces = [],
    propertyMarkers = []
}) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const currentMarker = useRef(null);
    const nearbyMarkers = useRef([]);
    const propertyMarkersRef = useRef([]);

    useEffect(() => {
        // Cargar Leaflet CSS y JS dinámicamente
        const loadLeaflet = async () => {
            if (window.L) {
                initializeMap();
                return;
            }

            // Cargar CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            // Cargar JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = initializeMap;
            document.body.appendChild(script);
        };

        loadLeaflet();
    }, []);

    useEffect(() => {
        if (mapInstance.current && coordinates) {
            updateCurrentMarker(coordinates);
            mapInstance.current.setView([coordinates.lat, coordinates.lng], 15);
        }
    }, [coordinates]);

    useEffect(() => {
        if (mapInstance.current) {
            updateNearbyMarkers(nearbyPlaces);
        }
    }, [nearbyPlaces]);

    const initializeMap = () => {
        if (!mapRef.current || mapInstance.current || !window.L) return;

        const defaultCenter = [18.4861, -69.9312]; // Santo Domingo
        const center = coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter;
        const zoom = coordinates ? 15 : 11;

        const map = window.L.map(mapRef.current).setView(center, zoom);

        // Usar tiles de LocationIQ
        window.L.tileLayer(`https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_API_KEY}`, {
            attribution: '© LocationIQ',
            maxZoom: 19
        }).addTo(map);

        mapInstance.current = map;

        // Event listener para clicks en el mapa
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            if (onLocationClick) {
                onLocationClick(lat, lng);
            }
        });

        if (coordinates) {
            updateCurrentMarker(coordinates);
        }
    };

    const updateCurrentMarker = (coords) => {
        if (!mapInstance.current || !window.L) return;

        // Limpiar marker actual
        if (currentMarker.current) {
            mapInstance.current.removeLayer(currentMarker.current);
        }

        // Crear nuevo marker
        const customIcon = window.L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #8b5cf6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        currentMarker.current = window.L.marker([coords.lat, coords.lng], { icon: customIcon })
            .addTo(mapInstance.current)
            .bindPopup('Ubicación de la propiedad');
    };

    const updateNearbyMarkers = (places) => {
        if (!mapInstance.current || !window.L) return;

        // Limpiar markers anteriores
        nearbyMarkers.current.forEach(marker => {
            mapInstance.current.removeLayer(marker);
        });
        nearbyMarkers.current = [];

        // Agregar nuevos markers
        places.forEach(place => {
            if (place.geocodes?.main) {
                const icon = window.L.divIcon({
                    className: 'nearby-marker',
                    html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });

                const marker = window.L.marker([
                    place.geocodes.main.latitude,
                    place.geocodes.main.longitude
                ], { icon })
                    .addTo(mapInstance.current)
                    .bindPopup(`
                        <strong>${place.name}</strong><br>
                        <small>${place.categories?.[0]?.name || 'Lugar'}</small>
                    `);

                nearbyMarkers.current.push(marker);
            }
        });
    };

    return (
        <div className="relative">
            <div
                ref={mapRef}
                className="w-full h-80 border border-gray-300 rounded-lg bg-gray-100"
            />
            
            {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                    <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-sm font-medium">Analizando ubicación...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Select con popularidad
const PopularitySelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    loading = false
}) => {
    const sortedOptions = useMemo(() => {
        if (!options) return [];
        return [...options].sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
    }, [options]);

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {loading && <span className="ml-2 text-xs text-blue-600">🔄</span>}
            </label>
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    disabled={disabled || loading}
                    className={`w-full pl-3 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none transition-colors ${
                        disabled || loading
                            ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                            : 'bg-white hover:border-gray-400'
                    }`}
                >
                    <option value="">{placeholder}</option>
                    {sortedOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.location_name}
                            {(option.popularity_score || 0) > 80 && ' 🔥'}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
};

// Modal de confirmación de alias
const AliasConfirmationModal = ({ 
    isOpen, 
    onClose, 
    aliasData, 
    onConfirm, 
    onCreateNew, 
    loading 
}) => {
    const [selectedAction, setSelectedAction] = useState('create_alias');

    if (!isOpen || !aliasData) return null;

    const handleConfirm = () => {
        if (selectedAction === 'create_alias') {
            onConfirm(aliasData);
        } else {
            onCreateNew(aliasData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link className="w-6 h-6" />
                            <div>
                                <h3 className="text-lg font-semibold">Nueva Ubicación Detectada</h3>
                                <p className="text-sm text-purple-100">
                                    "{aliasData.name}"
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-purple-600 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Ubicación detectada:</h4>
                        <p className="text-sm text-gray-600">
                            📍 {aliasData.coordinates?.lat.toFixed(6)}, {aliasData.coordinates?.lng.toFixed(6)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            {aliasData.address}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="action"
                                    value="create_alias"
                                    checked={selectedAction === 'create_alias'}
                                    onChange={(e) => setSelectedAction(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        Crear Alias (Recomendado)
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Asociar como nombre alternativo de una ubicación existente
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="border rounded-lg p-3">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="action"
                                    value="create_new"
                                    checked={selectedAction === 'create_new'}
                                    onChange={(e) => setSelectedAction(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        Crear Nueva Ubicación
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Agregar como ubicación independiente
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t flex justify-between rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>
                            {selectedAction === 'create_alias' ? 'Crear Alias' : 'Crear Nueva'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hook principal del estado
const useSmartLocationState = (initialProperty) => {
    const [state, setState] = useState({
        coordinates: null,
        hierarchy: {
            country_id: '',
            province_id: '',
            sector_id: ''
        },
        exact_address: '',
        show_exact_location: false,
        loading: false,
        loadingType: '',
        error: null,
        locationiq_data: null,
        nearby_places: [],
        pending_alias_confirmation: null,
        last_action: null
    });

    useEffect(() => {
        if (initialProperty) {
            setState(prev => ({
                ...prev,
                coordinates: initialProperty.coordinates || null,
                hierarchy: {
                    country_id: initialProperty.country_id || '',
                    province_id: initialProperty.province_id || '',
                    sector_id: initialProperty.sector_id || ''
                },
                exact_address: initialProperty.exact_address || '',
                show_exact_location: initialProperty.show_exact_location || false
            }));
        }
    }, [initialProperty]);

    return [state, setState];
};

// Componente principal
const SmartLocationManager = ({
    property,
    onLocationUpdate,
    mode = 'edit'
}) => {
    const [locationState, setLocationState] = useSmartLocationState(property);

    // Usar datos mock (en producción vendrían de Supabase)
    const locationData = {
        countries: mockLocationData.countries,
        provinces: mockLocationData.provinces,
        cities: mockLocationData.cities,
        sectors: mockLocationData.sectors,
        loading: false
    };

    const debounceTimeoutRef = useRef(null);

    // Notificar cambios al padre
    const notifyLocationUpdate = useCallback((updates) => {
        if (onLocationUpdate) {
            onLocationUpdate({
                ...property,
                ...updates
            });
        }
    }, [property, onLocationUpdate]);

    // Opciones filtradas para dropdowns (sin ciudad)
    const filteredOptions = useMemo(() => ({
        provinces: locationState.hierarchy.country_id
            ? locationData.provinces.filter(p => p.parent_location_id === locationState.hierarchy.country_id)
            : [],
        sectors: locationState.hierarchy.province_id
            ? locationData.sectors.filter(s => s.parent_location_id === locationState.hierarchy.province_id)
            : []
    }), [locationState.hierarchy, locationData]);

    // Manejar clic en mapa
    const handleMapClick = useCallback(async (lat, lng) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            console.log('🎯 Clic en mapa:', { lat, lng });

            setLocationState(prev => ({
                ...prev,
                loading: true,
                loadingType: 'geocoding',
                error: null,
                coordinates: { lat, lng },
                last_action: 'map_click'
            }));

            try {
                // Geocodificación inversa con LocationIQ
                const geocodeResult = await LocationIQService.reverseGeocode(lat, lng);
                
                if (geocodeResult.success) {
                    // Buscar lugares cercanos con Foursquare
                    const placesResult = await FoursquareService.getNearbyPlaces(lat, lng);
                    
                    // Detectar si necesitamos crear alias o nueva ubicación
                    const shouldShowConfirmation = Math.random() > 0.7; // 30% probabilidad para demo
                    
                    if (shouldShowConfirmation && geocodeResult.data.suburb) {
                        setLocationState(prev => ({
                            ...prev,
                            loading: false,
                            locationiq_data: geocodeResult.data,
                            nearby_places: placesResult.places || [],
                            pending_alias_confirmation: {
                                name: geocodeResult.data.suburb,
                                address: geocodeResult.data.display_name,
                                coordinates: { lat, lng },
                                source: 'locationiq'
                            }
                        }));
                    } else {
                        // Auto-asignar a ubicación conocida
                        await autoAssignLocation(geocodeResult.data, { lat, lng }, placesResult.places || []);
                    }
                } else {
                    setLocationState(prev => ({
                        ...prev,
                        loading: false,
                        error: geocodeResult.error
                    }));
                }
            } catch (error) {
                console.error('Error procesando ubicación:', error);
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Error procesando la ubicación'
                }));
            }
        }, 300);
    }, []);

    // Auto-asignar ubicación principal con geocerca inteligente
    const autoAssignLocation = useCallback(async (geocodeData, coordinates, nearbyPlaces) => {
        console.log('🔍 Iniciando geocerca inteligente...');
        
        // Usar geocerca para obtener sector más consistente
        const smartSector = await smartSectorDetection(coordinates.lat, coordinates.lng);
        
        // Mapear resultado inteligente → ubicaciones principales
        const mappedLocation = mapLocationIQToMainHierarchy({
            ...geocodeData,
            suburb: smartSector || geocodeData.suburb // Usar sector inteligente si está disponible
        });
        
        const newHierarchy = {
            country_id: '1', // República Dominicana
            province_id: mappedLocation.province_id,
            sector_id: mappedLocation.sector_id // Sin city_id
        };

        // Detectar micro-ubicaciones para tags
        const detectedMicroLocations = extractMicroLocations(geocodeData, smartSector);
        
        setLocationState(prev => ({
            ...prev,
            loading: false,
            hierarchy: newHierarchy,
            locationiq_data: { ...geocodeData, smart_sector: smartSector },
            nearby_places: nearbyPlaces,
            detected_micro_tags: detectedMicroLocations,
            exact_address: geocodeData.display_name,
            last_action: 'smart_geocerca'
        }));

        notifyLocationUpdate({
            ...newHierarchy,
            coordinates,
            exact_address: geocodeData.display_name,
            micro_locations: detectedMicroLocations,
            smart_sector: smartSector
        });

        console.log(`✅ Geocerca completada. Sector inteligente: "${smartSector || geocodeData.suburb}"`);
    }, [notifyLocationUpdate]);

    // Geocerca inteligente para sectores consistentes
    const smartSectorDetection = async (lat, lng) => {
        try {
            console.log('🎯 Ejecutando geocerca inteligente...');
            
            // Buscar en múltiples puntos cercanos (radio ~200m)
            const searchRadius = 0.0018; // Aproximadamente 200 metros
            const searchPoints = [
                { lat, lng }, // Punto central
                { lat: lat + searchRadius, lng }, // Norte
                { lat: lat - searchRadius, lng }, // Sur  
                { lat, lng: lng + searchRadius }, // Este
                { lat, lng: lng - searchRadius }, // Oeste
                { lat: lat + searchRadius/2, lng: lng + searchRadius/2 }, // Noreste
                { lat: lat - searchRadius/2, lng: lng - searchRadius/2 }  // Suroeste
            ];

            // Buscar en paralelo en todos los puntos
            const results = await Promise.all(
                searchPoints.map(async (point) => {
                    try {
                        const result = await LocationIQService.reverseGeocode(point.lat, point.lng);
                        return result.success ? result.data?.suburb : null;
                    } catch (error) {
                        return null;
                    }
                })
            );

            // Filtrar resultados válidos
            const validSectors = results.filter(sector => 
                sector && 
                sector.trim().length > 0 && 
                !isGenericName(sector)
            );

            if (validSectors.length === 0) return null;

            // Contar frecuencia de cada sector
            const sectorCount = {};
            validSectors.forEach(sector => {
                const normalized = normalizeSectorName(sector);
                sectorCount[normalized] = (sectorCount[normalized] || 0) + 1;
            });

            // Encontrar el sector más común
            const mostCommonSector = Object.entries(sectorCount)
                .sort(([,a], [,b]) => b - a)[0]?.[0];

            console.log('📊 Geocerca resultados:', {
                puntos_buscados: searchPoints.length,
                sectores_encontrados: validSectors,
                sector_mas_comun: mostCommonSector,
                confianza: `${Math.round((sectorCount[mostCommonSector] / validSectors.length) * 100)}%`
            });

            return mostCommonSector;
            
        } catch (error) {
            console.error('❌ Error en geocerca inteligente:', error);
            return null;
        }
    };

    // Filtrar nombres genéricos o poco útiles
    const isGenericName = (name) => {
        const genericNames = [
            'polígono central', 'centro', 'downtown', 'city center',
            'área central', 'zona céntrica', 'distrito', 'municipio'
        ];
        return genericNames.some(generic => 
            name.toLowerCase().includes(generic.toLowerCase())
        );
    };

    // Normalizar nombres de sectores
    const normalizeSectorName = (name) => {
        return name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9-]/g, '');
    };
    // Mapear LocationIQ → ubicaciones principales de tu DB (sin ciudad)
    const mapLocationIQToMainHierarchy = (geocodeData) => {
        const locationMappings = {
            provinces: {
                'distrito nacional': '2',
                'santo domingo': '3', 
                'san juan': '4'
            },
            sectors: {
                'naco': '8',
                'piantini': '9', 
                'evaristo morales': '10',
                'arroyo hondo': '11',
                'zona colonial': '12',
                'ensanche lugo': '12', // Mapear a Zona Colonial
                'gazcue': '13',
                'bella vista': '14',
                'los jardines': '15',
                'ensanche naco': '8' // Mapear a Naco
            }
        };

        // Extraer y normalizar nombres
        const state = geocodeData.state?.toLowerCase() || '';
        const suburb = geocodeData.suburb?.toLowerCase() || '';

        return {
            province_id: locationMappings.provinces[state] || '3', // Default Santo Domingo
            sector_id: locationMappings.sectors[suburb] || '8' // Default Naco
        };
    };

    // Extraer micro-ubicaciones para tags (incluyendo sector inteligente)
    const extractMicroLocations = (geocodeData, smartSector) => {
        const microLocations = [];
        
        // Agregar sector inteligente si es diferente al original
        if (smartSector && smartSector !== geocodeData.suburb) {
            microLocations.push({
                name: smartSector,
                type: 'smart_sector',
                confidence: 0.95
            });
        }
        
        // Extraer nombres de la dirección completa
        const addressParts = geocodeData.display_name?.split(',') || [];
        
        addressParts.forEach(part => {
            const cleaned = part.trim().toLowerCase();
            
            if (cleaned.includes('ensanche') && cleaned.length > 8) {
                microLocations.push({
                    name: cleaned,
                    type: 'neighborhood',
                    confidence: 0.8
                });
            }
            
            if (cleaned.includes('zona') && cleaned.length > 4) {
                microLocations.push({
                    name: cleaned,
                    type: 'area',
                    confidence: 0.9
                });
            }
        });

        return microLocations;
    };

    // Manejar cambios en dropdown
    const handleDropdownChange = useCallback((level, locationId) => {
        const newHierarchy = { ...locationState.hierarchy };

        if (level === 'country_id') {
            newHierarchy = { country_id: locationId, province_id: '', sector_id: '' };
        } else if (level === 'province_id') {
            newHierarchy = { ...newHierarchy, province_id: locationId, sector_id: '' };
        } else {
            newHierarchy[level] = locationId;
        }

        setLocationState(prev => ({
            ...prev,
            hierarchy: newHierarchy,
            last_action: `${level}_changed`
        }));

        notifyLocationUpdate(newHierarchy);
    }, [locationState.hierarchy, notifyLocationUpdate]);

    // Obtener ubicación actual
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationState(prev => ({
                ...prev,
                error: 'Geolocalización no disponible'
            }));
            return;
        }

        setLocationState(prev => ({
            ...prev,
            loading: true,
            loadingType: 'geolocation'
        }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                handleMapClick(lat, lng);
            },
            (error) => {
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'No se pudo obtener tu ubicación'
                }));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [handleMapClick]);

    // Confirmar alias
    const handleAliasConfirmation = useCallback((aliasData) => {
        setLocationState(prev => ({
            ...prev,
            pending_alias_confirmation: null,
            last_action: 'alias_created'
        }));
        
        console.log('🔗 Alias confirmado:', aliasData);
        
        // Simular asignación después de crear alias
        const newHierarchy = {
            country_id: '1',
            province_id: '3', 
            city_id: '5',
            sector_id: '8'
        };

        setLocationState(prev => ({
            ...prev,
            hierarchy: newHierarchy
        }));

        notifyLocationUpdate({
            ...newHierarchy,
            coordinates: aliasData.coordinates
        });
    }, [notifyLocationUpdate]);

    // Crear nueva ubicación
    const handleCreateNewLocation = useCallback((locationData) => {
        setLocationState(prev => ({
            ...prev,
            pending_alias_confirmation: null,
            last_action: 'location_created'
        }));

        console.log('📍 Nueva ubicación creada:', locationData);

        // Simular ID nueva ubicación
        const newSectorId = 'new-' + Date.now();
        const newHierarchy = {
            country_id: '1',
            province_id: '3',
            city_id: '5',
            sector_id: newSectorId
        };

        setLocationState(prev => ({
            ...prev,
            hierarchy: newHierarchy
        }));

        notifyLocationUpdate({
            ...newHierarchy,
            coordinates: locationData.coordinates
        });
    }, [notifyLocationUpdate]);

    const handlePlaceClick = useCallback((place) => {
        console.log('🏢 Lugar seleccionado:', place.name);
        // Aquí puedes agregar lógica adicional para manejar clic en lugares
    }, []);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                🗺️ Sistema Inteligente - LocationIQ + Foursquare
                            </h3>
                            <p className="text-sm text-gray-600">
                                Sin dependencia de Google Maps
                            </p>
                        </div>
                    </div>

                    {locationState.last_action && (
                        <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            ⚡ {locationState.last_action}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Loading State */}
                {locationState.loading && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                            <div>
                                <span className="text-purple-800 font-medium">
                                    {locationState.loadingType === 'geocoding' && 'Analizando con LocationIQ...'}
                                    {locationState.loadingType === 'geolocation' && 'Obteniendo tu ubicación...'}
                                    {!locationState.loadingType && 'Procesando...'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {locationState.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-red-700">{locationState.error}</span>
                        </div>
                    </div>
                )}

                {/* APIs Status */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                        <Layers className="w-4 h-4 mr-2" />
                        APIs Integradas
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-blue-800">LocationIQ (Mapas + Geocoding)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-blue-800">Foursquare (Lugares)</span>
                        </div>
                    </div>
                </div>

                {/* Dropdowns jerárquicos */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Map className="w-4 h-4 mr-2" />
                        Jerarquía Administrativa
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PopularitySelect
                            label="País"
                            value={locationState.hierarchy.country_id}
                            onChange={(value) => handleDropdownChange('country_id', value)}
                            options={locationData.countries}
                            placeholder="Seleccionar país"
                            loading={locationData.loading}
                        />

                        <PopularitySelect
                            label="Provincia"
                            value={locationState.hierarchy.province_id}
                            onChange={(value) => handleDropdownChange('province_id', value)}
                            options={filteredOptions.provinces}
                            placeholder="Seleccionar provincia"
                            disabled={!locationState.hierarchy.country_id}
                        />

                        <PopularitySelect
                            label="Sector"
                            value={locationState.hierarchy.sector_id}
                            onChange={(value) => handleDropdownChange('sector_id', value)}
                            options={filteredOptions.sectors}
                            placeholder="Seleccionar sector"
                            disabled={!locationState.hierarchy.province_id}
                        />
                    </div>
                </div>

                {/* Mapa con LocationIQ */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Mapa Interactivo (LocationIQ)
                        </h4>
                        <button
                            onClick={getCurrentLocation}
                            disabled={locationState.loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                        >
                            <Navigation className="w-4 h-4" />
                            <span>Mi Ubicación</span>
                        </button>
                    </div>

                    <LocationMap
                        coordinates={locationState.coordinates}
                        onLocationClick={handleMapClick}
                        loading={locationState.loading}
                        nearbyPlaces={locationState.nearby_places}
                    />
                </div>

                {/* Coordenadas exactas */}
                {locationState.coordinates && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Coordenadas Precisas
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-orange-800">Latitud: </span>
                                <code className="text-orange-900 font-mono">
                                    {locationState.coordinates.lat.toFixed(6)}
                                </code>
                            </div>
                            <div>
                                <span className="font-medium text-orange-800">Longitud: </span>
                                <code className="text-orange-900 font-mono">
                                    {locationState.coordinates.lng.toFixed(6)}
                                </code>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información de LocationIQ */}
                {locationState.locationiq_data && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            Datos de LocationIQ
                        </h4>
                        <div className="text-sm text-gray-700">
                            <div><strong>Dirección:</strong> {locationState.locationiq_data.display_name}</div>
                            <div><strong>País:</strong> {locationState.locationiq_data.country}</div>
                            <div><strong>Estado:</strong> {locationState.locationiq_data.state}</div>
                            <div><strong>Ciudad:</strong> {locationState.locationiq_data.city}</div>
                            <div><strong>Sector:</strong> {locationState.locationiq_data.suburb}</div>
                        </div>
                    </div>
                )}

                {/* Lugares cercanos de Foursquare */}
                {locationState.coordinates && (
                    <NearbyPlaces
                        lat={locationState.coordinates.lat}
                        lng={locationState.coordinates.lng}
                        onPlaceClick={handlePlaceClick}
                    />
                )}

                {/* Dirección exacta */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Dirección Exacta (Opcional)
                    </label>
                    <input
                        type="text"
                        value={locationState.exact_address}
                        onChange={(e) => {
                            const address = e.target.value;
                            setLocationState(prev => ({ ...prev, exact_address: address }));
                            notifyLocationUpdate({ exact_address: address });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Ej: Torre del Mar, Piso 15, Apartamento 1502"
                    />
                </div>

                {/* Toggle visibilidad */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm font-medium text-gray-900">
                                Mostrar ubicación exacta al público
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                                {locationState.show_exact_location
                                    ? '👁️ Ubicación exacta visible en el mapa'
                                    : '🔒 Se mostrará ubicación aproximada'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const newValue = !locationState.show_exact_location;
                                setLocationState(prev => ({ ...prev, show_exact_location: newValue }));
                                notifyLocationUpdate({ show_exact_location: newValue });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                locationState.show_exact_location ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    locationState.show_exact_location ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Success state */}
                {locationState.hierarchy.sector_id && !locationState.loading && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-700 font-medium">
                                ✅ Ubicación configurada exitosamente
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-green-600">
                            Powered by LocationIQ + Foursquare
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmación de alias */}
            <AliasConfirmationModal
                isOpen={!!locationState.pending_alias_confirmation}
                onClose={() => setLocationState(prev => ({
                    ...prev,
                    pending_alias_confirmation: null
                }))}
                aliasData={locationState.pending_alias_confirmation}
                onConfirm={handleAliasConfirmation}
                onCreateNew={handleCreateNewLocation}
                loading={locationState.loading}
            />
        </div>
    );
};

export default SmartLocationManager;