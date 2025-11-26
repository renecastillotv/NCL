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
import { supabase } from '../services/api';
import Button from './ui/Button';
import { TagSelectionModal } from './modals/TagSelectionModal';

// Componentes UI básicos (Button se importa de ui/)
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

const Tab = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            active
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
    </button>
);

// Componente Modal para selección de tags
const TagSelectionModal = ({ isOpen, onClose, onSelect, currentTag, locationId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchLocationTags();
        }
    }, [isOpen]);

    const fetchLocationTags = async () => {
        setLoading(true);
        try {
            console.log('🔍 Buscando tags de ubicaciones (sector y ciudad)...');
            
            // Buscar tags con categorías "sector" y "ciudad"
            const { data: locationTags, error } = await supabase
                .from('tags')
                .select('*')
                .eq('active', true)
                .in('category', ['sector', 'ciudad'])
                .order('category', { ascending: true })
                .order('name', { ascending: true });
            
            if (error) {
                console.error('❌ Error en consulta principal:', error);
                throw error;
            }
            
            console.log('🏷️ Tags encontrados:', locationTags);
            console.log('📊 Por categoría:', {
                sector: locationTags?.filter(t => t.category === 'sector').length || 0,
                ciudad: locationTags?.filter(t => t.category === 'ciudad').length || 0
            });
            
            // Si no encuentra nada, hacer debugging
            if (!locationTags || locationTags.length === 0) {
                console.log('⚠️ No se encontraron tags con categorías "sector" o "ciudad"');
                
                // Verificar qué categorías existen
                const { data: allTags } = await supabase
                    .from('tags')
                    .select('category')
                    .eq('active', true);
                
                const uniqueCategories = [...new Set(allTags?.map(tag => tag.category) || [])];
                console.log('📋 Categorías disponibles en la base de datos:', uniqueCategories);
                
                // Sugerir categorías similares
                const similarCategories = uniqueCategories.filter(cat => 
                    cat.toLowerCase().includes('sect') || 
                    cat.toLowerCase().includes('ciudad') ||
                    cat.toLowerCase().includes('city') ||
                    cat.toLowerCase().includes('location') ||
                    cat.toLowerCase().includes('ubicacion')
                );
                
                if (similarCategories.length > 0) {
                    console.log('💡 Categorías similares encontradas:', similarCategories);
                }
                
                setAvailableTags([]);
            } else {
                setAvailableTags(locationTags);
            }
            
        } catch (error) {
            console.error('❌ Error fetching location tags:', error);
            
            // Fallback: intentar obtener todos los tags para debugging
            try {
                const { data: debugTags } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('active', true)
                    .limit(10);
                
                console.log('🔧 Debug - Primeros 10 tags activos:', debugTags);
                setAvailableTags([]);
            } catch (debugError) {
                console.error('❌ Error en debug fallback:', debugError);
                setAvailableTags([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredTags = availableTags.filter(tag => {
        console.log('🔍 Filtrando tag:', tag.name, {
            searchTerm,
            tag,
            matchesSearch: !searchTerm || 
                tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tag.display_name && tag.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (tag.slug && tag.slug.toLowerCase().includes(searchTerm.toLowerCase())),
            isNotAssigned: !tag.location_insight_id || tag.id === currentTag?.id
        });

        const matchesSearch = !searchTerm || 
            tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tag.display_name && tag.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (tag.slug && tag.slug.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const isNotAssigned = !tag.location_insight_id || tag.id === currentTag?.id;
        
        return matchesSearch && isNotAssigned;
    });

    console.log('🏷️ Tags después del filtrado:', filteredTags);
    console.log('📊 Filtrado - Total disponibles:', availableTags.length, 'Después del filtro:', filteredTags.length);

    const handleSelect = async (tag) => {
        await onSelect(tag);
        onClose();
    };

    const handleRemoveTag = async () => {
        await onSelect(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Seleccionar Tag de Ubicación
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        icon={<X className="w-4 h-4" />}
                    />
                </div>

                {/* Search and filters */}
                <div className="p-4 border-b space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar tags por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    {currentTag && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-blue-900">Tag actual:</span>
                                <div className="flex items-center space-x-1">
                                    {currentTag.icon && <span>{currentTag.icon}</span>}
                                    <span className="font-medium">{currentTag.display_name || currentTag.name}</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveTag}
                                icon={<X className="w-4 h-4" />}
                            >
                                Quitar Tag
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Cargando tags...</span>
                        </div>
                    ) : filteredTags.length === 0 ? (
                        <div className="text-center py-8">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                                {availableTags.length === 0 ? 'No se encontraron tags' : 'No hay resultados'}
                            </h4>
                            <p className="text-gray-600">
                                {availableTags.length === 0 
                                    ? 'No hay tags con categorías "sector" o "ciudad" disponibles'
                                    : searchTerm 
                                        ? `No se encontraron tags que coincidan con "${searchTerm}"`
                                        : 'Todos los tags están asignados a otras ubicaciones'
                                }
                            </p>
                            {availableTags.length === 0 && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                                    <p className="text-sm text-blue-800">
                                        <strong>Se buscan tags con:</strong>
                                        <br />• active = true
                                        <br />• category = "sector" O "ciudad"
                                        <br /><br />
                                        <strong>Revisa la consola</strong> para ver las categorías disponibles en tu base de datos.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredTags.map(tag => (
                                <div
                                    key={tag.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                                        currentTag?.id === tag.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}
                                    onClick={() => handleSelect(tag)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: tag.color || '#6B7280' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                {tag.icon && <span className="text-lg">{tag.icon}</span>}
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {tag.display_name || tag.name}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {tag.slug}
                                            </p>
                                            {tag.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {tag.description}
                                                </p>
                                            )}
                                        </div>
                                        {tag.location_insight_id && tag.id !== currentTag?.id && (
                                            <div className="text-xs text-yellow-600 font-medium">
                                                Asignado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {filteredTags.length} de {availableTags.length} tag{availableTags.length !== 1 ? 's' : ''} mostrado{filteredTags.length !== 1 ? 's' : ''}
                            {availableTags.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Sector: {availableTags.filter(t => t.category === 'sector').length} | 
                                    Ciudad: {availableTags.filter(t => t.category === 'ciudad').length}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
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

// Componente de detalles y edición
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
                    lat = coords[1].trim();
                    lng = coords[2].trim();
                }
            }
            
            if (location.bounds_northeast) {
                const ne_coords = location.bounds_northeast.match(/\(([^,]+),([^)]+)\)/);
                if (ne_coords) {
                    ne_lat = ne_coords[1].trim();
                    ne_lng = ne_coords[2].trim();
                }
            }
            
            if (location.bounds_southwest) {
                const sw_coords = location.bounds_southwest.match(/\(([^,]+),([^)]+)\)/);
                if (sw_coords) {
                    sw_lat = sw_coords[1].trim();
                    sw_lng = sw_coords[2].trim();
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

    const handleSave = async () => {
        setSaving(true);
        try {
            // Preparar coordenadas para guardar
            const saveData = { ...formData };
            
            // Convertir coordenadas al formato POINT de PostgreSQL
            if (formData.coordinates_lat && formData.coordinates_lng) {
                saveData.coordinates = `(${formData.coordinates_lat},${formData.coordinates_lng})`;
            }
            if (formData.bounds_northeast_lat && formData.bounds_northeast_lng) {
                saveData.bounds_northeast = `(${formData.bounds_northeast_lat},${formData.bounds_northeast_lng})`;
            }
            if (formData.bounds_southwest_lat && formData.bounds_southwest_lng) {
                saveData.bounds_southwest = `(${formData.bounds_southwest_lat},${formData.bounds_southwest_lng})`;
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
                                    Nombre canónico
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.canonical_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, canonical_name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.canonical_name || '-'}</p>
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
                                    Ubicación padre
                                </label>
                                {editMode ? (
                                    <select
                                        value={formData.parent_location_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_location_id: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Sin padre</option>
                                        {getAvailableParents().map(parent => (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.display_name || parent.location_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-gray-900">
                                        {location.parent_location_id 
                                            ? locations.find(l => l.id === location.parent_location_id)?.display_name || 
                                              locations.find(l => l.id === location.parent_location_id)?.location_name || 'No encontrado'
                                            : 'Sin padre'
                                        }
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
                                    Puntuación de popularidad (0-100)
                                </label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.popularity_score}
                                        onChange={(e) => setFormData(prev => ({ ...prev, popularity_score: parseInt(e.target.value) || 0 }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.popularity_score || 0}/100</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Orden de clasificación
                                </label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.sort_order || 0}</p>
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
                                        {locationTag && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTagSelection(null)}
                                                disabled={tagLoading}
                                                icon={<X className="w-4 h-4" />}
                                                className="w-full text-red-600 hover:text-red-700"
                                            >
                                                Quitar tag actual
                                            </Button>
                                        )}
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowTagModal(true)}
                                            disabled={tagLoading}
                                            icon={<Edit className="w-3 h-3" />}
                                        >
                                            {locationTag ? 'Cambiar' : 'Asignar'}
                                        </Button>
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
                            {/* Coordenadas principales */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Coordenadas Principales</h4>
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
                            </div>

                            {/* Límites del área */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Límites del Área</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Noreste (Lat, Lng)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {editMode ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={formData.bounds_northeast_lat}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, bounds_northeast_lat: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="18.500"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={formData.bounds_northeast_lng}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, bounds_northeast_lng: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="-69.900"
                                                    />
                                                </>
                                            ) : (
                                                <p className="text-gray-900 font-mono text-sm col-span-2">
                                                    {formData.bounds_northeast_lat && formData.bounds_northeast_lng
                                                        ? `${formData.bounds_northeast_lat}, ${formData.bounds_northeast_lng}`
                                                        : 'No definido'
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Suroeste (Lat, Lng)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {editMode ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={formData.bounds_southwest_lat}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, bounds_southwest_lat: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="18.450"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={formData.bounds_southwest_lng}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, bounds_southwest_lng: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="-69.950"
                                                    />
                                                </>
                                            ) : (
                                                <p className="text-gray-900 font-mono text-sm col-span-2">
                                                    {formData.bounds_southwest_lat && formData.bounds_southwest_lng
                                                        ? `${formData.bounds_southwest_lat}, ${formData.bounds_southwest_lng}`
                                                        : 'No definido'
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {!editMode && !formData.coordinates_lat && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center text-yellow-800">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    <span className="text-sm">No se han definido coordenadas para esta ubicación</span>
                                </div>
                            </div>
                        )}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción corta
                                </label>
                                {editMode ? (
                                    <textarea
                                        value={formData.short_description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                                        rows={2}
                                        maxLength={500}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Resumen breve (máx. 500 caracteres)"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.short_description || 'Sin descripción corta'}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* SEO */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Search className="w-5 h-5 mr-2 text-purple-500" />
                            SEO
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título SEO
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={formData.seo_title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                                        maxLength={255}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Título optimizado para SEO"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.seo_title || 'Sin título SEO'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción SEO
                                </label>
                                {editMode ? (
                                    <textarea
                                        value={formData.seo_description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Meta descripción para buscadores"
                                    />
                                ) : (
                                    <p className="text-gray-900">{location.seo_description || 'Sin meta descripción'}</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar con información adicional - 1 columna en XL */}
                <div className="space-y-6">
                    {/* Estadísticas */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                            Estadísticas
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Usos:</span>
                                <span className="font-medium">{location.usage_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Popularidad:</span>
                                <span className="font-medium">{location.popularity_score || 0}/100</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Propiedades:</span>
                                <span className="font-medium">{location.property_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Orden:</span>
                                <span className="font-medium">{location.sort_order || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <Badge variant={location.status === 'active' ? 'success' : location.status === 'inactive' ? 'warning' : 'danger'}>
                                    {location.status}
                                </Badge>
                            </div>
                            {location.featured && (
                                <div className="pt-2 border-t">
                                    <Badge variant="info" className="w-full justify-center">
                                        <Star className="w-3 h-3 mr-1" />
                                        Ubicación Destacada
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Tag asociado */}
                    {locationTag && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Tag className="w-5 h-5 mr-2 text-purple-500" />
                                Tag Asociado
                            </h3>
                            
                            <div 
                                className="p-3 rounded-lg border"
                                style={{ 
                                    backgroundColor: locationTag.color ? `${locationTag.color}15` : '#f3f4f6',
                                    borderColor: locationTag.color || '#d1d5db'
                                }}
                            >
                                <div className="flex items-center space-x-2 mb-2">
                                    {locationTag.icon && <span className="text-lg">{locationTag.icon}</span>}
                                    <span className="font-medium">{locationTag.display_name || locationTag.name}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div>Categoría: {locationTag.category}</div>
                                    <div>Slug: {locationTag.slug}</div>
                                    {locationTag.description && (
                                        <div className="mt-2 text-xs">{locationTag.description}</div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Metadatos */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                            Metadatos
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-600">ID:</span>
                                <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                                    {location.id}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600">Creado:</span>
                                <div className="text-gray-900">
                                    {location.created_at ? new Date(location.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'No disponible'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600">Actualizado:</span>
                                <div className="text-gray-900">
                                    {location.updated_at ? new Date(location.updated_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'No disponible'}
                                </div>
                            </div>
                            {location.last_used_at && (
                                <div>
                                    <span className="text-gray-600">Último uso:</span>
                                    <div className="text-gray-900">
                                        {new Date(location.last_used_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Ubicaciones hijas */}
                    {getChildren().length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Navigation className="w-5 h-5 mr-2 text-green-500" />
                                Ubicaciones Hijas ({getChildren().length})
                            </h3>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {getChildren().map(child => (
                                    <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{child.display_name || child.location_name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{child.location_type}</div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={child.status === 'active' ? 'success' : 'warning'}>
                                                {child.status}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {}}
                                                icon={<Eye className="w-3 h-3" />}
                                            >
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

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
        coordinates_lng: '',
        bounds_northeast_lat: '',
        bounds_northeast_lng: '',
        bounds_southwest_lat: '',
        bounds_southwest_lng: ''
    });
    const [saving, setSaving] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [showTagModal, setShowTagModal] = useState(false);

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

    const handleSave = async () => {
        if (!formData.location_name.trim() || !formData.location_type) {
            alert('El nombre y tipo de ubicación son obligatorios');
            return;
        }

        setSaving(true);
        try {
            // Preparar datos para guardar
            const saveData = { ...formData };
            
            // Convertir coordenadas al formato POINT de PostgreSQL si están completas
            if (formData.coordinates_lat && formData.coordinates_lng) {
                saveData.coordinates = `(${formData.coordinates_lat},${formData.coordinates_lng})`;
            }
            if (formData.bounds_northeast_lat && formData.bounds_northeast_lng) {
                saveData.bounds_northeast = `(${formData.bounds_northeast_lat},${formData.bounds_northeast_lng})`;
            }
            if (formData.bounds_southwest_lat && formData.bounds_southwest_lng) {
                saveData.bounds_southwest = `(${formData.bounds_southwest_lat},${formData.bounds_southwest_lng})`;
            }
            
            // Remover los campos temporales de coordenadas
            delete saveData.coordinates_lat;
            delete saveData.coordinates_lng;
            delete saveData.bounds_northeast_lat;
            delete saveData.bounds_northeast_lng;
            delete saveData.bounds_southwest_lat;
            delete saveData.bounds_southwest_lng;

            // Crear la ubicación
            const newLocation = await onSave(saveData);
            
            // Si se seleccionó un tag, asignarlo
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
                {/* Formulario principal - 3 columnas en XL */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Datos básicos */}
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
                                    Nombre para mostrar
                                </label>
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Ej: Santo Domingo Este"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre canónico
                                </label>
                                <input
                                    type="text"
                                    value={formData.canonical_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, canonical_name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Versión normalizada del nombre"
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
                                {formData.location_type && getAvailableParents().length === 0 && formData.location_type !== 'country' && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        No hay ubicaciones padre disponibles para este tipo
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                    <option value="draft">Borrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Puntuación de popularidad (0-100)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.popularity_score}
                                    onChange={(e) => setFormData(prev => ({ ...prev, popularity_score: parseInt(e.target.value) || 0 }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Orden de clasificación
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag asociado
                                </label>
                                <div className="space-y-2">
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
                                                <Badge variant="info" className="ml-auto">Seleccionado</Badge>
                                            </div>
                                        ) : (
                                            'Seleccionar tag de ubicación'
                                        )}
                                    </Button>
                                    {selectedTag && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedTag(null)}
                                            icon={<X className="w-4 h-4" />}
                                            className="w-full text-red-600 hover:text-red-700"
                                        >
                                            Quitar tag seleccionado
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Marcar como ubicación destacada</span>
                            </label>
                        </div>
                    </Card>

                    {/* Coordenadas */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Map className="w-5 h-5 mr-2 text-green-500" />
                            Coordenadas Geográficas
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Coordenadas principales */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Coordenadas Principales</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Latitud
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
                            </div>

                            {/* Límites del área */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Límites del Área (Opcional)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Noreste (Lat, Lng)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.bounds_northeast_lat}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bounds_northeast_lat: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="18.500"
                                            />
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.bounds_northeast_lng}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bounds_northeast_lng: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="-69.900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Suroeste (Lat, Lng)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.bounds_southwest_lat}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bounds_southwest_lat: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="18.450"
                                            />
                                            <input
                                                type="number"
                                                step="any"
                                                value={formData.bounds_southwest_lng}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bounds_southwest_lng: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="-69.950"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <strong>Coordenadas:</strong> Las coordenadas principales definen el punto central de la ubicación. 
                                    Los límites son opcionales y definen el área geográfica que abarca la ubicación.
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
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción detallada de la ubicación, características, qué la hace especial..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción corta (máx. 500 caracteres)
                                </label>
                                <textarea
                                    value={formData.short_description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                                    rows={2}
                                    maxLength={500}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Resumen breve para mostrar en listados"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {formData.short_description.length}/500
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* SEO */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Search className="w-5 h-5 mr-2 text-purple-500" />
                            Optimización SEO
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título SEO (máx. 255 caracteres)
                                </label>
                                <input
                                    type="text"
                                    value={formData.seo_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                                    maxLength={255}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Ej: Propiedades en Santo Domingo Este - Zona Residencial"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {formData.seo_title.length}/255
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Meta descripción SEO
                                </label>
                                <textarea
                                    value={formData.seo_description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción que aparecerá en los resultados de búsqueda"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Preview y ayuda - 1 columna en XL */}
                <div className="space-y-6">
                    {/* Preview */}
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
                            {formData.parent_location_id && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Padre: {getAvailableParents().find(p => p.id === formData.parent_location_id)?.display_name || 'Ubicación padre'}
                                </div>
                            )}
                            {formData.short_description && (
                                <div className="text-sm text-gray-700 mt-2">
                                    {formData.short_description}
                                </div>
                            )}
                            <div className="flex items-center mt-2 space-x-2">
                                <Badge variant={formData.status === 'active' ? 'success' : formData.status === 'inactive' ? 'warning' : 'danger'}>
                                    {formData.status}
                                </Badge>
                                {formData.featured && (
                                    <Badge variant="info">Destacada</Badge>
                                )}
                                {selectedTag && selectedTag !== 'none' && (
                                    <Badge variant="info">
                                        {selectedTag.display_name || selectedTag.name}
                                    </Badge>
                                )}
                            </div>
                            {(formData.coordinates_lat && formData.coordinates_lng) && (
                                <div className="text-xs text-gray-500 mt-2 font-mono">
                                    📍 {formData.coordinates_lat}, {formData.coordinates_lng}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Ayuda */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
                            Ayuda
                        </h3>
                        
                        <div className="space-y-3 text-sm text-gray-600">
                            <div>
                                <strong>Jerarquía:</strong> Country → Province → City → Sector → Neighborhood
                            </div>
                            <div>
                                <strong>Nombres:</strong> 
                                <ul className="list-disc ml-4 mt-1">
                                    <li><em>location_name:</em> Nombre oficial</li>
                                    <li><em>display_name:</em> Nombre para mostrar</li>
                                    <li><em>canonical_name:</em> Versión normalizada</li>
                                </ul>
                            </div>
                            <div>
                                <strong>Coordenadas:</strong> Formato decimal (ej: 18.4861, -69.9312)
                            </div>
                            <div>
                                <strong>Popularidad:</strong> 0-100, usado para ordenar y recomendar ubicaciones
                            </div>
                            <div>
                                <strong>Tags:</strong> Etiquetas temáticas que se pueden asociar a la ubicación
                            </div>
                            <div>
                                <strong>SEO:</strong> Ayuda a que la ubicación aparezca en búsquedas
                            </div>
                        </div>
                    </Card>

                    {/* Estado de validación */}
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
                                {(formData.location_type === 'country' || formData.parent_location_id) ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-sm">Jerarquía válida</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {(formData.coordinates_lat && formData.coordinates_lng) ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-sm">Coordenadas (opcional)</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de selección de tags */}
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

// Componente para cada grupo de duplicados
const DuplicateGroup = ({ group, onMerge, merging }) => {
    const [selectedKeep, setSelectedKeep] = useState(group.items[0]?.id);
    const [expanded, setExpanded] = useState(false);

    const handleMerge = () => {
        if (!selectedKeep) {
            alert('Por favor selecciona qué ubicación mantener');
            return;
        }

        const removeIds = group.items
            .filter(item => item.id !== selectedKeep)
            .map(item => item.id);

        if (removeIds.length === 0) {
            alert('No hay duplicados para fusionar');
            return;
        }

        const confirmMessage = `¿Confirmas fusionar ${group.name}?\n\n` +
            `✅ Mantener: ${group.items.find(item => item.id === selectedKeep)?.location_name}\n` +
            `❌ Fusionar: ${removeIds.length} duplicados\n\n` +
            `Esta acción no se puede deshacer fácilmente.`;

        if (window.confirm(confirmMessage)) {
            console.log('🔄 Iniciando fusión desde componente:', {
                group: group.name,
                selectedKeep,
                removeIds
            });
            onMerge(group, selectedKeep, removeIds);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        {group.type === 'country' && <Globe className="w-4 h-4 text-red-600" />}
                        {group.type === 'province' && <MapPin className="w-4 h-4 text-red-600" />}
                        {group.type === 'city' && <Building className="w-4 h-4 text-red-600" />}
                        {group.type === 'sector' && <Navigation className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">
                            {group.name} ({group.type})
                        </h4>
                        <p className="text-sm text-gray-600">
                            {group.items.length} instancias duplicadas
                        </p>
                        <p className="text-xs text-gray-500">
                            Seleccionado: {group.items.find(item => item.id === selectedKeep)?.location_name || 'Ninguno'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Contraer' : 'Expandir'}
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleMerge}
                        disabled={merging || !selectedKeep}
                        icon={merging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                    >
                        {merging ? 'Fusionando...' : 'Fusionar'}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="space-y-3 mt-4 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                        <strong>Selecciona cuál mantener:</strong> Se fusionarán las demás en esta ubicación.
                    </p>
                    {group.items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedKeep === item.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedKeep(item.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="radio"
                                        checked={selectedKeep === item.id}
                                        onChange={() => setSelectedKeep(item.id)}
                                        className="text-green-600 focus:ring-green-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {item.display_name || item.location_name}
                                            {index === 0 && <Badge variant="success" className="ml-2">Recomendado</Badge>}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            ID: {item.id.substring(0, 8)}... | 
                                            Popularidad: {item.popularity_score || 0} | 
                                            Uso: {item.usage_count || 0} |
                                            Status: {item.status || 'active'}
                                        </div>
                                        {item.parent_location_id && (
                                            <div className="text-xs text-gray-500">
                                                Padre: {item.parent_location_id.substring(0, 8)}...
                                            </div>
                                        )}
                                        {item.canonical_name && item.canonical_name !== item.location_name && (
                                            <div className="text-xs text-blue-600">
                                                Canónico: {item.canonical_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {selectedKeep === item.id && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <strong>Importante:</strong> Esta acción:
                                <ul className="list-disc ml-4 mt-1">
                                    <li>Moverá todos los sectores hijos a la ubicación seleccionada</li>
                                    <li>Transferirá aliases y tags relacionados</li>
                                    <li>Marcará los duplicados como "inactive"</li>
                                    <li>Combinará estadísticas de uso y popularidad</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para ubicaciones huérfanas
const OrphanItem = ({ orphan, locations, onFix }) => {
    const [selectedParent, setSelectedParent] = useState('');
    
    const potentialParents = locations.filter(loc => 
        loc.location_type === 'city' && loc.status === 'active'
    );

    return (
        <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                    <div className="font-medium text-gray-900">{orphan.location_name}</div>
                    <div className="text-sm text-gray-600">
                        {orphan.location_type} • ID: {orphan.id.substring(0, 8)}...
                    </div>
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
                <select
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                    <option value="">Seleccionar ciudad padre</option>
                    {potentialParents.map(parent => (
                        <option key={parent.id} value={parent.id}>
                            {parent.display_name || parent.location_name}
                        </option>
                    ))}
                </select>
                
                <Button
                    variant="warning"
                    size="sm"
                    onClick={() => onFix(orphan, selectedParent)}
                    disabled={!selectedParent}
                    icon={<Check className="w-4 h-4" />}
                >
                    Corregir
                </Button>
            </div>
        </div>
    );
};

// Componente de análisis de duplicados
const DuplicateAnalyzer = ({ locations, onRefresh }) => {
    const [duplicates, setDuplicates] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [merging, setMerging] = useState({});

    useEffect(() => {
        analyzeDuplicates();
    }, [locations]);

    const analyzeDuplicates = () => {
        setAnalyzing(true);
        
        // Detectar duplicados exactos
        const duplicateGroups = {};
        const nameTypeCombos = {};
        
        locations.forEach((location) => {
            const key = `${location.location_name}_${location.location_type}`;
            
            if (nameTypeCombos[key]) {
                if (!duplicateGroups[key]) {
                    duplicateGroups[key] = [nameTypeCombos[key]];
                }
                duplicateGroups[key].push(location);
            } else {
                nameTypeCombos[key] = location;
            }
        });

        // Detectar huérfanos
        const orphansList = locations.filter(location => 
            !location.parent_location_id && location.location_type !== 'country'
        );

        setDuplicates(Object.entries(duplicateGroups).map(([key, items]) => ({
            key,
            name: items[0].location_name,
            type: items[0].location_type,
            items: items.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
        })));
        
        setOrphans(orphansList);
        setAnalyzing(false);
    };

    const mergeDuplicates = async (duplicateGroup, keepId, removeIds) => {
        console.log('🔄 Iniciando fusión:', { group: duplicateGroup.name, keepId, removeIds });
        setMerging(prev => ({ ...prev, [duplicateGroup.key]: true }));
        
        try {
            // Verificar que tenemos IDs válidos
            if (!keepId || !removeIds || removeIds.length === 0) {
                throw new Error('IDs inválidos para la fusión');
            }

            console.log('1. Moviendo relaciones de hijos...');
            // 1. Mover relaciones de hijos al principal
            for (const removeId of removeIds) {
                const { error: childError } = await supabase
                    .from('location_insights')
                    .update({ 
                        parent_location_id: keepId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('parent_location_id', removeId);
                
                if (childError) {
                    console.warn('Error moviendo hijos:', childError);
                }
            }

            console.log('2. Moviendo aliases...');
            // 2. Actualizar aliases al principal (solo si existe la tabla)
            try {
                for (const removeId of removeIds) {
                    const { error: aliasError } = await supabase
                        .from('location_aliases')
                        .update({ 
                            location_insight_id: keepId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('location_insight_id', removeId);
                    
                    if (aliasError && !aliasError.message.includes('relation "location_aliases" does not exist')) {
                        console.warn('Error moviendo aliases:', aliasError);
                    }
                }
            } catch (aliasTableError) {
                console.log('Tabla location_aliases no existe, saltando...');
            }

            console.log('3. Moviendo tags...');
            // 3. Mover content_tags al principal (solo si existen las tablas)
            try {
                for (const removeId of removeIds) {
                    // Primero verificar si existe un tag para la ubicación que vamos a eliminar
                    const { data: tagToDelete } = await supabase
                        .from('tags')
                        .select('id')
                        .eq('location_insight_id', removeId)
                        .single();

                    if (tagToDelete) {
                        // Verificar si ya existe un tag para la ubicación principal
                        const { data: mainTag } = await supabase
                            .from('tags')
                            .select('id')
                            .eq('location_insight_id', keepId)
                            .single();

                        if (mainTag) {
                            // Mover todas las relaciones content_tags al tag principal
                            const { error: contentTagError } = await supabase
                                .from('content_tags')
                                .update({ tag_id: mainTag.id })
                                .eq('tag_id', tagToDelete.id);
                            
                            if (contentTagError && !contentTagError.message.includes('does not exist')) {
                                console.warn('Error moviendo content_tags:', contentTagError);
                            }

                            // Eliminar el tag duplicado
                            await supabase
                                .from('tags')
                                .delete()
                                .eq('id', tagToDelete.id);
                        } else {
                            // Si no existe tag principal, actualizar el tag para que apunte al principal
                            await supabase
                                .from('tags')
                                .update({ location_insight_id: keepId })
                                .eq('id', tagToDelete.id);
                        }
                    }
                }
            } catch (tagTableError) {
                console.log('Tablas de tags no existen o no son accesibles, saltando...');
            }

            console.log('4. Marcando duplicados como inactivos...');
            // 4. Marcar como inactivo en lugar de merged_duplicate (evitar constraint)
            const { error: updateError } = await supabase
                .from('location_insights')
                .update({ 
                    status: 'inactive', // Usar un status válido
                    updated_at: new Date().toISOString()
                })
                .in('id', removeIds);

            if (updateError) {
                throw updateError;
            }

            console.log('5. Actualizando estadísticas del principal...');
            // 5. Actualizar estadísticas del principal
            const totalUsage = duplicateGroup.items.reduce((sum, item) => sum + (item.usage_count || 0), 0);
            const maxPopularity = Math.max(...duplicateGroup.items.map(item => item.popularity_score || 0));

            const { error: statsError } = await supabase
                .from('location_insights')
                .update({
                    usage_count: totalUsage,
                    popularity_score: Math.min(100, maxPopularity + 5),
                    updated_at: new Date().toISOString()
                })
                .eq('id', keepId);

            if (statsError) {
                console.warn('Error actualizando estadísticas:', statsError);
            }

            console.log('✅ Fusión completada exitosamente');
            alert(`✅ Fusión completada: ${duplicateGroup.name}\n${removeIds.length} duplicados marcados como inactivos.`);
            
            // Refrescar datos
            onRefresh();

        } catch (error) {
            console.error('❌ Error en fusión:', error);
            
            // Dar más información sobre el error específico
            let errorMessage = error.message;
            if (error.message.includes('constraint')) {
                errorMessage = `Error de constraint: ${error.message}\n\n` +
                              `Esto indica que el valor 'status' no está permitido.\n` +
                              `Valores válidos posibles: 'active', 'inactive', 'draft'`;
            }
            
            alert(`❌ Error al fusionar duplicados: ${errorMessage}\n\nRevisa la consola para más detalles.`);
        } finally {
            setMerging(prev => ({ ...prev, [duplicateGroup.key]: false }));
        }
    };

    const fixOrphan = async (orphan, newParentId) => {
        try {
            await supabase
                .from('location_insights')
                .update({ 
                    parent_location_id: newParentId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orphan.id);
            
            onRefresh();
        } catch (error) {
            console.error('Error fixing orphan:', error);
        }
    };

    const normalizeNames = async () => {
        try {
            // Normalizar "El Millon" a "El Millón"
            await supabase
                .from('location_insights')
                .update({
                    location_name: 'El Millón',
                    canonical_name: 'El Millón',
                    display_name: 'El Millón',
                    updated_at: new Date().toISOString()
                })
                .ilike('location_name', '%millon%')
                .not('location_name', 'like', '%Millón%');

            onRefresh();
        } catch (error) {
            console.error('Error normalizing names:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center">
                        <Copy className="w-8 h-8 text-red-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{duplicates.length}</div>
                            <div className="text-sm text-gray-600">Grupos duplicados</div>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{orphans.length}</div>
                            <div className="text-sm text-gray-600">Huérfanos</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center">
                        <Database className="w-8 h-8 text-blue-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{locations.length}</div>
                            <div className="text-sm text-gray-600">Total ubicaciones</div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col space-y-2">
                    <Button
                        variant="warning"
                        size="sm"
                        onClick={normalizeNames}
                        icon={<Zap className="w-4 h-4" />}
                    >
                        Normalizar Nombres
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={analyzeDuplicates}
                        icon={<RefreshCw className="w-4 h-4" />}
                    >
                        Re-analizar
                    </Button>
                </div>
            </div>

            {/* Lista de duplicados */}
            {duplicates.length > 0 && (
                <Card>
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Copy className="w-5 h-5 mr-2 text-red-500" />
                            Duplicados Detectados ({duplicates.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {duplicates.map((group) => (
                            <DuplicateGroup
                                key={group.key}
                                group={group}
                                onMerge={mergeDuplicates}
                                merging={merging[group.key]}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* Lista de huérfanos */}
            {orphans.length > 0 && (
                <Card>
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                            Ubicaciones Huérfanas ({orphans.length})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Sectores sin ubicación padre
                        </p>
                    </div>
                    <div className="p-4 space-y-3">
                        {orphans.map((orphan) => (
                            <OrphanItem
                                key={orphan.id}
                                orphan={orphan}
                                locations={locations}
                                onFix={fixOrphan}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {duplicates.length === 0 && orphans.length === 0 && !analyzing && (
                <Card className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¡Base de datos limpia!
                    </h3>
                    <p className="text-gray-600">
                        No se encontraron duplicados ni ubicaciones huérfanas.
                    </p>
                </Card>
            )}
        </div>
    );
};

// Componente principal mejorado
const LocationInsightsManager = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const locationTypes = [
        { value: 'country', label: 'País', icon: Globe },
        { value: 'province', label: 'Provincia', icon: MapPin },
        { value: 'city', label: 'Ciudad', icon: Building },
        { value: 'sector', label: 'Sector', icon: Navigation },
        { value: 'neighborhood', label: 'Barrio', icon: Home }
    ];

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('location_insights')
                .select('*')
                .neq('status', 'inactive') // Filtrar los fusionados/inactivos
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLocations(data || []);
        } catch (err) {
            console.error('Error fetching locations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSave = async (locationId, formData) => {
        try {
            const { error } = await supabase
                .from('location_insights')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', locationId);

            if (error) throw error;

            alert('Ubicación actualizada exitosamente');
            await fetchLocations();
            
            // Actualizar el objeto seleccionado
            const updatedLocation = await supabase
                .from('location_insights')
                .select('*')
                .eq('id', locationId)
                .single();
            
            if (updatedLocation.data) {
                setSelectedLocation(updatedLocation.data);
            }
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    };

    const handleLocationCreate = async (formData) => {
        try {
            const { data, error } = await supabase
                .from('location_insights')
                .insert([{
                    ...formData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            alert('Ubicación creada exitosamente');
            setShowCreateForm(false);
            await fetchLocations();
            setSelectedLocation(data);
            setActiveTab('list');
            
            return data;
        } catch (error) {
            console.error('Error creating location:', error);
            throw error;
        }
    };

    const handleLocationDelete = async (locationId) => {
        try {
            const { error } = await supabase
                .from('location_insights')
                .update({ 
                    status: 'inactive',
                    updated_at: new Date().toISOString()
                })
                .eq('id', locationId);

            if (error) throw error;

            alert('Ubicación eliminada exitosamente');
            await fetchLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
            throw error;
        }
    };

    // Filtrar ubicaciones
    const filteredLocations = locations.filter(location => {
        const matchesSearch = location.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || location.location_type === selectedType;
        const matchesStatus = !selectedStatus || location.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    const tabs = [
        { id: 'list', label: 'Lista de Ubicaciones', icon: <Database className="w-4 h-4" /> },
        { id: 'create', label: 'Crear Ubicación', icon: <Plus className="w-4 h-4" /> },
        { id: 'cleanup', label: 'Limpieza de Duplicados', icon: <Settings className="w-4 h-4" /> }
    ];

    // Si estamos viendo detalles de una ubicación
    if (selectedLocation && !showCreateForm) {
        return (
            <LocationDetail
                location={selectedLocation}
                locations={locations}
                onBack={() => setSelectedLocation(null)}
                onSave={handleLocationSave}
                onDelete={handleLocationDelete}
            />
        );
    }

    // Si estamos creando una nueva ubicación
    if (showCreateForm || activeTab === 'create') {
        return (
            <CreateLocation
                locations={locations}
                onSave={handleLocationCreate}
                onCancel={() => {
                    setShowCreateForm(false);
                    setActiveTab('list');
                }}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Location Insights Manager</h1>
                <p className="text-gray-600">Gestiona ubicaciones y limpia duplicados</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
                {tabs.map(tab => (
                    <Tab
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowCreateForm(tab.id === 'create');
                        }}
                        icon={tab.icon}
                    >
                        {tab.label}
                    </Tab>
                ))}
            </div>

            {/* Contenido según tab activo */}
            {activeTab === 'list' && (
                <div>
                    {/* Filtros */}
                    <Card className="p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar ubicaciones..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Todos los tipos</option>
                                {locationTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Todos los estados</option>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                                <option value="draft">Borrador</option>
                            </select>

                            <div className="text-sm text-gray-600 flex items-center">
                                Total: {filteredLocations.length}
                            </div>

                            <Button
                                variant="primary"
                                onClick={() => setShowCreateForm(true)}
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Nueva Ubicación
                            </Button>
                        </div>
                    </Card>

                    {/* Lista de ubicaciones */}
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Ubicación
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Popularidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredLocations.map((location) => (
                                        <tr key={location.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {location.location_type === 'country' && <Globe className="w-4 h-4 text-gray-400 mr-2" />}
                                                    {location.location_type === 'province' && <MapPin className="w-4 h-4 text-gray-400 mr-2" />}
                                                    {location.location_type === 'city' && <Building className="w-4 h-4 text-gray-400 mr-2" />}
                                                    {location.location_type === 'sector' && <Navigation className="w-4 h-4 text-gray-400 mr-2" />}
                                                    <div>
                                                        <div className="font-medium text-gray-900 cursor-pointer hover:text-orange-600"
                                                             onClick={() => setSelectedLocation(location)}>
                                                            {location.display_name || location.location_name}
                                                        </div>
                                                        {location.canonical_name && location.canonical_name !== location.location_name && (
                                                            <div className="text-sm text-gray-500">
                                                                {location.canonical_name}
                                                            </div>
                                                        )}
                                                        <LocationHierarchy location={location} locations={locations} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={location.status === 'active' ? 'success' : location.status === 'inactive' ? 'warning' : 'danger'}>
                                                    {location.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {location.popularity_score || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {location.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedLocation(location)}
                                                    icon={<Eye className="w-4 h-4" />}
                                                >
                                                    Ver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'cleanup' && (
                <DuplicateAnalyzer 
                    locations={locations.filter(l => l.status === 'active')} 
                    onRefresh={fetchLocations}
                />
            )}
        </div>
    );
};

export default LocationInsightsManager;
