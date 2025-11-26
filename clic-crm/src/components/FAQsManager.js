import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Star, Quote,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Youtube, Video, Camera, DollarSign, Users,
    Bed, Bath, Car, Maximize, Building, MessageSquare, Award,
    UserCheck, Phone, Mail, Heart, ThumbsUp, Upload, FileText,
    BookOpen, PenTool, Eye as EyeIcon, HelpCircle, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';
import { Toast } from './ui/Toast';

// FASE 1: Supabase centralizado
import { supabase } from '../services/api';

// FASE 2: Hooks personalizados
import { useDataFetch, useNotification } from '../hooks';

// Función helper para obtener badge de estado
const getStatusBadge = (status) => {
    const statusConfig = {
        'draft': { variant: 'secondary', text: 'Borrador' },
        'published': { variant: 'success', text: 'Publicado' },
        'archived': { variant: 'default', text: 'Archivado' }
    };
    const config = statusConfig[status] || { variant: 'default', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
};

// Función helper para obtener badge de categoría
const getCategoryBadge = (category) => {
    const categoryConfig = {
        'general': { variant: 'default', text: 'General', icon: HelpCircle },
        'compra': { variant: 'success', text: 'Compra', icon: Home },
        'venta': { variant: 'info', text: 'Venta', icon: DollarSign },
        'alquiler': { variant: 'warning', text: 'Alquiler', icon: Users },
        'legal': { variant: 'primary', text: 'Legal', icon: FileText },
        'financiamiento': { variant: 'secondary', text: 'Financiamiento', icon: TrendingUp },
        'proceso': { variant: 'default', text: 'Proceso', icon: Calendar },
        'documentacion': { variant: 'info', text: 'Documentación', icon: Upload }
    };

    const config = categoryConfig[category] || { variant: 'default', text: category, icon: HelpCircle };
    return (
        <Badge variant={config.variant} className="flex items-center space-x-1">
            <config.icon className="w-3 h-3" />
            <span>{config.text}</span>
        </Badge>
    );
};

// Función helper para formatear número de vistas
const formatViews = (views) => {
    if (!views || views === 0) return '0 vistas';
    const num = parseInt(views);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M vistas';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K vistas';
    return num + ' vistas';
};

const FAQManager = ({ user, permissions }) => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'
    const [selectedFaq, setSelectedFaq] = useState(null);

    // Estados para tags
    const [availableTags, setAvailableTags] = useState([]);
    const [tagCategories, setTagCategories] = useState([]);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterPropertyType, setFilterPropertyType] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados del manager
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteFaqId, setDeleteFaqId] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        Promise.all([
            fetchFaqs(),
            fetchTags()
        ]);
    }, []);

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('active', true)
                .order('category, sort_order, name');

            if (error) throw error;

            setAvailableTags(data || []);

            // Extraer categorías únicas
            const categories = [...new Set((data || []).map(tag => tag.category))];
            setTagCategories(categories);
        } catch (err) {
            console.error('Error al cargar tags:', err);
        }
    };

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            setError('');

            // Obtener FAQs con sus relaciones
            const { data: faqsData, error: faqsError } = await supabase
                .from('faqs')
                .select(`
                    *,
                    users!faqs_created_by_id_fkey(
                        id,
                        first_name,
                        last_name,
                        email,
                        profile_photo_url,
                        position
                    ),
                    properties!faqs_property_id_fkey(
                        id,
                        code,
                        name,
                        main_image_url,
                        sale_price,
                        sale_currency,
                        rental_price,
                        rental_currency,
                        cities!properties_city_id_fkey(
                            id,
                            name
                        ),
                        provinces!properties_province_id_fkey(
                            id,
                            name
                        ),
                        property_categories!properties_category_id_fkey(
                            id,
                            name
                        )
                    )
                `)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (faqsError) throw faqsError;

            // Obtener las tags de cada FAQ
            const faqsWithTags = await Promise.all(
                (faqsData || []).map(async (faq) => {
                    try {
                        const { data: tagsData, error: tagsError } = await supabase
                            .from('content_tags')
                            .select(`
                                tag_id,
                                weight,
                                auto_generated,
                                tags!content_tags_tag_id_fkey(
                                    id,
                                    name,
                                    slug,
                                    category,
                                    display_name,
                                    color,
                                    icon
                                )
                            `)
                            .eq('content_id', faq.id)
                            .eq('content_type', 'faq');

                        if (tagsError) {
                            console.warn('Error al cargar tags para FAQ:', faq.id, tagsError);
                        }

                        return {
                            ...faq,
                            tags: tagsData ? tagsData.map(ct => ct.tags).filter(Boolean) : []
                        };
                    } catch (err) {
                        console.warn('Error al procesar tags para FAQ:', faq.id, err);
                        return {
                            ...faq,
                            tags: []
                        };
                    }
                })
            );

            setFaqs(faqsWithTags);
        } catch (err) {
            console.error('Error al cargar FAQs:', err);
            setError('Error al cargar las FAQs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar FAQs
    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.context_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.context_property_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.tags?.some(tag => tag.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = !filterStatus || faq.status === filterStatus;
        const matchesCategory = !filterCategory || faq.category === filterCategory;
        const matchesLocation = !filterLocation || faq.context_location === filterLocation;
        const matchesPropertyType = !filterPropertyType || faq.context_property_type === filterPropertyType;

        // Filtrar por tags seleccionados
        const matchesTags = filterTags.length === 0 ||
            filterTags.every(selectedTagId =>
                faq.tags?.some(tag => tag.id === selectedTagId)
            );

        return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesPropertyType && matchesTags;
    });

    // Paginación
    const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFaqs = filteredFaqs.slice(startIndex, endIndex);

    // Acciones
    const handleCreateFaq = () => {
        setSelectedFaq(null);
        setViewMode('editor');
    };

    const handleEditFaq = (faq) => {
        setSelectedFaq(faq);
        setViewMode('editor');
    };

    const handleDeleteFaq = async (faqId) => {
        try {
            const { error } = await supabase
                .from('faqs')
                .delete()
                .eq('id', faqId);

            if (error) throw error;

            setFaqs(faqs.filter(f => f.id !== faqId));
            setShowDeleteModal(false);
            setDeleteFaqId(null);
        } catch (err) {
            console.error('Error al eliminar FAQ:', err);
            setError('Error al eliminar la FAQ: ' + err.message);
        }
    };

    const handleMoveFaq = async (faqId, direction) => {
        try {
            const faq = faqs.find(f => f.id === faqId);
            if (!faq) return;

            const currentOrder = faq.sort_order || 0;
            const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

            const { error } = await supabase
                .from('faqs')
                .update({ sort_order: newOrder })
                .eq('id', faqId);

            if (error) throw error;

            // Recargar FAQs para ver el nuevo orden
            fetchFaqs();
        } catch (err) {
            console.error('Error al mover FAQ:', err);
            setError('Error al reordenar la FAQ: ' + err.message);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedFaq(null);
        fetchFaqs(); // Recargar para ver cambios
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterCategory, filterLocation, filterPropertyType, filterTags]);

    // Si está en modo editor, mostrar el editor
    if (viewMode === 'editor') {
        // Importar dinámicamente el editor
        const FAQEditor = React.lazy(() => import('./FAQEditor'));

        return (
            <React.Suspense fallback={
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando editor...</p>
                    </div>
                </div>
            }>
                <FAQEditor
                    faq={selectedFaq}
                    onBack={handleBackToList}
                    user={user}
                    permissions={permissions}
                    availableTags={availableTags}
                    tagCategories={tagCategories}
                />
            </React.Suspense>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando FAQs...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Preguntas Frecuentes (FAQs)</h2>
                    <p className="text-sm text-gray-600">
                        {filteredFaqs.length} {filteredFaqs.length === 1 ? 'FAQ encontrada' : 'FAQs encontradas'}
                        {filteredFaqs.length !== faqs.length && ` de ${faqs.length} totales`}
                    </p>
                </div>
                {permissions?.hasAction('create') && (
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleCreateFaq}
                    >
                        Nueva FAQ
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input.Search
                        placeholder="Buscar FAQs..."
                        value={searchTerm}
                        onSearch={setSearchTerm}
                        className="flex-1 min-w-64"
                    />
                    <Input.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            { value: 'draft', label: 'Borrador' },
                            { value: 'published', label: 'Publicado' },
                            { value: 'archived', label: 'Archivado' }
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            { value: 'general', label: 'General' },
                            { value: 'compra', label: 'Compra' },
                            { value: 'venta', label: 'Venta' },
                            { value: 'alquiler', label: 'Alquiler' },
                            { value: 'legal', label: 'Legal' },
                            { value: 'financiamiento', label: 'Financiamiento' },
                            { value: 'proceso', label: 'Proceso' },
                            { value: 'documentacion', label: 'Documentación' }
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las ubicaciones' },
                            { value: 'Santo Domingo', label: 'Santo Domingo' },
                            { value: 'Santiago', label: 'Santiago' },
                            { value: 'Puerto Plata', label: 'Puerto Plata' },
                            { value: 'Punta Cana', label: 'Punta Cana' },
                            { value: 'La Romana', label: 'La Romana' }
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterPropertyType}
                        onChange={(e) => setFilterPropertyType(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los tipos' },
                            { value: 'apartamento', label: 'Apartamento' },
                            { value: 'casa', label: 'Casa' },
                            { value: 'villa', label: 'Villa' },
                            { value: 'penthouse', label: 'Penthouse' },
                            { value: 'local-comercial', label: 'Local Comercial' },
                            { value: 'oficina', label: 'Oficina' },
                            { value: 'terreno', label: 'Terreno' }
                        ]}
                        className="min-w-40"
                    />
                </div>

                {/* Mostrar tags seleccionados para filtro */}
                {filterTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Filtrando por:</span>
                            {filterTags.map(tagId => {
                                const tag = availableTags.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                                        style={{ backgroundColor: tag.color ? tag.color + '20' : undefined }}
                                    >
                                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                        {tag.display_name || tag.name}
                                        <button
                                            onClick={() => setFilterTags(filterTags.filter(id => id !== tagId))}
                                            className="ml-1 text-blue-500 hover:text-blue-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })}
                            <button
                                onClick={() => setFilterTags([])}
                                className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de FAQs */}
            <div className="flex-1 overflow-y-auto">
                {currentFaqs.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pregunta y Respuesta
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contexto
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estadísticas
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentFaqs.map((faq) => (
                                            <tr
                                                key={faq.id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleEditFaq(faq)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                                {faq.question}
                                                            </h3>
                                                        </div>
                                                        <p className="text-xs text-gray-600 line-clamp-3 pl-6">
                                                            {faq.answer}
                                                        </p>
                                                        <div className="flex items-center space-x-3 pl-6">
                                                            {faq.slug && (
                                                                <span className="text-xs text-gray-500">
                                                                    /{faq.slug}
                                                                </span>
                                                            )}
                                                            {faq.featured && (
                                                                <Badge variant="warning" size="sm">
                                                                    <Star className="w-3 h-3 mr-1" />
                                                                    Destacada
                                                                </Badge>
                                                            )}
                                                            {faq.sort_order > 0 && (
                                                                <Badge variant="info" size="sm">
                                                                    Orden: {faq.sort_order}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {/* Tags de la FAQ */}
                                                        {faq.tags && faq.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 pl-6">
                                                                {faq.tags.slice(0, 3).map((tag) => (
                                                                    <span
                                                                        key={tag.id}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                                                        style={{
                                                                            backgroundColor: tag.color ? tag.color + '20' : undefined,
                                                                            color: tag.color || undefined
                                                                        }}
                                                                    >
                                                                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                                                        {tag.display_name || tag.name}
                                                                    </span>
                                                                ))}
                                                                {faq.tags.length > 3 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        +{faq.tags.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getCategoryBadge(faq.category)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {faq.context_location && (
                                                            <div className="flex items-center text-xs text-gray-600">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {faq.context_location}
                                                            </div>
                                                        )}
                                                        {faq.context_property_type && (
                                                            <div className="flex items-center text-xs text-gray-600">
                                                                <Home className="w-3 h-3 mr-1" />
                                                                {faq.context_property_type}
                                                            </div>
                                                        )}
                                                        {faq.properties && (
                                                            <div className="flex items-center text-xs text-blue-600">
                                                                <Building className="w-3 h-3 mr-1" />
                                                                #{faq.properties.code}
                                                            </div>
                                                        )}
                                                        {faq.context_features && faq.context_features.length > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                {faq.context_features.slice(0, 2).join(', ')}
                                                                {faq.context_features.length > 2 && ` +${faq.context_features.length - 2}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getStatusBadge(faq.status)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-1">
                                                            <EyeIcon className="w-3 h-3" />
                                                            <span>{formatViews(faq.views)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400">
                                                            {formatDate(faq.created_at)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            icon={<ArrowUp className="w-4 h-4" />}
                                                            title="Mover arriba"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveFaq(faq.id, 'up');
                                                            }}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            icon={<ArrowDown className="w-4 h-4" />}
                                                            title="Mover abajo"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveFaq(faq.id, 'down');
                                                            }}
                                                        />
                                                        {faq.status === 'published' && faq.slug && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<ExternalLink className="w-4 h-4" />}
                                                                title="Ver FAQ"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/faqs/${faq.slug}`, '_blank');
                                                                }}
                                                            />
                                                        )}
                                                        {permissions?.hasAction('update') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Edit className="w-4 h-4" />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditFaq(faq);
                                                                }}
                                                            />
                                                        )}
                                                        {permissions?.hasAction('delete') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Trash2 className="w-4 h-4" />}
                                                                className="text-red-600 hover:text-red-800"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteFaqId(faq.id);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                <div className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredFaqs.length)} de {filteredFaqs.length} FAQs
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex space-x-1">
                                        {[...Array(totalPages)].map((_, index) => {
                                            const page = index + 1;
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 2 && page <= currentPage + 2)
                                            ) {
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "primary" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(page)}
                                                        className="min-w-[2.5rem]"
                                                    >
                                                        {page}
                                                    </Button>
                                                );
                                            } else if (
                                                page === currentPage - 3 ||
                                                page === currentPage + 3
                                            ) {
                                                return <span key={page} className="px-2 text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron FAQs</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterCategory || filterLocation || filterPropertyType ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza creando tu primera FAQ.'
                            }
                        </p>
                        {permissions?.hasAction('create') && (
                            <Button
                                variant="primary"
                                onClick={handleCreateFaq}
                            >
                                Crear Primera FAQ
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de confirmación de eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar FAQ"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que quieres eliminar esta FAQ? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => handleDeleteFaq(deleteFaqId)}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default FAQManager;