import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Map, X, Save, Navigation, RefreshCw, Info, CheckCircle
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCpzGsbg52e2HqFXCXA6_5alq2OYwVjvSU';

// Componente Button básico
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

// Modal de selección de coordenadas con Google Maps
const CoordinatesMapModal = ({ isOpen, onClose, onSelect, initialCoordinates }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const marker = useRef(null);
    const [selectedCoordinates, setSelectedCoordinates] = useState(initialCoordinates || null);
    const [mapReady, setMapReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);

    // Inicializar mapa cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setSelectedCoordinates(initialCoordinates || null);
            setMapReady(false);
            // Resetear instancias del mapa
            mapInstance.current = null;
            marker.current = null;
            // Delay para asegurar que el DOM esté listo
            setTimeout(() => {
                loadGoogleMapsAndInit();
            }, 100);
        }
    }, [isOpen, initialCoordinates]);

    const loadGoogleMapsAndInit = useCallback(() => {
        setMapLoading(true);
        
        if (window.google?.maps) {
            initializeMap();
            return;
        }

        // Verificar si ya existe el script
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            const checkGoogle = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkGoogle);
                    initializeMap();
                }
            }, 100);
            return;
        }

        // Cargar Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => {
            initializeMap();
        };
        script.onerror = () => {
            setMapLoading(false);
            console.error('Error cargando Google Maps');
        };
        document.head.appendChild(script);
    }, []);

    const initializeMap = useCallback(() => {
        if (!mapRef.current || mapInstance.current) {
            setMapLoading(false);
            return;
        }

        try {
            // Centro por defecto (Santo Domingo, RD)
            const center = selectedCoordinates || { lat: 18.4861, lng: -69.9312 };
            const zoom = selectedCoordinates ? 15 : 12;

            const map = new window.google.maps.Map(mapRef.current, {
                center,
                zoom,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                gestureHandling: 'greedy',
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'on' }]
                    }
                ]
            });

            mapInstance.current = map;

            // Listener para clics en el mapa
            map.addListener('click', (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                const coords = { lat, lng };
                
                setSelectedCoordinates(coords);
                updateMapMarker(coords);
            });

            // Si hay coordenadas iniciales, mostrar marcador
            if (selectedCoordinates) {
                updateMapMarker(selectedCoordinates);
            }

            setMapReady(true);
            setMapLoading(false);
        } catch (error) {
            console.error('Error inicializando mapa:', error);
            setMapLoading(false);
        }
    }, [selectedCoordinates]);

    const updateMapMarker = useCallback((coords) => {
        if (!mapInstance.current || !coords) return;

        try {
            // Limpiar marcador anterior
            if (marker.current) {
                marker.current.setMap(null);
            }

            // Crear nuevo marcador
            marker.current = new window.google.maps.Marker({
                position: coords,
                map: mapInstance.current,
                title: 'Ubicación seleccionada',
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#dc2626',
                    fillOpacity: 1,
                    strokeWeight: 3,
                    strokeColor: '#ffffff'
                },
                animation: window.google.maps.Animation.DROP
            });
        } catch (error) {
            console.error('Error actualizando marcador:', error);
        }
    }, []);

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocalización no disponible en este navegador');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                setSelectedCoordinates(coords);
                updateMapMarker(coords);
                
                if (mapInstance.current) {
                    mapInstance.current.panTo(coords);
                    mapInstance.current.setZoom(16);
                }
                
                setLoading(false);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                alert('No se pudo obtener tu ubicación actual');
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }, [updateMapMarker]);

    const handleConfirm = () => {
        if (selectedCoordinates && onSelect) {
            onSelect(selectedCoordinates);
            onClose();
        }
    };

    const handleClear = () => {
        setSelectedCoordinates(null);
        if (marker.current) {
            marker.current.setMap(null);
            marker.current = null;
        }
    };

    const handleClose = () => {
        // Limpiar recursos
        if (marker.current) {
            marker.current.setMap(null);
            marker.current = null;
        }
        mapInstance.current = null;
        setMapReady(false);
        setSelectedCoordinates(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <Map className="w-6 h-6 text-blue-500" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Seleccionar Coordenadas
                            </h3>
                            <p className="text-sm text-gray-600">
                                Haz clic en el mapa para seleccionar la ubicación exacta
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        icon={<X className="w-4 h-4" />}
                    />
                </div>

                {/* Controles */}
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            disabled={loading || !mapReady}
                            icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        >
                            Mi Ubicación
                        </Button>
                        
                        {selectedCoordinates && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                icon={<X className="w-4 h-4" />}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {selectedCoordinates && (
                        <div className="text-sm text-gray-600 font-mono">
                            📍 {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                        </div>
                    )}
                </div>

                {/* Mapa */}
                <div className="flex-1 relative">
                    <div
                        ref={mapRef}
                        className="w-full h-96"
                    />

                    {(mapLoading || !mapReady) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                    {mapLoading ? 'Cargando Google Maps...' : 'Inicializando mapa...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {mapReady && !selectedCoordinates && (
                        <div className="absolute top-4 left-4 bg-white rounded-lg shadow p-3 max-w-xs">
                            <div className="flex items-start space-x-2">
                                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="text-sm text-gray-700">
                                    <strong>Instrucciones:</strong>
                                    <br />• Haz clic en cualquier punto del mapa
                                    <br />• Usa "Mi Ubicación" para ir a tu posición actual
                                    <br />• Puedes hacer zoom y mover el mapa libremente
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedCoordinates && mapReady && (
                        <div className="absolute top-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                    Ubicación seleccionada
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!selectedCoordinates}
                        icon={<Save className="w-4 h-4" />}
                    >
                        Confirmar Coordenadas
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CoordinatesMapModal;