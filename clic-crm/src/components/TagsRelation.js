import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Edit, Trash2, Search, Filter, Grid, List, 
    Save, X, ArrowRight, Database, Box, Eye, EyeOff,
    Home, Building, Users, User, Target, Zap, FileText,
    Tag, ChevronDown, MapPin, Wifi, Car, Bath, Bed,
    TreePine, Waves, Dumbbell, Shield, Camera, Coffee,
    Utensils, Laptop, Sun, Star, Heart, Settings,
    Globe, DollarSign, Maximize, Award, Layers, Video,
    ExternalLink, BookOpen, Check
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';



import { supabase } from '../services/api';

// Tipos de contenido disponibles (basados en datos reales)
const CONTENT_TYPES = [
    { 
        value: 'property', 
        label: 'Propiedades', 
        description: 'Bienes raíces y propiedades inmobiliarias',
        icon: <Home className="w-4 h-4" />,
        color: '#10B981'
    },
    { 
        value: 'article', 
        label: 'Artículos', 
        description: 'Artículos de blog y contenido editorial',
        icon: <FileText className="w-4 h-4" />,
        color: '#3B82F6'
    },
    { 
        value: 'video', 
        label: 'Videos', 
        description: 'Contenido audiovisual y multimedia',
        icon: <Video className="w-4 h-4" />,
        color: '#EF4444'
    },
    { 
        value: 'seo_content', 
        label: 'Contenido SEO', 
        description: 'Contenido optimizado para motores de búsqueda',
        icon: <Search className="w-4 h-4" />,
        color: '#8B5CF6'
    },
    { 
        value: 'faq', 
        label: 'Preguntas Frecuentes', 
        description: 'Secciones de preguntas y respuestas',
        icon: <Users className="w-4 h-4" />,
        color: '#F59E0B'
    },
    { 
        value: 'testimonial', 
        label: 'Testimonios', 
        description: 'Reseñas y testimonios de clientes',
        icon: <Star className="w-4 h-4" />,
        color: '#06B6D4'
    }
];

// Función helper local para iconos de tags
const renderTagIcon = (iconName) => {
    const icons = {
        'Home': <Home className="w-4 h-4" />,
        'Building': <Building className="w-4 h-4" />,
        'MapPin': <MapPin className="w-4 h-4" />,
        'Wifi': <Wifi className="w-4 h-4" />,
        'Car': <Car className="w-4 h-4" />,
        'Bath': <Bath className="w-4 h-4" />,
        'Bed': <Bed className="w-4 h-4" />,
        'TreePine': <TreePine className="w-4 h-4" />,
        'Waves': <Waves className="w-4 h-4" />,
        'Dumbbell': <Dumbbell className="w-4 h-4" />,
        'Shield': <Shield className="w-4 h-4" />,
        'Camera': <Camera className="w-4 h-4" />,
        'Coffee': <Coffee className="w-4 h-4" />,
        'Utensils': <Utensils className="w-4 h-4" />,
        'Laptop': <Laptop className="w-4 h-4" />,
        'Sun': <Sun className="w-4 h-4" />,
        'Star': <Star className="w-4 h-4" />,
        'Heart': <Heart className="w-4 h-4" />,
        'Target': <Target className="w-4 h-4" />,
        'Award': <Award className="w-4 h-4" />,
        'Tag': <Tag className="w-4 h-4" />,
        'Settings': <Settings className="w-4 h-4" />,
        'Globe': <Globe className="w-4 h-4" />,
        'DollarSign': <DollarSign className="w-4 h-4" />,
        'FileText': <FileText className="w-4 h-4" />,
        'Maximize': <Maximize className="w-4 h-4" />,
        'Flag': <Users className="w-4 h-4" />
    };
    
    return icons[iconName] || <Tag className="w-4 h-4" />;
};

// Función helper para obtener información del tipo de contenido
const getContentTypeData = (contentType) => {
    return CONTENT_TYPES.find(type => type.value === contentType) || {
        value: contentType,
        label: contentType,
        description: 'Tipo de contenido personalizado',
        icon: <Box className="w-4 h-4" />,
        color: '#6B7280'
    };
};

