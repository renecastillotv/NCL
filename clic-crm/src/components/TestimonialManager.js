import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Star, Quote,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Youtube, Video, Camera, DollarSign, Users,
    Bed, Bath, Car, Maximize, Building, MessageSquare, Award,
    UserCheck, Phone, Mail, Heart, ThumbsUp, Upload, FileText
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
        'compradores': { variant: 'success', text: 'Compradores', icon: Home },
        'vendedores': { variant: 'info', text: 'Vendedores', icon: DollarSign },
        'inversores': { variant: 'warning', text: 'Inversores', icon: TrendingUp },
        'inquilinos': { variant: 'default', text: 'Inquilinos', icon: Users }
    };

    const config = categoryConfig[category] || { variant: 'default', text: category, icon: MessageSquare };
    return (
        <Badge variant={config.variant} className="flex items-center space-x-1">
            <config.icon className="w-3 h-3" />
            <span>{config.text}</span>
        </Badge>
    );
};

// Función helper para obtener estrellas de rating
const getRatingStars = (rating) => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                />
            ))}
            <span className="text-sm text-gray-600 ml-1">({rating})</span>
        </div>
    );
};

const TestimonialManager = ({ user, permissions }) => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterRating, setFilterRating] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados del manager
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTestimonialId, setDeleteTestimonialId] = useState(null);

    // FASE 2: useNotification
    const { notification, showSuccess, showError, clearNotification } = useNotification();

    // FASE 2: useDataFetch para tags
    const { data: availableTags = [] } = useDataFetch('tags', {
        filters: { active: true },
        orderBy: [
            { column: 'category', ascending: true },
            { column: 'sort_order', ascending: true },
            { column: 'name', ascending: true }
        ]
    });

    // Extraer categorías únicas de los tags
    const tagCategories = React.useMemo(() =>
        [...new Set(availableTags.map(tag => tag.category))],
        [availableTags]
    );

    // Cargar datos iniciales
    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            setError('');

            // Obtener testimonios con sus relaciones
            const { data: testimonialsData, error: testimonialsError } = await supabase
                .from('testimonials')
                .select(`
                    *,
                    users!testimonials_agent_id_fkey(
                        id,
                        first_name,
                        last_name,
                        email,
                        profile_photo_url,
                        position
                    ),
                    contacts!testimonials_contact_id_fkey(
                        id,
                        name,
                        email,
                        phone,
                        document_number,
                        address,
                        source,
                        notes
                    ),
                    properties!testimonials_property_id_fkey(
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
                .order('created_at', { ascending: false });

            if (testimonialsError) throw testimonialsError;

            // Obtener las tags de cada testimonio
            const testimonialsWithTags = await Promise.all(
                (testimonialsData || []).map(async (testimonial) => {
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
                            .eq('content_id', testimonial.id)
                            .eq('content_type', 'testimonial');

                        if (tagsError) {
                            console.warn('Error al cargar tags para testimonio:', testimonial.id, tagsError);
                        }

                        return {
                            ...testimonial,
                            tags: tagsData ? tagsData.map(ct => ct.tags).filter(Boolean) : []
                        };
                    } catch (err) {
                        console.warn('Error al procesar tags para testimonio:', testimonial.id, err);
                        return {
                            ...testimonial,
                            tags: []
                        };
                    }
                })
            );

            setTestimonials(testimonialsWithTags);
        } catch (err) {
            console.error('Error al cargar testimonios:', err);
            showError('Error al cargar los testimonios: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar testimonios
    const filteredTestimonials = testimonials.filter(testimonial => {
        const matchesSearch = testimonial.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.transaction_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.tags?.some(tag => tag.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = !filterStatus || testimonial.status === filterStatus;
        const matchesCategory = !filterCategory || testimonial.category === filterCategory;
        const matchesRating = !filterRating || testimonial.rating >= parseInt(filterRating);

        // Filtrar por tags seleccionados
        const matchesTags = filterTags.length === 0 ||
            filterTags.every(selectedTagId =>
                testimonial.tags?.some(tag => tag.id === selectedTagId)
            );

        return matchesSearch && matchesStatus && matchesCategory && matchesRating && matchesTags;
    });

    // Paginación
    const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTestimonials = filteredTestimonials.slice(startIndex, endIndex);

    // Acciones
    const handleCreateTestimonial = () => {
        setSelectedTestimonial(null);
        setViewMode('editor');
    };

    const handleEditTestimonial = (testimonial) => {
        setSelectedTestimonial(testimonial);
        setViewMode('editor');
    };

    const handleDeleteTestimonial = async (testimonialId) => {
        try {
            const { error } = await supabase
                .from('testimonials')
                .delete()
                .eq('id', testimonialId);

            if (error) throw error;

            setTestimonials(testimonials.filter(t => t.id !== testimonialId));
            setShowDeleteModal(false);
            setDeleteTestimonialId(null);
            showSuccess('Testimonio eliminado exitosamente');
        } catch (err) {
            console.error('Error al eliminar testimonio:', err);
            showError('Error al eliminar el testimonio: ' + err.message);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTestimonial(null);
        fetchTestimonials(); // Recargar para ver cambios
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
    }, [searchTerm, filterStatus, filterCategory, filterRating, filterTags]);

    // Si está en modo editor, mostrar el editor
    if (viewMode === 'editor') {
        // Importar dinámicamente el editor
        const TestimonialEditor = React.lazy(() => import('./TestimonialEditor'));

        return (
            <React.Suspense fallback={
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando editor...</p>
                    </div>
                </div>
            }>
                <TestimonialEditor
                    testimonial={selectedTestimonial}
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
                        <p className="text-gray-600">Cargando testimonios...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* FASE 2: Toast notifications */}
            <Toast notification={notification} onClose={clearNotification} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Testimonios</h2>
                    <p className="text-sm text-gray-600">
                        {filteredTestimonials.length} {filteredTestimonials.length === 1 ? 'testimonio encontrado' : 'testimonios encontrados'}
                        {filteredTestimonials.length !== testimonials.length && ` de ${testimonials.length} totales`}
                    </p>
                </div>
                {permissions?.hasAction('create') && (
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleCreateTestimonial}
                    >
                        Nuevo Testimonio
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input.Search
                        placeholder="Buscar testimonios..."
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
                            { value: 'compradores', label: 'Compradores' },
                            { value: 'vendedores', label: 'Vendedores' },
                            { value: 'inversores', label: 'Inversores' },
                            { value: 'inquilinos', label: 'Inquilinos' }
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las calificaciones' },
                            { value: '5', label: '5 estrellas' },
                            { value: '4', label: '4+ estrellas' },
                            { value: '3', label: '3+ estrellas' }
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

            {/* Lista de testimonios */}
            <div className="flex-1 overflow-y-auto">
                {currentTestimonials.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Testimonio
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cliente
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Rating
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentTestimonials.map((testimonial) => (
                                            <tr
                                                key={testimonial.id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleEditTestimonial(testimonial)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-start space-x-3">
                                                        {testimonial.featured_image ? (
                                                            <img
                                                                src={testimonial.featured_image}
                                                                alt={testimonial.title}
                                                                className="w-12 h-8 rounded object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                                                <Quote className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                {testimonial.title}
                                                            </h3>
                                                            {testimonial.subtitle && (
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                                    {testimonial.subtitle}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-3 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    /{testimonial.slug}
                                                                </span>
                                                                {testimonial.featured && (
                                                                    <Badge variant="warning" size="sm">
                                                                        <Star className="w-3 h-3 mr-1" />
                                                                        Destacado
                                                                    </Badge>
                                                                )}
                                                                {testimonial.client_verified && (
                                                                    <Badge variant="success" size="sm">
                                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                                        Verificado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {/* Excerpt del testimonio */}
                                                            {testimonial.excerpt && (
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">
                                                                    "{testimonial.excerpt}"
                                                                </p>
                                                            )}
                                                            {/* Tags del testimonio */}
                                                            {testimonial.tags && testimonial.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {testimonial.tags.slice(0, 2).map((tag) => (
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
                                                                    {testimonial.tags.length > 2 && (
                                                                        <span className="text-xs text-gray-500">
                                                                            +{testimonial.tags.length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-3">
                                                        {testimonial.client_avatar ? (
                                                            <img
                                                                src={testimonial.client_avatar}
                                                                alt={testimonial.client_name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {testimonial.client_name}
                                                            </p>
                                                            {testimonial.client_profession && (
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {testimonial.client_profession}
                                                                </p>
                                                            )}
                                                            {testimonial.client_location && (
                                                                <p className="text-xs text-gray-500 flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1" />
                                                                    {testimonial.client_location}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getRatingStars(testimonial.rating)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getCategoryBadge(testimonial.category)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getStatusBadge(testimonial.status)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <div>
                                                        <p>{formatDate(testimonial.published_at || testimonial.created_at)}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {testimonial.published_at ? 'Publicado' : 'Creado'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                                        {testimonial.status === 'published' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<ExternalLink className="w-4 h-4" />}
                                                                title="Ver testimonio"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/testimonios/${testimonial.slug}`, '_blank');
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
                                                                    handleEditTestimonial(testimonial);
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
                                                                    setDeleteTestimonialId(testimonial.id);
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
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTestimonials.length)} de {filteredTestimonials.length} testimonios
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
                        <Quote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron testimonios</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterCategory || filterRating ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza creando tu primer testimonio.'
                            }
                        </p>
                        {permissions?.hasAction('create') && (
                            <Button
                                variant="primary"
                                onClick={handleCreateTestimonial}
                            >
                                Crear Primer Testimonio
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de confirmación de eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar Testimonio"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que quieres eliminar este testimonio? Esta acción no se puede deshacer.
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
                            onClick={() => handleDeleteTestimonial(deleteTestimonialId)}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default TestimonialManager;