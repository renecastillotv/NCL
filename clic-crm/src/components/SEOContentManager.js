import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Globe, Clock, TrendingUp, MoreHorizontal, Code, FileText,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Settings, Target, BarChart3, Star, Copy,
    Layers, Hash, Type, AlignLeft, Zap, Bot, Monitor
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';

import SEOContentSection from './SEOContentSection';


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

// Función helper para obtener badge de tipo de contenido
const getContentTypeBadge = (contentType) => {
    const typeConfig = {
        'category': { variant: 'info', text: 'Categoría', icon: Layers },
        'location': { variant: 'warning', text: 'Ubicación', icon: MapPin },
        'property_type': { variant: 'primary', text: 'Tipo Propiedad', icon: Home },
        'landing': { variant: 'success', text: 'Landing Page', icon: Globe },
        'blog': { variant: 'secondary', text: 'Blog', icon: FileText },
        'service': { variant: 'info', text: 'Servicio', icon: Settings }
    };

    const config = typeConfig[contentType] || { variant: 'default', text: contentType, icon: FileText };
    return (
        <Badge variant={config.variant} className="flex items-center space-x-1">
            <config.icon className="w-3 h-3" />
            <span>{config.text}</span>
        </Badge>
    );
};

// Función helper para formatear score de performance
const formatPerformanceScore = (score) => {
    if (!score || score === 0) return 'N/A';
    const numScore = parseFloat(score);
    if (numScore >= 0.8) return { score: numScore.toFixed(2), color: 'text-green-600', bg: 'bg-green-100' };
    if (numScore >= 0.6) return { score: numScore.toFixed(2), color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { score: numScore.toFixed(2), color: 'text-red-600', bg: 'bg-red-100' };
};

// Función helper para formatear precios
const formatPrice = (price, currency = 'USD') => {
    if (!price || price === 0) return null;

    const symbols = {
        'USD': '$',
        'DOP': 'RD$',
        'EUR': '€'
    };

    const symbol = symbols[currency] || currency;
    const formattedPrice = new Intl.NumberFormat('en-US').format(price);

    return `${symbol}${formattedPrice}`;
};

// Función helper para obtener el precio principal de una propiedad
const getMainPrice = (property) => {
    if (property.sale_price && property.sale_price > 0) {
        return formatPrice(property.sale_price, property.sale_currency);
    }
    if (property.rental_price && property.rental_price > 0) {
        return formatPrice(property.rental_price, property.rental_currency) + '/mes';
    }
    if (property.temp_rental_price && property.temp_rental_price > 0) {
        return formatPrice(property.temp_rental_price, property.temp_rental_currency) + '/día';
    }
    return null;
};

// Componente para la pestaña de Información Básica
const BasicInfoTab = ({ formData, handleInputChange, handleSectionChange, addSection, removeSection, cities, loadingCities }) => {
    return (
        <div className="space-y-6">
            {/* Información básica */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Información General</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Contenido *
                                </label>
                                <Input.Select
                                    value={formData.content_type}
                                    onChange={(e) => handleInputChange('content_type', e.target.value)}
                                    options={[
                                        { value: 'category', label: 'Categoría' },
                                        { value: 'location', label: 'Ubicación' },
                                        { value: 'property_type', label: 'Tipo de Propiedad' },
                                        { value: 'landing', label: 'Landing Page' },
                                        { value: 'blog', label: 'Blog' },
                                        { value: 'service', label: 'Servicio' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Identificador *
                                </label>
                                <Input
                                    value={formData.identifier}
                                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                                    placeholder="identificador-unico"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Título *
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Título del contenido SEO"
                                className="text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Descripción breve del contenido..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título H1
                                </label>
                                <Input
                                    value={formData.h1_title}
                                    onChange={(e) => handleInputChange('h1_title', e.target.value)}
                                    placeholder="Título principal H1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subtítulo H2
                                </label>
                                <Input
                                    value={formData.h2_subtitle}
                                    onChange={(e) => handleInputChange('h2_subtitle', e.target.value)}
                                    placeholder="Subtítulo H2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Idioma
                                </label>
                                <Input.Select
                                    value={formData.language}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                    options={[
                                        { value: 'es', label: 'Español' },
                                        { value: 'en', label: 'Inglés' },
                                        { value: 'fr', label: 'Francés' }
                                    ]}
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.auto_generated}
                                        onChange={(e) => handleInputChange('auto_generated', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Auto-generado
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Contexto inmobiliario */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Contexto Inmobiliario</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contexto de Ubicación
                                </label>
                                {loadingCities ? (
                                    <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        <span className="text-sm text-gray-500">Cargando...</span>
                                    </div>
                                ) : (
                                    <Input.Select
                                        value={formData.location_context}
                                        onChange={(e) => handleInputChange('location_context', e.target.value)}
                                        options={[
                                            { value: '', label: 'Seleccionar ubicación' },
                                            ...cities.map(city => ({
                                                value: city.value,
                                                label: city.label
                                            }))
                                        ]}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Propiedad
                                </label>
                                <Input.Select
                                    value={formData.property_type_context}
                                    onChange={(e) => handleInputChange('property_type_context', e.target.value)}
                                    options={[
                                        { value: '', label: 'Seleccionar tipo' },
                                        { value: 'apartamento', label: 'Apartamento' },
                                        { value: 'casa', label: 'Casa' },
                                        { value: 'villa', label: 'Villa' },
                                        { value: 'penthouse', label: 'Penthouse' },
                                        { value: 'oficina', label: 'Oficina' },
                                        { value: 'local', label: 'Local Comercial' },
                                        { value: 'terreno', label: 'Terreno' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contexto de Operación
                                </label>
                                <Input.Select
                                    value={formData.operation_context}
                                    onChange={(e) => handleInputChange('operation_context', e.target.value)}
                                    options={[
                                        { value: '', label: 'Seleccionar operación' },
                                        { value: 'venta', label: 'Venta' },
                                        { value: 'alquiler', label: 'Alquiler' },
                                        { value: 'alquiler_temporal', label: 'Alquiler Temporal' },
                                        { value: 'proyecto', label: 'Proyecto' }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Contenido SEO con Editor Rico */}
            <SEOContentSection
                formData={formData}
                handleInputChange={handleInputChange}
                cities={cities}
                propertyTypes={[
                    'apartamento', 'casa', 'villa', 'penthouse',
                    'oficina', 'local comercial', 'terreno', 'estudio',
                    'duplex', 'triplex', 'loft', 'townhouse'
                ]}
            />

            {/* Secciones SEO */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Secciones SEO Adicionales</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addSection}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Agregar Sección
                        </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        Agrega secciones adicionales para organizar mejor el contenido (opcional)
                    </p>
                </Card.Header>
                <Card.Body>
                    {formData.seo_sections && formData.seo_sections.length > 0 ? (
                        <div className="space-y-4">
                            {formData.seo_sections.map((section, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">Sección {index + 1}</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSection(index)}
                                            icon={<X className="w-4 h-4" />}
                                            className="text-red-600 hover:text-red-800"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Título de la Sección
                                            </label>
                                            <Input
                                                value={section.title || ''}
                                                onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                                                placeholder="Título de la sección"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contenido
                                            </label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows={4}
                                                value={section.content || ''}
                                                onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                                                placeholder="Contenido de la sección..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Orden
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={section.order || 1}
                                                    onChange={(e) => handleSectionChange(index, 'order', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tipo
                                                </label>
                                                <Input.Select
                                                    value={section.type || 'content'}
                                                    onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                                                    options={[
                                                        { value: 'content', label: 'Contenido' },
                                                        { value: 'faq', label: 'FAQ' },
                                                        { value: 'benefits', label: 'Beneficios' },
                                                        { value: 'features', label: 'Características' }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No hay secciones SEO adicionales</p>
                            <p className="text-sm">Agrega secciones para organizar mejor el contenido</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente para la pestaña de Etiquetas
const TagsTab = ({ availableTags, tagCategories, selectedTags, handleTagToggle, loadingTags }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">Etiquetas</h3>
                <p className="text-sm text-gray-600">
                    Selecciona las etiquetas que mejor describan este contenido SEO
                </p>
            </Card.Header>
            <Card.Body>
                {loadingTags ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando etiquetas...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tagCategories.map(category => {
                            const categoryTags = availableTags.filter(tag => tag.category === category);
                            if (categoryTags.length === 0) return null;

                            return (
                                <div key={category} className="border-b border-gray-200 pb-6 last:border-b-0">
                                    <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                        {category.replace('-', ' ')}
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {categoryTags.map(tag => {
                                            const isSelected = selectedTags.includes(tag.id);
                                            return (
                                                <TagButton
                                                    key={tag.id}
                                                    tag={tag}
                                                    isSelected={isSelected}
                                                    onClick={() => handleTagToggle(tag.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {selectedTags.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="font-medium text-blue-900 mb-2">
                                    Etiquetas seleccionadas ({selectedTags.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTags.map(tagId => {
                                        const tag = availableTags.find(t => t.id === tagId);
                                        if (!tag) return null;
                                        return (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                                            >
                                                {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                                {tag.display_name || tag.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {availableTags.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                                <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No hay etiquetas disponibles</p>
                                <p className="text-sm">Agrega etiquetas en la configuración del sistema</p>
                            </div>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

// Componente para mostrar información de una propiedad
const PropertyCard = ({ property, isSelected, onToggle, selectedProperty, onUpdateRelation }) => {
    const mainPrice = getMainPrice(property);

    return (
        <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            onClick={onToggle}
        >
            <div className="flex items-start space-x-4">
                {/* Imagen de la propiedad */}
                <div className="flex-shrink-0">
                    {property.main_image_url ? (
                        <img
                            src={property.main_image_url}
                            alt={property.name}
                            className="w-24 h-18 rounded-lg object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className={`w-24 h-18 bg-gray-200 rounded-lg flex items-center justify-center ${property.main_image_url ? 'hidden' : 'flex'
                            }`}
                    >
                        <Home className="w-8 h-8 text-gray-400" />
                    </div>
                </div>

                {/* Información de la propiedad */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            {/* Header con checkbox, código y precio */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={onToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                #{property.code}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                            {property.name}
                                        </h4>
                                    </div>
                                </div>
                                {mainPrice && (
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <p className="text-sm font-bold text-green-600">
                                            {mainPrice}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Ubicación */}
                            <div className="flex items-center text-xs text-gray-600 mb-3">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                    {[
                                        property.cities?.name,
                                        property.provinces?.name
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </div>

                            {/* Badges de estado y categoría */}
                            <div className="flex items-center space-x-2">
                                <Badge
                                    variant={property.property_status === 'Publicada' ? 'success' : 'secondary'}
                                    size="sm"
                                >
                                    {property.property_status}
                                </Badge>
                                {property.property_categories?.name && (
                                    <Badge variant="outline" size="sm">
                                        {property.property_categories.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Configuración de relación (solo si está seleccionado) */}
                    {isSelected && selectedProperty && onUpdateRelation && (
                        <div
                            className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 rounded-lg p-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h5 className="text-xs font-semibold text-blue-900 mb-3">
                                Configuración de Relación
                            </h5>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-blue-800 mb-1">
                                        Tipo:
                                    </label>
                                    <Input.Select
                                        value={selectedProperty.relation_type}
                                        onChange={(e) => onUpdateRelation('relation_type', e.target.value)}
                                        options={[
                                            { value: 'related', label: 'Relacionado' },
                                            { value: 'featured', label: 'Destacado' },
                                            { value: 'example', label: 'Ejemplo' },
                                            { value: 'reference', label: 'Referencia' }
                                        ]}
                                        className="text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-800 mb-1">
                                        Peso:
                                    </label>
                                    <Input
                                        type="number"
                                        min="0.1"
                                        max="5.0"
                                        step="0.1"
                                        value={selectedProperty.weight}
                                        onChange={(e) => onUpdateRelation('weight', parseFloat(e.target.value) || 1.0)}
                                        className="text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-800 mb-1">
                                        Notas:
                                    </label>
                                    <Input
                                        value={selectedProperty.notes || ''}
                                        onChange={(e) => onUpdateRelation('notes', e.target.value)}
                                        placeholder="Opcional..."
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente para la pestaña de Propiedades
const PropertiesTab = ({ selectedProperties, properties, onShowModal, updatePropertyRelation, handlePropertyToggle }) => {
    return (
        <Card>
            <Card.Header>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Propiedades Relacionadas</h3>
                        <p className="text-sm text-gray-600">
                            Asocia este contenido SEO con propiedades específicas
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={onShowModal}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Agregar Propiedades
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                {selectedProperties.length > 0 ? (
                    <div className="space-y-4">
                        {selectedProperties.map(selectedProp => {
                            const property = properties.find(p => p.id === selectedProp.id);
                            if (!property) return null;

                            return (
                                <div key={property.id} className="bg-gray-50 rounded-lg border p-4">
                                    <div className="flex items-start space-x-4">
                                        {property.main_image_url ? (
                                            <img
                                                src={property.main_image_url}
                                                alt={property.name}
                                                className="w-20 h-15 rounded object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                                <Home className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                            #{property.code}
                                                        </span>
                                                        {getMainPrice(property) && (
                                                            <span className="text-xs font-medium text-green-600">
                                                                {getMainPrice(property)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h6 className="text-sm font-medium text-gray-900">
                                                        {property.name}
                                                    </h6>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {[
                                                            property.cities?.name,
                                                            property.provinces?.name
                                                        ].filter(Boolean).join(', ')}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <Badge variant="secondary" size="sm">
                                                            {property.property_categories?.name || 'Sin categoría'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handlePropertyToggle(property.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mt-3">
                                                <div>
                                                    <label className="text-xs text-gray-600">Tipo de Relación:</label>
                                                    <Input.Select
                                                        value={selectedProp.relation_type}
                                                        onChange={(e) => updatePropertyRelation(property.id, 'relation_type', e.target.value)}
                                                        options={[
                                                            { value: 'related', label: 'Relacionado' },
                                                            { value: 'featured', label: 'Destacado' },
                                                            { value: 'example', label: 'Ejemplo' },
                                                            { value: 'reference', label: 'Referencia' }
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
                                                        value={selectedProp.weight}
                                                        onChange={(e) => updatePropertyRelation(property.id, 'weight', parseFloat(e.target.value))}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600">Notas:</label>
                                                    <Input
                                                        value={selectedProp.notes}
                                                        onChange={(e) => updatePropertyRelation(property.id, 'notes', e.target.value)}
                                                        placeholder="Notas..."
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Sin propiedades relacionadas</h4>
                        <p className="text-sm mb-4">
                            Asocia este contenido SEO con propiedades específicas para mejorar la relevancia
                        </p>
                        <Button
                            variant="outline"
                            onClick={onShowModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Agregar Primera Propiedad
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

// Componente para la pestaña de SEO Avanzado
const AdvancedSEOTab = ({ formData, handleInputChange, handleSchemaChange }) => {
    return (
        <div className="space-y-6">
            {/* Metadatos SEO */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Metadatos SEO</h3>
                    <p className="text-sm text-gray-600">
                        Optimiza el contenido para motores de búsqueda
                    </p>
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
                            <p className="text-xs text-gray-500 mt-1">
                                Recomendado: 50-60 caracteres. Actual: {formData.meta_title?.length || 0}
                            </p>
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
                            <p className="text-xs text-gray-500 mt-1">
                                Recomendado: 150-160 caracteres. Actual: {formData.meta_description?.length || 0}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL Canónica
                                </label>
                                <Input
                                    value={formData.canonical_url}
                                    onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                                    placeholder="https://ejemplo.com/contenido"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug
                                </label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="slug-del-contenido"
                                />
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Schema.org */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Schema.org y Datos Estructurados</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Datos Estructurados
                            </label>
                            <Input.Select
                                value={formData.structured_data_type}
                                onChange={(e) => handleInputChange('structured_data_type', e.target.value)}
                                options={[
                                    { value: '', label: 'Seleccionar tipo' },
                                    { value: 'WebPage', label: 'Página Web' },
                                    { value: 'Article', label: 'Artículo' },
                                    { value: 'LocalBusiness', label: 'Negocio Local' },
                                    { value: 'RealEstateAgent', label: 'Agente Inmobiliario' },
                                    { value: 'Residence', label: 'Residencia' },
                                    { value: 'Apartment', label: 'Apartamento' },
                                    { value: 'House', label: 'Casa' }
                                ]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Datos Schema.org (JSON-LD)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                rows={8}
                                value={formData.schema_org_data ? JSON.stringify(formData.schema_org_data, null, 2) : ''}
                                onChange={(e) => handleSchemaChange(e.target.value)}
                                placeholder={`{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Título de la página",
  "description": "Descripción de la página"
}`}
                            />
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Métricas de Performance */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Métricas y Performance</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vistas
                                </label>
                                <Input
                                    type="number"
                                    value={formData.views}
                                    onChange={(e) => handleInputChange('views', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Score de Performance
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={formData.performance_score}
                                    onChange={(e) => handleInputChange('performance_score', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Versión
                                </label>
                                <Input
                                    type="number"
                                    value={formData.version}
                                    onChange={(e) => handleInputChange('version', parseInt(e.target.value) || 1)}
                                    placeholder="1"
                                />
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Preview de SEO */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Preview de SEO</h3>
                </Card.Header>
                <Card.Body>
                    <div className="bg-white p-3 rounded border">
                        <h5 className="text-blue-600 text-lg leading-tight">
                            {formData.meta_title || formData.title || 'Título del contenido'}
                        </h5>
                        <p className="text-green-700 text-sm">
                            ejemplo.com/{formData.slug || 'contenido-seo'}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                            {formData.meta_description || formData.description || 'Descripción del contenido SEO aparecerá aquí...'}
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente reutilizable para botones de tag
const TagButton = ({ tag, isSelected, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${isSelected
                    ? 'border-blue-300 text-blue-700 shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
            style={{
                backgroundColor: isSelected
                    ? (tag.color ? tag.color + '20' : '#dbeafe')
                    : undefined,
                borderColor: isSelected && tag.color
                    ? tag.color
                    : undefined
            }}
        >
            {tag.icon && (
                <span className="mr-2">{tag.icon}</span>
            )}
            {tag.display_name || tag.name}
            {isSelected && (
                <CheckCircle className="w-4 h-4 ml-2" />
            )}
        </button>
    );
};

// Modal de Selección de Propiedades
const PropertySelectionModal = ({ isOpen, onClose, properties, selectedProperties, onToggleProperty, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [sortBy, setSortBy] = useState('name');

    const [propertyCategories, setPropertyCategories] = useState([]);
    const [locations, setLocations] = useState([]);

    // Extraer categorías y ubicaciones únicas de las propiedades
    useEffect(() => {
        if (properties.length > 0) {
            const categories = [...new Set(properties.map(p => p.property_categories?.name).filter(Boolean))];
            const cities = [...new Set(properties.map(p => {
                const city = p.cities?.name;
                const province = p.provinces?.name;
                if (city && province) {
                    return `${city}, ${province}`;
                }
                return city || province;
            }).filter(Boolean))];

            setPropertyCategories(categories);
            setLocations(cities);
        }
    }, [properties]);

    const updatePropertyRelation = (propertyId, field, value) => {
        const selectedProp = selectedProperties.find(p => p.id === propertyId);
        if (selectedProp) {
            onToggleProperty(propertyId, { ...selectedProp, [field]: value });
        }
    };

    // Filtrar y ordenar propiedades
    const filteredAndSortedProperties = properties
        .filter(property => {
            const matchesSearch = property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.code?.toString().includes(searchTerm) ||
                property.internal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.cities?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.provinces?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = !filterCategory || property.property_categories?.name === filterCategory;
            const matchesStatus = !filterStatus || property.property_status === filterStatus;
            const matchesLocation = !filterLocation ||
                `${property.cities?.name}, ${property.provinces?.name}` === filterLocation ||
                property.cities?.name === filterLocation ||
                property.provinces?.name === filterLocation;

            return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name?.localeCompare(b.name) || 0;
                case 'code':
                    return (a.code || 0) - (b.code || 0);
                case 'price_asc':
                    const priceA = a.sale_price || a.rental_price || 0;
                    const priceB = b.sale_price || b.rental_price || 0;
                    return priceA - priceB;
                case 'price_desc':
                    const priceA2 = a.sale_price || a.rental_price || 0;
                    const priceB2 = b.sale_price || b.rental_price || 0;
                    return priceB2 - priceA2;
                case 'location':
                    const locationA = `${a.cities?.name || ''}, ${a.provinces?.name || ''}`;
                    const locationB = `${b.cities?.name || ''}, ${b.provinces?.name || ''}`;
                    return locationA.localeCompare(locationB);
                default:
                    return 0;
            }
        });

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Seleccionar Propiedades"
            size="xl"
        >
            <div className="space-y-4">
                {/* Header con estadísticas */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {filteredAndSortedProperties.length} propiedades
                                </p>
                                <p className="text-xs text-gray-500">
                                    {filteredAndSortedProperties.length !== properties.length &&
                                        `de ${properties.length} totales`
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-600">
                                    {selectedProperties.length} seleccionadas
                                </p>
                                <p className="text-xs text-gray-500">
                                    para relacionar
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input.Search
                        placeholder="Buscar por nombre, código o ubicación..."
                        value={searchTerm}
                        onSearch={setSearchTerm}
                        className="lg:col-span-3"
                    />

                    <Input.Select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            ...propertyCategories.map(cat => ({
                                value: cat,
                                label: cat
                            }))
                        ]}
                    />

                    <Input.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            { value: 'Publicada', label: 'Publicada' },
                            { value: 'Borrador', label: 'Borrador' },
                            { value: 'Archivada', label: 'Archivada' }
                        ]}
                    />

                    <Input.Select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las ubicaciones' },
                            ...locations.map(loc => ({
                                value: loc,
                                label: loc
                            }))
                        ]}
                    />

                    <div className="lg:col-span-3">
                        <Input.Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={[
                                { value: 'name', label: 'Ordenar por: Nombre' },
                                { value: 'code', label: 'Ordenar por: Código' },
                                { value: 'price_asc', label: 'Ordenar por: Precio (menor a mayor)' },
                                { value: 'price_desc', label: 'Ordenar por: Precio (mayor a menor)' },
                                { value: 'location', label: 'Ordenar por: Ubicación' }
                            ]}
                            className="w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Lista de propiedades */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando propiedades...</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-3">
                        {filteredAndSortedProperties.map(property => {
                            const isSelected = selectedProperties.some(p => p.id === property.id);
                            const selectedProperty = selectedProperties.find(p => p.id === property.id);

                            return (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    isSelected={isSelected}
                                    onToggle={() => onToggleProperty(property.id)}
                                    selectedProperty={selectedProperty}
                                    onUpdateRelation={isSelected ? updatePropertyRelation : null}
                                />
                            );
                        })}

                        {filteredAndSortedProperties.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Home className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No se encontraron propiedades</p>
                                <p className="text-sm">Prueba ajustando los filtros de búsqueda</p>
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

// Componente Modal de Filtros por Etiquetas
const TagFilterModal = ({ isOpen, onClose, availableTags, tagCategories, selectedTags, onTagsChange }) => {
    const [tempSelectedTags, setTempSelectedTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Sincronizar con los tags seleccionados cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setTempSelectedTags([...selectedTags]);
            setSearchTerm('');
        }
    }, [isOpen, selectedTags]);

    const handleTagToggle = (tagId) => {
        if (tempSelectedTags.includes(tagId)) {
            setTempSelectedTags(tempSelectedTags.filter(id => id !== tagId));
        } else {
            setTempSelectedTags([...tempSelectedTags, tagId]);
        }
    };

    const handleApplyFilters = () => {
        onTagsChange(tempSelectedTags);
        onClose();
    };

    const handleClearAll = () => {
        setTempSelectedTags([]);
    };

    // Filtrar tags por búsqueda
    const filteredTags = availableTags.filter(tag =>
        tag.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Filtrar por Etiquetas"
            size="lg"
        >
            <div className="space-y-4">
                {/* Header con stats y búsqueda */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {availableTags.length} etiquetas disponibles • {tempSelectedTags.length} seleccionadas
                    </div>
                    <div className="flex items-center space-x-2">
                        {tempSelectedTags.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Limpiar todo
                            </button>
                        )}
                    </div>
                </div>

                {/* Búsqueda */}
                <Input.Search
                    placeholder="Buscar etiquetas..."
                    value={searchTerm}
                    onSearch={setSearchTerm}
                    className="w-full"
                />

                {/* Lista de etiquetas por categoría */}
                <div className="max-h-96 overflow-y-auto">
                    {searchTerm ? (
                        // Vista de búsqueda - todas las tags filtradas
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Resultados de búsqueda</h4>
                            <div className="flex flex-wrap gap-2">
                                {filteredTags.map(tag => {
                                    const isSelected = tempSelectedTags.includes(tag.id);
                                    return (
                                        <TagButton
                                            key={tag.id}
                                            tag={tag}
                                            isSelected={isSelected}
                                            onClick={() => handleTagToggle(tag.id)}
                                        />
                                    );
                                })}
                            </div>
                            {filteredTags.length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No se encontraron etiquetas que coincidan con "{searchTerm}"
                                </p>
                            )}
                        </div>
                    ) : (
                        // Vista por categorías
                        <div className="space-y-4">
                            {tagCategories.map(category => {
                                const categoryTags = availableTags.filter(tag => tag.category === category);
                                if (categoryTags.length === 0) return null;

                                const selectedInCategory = categoryTags.filter(tag =>
                                    tempSelectedTags.includes(tag.id)
                                ).length;

                                return (
                                    <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900 capitalize">
                                                {category.replace('-', ' ')}
                                            </h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {selectedInCategory}/{categoryTags.length}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryTags.map(tag => {
                                                const isSelected = tempSelectedTags.includes(tag.id);
                                                return (
                                                    <TagButton
                                                        key={tag.id}
                                                        tag={tag}
                                                        isSelected={isSelected}
                                                        onClick={() => handleTagToggle(tag.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer con resumen y acciones */}
                {tempSelectedTags.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="font-medium text-blue-900 mb-2">
                            Etiquetas seleccionadas ({tempSelectedTags.length})
                        </h5>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {tempSelectedTags.map(tagId => {
                                const tag = availableTags.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                                    >
                                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                        {tag.display_name || tag.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleApplyFilters}
                        icon={<Filter className="w-4 h-4" />}
                    >
                        Aplicar Filtros ({tempSelectedTags.length})
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const SEOContentManager = ({ user, permissions }) => {
    const [seoContents, setSeoContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'editor'
    const [selectedContent, setSelectedContent] = useState(null);

    // Estados para tags
    const [availableTags, setAvailableTags] = useState([]);
    const [tagCategories, setTagCategories] = useState([]);

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterContentType, setFilterContentType] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados para modal de filtros
    const [showTagFilterModal, setShowTagFilterModal] = useState(false);
    const [availableTagsForFilter, setAvailableTagsForFilter] = useState([]);

    // Estados del editor
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteContentId, setDeleteContentId] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        Promise.all([
            fetchSEOContents(),
            fetchTags()
        ]);
    }, []);

    // Cuando cambien los contenidos, actualizar tags disponibles para filtro
    useEffect(() => {
        updateAvailableTagsForFilter();
    }, [seoContents, availableTags]);

    const updateAvailableTagsForFilter = () => {
        // Obtener todos los tag IDs que están siendo usados por contenidos SEO
        const usedTagIds = new Set();
        seoContents.forEach(content => {
            if (content.tags && content.tags.length > 0) {
                content.tags.forEach(tag => {
                    if (tag && tag.id) {
                        usedTagIds.add(tag.id);
                    }
                });
            }
        });

        // Filtrar availableTags para mostrar solo los que están siendo usados
        const usedTags = availableTags.filter(tag => usedTagIds.has(tag.id));
        setAvailableTagsForFilter(usedTags);
    };

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

    const fetchSEOContents = async () => {
        try {
            setLoading(true);
            setError('');

            // Primero obtener todos los contenidos SEO
            const { data: contentsData, error: contentsError } = await supabase
                .from('seo_content')
                .select('*')
                .order('created_at', { ascending: false });

            if (contentsError) throw contentsError;

            // Luego obtener las tags de cada contenido por separado
            const contentsWithTags = await Promise.all(
                (contentsData || []).map(async (content) => {
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
                            .eq('content_id', content.id)
                            .eq('content_type', 'seo_content');

                        if (tagsError) {
                            console.warn('Error al cargar tags para contenido SEO:', content.id, tagsError);
                        }

                        return {
                            ...content,
                            tags: tagsData ? tagsData.map(ct => ct.tags).filter(Boolean) : []
                        };
                    } catch (err) {
                        console.warn('Error al procesar tags para contenido SEO:', content.id, err);
                        return {
                            ...content,
                            tags: []
                        };
                    }
                })
            );

            setSeoContents(contentsWithTags);
        } catch (err) {
            console.error('Error al cargar contenidos SEO:', err);
            setError('Error al cargar los contenidos SEO: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar contenidos SEO
    const filteredContents = seoContents.filter(content => {
        const matchesSearch = content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.h1_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.tags?.some(tag => tag.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = !filterStatus || content.status === filterStatus;
        const matchesContentType = !filterContentType || content.content_type === filterContentType;
        const matchesLocation = !filterLocation || content.location_context === filterLocation;

        // Filtrar por tags seleccionados
        const matchesTags = filterTags.length === 0 ||
            filterTags.every(selectedTagId =>
                content.tags?.some(tag => tag.id === selectedTagId)
            );

        return matchesSearch && matchesStatus && matchesContentType && matchesLocation && matchesTags;
    });

    // Paginación
    const totalPages = Math.ceil(filteredContents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentContents = filteredContents.slice(startIndex, endIndex);

    // Acciones
    const handleCreateContent = () => {
        setSelectedContent(null);
        setViewMode('editor');
    };

    const handleEditContent = (content) => {
        setSelectedContent(content);
        setViewMode('editor');
    };

    const handleDeleteContent = async (contentId) => {
        try {
            const { error } = await supabase
                .from('seo_content')
                .delete()
                .eq('id', contentId);

            if (error) throw error;

            setSeoContents(seoContents.filter(c => c.id !== contentId));
            setShowDeleteModal(false);
            setDeleteContentId(null);
        } catch (err) {
            console.error('Error al eliminar contenido SEO:', err);
            setError('Error al eliminar el contenido SEO: ' + err.message);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedContent(null);
        fetchSEOContents(); // Recargar para ver cambios
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatViews = (views) => {
        if (!views || views === 0) return '0';
        const num = parseInt(views);
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterContentType, filterLocation, filterTags]);

    // Si está en modo editor, mostrar el editor
    if (viewMode === 'editor') {
        return (
            <SEOContentEditor
                content={selectedContent}
                onBack={handleBackToList}
                user={user}
                permissions={permissions}
                availableTags={availableTags}
                tagCategories={tagCategories}
            />
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando contenidos SEO...</p>
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
                    <h2 className="text-xl font-semibold text-gray-900">Contenido SEO</h2>
                    <p className="text-sm text-gray-600">
                        {filteredContents.length} {filteredContents.length === 1 ? 'contenido encontrado' : 'contenidos encontrados'}
                        {filteredContents.length !== seoContents.length && ` de ${seoContents.length} totales`}
                    </p>
                </div>
                {permissions?.hasAction('create') && (
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={handleCreateContent}
                    >
                        Nuevo Contenido SEO
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input.Search
                        placeholder="Buscar contenidos SEO..."
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
                        value={filterContentType}
                        onChange={(e) => setFilterContentType(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los tipos' },
                            { value: 'category', label: 'Categoría' },
                            { value: 'location', label: 'Ubicación' },
                            { value: 'property_type', label: 'Tipo de Propiedad' },
                            { value: 'landing', label: 'Landing Page' },
                            { value: 'blog', label: 'Blog' },
                            { value: 'service', label: 'Servicio' }
                        ]}
                        className="min-w-40"
                    />

                    {/* Botón para filtrar por etiquetas */}
                    <Button
                        variant="outline"
                        onClick={() => setShowTagFilterModal(true)}
                        icon={<Tag className="w-4 h-4" />}
                        className="relative"
                    >
                        Filtrar por Etiquetas
                        {filterTags.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {filterTags.length}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Mostrar etiquetas seleccionadas para filtro */}
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

            {/* Lista de contenidos SEO */}
            <div className="flex-1 overflow-y-auto">
                {currentContents.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contenido
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Performance
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stats
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentContents.map((content) => {
                                            const perfScore = formatPerformanceScore(content.performance_score);
                                            return (
                                                <tr
                                                    key={content.id}
                                                    className="hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => handleEditContent(content)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-start space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Globe className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                    {content.title || content.h1_title}
                                                                </h3>
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                                    {content.identifier}
                                                                </p>
                                                                <div className="flex items-center space-x-3 mt-1">
                                                                    {content.slug && (
                                                                        <span className="text-xs text-gray-500">
                                                                            /{content.slug}
                                                                        </span>
                                                                    )}
                                                                    {content.auto_generated && (
                                                                        <Badge variant="secondary" size="sm">
                                                                            <Bot className="w-3 h-3 mr-1" />
                                                                            Auto
                                                                        </Badge>
                                                                    )}
                                                                    {content.location_context && (
                                                                        <span className="text-xs text-gray-500 flex items-center">
                                                                            <MapPin className="w-3 h-3 mr-1" />
                                                                            {content.location_context}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* Tags del contenido */}
                                                                {content.tags && content.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {content.tags.slice(0, 2).map((tag) => (
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
                                                                        {content.tags.length > 2 && (
                                                                            <span className="text-xs text-gray-500">
                                                                                +{content.tags.length - 2}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {getContentTypeBadge(content.content_type)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {getStatusBadge(content.status)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {perfScore.score !== 'N/A' ? (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${perfScore.bg} ${perfScore.color}`}>
                                                                <BarChart3 className="w-3 h-3 mr-1" />
                                                                {perfScore.score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            <p>{formatDate(content.created_at)}</p>
                                                            <p className="text-xs text-gray-400">
                                                                v{content.version || 1}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                <span>{formatViews(content.views)}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Type className="w-4 h-4 mr-1" />
                                                                <span>{content.seo_content?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                                            {content.status === 'published' && content.slug && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    icon={<ExternalLink className="w-4 h-4" />}
                                                                    title="Ver contenido"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/${content.slug}`, '_blank');
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
                                                                        handleEditContent(content);
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
                                                                        setDeleteContentId(content.id);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                <div className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredContents.length)} de {filteredContents.length} contenidos
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
                        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron contenidos SEO</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterContentType || filterLocation ?
                                'Prueba ajustando los filtros de búsqueda.' :
                                'Comienza creando tu primer contenido SEO.'
                            }
                        </p>
                        {permissions?.hasAction('create') && (
                            <Button
                                variant="primary"
                                onClick={handleCreateContent}
                            >
                                Crear Primer Contenido SEO
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de filtros por etiquetas */}
            <TagFilterModal
                isOpen={showTagFilterModal}
                onClose={() => setShowTagFilterModal(false)}
                availableTags={availableTagsForFilter}
                tagCategories={tagCategories.filter(category =>
                    availableTagsForFilter.some(tag => tag.category === category)
                )}
                selectedTags={filterTags}
                onTagsChange={setFilterTags}
            />

            {/* Modal de confirmación de eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar Contenido SEO"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que quieres eliminar este contenido SEO? Esta acción no se puede deshacer.
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
                            onClick={() => handleDeleteContent(deleteContentId)}
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

// Componente Editor de Contenido SEO con pestañas organizadas
const SEOContentEditor = ({ content, onBack, user, permissions, availableTags, tagCategories }) => {
    const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'tags', 'properties', 'advanced'
    const [formData, setFormData] = useState({
        content_type: 'landing',
        identifier: '',
        title: '',
        description: '',
        h1_title: '',
        h2_subtitle: '',
        seo_content: '',
        seo_sections: [],
        location_context: '',
        property_type_context: '',
        operation_context: '',
        schema_org_data: null,
        views: 0,
        performance_score: 0,
        version: 1,
        auto_generated: false,
        status: 'draft',
        meta_title: '',
        meta_description: '',
        canonical_url: '',
        slug: '',
        language: 'es',
        structured_data_type: '',
        ...content
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);

    // Estados para ciudades
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);

    // Estados para propiedades
    const [properties, setProperties] = useState([]);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [showPropertyModal, setShowPropertyModal] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        fetchCities();
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            setLoadingProperties(true);
            const { data, error } = await supabase
                .from('properties')
                .select(`
                    id,
                    code,
                    internal_code,
                    name,
                    private_name,
                    description,
                    is_project,
                    sale_currency,
                    sale_price,
                    rental_currency,
                    rental_price,
                    temp_rental_currency,
                    temp_rental_price,
                    property_status,
                    availability,
                    main_image_url,
                    property_categories!properties_category_id_fkey(
                        id,
                        name
                    ),
                    cities!properties_city_id_fkey(
                        id,
                        name
                    ),
                    provinces!properties_province_id_fkey(
                        id,
                        name
                    ),
                    countries!properties_country_id_fkey(
                        id,
                        name
                    )
                `)
                .eq('availability', 1)
                .order('name');

            if (error) throw error;
            setProperties(data || []);
        } catch (err) {
            console.error('Error al cargar propiedades:', err);
            setProperties([]);
        } finally {
            setLoadingProperties(false);
        }
    };

    const fetchCities = async () => {
        try {
            setLoadingCities(true);
            const { data, error } = await supabase
                .from('cities')
                .select(`
                    id,
                    name,
                    provinces!cities_province_id_fkey(
                        id,
                        name
                    )
                `)
                .order('name');

            if (error) throw error;

            const formattedCities = (data || []).map(city => ({
                value: city.name,
                label: `${city.name}, ${city.provinces?.name || 'N/A'}`,
                province: city.provinces?.name
            }));

            setCities(formattedCities);
        } catch (err) {
            console.error('Error al cargar ciudades:', err);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    // Cargar propiedades relacionadas al contenido SEO
    const loadContentProperties = async (contentId) => {
        try {
            const { data, error } = await supabase
                .from('content_property_relations')
                .select('property_id, relation_type, weight, notes')
                .eq('content_id', contentId)
                .eq('content_type', 'seo_content');

            if (error) throw error;

            setSelectedProperties(data ? data.map(rel => ({
                id: rel.property_id,
                relation_type: rel.relation_type,
                weight: rel.weight,
                notes: rel.notes
            })) : []);
        } catch (err) {
            console.error('Error al cargar propiedades del contenido SEO:', err);
            setSelectedProperties([]);
        }
    };

    // Cargar tags del contenido SEO cuando se edita
    const loadContentTags = async (contentId) => {
        try {
            setLoadingTags(true);
            const { data, error } = await supabase
                .from('content_tags')
                .select('tag_id')
                .eq('content_id', contentId)
                .eq('content_type', 'seo_content');

            if (error) throw error;
            setSelectedTags(data ? data.map(ct => ct.tag_id) : []);
        } catch (err) {
            console.error('Error al cargar tags del contenido SEO:', err);
            setSelectedTags([]);
        } finally {
            setLoadingTags(false);
        }
    };

    useEffect(() => {
        if (content) {
            setFormData({
                content_type: content.content_type || 'landing',
                identifier: content.identifier || '',
                title: content.title || '',
                description: content.description || '',
                h1_title: content.h1_title || '',
                h2_subtitle: content.h2_subtitle || '',
                seo_content: content.seo_content || '',
                seo_sections: content.seo_sections || [],
                location_context: content.location_context || '',
                property_type_context: content.property_type_context || '',
                operation_context: content.operation_context || '',
                schema_org_data: content.schema_org_data || null,
                views: content.views || 0,
                performance_score: content.performance_score || 0,
                version: content.version || 1,
                auto_generated: content.auto_generated || false,
                status: content.status || 'draft',
                meta_title: content.meta_title || '',
                meta_description: content.meta_description || '',
                canonical_url: content.canonical_url || '',
                slug: content.slug || '',
                language: content.language || 'es',
                structured_data_type: content.structured_data_type || ''
            });

            if (content.id) {
                loadContentTags(content.id);
                loadContentProperties(content.id);
            }
        } else {
            setSelectedTags([]);
            setSelectedProperties([]);
        }
    }, [content]);

    // Auto-generar slug del título
    useEffect(() => {
        if (formData.title && !content) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);
            setFormData(prev => ({ ...prev, slug: slug }));
        }
    }, [formData.title, content]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSectionChange = (index, field, value) => {
        const newSections = [...formData.seo_sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setFormData(prev => ({ ...prev, seo_sections: newSections }));
    };

    const addSection = () => {
        const newSection = {
            title: '',
            content: '',
            type: 'content',
            order: formData.seo_sections.length + 1
        };
        setFormData(prev => ({
            ...prev,
            seo_sections: [...prev.seo_sections, newSection]
        }));
    };

    const removeSection = (index) => {
        const newSections = formData.seo_sections.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, seo_sections: newSections }));
    };

    const handleSchemaChange = (value) => {
        try {
            const parsed = value ? JSON.parse(value) : null;
            setFormData(prev => ({ ...prev, schema_org_data: parsed }));
        } catch (err) {
            // Invalid JSON, keep the string for user to fix
            console.warn('Invalid JSON in schema data');
        }
    };

    const handlePropertyToggle = (propertyId) => {
        const isAlreadySelected = selectedProperties.some(p => p.id === propertyId);

        if (isAlreadySelected) {
            setSelectedProperties(selectedProperties.filter(p => p.id !== propertyId));
        } else {
            setSelectedProperties([...selectedProperties, {
                id: propertyId,
                relation_type: 'related',
                weight: 1.0,
                notes: ''
            }]);
        }
    };

    const updatePropertyRelation = (propertyId, field, value) => {
        setSelectedProperties(selectedProperties.map(p =>
            p.id === propertyId ? { ...p, [field]: value } : p
        ));
    };

    const saveContentProperties = async (contentId, propertyRelations) => {
        try {
            await supabase
                .from('content_property_relations')
                .delete()
                .eq('content_id', contentId)
                .eq('content_type', 'seo_content');

            if (propertyRelations.length > 0) {
                const relations = propertyRelations.map(rel => ({
                    content_id: contentId,
                    content_type: 'seo_content',
                    property_id: rel.id,
                    relation_type: rel.relation_type,
                    weight: rel.weight,
                    notes: rel.notes || null,
                    auto_generated: false
                }));

                const { error } = await supabase
                    .from('content_property_relations')
                    .insert(relations);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error al guardar relaciones con propiedades:', err);
            throw err;
        }
    };

    const handleTagToggle = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const saveContentTags = async (contentId, tagIds) => {
        try {
            await supabase
                .from('content_tags')
                .delete()
                .eq('content_id', contentId)
                .eq('content_type', 'seo_content');

            if (tagIds.length > 0) {
                const contentTags = tagIds.map(tagId => ({
                    content_id: contentId,
                    content_type: 'seo_content',
                    tag_id: tagId,
                    weight: 1.0,
                    auto_generated: false
                }));

                const { error } = await supabase
                    .from('content_tags')
                    .insert(contentTags);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error al guardar tags:', err);
            throw err;
        }
    };

    const handleSave = async (status = formData.status) => {
        try {
            setSaving(true);

            const dataToSave = {
                content_type: formData.content_type,
                identifier: formData.identifier,
                title: formData.title || null,
                description: formData.description || null,
                h1_title: formData.h1_title || null,
                h2_subtitle: formData.h2_subtitle || null,
                seo_content: formData.seo_content || null,
                seo_sections: formData.seo_sections.length > 0 ? formData.seo_sections : null,
                location_context: formData.location_context || null,
                property_type_context: formData.property_type_context || null,
                operation_context: formData.operation_context || null,
                schema_org_data: formData.schema_org_data,
                views: formData.views || 0,
                performance_score: formData.performance_score || 0,
                version: formData.version || 1,
                auto_generated: formData.auto_generated,
                status: status,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                canonical_url: formData.canonical_url || null,
                slug: formData.slug || null,
                language: formData.language,
                structured_data_type: formData.structured_data_type || null,
                updated_at: new Date().toISOString()
            };

            let result;
            let contentId;

            if (content) {
                result = await supabase
                    .from('seo_content')
                    .update(dataToSave)
                    .eq('id', content.id)
                    .select();

                contentId = content.id;
            } else {
                dataToSave.created_at = new Date().toISOString();
                result = await supabase
                    .from('seo_content')
                    .insert([dataToSave])
                    .select();

                contentId = result.data?.[0]?.id;
            }

            if (result.error) throw result.error;

            if (contentId) {
                await Promise.all([
                    saveContentTags(contentId, selectedTags),
                    saveContentProperties(contentId, selectedProperties)
                ]);
            }

            alert('Contenido SEO guardado exitosamente!');
            onBack();
        } catch (err) {
            console.error('Error al guardar contenido SEO:', err);
            alert('Error al guardar el contenido SEO: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Pestañas de navegación
    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: <FileText className="w-4 h-4" /> },
        { id: 'tags', label: 'Etiquetas', icon: <Tag className="w-4 h-4" /> },
        { id: 'properties', label: 'Propiedades', icon: <Home className="w-4 h-4" /> },
        { id: 'advanced', label: 'SEO Avanzado', icon: <Settings className="w-4 h-4" /> }
    ];

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
                                {content ? 'Editar Contenido SEO' : 'Nuevo Contenido SEO'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Estado: {getStatusBadge(formData.status)} • Tipo: {getContentTypeBadge(formData.content_type)}
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

            {/* Navegación por pestañas */}
            <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenido de las pestañas */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'basic' && (
                        <BasicInfoTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleSectionChange={handleSectionChange}
                            addSection={addSection}
                            removeSection={removeSection}
                            cities={cities}
                            loadingCities={loadingCities}
                        />
                    )}

                    {activeTab === 'tags' && (
                        <TagsTab
                            availableTags={availableTags}
                            tagCategories={tagCategories}
                            selectedTags={selectedTags}
                            handleTagToggle={handleTagToggle}
                            loadingTags={loadingTags}
                        />
                    )}

                    {activeTab === 'properties' && (
                        <PropertiesTab
                            selectedProperties={selectedProperties}
                            properties={properties}
                            onShowModal={() => setShowPropertyModal(true)}
                            updatePropertyRelation={updatePropertyRelation}
                            handlePropertyToggle={handlePropertyToggle}
                        />
                    )}

                    {activeTab === 'advanced' && (
                        <AdvancedSEOTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleSchemaChange={handleSchemaChange}
                        />
                    )}
                </div>
            </div>

            {/* Modal de selección de propiedades */}
            <PropertySelectionModal
                isOpen={showPropertyModal}
                onClose={() => setShowPropertyModal(false)}
                properties={properties}
                selectedProperties={selectedProperties}
                onToggleProperty={handlePropertyToggle}
                loading={loadingProperties}
            />
        </div>
    );
};

export default SEOContentManager;