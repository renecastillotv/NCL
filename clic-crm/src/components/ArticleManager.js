import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Star, Quote,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Youtube, Video, Camera, DollarSign, Users,
    Bed, Bath, Car, Maximize, Building, MessageSquare, Award,
    UserCheck, Phone, Mail, Heart, ThumbsUp, Upload, FileText,
    BookOpen, PenTool, Eye as EyeIcon
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';

// FASE 1: Supabase centralizado
import { supabase } from '../services/api';

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
        'guias-compra': { variant: 'info', text: 'Guías de Compra', icon: Home },
        'mercado-inmobiliario': { variant: 'warning', text: 'Mercado Inmobiliario', icon: TrendingUp },
        'inversion': { variant: 'success', text: 'Inversión', icon: DollarSign },
        'legal': { variant: 'default', text: 'Legal', icon: FileText },
        'tips-consejos': { variant: 'primary', text: 'Tips y Consejos', icon: Award },
        'noticias': { variant: 'secondary', text: 'Noticias', icon: MessageSquare }
    };

    const config = categoryConfig[category] || { variant: 'default', text: category, icon: BookOpen };
    return (
        <Badge variant={config.variant} className="flex items-center space-x-1">
            <config.icon className="w-3 h-3" />
            <span>{config.text}</span>
        </Badge>
    );
};

// Función helper para formatear número de vistas
const formatViews = (views) => {
    if (!views || views === '0') return '0 vistas';
    const num = parseInt(views);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M vistas';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K vistas';
    return num + ' vistas';
};

