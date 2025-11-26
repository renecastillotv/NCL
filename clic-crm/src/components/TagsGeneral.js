import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Eye, EyeOff, Save, X, ChevronDown,
    Tag, Palette, Grid, List, Search, Filter, Home as HomeIcon,
    Building, TrendingUp, Users
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';



import { supabase } from '../services/api';

// Iconos disponibles para tags - mapeamos nombres a componentes
const ICON_COMPONENTS = {
    'Home': require('lucide-react').Home,
    'Building': require('lucide-react').Building,
    'MapPin': require('lucide-react').MapPin,
    'Wifi': require('lucide-react').Wifi,
    'Car': require('lucide-react').Car,
    'Bath': require('lucide-react').Bath,
    'Bed': require('lucide-react').Bed,
    'TreePine': require('lucide-react').TreePine,
    'Waves': require('lucide-react').Waves,
    'Dumbbell': require('lucide-react').Dumbbell,
    'Shield': require('lucide-react').Shield,
    'Camera': require('lucide-react').Camera,
    'Coffee': require('lucide-react').Coffee,
    'Utensils': require('lucide-react').Utensils,
    'Laptop': require('lucide-react').Laptop,
    'Sun': require('lucide-react').Sun,
    'Star': require('lucide-react').Star,
    'Heart': require('lucide-react').Heart,
    'Target': require('lucide-react').Target,
    'Award': require('lucide-react').Award,
    'Settings': require('lucide-react').Settings,
    'Globe': require('lucide-react').Globe,
    'DollarSign': require('lucide-react').DollarSign,
    'FileText': require('lucide-react').FileText,
    'Maximize': require('lucide-react').Maximize,
    'Flag': require('lucide-react').Users // Usamos Users como placeholder para Flag
};

// Iconos disponibles para selección
const AVAILABLE_ICONS = [
    { name: 'home', icon: <ICON_COMPONENTS.Home className="w-4 h-4" />, value: 'Home' },
    { name: 'building', icon: <ICON_COMPONENTS.Building className="w-4 h-4" />, value: 'Building' },
    { name: 'mappin', icon: <ICON_COMPONENTS.MapPin className="w-4 h-4" />, value: 'MapPin' },
    { name: 'wifi', icon: <ICON_COMPONENTS.Wifi className="w-4 h-4" />, value: 'Wifi' },
    { name: 'car', icon: <ICON_COMPONENTS.Car className="w-4 h-4" />, value: 'Car' },
    { name: 'bath', icon: <ICON_COMPONENTS.Bath className="w-4 h-4" />, value: 'Bath' },
    { name: 'bed', icon: <ICON_COMPONENTS.Bed className="w-4 h-4" />, value: 'Bed' },
    { name: 'treepine', icon: <ICON_COMPONENTS.TreePine className="w-4 h-4" />, value: 'TreePine' },
    { name: 'waves', icon: <ICON_COMPONENTS.Waves className="w-4 h-4" />, value: 'Waves' },
    { name: 'dumbbell', icon: <ICON_COMPONENTS.Dumbbell className="w-4 h-4" />, value: 'Dumbbell' },
    { name: 'shield', icon: <ICON_COMPONENTS.Shield className="w-4 h-4" />, value: 'Shield' },
    { name: 'camera', icon: <ICON_COMPONENTS.Camera className="w-4 h-4" />, value: 'Camera' },
    { name: 'coffee', icon: <ICON_COMPONENTS.Coffee className="w-4 h-4" />, value: 'Coffee' },
    { name: 'utensils', icon: <ICON_COMPONENTS.Utensils className="w-4 h-4" />, value: 'Utensils' },
    { name: 'laptop', icon: <ICON_COMPONENTS.Laptop className="w-4 h-4" />, value: 'Laptop' },
    { name: 'sun', icon: <ICON_COMPONENTS.Sun className="w-4 h-4" />, value: 'Sun' },
    { name: 'star', icon: <ICON_COMPONENTS.Star className="w-4 h-4" />, value: 'Star' },
    { name: 'heart', icon: <ICON_COMPONENTS.Heart className="w-4 h-4" />, value: 'Heart' },
    { name: 'target', icon: <ICON_COMPONENTS.Target className="w-4 h-4" />, value: 'Target' },
    { name: 'award', icon: <ICON_COMPONENTS.Award className="w-4 h-4" />, value: 'Award' }
];

// Colores predefinidos
const PREDEFINED_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#C026D3',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

