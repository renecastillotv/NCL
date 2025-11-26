import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Star, Quote,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Youtube, Video, Camera, DollarSign, Users,
    Bed, Bath, Car, Maximize, Building, MessageSquare, Award,
    UserCheck, Phone, Mail, Heart, ThumbsUp, Upload, FileText,
    BookOpen, PenTool, Eye as EyeIcon, Link, List, Hash
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';

import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';


import { supabase } from '../services/api';

// ID del usuario administrador por defecto
const DEFAULT_ADMIN_USER_ID = '6e9575f8-d8ef-4671-aa7f-e7193a2d3f21';

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

// Componente Modal de Selección de Autor
const AuthorSelectionModal = ({ isOpen, onClose, authors, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAuthors, setFilteredAuthors] = useState(authors);

    useEffect(() => {
        const filtered = authors.filter(author =>
            `${author.first_name} ${author.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            author.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (author.position && author.position.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredAuthors(filtered);
    }, [searchTerm, authors]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Autor</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre, email o posición..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    <div className="space-y-3">
                        {filteredAuthors.length > 0 ? (
                            filteredAuthors.map(author => (
                                <div
                                    key={author.id}
                                    onClick={() => onSelect(author)}
                                    className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    {author.profile_photo_url ? (
                                        <img
                                            src={author.profile_photo_url}
                                            alt={`${author.first_name} ${author.last_name}`}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <PenTool className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {author.first_name} {author.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{author.email}</p>
                                        {author.position && (
                                            <p className="text-xs text-gray-500">{author.position}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <PenTool className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron autores</p>
                                <p className="text-sm">Intenta con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {filteredAuthors.length} de {authors.length} autores mostrados
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Propiedades (selección múltiple)
const PropertySelectionModal = ({ isOpen, onClose, properties, selectedIds, onToggleSelect, onConfirm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProperties, setFilteredProperties] = useState(properties);
    const [priceFilter, setPriceFilter] = useState('all');

    useEffect(() => {
        let filtered = properties.filter(property =>
            property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.code.toString().includes(searchTerm) ||
            (property.cities?.name && property.cities.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (property.provinces?.name && property.provinces.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Filtro por precio
        if (priceFilter === 'sale') {
            filtered = filtered.filter(p => p.sale_price && p.sale_price > 0);
        } else if (priceFilter === 'rental') {
            filtered = filtered.filter(p => p.rental_price && p.rental_price > 0);
        }

        setFilteredProperties(filtered);
    }, [searchTerm, priceFilter, properties]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Propiedades</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex space-x-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar por código, nombre o ubicación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Input.Select
                            value={priceFilter}
                            onChange={(e) => setPriceFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'sale', label: 'En Venta' },
                                { value: 'rental', label: 'En Alquiler' }
                            ]}
                            className="w-36"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map(property => (
                                <div
                                    key={property.id}
                                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(property.id)}
                                        onChange={() => onToggleSelect(property.id)}
                                        className="mt-2"
                                    />
                                    {property.main_image_url ? (
                                        <img
                                            src={property.main_image_url}
                                            alt={property.name}
                                            className="w-20 h-16 rounded object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                            <Home className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-xs font-mono text-white bg-gray-800 px-2 py-1 rounded">
                                                #{property.code}
                                            </span>
                                            {getMainPrice(property) && (
                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    {getMainPrice(property)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {property.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {[
                                                property.cities?.name,
                                                property.provinces?.name
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                        {property.property_categories?.name && (
                                            <Badge variant="secondary" size="sm" className="mt-1">
                                                {property.property_categories.name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron propiedades</p>
                                <p className="text-sm">Intenta con otro término de búsqueda o filtro</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        {selectedIds.length} propiedades seleccionadas | {filteredProperties.length} de {properties.length} mostradas
                    </span>
                    <Button onClick={onConfirm}>
                        Confirmar Selección
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Artículos Relacionados
const RelatedArticlesModal = ({ isOpen, onClose, articles, selectedIds, onToggleSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredArticles, setFilteredArticles] = useState(articles);

    useEffect(() => {
        const filtered = articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredArticles(filtered);
    }, [searchTerm, articles]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Artículos Relacionados</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar artículos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    <div className="space-y-3">
                        {filteredArticles.length > 0 ? (
                            filteredArticles.map(article => (
                                <div
                                    key={article.id}
                                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(article.id)}
                                        onChange={() => onToggleSelect(article.id)}
                                        className="mt-1"
                                    />
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
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                            {article.title}
                                        </h4>
                                        {article.excerpt && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge variant="secondary" size="sm">
                                                {article.category}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                /{article.slug}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron artículos</p>
                                <p className="text-sm">Intenta con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        {selectedIds.length} artículos seleccionados | {filteredArticles.length} de {articles.length} mostrados
                    </span>
                    <Button onClick={() => onClose()}>
                        Confirmar Selección
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Componente para la pestaña de Información Básica
const BasicInfoTab = ({ 
    formData, 
    handleInputChange, 
    errors, 
    handleFeaturedImageUpload, 
    uploading,
    selectedAuthor,
    onRemoveAuthor
}) => {
    return (
        <div className="space-y-6">
            {/* Vista previa del artículo */}
            {(formData.title || formData.excerpt) && (
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Vista Previa</h3>
                            {selectedAuthor && (
                                <Badge variant="info" size="sm">
                                    <PenTool className="w-3 h-3 mr-1" />
                                    Autor asignado
                                </Badge>
                            )}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <article>
                                {formData.featured_image && (
                                    <img
                                        src={formData.featured_image}
                                        alt={formData.title}
                                        className="w-full h-48 rounded-lg object-cover mb-4"
                                    />
                                )}
                                <div className="space-y-3">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {formData.title || 'Título del artículo'}
                                    </h1>
                                    {formData.subtitle && (
                                        <h2 className="text-lg text-gray-600">
                                            {formData.subtitle}
                                        </h2>
                                    )}
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        {selectedAuthor && (
                                            <div className="flex items-center space-x-2">
                                                {selectedAuthor.profile_photo_url ? (
                                                    <img
                                                        src={selectedAuthor.profile_photo_url}
                                                        alt={`${selectedAuthor.first_name} ${selectedAuthor.last_name}`}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <PenTool className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                )}
                                                <span>
                                                    Por {selectedAuthor.first_name} {selectedAuthor.last_name}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{formData.read_time} min de lectura</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date().toLocaleDateString('es-DO')}</span>
                                        </div>
                                    </div>
                                    {formData.excerpt && (
                                        <div className="text-gray-700 leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: formData.excerpt }} />
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Información básica */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Información General</h3>
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
                                className={`text-lg ${errors.title ? 'border-red-300' : ''}`}
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug *
                                </label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="url-del-articulo"
                                    className={errors.slug ? 'border-red-300' : ''}
                                />
                                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
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
                                        { value: 'guias-compra', label: 'Guías de Compra' },
                                        { value: 'mercado-inmobiliario', label: 'Mercado Inmobiliario' },
                                        { value: 'inversion', label: 'Inversión' },
                                        { value: 'legal', label: 'Legal' },
                                        { value: 'tips-consejos', label: 'Tips y Consejos' },
                                        { value: 'noticias', label: 'Noticias' }
                                    ]}
                                    className={errors.category ? 'border-red-300' : ''}
                                />
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tiempo de Lectura (min)
                                </label>
                                <Input
                                    type="number"
                                    value={formData.read_time}
                                    onChange={(e) => handleInputChange('read_time', parseInt(e.target.value) || 5)}
                                    placeholder="5"
                                    min="1"
                                    max="120"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Extracto/Resumen *
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                value={formData.excerpt}
                                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                                placeholder="Breve resumen del artículo en 2-3 oraciones..."
                                maxLength={300}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">
                                    Resumen corto para mostrar en listas y redes sociales
                                </p>
                                <span className="text-xs text-gray-400">
                                    {formData.excerpt?.length || 0}/300
                                </span>
                            </div>
                            {errors.excerpt && <p className="text-red-500 text-xs mt-1">{errors.excerpt}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contenido del Artículo
                            </label>
                            <WYSIWYGSEOEditor
                                value={formData.content}
                                onChange={(value) => handleInputChange('content', value)}
                                placeholder="Contenido completo del artículo..."
                                cities={['Santo Domingo', 'Santiago', 'Puerto Plata', 'Piantini', 'Naco', 'Bella Vista']}
                                propertyTypes={['apartamentos', 'casas', 'villas', 'penthouses', 'oficinas', 'locales comerciales']}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imagen Destacada
                            </label>
                            <div className="flex items-center space-x-4">
                                {formData.featured_image ? (
                                    <img
                                        src={formData.featured_image}
                                        alt="Imagen destacada"
                                        className="w-32 h-20 rounded object-cover border"
                                    />
                                ) : (
                                    <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFeaturedImageUpload(e.target.files[0])}
                                        className="hidden"
                                        id="featured-image-upload"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="featured-image-upload"
                                        className={`cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                                            uploading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        JPG, PNG hasta 5MB. Recomendado: 1200x630px
                                    </p>
                                    {formData.featured_image && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleInputChange('featured_image', '')}
                                            className="mt-2"
                                        >
                                            Quitar imagen
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Configuración del artículo */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Configuración del Artículo</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nivel de Lectura
                                </label>
                                <Input.Select
                                    value={formData.reading_level}
                                    onChange={(e) => handleInputChange('reading_level', e.target.value)}
                                    options={[
                                        { value: '', label: 'No especificado' },
                                        { value: 'beginner', label: 'Principiante' },
                                        { value: 'intermediate', label: 'Intermedio' },
                                        { value: 'advanced', label: 'Avanzado' },
                                        { value: 'expert', label: 'Experto' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={formData.featured}
                                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Artículo destacado
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slug de Categoría
                            </label>
                            <Input
                                value={formData.category_slug}
                                onChange={(e) => handleInputChange('category_slug', e.target.value)}
                                placeholder="Slug personalizado para la categoría"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Si no se especifica, se usará el slug de la categoría principal
                            </p>
                        </div>
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
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                isSelected
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

// Componente para la pestaña de Relaciones
const RelationsTab = ({ 
    selectedAuthor,
    selectedProperties,
    selectedRelatedArticles,
    authors,
    properties,
    allArticles,
    onShowAuthorModal,
    onShowPropertiesModal,
    onShowRelatedArticlesModal,
    onRemoveAuthor,
    onRemoveProperty,
    onRemoveRelatedArticle,
    loading
}) => {
    return (
        <div className="space-y-6">
            {/* Autor del artículo */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Autor del Artículo</h3>
                            <p className="text-sm text-gray-600">
                                La persona que escribió este artículo
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowAuthorModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {selectedAuthor ? 'Cambiar Autor' : 'Asignar Autor'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedAuthor ? (
                        <div className="bg-gray-50 rounded-lg border p-4">
                            <div className="flex items-start space-x-4">
                                {selectedAuthor.profile_photo_url ? (
                                    <img
                                        src={selectedAuthor.profile_photo_url}
                                        alt={`${selectedAuthor.first_name} ${selectedAuthor.last_name}`}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                        <PenTool className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">
                                                {selectedAuthor.first_name} {selectedAuthor.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">{selectedAuthor.email}</p>
                                            {selectedAuthor.position && (
                                                <p className="text-sm text-gray-500">{selectedAuthor.position}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={onRemoveAuthor}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <PenTool className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin autor asignado</h4>
                            <p className="text-sm mb-4">
                                Asigna un autor para que aparezca en el artículo
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Propiedades relacionadas */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Propiedades Relacionadas</h3>
                            <p className="text-sm text-gray-600">
                                Propiedades mencionadas o relacionadas con este artículo
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowPropertiesModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Agregar Propiedades
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedProperties && selectedProperties.length > 0 ? (
                        <div className="space-y-3">
                            {selectedProperties.map((property, index) => (
                                <div key={property.id} className="bg-gray-50 rounded-lg border p-3">
                                    <div className="flex items-start space-x-3">
                                        {property.main_image_url ? (
                                            <img
                                                src={property.main_image_url}
                                                alt={property.name}
                                                className="w-16 h-12 rounded object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
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
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                        {property.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {[
                                                            property.cities?.name,
                                                            property.provinces?.name
                                                        ].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveProperty(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin propiedades relacionadas</h4>
                            <p className="text-sm mb-4">
                                Agrega propiedades que se mencionen en el artículo
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Artículos relacionados */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Artículos Relacionados</h3>
                            <p className="text-sm text-gray-600">
                                Otros artículos relacionados con este tema
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowRelatedArticlesModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Agregar Artículos
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedRelatedArticles && selectedRelatedArticles.length > 0 ? (
                        <div className="space-y-3">
                            {selectedRelatedArticles.map((article, index) => (
                                <div key={article.id} className="bg-gray-50 rounded-lg border p-3">
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {article.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge variant="secondary" size="sm">
                                                            {article.category}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            /{article.slug}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveRelatedArticle(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Link className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin artículos relacionados</h4>
                            <p className="text-sm mb-4">
                                Agrega artículos relacionados para mejorar la navegación
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente para la pestaña de SEO
const SEOTab = ({ formData, handleInputChange }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">SEO y Metadatos</h3>
                <p className="text-sm text-gray-600">
                    Optimiza el artículo para motores de búsqueda
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
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Canónica
                        </label>
                        <Input
                            value={formData.canonical_url}
                            onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                            placeholder="https://ejemplo.com/blog/articulo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Datos Estructurados
                        </label>
                        <Input.Select
                            value={formData.structured_data_type}
                            onChange={(e) => handleInputChange('structured_data_type', e.target.value)}
                            options={[
                                { value: '', label: 'Sin especificar' },
                                { value: 'Article', label: 'Artículo' },
                                { value: 'BlogPosting', label: 'Post de Blog' },
                                { value: 'NewsArticle', label: 'Artículo de Noticias' },
                                { value: 'HowTo', label: 'Guía/Tutorial' },
                                { value: 'FAQPage', label: 'Página de FAQ' }
                            ]}
                        />
                    </div>

                    {/* Preview de SEO */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Preview de SEO</h4>
                        <div className="bg-white p-3 rounded border">
                            <h5 className="text-blue-600 text-lg leading-tight">
                                {formData.meta_title || formData.title || 'Título del artículo'}
                            </h5>
                            <p className="text-green-700 text-sm">
                                ejemplo.com/blog/{formData.slug || 'slug-del-articulo'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {formData.meta_description || formData.excerpt || 'Descripción del artículo aparecerá aquí...'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

// Componente para la pestaña de Etiquetas
const TagsTab = ({ availableTags, tagCategories, selectedTags, handleTagToggle, loadingTags }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">Etiquetas</h3>
                <p className="text-sm text-gray-600">
                    Selecciona las etiquetas que mejor describan este artículo
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

// Componente para la pestaña de Contenido Avanzado
const AdvancedTab = ({ formData, handleInputChange, selectedAuthor }) => {
    const handleTableOfContentsChange = (value) => {
        try {
            const toc = JSON.parse(value);
            handleInputChange('table_of_contents', toc);
        } catch (e) {
            // Si no es JSON válido, guardar como null
            handleInputChange('table_of_contents', null);
        }
    };

    const handleSchemaOrgChange = (value) => {
        try {
            const schema = JSON.parse(value);
            handleInputChange('schema_org', schema);
        } catch (e) {
            handleInputChange('schema_org', null);
        }
    };

    // Función para generar Schema.org automáticamente
    const generateSchemaOrg = () => {
        const currentDate = new Date().toISOString();
        const schema = {
            "@context": "https://schema.org",
            "@type": formData.structured_data_type || "Article",
            "headline": formData.title || "Título del artículo",
            "description": formData.excerpt || formData.meta_description || "Descripción del artículo",
            "image": formData.featured_image ? [formData.featured_image] : [],
            "datePublished": formData.published_at || currentDate,
            "dateModified": formData.updated_at || currentDate,
            "author": {
                "@type": "Person",
                "name": selectedAuthor ? `${selectedAuthor.first_name} ${selectedAuthor.last_name}` : "Autor",
                "url": selectedAuthor?.profile_photo_url || ""
            },
            "publisher": {
                "@type": "Organization",
                "name": "Tu Empresa Inmobiliaria",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://tudominio.com/logo.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": formData.canonical_url || `https://tudominio.com/blog/${formData.slug}`
            },
            "articleSection": formData.category?.replace('-', ' ') || "Blog",
            "inLanguage": formData.language || "es",
            "wordCount": formData.content ? formData.content.replace(/<[^>]*>/g, '').split(' ').length : 0,
            "timeRequired": `PT${formData.read_time || 5}M`,
            "keywords": formData.tags ? formData.tags.join(', ') : ""
        };

        // Agregar campos específicos según el tipo
        if (formData.structured_data_type === 'HowTo') {
            schema["@type"] = "HowTo";
            schema.totalTime = `PT${formData.read_time || 5}M`;
            schema.supply = [];
            schema.tool = [];
            schema.step = [];
        } else if (formData.structured_data_type === 'FAQPage') {
            schema["@type"] = "FAQPage";
            schema.mainEntity = [];
        }

        handleInputChange('schema_org', schema);
    };

    // Función para generar tabla de contenidos automáticamente
    const generateTableOfContents = () => {
        if (!formData.content) {
            alert('Primero agrega contenido al artículo para generar la tabla de contenidos');
            return;
        }

        // Extraer encabezados del contenido HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formData.content;
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        const sections = Array.from(headings).map((heading, index) => {
            const level = parseInt(heading.tagName.replace('H', ''));
            const title = heading.textContent.trim();
            const anchor = title.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);
            
            return {
                title,
                level,
                anchor,
                order: index + 1
            };
        });

        const toc = {
            sections,
            generated_at: new Date().toISOString(),
            auto_generated: true
        };

        handleInputChange('table_of_contents', toc);
    };

    // Función para limpiar datos estructurados
    const clearStructuredData = () => {
        handleInputChange('schema_org', null);
        handleInputChange('table_of_contents', null);
    };

    return (
        <div className="space-y-6">
            {/* Generadores automáticos */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Generadores Automáticos</h3>
                    <p className="text-sm text-gray-600">
                        Genera automáticamente datos estructurados y tabla de contenidos
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Schema.org</h4>
                            <p className="text-sm text-gray-600">
                                Genera datos estructurados JSON-LD automáticamente basado en el contenido del artículo
                            </p>
                            <Button
                                variant="primary"
                                onClick={generateSchemaOrg}
                                icon={<Hash className="w-4 h-4" />}
                                disabled={!formData.title}
                            >
                                Generar Schema.org
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Tabla de Contenidos</h4>
                            <p className="text-sm text-gray-600">
                                Extrae automáticamente los encabezados (H1-H6) del contenido del artículo
                            </p>
                            <Button
                                variant="primary"
                                onClick={generateTableOfContents}
                                icon={<List className="w-4 h-4" />}
                                disabled={!formData.content}
                            >
                                Generar TOC
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={clearStructuredData}
                            icon={<X className="w-4 h-4" />}
                            size="sm"
                        >
                            Limpiar Todo
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Tabla de Contenidos</h3>
                    <p className="text-sm text-gray-600">
                        Estructura del artículo para navegación automática
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        {formData.table_of_contents && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Vista Previa de TOC</h4>
                                <div className="space-y-1">
                                    {formData.table_of_contents.sections?.map((section, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-2 text-sm"
                                            style={{ paddingLeft: `${(section.level - 1) * 12}px` }}
                                        >
                                            <span className="text-blue-600">H{section.level}</span>
                                            <span className="text-gray-700">{section.title}</span>
                                            <span className="text-gray-400">#{section.anchor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estructura JSON de la Tabla de Contenidos
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                rows={8}
                                value={formData.table_of_contents ? JSON.stringify(formData.table_of_contents, null, 2) : ''}
                                onChange={(e) => handleTableOfContentsChange(e.target.value)}
                                placeholder='{\n  "sections": [\n    {\n      "title": "Introducción",\n      "level": 1,\n      "anchor": "introduccion",\n      "order": 1\n    }\n  ]\n}'
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Formato JSON para generar tabla de contenidos automática
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Datos Estructurados (Schema.org)</h3>
                    <p className="text-sm text-gray-600">
                        Metadatos adicionales para motores de búsqueda
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        {formData.schema_org && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-green-900 mb-2">Vista Previa de Schema</h4>
                                <div className="text-xs text-green-700 space-y-1">
                                    <div><strong>Tipo:</strong> {formData.schema_org['@type']}</div>
                                    <div><strong>Título:</strong> {formData.schema_org.headline}</div>
                                    <div><strong>Autor:</strong> {formData.schema_org.author?.name}</div>
                                    <div><strong>Categoría:</strong> {formData.schema_org.articleSection}</div>
                                    {formData.schema_org.wordCount && (
                                        <div><strong>Palabras:</strong> {formData.schema_org.wordCount}</div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                JSON-LD Schema
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                rows={12}
                                value={formData.schema_org ? JSON.stringify(formData.schema_org, null, 2) : ''}
                                onChange={(e) => handleSchemaOrgChange(e.target.value)}
                                placeholder='{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Título del artículo",\n  "author": {\n    "@type": "Person",\n    "name": "Nombre del autor"\n  }\n}'
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Datos estructurados según schema.org para SEO avanzado
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente Editor de Artículos
const ArticleEditor = ({ article, onBack, user, permissions, availableTags, tagCategories }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        author_id: null,
        category: 'guias-compra',
        read_time: 5,
        views: '0',
        featured: false,
        meta_title: '',
        meta_description: '',
        canonical_url: '',
        status: 'draft',
        language: 'es',
        category_slug: '',
        tags: [],
        table_of_contents: null,
        related_properties: [],
        area_advisors: null,
        schema_org: null,
        structured_data_type: '',
        reading_level: '',
        related_articles: [],
        ...article
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingTags, setLoadingTags] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Estados para relaciones
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [selectedRelatedArticles, setSelectedRelatedArticles] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [properties, setProperties] = useState([]);
    const [allArticles, setAllArticles] = useState([]);
    const [loadingRelations, setLoadingRelations] = useState(true);

    // Estados para modales
    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [showPropertiesModal, setShowPropertiesModal] = useState(false);
    const [showRelatedArticlesModal, setShowRelatedArticlesModal] = useState(false);
    const [selectedRelatedArticleIds, setSelectedRelatedArticleIds] = useState([]);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);

    // Cargar datos iniciales
    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                loadRelationData()
            ]);
        };
        initializeData();
    }, []);

    const loadRelationData = async () => {
        try {
            setLoadingRelations(true);
            console.log('🔄 Cargando datos de relaciones...');
            
            // Cargar autores
            console.log('📋 Cargando autores...');
            const { data: authorsData, error: authorsError } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, profile_photo_url, position')
                .eq('active', true)
                .order('first_name');

            if (authorsError) {
                console.error('❌ Error cargando autores:', authorsError);
                throw authorsError;
            }

            // Cargar propiedades
            console.log('📋 Cargando propiedades...');
            const { data: propertiesData, error: propertiesError } = await supabase
                .from('properties')
                .select(`
                    id,
                    code,
                    name,
                    main_image_url,
                    sale_currency,
                    sale_price,
                    rental_currency,
                    rental_price,
                    temp_rental_currency,
                    temp_rental_price,
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
                `)
                .eq('availability', 1)
                .order('name');

            if (propertiesError) {
                console.error('❌ Error cargando propiedades:', propertiesError);
                throw propertiesError;
            }

            // Cargar todos los artículos (para relacionados)
            console.log('📋 Cargando artículos...');
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select('id, title, slug, excerpt, featured_image, category, status')
                .eq('status', 'published')
                .order('title');

            if (articlesError) {
                console.error('❌ Error cargando artículos:', articlesError);
                throw articlesError;
            }

            setAuthors(authorsData || []);
            setProperties(propertiesData || []);
            setAllArticles(articlesData || []);

            console.log('✅ Datos cargados:', {
                autores: authorsData?.length || 0,
                propiedades: propertiesData?.length || 0,
                articulos: articlesData?.length || 0
            });

        } catch (err) {
            console.error('💥 Error cargando datos de relaciones:', err);
        } finally {
            setLoadingRelations(false);
        }
    };

    const loadArticleTags = async (articleId) => {
        try {
            setLoadingTags(true);
            const { data, error } = await supabase
                .from('content_tags')
                .select('tag_id')
                .eq('content_id', articleId)
                .eq('content_type', 'article');

            if (error) throw error;
            setSelectedTags(data ? data.map(ct => ct.tag_id) : []);
        } catch (err) {
            console.error('Error al cargar tags del artículo:', err);
            setSelectedTags([]);
        } finally {
            setLoadingTags(false);
        }
    };

    // Effect para cargar datos iniciales del formulario
    useEffect(() => {
        console.log('🔄 Cargando datos del formulario...', { article: !!article });
        
        if (article) {
            setFormData({
                title: article.title || '',
                subtitle: article.subtitle || '',
                slug: article.slug || '',
                excerpt: article.excerpt || '',
                content: article.content || '',
                featured_image: article.featured_image || '',
                author_id: article.author_id || null,
                category: article.category || 'guias-compra',
                read_time: article.read_time || 5,
                views: article.views || '0',
                featured: article.featured || false,
                meta_title: article.meta_title || '',
                meta_description: article.meta_description || '',
                canonical_url: article.canonical_url || '',
                status: article.status || 'draft',
                language: article.language || 'es',
                category_slug: article.category_slug || '',
                tags: article.tags || [],
                table_of_contents: article.table_of_contents || null,
                related_properties: article.related_properties || [],
                area_advisors: article.area_advisors || null,
                schema_org: article.schema_org || null,
                structured_data_type: article.structured_data_type || '',
                reading_level: article.reading_level || '',
                related_articles: article.related_articles || []
            });

            if (article.id) {
                loadArticleTags(article.id);
            }

            // Configurar propiedades relacionadas desde JSON
            if (article.related_properties && Array.isArray(article.related_properties)) {
                setSelectedProperties(article.related_properties);
                setSelectedPropertyIds(article.related_properties.map(p => p.id));
            }

            // Configurar artículos relacionados desde JSON
            if (article.related_articles && Array.isArray(article.related_articles)) {
                setSelectedRelatedArticles(article.related_articles);
                setSelectedRelatedArticleIds(article.related_articles.map(a => a.id));
            }

            console.log('✅ Datos del formulario cargados con autor_id:', article.author_id);
        } else {
            // Limpiar todo si es un nuevo artículo
            setSelectedTags([]);
            setSelectedAuthor(null);
            setSelectedProperties([]);
            setSelectedRelatedArticles([]);
            setSelectedRelatedArticleIds([]);
            setSelectedPropertyIds([]);
        }
    }, [article]);

    // Effect para cargar autor cuando hay datos disponibles
    useEffect(() => {
        if (article?.author_id && authors.length > 0) {
            console.log('🔄 Buscando autor con ID:', article.author_id);
            const author = authors.find(a => a.id === article.author_id);
            if (author) {
                console.log('✅ Autor encontrado:', author.first_name, author.last_name);
                setSelectedAuthor(author);
            } else {
                console.log('⚠️ Autor no encontrado con ID:', article.author_id);
            }
        }
    }, [article?.author_id, authors]);

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
        // Limpiar error del campo si existe
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleTagToggle = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    // Función para subir imagen destacada
    const handleFeaturedImageUpload = async (file) => {
        if (!file) return;

        // Validar archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen debe ser menor a 5MB');
            return;
        }

        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `article_${Date.now()}.${fileExt}`;
            const filePath = `articles/${fileName}`;

            const { data, error } = await supabase.storage
                .from('featured-images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('featured-images')
                .getPublicUrl(filePath);

            handleInputChange('featured_image', publicUrl);
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            alert('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'El título es requerido';
        }
        if (!formData.slug?.trim()) {
            newErrors.slug = 'El slug es requerido';
        }
        if (!formData.excerpt?.trim()) {
            newErrors.excerpt = 'El extracto es requerido';
        }
        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        setErrors(newErrors);
        
        // Mostrar errores si los hay
        if (Object.keys(newErrors).length > 0) {
            alert('Por favor corrige los errores en el formulario:\n' + Object.values(newErrors).join('\n'));
            // Cambiar a la pestaña básica si hay errores ahí
            if (newErrors.title || newErrors.slug || newErrors.excerpt || newErrors.category) {
                setActiveTab('basic');
            }
        }
        
        return Object.keys(newErrors).length === 0;
    };

    const saveArticleTags = async (articleId, tagIds) => {
        try {
            await supabase
                .from('content_tags')
                .delete()
                .eq('content_id', articleId)
                .eq('content_type', 'article');

            if (tagIds.length > 0) {
                const contentTags = tagIds.map(tagId => ({
                    content_id: articleId,
                    content_type: 'article',
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

            if (!validateForm()) {
                return;
            }

            console.log('💾 Iniciando guardado del artículo...');
            console.log('📝 Datos del formulario:', formData);
            console.log('🔗 Relaciones seleccionadas:', {
                author: selectedAuthor?.id,
                properties: selectedProperties.length,
                relatedArticles: selectedRelatedArticles.length
            });

            const dataToSave = {
                title: formData.title,
                subtitle: formData.subtitle || null,
                slug: formData.slug,
                excerpt: formData.excerpt,
                content: formData.content || null,
                featured_image: formData.featured_image || null,
                author_id: selectedAuthor?.id || DEFAULT_ADMIN_USER_ID,
                category: formData.category,
                read_time: formData.read_time || 5,
                views: formData.views || '0',
                featured: formData.featured,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                canonical_url: formData.canonical_url || null,
                status: status,
                language: formData.language,
                category_slug: formData.category_slug || null,
                tags: formData.tags || [],
                table_of_contents: formData.table_of_contents || null,
                related_properties: selectedProperties || [],
                area_advisors: formData.area_advisors || null,
                schema_org: formData.schema_org || null,
                structured_data_type: formData.structured_data_type || null,
                reading_level: formData.reading_level || null,
                related_articles: selectedRelatedArticles || [],
                updated_at: new Date().toISOString()
            };

            if (status === 'published' && !article?.published_at) {
                dataToSave.published_at = new Date().toISOString();
            }

            console.log('💾 Datos preparados para guardar:', dataToSave);

            let result;
            let articleId;

            if (article) {
                console.log('🔄 Actualizando artículo existente:', article.id);
                result = await supabase
                    .from('articles')
                    .update(dataToSave)
                    .eq('id', article.id)
                    .select();
                
                articleId = article.id;
            } else {
                console.log('✨ Creando nuevo artículo');
                dataToSave.created_at = new Date().toISOString();
                result = await supabase
                    .from('articles')
                    .insert([dataToSave])
                    .select();
                
                articleId = result.data?.[0]?.id;
            }

            console.log('📤 Respuesta de Supabase:', result);

            if (result.error) {
                console.error('❌ Error de Supabase:', result.error);
                throw result.error;
            }

            if (articleId) {
                console.log('🏷️ Guardando tags del artículo...');
                await saveArticleTags(articleId, selectedTags);
                console.log('✅ Tags guardados exitosamente');

                // Guardar relaciones bidireccionales con propiedades si existen
                if (selectedProperties.length > 0) {
                    console.log('🏠 Guardando relaciones con propiedades...');
                    await savePropertiesRelations(articleId, selectedProperties);
                    console.log('✅ Relaciones con propiedades guardadas');
                }
            }

            console.log('🎉 Artículo guardado exitosamente!');
            alert('Artículo guardado exitosamente!');
            onBack();
        } catch (err) {
            console.error('💥 Error al guardar artículo:', err);
            alert('Error al guardar el artículo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Funciones para manejar modales de relaciones
    const handleSelectAuthor = (author) => {
        setSelectedAuthor(author);
        handleInputChange('author_id', author.id);
        setShowAuthorModal(false);
    };

    const handleSelectProperty = (property) => {
        if (!selectedProperties.find(p => p.id === property.id)) {
            const updatedProperties = [...selectedProperties, property];
            setSelectedProperties(updatedProperties);
            handleInputChange('related_properties', updatedProperties);
        }
        setShowPropertiesModal(false);
    };

    const handleToggleProperty = (propertyId) => {
        if (selectedPropertyIds.includes(propertyId)) {
            setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId));
        } else {
            setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
        }
    };

    const handleConfirmProperties = () => {
        const selectedProps = properties.filter(p => selectedPropertyIds.includes(p.id));
        setSelectedProperties(selectedProps);
        handleInputChange('related_properties', selectedProps);
        setShowPropertiesModal(false);
    };

    const handleToggleRelatedArticle = (articleId) => {
        if (selectedRelatedArticleIds.includes(articleId)) {
            setSelectedRelatedArticleIds(selectedRelatedArticleIds.filter(id => id !== articleId));
        } else {
            setSelectedRelatedArticleIds([...selectedRelatedArticleIds, articleId]);
        }
    };

    const handleConfirmRelatedArticles = () => {
        const articles = allArticles.filter(a => selectedRelatedArticleIds.includes(a.id));
        setSelectedRelatedArticles(articles);
        handleInputChange('related_articles', articles);
        setShowRelatedArticlesModal(false);
    };

    const handleRemoveAuthor = () => {
        setSelectedAuthor(null);
        handleInputChange('author_id', null);
    };

    const handleRemoveProperty = (index) => {
        const updatedProperties = selectedProperties.filter((_, i) => i !== index);
        setSelectedProperties(updatedProperties);
        handleInputChange('related_properties', updatedProperties);
    };

    const handleRemoveRelatedArticle = (index) => {
        const updatedArticles = selectedRelatedArticles.filter((_, i) => i !== index);
        setSelectedRelatedArticles(updatedArticles);
        setSelectedRelatedArticleIds(updatedArticles.map(a => a.id));
        handleInputChange('related_articles', updatedArticles);
    };

    // Función para crear relaciones bidireccionales con propiedades
    const savePropertiesRelations = async (articleId, properties) => {
        try {
            // Limpiar relaciones existentes
            await supabase
                .from('content_property_relations')
                .delete()
                .eq('content_id', articleId)
                .eq('content_type', 'article');

            if (properties.length > 0) {
                const relations = properties.map((property, index) => ({
                    content_id: articleId,
                    content_type: 'article',
                    property_id: property.id,
                    relation_type: 'mentioned',
                    weight: 1.0 - (index * 0.1), // Dar más peso a las primeras propiedades
                    auto_generated: false
                }));

                const { error } = await supabase
                    .from('content_property_relations')
                    .insert(relations);

                if (error) throw error;
            }

            console.log('✅ Relaciones con propiedades creadas');
        } catch (err) {
            console.error('❌ Error creando relaciones con propiedades:', err);
            throw err;
        }
    };

    // Pestañas de navegación
    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: <FileText className="w-4 h-4" /> },
        { id: 'relations', label: 'Relaciones', icon: <Users className="w-4 h-4" /> },
        { id: 'tags', label: 'Etiquetas', icon: <Tag className="w-4 h-4" /> },
        { id: 'seo', label: 'SEO', icon: <Globe className="w-4 h-4" /> },
        { id: 'advanced', label: 'Avanzado', icon: <Hash className="w-4 h-4" /> }
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

            {/* Navegación por pestañas */}
            <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
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
                            errors={errors}
                            handleFeaturedImageUpload={handleFeaturedImageUpload}
                            uploading={uploading}
                            selectedAuthor={selectedAuthor}
                            onRemoveAuthor={handleRemoveAuthor}
                        />
                    )}

                    {activeTab === 'relations' && (
                        <RelationsTab
                            selectedAuthor={selectedAuthor}
                            selectedProperties={selectedProperties}
                            selectedRelatedArticles={selectedRelatedArticles}
                            authors={authors}
                            properties={properties}
                            allArticles={allArticles}
                            onShowAuthorModal={() => setShowAuthorModal(true)}
                            onShowPropertiesModal={() => {
                                setSelectedPropertyIds(selectedProperties.map(p => p.id));
                                setShowPropertiesModal(true);
                            }}
                            onShowRelatedArticlesModal={() => {
                                setSelectedRelatedArticleIds(selectedRelatedArticles.map(a => a.id));
                                setShowRelatedArticlesModal(true);
                            }}
                            onRemoveAuthor={handleRemoveAuthor}
                            onRemoveProperty={handleRemoveProperty}
                            onRemoveRelatedArticle={handleRemoveRelatedArticle}
                            loading={loadingRelations}
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

                    {activeTab === 'seo' && (
                        <SEOTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                        />
                    )}

                    {activeTab === 'advanced' && (
                        <AdvancedTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            selectedAuthor={selectedAuthor}
                        />
                    )}
                </div>
            </div>

            {/* Modales de Selección */}
            <AuthorSelectionModal
                isOpen={showAuthorModal}
                onClose={() => setShowAuthorModal(false)}
                authors={authors}
                onSelect={handleSelectAuthor}
            />

            <PropertySelectionModal
                isOpen={showPropertiesModal}
                onClose={() => setShowPropertiesModal(false)}
                properties={properties}
                selectedIds={selectedPropertyIds}
                onToggleSelect={handleToggleProperty}
                onConfirm={handleConfirmProperties}
            />

            <RelatedArticlesModal
                isOpen={showRelatedArticlesModal}
                onClose={() => {
                    handleConfirmRelatedArticles();
                    setShowRelatedArticlesModal(false);
                }}
                articles={allArticles.filter(a => a.id !== article?.id)} // Excluir el artículo actual
                selectedIds={selectedRelatedArticleIds}
                onToggleSelect={handleToggleRelatedArticle}
            />
        </div>
    );
};

export default ArticleEditor;