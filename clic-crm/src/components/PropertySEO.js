import React, { useState, useEffect } from 'react';
import {
    Target, Save, Upload, Eye, Globe, Search, TrendingUp,
    CheckCircle, AlertCircle, ExternalLink, Copy, BarChart3,
    Lightbulb, RefreshCw, MapPin, Home, DollarSign
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';



import { supabase } from '../services/api';

const PropertySEO = ({ propertyId, property }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [seoData, setSeoData] = useState({
        slug_url: '',
        meta_title: '',
        meta_description: '',
        keywords: '',
        og_title: '',
        og_description: '',
        og_image: '',
        schema_type: 'House',
        offer_type: 'Sale',
        canonical_url: ''
    });

    const [seoContent, setSeoContent] = useState(null);
    const [analysis, setAnalysis] = useState({
        title_length: 0,
        description_length: 0,
        keywords_count: 0,
        score: 0,
        suggestions: []
    });

    useEffect(() => {
        if (propertyId && property) {
            loadSEOData();
        }
    }, [propertyId, property]);

    useEffect(() => {
        analyzeSEO();
    }, [seoData]);

    const loadSEOData = async () => {
        try {
            setLoading(true);

            // Cargar tags relacionados con la propiedad a través de content_tags
            const { data: contentTags } = await supabase
                .from('content_tags')
                .select(`
                    tag_id,
                    weight,
                    tags (
                        id, name, slug, category, display_name
                    )
                `)
                .eq('content_id', propertyId)
                .eq('content_type', 'property');

            // Procesar tags por categoría
            const tagsByCategory = {};
            if (contentTags) {
                contentTags.forEach(ct => {
                    const tag = ct.tags;
                    if (tag && tag.category) {
                        if (!tagsByCategory[tag.category]) {
                            tagsByCategory[tag.category] = [];
                        }
                        tagsByCategory[tag.category].push({
                            ...tag,
                            weight: ct.weight
                        });
                    }
                });

                // Ordenar por weight en cada categoría (mayor peso primero)
                Object.keys(tagsByCategory).forEach(category => {
                    tagsByCategory[category].sort((a, b) => (b.weight || 1.0) - (a.weight || 1.0));
                });
            }

            // Generar datos SEO sugeridos basados en la propiedad y tags
            const suggestedSEO = generateSuggestedSEO(property, tagsByCategory);

            // Verificar si existe contenido SEO específico en seo_content
            const { data: seoContentData } = await supabase
                .from('seo_content')
                .select('*')
                .eq('content_type', 'property')
                .eq('identifier', propertyId.toString())
                .single();

            if (seoContentData) {
                // Usar datos existentes de seo_content
                setSeoContent(seoContentData);
                setSeoData({
                    slug_url: seoContentData.slug || property.slug_url || suggestedSEO.slug_url,
                    meta_title: seoContentData.meta_title || suggestedSEO.meta_title,
                    meta_description: seoContentData.meta_description || suggestedSEO.meta_description,
                    keywords: seoContentData.seo_sections?.keywords?.join(', ') || suggestedSEO.keywords,
                    og_title: seoContentData.title || suggestedSEO.og_title,
                    og_description: seoContentData.description || suggestedSEO.og_description,
                    og_image: property.main_image_url || '',
                    schema_type: seoContentData.seo_sections?.schema_type || suggestedSEO.schema_type,
                    offer_type: seoContentData.seo_sections?.offer_type || suggestedSEO.offer_type,
                    canonical_url: seoContentData.canonical_url || suggestedSEO.canonical_url
                });
            } else {
                // Usar datos de la tabla properties si existen, sino usar sugeridos
                setSeoData({
                    slug_url: property.slug_url || suggestedSEO.slug_url,
                    meta_title: suggestedSEO.meta_title,
                    meta_description: suggestedSEO.meta_description,
                    keywords: suggestedSEO.keywords,
                    og_title: suggestedSEO.og_title,
                    og_description: suggestedSEO.og_description,
                    og_image: property.main_image_url || '',
                    schema_type: suggestedSEO.schema_type,
                    offer_type: suggestedSEO.offer_type,
                    canonical_url: suggestedSEO.canonical_url
                });
            }

        } catch (error) {
            console.error('Error al cargar datos SEO:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSuggestedSEO = (property, tagsByCategory = {}) => {
        // Obtener información de la propiedad
        const propertyName = property.name || '';
        const propertyCode = property.code || '';

        const bedrooms = property.bedrooms || 0;
        const bathrooms = property.bathrooms || 0;
        const area = property.built_area || property.land_area || 0;

        const salePrice = property.sale_price || 0;
        const rentalPrice = property.rental_price || 0;
        const saleCurrency = property.sale_currency || 'USD';
        const rentalCurrency = property.rental_currency || 'USD';

        // Obtener slugs de tags por categoría, priorizando "comprar" para operación
        const getTagSlug = (category, priorityValue = null) => {
            const tags = tagsByCategory[category] || [];
            if (priorityValue) {
                // Buscar primero el tag con prioridad (ej: "comprar")
                const priorityTag = tags.find(tag =>
                    tag.slug === priorityValue ||
                    tag.name.toLowerCase().includes(priorityValue.toLowerCase())
                );
                if (priorityTag) return priorityTag.slug;
            }
            // Si no encuentra el prioritario, tomar el primero disponible
            return tags.length > 0 ? tags[0].slug : '';
        };

        // Determinar operación y slug de operación
        let operationType = '';
        let priceText = '';
        let operationSlug = '';

        if (salePrice && rentalPrice) {
            operationType = 'venta y alquiler';
            priceText = `desde ${formatPrice(salePrice, saleCurrency)}`;
            operationSlug = getTagSlug('operacion', 'comprar') || 'comprar'; // Priorizar "comprar"
        } else if (salePrice) {
            operationType = 'venta';
            priceText = formatPrice(salePrice, saleCurrency);
            operationSlug = getTagSlug('operacion', 'comprar') || 'comprar';
        } else if (rentalPrice) {
            operationType = 'alquiler';
            priceText = `${formatPrice(rentalPrice, rentalCurrency)}/mes`;
            operationSlug = getTagSlug('operacion', 'alquilar') || 'alquilar';
        } else {
            // Si no hay precios, usar el primer tag de operación disponible
            operationSlug = getTagSlug('operacion') || 'comprar';
        }

        // Obtener slugs de otros tags
        const categorySlug = getTagSlug('categoria') || 'propiedades';
        const citySlug = getTagSlug('ciudad') || 'republica-dominicana';
        const sectorSlug = getTagSlug('sector') || 'centro';

        // Generar slug del nombre de la propiedad
        const nameSlug = propertyName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-') || `propiedad-${propertyCode}`;

        // Construir el slug final: operacion/categoria/ciudad/sector/name
        const slug = `${operationSlug}/${categorySlug}/${citySlug}/${sectorSlug}/${nameSlug}`;

        // Obtener nombres para títulos y descripciones desde tags o fallbacks
        const getCategoryName = () => {
            const categoryTags = tagsByCategory['categoria'] || [];
            return categoryTags.length > 0 ? categoryTags[0].display_name || categoryTags[0].name : 'Propiedad';
        };

        const getCityName = () => {
            const cityTags = tagsByCategory['ciudad'] || [];
            return cityTags.length > 0 ? cityTags[0].display_name || cityTags[0].name : '';
        };

        const getSectorName = () => {
            const sectorTags = tagsByCategory['sector'] || [];
            return sectorTags.length > 0 ? sectorTags[0].display_name || sectorTags[0].name : '';
        };

        const category = getCategoryName();
        const city = getCityName();
        const sector = getSectorName();

        // Generar título SEO optimizado
        const titleParts = [];
        if (propertyName) titleParts.push(propertyName);
        if (category && city) titleParts.push(`${category} en ${city}`);
        if (priceText) titleParts.push(priceText);
        const title = titleParts.join(' - ').substring(0, 60);

        // Generar descripción SEO optimizada
        const descriptionParts = [];
        if (propertyName) descriptionParts.push(propertyName);
        if (category) descriptionParts.push(category.toLowerCase());
        if (operationType) descriptionParts.push(`en ${operationType}`);
        if (city && sector) descriptionParts.push(`en ${sector}, ${city}`);
        if (bedrooms) descriptionParts.push(`${bedrooms} habitaciones`);
        if (bathrooms) descriptionParts.push(`${bathrooms} baños`);
        if (area) descriptionParts.push(`${area}m²`);
        if (priceText) descriptionParts.push(priceText);
        descriptionParts.push('¡Contáctanos ahora!');

        const description = descriptionParts.join(', ').substring(0, 160);

        // Generar keywords basados en tags y datos
        const keywords = [
            category.toLowerCase(),
            `${category.toLowerCase()} ${city.toLowerCase()}`,
            `${category.toLowerCase()} ${sector.toLowerCase()}`,
            `${category.toLowerCase()} ${operationType}`,
            `propiedades ${city.toLowerCase()}`,
            `inmuebles ${city.toLowerCase()}`,
            'republica dominicana'
        ].filter(Boolean).join(', ');

        // Determinar schema type basado en tags de categoría
        let schemaType = 'House';
        if (category.toLowerCase().includes('apartament')) schemaType = 'Apartment';
        if (category.toLowerCase().includes('casa')) schemaType = 'House';
        if (category.toLowerCase().includes('villa')) schemaType = 'House';
        if (category.toLowerCase().includes('townhouse')) schemaType = 'House';

        // Determinar offer type
        let offerType = 'Sale';
        if (salePrice && rentalPrice) offerType = 'Both';
        else if (rentalPrice && !salePrice) offerType = 'Rent';

        return {
            slug_url: slug,
            meta_title: title,
            meta_description: description,
            keywords: keywords,
            og_title: `${propertyName} - ${priceText}`,
            og_description: description,
            schema_type: schemaType,
            offer_type: offerType,
            canonical_url: `https://clicinmobiliaria.com/${slug}`
        };
    };

    const formatPrice = (price, currency) => {
        const formatter = new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: currency === 'USD' ? 'USD' : 'DOP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(price);
    };

    const analyzeSEO = () => {
        const title_length = seoData.meta_title.length;
        const description_length = seoData.meta_description.length;
        const keywords_count = seoData.keywords.split(',').filter(k => k.trim()).length;

        let score = 0;
        const suggestions = [];

        // Análisis del título
        if (title_length >= 30 && title_length <= 60) {
            score += 25;
        } else if (title_length > 0) {
            score += 10;
            if (title_length < 30) suggestions.push('El título es muy corto. Recomendado: 30-60 caracteres.');
            if (title_length > 60) suggestions.push('El título es muy largo. Puede ser cortado en los resultados.');
        } else {
            suggestions.push('Falta el meta título.');
        }

        // Análisis de la descripción
        if (description_length >= 120 && description_length <= 160) {
            score += 25;
        } else if (description_length > 0) {
            score += 10;
            if (description_length < 120) suggestions.push('La descripción es muy corta. Recomendado: 120-160 caracteres.');
            if (description_length > 160) suggestions.push('La descripción es muy larga. Puede ser cortada en los resultados.');
        } else {
            suggestions.push('Falta la meta descripción.');
        }

        // Análisis de keywords
        if (keywords_count >= 3 && keywords_count <= 10) {
            score += 20;
        } else if (keywords_count > 0) {
            score += 10;
            if (keywords_count < 3) suggestions.push('Agrega más palabras clave relevantes.');
            if (keywords_count > 10) suggestions.push('Demasiadas palabras clave. Enfócate en las más importantes.');
        } else {
            suggestions.push('Agrega palabras clave relevantes.');
        }

        // Otros factores
        if (seoData.slug_url) {
            score += 15;
        } else {
            suggestions.push('Falta la URL slug.');
        }

        if (seoData.og_image) {
            score += 15;
        } else {
            suggestions.push('Agrega una imagen para redes sociales.');
        }

        setAnalysis({
            title_length,
            description_length,
            keywords_count,
            score,
            suggestions
        });
    };

    const saveSEOData = async () => {
        try {
            setSaving(true);

            const seoPayload = {
                content_type: 'property',
                identifier: propertyId.toString(),
                title: seoData.og_title,
                description: seoData.og_description,
                meta_title: seoData.meta_title,
                meta_description: seoData.meta_description,
                slug: seoData.slug_url,
                canonical_url: seoData.canonical_url,
                seo_sections: {
                    keywords: seoData.keywords.split(',').map(k => k.trim()).filter(k => k),
                    schema_type: seoData.schema_type,
                    offer_type: seoData.offer_type
                },
                schema_org_data: {
                    "@context": "https://schema.org",
                    "@type": "RealEstateAgent",
                    "name": property?.name,
                    "description": seoData.meta_description,
                    "url": seoData.canonical_url,
                    "image": seoData.og_image,
                    "offers": {
                        "@type": "Offer",
                        "priceCurrency": property?.sale_currency || "USD",
                        "price": property?.sale_price,
                        "availability": "https://schema.org/InStock"
                    }
                },
                status: 'published'
            };

            if (seoContent) {
                // Actualizar contenido existente
                const { error } = await supabase
                    .from('seo_content')
                    .update(seoPayload)
                    .eq('id', seoContent.id);

                if (error) throw error;
            } else {
                // Crear nuevo contenido SEO
                const { error } = await supabase
                    .from('seo_content')
                    .insert(seoPayload);

                if (error) throw error;
            }

            // Actualizar slug en la tabla properties si ha cambiado
            if (seoData.slug_url !== property?.slug_url) {
                const { error: propertyError } = await supabase
                    .from('properties')
                    .update({ slug_url: seoData.slug_url })
                    .eq('id', propertyId);

                if (propertyError) throw propertyError;
            }

            alert('Configuración SEO guardada exitosamente');

        } catch (error) {
            console.error('Error al guardar SEO:', error);
            alert('Error al guardar la configuración SEO: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = async () => {
        try {
            // Cargar tags actualizados antes de generar
            const { data: contentTags } = await supabase
                .from('content_tags')
                .select(`
                    tag_id,
                    weight,
                    tags (
                        id, name, slug, category, display_name
                    )
                `)
                .eq('content_id', propertyId)
                .eq('content_type', 'property');

            const tagsByCategory = {};
            if (contentTags) {
                contentTags.forEach(ct => {
                    const tag = ct.tags;
                    if (tag && tag.category) {
                        if (!tagsByCategory[tag.category]) {
                            tagsByCategory[tag.category] = [];
                        }
                        tagsByCategory[tag.category].push({
                            ...tag,
                            weight: ct.weight
                        });
                    }
                });

                // Ordenar por weight en cada categoría
                Object.keys(tagsByCategory).forEach(category => {
                    tagsByCategory[category].sort((a, b) => (b.weight || 1.0) - (a.weight || 1.0));
                });
            }

            const suggested = generateSuggestedSEO(property, tagsByCategory);
            setSeoData(prev => ({
                ...prev,
                slug_url: suggested.slug_url
            }));
        } catch (error) {
            console.error('Error al generar slug:', error);
            // Fallback sin tags
            const suggested = generateSuggestedSEO(property, {});
            setSeoData(prev => ({
                ...prev,
                slug_url: suggested.slug_url
            }));
        }
    };

    const generateSuggestedContent = async () => {
        try {
            // Cargar tags actualizados antes de generar
            const { data: contentTags } = await supabase
                .from('content_tags')
                .select(`
                    tag_id,
                    weight,
                    tags (
                        id, name, slug, category, display_name
                    )
                `)
                .eq('content_id', propertyId)
                .eq('content_type', 'property');

            const tagsByCategory = {};
            if (contentTags) {
                contentTags.forEach(ct => {
                    const tag = ct.tags;
                    if (tag && tag.category) {
                        if (!tagsByCategory[tag.category]) {
                            tagsByCategory[tag.category] = [];
                        }
                        tagsByCategory[tag.category].push({
                            ...tag,
                            weight: ct.weight
                        });
                    }
                });

                // Ordenar por weight en cada categoría
                Object.keys(tagsByCategory).forEach(category => {
                    tagsByCategory[category].sort((a, b) => (b.weight || 1.0) - (a.weight || 1.0));
                });
            }

            const suggested = generateSuggestedSEO(property, tagsByCategory);
            setSeoData(prev => ({
                ...prev,
                ...suggested
            }));
        } catch (error) {
            console.error('Error al generar contenido sugerido:', error);
            // Fallback sin tags
            const suggested = generateSuggestedSEO(property, {});
            setSeoData(prev => ({
                ...prev,
                ...suggested
            }));
        }
    };

    const copyUrl = () => {
        const fullUrl = `https://clicinmobiliaria.com/${seoData.slug_url}`;
        navigator.clipboard.writeText(fullUrl);
        alert('URL copiada al portapapeles');
    };

    const tabs = [
        { id: 'basic', name: 'SEO Básico', icon: Target },
        { id: 'social', name: 'Redes Sociales', icon: Globe },
        { id: 'advanced', name: 'Avanzado', icon: TrendingUp }
    ];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="ml-3 text-gray-600">Cargando configuración SEO...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header con información de la propiedad */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Target className="w-8 h-8 text-orange-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Optimización SEO</h1>
                            <p className="text-gray-600">{property?.name} - Código: {property?.code}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={generateSuggestedContent}
                            className="flex items-center space-x-2"
                        >
                            <Lightbulb className="w-4 h-4" />
                            <span>Generar Sugerencias</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={saveSEOData}
                            disabled={saving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Formulario principal */}
                <div className="xl:col-span-3">
                    {/* Tabs */}
                    <div className="bg-white rounded-lg border border-gray-200 mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6">
                                {tabs.map((tab) => {
                                    const IconComponent = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                                    ? 'border-orange-500 text-orange-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                            <span>{tab.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">
                            {/* Tab Content */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6">
                                    {/* URL Slug */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL Slug *
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-500 whitespace-nowrap">clicinmobiliaria.com/</span>
                                            <div className="flex-1 flex space-x-2">
                                                <Input
                                                    value={seoData.slug_url}
                                                    onChange={(e) => setSeoData(prev => ({ ...prev, slug_url: e.target.value }))}
                                                    placeholder="comprar/casas/santo-domingo/zona-colonial/villa-moderna"
                                                    className="flex-1"
                                                />
                                                <Button variant="outline" size="sm" onClick={generateSlug}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={copyUrl}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meta Title *
                                        </label>
                                        <Input
                                            value={seoData.meta_title}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, meta_title: e.target.value }))}
                                            placeholder="Villas Independientes en Punta Cana - Desde $74K"
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-500">Título que aparece en Google</span>
                                            <span className={`${analysis.title_length >= 30 && analysis.title_length <= 60 ? 'text-green-600' :
                                                    analysis.title_length > 60 ? 'text-red-600' : 'text-orange-600'
                                                }`}>
                                                {analysis.title_length}/60 caracteres
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meta Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Meta Description *
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={seoData.meta_description}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, meta_description: e.target.value }))}
                                            placeholder="Descubre villas independientes en Punta Cana con patio privado y más..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-500">Descripción en resultados de búsqueda</span>
                                            <span className={`${analysis.description_length >= 120 && analysis.description_length <= 160 ? 'text-green-600' :
                                                    analysis.description_length > 160 ? 'text-red-600' : 'text-orange-600'
                                                }`}>
                                                {analysis.description_length}/160 caracteres
                                            </span>
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Palabras Clave
                                        </label>
                                        <Input
                                            value={seoData.keywords}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, keywords: e.target.value }))}
                                            placeholder="villas punta cana, casas independientes, townhouse"
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-500">Separadas por comas</span>
                                            <span className="text-gray-600">{analysis.keywords_count} keywords</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Título para Redes Sociales
                                        </label>
                                        <Input
                                            value={seoData.og_title}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, og_title: e.target.value }))}
                                            placeholder="¡Villas en Punta Cana desde $74K!"
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descripción para Redes Sociales
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={seoData.og_description}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, og_description: e.target.value }))}
                                            placeholder="Descripción específica para redes sociales..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Imagen Principal
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                value={seoData.og_image}
                                                onChange={(e) => setSeoData(prev => ({ ...prev, og_image: e.target.value }))}
                                                placeholder="URL de la imagen principal"
                                                className="flex-1"
                                            />
                                            <Button variant="outline" size="sm">
                                                <Upload className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Propiedad
                                            </label>
                                            <select
                                                value={seoData.schema_type}
                                                onChange={(e) => setSeoData(prev => ({ ...prev, schema_type: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="House">Casa</option>
                                                <option value="Apartment">Apartamento</option>
                                                <option value="SingleFamilyResidence">Residencia Unifamiliar</option>
                                                <option value="Residence">Residencia</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Oferta
                                            </label>
                                            <select
                                                value={seoData.offer_type}
                                                onChange={(e) => setSeoData(prev => ({ ...prev, offer_type: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="Sale">Venta</option>
                                                <option value="Rent">Alquiler</option>
                                                <option value="Both">Ambos</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL Canónica
                                        </label>
                                        <Input
                                            value={seoData.canonical_url}
                                            onChange={(e) => setSeoData(prev => ({ ...prev, canonical_url: e.target.value }))}
                                            placeholder="https://tu-dominio.com/propiedades/villa-principal"
                                            className="w-full"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Para evitar contenido duplicado
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Análisis SEO */}
                    <Card className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-orange-600" />
                            <span>Análisis SEO</span>
                        </h4>

                        <div className="space-y-4">
                            <div className="text-center">
                                <div className={`text-3xl font-bold mb-2 ${analysis.score >= 80 ? 'text-green-600' :
                                        analysis.score >= 60 ? 'text-orange-600' : 'text-red-600'
                                    }`}>
                                    {analysis.score}%
                                </div>
                                <p className="text-sm text-gray-600">Puntuación SEO</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Meta Title:</span>
                                    <div className="flex items-center space-x-1">
                                        {analysis.title_length >= 30 && analysis.title_length <= 60 ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-orange-600" />
                                        )}
                                        <span className="text-sm font-medium">{analysis.title_length}/60</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Meta Description:</span>
                                    <div className="flex items-center space-x-1">
                                        {analysis.description_length >= 120 && analysis.description_length <= 160 ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-orange-600" />
                                        )}
                                        <span className="text-sm font-medium">{analysis.description_length}/160</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Keywords:</span>
                                    <div className="flex items-center space-x-1">
                                        {analysis.keywords_count >= 3 ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-orange-600" />
                                        )}
                                        <span className="text-sm font-medium">{analysis.keywords_count}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sugerencias */}
                            {analysis.suggestions.length > 0 && (
                                <div className="border-t pt-4">
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Sugerencias:</h5>
                                    <ul className="space-y-1">
                                        {analysis.suggestions.map((suggestion, index) => (
                                            <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                                                <span className="text-orange-500">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Vista previa en Google */}
                    <Card className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <Search className="w-5 h-5 text-orange-600" />
                            <span>Vista Previa Google</span>
                        </h4>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-blue-600 text-sm hover:underline cursor-pointer line-clamp-1 font-medium">
                                {seoData.meta_title || property?.name || 'Título no definido'}
                            </div>
                            <div className="text-green-700 text-xs mt-1">
                                clicinmobiliaria.com › {seoData.slug_url || 'slug'}
                            </div>
                            <div className="text-gray-600 text-xs mt-2 line-clamp-2">
                                {seoData.meta_description || 'Descripción no definida...'}
                            </div>
                        </div>
                    </Card>

                    {/* Vista previa social */}
                    <Card className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-orange-600" />
                            <span>Vista Previa Social</span>
                        </h4>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {seoData.og_image && (
                                <img
                                    src={seoData.og_image}
                                    alt="Preview"
                                    className="w-full h-32 object-cover"
                                />
                            )}
                            <div className="p-3">
                                <div className="font-semibold text-gray-900 text-sm line-clamp-1">
                                    {seoData.og_title || seoData.meta_title || property?.name}
                                </div>
                                <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                                    {seoData.og_description || seoData.meta_description}
                                </div>
                                <div className="text-gray-500 text-xs mt-2">
                                    clicinmobiliaria.com
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PropertySEO;