const ArticleManager = ({ user, permissions }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Estados para tags
    const [availableTags, setAvailableTags] = useState([]);
    const [tagCategories, setTagCategories] = useState([]);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados del manager
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteArticleId, setDeleteArticleId] = useState(null);
    const [authors, setAuthors] = useState([]);

    // Cargar datos iniciales
    useEffect(() => {
        Promise.all([
            fetchArticles(),
            fetchTags(),
            fetchAuthors()
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

    const fetchAuthors = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, profile_photo_url, position')
                .eq('active', true)
                .order('first_name');

            if (error) throw error;
            setAuthors(data || []);
        } catch (err) {
            console.error('Error al cargar autores:', err);
        }
    };

    const fetchArticles = async () => {
        try {
            setLoading(true);
            setError('');

            // Obtener artículos con sus relaciones
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select(`
                    *,
                    users!articles_author_id_fkey(
                        id,
                        first_name,
                        last_name,
                        email,
                        profile_photo_url,
                        position
                    )
                `)
                .order('created_at', { ascending: false });

            if (articlesError) throw articlesError;

            // Obtener las tags de cada artículo
            const articlesWithTags = await Promise.all(
                (articlesData || []).map(async (article) => {
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
                            .eq('content_id', article.id)
                            .eq('content_type', 'article');

                        if (tagsError) {
                            console.warn('Error al cargar tags para artículo:', article.id, tagsError);
                        }

                        return {
                            ...article,
                            tags: tagsData ? tagsData.map(ct => ct.tags).filter(Boolean) : []
                        };
                    } catch (err) {
                        console.warn('Error al procesar tags para artículo:', article.id, err);
                        return {
                            ...article,
                            tags: []
                        };
                    }
                })
            );

            setArticles(articlesWithTags);
        } catch (err) {
            console.error('Error al cargar artículos:', err);
            setError('Error al cargar los artículos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar artículos
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.tags?.some(tag => tag.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (article.users && `${article.users.first_name} ${article.users.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = !filterStatus || article.status === filterStatus;
        const matchesCategory = !filterCategory || article.category === filterCategory;
        const matchesAuthor = !filterAuthor || article.author_id === filterAuthor;

        // Filtrar por tags seleccionados
        const matchesTags = filterTags.length === 0 ||
            filterTags.every(selectedTagId =>
                article.tags?.some(tag => tag.id === selectedTagId)
            );

        return matchesSearch && matchesStatus && matchesCategory && matchesAuthor && matchesTags;
    });

    // Paginación
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArticles = filteredArticles.slice(startIndex, endIndex);

    // Acciones
    const handleCreateArticle = () => {
        setSelectedArticle(null);
        setViewMode('editor');
    };

    const handleEditArticle = (article) => {
        setSelectedArticle(article);
        setViewMode('editor');
    };

    const handleDeleteArticle = async (articleId) => {
        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', articleId);

            if (error) throw error;

            setArticles(articles.filter(a => a.id !== articleId));
            setShowDeleteModal(false);
            setDeleteArticleId(null);
        } catch (err) {
            console.error('Error al eliminar artículo:', err);
            setError('Error al eliminar el artículo: ' + err.message);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedArticle(null);
        fetchArticles(); // Recargar para ver cambios
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
    }, [searchTerm, filterStatus, filterCategory, filterAuthor, filterTags]);

    // Si está en modo editor, mostrar el editor
    if (viewMode === 'editor') {
        // Importar dinámicamente el editor
        const ArticleEditor = React.lazy(() => import('./ArticleEditor'));

        return (
            <React.Suspense fallback={
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando editor...</p>
                    </div>
                </div>
            }>
                <ArticleEditor
                    article={selectedArticle}
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
                        <p className="text-gray-600">Cargando artículos...</p>
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
                    <h2 className="text-xl font-semibold text-gray-900">Artículos del Blog</h2>
                    <p className="text-sm text-gray-600">
                        {filteredArticles.length} {filteredArticles.length === 1 ? 'artículo encontrado' : 'artículos encontrados'}
                        {filteredArticles.length !== articles.length && ` de ${articles.length} totales`}
                    </p>
                </div>
                {permissions?.hasAction('create') && (
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleCreateArticle}
                    >
                        Nuevo Artículo
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input.Search
                        placeholder="Buscar artículos..."
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
                            { value: 'guias-compra', label: 'Guías de Compra' },
                            { value: 'mercado-inmobiliario', label: 'Mercado Inmobiliario' },
                            { value: 'inversion', label: 'Inversión' },
                            { value: 'legal', label: 'Legal' },
                            { value: 'tips-consejos', label: 'Tips y Consejos' },
                            { value: 'noticias', label: 'Noticias' }
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterAuthor}
                        onChange={(e) => setFilterAuthor(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los autores' },
                            ...authors.map(author => ({
                                value: author.id,
                                label: `${author.first_name} ${author.last_name}`
                            }))
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

            {/* Lista de artículos */}
            <div className="flex-1 overflow-y-auto">
                {currentArticles.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Artículo
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Autor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estadísticas
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
                                        {currentArticles.map((article) => (
                                            <tr
                                                key={article.id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleEditArticle(article)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-start space-x-3">
                                                        {article.featured_image ? (
                                                            <img
                                                                src={article.featured_image}
                                                                alt={article.title}
                                                                className="w-16 h-12 rounded object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                                                <BookOpen className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                                {article.title}
                                                            </h3>
                                                            {article.subtitle && (
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                                    {article.subtitle}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-3 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    /{article.slug}
                                                                </span>
                                                                {article.featured && (
                                                                    <Badge variant="warning" size="sm">
                                                                        <Star className="w-3 h-3 mr-1" />
                                                                        Destacado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {/* Excerpt del artículo */}
                                                            {article.excerpt && (
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                    {article.excerpt}
                                                                </p>
                                                            )}
                                                            {/* Tags del artículo */}
                                                            {article.tags && article.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {article.tags.slice(0, 3).map((tag) => (
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
                                                                    {article.tags.length > 3 && (
                                                                        <span className="text-xs text-gray-500">
                                                                            +{article.tags.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {article.users ? (
                                                        <div className="flex items-center space-x-3">
                                                            {article.users.profile_photo_url ? (
                                                                <img
                                                                    src={article.users.profile_photo_url}
                                                                    alt={`${article.users.first_name} ${article.users.last_name}`}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                    <PenTool className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {article.users.first_name} {article.users.last_name}
                                                                </p>
                                                                {article.users.position && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {article.users.position}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                            <span className="text-sm text-gray-500">Sin autor</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getCategoryBadge(article.category)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getStatusBadge(article.status)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-1">
                                                            <EyeIcon className="w-3 h-3" />
                                                            <span>{formatViews(article.views)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{article.read_time || 5} min</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <div>
                                                        <p>{formatDate(article.published_at || article.created_at)}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {article.published_at ? 'Publicado' : 'Creado'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                                        {article.status === 'published' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<ExternalLink className="w-4 h-4" />}
                                                                title="Ver artículo"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`/blog/${article.slug}`, '_blank');
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
                                                                    handleEditArticle(article);
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
                                                                    setDeleteArticleId(article.id);
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
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredArticles.length)} de {filteredArticles.length} artículos
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
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron artículos</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterCategory || filterAuthor ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza creando tu primer artículo del blog.'
                            }
                        </p>
                        {permissions?.hasAction('create') && (
                            <Button
                                variant="primary"
                                onClick={handleCreateArticle}
                            >
                                Crear Primer Artículo
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de confirmación de eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar Artículo"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.
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
                            onClick={() => handleDeleteArticle(deleteArticleId)}
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

export default ArticleManager;// JavaScript source code