// Modal para gestionar tags de un contenido específico
const ContentTagsManagerModal = ({ isOpen, onClose, contentItem, tags, categories, onTagsChange }) => {
    const [contentTags, setContentTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddTagModal, setShowAddTagModal] = useState(false);

    useEffect(() => {
        if (isOpen && contentItem) {
            loadContentTags();
        }
    }, [isOpen, contentItem]);

    const loadContentTags = async () => {
        if (!contentItem) return;
        
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_tags')
                .select(`
                    *,
                    tag:tags(id, name, display_name, color, icon, category)
                `)
                .eq('content_id', contentItem.content_id)
                .eq('content_type', contentItem.content_type);

            if (error) throw error;
            setContentTags(data || []);
        } catch (err) {
            console.error('Error loading content tags:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTag = async (contentTagId) => {
        try {
            const { error } = await supabase
                .from('content_tags')
                .delete()
                .eq('id', contentTagId);

            if (error) throw error;
            
            await loadContentTags();
            onTagsChange && onTagsChange();
        } catch (err) {
            console.error('Error removing tag:', err);
            alert('Error al eliminar el tag: ' + err.message);
        }
    };

    const handleAddTags = async (selectedTags) => {
        try {
            const newContentTags = selectedTags.map(tagData => ({
                content_id: contentItem.content_id,
                content_type: contentItem.content_type,
                tag_id: tagData.tag_id,
                weight: tagData.weight || 1.0,
                auto_generated: false
            }));

            const { error } = await supabase
                .from('content_tags')
                .insert(newContentTags);

            if (error) throw error;
            
            await loadContentTags();
            onTagsChange && onTagsChange();
            setShowAddTagModal(false);
        } catch (err) {
            console.error('Error adding tags:', err);
            alert('Error al agregar tags: ' + err.message);
        }
    };

    if (!isOpen) return null;

    const contentTypeData = getContentTypeData(contentItem?.content_type);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: contentTypeData.color }}
                        >
                            {contentTypeData.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Gestión de Tags</h3>
                            <p className="text-sm text-gray-600">{contentItem?.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Resumen del Contenido</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex items-center space-x-4 mb-3">
                                    {/* Imagen del contenido */}
                                    <ContentImage contentItem={contentItem} size="w-16 h-16" />
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div 
                                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                                                style={{ backgroundColor: contentTypeData.color }}
                                            >
                                                {contentTypeData.icon}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Tipo:</span>
                                                <span className="ml-2 text-lg font-semibold text-gray-900">{contentTypeData.label}</span>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium text-gray-700">Título:</span>
                                            <div className="mt-1 text-gray-900 font-medium">
                                                {contentItem?.title !== contentItem?.content_id?.substring(0, 8) + '...' 
                                                    ? contentItem?.title 
                                                    : 'Contenido sin título disponible'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {contentItem?.description && 
                             contentItem.description !== 'Sin descripción' && 
                             contentItem.description !== 'Error al cargar' && 
                             contentItem.description !== 'Contenido no encontrado' && (
                                <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">Descripción:</span>
                                    <p className="ml-2 mt-1 text-gray-600">{contentItem.description}</p>
                                </div>
                            )}
                            
                            {/* Mostrar información específica según el tipo */}
                            {contentItem?.code && (
                                <div>
                                    <span className="font-medium text-gray-700">Código:</span>
                                    <span className="ml-2 text-gray-900">#{contentItem.code}</span>
                                </div>
                            )}
                            
                            {contentItem?.internal_code && (
                                <div>
                                    <span className="font-medium text-gray-700">Código Interno:</span>
                                    <span className="ml-2 text-gray-900">{contentItem.internal_code}</span>
                                </div>
                            )}
                            
                            {contentItem?.category && (
                                <div>
                                    <span className="font-medium text-gray-700">Categoría:</span>
                                    <span className="ml-2 text-gray-900">{contentItem.category}</span>
                                </div>
                            )}
                            
                            {contentItem?.slug && (
                                <div>
                                    <span className="font-medium text-gray-700">Slug:</span>
                                    <span className="ml-2 text-gray-900 font-mono text-sm">{contentItem.slug}</span>
                                </div>
                            )}
                            
                            {(contentItem?.status || contentItem?.property_status) && (
                                <div>
                                    <span className="font-medium text-gray-700">Estado:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                        (contentItem.status === 'published' || contentItem.property_status === 'Publicada') 
                                            ? 'bg-green-100 text-green-800' 
                                            : contentItem.status === 'draft' 
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {contentItem.property_status || contentItem.status}
                                    </span>
                                </div>
                            )}
                            
                            <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-700">ID del Sistema:</span>
                                <span className="ml-2 font-mono text-xs text-gray-500">{contentItem?.content_id}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(contentItem?.content_id)}
                                    className="ml-2 text-xs text-orange-600 hover:text-orange-800"
                                    title="Copiar ID"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de tags asignados */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                            Tags Asignados ({contentTags.length})
                        </h4>
                        <Button
                            variant="primary"
                            onClick={() => setShowAddTagModal(true)}
                            icon={<Plus className="w-4 h-4" />}
                            size="sm"
                        >
                            Agregar Tags
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                            <p className="text-gray-600">Cargando tags...</p>
                        </div>
                    ) : contentTags.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500 mb-2">No hay tags asignados</p>
                            <Button
                                variant="outline"
                                onClick={() => setShowAddTagModal(true)}
                                icon={<Plus className="w-4 h-4" />}
                                size="sm"
                            >
                                Agregar primer tag
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {contentTags.map((contentTag) => (
                                <div key={contentTag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                                            style={{ backgroundColor: contentTag.tag?.color || '#6B7280' }}
                                        >
                                            {renderTagIcon(contentTag.tag?.icon)}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                {contentTag.tag?.display_name || contentTag.tag?.name}
                                            </span>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{contentTag.tag?.category}</span>
                                                <span>•</span>
                                                <span>Peso: {contentTag.weight}</span>
                                                {contentTag.auto_generated && (
                                                    <>
                                                        <span>•</span>
                                                        <Badge variant="secondary" size="sm">Auto</Badge>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveTag(contentTag.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t">
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal para agregar tags */}
            {showAddTagModal && (
                <AddTagsModal
                    isOpen={showAddTagModal}
                    onClose={() => setShowAddTagModal(false)}
                    onSave={handleAddTags}
                    tags={tags}
                    categories={categories}
                    excludeTagIds={contentTags.map(ct => ct.tag_id)}
                />
            )}
        </div>
    );
};

// Modal para agregar múltiples tags
const AddTagsModal = ({ isOpen, onClose, onSave, tags, categories, excludeTagIds = [] }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const availableTags = tags.filter(tag => 
        tag.active && !excludeTagIds.includes(tag.id)
    );

    const filteredTags = availableTags.filter(tag => {
        const matchesSearch = searchTerm === '' || 
            tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.slug.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const getCategoryData = (categoryName) => {
        return categories.find(cat => cat.name === categoryName) || 
               { display_name: categoryName, color: '#6B7280' };
    };

    const handleToggleTag = (tag) => {
        const existingIndex = selectedTags.findIndex(st => st.tag_id === tag.id);
        
        if (existingIndex >= 0) {
            // Remover tag
            setSelectedTags(prev => prev.filter((_, index) => index !== existingIndex));
        } else {
            // Agregar tag
            setSelectedTags(prev => [...prev, {
                tag_id: tag.id,
                weight: 1.0,
                tag: tag
            }]);
        }
    };

    const handleWeightChange = (tagId, weight) => {
        const numWeight = parseFloat(weight);
        if (isNaN(numWeight) || numWeight < 0 || numWeight > 2) return;
        
        setSelectedTags(prev => prev.map(st => 
            st.tag_id === tagId ? { ...st, weight: numWeight } : st
        ));
    };

    const handleSave = () => {
        if (selectedTags.length === 0) {
            alert('Selecciona al menos un tag');
            return;
        }
        onSave(selectedTags);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Agregar Tags</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex space-x-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
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
                    
                    {selectedTags.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {selectedTags.length} tag(s) seleccionado(s)
                        </div>
                    )}
                </div>

                {/* Lista de tags */}
                <div className="flex-1 overflow-y-auto max-h-[40vh]">
                    <div className="p-6">
                        {filteredTags.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-500">No se encontraron tags</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredTags.map((tag) => {
                                    const categoryData = getCategoryData(tag.category);
                                    const isSelected = selectedTags.some(st => st.tag_id === tag.id);
                                    const selectedTag = selectedTags.find(st => st.tag_id === tag.id);
                                    
                                    return (
                                        <div
                                            key={tag.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'border-orange-500 bg-orange-50' 
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleToggleTag(tag)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div 
                                                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                                                        style={{ backgroundColor: tag.color || '#6B7280' }}
                                                    >
                                                        {renderTagIcon(tag.icon)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {tag.display_name || tag.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {categoryData.display_name}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {isSelected && (
                                                        <Input
                                                            type="number"
                                                            value={selectedTag?.weight || 1.0}
                                                            onChange={(e) => handleWeightChange(tag.id, e.target.value)}
                                                            className="w-16 text-sm"
                                                            min="0"
                                                            max="2"
                                                            step="0.1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'bg-orange-500 border-orange-500' 
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags seleccionados */}
                {selectedTags.length > 0 && (
                    <div className="px-6 py-4 border-t bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Tags Seleccionados:</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((selectedTag) => (
                                <Badge
                                    key={selectedTag.tag_id}
                                    variant="outline"
                                    className="flex items-center space-x-1"
                                >
                                    <span>{selectedTag.tag?.display_name || selectedTag.tag?.name}</span>
                                    <span className="text-xs text-gray-500">({selectedTag.weight})</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-6 py-3 bg-gray-50 border-t flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={selectedTags.length === 0}
                        icon={<Save className="w-4 h-4" />}
                    >
                        Agregar {selectedTags.length} Tag(s)
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Función helper para limpiar HTML de las descripciones
const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const InitialsAvatar = ({ name, size = 'w-10 h-10' }) => {
    const getInitials = (fullName) => {
        if (!fullName) return '??';
        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return names[0].substring(0, 2).toUpperCase();
        }
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const getBackgroundColor = (name) => {
        const colors = [
            'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
        ];
        const index = name?.length ? name.length % colors.length : 0;
        return colors[index];
    };

    return (
        <div className={`${size} rounded-full ${getBackgroundColor(name)} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
            {getInitials(name)}
        </div>
    );
};

// Componente para mostrar imagen o fallback
const ContentImage = ({ contentItem, size = 'w-10 h-10' }) => {
    const { image_url, title, content_type } = contentItem;

    if (image_url) {
        return (
            <div className={`${size} rounded-lg overflow-hidden flex-shrink-0 bg-gray-100`}>
                <img 
                    src={image_url} 
                    alt={title || 'Imagen del contenido'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div className="w-full h-full hidden">
                    {content_type === 'testimonial' ? (
                        <InitialsAvatar name={title} size={size} />
                    ) : (
                        <div className={`${size} rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0`}>
                            {getContentTypeData(content_type).icon}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (content_type === 'testimonial') {
        return <InitialsAvatar name={title} size={size} />;
    }

    const contentTypeData = getContentTypeData(content_type);
    return (
        <div 
            className={`${size} rounded-lg flex items-center justify-center text-white flex-shrink-0`}
            style={{ backgroundColor: contentTypeData.color }}
        >
            {contentTypeData.icon}
        </div>
    );
};

const getContentDisplayInfo = (contentItem) => {
    const contentTypeData = getContentTypeData(contentItem.content_type);
    
    let displayTitle = contentItem.title;
    let displaySubtitle = '';
    let displayMeta = [];
    
    switch (contentItem.content_type) {
        case 'property':
            if (contentItem.code) {
                displayTitle = `${contentItem.title} (#${contentItem.code})`;
            } else if (contentItem.internal_code) {
                displayTitle = `${contentItem.title} (${contentItem.internal_code})`;
            }
            
            if (contentItem.property_status || contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.property_status || contentItem.status}`);
            }
            break;
            
        case 'article':
            if (contentItem.category) {
                displaySubtitle = `Categoría: ${contentItem.category}`;
            }
            if (contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.status}`);
            }
            break;
            
        case 'video':
            if (contentItem.category) {
                displaySubtitle = `Categoría: ${contentItem.category}`;
            }
            if (contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.status}`);
            }
            break;
            
        case 'testimonial':
            if (contentItem.category) {
                displaySubtitle = `Testimonio de ${contentItem.category}`;
            }
            if (contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.status}`);
            }
            break;
            
        case 'faq':
            displayTitle = contentItem.title?.length > 60 
                ? contentItem.title.substring(0, 60) + '...' 
                : contentItem.title;
            if (contentItem.category) {
                displaySubtitle = `Categoría: ${contentItem.category}`;
            }
            if (contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.status}`);
            }
            break;
            
        case 'seo_content':
            if (contentItem.category) {
                displaySubtitle = `Tipo: ${contentItem.category}`;
            }
            if (contentItem.status) {
                displayMeta.push(`Estado: ${contentItem.status}`);
            }
            break;
    }
    
    displayMeta.push(`${contentItem.tags?.length || 0} tags`);
    
    return {
        displayTitle,
        displaySubtitle,
        displayMeta: displayMeta.join(' • '),
        contentTypeData
    };
};

// Componente para mostrar un contenido con sus tags
const ContentTagRow = ({ contentItem, onOpenModal, onRemoveTag }) => {
    const { displayTitle, displaySubtitle, displayMeta, contentTypeData } = getContentDisplayInfo(contentItem);
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
            case 'Publicada':
                return 'text-green-600';
            case 'draft':
                return 'text-yellow-600';
            case 'archived':
                return 'text-red-600';
            case 'missing':
                return 'text-gray-400';
            default:
                return 'text-gray-600';
        }
    };
    
    return (
        <div 
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onOpenModal(contentItem)}
        >
            {/* Resumen del contenido */}
            <div className="flex items-center space-x-4 flex-1">
                <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: contentTypeData.color }}
                >
                    {contentTypeData.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-base">
                        {displayTitle}
                    </h3>
                    <div className="space-y-1">
                        {displaySubtitle && (
                            <div className="text-sm text-gray-600">
                                {displaySubtitle}
                            </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-600 font-medium">{contentTypeData.label}</span>
                            <span className="text-gray-400">•</span>
                            <span className={`text-xs ${getStatusColor(contentItem.status)}`}>
                                {displayMeta}
                            </span>
                        </div>
                        {contentItem.description && 
                         contentItem.description !== 'Sin descripción' && 
                         contentItem.description !== 'Error al cargar' && (
                            <p className="text-xs text-gray-500 truncate max-w-md">
                                {contentItem.description.length > 120 
                                    ? contentItem.description.substring(0, 120) + '...' 
                                    : contentItem.description
                                }
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tags asignados */}
            <div className="flex items-center space-x-2 max-w-md">
                {contentItem.tags?.slice(0, 3).map((contentTag) => (
                    <div
                        key={contentTag.id}
                        className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1 group/tag hover:bg-gray-200 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: contentTag.tag?.color || '#6B7280' }}
                        >
                            {renderTagIcon(contentTag.tag?.icon)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {contentTag.tag?.display_name || contentTag.tag?.name}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTag(contentTag.id);
                            }}
                            className="opacity-0 group-hover/tag:opacity-100 text-red-500 hover:text-red-700 transition-opacity ml-1"
                            title="Eliminar tag"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {(contentItem.tags?.length || 0) > 3 && (
                    <Badge variant="secondary" size="sm" className="bg-orange-100 text-orange-700">
                        +{(contentItem.tags?.length || 0) - 3} más
                    </Badge>
                )}
            </div>

            {/* Indicador de que es clickeable */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
        </div>
    );
};

// Componente principal de gestión de relaciones
const TagsRelation = ({ relations, tags, categories, searchTerm, onRelationsChange, onSearchChange }) => {
    const [contentItems, setContentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterContentType, setFilterContentType] = useState('all');
    const [filterHasTag, setFilterHasTag] = useState('all');
    const [selectedContentItem, setSelectedContentItem] = useState(null);
    const [showContentModal, setShowContentModal] = useState(false);

    // Estado interno del buscador
    const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm || '');

    // Sincronizar el searchTerm interno con el del padre
    useEffect(() => {
        setInternalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    // Función optimizada para consultas batch por tipo de contenido
    const getContentInfoBatch = async (contentType, contentIds) => {
        try {
            let tableName = '';
            let selectFields = '';
            
            switch (contentType) {
                case 'property':
                    tableName = 'properties';
                    selectFields = 'id, name, description, code, internal_code, property_status, main_image_url';
                    break;
                case 'article':
                    tableName = 'articles';
                    selectFields = 'id, title, excerpt, slug, status, category, featured_image';
                    break;
                case 'video':
                    tableName = 'videos';
                    selectFields = 'id, title, description, video_slug, status, category, thumbnail';
                    break;
                case 'seo_content':
                    tableName = 'seo_content';
                    selectFields = 'id, title, description, slug, status, content_type';
                    break;
                case 'faq':
                    tableName = 'faqs';
                    selectFields = 'id, question, answer, slug, status, category';
                    break;
                case 'testimonial':
                    tableName = 'testimonials';
                    selectFields = 'id, title, client_name, excerpt, slug, status, category, client_avatar';
                    break;
                default:
                    return contentIds.map(id => ({
                        id,
                        title: id.substring(0, 8) + '...',
                        description: 'Tipo de contenido no soportado',
                        status: 'unknown'
                    }));
            }

            const { data, error } = await supabase
                .from(tableName)
                .select(selectFields)
                .in('id', contentIds);

            if (error) {
                console.error(`Supabase error for ${contentType}:`, error);
                throw error;
            }

            // Normalizar los datos para que todos tengan los mismos campos
            const normalizedData = data.map(item => {
                let normalized = {
                    id: item.id,
                    title: '',
                    description: '',
                    status: item.status || 'unknown',
                    image_url: null
                };

                switch (contentType) {
                    case 'property':
                        normalized.title = item.name || 'Sin nombre';
                        normalized.description = stripHtml(item.description) || 'Sin descripción';
                        normalized.code = item.code;
                        normalized.internal_code = item.internal_code;
                        normalized.property_status = item.property_status;
                        normalized.image_url = item.main_image_url;
                        break;
                        
                    case 'article':
                        normalized.title = item.title || 'Sin título';
                        normalized.description = stripHtml(item.excerpt) || 'Sin descripción';
                        normalized.slug = item.slug;
                        normalized.category = item.category;
                        normalized.image_url = item.featured_image;
                        break;
                        
                    case 'video':
                        normalized.title = item.title || 'Sin título';
                        normalized.description = stripHtml(item.description) || 'Sin descripción';
                        normalized.slug = item.video_slug;
                        normalized.category = item.category;
                        normalized.image_url = item.thumbnail;
                        break;
                        
                    case 'faq':
                        normalized.title = item.question || 'Sin pregunta';
                        normalized.description = stripHtml(item.answer) || 'Sin respuesta';
                        normalized.slug = item.slug;
                        normalized.category = item.category;
                        break;
                        
                    case 'testimonial':
                        normalized.title = item.client_name || item.title || 'Sin nombre';
                        normalized.description = stripHtml(item.excerpt) || 'Sin descripción';
                        normalized.slug = item.slug;
                        normalized.category = item.category;
                        normalized.image_url = item.client_avatar;
                        break;
                        
                    case 'seo_content':
                        normalized.title = item.title || 'Sin título';
                        normalized.description = stripHtml(item.description) || 'Sin descripción';
                        normalized.slug = item.slug;
                        normalized.category = item.content_type;
                        break;
                }

                return normalized;
            });

            return normalizedData;
        } catch (err) {
            console.error(`Error loading ${contentType}:`, err);
            return contentIds.map(id => ({
                id,
                title: id.substring(0, 8) + '...',
                description: 'Error al cargar',
                status: 'error'
            }));
        }
    };

    const loadContentItems = async () => {
        try {
            setLoading(true);
            
            // 1. Cargar todas las relaciones content_tags con información de tags
            const { data: contentTagsData, error } = await supabase
                .from('content_tags')
                .select(`
                    *,
                    tag:tags(id, name, display_name, color, icon, category)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Agrupar content_ids por tipo para consultas batch
            const contentByType = {};
            contentTagsData.forEach(contentTag => {
                if (!contentByType[contentTag.content_type]) {
                    contentByType[contentTag.content_type] = new Set();
                }
                contentByType[contentTag.content_type].add(contentTag.content_id);
            });

            // 3. Hacer consultas batch por tipo (máximo 6 consultas en lugar de N)
            const contentInfoMap = new Map();
            
            for (const [contentType, contentIds] of Object.entries(contentByType)) {
                const contentArray = Array.from(contentIds);
                const contentInfo = await getContentInfoBatch(contentType, contentArray);
                
                contentInfo.forEach(info => {
                    contentInfoMap.set(`${contentType}-${info.id}`, info);
                });
            }

            // 4. Construir el resultado final agrupando por contenido
            const contentMap = new Map();
            
            for (const contentTag of contentTagsData) {
                const key = `${contentTag.content_type}-${contentTag.content_id}`;
                
                if (!contentMap.has(key)) {
                    const contentInfo = contentInfoMap.get(key) || {
                        id: contentTag.content_id,
                        title: contentTag.content_id.substring(0, 8) + '...',
                        description: 'Contenido no encontrado',
                        status: 'missing'
                    };
                    
                    contentMap.set(key, {
                        content_id: contentTag.content_id,
                        content_type: contentTag.content_type,
                        title: contentInfo.title || 'Sin título',
                        description: contentInfo.description || 'Sin descripción',
                        status: contentInfo.status || 'unknown',
                        // Campos adicionales específicos por tipo
                        ...(contentInfo.code && { code: contentInfo.code }),
                        ...(contentInfo.internal_code && { internal_code: contentInfo.internal_code }),
                        ...(contentInfo.slug && { slug: contentInfo.slug }),
                        ...(contentInfo.category && { category: contentInfo.category }),
                        ...(contentInfo.property_status && { property_status: contentInfo.property_status }),
                        // Campos de imagen según el tipo
                        ...(contentInfo.main_image_url && { image_url: contentInfo.main_image_url }),
                        ...(contentInfo.featured_image && { image_url: contentInfo.featured_image }),
                        ...(contentInfo.thumbnail && { image_url: contentInfo.thumbnail }),
                        ...(contentInfo.client_avatar && { image_url: contentInfo.client_avatar }),
                        tags: []
                    });
                }
                
                contentMap.get(key).tags.push(contentTag);
            }

            setContentItems(Array.from(contentMap.values()));
        } catch (err) {
            console.error('Error loading content items:', err);
            alert('Error al cargar el contenido: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // useEffect principal - solo se ejecuta una vez al montar el componente
    useEffect(() => {
        let mounted = true;
        
        const initializeData = async () => {
            if (mounted) {
                await loadContentItems();
            }
        };
        
        initializeData();
        
        // Cleanup para evitar actualizaciones de estado si el componente se desmonta
        return () => {
            mounted = false;
        };
    }, []); // Array de dependencias vacío - solo ejecuta una vez

    const handleRemoveTag = useCallback(async (contentTagId) => {
        try {
            const { error } = await supabase
                .from('content_tags')
                .delete()
                .eq('id', contentTagId);

            if (error) throw error;
            
            await loadContentItems();
            onRelationsChange && onRelationsChange();
        } catch (err) {
            console.error('Error removing tag:', err);
            alert('Error al eliminar el tag: ' + err.message);
        }
    }, [onRelationsChange]);

    const handleOpenContentModal = (contentItem) => {
        setSelectedContentItem(contentItem);
        setShowContentModal(true);
    };

    const handleTagsChange = useCallback(async () => {
        await loadContentItems();
        onRelationsChange && onRelationsChange();
    }, [onRelationsChange]);

    // Manejar cambios en el buscador
    const handleSearchChange = (newSearchTerm) => {
        setInternalSearchTerm(newSearchTerm);
        // Propagar el cambio al componente padre si existe la función
        onSearchChange && onSearchChange(newSearchTerm);
    };

    // Función helper para búsqueda segura
    const safeStringMatch = (value, searchTerm) => {
        if (!value || !searchTerm) return false;
        const str = typeof value === 'string' ? value : String(value);
        return str.toLowerCase().includes(searchTerm.toLowerCase());
    };

    // Filtrar contenido
    const filteredContentItems = contentItems.filter(contentItem => {
        // Filtro por tipo de contenido
        const matchesContentType = filterContentType === 'all' || contentItem.content_type === filterContentType;
        
        // Filtro por presencia de tags
        const matchesHasTag = filterHasTag === 'all' || 
                            (filterHasTag === 'with_tags' && contentItem.tags.length > 0) ||
                            (filterHasTag === 'without_tags' && contentItem.tags.length === 0);

        // Filtro por búsqueda
        const matchesSearch = internalSearchTerm === '' ||
                            safeStringMatch(contentItem.title, internalSearchTerm) ||
                            safeStringMatch(contentItem.content_id, internalSearchTerm) ||
                            safeStringMatch(contentItem.code, internalSearchTerm) ||
                            safeStringMatch(contentItem.internal_code, internalSearchTerm) ||
                            safeStringMatch(contentItem.slug, internalSearchTerm) ||
                            safeStringMatch(contentItem.category, internalSearchTerm) ||
                            contentItem.tags.some(ct => 
                                safeStringMatch(ct.tag?.name, internalSearchTerm) ||
                                safeStringMatch(ct.tag?.display_name, internalSearchTerm)
                            );

        return matchesContentType && matchesHasTag && matchesSearch;
    });

    // Estadísticas
    const stats = {
        total: contentItems.length,
        withTags: contentItems.filter(ci => ci.tags.length > 0).length,
        withoutTags: contentItems.filter(ci => ci.tags.length === 0).length,
        byType: CONTENT_TYPES.reduce((acc, type) => {
            acc[type.value] = contentItems.filter(ci => ci.content_type === type.value).length;
            return acc;
        }, {})
    };

    return (
        <div className="space-y-4">
            {/* Header compacto */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Gestión de Contenido y Tags</h2>
                        <p className="text-sm text-gray-600">
                            Administra los tags asignados a cada elemento de contenido
                        </p>
                    </div>
                    {/* Estadísticas compactas */}
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{stats.withTags}</div>
                            <div className="text-xs text-gray-600">Con Tags</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{stats.withoutTags}</div>
                            <div className="text-xs text-gray-600">Sin Tags</div>
                        </div>
                    </div>
                </div>

                {/* Barra de búsqueda y filtros unificada */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Campo de búsqueda */}
                    <div className="relative flex-1 min-w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar contenido, tags o IDs..."
                            value={internalSearchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Input.Select
                            value={filterContentType}
                            onChange={(e) => setFilterContentType(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todos los tipos' },
                                ...CONTENT_TYPES.map(type => ({
                                    value: type.value,
                                    label: `${type.label} (${stats.byType[type.value] || 0})`
                                }))
                            ]}
                            className="w-48"
                        />
                    </div>

                    <Input.Select
                        value={filterHasTag}
                        onChange={(e) => setFilterHasTag(e.target.value)}
                        options={[
                            { value: 'all', label: 'Todos' },
                            { value: 'with_tags', label: `Con tags (${stats.withTags})` },
                            { value: 'without_tags', label: `Sin tags (${stats.withoutTags})` }
                        ]}
                        className="w-40"
                    />

                    <div className="text-sm text-gray-500">
                        {filteredContentItems.length} de {contentItems.length} elementos
                    </div>

                    {(filterContentType !== 'all' || filterHasTag !== 'all' || internalSearchTerm) && (
                        <button
                            onClick={() => {
                                setFilterContentType('all');
                                setFilterHasTag('all');
                                handleSearchChange('');
                            }}
                            className="text-sm text-orange-600 hover:text-orange-800"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de contenido */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando contenido...</p>
                </div>
            ) : filteredContentItems.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {contentItems.length === 0 ? 'No hay contenido' : 'No se encontró contenido'}
                    </h3>
                    <p className="text-gray-600">
                        {contentItems.length === 0 
                            ? 'No hay contenido con tags asignados'
                            : 'Intenta ajustar los filtros de búsqueda'
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredContentItems.map((contentItem) => (
                        <ContentTagRow
                            key={`${contentItem.content_type}-${contentItem.content_id}`}
                            contentItem={contentItem}
                            onOpenModal={handleOpenContentModal}
                            onRemoveTag={handleRemoveTag}
                        />
                    ))}
                </div>
            )}

            {/* Modal de gestión de tags */}
            <ContentTagsManagerModal
                isOpen={showContentModal}
                onClose={() => {
                    setShowContentModal(false);
                    setSelectedContentItem(null);
                }}
                contentItem={selectedContentItem}
                tags={tags}
                categories={categories}
                onTagsChange={handleTagsChange}
            />
        </div>
    );
};

export default TagsRelation;