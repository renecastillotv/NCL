import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Eye, EyeOff, Save, X, ChevronDown, 
    Target, Palette, Tag, Grid, List, Search, Filter,
    SlidersHorizontal
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';

// Iconos disponibles para grupos - mapeamos nombres a componentes
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
    'Award': require('lucide-react').Award,
    'Settings': require('lucide-react').Settings,
    'Globe': require('lucide-react').Globe,
    'DollarSign': require('lucide-react').DollarSign,
    'FileText': require('lucide-react').FileText,
    'Maximize': require('lucide-react').Maximize,
    'Flag': require('lucide-react').Users,
    'Target': Target
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
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Target className="w-4 h-4" />;
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

// Modal mejorado para seleccionar tags
const TagSelectorModal = ({ isOpen, onClose, onSelectTag, selectedTags, availableTags, categories }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedCategory('all');
            setShowActiveOnly(true);
            setSortBy('name');
        }
    }, [isOpen]);

    const getFilteredAndSortedTags = () => {
        let filtered = availableTags.filter(tag => {
            const matchesSearch = searchTerm === '' || 
                tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.slug.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
            const matchesActive = !showActiveOnly || tag.active;
            const notSelected = !selectedTags.some(st => st.tag_id === tag.id);

            return matchesSearch && matchesCategory && matchesActive && notSelected;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'category':
                    if (a.category !== b.category) {
                        return a.category.localeCompare(b.category);
                    }
                    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
                case 'recent':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                default:
                    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
            }
        });

        return filtered;
    };

    const getGroupedTags = (tags) => {
        return tags.reduce((acc, tag) => {
            if (!acc[tag.category]) {
                acc[tag.category] = [];
            }
            acc[tag.category].push(tag);
            return acc;
        }, {});
    };

    const filteredTags = getFilteredAndSortedTags();
    const groupedTags = sortBy === 'category' ? getGroupedTags(filteredTags) : { 'all': filteredTags };

    const getCategoryInfo = (categoryName) => {
        return categories.find(cat => cat.name === categoryName) || 
               { display_name: categoryName, icon: 'Tag', color: '#6B7280' };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Seleccionar Tags</h3>
                        <p className="text-sm text-gray-500">
                            {filteredTags.length} tags disponibles
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex flex-col space-y-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar tags por nombre, slug o descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <Input.Select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    options={[
                                        { value: 'all', label: 'Todas las categorías' },
                                        ...categories.map(cat => ({
                                            value: cat.name,
                                            label: cat.display_name
                                        }))
                                    ]}
                                    className="w-48"
                                />
                            </div>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={showActiveOnly}
                                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">Solo activos</span>
                            </label>

                            <div className="flex items-center space-x-2">
                                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                                <Input.Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    options={[
                                        { value: 'name', label: 'Por nombre' },
                                        { value: 'category', label: 'Por categoría' },
                                        { value: 'recent', label: 'Más recientes' }
                                    ]}
                                    className="w-36"
                                />
                            </div>

                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {(searchTerm || selectedCategory !== 'all' || !showActiveOnly || sortBy !== 'name') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setShowActiveOnly(true);
                                        setSortBy('name');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{selectedTags.length} tags seleccionados</span>
                            <span>•</span>
                            <span>{filteredTags.length} disponibles</span>
                            <span>•</span>
                            <span>{availableTags.length} total</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {filteredTags.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No se encontraron tags
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || selectedCategory !== 'all' || !showActiveOnly
                                    ? 'Intenta ajustar los filtros de búsqueda'
                                    : 'Todos los tags disponibles ya están seleccionados'
                                }
                            </p>
                            {(searchTerm || selectedCategory !== 'all' || !showActiveOnly) && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setShowActiveOnly(true);
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedTags).map(([categoryName, categoryTags]) => (
                                <div key={categoryName}>
                                    {sortBy === 'category' && categoryName !== 'all' && (
                                        <div className="flex items-center space-x-2 mb-4">
                                            <div 
                                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                                style={{ backgroundColor: getCategoryInfo(categoryName).color }}
                                            >
                                                {getIconByName(getCategoryInfo(categoryName).icon)}
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {getCategoryInfo(categoryName).display_name}
                                            </h3>
                                            <Badge variant="secondary" size="sm">
                                                {categoryTags.length}
                                            </Badge>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categoryTags.map((tag) => (
                                            <TagSelectorCard
                                                key={tag.id}
                                                tag={tag}
                                                onSelect={onSelectTag}
                                                categoryInfo={getCategoryInfo(tag.category)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Selecciona los tags que quieres incluir en este grupo
                        </div>
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente para mostrar un tag en la vista de tarjetas del selector
const TagSelectorCard = ({ tag, onSelect, categoryInfo }) => {
    return (
        <button
            onClick={() => onSelect(tag)}
            className="block w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: tag.color || '#6B7280' }}
                    >
                        {tag.icon ? getIconByName(tag.icon) : <Tag className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                            {tag.display_name || tag.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{tag.slug}</p>
                    </div>
                </div>
                <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
            
            <div className="flex items-center justify-between">
                <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: categoryInfo.color }}
                >
                    {categoryInfo.display_name}
                </span>
                <Badge 
                    variant={tag.active ? 'success' : 'secondary'}
                    size="sm"
                >
                    {tag.active ? 'Activo' : 'Inactivo'}
                </Badge>
            </div>
            
            {tag.description && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {tag.description}
                </p>
            )}
        </button>
    );
};

// Modal para crear/editar grupos de tags
const GroupModal = ({ isOpen, onClose, group, onSave, tags, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        min_score: 30,
        priority: 1,
        active: true,
        seo_title: '',
        seo_description: '',
        icon: '',
        color: '#3B82F6'
    });
    const [selectedTags, setSelectedTags] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTagSelector, setShowTagSelector] = useState(false);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name || '',
                slug: group.slug || '',
                description: group.description || '',
                min_score: group.min_score || 30,
                priority: group.priority || 1,
                active: group.active !== false,
                seo_title: group.seo_title || '',
                seo_description: group.seo_description || '',
                icon: group.icon || '',
                color: group.color || '#3B82F6'
            });

            if (group.tag_group_tags) {
                setSelectedTags(group.tag_group_tags.map(tgt => ({
                    tag_id: tgt.tag_id,
                    weight: tgt.weight || 1.0,
                    tag: tgt.tags
                })));
            }
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                min_score: 30,
                priority: 1,
                active: true,
                seo_title: '',
                seo_description: '',
                icon: '',
                color: '#3B82F6'
            });
            setSelectedTags([]);
        }
        setErrors({});
    }, [group, isOpen]);

    useEffect(() => {
        if (formData.name && !group) {
            const newSlug = generateSlug(formData.name);
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.name, group]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAddTag = (tag) => {
        const isAlreadySelected = selectedTags.some(st => st.tag_id === tag.id);
        if (!isAlreadySelected) {
            setSelectedTags(prev => [...prev, {
                tag_id: tag.id,
                weight: 1.0,
                tag: tag
            }]);
        }
        setShowTagSelector(false);
    };

    const handleRemoveTag = (tagId) => {
        setSelectedTags(prev => prev.filter(st => st.tag_id !== tagId));
    };

    const handleWeightChange = (tagId, weight) => {
        const numWeight = parseFloat(weight);
        if (isNaN(numWeight) || numWeight < 0 || numWeight > 2) return;
        
        setSelectedTags(prev => prev.map(st => 
            st.tag_id === tagId ? { ...st, weight: numWeight } : st
        ));
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

        if (formData.min_score < 0 || formData.min_score > 100) {
            newErrors.min_score = 'El score mínimo debe estar entre 0 y 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            
            await onSave({
                ...formData,
                selectedTags
            });
            
            onClose();
        } catch (err) {
            console.error('Error saving group:', err);
            alert('Error al guardar el grupo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const availableTagsForSelection = tags.filter(tag => 
        !selectedTags.some(st => st.tag_id === tag.id) && tag.active
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {group ? 'Editar Grupo de Tags' : 'Nuevo Grupo de Tags'}
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
                                    {formData.icon ? getIconByName(formData.icon) : <Target className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {formData.name || 'Nombre del Grupo'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formData.slug || 'slug-del-grupo'} • Min: {formData.min_score}% • Prioridad: {formData.priority} • {selectedTags.length} tags
                                    </div>
                                </div>
                                <Badge 
                                    variant={formData.active ? 'success' : 'secondary'}
                                    size="sm"
                                >
                                    {formData.active ? 'Activo' : 'Inactivo'}
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
                                    placeholder="Ej: Apartamentos para Airbnb"
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
                                    placeholder="apartamentos-para-airbnb"
                                    className={errors.slug ? 'border-red-300' : ''}
                                />
                                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
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
                                placeholder="Descripción del grupo de tags..."
                            />
                        </div>

                        {/* Tags del grupo */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tags del Grupo
                                </label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowTagSelector(true)}
                                    icon={<Plus className="w-4 h-4" />}
                                >
                                    Agregar Tag
                                </Button>
                            </div>
                            
                            {selectedTags.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedTags.map((selectedTag) => (
                                        <div key={selectedTag.tag_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <div 
                                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                                style={{ backgroundColor: selectedTag.tag?.color || '#6B7280' }}
                                            >
                                                {selectedTag.tag?.icon ? getIconByName(selectedTag.tag.icon) : <Tag className="w-3 h-3" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {selectedTag.tag?.display_name || selectedTag.tag?.name}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({selectedTag.tag?.category})
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <label className="text-xs text-gray-500">Peso:</label>
                                                <Input
                                                    type="number"
                                                    value={selectedTag.weight}
                                                    onChange={(e) => handleWeightChange(selectedTag.tag_id, e.target.value)}
                                                    className="w-20 text-sm"
                                                    min="0"
                                                    max="2"
                                                    step="0.1"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTag(selectedTag.tag_id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg">
                                    <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500">No hay tags asignados a este grupo</p>
                                    <p className="text-xs text-gray-400">Los tags determinan qué propiedades pertenecen a este grupo</p>
                                </div>
                            )}
                        </div>

                        {/* Configuración de scoring */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Score Mínimo (%) *
                                </label>
                                <Input
                                    type="number"
                                    value={formData.min_score}
                                    onChange={(e) => handleInputChange('min_score', parseInt(e.target.value) || 0)}
                                    placeholder="30"
                                    min="0"
                                    max="100"
                                    className={errors.min_score ? 'border-red-300' : ''}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Porcentaje mínimo de coincidencia para aplicar este grupo
                                </p>
                                {errors.min_score && <p className="text-red-500 text-xs mt-1">{errors.min_score}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prioridad
                                </label>
                                <Input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
                                    placeholder="1"
                                    min="1"
                                    max="10"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Números menores tienen mayor prioridad
                                </p>
                            </div>
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
                                            {formData.icon ? getIconByName(formData.icon) : <Target className="w-4 h-4" />}
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

                        {/* SEO */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">SEO (Opcional)</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Título SEO
                                    </label>
                                    <Input
                                        value={formData.seo_title}
                                        onChange={(e) => handleInputChange('seo_title', e.target.value)}
                                        placeholder="Título para SEO"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción SEO
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                        value={formData.seo_description}
                                        onChange={(e) => handleInputChange('seo_description', e.target.value)}
                                        placeholder="Descripción para SEO..."
                                    />
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
                                <span className="text-sm font-medium text-gray-700">Grupo activo</span>
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

            {/* Modal selector de tags */}
            <TagSelectorModal
                isOpen={showTagSelector}
                onClose={() => setShowTagSelector(false)}
                onSelectTag={handleAddTag}
                selectedTags={selectedTags}
                availableTags={availableTagsForSelection}
                categories={categories}
            />
        </div>
    );
};

// Componente para mostrar un grupo en formato de tarjeta
const GroupCard = ({ group, onEdit, onDelete, onToggleActive }) => {
    const tagCount = group.tag_group_tags?.length || 0;
    
    return (
        <Card className="hover:shadow-md transition-shadow">
            <Card.Body>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: group.color || '#6B7280' }}
                        >
                            {getIconByName(group.icon) || <Target className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {group.name}
                            </h3>
                            <p className="text-sm text-gray-500">{group.slug}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => onToggleActive(group)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={group.active ? 'Desactivar' : 'Activar'}
                        >
                            {group.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onEdit(group)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(group)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {group.description && (
                    <p className="text-sm text-gray-600 mb-3">
                        {group.description}
                    </p>
                )}

                {/* Tags del grupo */}
                {tagCount > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Tags en este grupo:</p>
                        <div className="flex flex-wrap gap-1">
                            {group.tag_group_tags.slice(0, 3).map((tgt) => (
                                <span
                                    key={tgt.tag_id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                                >
                                    {tgt.tags?.display_name || tgt.tags?.name}
                                    <span className="ml-1 text-gray-500">({tgt.weight})</span>
                                </span>
                            ))}
                            {tagCount > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                                    +{tagCount - 3} más
                                </span>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                        <Badge 
                            variant={group.active ? 'success' : 'secondary'}
                            size="sm"
                        >
                            {group.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-gray-500">
                            {tagCount} tags
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-500">
                        <span>Min: {group.min_score}%</span>
                        <span>Prioridad: {group.priority}</span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

// Componente principal para gestión de grupos
const TagsGroups = ({ 
    groups = [], 
    tags = [],
    categories = [],
    searchTerm = '',
    onEdit,
    onDelete,
    onToggleActive,
    onSave,
    showModal,
    onCloseModal,
    selectedGroup
}) => {
    // Filtrar grupos
    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredGroups.length === 0) {
        return (
            <div className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron grupos' : 'No hay grupos de tags'}
                </h3>
                <p className="text-gray-600">
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer grupo'}
                </p>
                {showModal && (
                    <GroupModal
                        isOpen={showModal}
                        onClose={onCloseModal}
                        group={selectedGroup}
                        onSave={onSave}
                        tags={tags}
                        categories={categories}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredGroups.map((group) => (
                    <GroupCard
                        key={group.id}
                        group={group}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                    />
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <GroupModal
                    isOpen={showModal}
                    onClose={onCloseModal}
                    group={selectedGroup}
                    onSave={onSave}
                    tags={tags}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default TagsGroups;