import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    FileText, Globe, Clock, TrendingUp, MoreHorizontal, Copy,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';
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

const ContentArticles = ({ user, permissions }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados del editor
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteArticleId, setDeleteArticleId] = useState(null);

    // Cargar artículos
    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            setError('');

            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    users!articles_author_id_fkey(
                        id,
                        first_name,
                        last_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setArticles(data || []);
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
            article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.slug?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !filterStatus || article.status === filterStatus;
        const matchesCategory = !filterCategory || article.category === filterCategory;
        const matchesAuthor = !filterAuthor || article.users?.first_name?.toLowerCase().includes(filterAuthor.toLowerCase());

        return matchesSearch && matchesStatus && matchesCategory && matchesAuthor;
    });

    // Paginación
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArticles = filteredArticles.slice(startIndex, endIndex);

    // Obtener listas únicas para filtros
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
    const authors = [...new Set(articles.map(a => a.users ? `${a.users.first_name} ${a.users.last_name}` : '').filter(Boolean))];
    const statuses = ['draft', 'published', 'archived'];

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
    }, [searchTerm, filterStatus, filterCategory, filterAuthor]);

    // Si está en modo editor, mostrar el editor
    if (viewMode === 'editor') {
        return (
            <ArticleEditor
                article={selectedArticle}
                onBack={handleBackToList}
                user={user}
                permissions={permissions}
            />
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
                    <h2 className="text-xl font-semibold text-gray-900">Artículos</h2>
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
                            ...categories.map(cat => ({ value: cat, label: cat }))
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterAuthor}
                        onChange={(e) => setFilterAuthor(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los autores' },
                            ...authors.map(author => ({ value: author, label: author }))
                        ]}
                        className="min-w-40"
                    />
                </div>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Artículo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Autor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stats
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentArticles.map((article) => (
                                            <tr key={article.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start space-x-3">
                                                        {article.featured_image ? (
                                                            <img
                                                                src={article.featured_image}
                                                                alt={article.title}
                                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                {article.title}
                                                            </h3>
                                                            {article.excerpt && (
                                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                    {article.excerpt}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-4 mt-2">
                                                                <span className="text-xs text-gray-500">
                                                                    /{article.slug}
                                                                </span>
                                                                {article.featured && (
                                                                    <Badge variant="warning" size="sm">Destacado</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {article.users ? `${article.users.first_name} ${article.users.last_name}` : 'Sin autor'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant="secondary">{article.category}</Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(article.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div>
                                                        <p>{formatDate(article.published_at || article.created_at)}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {article.published_at ? 'Publicado' : 'Creado'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center">
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            <span>{article.views || 0}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            <span>{article.read_time || 5}min</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {article.status === 'published' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<ExternalLink className="w-4 h-4" />}
                                                                title="Ver publicado"
                                                                onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                                                            />
                                                        )}
                                                        {permissions?.hasAction('update') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Edit className="w-4 h-4" />}
                                                                onClick={() => handleEditArticle(article)}
                                                            />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            icon={<Copy className="w-4 h-4" />}
                                                            onClick={() => navigator.clipboard.writeText(`/blog/${article.slug}`)}
                                                        />
                                                        {permissions?.hasAction('delete') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Trash2 className="w-4 h-4" />}
                                                                className="text-red-600 hover:text-red-800"
                                                                onClick={() => {
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
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron artículos</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterCategory || filterAuthor ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza creando tu primer artículo.'
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

// Componente Editor de Artículos (separado para mantener el código limpio)
const ArticleEditor = ({ article, onBack, user, permissions }) => {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        tags: [],
        featured: false,
        status: 'draft',
        read_time: 5,
        ...article
    });

    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title || '',
                subtitle: article.subtitle || '',
                slug: article.slug || '',
                excerpt: article.excerpt || '',
                content: article.content || '',
                category: article.category || '',
                featured_image: article.featured_image || '',
                meta_title: article.meta_title || '',
                meta_description: article.meta_description || '',
                tags: article.tags || [],
                featured: article.featured || false,
                status: article.status || 'draft',
                read_time: article.read_time || 5
            });
        }
    }, [article]);

    // Auto-generar slug del título
    useEffect(() => {
        if (formData.title && !article) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, article]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSave = async (status = formData.status) => {
        try {
            setSaving(true);

            const dataToSave = {
                ...formData,
                status,
                author_id: user?.id,
                published_at: status === 'published' && !article?.published_at ? new Date().toISOString() : article?.published_at,
                updated_at: new Date().toISOString()
            };

            let result;
            if (article) {
                // Actualizar artículo existente
                result = await supabase
                    .from('articles')
                    .update(dataToSave)
                    .eq('id', article.id);
            } else {
                // Crear nuevo artículo
                result = await supabase
                    .from('articles')
                    .insert([dataToSave]);
            }

            if (result.error) throw result.error;

            onBack();
        } catch (err) {
            console.error('Error al guardar artículo:', err);
            alert('Error al guardar el artículo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header del editor */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={onBack}
                            icon={<X className="w-4 h-4" />}
                        >
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {article ? 'Editar Artículo' : 'Nuevo Artículo'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Estado: {getStatusBadge(formData.status)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSave('draft')}
                            disabled={saving}
                        >
                            Guardar Borrador
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleSave('published')}
                            disabled={saving}
                            icon={saving ? null : <CheckCircle className="w-4 h-4" />}
                        >
                            {saving ? 'Guardando...' : 'Publicar'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Contenido del editor */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Información básica */}
                    <Card>
                        <Card.Header>
                            <h3 className="text-lg font-semibold">Información Básica</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Título *
                                    </label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Título del artículo"
                                        className="text-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subtítulo
                                    </label>
                                    <Input
                                        value={formData.subtitle}
                                        onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                        placeholder="Subtítulo opcional"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Slug *
                                        </label>
                                        <Input
                                            value={formData.slug}
                                            onChange={(e) => handleInputChange('slug', e.target.value)}
                                            placeholder="url-del-articulo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Categoría *
                                        </label>
                                        <Input.Select
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            options={[
                                                { value: '', label: 'Seleccionar categoría' },
                                                { value: 'guias', label: 'Guías' },
                                                { value: 'mercado', label: 'Mercado Inmobiliario' },
                                                { value: 'consejos', label: 'Consejos' },
                                                { value: 'tendencias', label: 'Tendencias' },
                                                { value: 'noticias', label: 'Noticias' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Resumen/Excerpt
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        value={formData.excerpt}
                                        onChange={(e) => handleInputChange('excerpt', e.target.value)}
                                        placeholder="Breve descripción del artículo..."
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Contenido */}
                    <Card>
                        <Card.Header>
                            <h3 className="text-lg font-semibold">Contenido</h3>
                        </Card.Header>
                        <Card.Body>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={20}
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                placeholder="Escribe el contenido del artículo aquí... (Markdown soportado)"
                            />
                        </Card.Body>
                    </Card>

                    {/* Configuración adicional */}
                    <Card>
                        <Card.Header>
                            <h3 className="text-lg font-semibold">Configuración Adicional</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Imagen destacada (URL)
                                    </label>
                                    <Input
                                        value={formData.featured_image}
                                        onChange={(e) => handleInputChange('featured_image', e.target.value)}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tiempo de lectura (minutos)
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.read_time}
                                            onChange={(e) => handleInputChange('read_time', parseInt(e.target.value))}
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estado
                                        </label>
                                        <Input.Select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            options={[
                                                { value: 'draft', label: 'Borrador' },
                                                { value: 'published', label: 'Publicado' },
                                                { value: 'archived', label: 'Archivado' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags
                                    </label>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Agregar tag"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addTag}
                                        >
                                            Agregar
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="cursor-pointer"
                                                onClick={() => removeTag(tag)}
                                            >
                                                {tag} ×
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Checkboxes */}
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={formData.featured}
                                            onChange={(e) => handleInputChange('featured', e.target.checked)}
                                        />
                                        Artículo destacado
                                    </label>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <Card.Header>
                            <h3 className="text-lg font-semibold">SEO</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Título
                                    </label>
                                    <Input
                                        value={formData.meta_title}
                                        onChange={(e) => handleInputChange('meta_title', e.target.value)}
                                        placeholder="Título para SEO (opcional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Descripción
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        value={formData.meta_description}
                                        onChange={(e) => handleInputChange('meta_description', e.target.value)}
                                        placeholder="Descripción para motores de búsqueda..."
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Placeholder para módulos de contenido adicionales
const ContentMedia = ({ user, permissions }) => (
    <div className="h-full flex items-center justify-center">
        <div className="text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Biblioteca de Media</h3>
            <p className="text-gray-600">Gestión de imágenes y archivos - Próximamente</p>
        </div>
    </div>
);

const ContentSEO = ({ user, permissions }) => (
    <div className="h-full flex items-center justify-center">
        <div className="text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO y Optimización</h3>
            <p className="text-gray-600">Herramientas de optimización - Próximamente</p>
        </div>
    </div>
);

export default ContentArticles;
export { ContentMedia, ContentSEO };