import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, X, Eye, MapPin, Navigation, Search, Loader2,
    AlertCircle, CheckCircle, Camera, ImageIcon, Plus
} from 'lucide-react';

// Componente para carga de imágenes
export const ImageUploader = ({
    images = [],
    onImagesChange,
    maxImages = 10,
    allowMultiple = true,
    label = "Imágenes de la propiedad"
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages = [];

        // Simular carga de imágenes (reemplazar con lógica real)
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Crear URL temporal para preview
            const imageUrl = URL.createObjectURL(file);

            // En producción, aquí subirías a tu storage (Supabase Storage, Cloudinary, etc.)
            // const uploadedUrl = await uploadToStorage(file);

            newImages.push({
                id: Date.now() + i,
                url: imageUrl, // En producción sería uploadedUrl
                file: file,
                name: file.name,
                size: file.size,
                isMain: images.length === 0 && i === 0 // Primera imagen como principal
            });
        }

        const updatedImages = [...images, ...newImages].slice(0, maxImages);
        onImagesChange(updatedImages);
        setUploading(false);
    };

    const removeImage = (imageId) => {
        const updatedImages = images.filter(img => img.id !== imageId);

        // Si removemos la imagen principal, hacer la primera como principal
        if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
            updatedImages[0].isMain = true;
        }

        onImagesChange(updatedImages);
    };

    const setMainImage = (imageId) => {
        const updatedImages = images.map(img => ({
            ...img,
            isMain: img.id === imageId
        }));
        onImagesChange(updatedImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
                <span className="text-xs text-gray-500">
                    {images.length}/{maxImages} imágenes
                </span>
            </div>

            {/* Área de carga */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={allowMultiple}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                        <span className="text-orange-600">Subiendo imágenes...</span>
                    </div>
                ) : (
                    <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                            Haz clic para subir imágenes o arrastra y suelta
                        </p>
                        <p className="text-xs text-gray-500">
                            PNG, JPG, WEBP hasta 10MB cada una
                        </p>
                    </div>
                )}
            </div>

            {/* Grid de imágenes subidas */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Controles de imagen */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewIndex(index);
                                    }}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                                    title="Ver imagen"
                                >
                                    <Eye className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(image.id);
                                    }}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                                    title="Eliminar imagen"
                                >
                                    <X className="w-4 h-4 text-red-600" />
                                </button>
                            </div>

                            {/* Badge de imagen principal */}
                            {image.isMain && (
                                <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    Principal
                                </div>
                            )}

                            {/* Botón para marcar como principal */}
                            {!image.isMain && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMainImage(image.id);
                                    }}
                                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded text-xs hover:bg-opacity-70"
                                    title="Marcar como principal"
                                >
                                    ?
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente para selección de ubicación con mapa
export const LocationPicker = ({
    onLocationChange,
    initialLocation = null,
    showExactLocation = false,
    onShowExactLocationChange
}) => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [coordinates, setCoordinates] = useState(initialLocation);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        // Simular carga de Google Maps
        setTimeout(() => {
            setMapReady(true);
            if (coordinates) {
                // Simular inicialización del mapa con coordenadas
                console.log('Mapa inicializado en:', coordinates);
            }
        }, 1000);
    }, []);

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('La geolocalización no está disponible en este navegador');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Validar que esté en República Dominicana
                if (coords.lat < 17.2 || coords.lat > 20.0 ||
                    coords.lng < -72.5 || coords.lng > -68.0) {
                    alert('Tu ubicación actual no está en República Dominicana');
                    setLoading(false);
                    return;
                }

                setCoordinates(coords);
                onLocationChange && onLocationChange(coords);

                // Geocoding reverso simulado
                setAddress(`Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
                setLoading(false);
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                alert('No se pudo obtener tu ubicación actual');
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    const searchAddress = async () => {
        if (!address.trim()) return;

        setLoading(true);

        // Simular búsqueda de dirección (reemplazar con Google Geocoding API)
        setTimeout(() => {
            const mockCoords = {
                lat: 18.4861 + (Math.random() - 0.5) * 0.1,
                lng: -69.9312 + (Math.random() - 0.5) * 0.1
            };

            setCoordinates(mockCoords);
            onLocationChange && onLocationChange(mockCoords);
            setLoading(false);
        }, 1000);
    };

    const handleMapClick = (lat, lng) => {
        const coords = { lat, lng };
        setCoordinates(coords);
        onLocationChange && onLocationChange(coords);
        setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Ubicación de la propiedad
                </label>
                {coordinates && (
                    <span className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ubicación seleccionada
                    </span>
                )}
            </div>

            {/* Herramientas de búsqueda */}
            <div className="flex items-center space-x-3">
                <div className="flex-1">
                    <div className="flex space-x-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar dirección..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <button
                            onClick={searchAddress}
                            disabled={loading || !address.trim()}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            <span>Buscar</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Navigation className="w-4 h-4" />
                    )}
                    <span>Mi Ubicación</span>
                </button>
            </div>

            {/* Mapa */}
            <div className="relative">
                <div className="w-full h-64 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                    {!mapReady ? (
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Cargando mapa...</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 rounded-lg">
                            <div className="text-center">
                                <MapPin className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-700 font-medium">Mapa Interactivo</p>
                                <p className="text-xs text-gray-500">
                                    {coordinates
                                        ? `Lat: ${coordinates.lat.toFixed(4)}, Lng: ${coordinates.lng.toFixed(4)}`
                                        : 'Haz clic para seleccionar ubicación'
                                    }
                                </p>
                                {!coordinates && (
                                    <button
                                        onClick={() => handleMapClick(18.4861, -69.9312)}
                                        className="mt-2 px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                                    >
                                        Seleccionar Santo Domingo
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {coordinates && (
                    <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2 text-xs">
                        <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Ubicación marcada</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Configuración de privacidad */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                                Mostrar ubicación exacta al público
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 ml-6">
                            {showExactLocation
                                ? 'Los visitantes verán la ubicación exacta'
                                : 'Los visitantes verán una ubicación aproximada'
                            }
                        </p>
                    </div>

                    <button
                        onClick={() => onShowExactLocationChange && onShowExactLocationChange(!showExactLocation)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showExactLocation ? 'bg-orange-600' : 'bg-gray-300'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showExactLocation ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente para configuración rápida de proyecto
export const ProjectQuickSetup = ({
    projectData,
    onProjectDataChange,
    errors = {}
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateProjectData = (field, value) => {
        onProjectDataChange({
            ...projectData,
            [field]: value
        });
    };

    const addGuarantee = () => {
        const guarantees = projectData.guarantees || [];
        onProjectDataChange({
            ...projectData,
            guarantees: [...guarantees, '']
        });
    };

    const updateGuarantee = (index, value) => {
        const guarantees = [...(projectData.guarantees || [])];
        guarantees[index] = value;
        onProjectDataChange({
            ...projectData,
            guarantees
        });
    };

    const removeGuarantee = (index) => {
        const guarantees = projectData.guarantees.filter((_, i) => i !== index);
        onProjectDataChange({
            ...projectData,
            guarantees
        });
    };

    return (
        <div className="space-y-6">
            {/* Información básica del proyecto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total de unidades <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={projectData.total_units || ''}
                        onChange={(e) => updateProjectData('total_units', e.target.value)}
                        placeholder="120"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.total_units ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                    {errors.total_units && (
                        <p className="text-red-500 text-xs mt-1">{errors.total_units}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidades disponibles
                    </label>
                    <input
                        type="number"
                        value={projectData.available_units || ''}
                        onChange={(e) => updateProjectData('available_units', e.target.value)}
                        placeholder="85"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje de avance (%)
                    </label>
                    <div className="relative">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={projectData.completion_percentage || 0}
                            onChange={(e) => updateProjectData('completion_percentage', e.target.value)}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span className="font-medium text-orange-600">
                                {projectData.completion_percentage || 0}%
                            </span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha estimada de entrega
                    </label>
                    <input
                        type="date"
                        value={projectData.estimated_delivery || ''}
                        onChange={(e) => updateProjectData('estimated_delivery', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del desarrollador <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={projectData.developer_name || ''}
                        onChange={(e) => updateProjectData('developer_name', e.target.value)}
                        placeholder="Grupo Inmobiliario ABC"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.developer_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                    {errors.developer_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.developer_name}</p>
                    )}
                </div>
            </div>

            {/* Garantías del proyecto */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Garantías del proyecto
                    </label>
                    <button
                        type="button"
                        onClick={addGuarantee}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                    </button>
                </div>

                <div className="space-y-2">
                    {(projectData.guarantees || []).map((guarantee, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={guarantee}
                                onChange={(e) => updateGuarantee(index, e.target.value)}
                                placeholder="Ej: Desarrollador certificado"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeGuarantee(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {(!projectData.guarantees || projectData.guarantees.length === 0) && (
                        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500 text-sm">No hay garantías agregadas</p>
                            <button
                                type="button"
                                onClick={addGuarantee}
                                className="mt-2 text-orange-600 text-sm hover:text-orange-700"
                            >
                                Agregar primera garantía
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Configuración avanzada (opcional) */}
            <div className="border-t pt-4">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    <span>Configuración avanzada</span>
                    {showAdvanced ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                </button>

                {showAdvanced && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de fases
                                </label>
                                <input
                                    type="number"
                                    value={projectData.phases_count || ''}
                                    onChange={(e) => updateProjectData('phases_count', e.target.value)}
                                    placeholder="1"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de tipologías
                                </label>
                                <input
                                    type="number"
                                    value={projectData.typologies_count || ''}
                                    onChange={(e) => updateProjectData('typologies_count', e.target.value)}
                                    placeholder="3"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción del proyecto
                            </label>
                            <textarea
                                rows={3}
                                value={projectData.project_description || ''}
                                onChange={(e) => updateProjectData('project_description', e.target.value)}
                                placeholder="Descripción detallada del desarrollo inmobiliario..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de validación en tiempo real
export const ValidationSummary = ({
    errors = {},
    warnings = [],
    completionPercentage = 0
}) => {
    const errorCount = Object.keys(errors).length;
    const warningCount = warnings.length;

    if (errorCount === 0 && warningCount === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                        Todo se ve perfecto
                    </span>
                </div>
                <div className="mt-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-green-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <span className="text-sm text-green-700 font-medium">
                            {completionPercentage}% completo
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">
                            {errorCount} {errorCount === 1 ? 'error' : 'errores'} por corregir
                        </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {Object.entries(errors).map(([field, message]) => (
                            <li key={field}>{message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {warningCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">
                            {warningCount} {warningCount === 1 ? 'sugerencia' : 'sugerencias'}
                        </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                        {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};// JavaScript source code
