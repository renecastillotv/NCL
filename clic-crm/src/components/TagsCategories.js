import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Eye, EyeOff, Save, X, ChevronDown, 
    Layers, Palette
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';

// Iconos disponibles para categorías - mapeamos nombres a componentes
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
    'Flag': require('lucide-react').Users,
    'Tag': require('lucide-react').Tag,
    'Layers': Layers
};

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
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Layers className="w-4 h-4" />;
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

// Modal para crear/editar categorías
const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
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

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                display_name: category.display_name || '',
                description: category.description || '',
                icon: category.icon || '',
                color: category.color || '#3B82F6',
                sort_order: category.sort_order || 0,
                active: category.active !== false
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                display_name: '',
                description: '',
                icon: '',
                color: '#3B82F6',
                sort_order: 0,
                active: true
            });
        }
        setErrors({});
    }, [category, isOpen]);

    // Auto-generar slug cuando cambie el nombre
    useEffect(() => {
        if (formData.name && !category) {
            const newSlug = generateSlug(formData.name);
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.name, category]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'El slug es requerido';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Error saving category:', err);
            alert('Error al guardar la categoría: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {category ? 'Editar Categoría' : 'Nueva Categoría'}
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
                        {/* Vista previa */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Vista Previa</h4>
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    {formData.icon ? getIconByName(formData.icon) : <Layers className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {formData.display_name || formData.name || 'Nombre de la Categoría'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formData.slug || 'slug-de-la-categoria'}
                                    </div>
                                </div>
                                <Badge 
                                    variant={formData.active ? 'success' : 'secondary'}
                                    size="sm"
                                >
                                    {formData.active ? 'Activa' : 'Inactiva'}
                                </Badge>
                            </div>
                        </div>

                        {/* Información básica */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Ej: Amenidades"
                                    className={errors.name ? 'border-red-300' : ''}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug *
                                </label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="amenidades"
                                    className={errors.slug ? 'border-red-300' : ''}
                                />
                                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
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
                                placeholder="Descripción de la categoría..."
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
                                            {formData.icon ? getIconByName(formData.icon) : <Layers className="w-4 h-4" />}
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
                                                {Object.keys(ICON_COMPONENTS).map((iconName) => (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('icon', iconName);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                                                        title={iconName}
                                                    >
                                                        {getIconByName(iconName)}
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

                        {/* Estado */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => handleInputChange('active', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Categoría activa</span>
                            </label>
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

// Componente para mostrar una categoría en formato de tarjeta
const CategoryCard = ({ category, onEdit, onDelete, onToggleActive }) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <Card.Body>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color || '#6B7280' }}
                        >
                            {getIconByName(category.icon)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {category.display_name || category.name}
                            </h3>
                            <p className="text-sm text-gray-500">{category.slug}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => onToggleActive(category)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={category.active ? 'Desactivar' : 'Activar'}
                        >
                            {category.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onEdit(category)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(category)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {category.description && (
                    <p className="text-sm text-gray-600 mb-3">
                        {category.description}
                    </p>
                )}
                
                <div className="flex items-center justify-between">
                    <Badge 
                        variant={category.active ? 'success' : 'secondary'}
                        size="sm"
                    >
                        {category.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                        Orden: {category.sort_order || 0}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
};

// Componente principal para gestión de categorías
const TagsCategories = ({ 
    categories = [], 
    searchTerm = '',
    onEdit,
    onDelete,
    onToggleActive,
    onSave,
    showModal,
    onCloseModal,
    selectedCategory
}) => {
    // Filtrar categorías
    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCategories.length === 0) {
        return (
            <div className="text-center py-12">
                <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
                </h3>
                <p className="text-gray-600">
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primera categoría'}
                </p>
                {showModal && (
                    <CategoryModal
                        isOpen={showModal}
                        onClose={onCloseModal}
                        category={selectedCategory}
                        onSave={onSave}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                    />
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <CategoryModal
                    isOpen={showModal}
                    onClose={onCloseModal}
                    category={selectedCategory}
                    onSave={onSave}
                />
            )}
        </div>
    );
};

export default TagsCategories;