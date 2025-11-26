import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, MapPin, Globe, Building, Home,
    Navigation, X, Save, AlertCircle, Check, Star, Eye, EyeOff,
    Calendar, User, Tag, FileText, TrendingUp, Users, Car,
    GraduationCap, Heart, DollarSign, BarChart3, AlertTriangle,
    RefreshCw, Merge, Zap, Target, Database, Settings, Copy,
    CheckCircle, XCircle, ArrowRight, GitMerge, ChevronDown,
    ChevronRight, Map, Clock, MoreHorizontal, Info, Edit3,
    Layers, TreePine, Briefcase, Activity, Wifi, ShoppingCart
} from 'lucide-react';

// Importar cliente real de Supabase (debe ser proporcionado desde el componente padre)
const createClient = (url, key) => {
    // Este será reemplazado por el cliente real de Supabase
    console.error('Supabase client not provided. Please pass supabase client as prop.');
    return null;
};

// Componentes UI básicos
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
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

// Componente de jerarquía visual
const LocationHierarchy = ({ location, allLocations }) => {
    const buildHierarchy = (locationId, visited = new Set()) => {
        if (!locationId || visited.has(locationId)) return [];
        visited.add(locationId);
        
        const loc = allLocations.find(l => l.id === locationId);
        if (!loc) return [];
        
        const parentHierarchy = loc.parent_location_id 
            ? buildHierarchy(loc.parent_location_id, visited)
            : [];
        
        return [...parentHierarchy, loc];
    };

    const hierarchy = buildHierarchy(location.id);
    
    const getIcon = (type) => {
        switch (type) {
            case 'country': return <Globe className="w-4 h-4" />;
            case 'province': return <MapPin className="w-4 h-4" />;
            case 'city': return <Building className="w-4 h-4" />;
            case 'sector': return <Navigation className="w-4 h-4" />;
            case 'neighborhood': return <Home className="w-4 h-4" />;
            default: return <MapPin className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex items-center space-x-2 text-sm">
            {hierarchy.map((loc, index) => (
                <React.Fragment key={loc.id}>
                    <div className="flex items-center space-x-1">
                        {getIcon(loc.location_type)}
                        <span className={index === hierarchy.length - 1 ? 'font-semibold' : 'text-gray-600'}>
                            {loc.display_name || loc.location_name}
                        </span>
                    </div>
                    {index < hierarchy.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// Componente de ubicaciones hijas
const ChildLocations = ({ locationId, allLocations }) => {
    const children = allLocations.filter(l => l.parent_location_id === locationId);
    
    if (children.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ubicaciones hijas ({children.length})</h4>
            <div className="space-y-1">
                {children.slice(0, 5).map(child => (
                    <div key={child.id} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Navigation className="w-3 h-3" />
                        <span>{child.display_name || child.location_name}</span>
                    </div>
                ))}
                {children.length > 5 && (
                    <div className="text-xs text-gray-500">
                        +{children.length - 5} más...
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de estadísticas
const StatsDisplay = ({ location }) => {
    const stats = [
        { label: 'Popularidad', value: location.popularity_score || 0, max: 100, color: 'blue' },
        { label: 'Calidad', value: location.quality_score || 0, max: 100, color: 'green' },
        { label: 'Uso', value: location.usage_count || 0, max: null, color: 'orange' },
        { label: 'Inversión', value: location.investment_score || 0, max: 100, color: 'purple' }
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {stats.map(stat => (
                <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                    {stat.max && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                                className={`bg-${stat.color}-500 h-1 rounded-full`}
                                style={{ width: `${(stat.value / stat.max) * 100}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Secciones del formulario de edición
const FormSection = ({ title, icon, children, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <Card className="mb-4">
            <div 
                className="p-4 border-b border-gray-200 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            {icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
            </div>
            {expanded && (
                <div className="p-4">
                    {children}
                </div>
            )}
        </Card>
    );
};

// Campo de formulario reutilizable
const FormField = ({ label, children, required = false, help = null, error = null }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
);

// Dropdown jerárquico para ubicación padre
const ParentLocationDropdown = ({ value, onChange, allLocations, currentLocationId }) => {
    const buildOptions = (parentId = null, level = 0) => {
        return allLocations
            .filter(loc => loc.parent_location_id === parentId && loc.id !== currentLocationId)
            .flatMap(loc => [
                <option key={loc.id} value={loc.id} style={{ paddingLeft: `${level * 20}px` }}>
                    {'  '.repeat(level)}
                    {getLocationTypeIcon(loc.location_type)} {loc.display_name || loc.location_name}
                </option>,
                ...buildOptions(loc.id, level + 1)
            ]);
    };

    const getLocationTypeIcon = (type) => {
        switch (type) {
            case 'country': return '🌍';
            case 'province': return '📍';
            case 'city': return '🏢';
            case 'sector': return '🧭';
            case 'neighborhood': return '🏠';
            default: return '📍';
        }
    };

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
        >
            <option value="">Sin ubicación padre</option>
            {buildOptions()}
        </select>
    );
};

// Componente principal del editor
const LocationInsightsEditor = ({ locationId = null, onClose, onSave, supabase }) => {
    const [location, setLocation] = useState(null);
    const [allLocations, setAllLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (supabase) {
            loadData();
        } else {
            console.error('Supabase client is required');
            setLoading(false);
        }
    }, [locationId, supabase]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar todas las ubicaciones para el dropdown
            const { data: locations, error: locationsError } = await supabase
                .from('location_insights')
                .select('id, location_name, display_name, location_type, parent_location_id, status')
                .eq('status', 'active')
                .order('location_name', { ascending: true });
            
            if (locationsError) throw locationsError;
            setAllLocations(locations || []);

            // Si hay un ID, cargar la ubicación específica
            if (locationId) {
                const { data: locationData, error: locationError } = await supabase
                    .from('location_insights')
                    .select('*')
                    .eq('id', locationId)
                    .single();
                
                if (locationError) throw locationError;
                
                // Procesar campos JSONB y arrays
                const processedLocation = {
                    ...locationData,
                    coordinates_lat: locationData.coordinates ? locationData.coordinates.x : null,
                    coordinates_lng: locationData.coordinates ? locationData.coordinates.y : null,
                    bounds_ne_lat: locationData.bounds_northeast ? locationData.bounds_northeast.x : null,
                    bounds_ne_lng: locationData.bounds_northeast ? locationData.bounds_northeast.y : null,
                    bounds_sw_lat: locationData.bounds_southwest ? locationData.bounds_southwest.x : null,
                    bounds_sw_lng: locationData.bounds_southwest ? locationData.bounds_southwest.y : null,
                    key_highlights: locationData.key_highlights || [],
                    seo_keywords: locationData.seo_keywords || [],
                    market_insights: locationData.market_insights || {},
                    price_ranges: locationData.price_ranges || {},
                    investment_analysis: locationData.investment_analysis || {},
                    demographics: locationData.demographics || {},
                    transportation: locationData.transportation || {},
                    education: locationData.education || {},
                    healthcare: locationData.healthcare || {}
                };
                
                setLocation(processedLocation);
                setFormData(processedLocation);
            } else {
                // Nueva ubicación
                const newLocation = {
                    location_name: '',
                    display_name: '',
                    canonical_name: '',
                    location_type: 'sector',
                    parent_location_id: null,
                    status: 'active',
                    validation_status: 'pending',
                    coordinates_lat: null,
                    coordinates_lng: null,
                    bounds_ne_lat: null,
                    bounds_ne_lng: null,
                    bounds_sw_lat: null,
                    bounds_sw_lng: null,
                    description: '',
                    short_description: '',
                    key_highlights: [],
                    seo_title: '',
                    seo_description: '',
                    seo_keywords: [],
                    content_quality_score: 0,
                    popularity_score: 50,
                    property_count: 0,
                    usage_count: 0,
                    sort_order: 0,
                    featured: false,
                    google_places_synced: false,
                    market_insights: {},
                    price_ranges: {},
                    investment_analysis: {},
                    demographics: {},
                    transportation: {},
                    education: {},
                    healthcare: {}
                };
                setLocation(newLocation);
                setFormData(newLocation);
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.location_name?.trim()) {
            newErrors.location_name = 'El nombre es requerido';
        }
        
        if (!formData.location_type) {
            newErrors.location_type = 'El tipo es requerido';
        }
        
        if (formData.coordinates_lat && (formData.coordinates_lat < -90 || formData.coordinates_lat > 90)) {
            newErrors.coordinates_lat = 'Latitud debe estar entre -90 y 90';
        }
        
        if (formData.coordinates_lng && (formData.coordinates_lng < -180 || formData.coordinates_lng > 180)) {
            newErrors.coordinates_lng = 'Longitud debe estar entre -180 y 180';
        }

        if (formData.content_quality_score && (formData.content_quality_score < 0 || formData.content_quality_score > 100)) {
            newErrors.content_quality_score = 'Puntuación debe estar entre 0 y 100';
        }

        if (formData.popularity_score && (formData.popularity_score < 0 || formData.popularity_score > 100)) {
            newErrors.popularity_score = 'Puntuación debe estar entre 0 y 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        setSaving(true);
        try {
            // Preparar datos para guardar
            const dataToSave = {
                location_name: formData.location_name,
                display_name: formData.display_name || formData.location_name,
                canonical_name: formData.canonical_name || formData.location_name,
                location_type: formData.location_type,
                parent_location_id: formData.parent_location_id || null,
                status: formData.status || 'active',
                validation_status: formData.validation_status || 'pending',
                description: formData.description || null,
                short_description: formData.short_description || null,
                key_highlights: formData.key_highlights || [],
                seo_title: formData.seo_title || null,
                seo_description: formData.seo_description || null,
                seo_keywords: formData.seo_keywords || [],
                content_quality_score: formData.content_quality_score || 0,
                popularity_score: formData.popularity_score || 50,
                property_count: formData.property_count || 0,
                usage_count: formData.usage_count || 0,
                sort_order: formData.sort_order || 0,
                featured: formData.featured || false,
                google_places_synced: formData.google_places_synced || false,
                market_insights: formData.market_insights || {},
                price_ranges: formData.price_ranges || {},
                investment_analysis: formData.investment_analysis || {},
                demographics: formData.demographics || {},
                transportation: formData.transportation || {},
                education: formData.education || {},
                healthcare: formData.healthcare || {},
                updated_at: new Date().toISOString()
            };

            // Manejar coordenadas (convertir a formato PostGIS POINT)
            if (formData.coordinates_lat && formData.coordinates_lng) {
                dataToSave.coordinates = `POINT(${formData.coordinates_lng} ${formData.coordinates_lat})`;
            }

            if (formData.bounds_ne_lat && formData.bounds_ne_lng) {
                dataToSave.bounds_northeast = `POINT(${formData.bounds_ne_lng} ${formData.bounds_ne_lat})`;
            }

            if (formData.bounds_sw_lat && formData.bounds_sw_lng) {
                dataToSave.bounds_southwest = `POINT(${formData.bounds_sw_lng} ${formData.bounds_sw_lat})`;
            }

            let result;
            if (locationId) {
                const { data, error } = await supabase
                    .from('location_insights')
                    .update(dataToSave)
                    .eq('id', locationId)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                dataToSave.created_at = new Date().toISOString();
                const { data, error } = await supabase
                    .from('location_insights')
                    .insert([dataToSave])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }

            // Actualizar estado local
            setLocation({ ...location, ...result });
            setIsEditing(false);
            
            // Callback de éxito
            if (onSave) onSave(result);
            
        } catch (error) {
            console.error('Error saving:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Limpiar error del campo cuando se modifica
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!location) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubicación no encontrada</h3>
                <p className="text-gray-600">No se pudo cargar la información de la ubicación.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {locationId ? 'Editar Ubicación' : 'Nueva Ubicación'}
                        </h1>
                        {location.location_name && (
                            <LocationHierarchy location={location} allLocations={allLocations} />
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {!isEditing && locationId && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                icon={<Edit3 className="w-4 h-4" />}
                            >
                                Editar
                            </Button>
                        )}
                        
                        {isEditing && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData(location);
                                        setErrors({});
                                    }}
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
                        
                        {onClose && (
                            <Button variant="ghost" onClick={onClose} icon={<X className="w-4 h-4" />}>
                                Cerrar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Información técnica */}
                {locationId && (
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                            <Database className="w-4 h-4" />
                            <span>ID: {location.id?.substring(0, 8)}...</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Creado: {new Date(location.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Actualizado: {new Date(location.updated_at).toLocaleDateString()}</span>
                        </div>
                        {location.last_used && (
                            <div className="flex items-center space-x-1">
                                <Activity className="w-4 h-4" />
                                <span>Último uso: {new Date(location.last_used).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Vista de solo lectura */}
            {!isEditing && locationId && (
                <div className="space-y-6">
                    {/* Estadísticas principales */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                        <StatsDisplay location={location} />
                        <ChildLocations locationId={location.id} allLocations={allLocations} />
                    </Card>

                    {/* Información básica */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nombre</label>
                                <p className="text-gray-900">{location.location_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nombre para mostrar</label>
                                <p className="text-gray-900">{location.display_name || location.location_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nombre canónico</label>
                                <p className="text-gray-900">{location.canonical_name || location.location_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Tipo</label>
                                <p className="text-gray-900 capitalize">{location.location_type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Estado</label>
                                <div className="flex items-center space-x-2">
                                    <Badge variant={location.status === 'active' ? 'success' : 'warning'}>
                                        {location.status}
                                    </Badge>
                                    <Badge variant={location.validation_status === 'approved' ? 'success' : location.validation_status === 'rejected' ? 'danger' : 'warning'}>
                                        {location.validation_status}
                                    </Badge>
                                </div>
                            </div>
                            {location.coordinates_lat && location.coordinates_lng && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Coordenadas</label>
                                        <p className="text-gray-900">{location.coordinates_lat}, {location.coordinates_lng}</p>
                                    </div>
                                </>
                            )}
                            {location.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                                    <p className="text-gray-900">{location.description}</p>
                                </div>
                            )}
                            {location.key_highlights && location.key_highlights.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Características destacadas</label>
                                    <ul className="list-disc list-inside text-gray-900">
                                        {location.key_highlights.map((highlight, index) => (
                                            <li key={index}>{highlight}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* SEO */}
                    {location.seo_title && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">SEO</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Título SEO</label>
                                    <p className="text-gray-900">{location.seo_title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                                    <p className="text-gray-900">{location.seo_description}</p>
                                </div>
                                {location.seo_keywords && location.seo_keywords.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Keywords</label>
                                        <p className="text-gray-900">{location.seo_keywords.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Formulario de edición */}
            {isEditing && (
                <div className="space-y-6">
                    {/* 📄 Información Básica */}
                    <FormSection title="Información Básica" icon={<FileText className="w-5 h-5 text-orange-600" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Nombre" required error={errors.location_name}>
                                <input
                                    type="text"
                                    value={formData.location_name || ''}
                                    onChange={(e) => handleFieldChange('location_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Nombre de la ubicación"
                                />
                            </FormField>

                            <FormField label="Nombre para mostrar">
                                <input
                                    type="text"
                                    value={formData.display_name || ''}
                                    onChange={(e) => handleFieldChange('display_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Nombre que se muestra al público"
                                />
                            </FormField>

                            <FormField label="Nombre canónico">
                                <input
                                    type="text"
                                    value={formData.canonical_name || ''}
                                    onChange={(e) => handleFieldChange('canonical_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Nombre oficial o canónico"
                                />
                            </FormField>

                            <FormField label="Tipo" required error={errors.location_type}>
                                <select
                                    value={formData.location_type || ''}
                                    onChange={(e) => handleFieldChange('location_type', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Seleccionar tipo</option>
                                    <option value="country">País</option>
                                    <option value="province">Provincia</option>
                                    <option value="city">Ciudad</option>
                                    <option value="sector">Sector</option>
                                    <option value="neighborhood">Barrio</option>
                                </select>
                            </FormField>

                            <div className="md:col-span-2">
                                <FormField label="Ubicación padre">
                                    <ParentLocationDropdown
                                        value={formData.parent_location_id}
                                        onChange={(value) => handleFieldChange('parent_location_id', value)}
                                        allLocations={allLocations}
                                        currentLocationId={locationId}
                                    />
                                </FormField>
                            </div>

                            <FormField label="Latitud" error={errors.coordinates_lat}>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.coordinates_lat || ''}
                                    onChange={(e) => handleFieldChange('coordinates_lat', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="-90 a 90"
                                />
                            </FormField>

                            <FormField label="Longitud" error={errors.coordinates_lng}>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.coordinates_lng || ''}
                                    onChange={(e) => handleFieldChange('coordinates_lng', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="-180 a 180"
                                />
                            </FormField>

                            <FormField label="Estado">
                                <select
                                    value={formData.status || 'active'}
                                    onChange={(e) => handleFieldChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                    <option value="draft">Borrador</option>
                                </select>
                            </FormField>

                            <FormField label="Estado de validación">
                                <select
                                    value={formData.validation_status || 'pending'}
                                    onChange={(e) => handleFieldChange('validation_status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="approved">Aprobado</option>
                                    <option value="rejected">Rechazado</option>
                                    <option value="needs_review">Necesita revisión</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="space-y-4">
                            <FormField label="Descripción" help="Descripción completa de la ubicación">
                                <textarea
                                    rows="4"
                                    value={formData.description || ''}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción detallada de la ubicación..."
                                />
                            </FormField>

                            <FormField label="Descripción corta" help="Máximo 500 caracteres">
                                <textarea
                                    rows="2"
                                    maxLength="500"
                                    value={formData.short_description || ''}
                                    onChange={(e) => handleFieldChange('short_description', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción breve..."
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {(formData.short_description || '').length}/500 caracteres
                                </div>
                            </FormField>

                            <FormField label="Características destacadas" help="Una por línea">
                                <textarea
                                    rows="4"
                                    value={Array.isArray(formData.key_highlights) ? formData.key_highlights.join('\n') : ''}
                                    onChange={(e) => handleFieldChange('key_highlights', e.target.value.split('\n').filter(h => h.trim()))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Centro comercial Blue Mall&#10;Apartamentos de lujo&#10;Excelente conectividad"
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Destacado">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured || false}
                                        onChange={(e) => handleFieldChange('featured', e.target.checked)}
                                        className="text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Marcar como ubicación destacada</span>
                                </label>
                            </FormField>

                            <FormField label="Orden de clasificación" help="Número para ordenar (menor = primero)">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.sort_order || ''}
                                    onChange={(e) => handleFieldChange('sort_order', e.target.value ? parseInt(e.target.value) : 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    {/* 📊 Estadísticas */}
                    <FormSection title="Estadísticas" icon={<BarChart3 className="w-5 h-5 text-orange-600" />} defaultExpanded={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Puntuación de contenido" help="0-100" error={errors.content_quality_score}>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.content_quality_score || ''}
                                    onChange={(e) => handleFieldChange('content_quality_score', e.target.value ? parseInt(e.target.value) : 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </FormField>

                            <FormField label="Contador de uso">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.usage_count || ''}
                                    onChange={(e) => handleFieldChange('usage_count', e.target.value ? parseInt(e.target.value) : 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </FormField>

                            <FormField label="Puntuación de popularidad" help="0-100" error={errors.popularity_score}>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.popularity_score || ''}
                                    onChange={(e) => handleFieldChange('popularity_score', e.target.value ? parseInt(e.target.value) : 50)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </FormField>

                            <FormField label="Cantidad de propiedades">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.property_count || ''}
                                    onChange={(e) => handleFieldChange('property_count', e.target.value ? parseInt(e.target.value) : 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    {/* 🚀 SEO */}
                    <FormSection title="SEO" icon={<Target className="w-5 h-5 text-orange-600" />} defaultExpanded={false}>
                        <div className="space-y-4">
                            <FormField label="Título SEO" help="Recomendado: 50-60 caracteres">
                                <input
                                    type="text"
                                    value={formData.seo_title || ''}
                                    onChange={(e) => handleFieldChange('seo_title', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Título optimizado para SEO"
                                />
                            </FormField>

                            <FormField label="Descripción SEO" help="Recomendado: 150-160 caracteres">
                                <textarea
                                    rows="3"
                                    value={formData.seo_description || ''}
                                    onChange={(e) => handleFieldChange('seo_description', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Descripción que aparece en resultados de búsqueda"
                                />
                            </FormField>

                            <FormField label="Keywords SEO" help="Separadas por comas">
                                <input
                                    type="text"
                                    value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords || ''}
                                    onChange={(e) => handleFieldChange('seo_keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="palabra1, palabra2, palabra3"
                                />
                            </FormField>

                            <FormField label="Highlights" help="Características destacadas, una por línea">
                                <textarea
                                    rows="4"
                                    value={Array.isArray(formData.key_highlights) ? formData.key_highlights.join('\n') : ''}
                                    onChange={(e) => handleFieldChange('key_highlights', e.target.value.split('\n').filter(h => h.trim()))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Centro comercial Blue Mall&#10;Apartamentos de lujo&#10;Excelente conectividad"
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    {/* 💰 Mercado */}
                    <FormSection title="Información de Mercado" icon={<DollarSign className="w-5 h-5 text-orange-600" />} defaultExpanded={false}>
                        <div className="space-y-4">
                            <FormField label="Rangos de precios (JSON)" help="Estructura: {min: number, max: number, currency: 'USD'}">
                                <textarea
                                    rows="3"
                                    value={JSON.stringify(formData.price_ranges || {}, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            handleFieldChange('price_ranges', parsed);
                                        } catch (err) {
                                            // Valor inválido, no actualizar
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                    placeholder='{"min": 100000, "max": 500000, "currency": "USD"}'
                                />
                            </FormField>

                            <FormField label="Información de mercado (JSON)" help="Datos generales del mercado">
                                <textarea
                                    rows="4"
                                    value={JSON.stringify(formData.market_insights || {}, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            handleFieldChange('market_insights', parsed);
                                        } catch (err) {
                                            // Valor inválido, no actualizar
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                    placeholder='{"trend": "up", "growth_rate": 5.2, "demand_level": "high"}'
                                />
                            </FormField>

                            <FormField label="Análisis de inversión (JSON)" help="Métricas de inversión">
                                <textarea
                                    rows="4"
                                    value={JSON.stringify(formData.investment_analysis || {}, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            handleFieldChange('investment_analysis', parsed);
                                        } catch (err) {
                                            // Valor inválido, no actualizar
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                    placeholder='{"roi_potential": 85, "risk_level": "medium", "liquidity": "high"}'
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    {/* 🏢 Servicios */}
                    <FormSection title="Servicios y Demografía" icon={<Briefcase className="w-5 h-5 text-orange-600" />} defaultExpanded={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <FormField label="Demografía (JSON)" help="Datos poblacionales">
                                    <textarea
                                        rows="4"
                                        value={JSON.stringify(formData.demographics || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleFieldChange('demographics', parsed);
                                            } catch (err) {
                                                // Valor inválido, no actualizar
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                        placeholder='{"population": 25000, "age_median": 35, "income_level": "high"}'
                                    />
                                </FormField>

                                <FormField label="Transporte (JSON)" help="Accesibilidad y transporte">
                                    <textarea
                                        rows="4"
                                        value={JSON.stringify(formData.transportation || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleFieldChange('transportation', parsed);
                                            } catch (err) {
                                                // Valor inválido, no actualizar
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                        placeholder='{"metro_access": true, "bus_routes": 12, "walkability_score": 85}'
                                    />
                                </FormField>
                            </div>

                            <div>
                                <FormField label="Educación (JSON)" help="Instituciones educativas">
                                    <textarea
                                        rows="4"
                                        value={JSON.stringify(formData.education || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleFieldChange('education', parsed);
                                            } catch (err) {
                                                // Valor inválido, no actualizar
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                        placeholder='{"schools_count": 8, "universities_nearby": 3, "quality": "excellent"}'
                                    />
                                </FormField>

                                <FormField label="Salud (JSON)" help="Servicios de salud">
                                    <textarea
                                        rows="4"
                                        value={JSON.stringify(formData.healthcare || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                handleFieldChange('healthcare', parsed);
                                            } catch (err) {
                                                // Valor inválido, no actualizar
                                            }
                                        }}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                                        placeholder='{"hospitals_nearby": 4, "clinics_count": 15, "quality": "excellent"}'
                                    />
                                </FormField>
                            </div>
                        </div>
                    </FormSection>
                </div>
            )}
        </div>
    );
};

// Componente demo wrapper
const LocationEditorDemo = () => {
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [showNew, setShowNew] = useState(true);

    // Mock del cliente Supabase para la demo
    const mockSupabase = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({
                        data: null,
                        error: { message: 'Demo mode - no real data available' }
                    })
                }),
                order: () => Promise.resolve({
                    data: [],
                    error: null
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: () => Promise.resolve({
                            data: { id: 'demo-id', location_name: 'Demo Location' },
                            error: null
                        })
                    })
                })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({
                        data: { id: 'new-demo-id', location_name: 'New Demo Location' },
                        error: null
                    })
                })
            })
        })
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-800">Modo Demo</h3>
                                <p className="text-sm text-yellow-700">
                                    Este es un modo de demostración. Para usar con datos reales, pasa el cliente de Supabase como prop: 
                                    <code className="ml-1 px-1 bg-yellow-100 rounded">supabase={"{supabaseClient}"}</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Button
                            variant={showNew ? 'primary' : 'outline'}
                            onClick={() => {
                                setSelectedLocationId(null);
                                setShowNew(true);
                            }}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Nueva Ubicación
                        </Button>
                        <Button
                            variant={!showNew ? 'primary' : 'outline'}
                            onClick={() => {
                                setSelectedLocationId('demo-id');
                                setShowNew(false);
                            }}
                            icon={<Edit className="w-4 h-4" />}
                        >
                            Editar Ubicación Existente
                        </Button>
                    </div>
                </div>

                <LocationInsightsEditor
                    locationId={showNew ? null : selectedLocationId}
                    supabase={mockSupabase}
                    onSave={(result) => console.log('Guardado exitoso:', result)}
                    onClose={() => console.log('Editor cerrado')}
                />
            </div>
        </div>
    );
};

export default LocationEditorDemo;