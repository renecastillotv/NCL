import React, { useState, useEffect, useMemo } from 'react';
import {
    BookOpen, PlayCircle, MessageSquare, Star, Target, Plus, Edit, Trash2,
    ExternalLink, Eye, Search, Filter, Link, Globe, Upload, Save, X,
    Calendar, Clock, TrendingUp, Hash, MapPin, Users
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';



import { supabase } from '../services/api';

// Configuración de contenidos
const CONTENT_CONFIG = {
    articles: {
        name: 'Artículos',
        icon: BookOpen,
        color: 'blue',
        searchFields: ['title', 'excerpt', 'category'],
        displayFields: {
            title: 'title',
            description: 'excerpt',
            category: 'category',
            date: 'published_at',
            views: 'views',
            image: 'featured_image'
        },
        categories: ['guia-compra', 'mercado-inmobiliario', 'tendencias', 'consejos', 'inversiones'],
        relationTable: 'content_property_relations',
        contentType: 'article'
    },
    videos: {
        name: 'Videos',
        icon: PlayCircle,
        color: 'red',
        searchFields: ['title', 'description', 'category'],
        displayFields: {
            title: 'title',
            description: 'description',
            category: 'category',
            date: 'published_at',
            views: 'views',
            duration: 'duration',
            image: 'thumbnail'
        },
        categories: ['decoracion', 'casa-famosos', 'proyectos', 'recorridos', 'entrevistas', 'tips'],
        relationTable: 'content_property_relations',
        contentType: 'video'
    },
    faqs: {
        name: 'FAQs',
        icon: MessageSquare,
        color: 'green',
        searchFields: ['question', 'answer', 'category'],
        displayFields: {
            title: 'question',
            description: 'answer',
            category: 'category',
            views: 'views'
        },
        categories: ['general', 'financiamiento', 'legal', 'proceso-compra', 'mantenimiento'],
        relationTable: 'content_property_relations',
        contentType: 'faq'
    },
    testimonials: {
        name: 'Testimonios',
        icon: Star,
        color: 'purple',
        searchFields: ['client_name', 'title', 'excerpt'],
        displayFields: {
            title: 'client_name',
            description: 'excerpt',
            category: 'category',
            rating: 'rating'
        },
        categories: ['compra', 'venta', 'alquiler', 'inversion'],
        relationTable: 'content_property_relations',
        contentType: 'testimonial'
    },
    seo: {
        name: 'SEO Content',
        icon: Target,
        color: 'orange',
        searchFields: ['title', 'description', 'h1_title'],
        displayFields: {
            title: 'title',
            description: 'description',
            h1: 'h1_title',
            slug: 'slug',
            status: 'status'
        },
        categories: ['property', 'location', 'category'],
        relationTable: 'content_property_relations',
        contentType: 'seo_content'
    }
};

const PropertyContent = ({ propertyId, property }) => {
    const [activeSection, setActiveSection] = useState('articles');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    // Estados para contenido relacionado
    const [relatedContent, setRelatedContent] = useState({
        articles: [],
        videos: [],
        faqs: [],
        testimonials: [],
        seo: []
    });

    // Estados para contenido disponible
    const [availableContent, setAvailableContent] = useState({
        articles: [],
        videos: [],
        faqs: [],
        testimonials: [],
        seo: []
    });

    // Estados para modales
    const [showRelateModal, setShowRelateModal] = useState(false);
    const [bulkSelectMode, setBulkSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (propertyId) {
            fetchAllContent();
        }
    }, [propertyId]);

    const fetchAllContent = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchRelatedContent(),
                fetchAvailableContent()
            ]);
        } catch (error) {
            console.error('Error al cargar contenido:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedContent = async () => {
        try {
            // Artículos relacionados
            const { data: articleRelations } = await supabase
                .from('content_property_relations')
                .select(`
                    id, relation_type, weight, created_at, content_id
                `)
                .eq('property_id', propertyId)
                .eq('content_type', 'article');

            let processedArticles = [];
            if (articleRelations && articleRelations.length > 0) {
                const articleIds = articleRelations.map(rel => rel.content_id);
                const { data: articles } = await supabase
                    .from('articles')
                    .select('*')
                    .in('id', articleIds)
                    .eq('status', 'published');

                if (articles) {
                    processedArticles = articles.map(article => {
                        const relation = articleRelations.find(rel => rel.content_id === article.id);
                        return {
                            ...article,
                            relationId: relation.id,
                            weight: relation.weight,
                            relation_type: relation.relation_type
                        };
                    });
                }
            }

            // Videos relacionados
            const { data: videoRelations } = await supabase
                .from('content_property_relations')
                .select(`
                    id, relation_type, weight, created_at, content_id
                `)
                .eq('property_id', propertyId)
                .eq('content_type', 'video');

            let processedVideos = [];
            if (videoRelations && videoRelations.length > 0) {
                const videoIds = videoRelations.map(rel => rel.content_id);
                const { data: videos } = await supabase
                    .from('videos')
                    .select('*')
                    .in('id', videoIds)
                    .eq('status', 'published');

                if (videos) {
                    processedVideos = videos.map(video => {
                        const relation = videoRelations.find(rel => rel.content_id === video.id);
                        return {
                            ...video,
                            relationId: relation.id,
                            weight: relation.weight,
                            relation_type: relation.relation_type
                        };
                    });
                }
            }

            // FAQs relacionados
            const { data: faqRelations } = await supabase
                .from('content_property_relations')
                .select(`
                    id, relation_type, weight, created_at, content_id
                `)
                .eq('property_id', propertyId)
                .eq('content_type', 'faq');

            let processedFaqs = [];
            if (faqRelations && faqRelations.length > 0) {
                const faqIds = faqRelations.map(rel => rel.content_id);
                const { data: faqs } = await supabase
                    .from('faqs')
                    .select('*')
                    .in('id', faqIds)
                    .eq('status', 'published');

                if (faqs) {
                    processedFaqs = faqs.map(faq => {
                        const relation = faqRelations.find(rel => rel.content_id === faq.id);
                        return {
                            ...faq,
                            relationId: relation.id,
                            weight: relation.weight,
                            relation_type: relation.relation_type
                        };
                    });
                }
            }

            // Testimonios relacionados
            const { data: testimonialRelations } = await supabase
                .from('content_property_relations')
                .select(`
                    id, relation_type, weight, created_at, content_id
                `)
                .eq('property_id', propertyId)
                .eq('content_type', 'testimonial');

            let processedTestimonials = [];
            if (testimonialRelations && testimonialRelations.length > 0) {
                const testimonialIds = testimonialRelations.map(rel => rel.content_id);
                const { data: testimonials } = await supabase
                    .from('testimonials')
                    .select('*')
                    .in('id', testimonialIds)
                    .eq('status', 'published');

                if (testimonials) {
                    processedTestimonials = testimonials.map(testimonial => {
                        const relation = testimonialRelations.find(rel => rel.content_id === testimonial.id);
                        return {
                            ...testimonial,
                            relationId: relation.id,
                            weight: relation.weight,
                            relation_type: relation.relation_type
                        };
                    });
                }
            }

            // SEO Content relacionado
            const { data: seoRelations } = await supabase
                .from('content_property_relations')
                .select(`
                    id, relation_type, weight, created_at, content_id
                `)
                .eq('property_id', propertyId)
                .eq('content_type', 'seo_content');

            let processedSeoContent = [];
            if (seoRelations && seoRelations.length > 0) {
                const seoIds = seoRelations.map(rel => rel.content_id);
                const { data: seoContent } = await supabase
                    .from('seo_content')
                    .select('*')
                    .in('id', seoIds)
                    .eq('status', 'published');

                if (seoContent) {
                    processedSeoContent = seoContent.map(seo => {
                        const relation = seoRelations.find(rel => rel.content_id === seo.id);
                        return {
                            ...seo,
                            relationId: relation.id,
                            weight: relation.weight,
                            relation_type: relation.relation_type
                        };
                    });
                }
            }

            setRelatedContent({
                articles: processedArticles,
                videos: processedVideos,
                faqs: processedFaqs,
                testimonials: processedTestimonials,
                seo: processedSeoContent
            });

        } catch (error) {
            console.error('Error al cargar contenido relacionado:', error);
        }
    };

    const fetchAvailableContent = async () => {
        try {
            // Artículos disponibles
            const { data: articles } = await supabase
                .from('articles')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            // Videos disponibles
            const { data: videos } = await supabase
                .from('videos')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            // FAQs disponibles
            const { data: faqs } = await supabase
                .from('faqs')
                .select('*')
                .eq('status', 'published')
                .order('featured', { ascending: false });

            // Testimonios disponibles
            const { data: testimonials } = await supabase
                .from('testimonials')
                .select('*')
                .eq('status', 'published');

            // Contenido SEO disponible
            const { data: seoContent } = await supabase
                .from('seo_content')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            setAvailableContent({
                articles: articles || [],
                videos: videos || [],
                faqs: faqs || [],
                testimonials: testimonials || [],
                seo: seoContent || []
            });

        } catch (error) {
            console.error('Error al cargar contenido disponible:', error);
        }
    };

    // Función para relacionar contenido - SOLO content_property_relations
    const relateContent = async (contentIds, contentType, relationType = 'related') => {
        try {
            const config = CONTENT_CONFIG[contentType];

            // Verificar relaciones existentes primero
            const { data: existingRelations } = await supabase
                .from('content_property_relations')
                .select('content_id')
                .eq('property_id', propertyId)
                .eq('content_type', config.contentType)
                .in('content_id', contentIds);

            const existingContentIds = existingRelations?.map(rel => rel.content_id) || [];
            const newContentIds = contentIds.filter(id => !existingContentIds.includes(id));

            if (newContentIds.length === 0) {
                alert('El contenido seleccionado ya está relacionado con esta propiedad');
                return;
            }

            // Crear las relaciones
            const relations = newContentIds.map(contentId => ({
                content_id: contentId,
                content_type: config.contentType,
                property_id: propertyId,
                relation_type: relationType,
                weight: 1.0,
                auto_generated: false
            }));

            const { error } = await supabase
                .from('content_property_relations')
                .insert(relations);

            if (error) throw error;

            if (existingContentIds.length > 0) {
                alert(`Se relacionaron ${newContentIds.length} elementos. ${existingContentIds.length} ya estaban relacionados.`);
            }

            await fetchAllContent();
            setShowRelateModal(false);
            setSelectedItems([]);
            setBulkSelectMode(false);

        } catch (error) {
            console.error('Error al relacionar contenido:', error);
            alert('Error al relacionar el contenido: ' + error.message);
        }
    };

    // Función para desrelacionar contenido - SOLO content_property_relations
    const unrelateContent = async (item, contentType) => {
        try {
            // Eliminar la relación de content_property_relations
            const { error } = await supabase
                .from('content_property_relations')
                .delete()
                .eq('id', item.relationId);

            if (error) throw error;

            await fetchAllContent();

        } catch (error) {
            console.error('Error al desrelacionar contenido:', error);
            alert('Error al desrelacionar el contenido: ' + error.message);
        }
    };

    // Función de filtrado y búsqueda mejorada
    const filteredContent = useMemo(() => {
        const config = CONTENT_CONFIG[activeSection];
        let content = availableContent[activeSection] || [];

        // Filtrar por categoría
        if (selectedCategory !== 'all') {
            content = content.filter(item => item.category === selectedCategory);
        }

        // Filtrar por término de búsqueda
        if (searchTerm) {
            content = content.filter(item => {
                return config.searchFields.some(field =>
                    item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Ordenar
        switch (sortBy) {
            case 'recent':
                content.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'popular':
                content.sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
                break;
            case 'alphabetical':
                content.sort((a, b) => {
                    const titleA = config.displayFields.title ? a[config.displayFields.title] : '';
                    const titleB = config.displayFields.title ? b[config.displayFields.title] : '';
                    return titleA.localeCompare(titleB);
                });
                break;
        }

        return content;
    }, [availableContent, activeSection, selectedCategory, searchTerm, sortBy]);

    // Componente de tarjeta de contenido unificado
    const ContentCard = ({ item, isRelated = false, onAction, actionIcon, actionLabel }) => {
        const config = CONTENT_CONFIG[activeSection];
        const colorClasses = {
            blue: 'border-blue-200 bg-blue-50',
            red: 'border-red-200 bg-red-50',
            green: 'border-green-200 bg-green-50',
            purple: 'border-purple-200 bg-purple-50',
            orange: 'border-orange-200 bg-orange-50'
        };

        const IconComponent = config.icon;
        const bgClass = isRelated ? colorClasses[config.color] : 'border-gray-200 bg-white hover:bg-gray-50';

        return (
            <div className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${bgClass}`}>
                <div className="flex-shrink-0">
                    <IconComponent className={`w-5 h-5 mt-1 text-${config.color}-600`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                                {item[config.displayFields.title]}
                            </h4>

                            {config.displayFields.description && item[config.displayFields.description] && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                    {item[config.displayFields.description]}
                                </p>
                            )}

                            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                {config.displayFields.category && (
                                    <Badge className={`bg-${config.color}-100 text-${config.color}-800 text-xs px-1.5 py-0.5`}>
                                        {item[config.displayFields.category]}
                                    </Badge>
                                )}

                                {config.displayFields.date && item[config.displayFields.date] && (
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(item[config.displayFields.date]).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {config.displayFields.views && item[config.displayFields.views] && (
                                    <div className="flex items-center space-x-1">
                                        <Eye className="w-3 h-3" />
                                        <span>{item[config.displayFields.views]}</span>
                                    </div>
                                )}

                                {config.displayFields.duration && item[config.displayFields.duration] && (
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{item[config.displayFields.duration]}</span>
                                    </div>
                                )}

                                {config.displayFields.rating && item[config.displayFields.rating] && (
                                    <div className="flex items-center space-x-1">
                                        <div className="flex">
                                            {[...Array(item[config.displayFields.rating])].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isRelated && item.weight && (
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Peso: {item.weight}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row space-x-2 flex-shrink-0 ml-3">
                            {bulkSelectMode && !isRelated && (
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedItems([...selectedItems, item.id]);
                                        } else {
                                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                                        }
                                    }}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-2"
                                />
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 border-gray-300 hover:bg-gray-50"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-600" />
                            </Button>

                            {onAction && !bulkSelectMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAction(item)}
                                    title={actionLabel}
                                    className={`h-8 px-2 ${isRelated
                                            ? 'border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700'
                                            : 'border-orange-300 hover:bg-orange-50 text-orange-600 hover:text-orange-700'
                                        }`}
                                >
                                    {React.createElement(actionIcon, {
                                        className: "w-4 h-4"
                                    })}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const sections = Object.entries(CONTENT_CONFIG).map(([key, config]) => ({
        id: key,
        name: config.name,
        icon: config.icon,
        count: relatedContent[key]?.length || 0,
        color: config.color
    }));

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="ml-3 text-gray-600">Cargando contenido...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex space-x-1 overflow-x-auto">
                    {sections.map((section) => {
                        const IconComponent = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setSelectedCategory('all');
                                    setSearchTerm('');
                                    setBulkSelectMode(false);
                                    setSelectedItems([]);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeSection === section.id
                                        ? `bg-${section.color}-100 text-${section.color}-600`
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <IconComponent className="w-4 h-4" />
                                <span className="text-sm font-medium">{section.name}</span>
                                {section.count > 0 && (
                                    <Badge className={`bg-${section.color}-500 text-white text-xs px-2 py-0.5`}>
                                        {section.count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Controles de filtro y búsqueda */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input.Search
                            placeholder={`Buscar ${CONTENT_CONFIG[activeSection].name.toLowerCase()}...`}
                            value={searchTerm}
                            onSearch={setSearchTerm}
                            className="w-full"
                        />
                    </div>

                    <div className="flex space-x-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">Todas las categorías</option>
                            {CONTENT_CONFIG[activeSection].categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="recent">Más recientes</option>
                            <option value="popular">Más populares</option>
                            <option value="alphabetical">Alfabético</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contenido Relacionado */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {CONTENT_CONFIG[activeSection].name} Relacionados
                        </h3>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRelateModal(true)}
                            >
                                <Link className="w-4 h-4 mr-1" />
                                Relacionar
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {relatedContent[activeSection]?.map((item) => (
                            <ContentCard
                                key={item.id}
                                item={item}
                                isRelated={true}
                                onAction={(item) => unrelateContent(item, activeSection)}
                                actionIcon={X}
                                actionLabel="Desrelacionar"
                            />
                        ))}

                        {relatedContent[activeSection]?.length === 0 && (
                            <div className="text-center py-8">
                                {React.createElement(CONTENT_CONFIG[activeSection].icon, {
                                    className: "w-8 h-8 text-gray-400 mx-auto mb-2"
                                })}
                                <p className="text-gray-600">
                                    No hay {CONTENT_CONFIG[activeSection].name.toLowerCase()} relacionados
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Contenido Disponible */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Contenido Disponible
                        </h3>
                        <div className="flex space-x-2">
                            {filteredContent.length > 0 && (
                                <Button
                                    variant={bulkSelectMode ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setBulkSelectMode(!bulkSelectMode)}
                                >
                                    <Users className="w-4 h-4 mr-1" />
                                    {bulkSelectMode ? 'Cancelar' : 'Múltiple'}
                                </Button>
                            )}

                            {bulkSelectMode && selectedItems.length > 0 && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => relateContent(selectedItems, activeSection)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    <Link className="w-4 h-4 mr-1" />
                                    Relacionar ({selectedItems.length})
                                </Button>
                            )}

                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Crear
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredContent.map((item) => (
                            <ContentCard
                                key={item.id}
                                item={item}
                                isRelated={false}
                                onAction={bulkSelectMode ? null : (item) => relateContent([item.id], activeSection)}
                                actionIcon={Link}
                                actionLabel="Relacionar"
                            />
                        ))}

                        {filteredContent.length === 0 && (
                            <div className="text-center py-8">
                                <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">
                                    {searchTerm || selectedCategory !== 'all'
                                        ? 'No se encontraron resultados con los filtros aplicados'
                                        : 'No hay contenido disponible'}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Modal para relacionar contenido */}
            {showRelateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Relacionar {CONTENT_CONFIG[activeSection].name}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRelateModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {availableContent[activeSection]?.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">
                                            {item[CONTENT_CONFIG[activeSection].displayFields.title]}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {item.category}
                                        </p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => relateContent([item.id], activeSection)}
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        Relacionar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyContent;