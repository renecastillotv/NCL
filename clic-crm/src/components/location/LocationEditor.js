import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, MapPin, Globe, Building, Home,
    Navigation, X, Save, AlertCircle, Check, Star, Eye, EyeOff,
    Calendar, User, Tag, FileText, TrendingUp, Users, Car,
    GraduationCap, Heart, DollarSign, BarChart3, AlertTriangle,
    RefreshCw, Merge, Zap, Target, Database, Settings, Copy,
    CheckCircle, XCircle, ArrowRight, GitMerge, ArrowLeft,
    Info, Edit3, Trash, Map
} from 'lucide-react';
import { supabase } from '../../services/api';
import Button from '../ui/Button';
import CoordinatesMapModal from './CoordinatesMapModal';
import { TagSelectionModal } from '../modals/TagSelectionModal';

// Componentes UI básicos (Card y Badge - Button ya se importa de ui/)
const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente para mostrar jerarquía de ubicaciones
const LocationHierarchy = ({ location, locations }) => {
    const buildHierarchy = (loc) => {
        const hierarchy = [loc];
        let current = loc;
        
        while (current.parent_location_id) {
            const parent = locations.find(l => l.id === current.parent_location_id);
            if (parent) {
                hierarchy.unshift(parent);
                current = parent;
            } else {
                break;
            }
        }
        
        return hierarchy;
    };

    const hierarchy = buildHierarchy(location);

    return (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
            {hierarchy.map((item, index) => (
                <React.Fragment key={item.id}>
                    {index > 0 && <ArrowRight className="w-4 h-4 text-gray-400" />}
                    <span className={index === hierarchy.length - 1 ? 'font-medium text-gray-900' : ''}>
                        {item.display_name || item.location_name}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

// Componente para editar ubicación existente
const LocationDetail = ({ location, locations, onBack, onSave, onDelete }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        location_name: '',
        display_name: '',
        canonical_name: '',
        location_type: '',
        parent_location_id: '',
        description: '',
        short_description: '',
        seo_title: '',
        seo_description: '',
        status: 'active',
        featured: false,
        sort_order: 0,
        popularity_score: 50,
        coordinates_lat: '',
        coordinates_lng: '',
        bounds_northeast_lat: '',
        bounds_northeast_lng: '',
        bounds_southwest_lat: '',
        bounds_southwest_lng: ''
    });
    const [saving, setSaving] = useState(false);
    const [locationTag, setLocationTag] = useState(null);
    const [showTagModal, setShowTagModal] = useState(false);
    const [showCoordinatesModal, setShowCoordinatesModal] = useState(false);
    const [tagLoading, setTagLoading] = useState(false);

    const locationTypes = [
        { value: 'country', label: 'País', icon: Globe },
        { value: 'province', label: 'Provincia', icon: MapPin },
        { value: 'city', label: 'Ciudad', icon: Building },
        { value: 'sector', label: 'Sector', icon: Navigation },
        { value: 'neighborhood', label: 'Barrio', icon: Home }
    ];

    useEffect(() => {
        if (location) {
            // Parsear coordenadas si existen
            let lat = '', lng = '';
            let ne_lat = '', ne_lng = '', sw_lat = '', sw_lng = '';
            
            if (location.coordinates) {
                const coords = location.coordinates.match(/\(([^,]+),([^)]+)\)/);
                if (coords) {
                    lng = coords[1].trim(); // Primer valor es longitud
                    lat = coords[2].trim(); // Segundo valor es latitud
                }
            }
            
            if (location.bounds_northeast) {
                const ne_coords = location.bounds_northeast.match(/\(([^,]+),([^)]+)\)/);
                if (ne_coords) {
                    ne_lng = ne_coords[1].trim(); // Primer valor es longitud
                    ne_lat = ne_coords[2].trim(); // Segundo valor es latitud
                }
            }
            
            if (location.bounds_southwest) {
                const sw_coords = location.bounds_southwest.match(/\(([^,]+),([^)]+)\)/);
                if (sw_coords) {
                    sw_lng = sw_coords[1].trim(); // Primer valor es longitud
                    sw_lat = sw_coords[2].trim(); // Segundo valor es latitud
                }
            }

            setFormData({
                location_name: location.location_name || '',
                display_name: location.display_name || '',
                canonical_name: location.canonical_name || '',
                location_type: location.location_type || '',
                parent_location_id: location.parent_location_id || '',
                description: location.description || '',
                short_description: location.short_description || '',
                seo_title: location.seo_title || '',
                seo_description: location.seo_description || '',
                status: location.status || 'active',
                featured: location.featured || false,
                sort_order: location.sort_order || 0,
                popularity_score: location.popularity_score || 50,
                coordinates_lat: lat,
                coordinates_lng: lng,
                bounds_northeast_lat: ne_lat,
                bounds_northeast_lng: ne_lng,
                bounds_southwest_lat: sw_lat,
                bounds_southwest_lng: sw_lng
            });
            
            // Cargar tag asociado
            fetchLocationTag();
        }
    }, [location]);

    const fetchLocationTag = async () => {
        if (!location?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('location_insight_id', location.id)
                .single();
            
            if (data && !error) {
                setLocationTag(data);
            } else {
                setLocationTag(null);
            }
        } catch (error) {
            console.log('No tag found for this location');
            setLocationTag(null);
        }
    };

    const handleCoordinatesSelect = (coordinates) => {
        setFormData(prev => ({
            ...prev,
            coordinates_lat: coordinates.lat.toString(),
            coordinates_lng: coordinates.lng.toString()
        }));
    };

    const getCurrentCoordinates = () => {
        if (formData.coordinates_lat && formData.coordinates_lng) {
            return {
                lat: parseFloat(formData.coordinates_lat),
                lng: parseFloat(formData.coordinates_lng)
            };
        }
        return null;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Preparar coordenadas para guardar
            const saveData = { ...formData };
            
            // Convertir coordenadas al formato POINT de PostgreSQL (lng, lat)
            if (formData.coordinates_lat && formData.coordinates_lng) {
                saveData.coordinates = `(${formData.coordinates_lng},${formData.coordinates_lat})`;
            }
            if (formData.bounds_northeast_lat && formData.bounds_northeast_lng) {
                saveData.bounds_northeast = `(${formData.bounds_northeast_lng},${formData.bounds_northeast_lat})`;
            }
            if (formData.bounds_southwest_lat && formData.bounds_southwest_lng) {
                saveData.bounds_southwest = `(${formData.bounds_southwest_lng},${formData.bounds_southwest_lat})`;
            }
            
            // Remover los campos temporales de coordenadas
            delete saveData.coordinates_lat;
            delete saveData.coordinates_lng;
            delete saveData.bounds_northeast_lat;
            delete saveData.bounds_northeast_lng;
            delete saveData.bounds_southwest_lat;
            delete saveData.bounds_southwest_lng;

            await onSave(location.id, saveData);
            setEditMode(false);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleTagSelection = async (selectedTag) => {
        setTagLoading(true);
        try {
            // Si se deselecciona el tag actual
            if (!selectedTag && locationTag) {
                const { error } = await supabase
                    .from('tags')
                    .update({ location_insight_id: null })
                    .eq('id', locationTag.id);
                
                if (error) throw error;
                setLocationTag(null);
            }
            // Si se selecciona un nuevo tag
            else if (selectedTag) {
                // Primero desasignar el tag actual si existe
                if (locationTag) {
                    await supabase
                        .from('tags')
                        .update({ location_insight_id: null })
                        .eq('id', locationTag.id);
                }
                
                // Asignar el nuevo tag
                const { error } = await supabase
                    .from('tags')
                    .update({ location_insight_id: location.id })
                    .eq('id', selectedTag.id);
                
                if (error) throw error;
                setLocationTag(selectedTag);
            }
            
            // Recargar el tag para asegurar sincronización
            await fetchLocationTag();
            
        } catch (error) {
            console.error('Error managing tag:', error);
            alert('Error al gestionar el tag: ' + error.message);
        } finally {
            setTagLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!editMode) {
            // Cambio rápido de status sin entrar en modo edición
            setSaving(true);
            try {
                const { error } = await supabase
                    .from('location_insights')
                    .update({ 
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', location.id);

                if (error) throw error;

                // Actualizar el estado local
                setFormData(prev => ({ ...prev, status: newStatus }));
                
                // Refrescar la ubicación
                await onSave(location.id, { status: newStatus });
                
            } catch (error) {
                console.error('Error updating status:', error);
                alert('Error al cambiar el estado: ' + error.message);
            } finally {
                setSaving(false);
            }
        } else {
            // Si estamos en modo edición, solo actualizar el formulario
            setFormData(prev => ({ ...prev, status: newStatus }));
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta ubicación? Esta acción no se puede deshacer.')) {
            try {
                await onDelete(location.id);
                onBack();
            } catch (error) {
                console.error('Error deleting:', error);
                alert('Error al eliminar la ubicación');
            }
        }
    };

    const getAvailableParents = () => {
        const currentType = formData.location_type;
        const hierarchy = ['country', 'province', 'city', 'sector', 'neighborhood'];
        const currentIndex = hierarchy.indexOf(currentType);
        
        if (currentIndex <= 0) return [];
        
        const parentType = hierarchy[currentIndex - 1];
        return locations.filter(loc => 
            loc.location_type === parentType && 
            loc.status === 'active' && 
            loc.id !== location?.id
        );
    };

    const getChildren = () => {
        return locations.filter(loc => loc.parent_location_id === location?.id);
    };

    if (!location) return null;

    return (
        <div className="max-w-full mx-auto px-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        icon={<ArrowLeft className="w-4 h-4" />}
                    >
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {location.display_name || location.location_name}
                        </h1>
                        <LocationHierarchy location={location} locations={locations} />
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {!editMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditMode(true)}
                                icon={<Edit3 className="w-4 h-4" />}
                            >
                                Editar
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                icon={<Trash className="w-4 h-4" />}
                            >
                                Eliminar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditMode(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleSave}
                                disabled={saving}
                                icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Información principal - 3 columnas en XL */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Datos básicos */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-500" />
                            Información Básica
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la ubicación *
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.location_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.location_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre para mostrar
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.display_name || '-'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de ubicación *
                                </label>
                                {editMode ? (
                                    <select
                                        value={formData.location_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location_type: e.target.value, parent_location_id: '' }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        {locationTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-gray-900 capitalize">
                                        {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado *
                                </label>
                                {editMode ? (
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="draft">Borrador</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={location.status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            disabled={saving}
                                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                            <option value="draft">Borrador</option>
                                        </select>
                                        {saving && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
                                        {location.featured && <Badge variant="info">Destacada</Badge>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag asociado
                                </label>
                                {editMode ? (
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowTagModal(true)}
                                            disabled={tagLoading}
                                            icon={tagLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                                            className="w-full justify-start"
                                        >
                                            {locationTag ? (
                                                <div className="flex items-center space-x-2">
                                                    {locationTag.icon && <span>{locationTag.icon}</span>}
                                                    <span>{locationTag.display_name || locationTag.name}</span>
                                                    <Badge variant="info" className="ml-auto">Asignado</Badge>
                                                </div>
                                            ) : (
                                                'Seleccionar tag de ubicación'
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        {locationTag ? (
                                            <div className="flex items-center space-x-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: locationTag.color || '#6B7280' }}
                                                />
                                                {locationTag.icon && <span>{locationTag.icon}</span>}
                                                <span className="font-medium">{locationTag.display_name || locationTag.name}</span>
                                                <Badge variant="info">{locationTag.category}</Badge>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">Sin tag asignado</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {editMode && (
                            <div className="mt-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Ubicación destacada</span>
                                </label>
                            </div>
                        )}
                    </Card>

                    {/* Coordenadas */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Map className="w-5 h-5 mr-2 text-green-500" />
                            Coordenadas Geográficas
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Coordenadas Principales</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            Coordenadas GPS
                                        </span>
                                        {editMode && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowCoordinatesModal(true)}
                                                icon={<Map className="w-4 h-4" />}
                                            >
                                                {getCurrentCoordinates() ? 'Cambiar' : 'Seleccionar'} en Mapa
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Latitud
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={formData.coordinates_lat}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lat: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="18.4861"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-mono text-sm">
                                                    {formData.coordinates_lat || 'No definida'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Longitud
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={formData.coordinates_lng}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lng: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="-69.9312"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-mono text-sm">
                                                    {formData.coordinates_lng || 'No definida'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {getCurrentCoordinates() && (
                                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-800 font-medium">
                                                    Coordenadas configuradas
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-green-700 font-mono">
                                                📍 {getCurrentCoordinates().lat.toFixed(6)}, {getCurrentCoordinates().lng.toFixed(6)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Descripciones */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-green-500" />
                            Descripciones
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción completa
                                </label>
                                {editMode ? (
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Descripción detallada de la ubicación"
                                    />
                                ) : (
                                    <p className="text-gray-900 whitespace-pre-wrap">{location.description || 'Sin descripción'}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                            Estadísticas
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <Badge variant={location.status === 'active' ? 'success' : location.status === 'inactive' ? 'warning' : 'danger'}>
                                    {location.status}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de selección de coordenadas */}
            <CoordinatesMapModal
                isOpen={showCoordinatesModal}
                onClose={() => setShowCoordinatesModal(false)}
                onSelect={handleCoordinatesSelect}
                initialCoordinates={getCurrentCoordinates()}
            />

            {/* Modal de selección de tags */}
            <TagSelectionModal
                isOpen={showTagModal}
                onClose={() => setShowTagModal(false)}
                onSelect={handleTagSelection}
                currentTag={locationTag}
                locationId={location?.id}
            />
        </div>
    );
};

// Componente para crear nueva ubicación
const CreateLocation = ({ locations, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        location_name: '',
        display_name: '',
        canonical_name: '',
        location_type: '',
        parent_location_id: '',
        description: '',
        short_description: '',
        seo_title: '',
        seo_description: '',
        status: 'active',
        featured: false,
        sort_order: 0,
        popularity_score: 50,
        coordinates_lat: '',
        coordinates_lng: ''
    });
    const [saving, setSaving] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [showTagModal, setShowTagModal] = useState(false);
    const [showCoordinatesModal, setShowCoordinatesModal] = useState(false);

    const locationTypes = [
        { value: 'country', label: 'País', icon: Globe },
        { value: 'province', label: 'Provincia', icon: MapPin },
        { value: 'city', label: 'Ciudad', icon: Building },
        { value: 'sector', label: 'Sector', icon: Navigation },
        { value: 'neighborhood', label: 'Barrio', icon: Home }
    ];

    const handleTagSelection = (tag) => {
        setSelectedTag(tag);
    };

    const handleCoordinatesSelect = (coordinates) => {
        setFormData(prev => ({
            ...prev,
            coordinates_lat: coordinates.lat.toString(),
            coordinates_lng: coordinates.lng.toString()
        }));
    };

    const getCurrentCoordinates = () => {
        if (formData.coordinates_lat && formData.coordinates_lng) {
            return {
                lat: parseFloat(formData.coordinates_lat),
                lng: parseFloat(formData.coordinates_lng)
            };
        }
        return null;
    };

    const handleSave = async () => {
        if (!formData.location_name.trim() || !formData.location_type) {
            alert('El nombre y tipo de ubicación son obligatorios');
            return;
        }

        setSaving(true);
        try {
            const saveData = { ...formData };
            
            // Convertir coordenadas al formato POINT de PostgreSQL (lng, lat)
            if (formData.coordinates_lat && formData.coordinates_lng) {
                saveData.coordinates = `(${formData.coordinates_lng},${formData.coordinates_lat})`;
            }
            
            delete saveData.coordinates_lat;
            delete saveData.coordinates_lng;

            const newLocation = await onSave(saveData);
            
            if (selectedTag && newLocation) {
                await supabase
                    .from('tags')
                    .update({ location_insight_id: newLocation.id })
                    .eq('id', selectedTag.id);
            }
            
        } catch (error) {
            console.error('Error creating location:', error);
            alert('Error al crear la ubicación');
        } finally {
            setSaving(false);
        }
    };

    const getAvailableParents = () => {
        const currentType = formData.location_type;
        const hierarchy = ['country', 'province', 'city', 'sector', 'neighborhood'];
        const currentIndex = hierarchy.indexOf(currentType);
        
        if (currentIndex <= 0) return [];
        
        const parentType = hierarchy[currentIndex - 1];
        return locations.filter(loc => 
            loc.location_type === parentType && 
            loc.status === 'active'
        );
    };

    return (
        <div className="max-w-full mx-auto px-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Ubicación</h1>
                    <p className="text-gray-600">Añade una nueva ubicación al sistema</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving || !formData.location_name.trim() || !formData.location_type}
                        icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        {saving ? 'Creando...' : 'Crear Ubicación'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-500" />
                            Información Básica *
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la ubicación *
                                </label>
                                <input
                                    type="text"
                                    value={formData.location_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Ej: Santo Domingo Este"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de ubicación *
                                </label>
                                <select
                                    value={formData.location_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location_type: e.target.value, parent_location_id: '' }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                >
                                    <option value="">Seleccionar tipo</option>
                                    {locationTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación padre
                                </label>
                                <select
                                    value={formData.parent_location_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, parent_location_id: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={!formData.location_type}
                                >
                                    <option value="">Sin padre</option>
                                    {getAvailableParents().map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.display_name || parent.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag asociado
                                </label>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTagModal(true)}
                                    icon={<Tag className="w-4 h-4" />}
                                    className="w-full justify-start"
                                >
                                    {selectedTag ? (
                                        <div className="flex items-center space-x-2">
                                            {selectedTag.icon && <span>{selectedTag.icon}</span>}
                                            <span>{selectedTag.display_name || selectedTag.name}</span>
                                        </div>
                                    ) : (
                                        'Seleccionar tag de ubicación'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Map className="w-5 h-5 mr-2 text-green-500" />
                            Coordenadas Geográficas
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    Coordenadas GPS
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCoordinatesModal(true)}
                                    icon={<Map className="w-4 h-4" />}
                                >
                                    {getCurrentCoordinates() ? 'Cambiar' : 'Seleccionar'} en Mapa
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Latitud
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.coordinates_lat}
                                        onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lat: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="18.4861"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Longitud
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.coordinates_lng}
                                        onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lng: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="-69.9312"
                                    />
                                </div>
                            </div>

                            {getCurrentCoordinates() && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-800 font-medium">
                                            Coordenadas configuradas
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-green-700 font-mono">
                                        📍 {getCurrentCoordinates().lat.toFixed(6)}, {getCurrentCoordinates().lng.toFixed(6)}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <strong>Tip:</strong> Usa el botón "Seleccionar en Mapa" para elegir la ubicación exacta 
                                        de forma visual y precisa. También puedes ingresar las coordenadas manualmente.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-green-500" />
                            Descripciones
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción completa
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción detallada de la ubicación"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Eye className="w-5 h-5 mr-2 text-blue-500" />
                            Vista Previa
                        </h3>
                        
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="font-medium text-gray-900">
                                {formData.display_name || formData.location_name || 'Nombre de ubicación'}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                                {locationTypes.find(t => t.value === formData.location_type)?.label || 'Tipo de ubicación'}
                            </div>
                            {formData.description && (
                                <div className="text-sm text-gray-700 mt-2">
                                    {formData.description.substring(0, 100)}...
                                </div>
                            )}
                            {getCurrentCoordinates() && (
                                <div className="text-xs text-gray-500 mt-2 font-mono">
                                    📍 {getCurrentCoordinates().lat.toFixed(6)}, {getCurrentCoordinates().lng.toFixed(6)}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                            Validación
                        </h3>
                        
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                {formData.location_name.trim() ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm">Nombre de ubicación</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {formData.location_type ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm">Tipo de ubicación</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {(formData.coordinates_lat && formData.coordinates_lng) ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-sm">Coordenadas GPS</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de selección de coordenadas */}
            <CoordinatesMapModal
                isOpen={showCoordinatesModal}
                onClose={() => setShowCoordinatesModal(false)}
                onSelect={handleCoordinatesSelect}
                initialCoordinates={getCurrentCoordinates()}
            />

            <TagSelectionModal
                isOpen={showTagModal}
                onClose={() => setShowTagModal(false)}
                onSelect={handleTagSelection}
                currentTag={selectedTag}
                locationId={null}
            />
        </div>
    );
};

export { LocationDetail, CreateLocation };