// Función helper para obtener el icono por nombre
const getIconByName = (iconName) => {
    const IconComponent = ICON_COMPONENTS[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Tag className="w-4 h-4" />;
};

// Función helper para generar slug automático
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Modal para crear/editar tags
const TagModal = ({ isOpen, onClose, tag, onSave, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category: '',
        display_name: '',
        description: '',
        icon: '',
        color: '#3B82F6',
        sort_order: 0,
        active: true
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [propertyCount, setPropertyCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(false);
    const [relatedProperties, setRelatedProperties] = useState([]);
    const [showRelatedProperties, setShowRelatedProperties] = useState(false);

    useEffect(() => {
        if (tag) {
            setFormData({
                name: tag.name || '',
                slug: tag.slug || '',
                category: tag.category || '',
                display_name: tag.display_name || '',
                description: tag.description || '',
                icon: tag.icon || '',
                color: tag.color || '#3B82F6',
                sort_order: tag.sort_order || 0,
                active: tag.active !== false
            });
            // Cargar contador de propiedades si es un tag existente
            loadPropertyCount(tag.id);
        } else {
            setFormData({
                name: '',
                slug: '',
                category: categories.length > 0 ? categories[0].name : '',
                display_name: '',
                description: '',
                icon: '',
                color: '#3B82F6',
                sort_order: 0,
                active: true
            });
            setPropertyCount(0);
            setRelatedProperties([]);
        }
        setErrors({});
        setShowRelatedProperties(false);
    }, [tag, isOpen, categories]);

    // Auto-generar slug cuando cambie el nombre
    useEffect(() => {
        if (formData.name && !tag) {
            const newSlug = generateSlug(formData.name);
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.name, tag]);

    const loadPropertyCount = async (tagId) => {
        try {
            setLoadingCount(true);

            // Contar propiedades relacionadas
            const { count, error: countError } = await supabase
                .from('content_tags')
                .select('*', { count: 'exact', head: true })
                .eq('tag_id', tagId)
                .eq('content_type', 'property');

            if (countError) {
                console.error('Error contando propiedades:', countError);
                setPropertyCount(0);
                setRelatedProperties([]);
                return;
            }

            setPropertyCount(count || 0);

            // Si hay propiedades relacionadas, cargar algunas para mostrar
            if (count > 0) {
                const { data: contentTags, error: propertiesError } = await supabase
                    .from('content_tags')
                    .select('content_id, weight')
                    .eq('tag_id', tagId)
                    .eq('content_type', 'property')
                    .limit(5);

                if (propertiesError) {
                    console.error('Error cargando content_tags:', propertiesError);
                    setRelatedProperties([]);
                    return;
                }

                if (contentTags && contentTags.length > 0) {
                    // Ahora buscar las propiedades por ID
                    const propertyIds = contentTags.map(ct => ct.content_id);

                    const { data: properties, error: propError } = await supabase
                        .from('properties')
                        .select('id, name, code, main_image_url')
                        .in('id', propertyIds);

                    if (propError) {
                        console.error('Error cargando propiedades:', propError);
                        setRelatedProperties([]);
                        return;
                    }

                    // Combinar los datos con el weight
                    const combinedData = properties?.map(property => {
                        const contentTag = contentTags.find(ct => ct.content_id === property.id);
                        return {
                            ...property,
                            weight: contentTag?.weight || 1.0
                        };
                    }) || [];

                    setRelatedProperties(combinedData);
                } else {
                    setRelatedProperties([]);
                }
            } else {
                setRelatedProperties([]);
            }

        } catch (error) {
            console.error('Error al cargar contador de propiedades:', error);
            setPropertyCount(0);
            setRelatedProperties([]);
        } finally {
            setLoadingCount(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'El nombre es requerido';
        }
        if (!formData.slug?.trim()) {
            newErrors.slug = 'El slug es requerido';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
        }
        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            alert('Por favor corrige los errores en el formulario:\n' + Object.values(newErrors).join('\n'));
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Error saving tag:', err);
            alert('Error al guardar el tag: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedCategory = categories.find(cat => cat.name === formData.category);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {tag ? 'Editar Tag' : 'Nuevo Tag'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                        {/* Vista previa del tag y estadísticas */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Vista Previa</h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                        style={{ backgroundColor: formData.color }}
                                    >
                                        {formData.icon ? getIconByName(formData.icon) : <Tag className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {formData.display_name || formData.name || 'Nombre del Tag'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {selectedCategory?.display_name} • {formData.slug || 'slug-del-tag'}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={formData.active ? 'success' : 'secondary'}
                                        size="sm"
                                    >
                                        {formData.active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>

                                {/* Estadísticas de propiedades */}
                                {tag && (
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                <HomeIcon className="w-4 h-4" />
                                                <span>Propiedades:</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {loadingCount ? '...' : propertyCount}
                                            </div>
                                        </div>
                                        {propertyCount > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowRelatedProperties(!showRelatedProperties)}
                                            >
                                                {showRelatedProperties ? 'Ocultar' : 'Ver'} propiedades
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Lista de propiedades relacionadas */}
                            {showRelatedProperties && relatedProperties.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h5 className="font-medium text-gray-900 mb-3">
                                        Propiedades Relacionadas ({propertyCount})
                                    </h5>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {relatedProperties.map((property) => (
                                            <div key={property.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                                {property.main_image_url && (
                                                    <img
                                                        src={property.main_image_url}
                                                        alt={property.name}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">
                                                        {property.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Código: {property.code} • Peso: {property.weight || 1.0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {propertyCount > 5 && (
                                            <div className="text-center text-sm text-gray-500 py-2">
                                                +{propertyCount - 5} propiedades más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Advertencia si el tag tiene propiedades relacionadas */}
                        {tag && propertyCount > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            <strong>Advertencia:</strong> Este tag está siendo usado por {propertyCount} {propertyCount === 1 ? 'propiedad' : 'propiedades'}.
                                            Los cambios en el slug afectarán las URLs SEO de estas propiedades.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Información básica */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ej: Piscina"
                                    className={errors.name ? 'border-red-300' : ''}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug * {tag && propertyCount > 0 && <span className="text-yellow-600">(⚠️ Usado en URLs)</span>}
                                </label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="piscina"
                                    className={errors.slug ? 'border-red-300' : ''}
                                />
                                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                                {tag && propertyCount > 0 && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        Cambiar este slug actualizará las URLs de {propertyCount} {propertyCount === 1 ? 'propiedad' : 'propiedades'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría *
                                </label>
                                <Input.Select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    options={categories.map(cat => ({
                                        value: cat.name,
                                        label: cat.display_name
                                    }))}
                                    className={errors.category ? 'border-red-300' : ''}
                                />
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre para Mostrar
                                </label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                                    placeholder="Nombre personalizado"
                                />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Descripción del tag..."
                            />
                        </div>

                        {/* Icono y Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Icono
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-2">
                                            {formData.icon ? getIconByName(formData.icon) : <Tag className="w-4 h-4" />}
                                            <span>{formData.icon || 'Seleccionar icono'}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showIconPicker && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                            <div className="p-2 grid grid-cols-5 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleInputChange('icon', '');
                                                        setShowIconPicker(false);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                                                >
                                                    <X className="w-4 h-4 text-gray-400" />
                                                </button>
                                                {AVAILABLE_ICONS.map((iconData) => (
                                                    <button
                                                        key={iconData.value}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('icon', iconData.value);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                                                        title={iconData.value}
                                                    >
                                                        {iconData.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: formData.color }}
                                            />
                                            <span>{formData.color}</span>
                                        </div>
                                        <Palette className="w-4 h-4" />
                                    </button>

                                    {showColorPicker && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3">
                                            <div className="grid grid-cols-5 gap-2 mb-3">
                                                {PREDEFINED_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('color', color);
                                                            setShowColorPicker(false);
                                                        }}
                                                        className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                            <Input
                                                value={formData.color}
                                                onChange={(e) => handleInputChange('color', e.target.value)}
                                                placeholder="#000000"
                                                className="text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Configuración adicional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Orden de Visualización
                                </label>
                                <Input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="999"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Números menores aparecen primero
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <label className="flex items-center mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => handleInputChange('active', e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Tag activo</span>
                                </label>
                                {tag && !formData.active && propertyCount > 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        ⚠️ Desactivar afectará {propertyCount} {propertyCount === 1 ? 'propiedad' : 'propiedades'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        icon={saving ? null : <Save className="w-4 h-4" />}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Componente para mostrar un tag en formato de tarjeta
const TagCard = ({ tag, onEdit, onDelete, onToggleActive }) => {
    const [propertyCount, setPropertyCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(true);

    useEffect(() => {
        loadPropertyCount();
    }, [tag.id]);

    const loadPropertyCount = async () => {
        try {
            const { count, error } = await supabase
                .from('content_tags')
                .select('*', { count: 'exact', head: true })
                .eq('tag_id', tag.id)
                .eq('content_type', 'property');

            if (error) throw error;
            setPropertyCount(count || 0);
        } catch (error) {
            console.error('Error loading property count:', error);
            setPropertyCount(0);
        } finally {
            setLoadingCount(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <Card.Body>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                        >
                            {tag.icon ? getIconByName(tag.icon) : <Tag className="w-4 h-4" />}
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 text-sm">
                                {tag.display_name || tag.name}
                            </h3>
                            <p className="text-xs text-gray-500">{tag.slug}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => onToggleActive(tag)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={tag.active ? 'Desactivar' : 'Activar'}
                        >
                            {tag.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onEdit(tag)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(tag)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {tag.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {tag.description}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Badge
                            variant={tag.active ? 'success' : 'secondary'}
                            size="sm"
                        >
                            {tag.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {propertyCount > 0 && (
                            <Badge variant="info" size="sm">
                                <HomeIcon className="w-3 h-3 mr-1" />
                                {loadingCount ? '...' : propertyCount}
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">
                        Orden: {tag.sort_order || 0}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
};

// Componente para mostrar un tag en formato de lista
const TagListItem = ({ tag, isLast, onEdit, onDelete, onToggleActive }) => {
    const [propertyCount, setPropertyCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(true);

    useEffect(() => {
        loadPropertyCount();
    }, [tag.id]);

    const loadPropertyCount = async () => {
        try {
            const { count, error } = await supabase
                .from('content_tags')
                .select('*', { count: 'exact', head: true })
                .eq('tag_id', tag.id)
                .eq('content_type', 'property');

            if (error) throw error;
            setPropertyCount(count || 0);
        } catch (error) {
            console.error('Error loading property count:', error);
            setPropertyCount(0);
        } finally {
            setLoadingCount(false);
        }
    };

    return (
        <div className={`px-6 py-4 ${!isLast ? 'border-b border-gray-200' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: tag.color || '#6B7280' }}
                    >
                        {tag.icon ? getIconByName(tag.icon) : <Tag className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">
                            {tag.display_name || tag.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{tag.slug}</span>
                            {tag.description && (
                                <span className="truncate max-w-xs">{tag.description}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Badge
                            variant={tag.active ? 'success' : 'secondary'}
                            size="sm"
                        >
                            {tag.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {propertyCount > 0 && (
                            <Badge variant="info" size="sm">
                                <HomeIcon className="w-3 h-3 mr-1" />
                                {loadingCount ? '...' : propertyCount}
                            </Badge>
                        )}
                    </div>
                    <span className="text-sm text-gray-500">
                        Orden: {tag.sort_order || 0}
                    </span>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => onToggleActive(tag)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={tag.active ? 'Desactivar' : 'Activar'}
                        >
                            {tag.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onEdit(tag)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(tag)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente principal para gestión de tags
const TagsGeneral = ({
    tags = [],
    categories = [],
    searchTerm = '',
    selectedCategory = 'all',
    viewMode = 'grid',
    onEdit,
    onDelete,
    onToggleActive,
    onSave,
    showModal,
    onCloseModal,
    selectedTag
}) => {
    // Filtrar y agrupar tags
    const getFilteredAndGroupedTags = () => {
        const filteredTags = tags.filter(tag => {
            const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.slug.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        return filteredTags.reduce((acc, tag) => {
            if (!acc[tag.category]) {
                acc[tag.category] = [];
            }
            acc[tag.category].push(tag);
            return acc;
        }, {});
    };

    const groupedTags = getFilteredAndGroupedTags();

    if (Object.keys(groupedTags).length === 0) {
        return (
            <div className="text-center py-12">
                <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || selectedCategory !== 'all' ? 'No se encontraron tags' : 'No hay tags'}
                </h3>
                <p className="text-gray-600 mb-4">
                    {searchTerm || selectedCategory !== 'all'
                        ? 'Intenta con otros filtros de búsqueda'
                        : 'Comienza creando tu primer tag'
                    }
                </p>
                {showModal && (
                    <TagModal
                        isOpen={showModal}
                        onClose={onCloseModal}
                        tag={selectedTag}
                        onSave={onSave}
                        categories={categories}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedTags).map(([category, categoryTags]) => {
                const categoryInfo = categories.find(cat => cat.name === category) ||
                    { display_name: category, icon: 'Tag', color: '#6B7280' };

                return (
                    <div key={category}>
                        <div className="flex items-center space-x-2 mb-4">
                            <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: categoryInfo.color }}
                            >
                                {getIconByName(categoryInfo.icon)}
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {categoryInfo.display_name}
                            </h2>
                            <Badge variant="secondary" size="sm">
                                {categoryTags.length}
                            </Badge>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categoryTags.map((tag) => (
                                    <TagCard
                                        key={tag.id}
                                        tag={tag}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleActive={onToggleActive}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                {categoryTags.map((tag, index) => (
                                    <TagListItem
                                        key={tag.id}
                                        tag={tag}
                                        isLast={index === categoryTags.length - 1}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleActive={onToggleActive}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Modal */}
            {showModal && (
                <TagModal
                    isOpen={showModal}
                    onClose={onCloseModal}
                    tag={selectedTag}
                    onSave={onSave}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default TagsGeneral;