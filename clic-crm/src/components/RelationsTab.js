import React, { useState, useEffect } from 'react';
import {
    Plus, X, Search, Video, User, FileText, Users, 
    ExternalLink, Star, Calendar, Eye
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal } from './ui';


import { supabase } from '../services/api';

// Modal para seleccionar videos
const VideoSelectionModal = ({ isOpen, onClose, videos, selectedVideos, onToggleVideo, loading, currentVideoId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const filteredVideos = videos.filter(video => {
        const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.video_slug?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || video.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Videos Relacionados" size="lg">
            <div className="space-y-4">
                {currentVideoId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Nota:</strong> El video actual está excluido de esta lista para evitar auto-referencias.
                        </p>
                    </div>
                )}
                
                {/* Filtros */}
                <div className="flex space-x-3">
                    <Input
                        placeholder="Buscar videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                        className="flex-1"
                    />
                    <Input.Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            { value: 'decoracion', label: 'Decoración' },
                            { value: 'casa-famosos', label: 'Casa de Famosos' },
                            { value: 'proyectos', label: 'Proyectos' },
                            { value: 'recorridos', label: 'Recorridos' },
                            { value: 'entrevistas', label: 'Entrevistas' },
                            { value: 'tips', label: 'Tips' }
                        ]}
                        className="w-48"
                    />
                </div>

                {/* Lista de videos */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando videos...</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredVideos.map(video => {
                            const isSelected = selectedVideos.some(v => v.id === video.id);
                            return (
                                <div
                                    key={video.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => onToggleVideo(video)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleVideo(video)}
                                        className="w-4 h-4 text-orange-600"
                                    />
                                    <div className="flex-shrink-0">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-16 h-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                <Video className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {video.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">/{video.video_slug}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="secondary" size="sm">
                                                {video.category?.replace('-', ' ') || 'Sin categoría'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredVideos.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No se encontraron videos</p>
                                <p className="text-sm">
                                    {currentVideoId ? 'Todos los demás videos están siendo mostrados' : 'Intenta con otro término de búsqueda'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                        {selectedVideos.length} videos seleccionados | {filteredVideos.length} disponibles
                    </span>
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// Modal para seleccionar asesores
const AdvisorSelectionModal = ({ isOpen, onClose, advisors, selectedAdvisors, onToggleAdvisor, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');

    const filteredAdvisors = advisors.filter(advisor => {
        const matchesSearch = `${advisor.first_name} ${advisor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            advisor.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !filterRole || advisor.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Asesores del Área" size="lg">
            <div className="space-y-4">
                {/* Filtros */}
                <div className="flex space-x-3">
                    <Input
                        placeholder="Buscar asesores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                        className="flex-1"
                    />
                    <Input.Select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los roles' },
                            { value: 'advisor', label: 'Asesor' },
                            { value: 'manager', label: 'Manager' },
                            { value: 'admin', label: 'Administrador' }
                        ]}
                        className="w-48"
                    />
                </div>

                {/* Lista de asesores */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando asesores...</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredAdvisors.map(advisor => {
                            const isSelected = selectedAdvisors.some(a => a.id === advisor.id);
                            return (
                                <div
                                    key={advisor.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => onToggleAdvisor(advisor)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleAdvisor(advisor)}
                                        className="w-4 h-4 text-orange-600"
                                    />
                                    <div className="flex-shrink-0">
                                        {advisor.profile_photo_url ? (
                                            <img
                                                src={advisor.profile_photo_url}
                                                alt={`${advisor.first_name} ${advisor.last_name}`}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {advisor.first_name} {advisor.last_name}
                                        </h4>
                                        <p className="text-xs text-gray-500">{advisor.email}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="outline" size="sm">
                                                {advisor.role}
                                            </Badge>
                                            {advisor.position && (
                                                <Badge variant="secondary" size="sm">
                                                    {advisor.position}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAdvisors.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No se encontraron asesores</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// Modal para seleccionar artículos
const ArticleSelectionModal = ({ isOpen, onClose, articles, selectedArticles, onToggleArticle, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               article.slug?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || article.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Artículos Relacionados" size="lg">
            <div className="space-y-4">
                {/* Filtros */}
                <div className="flex space-x-3">
                    <Input
                        placeholder="Buscar artículos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                        className="flex-1"
                    />
                    <Input.Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            { value: 'guias', label: 'Guías' },
                            { value: 'noticias', label: 'Noticias' },
                            { value: 'consejos', label: 'Consejos' },
                            { value: 'mercado', label: 'Mercado' },
                            { value: 'tendencias', label: 'Tendencias' }
                        ]}
                        className="w-48"
                    />
                </div>

                {/* Lista de artículos */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando artículos...</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredArticles.map(article => {
                            const isSelected = selectedArticles.some(a => a.id === article.id);
                            return (
                                <div
                                    key={article.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => onToggleArticle(article)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleArticle(article)}
                                        className="w-4 h-4 text-orange-600"
                                    />
                                    <div className="flex-shrink-0">
                                        {article.featured_image ? (
                                            <img
                                                src={article.featured_image}
                                                alt={article.title}
                                                className="w-16 h-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {article.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">/{article.slug}</p>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="secondary" size="sm">
                                                {article.category?.replace('-', ' ') || 'Sin categoría'}
                                            </Badge>
                                            {article.read_time && (
                                                <Badge variant="outline" size="sm">
                                                    {article.read_time} min lectura
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredArticles.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No se encontraron artículos</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// Componente principal RelationsTab
const RelationsTab = ({ formData, handleInputChange }) => {
    // Estados para las relaciones (usando campos JSONB de la tabla videos)
    const [selectedVideos, setSelectedVideos] = useState(formData.related_videos || []);
    const [selectedAdvisors, setSelectedAdvisors] = useState(formData.area_advisors || []);
    const [selectedArticles, setSelectedArticles] = useState(formData.related_articles || []);
    
    // Estados para todos los datos disponibles
    const [allVideos, setAllVideos] = useState([]);
    const [allAdvisors, setAllAdvisors] = useState([]);
    const [allArticles, setAllArticles] = useState([]);
    
    // Estados de carga
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);
    const [loadingArticles, setLoadingArticles] = useState(false);
    
    // Estados de modales
    const [showVideosModal, setShowVideosModal] = useState(false);
    const [showAdvisorsModal, setShowAdvisorsModal] = useState(false);
    const [showArticlesModal, setShowArticlesModal] = useState(false);

    // Cargar datos cuando se monta el componente
    useEffect(() => {
        fetchAllVideos();
        fetchAllAdvisors();
        fetchAllArticles();
    }, []);

    // Actualizar form data cuando cambian las relaciones (usando campos JSONB directos)
    useEffect(() => {
        console.log('Actualizando related_videos:', selectedVideos);
        handleInputChange('related_videos', selectedVideos.length > 0 ? selectedVideos : []);
    }, [selectedVideos, handleInputChange]);

    useEffect(() => {
        console.log('Actualizando area_advisors:', selectedAdvisors);
        handleInputChange('area_advisors', selectedAdvisors.length > 0 ? selectedAdvisors : []);
    }, [selectedAdvisors, handleInputChange]);

    useEffect(() => {
        console.log('Actualizando related_articles:', selectedArticles);
        handleInputChange('related_articles', selectedArticles.length > 0 ? selectedArticles : []);
    }, [selectedArticles, handleInputChange]);

    const fetchAllVideos = async () => {
        try {
            setLoadingVideos(true);
            const { data, error } = await supabase
                .from('videos')
                .select('id, title, video_slug, thumbnail, status, category, created_at, views, duration')
                .eq('status', 'published')
                .neq('id', formData.id || '00000000-0000-0000-0000-000000000000')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;
            
            console.log('Videos disponibles para relacionar:', data?.length || 0);
            console.log('Video actual excluido:', formData.id);
            setAllVideos(data || []);
        } catch (error) {
            console.error('Error al cargar videos:', error);
            setAllVideos([]);
        } finally {
            setLoadingVideos(false);
        }
    };

    const fetchAllAdvisors = async () => {
        try {
            setLoadingAdvisors(true);
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    first_name, 
                    last_name, 
                    email, 
                    profile_photo_url, 
                    role, 
                    active,
                    position,
                    specialty_description,
                    years_experience,
                    sales_count
                `)
                .eq('active', true)
                .or('position.eq.Asesor Inmobiliario,position.eq.Agente Inmobiliario')
                .order('first_name')
                .limit(200);

            if (error) throw error;
            
            console.log('Asesores cargados:', data);
            setAllAdvisors(data || []);
        } catch (error) {
            console.error('Error al cargar asesores:', error);
            setAllAdvisors([]);
        } finally {
            setLoadingAdvisors(false);
        }
    };

    const fetchAllArticles = async () => {
        try {
            setLoadingArticles(true);
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, featured_image, status, category, created_at, excerpt, read_time, views')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) {
                // Si no existe la tabla articles, manejar graciosamente
                console.warn('Tabla articles no encontrada:', error);
                setAllArticles([]);
            } else {
                setAllArticles(data || []);
            }
        } catch (error) {
            console.error('Error al cargar artículos:', error);
            setAllArticles([]);
        } finally {
            setLoadingArticles(false);
        }
    };

    // Manejadores para videos relacionados
    const handleVideoToggle = (video) => {
        const isSelected = selectedVideos.some(v => v.id === video.id);
        if (isSelected) {
            setSelectedVideos(selectedVideos.filter(v => v.id !== video.id));
        } else {
            const newVideo = {
                id: video.id,
                title: video.title,
                video_slug: video.video_slug,
                thumbnail: video.thumbnail,
                category: video.category,
                weight: 1.0,
                relation_type: 'related',
                order: selectedVideos.length + 1
            };
            setSelectedVideos([...selectedVideos, newVideo]);
        }
    };

    // Manejadores para asesores del área
    const handleAdvisorToggle = (advisor) => {
        const isSelected = selectedAdvisors.some(a => a.id === advisor.id);
        if (isSelected) {
            setSelectedAdvisors(selectedAdvisors.filter(a => a.id !== advisor.id));
        } else {
            const newAdvisor = {
                id: advisor.id,
                first_name: advisor.first_name,
                last_name: advisor.last_name,
                email: advisor.email,
                profile_photo_url: advisor.profile_photo_url,
                role: advisor.role,
                position: advisor.position,
                specialty_description: advisor.specialty_description,
                years_experience: advisor.years_experience,
                weight: 1.0,
                relation_type: 'area_expert',
                order: selectedAdvisors.length + 1
            };
            setSelectedAdvisors([...selectedAdvisors, newAdvisor]);
        }
    };

    // Manejadores para artículos relacionados
    const handleArticleToggle = (article) => {
        const isSelected = selectedArticles.some(a => a.id === article.id);
        if (isSelected) {
            setSelectedArticles(selectedArticles.filter(a => a.id !== article.id));
        } else {
            const newArticle = {
                id: article.id,
                title: article.title,
                slug: article.slug,
                featured_image: article.featured_image,
                excerpt: article.excerpt,
                category: article.category,
                read_time: article.read_time,
                weight: 1.0,
                relation_type: 'related',
                order: selectedArticles.length + 1
            };
            setSelectedArticles([...selectedArticles, newArticle]);
        }
    };

    // Funciones para actualizar relaciones existentes
    const updateVideoRelation = (videoId, field, value) => {
        setSelectedVideos(selectedVideos.map(v => 
            v.id === videoId ? { ...v, [field]: value } : v
        ));
    };

    const updateAdvisorRelation = (advisorId, field, value) => {
        setSelectedAdvisors(selectedAdvisors.map(a => 
            a.id === advisorId ? { ...a, [field]: value } : a
        ));
    };

    const updateArticleRelation = (articleId, field, value) => {
        setSelectedArticles(selectedArticles.map(a => 
            a.id === articleId ? { ...a, [field]: value } : a
        ));
    };

    // Funciones para eliminar relaciones
    const removeVideo = (videoId) => {
        setSelectedVideos(selectedVideos.filter(v => v.id !== videoId));
    };

    const removeAdvisor = (advisorId) => {
        setSelectedAdvisors(selectedAdvisors.filter(a => a.id !== advisorId));
    };

    const removeArticle = (articleId) => {
        setSelectedArticles(selectedArticles.filter(a => a.id !== articleId));
    };

    return (
        <div className="space-y-6">
            {/* Videos Relacionados */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Videos Relacionados</h3>
                            <p className="text-sm text-gray-600">
                                Conecta este video con otros videos relevantes ({selectedVideos.length} seleccionados)
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowVideosModal(true)}
                            icon={<Plus className="w-4 h-4" />}
                            disabled={loadingVideos}
                        >
                            Agregar Videos
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedVideos.length > 0 ? (
                        <div className="space-y-4">
                            {selectedVideos.map((video) => (
                                <div key={video.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-20 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                <Video className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {video.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">/{video.video_slug}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="secondary" size="sm">
                                                {video.category?.replace('-', ' ') || 'Sin categoría'}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            <div>
                                                <label className="text-xs text-gray-600">Tipo:</label>
                                                <Input.Select
                                                    value={video.relation_type}
                                                    onChange={(e) => updateVideoRelation(video.id, 'relation_type', e.target.value)}
                                                    options={[
                                                        { value: 'related', label: 'Relacionado' },
                                                        { value: 'sequel', label: 'Secuela' },
                                                        { value: 'series', label: 'Serie' },
                                                        { value: 'similar', label: 'Similar' },
                                                        { value: 'follow_up', label: 'Seguimiento' }
                                                    ]}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Peso:</label>
                                                <Input
                                                    type="number"
                                                    min="0.1"
                                                    max="5.0"
                                                    step="0.1"
                                                    value={video.weight}
                                                    onChange={(e) => updateVideoRelation(video.id, 'weight', parseFloat(e.target.value) || 1.0)}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Orden:</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={video.order || 1}
                                                    onChange={(e) => updateVideoRelation(video.id, 'order', parseInt(e.target.value) || 1)}
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeVideo(video.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Eliminar video relacionado"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Video className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No hay videos relacionados</p>
                            <p className="text-sm">Agrega videos relacionados para mejorar la navegación</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Asesores del Área */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Asesores del Área</h3>
                            <p className="text-sm text-gray-600">
                                Asocia asesores expertos en el tema del video ({selectedAdvisors.length} seleccionados)
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowAdvisorsModal(true)}
                            icon={<Plus className="w-4 h-4" />}
                            disabled={loadingAdvisors}
                        >
                            Agregar Asesores
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedAdvisors.length > 0 ? (
                        <div className="space-y-4">
                            {selectedAdvisors.map((advisor) => (
                                <div key={advisor.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {advisor.profile_photo_url ? (
                                            <img
                                                src={advisor.profile_photo_url}
                                                alt={`${advisor.first_name} ${advisor.last_name}`}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {advisor.first_name} {advisor.last_name}
                                        </h4>
                                        <p className="text-xs text-gray-500">{advisor.email}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="outline" size="sm">
                                                {advisor.role}
                                            </Badge>
                                            {advisor.position && (
                                                <Badge variant="secondary" size="sm">
                                                    {advisor.position}
                                                </Badge>
                                            )}
                                            {advisor.years_experience && (
                                                <Badge variant="info" size="sm">
                                                    {advisor.years_experience} años exp.
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            <div>
                                                <label className="text-xs text-gray-600">Tipo:</label>
                                                <Input.Select
                                                    value={advisor.relation_type}
                                                    onChange={(e) => updateAdvisorRelation(advisor.id, 'relation_type', e.target.value)}
                                                    options={[
                                                        { value: 'area_expert', label: 'Experto del Área' },
                                                        { value: 'interviewer', label: 'Entrevistador' },
                                                        { value: 'guest', label: 'Invitado' },
                                                        { value: 'consultant', label: 'Consultor' },
                                                        { value: 'collaborator', label: 'Colaborador' }
                                                    ]}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Peso:</label>
                                                <Input
                                                    type="number"
                                                    min="0.1"
                                                    max="5.0"
                                                    step="0.1"
                                                    value={advisor.weight}
                                                    onChange={(e) => updateAdvisorRelation(advisor.id, 'weight', parseFloat(e.target.value) || 1.0)}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Orden:</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={advisor.order || 1}
                                                    onChange={(e) => updateAdvisorRelation(advisor.id, 'order', parseInt(e.target.value) || 1)}
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeAdvisor(advisor.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Eliminar asesor"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No hay asesores asociados</p>
                            <p className="text-sm">Asocia asesores expertos para mejorar la credibilidad</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Artículos Relacionados */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Artículos Relacionados</h3>
                            <p className="text-sm text-gray-600">
                                Conecta el video con artículos de contenido relacionado ({selectedArticles.length} seleccionados)
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setShowArticlesModal(true)}
                            icon={<Plus className="w-4 h-4" />}
                            disabled={loadingArticles}
                        >
                            Agregar Artículos
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedArticles.length > 0 ? (
                        <div className="space-y-4">
                            {selectedArticles.map((article) => (
                                <div key={article.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        {article.featured_image ? (
                                            <img
                                                src={article.featured_image}
                                                alt={article.title}
                                                className="w-20 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {article.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">/{article.slug}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="secondary" size="sm">
                                                {article.category?.replace('-', ' ') || 'Sin categoría'}
                                            </Badge>
                                            {article.read_time && (
                                                <Badge variant="outline" size="sm">
                                                    {article.read_time} min lectura
                                                </Badge>
                                            )}
                                        </div>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            <div>
                                                <label className="text-xs text-gray-600">Tipo:</label>
                                                <Input.Select
                                                    value={article.relation_type}
                                                    onChange={(e) => updateArticleRelation(article.id, 'relation_type', e.target.value)}
                                                    options={[
                                                        { value: 'related', label: 'Relacionado' },
                                                        { value: 'background', label: 'Contexto' },
                                                        { value: 'follow_up', label: 'Seguimiento' },
                                                        { value: 'reference', label: 'Referencia' },
                                                        { value: 'guide', label: 'Guía' }
                                                    ]}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Peso:</label>
                                                <Input
                                                    type="number"
                                                    min="0.1"
                                                    max="5.0"
                                                    step="0.1"
                                                    value={article.weight}
                                                    onChange={(e) => updateArticleRelation(article.id, 'weight', parseFloat(e.target.value) || 1.0)}
                                                    className="text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Orden:</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={article.order || 1}
                                                    onChange={(e) => updateArticleRelation(article.id, 'order', parseInt(e.target.value) || 1)}
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeArticle(article.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Eliminar artículo relacionado"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No hay artículos relacionados</p>
                            <p className="text-sm">
                                {allArticles.length === 0 
                                    ? 'No se encontró tabla de artículos en la base de datos'
                                    : 'Agrega artículos relacionados para enriquecer el contenido'
                                }
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modales */}
            <VideoSelectionModal
                isOpen={showVideosModal}
                onClose={() => setShowVideosModal(false)}
                videos={allVideos}
                selectedVideos={selectedVideos}
                onToggleVideo={handleVideoToggle}
                loading={loadingVideos}
                currentVideoId={formData.id}
            />

            <AdvisorSelectionModal
                isOpen={showAdvisorsModal}
                onClose={() => setShowAdvisorsModal(false)}
                advisors={allAdvisors}
                selectedAdvisors={selectedAdvisors}
                onToggleAdvisor={handleAdvisorToggle}
                loading={loadingAdvisors}
            />

            <ArticleSelectionModal
                isOpen={showArticlesModal}
                onClose={() => setShowArticlesModal(false)}
                articles={allArticles}
                selectedArticles={selectedArticles}
                onToggleArticle={handleArticleToggle}
                loading={loadingArticles}
            />
        </div>
    );
};

export default RelationsTab;