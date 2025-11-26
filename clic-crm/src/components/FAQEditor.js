import React, { useState, useEffect } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Star, Quote,
    Image as ImageIcon, Save, X, ExternalLink, CheckCircle,
    MapPin, Home, Youtube, Video, Camera, DollarSign, Users,
    Bed, Bath, Car, Maximize, Building, MessageSquare, Award,
    UserCheck, Phone, Mail, Heart, ThumbsUp, Upload, FileText,
    BookOpen, PenTool, Eye as EyeIcon, Link, List, Hash, HelpCircle
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';

import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';


import { supabase } from '../services/api';

// ID del usuario administrador por defecto - verificar que sea un UUID válido
const DEFAULT_ADMIN_USER_ID = '6e9575f8-d8ef-4671-aa7f-e7193a2d3f21';

// Función para validar UUID
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Verificar el UUID por defecto al cargar
console.log('🔍 Validando DEFAULT_ADMIN_USER_ID:', {
    id: DEFAULT_ADMIN_USER_ID,
    isValid: isValidUUID(DEFAULT_ADMIN_USER_ID)
});

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

// Componente Modal de Selección de Propiedades (selección única)
const PropertySelectionModal = ({ isOpen, onClose, properties, selectedId, onSelectProperty, onConfirm }) => {
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
                        <h3 className="text-lg font-semibold">Seleccionar Propiedad</h3>
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
                    {/* Opción para no seleccionar ninguna propiedad */}
                    <div className="mb-4">
                        <div
                            className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedId === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => onSelectProperty(null)}
                        >
                            <input
                                type="radio"
                                checked={selectedId === null}
                                onChange={() => onSelectProperty(null)}
                                className="mt-2"
                            />
                            <div className="w-20 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <X className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">
                                    Sin propiedad específica
                                </p>
                                <p className="text-xs text-gray-500">
                                    Esta FAQ será general y no estará vinculada a ninguna propiedad
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map(property => (
                                <div
                                    key={property.id}
                                    className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedId === property.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => onSelectProperty(property.id)}
                                >
                                    <input
                                        type="radio"
                                        checked={selectedId === property.id}
                                        onChange={() => onSelectProperty(property.id)}
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
                        {selectedId ? '1 propiedad seleccionada' : 'Ninguna propiedad seleccionada'} | {filteredProperties.length} de {properties.length} mostradas
                    </span>
                    <Button onClick={onConfirm}>
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
    selectedProperty,
    onRemoveProperty
}) => {
    return (
        <div className="space-y-6">
            {/* Vista previa de la FAQ */}
            {(formData.question || formData.answer) && (
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Vista Previa</h3>
                            {selectedProperty && (
                                <Badge variant="info" size="sm">
                                    <Building className="w-3 h-3 mr-1" />
                                    Propiedad vinculada
                                </Badge>
                            )}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <HelpCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {formData.question || 'Pregunta de ejemplo'}
                                        </h3>
                                        <div className="text-gray-700 leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ 
                                                __html: formData.answer || 'Respuesta detallada aquí...' 
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Contexto */}
                                {(formData.context_location || formData.context_property_type || selectedProperty) && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                            {formData.context_location && (
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{formData.context_location}</span>
                                                </div>
                                            )}
                                            {formData.context_property_type && (
                                                <div className="flex items-center space-x-1">
                                                    <Home className="w-4 h-4" />
                                                    <span>{formData.context_property_type}</span>
                                                </div>
                                            )}
                                            {selectedProperty && (
                                                <div className="flex items-center space-x-1">
                                                    <Building className="w-4 h-4" />
                                                    <span>#{selectedProperty.code} - {selectedProperty.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Información básica */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Pregunta y Respuesta</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pregunta *
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                                value={formData.question}
                                onChange={(e) => handleInputChange('question', e.target.value)}
                                placeholder="¿Cuál es tu pregunta?"
                                maxLength={500}
                            />
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">
                                    Escribe la pregunta de forma clara y directa
                                </p>
                                <span className="text-xs text-gray-400">
                                    {formData.question?.length || 0}/500
                                </span>
                            </div>
                            {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Respuesta *
                            </label>
                            <WYSIWYGSEOEditor
                                value={formData.answer}
                                onChange={(value) => handleInputChange('answer', value)}
                                placeholder="Escribe una respuesta detallada y útil..."
                                cities={['Santo Domingo', 'Santiago', 'Puerto Plata', 'Piantini', 'Naco', 'Bella Vista']}
                                propertyTypes={['apartamentos', 'casas', 'villas', 'penthouses', 'oficinas', 'locales comerciales']}
                            />
                            {errors.answer && <p className="text-red-500 text-xs mt-1">{errors.answer}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug
                                </label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    placeholder="url-de-la-faq"
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
                                        { value: 'general', label: 'General' },
                                        { value: 'compra', label: 'Compra' },
                                        { value: 'venta', label: 'Venta' },
                                        { value: 'alquiler', label: 'Alquiler' },
                                        { value: 'legal', label: 'Legal' },
                                        { value: 'financiamiento', label: 'Financiamiento' },
                                        { value: 'proceso', label: 'Proceso' },
                                        { value: 'documentacion', label: 'Documentación' }
                                    ]}
                                    className={errors.category ? 'border-red-300' : ''}
                                />
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Orden de Visualización
                                </label>
                                <Input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="999"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Números menores aparecen primero
                                </p>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Contexto */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Contexto y Aplicabilidad</h3>
                    <p className="text-sm text-gray-600">
                        Define cuándo y dónde aplicar esta FAQ
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación/Ciudad
                                </label>
                                <Input.Select
                                    value={formData.context_location}
                                    onChange={(e) => handleInputChange('context_location', e.target.value)}
                                    options={[
                                        { value: '', label: 'Todas las ubicaciones' },
                                        { value: 'Santo Domingo', label: 'Santo Domingo' },
                                        { value: 'Santiago', label: 'Santiago' },
                                        { value: 'Puerto Plata', label: 'Puerto Plata' },
                                        { value: 'Punta Cana', label: 'Punta Cana' },
                                        { value: 'La Romana', label: 'La Romana' },
                                        { value: 'Samaná', label: 'Samaná' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Propiedad
                                </label>
                                <Input.Select
                                    value={formData.context_property_type}
                                    onChange={(e) => handleInputChange('context_property_type', e.target.value)}
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
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Características Aplicables
                            </label>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                    <Tag className="w-4 h-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Usa las etiquetas para definir características</p>
                                        <p className="text-blue-700 mt-1">
                                            Ve a la pestaña "Etiquetas" para agregar características específicas como piscina, terraza, amueblado, etc.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Configuración */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Configuración</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    FAQ destacada
                                </span>
                            </label>
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
    selectedProperty,
    properties,
    onShowPropertyModal,
    onRemoveProperty,
    loading
}) => {
    return (
        <Card>
            <Card.Header>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Propiedad Relacionada</h3>
                        <p className="text-sm text-gray-600">
                            Vincula esta FAQ con una propiedad específica (opcional)
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={onShowPropertyModal}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        {selectedProperty ? 'Cambiar Propiedad' : 'Seleccionar Propiedad'}
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                {selectedProperty ? (
                    <div className="bg-gray-50 rounded-lg border p-3">
                        <div className="flex items-start space-x-3">
                            {selectedProperty.main_image_url ? (
                                <img
                                    src={selectedProperty.main_image_url}
                                    alt={selectedProperty.name}
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
                                                #{selectedProperty.code}
                                            </span>
                                            {getMainPrice(selectedProperty) && (
                                                <span className="text-xs font-medium text-green-600">
                                                    {getMainPrice(selectedProperty)}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {selectedProperty.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {[
                                                selectedProperty.cities?.name,
                                                selectedProperty.provinces?.name
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onRemoveProperty}
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
                        <Building className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Sin propiedad asignada</h4>
                        <p className="text-sm mb-4">
                            Opcionalmente puedes vincular esta FAQ con una propiedad específica
                        </p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

// Componente para la pestaña de SEO
const SEOTab = ({ formData, handleInputChange }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">SEO y Metadatos</h3>
                <p className="text-sm text-gray-600">
                    Optimiza la FAQ para motores de búsqueda
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
                            placeholder="https://ejemplo.com/faqs/pregunta"
                        />
                    </div>

                    {/* Preview de SEO */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Preview de SEO</h4>
                        <div className="bg-white p-3 rounded border">
                            <h5 className="text-blue-600 text-lg leading-tight">
                                {formData.meta_title || formData.question || 'Pregunta FAQ'}
                            </h5>
                            <p className="text-green-700 text-sm">
                                ejemplo.com/faqs/{formData.slug || 'slug-de-la-faq'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {formData.meta_description || 
                                 (formData.answer && formData.answer.replace(/<[^>]*>/g, '').substring(0, 160)) || 
                                 'Descripción de la FAQ aparecerá aquí...'}
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
                    Selecciona las etiquetas que mejor describan esta FAQ
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
const AdvancedTab = ({ formData, handleInputChange, selectedTags, availableTags }) => {
    // Función para generar Schema.org automáticamente para FAQ
    const generateFAQSchema = () => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
                "@type": "Question",
                "name": formData.question || "Pregunta",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": formData.answer ? formData.answer.replace(/<[^>]*>/g, '') : "Respuesta"
                }
            }],
            "inLanguage": formData.language || "es",
            "dateCreated": new Date().toISOString(),
            "dateModified": new Date().toISOString()
        };

        // Agregar contexto si existe
        if (formData.context_location || formData.context_property_type) {
            schema.about = [];
            
            if (formData.context_location) {
                schema.about.push({
                    "@type": "Place",
                    "name": formData.context_location
                });
            }
            
            if (formData.context_property_type) {
                schema.about.push({
                    "@type": "Product",
                    "name": formData.context_property_type
                });
            }
        }

        // Agregar características desde tags si existen
        if (selectedTags && selectedTags.length > 0) {
            const tagNames = selectedTags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId);
                return tag ? (tag.display_name || tag.name) : '';
            }).filter(Boolean);
            
            if (tagNames.length > 0) {
                schema.keywords = tagNames.join(', ');
            }
        }

        handleInputChange('schema_org', schema);
    };

    const clearStructuredData = () => {
        handleInputChange('schema_org', null);
    };

    return (
        <div className="space-y-6">
            {/* Generadores automáticos */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Generador Automático de Schema.org</h3>
                    <p className="text-sm text-gray-600">
                        Genera automáticamente datos estructurados FAQPage para SEO
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">Schema.org FAQPage</h4>
                                <p className="text-sm text-gray-600">
                                    Genera datos estructurados específicos para FAQs que Google entiende
                                </p>
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="primary"
                                    onClick={generateFAQSchema}
                                    icon={<Hash className="w-4 h-4" />}
                                    disabled={!formData.question || !formData.answer}
                                >
                                    Generar Schema
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={clearStructuredData}
                                    icon={<X className="w-4 h-4" />}
                                    size="sm"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                        
                        {!formData.question || !formData.answer ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Completa la pregunta y respuesta para generar el Schema.org
                                </p>
                            </div>
                        ) : null}
                    </div>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Datos Estructurados (Schema.org)</h3>
                    <p className="text-sm text-gray-600">
                        Metadatos para que Google muestre esta FAQ en resultados de búsqueda
                    </p>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        {formData.schema_org && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-green-900 mb-2">Vista Previa de Schema</h4>
                                <div className="text-xs text-green-700 space-y-1">
                                    <div><strong>Tipo:</strong> {formData.schema_org['@type']}</div>
                                    <div><strong>Pregunta:</strong> {formData.schema_org.mainEntity?.[0]?.name}</div>
                                    <div><strong>Idioma:</strong> {formData.schema_org.inLanguage}</div>
                                    {formData.schema_org.about && (
                                        <div><strong>Contexto:</strong> {formData.schema_org.about.map(item => item.name).join(', ')}</div>
                                    )}
                                    {formData.schema_org.keywords && (
                                        <div><strong>Palabras clave:</strong> {formData.schema_org.keywords}</div>
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
                                onChange={(e) => {
                                    try {
                                        const schema = JSON.parse(e.target.value);
                                        handleInputChange('schema_org', schema);
                                    } catch (err) {
                                        handleInputChange('schema_org', null);
                                    }
                                }}
                                placeholder='{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "Tu pregunta aquí",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "Tu respuesta aquí"\n    }\n  }]\n}'
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Datos estructurados FAQPage para Google Rich Results
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente Editor de FAQs
const FAQEditor = ({ faq, onBack, user, permissions, availableTags, tagCategories }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'general',
        context_location: '',
        context_property_type: '',
        context_features: [],
        sort_order: 0,
        featured: false,
        views: 0,
        property_id: null,
        created_by_id: user?.id || DEFAULT_ADMIN_USER_ID,
        status: 'published',
        slug: '',
        meta_title: '',
        meta_description: '',
        canonical_url: '',
        language: 'es',
        schema_org: null,
        ...faq
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingTags, setLoadingTags] = useState(false);

    // Estados para relaciones - cambio de array a objeto único
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loadingRelations, setLoadingRelations] = useState(true);

    // Estados para modales
    const [showPropertyModal, setShowPropertyModal] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const initializeData = async () => {
            await loadRelationData();
        };
        initializeData();
    }, []);

    const loadRelationData = async () => {
        try {
            setLoadingRelations(true);
            console.log('🔄 Cargando propiedades...');
            
            // Cargar propiedades
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

            // Verificar que los IDs sean strings UUID válidos
            const processedProperties = (propertiesData || []).map(property => ({
                ...property,
                id: String(property.id) // Asegurar que el ID sea string
            }));

            console.log('🔍 Verificando formato de IDs de propiedades:', {
                firstPropertyId: processedProperties[0]?.id,
                firstPropertyIdType: typeof processedProperties[0]?.id,
                totalProperties: processedProperties.length
            });

            setProperties(processedProperties);

            console.log('✅ Propiedades cargadas:', processedProperties?.length || 0);

        } catch (err) {
            console.error('💥 Error cargando datos de relaciones:', err);
        } finally {
            setLoadingRelations(false);
        }
    };

    const loadFaqTags = async (faqId) => {
        try {
            setLoadingTags(true);
            const { data, error } = await supabase
                .from('content_tags')
                .select('tag_id')
                .eq('content_id', faqId)
                .eq('content_type', 'faq');

            if (error) throw error;
            setSelectedTags(data ? data.map(ct => ct.tag_id) : []);
        } catch (err) {
            console.error('Error al cargar tags de la FAQ:', err);
            setSelectedTags([]);
        } finally {
            setLoadingTags(false);
        }
    };

    // Effect para cargar datos iniciales del formulario
    useEffect(() => {
        console.log('🔄 Cargando datos del formulario...', { faq: !!faq });
        
        if (faq) {
            // Validar que el created_by_id sea un UUID válido
            let validUserId = faq.created_by_id;
            if (!validUserId || !isValidUUID(validUserId)) {
                console.log('⚠️ created_by_id inválido en FAQ, usando usuario actual o por defecto');
                validUserId = (user?.id && isValidUUID(String(user.id))) ? String(user.id) : DEFAULT_ADMIN_USER_ID;
            }
            
            setFormData({
                question: faq.question || '',
                answer: faq.answer || '',
                category: faq.category || 'general',
                context_location: faq.context_location || '',
                context_property_type: faq.context_property_type || '',
                context_features: faq.context_features || [],
                sort_order: faq.sort_order || 0,
                featured: faq.featured || false,
                views: faq.views || 0,
                property_id: faq.property_id || null,
                created_by_id: validUserId,
                status: faq.status || 'published',
                slug: faq.slug || '',
                meta_title: faq.meta_title || '',
                meta_description: faq.meta_description || '',
                canonical_url: faq.canonical_url || '',
                language: faq.language || 'es',
                schema_org: faq.schema_org || null
            });

            if (faq.id) {
                loadFaqTags(faq.id);
            }

            console.log('✅ Datos del formulario cargados con property_id:', faq.property_id, 'y created_by_id:', validUserId);
        } else {
            // Limpiar todo si es una nueva FAQ
            setSelectedTags([]);
            setSelectedProperty(null);
            setSelectedPropertyId(null);
            
            // Asegurar user ID válido para nueva FAQ
            const validUserId = (user?.id && isValidUUID(String(user.id))) ? String(user.id) : DEFAULT_ADMIN_USER_ID;
            setFormData(prev => ({
                ...prev,
                created_by_id: validUserId
            }));
            
            console.log('✅ Nueva FAQ inicializada con created_by_id:', validUserId);
        }
    }, [faq, user]);

    // Effect para cargar propiedad cuando hay datos disponibles
    useEffect(() => {
        if (faq?.property_id && properties.length > 0) {
            console.log('🔄 Buscando propiedad con ID:', faq.property_id, 'Tipo:', typeof faq.property_id);
            const property = properties.find(p => String(p.id) === String(faq.property_id));
            if (property) {
                console.log('✅ Propiedad encontrada:', property.name, 'ID:', property.id);
                setSelectedProperty(property);
                setSelectedPropertyId(String(property.id));
            } else {
                console.log('⚠️ Propiedad no encontrada con ID:', faq.property_id);
                console.log('🔍 IDs disponibles:', properties.map(p => ({ id: p.id, type: typeof p.id, name: p.name })));
            }
        }
    }, [faq?.property_id, properties]);

    // Auto-generar slug de la pregunta
    useEffect(() => {
        if (formData.question && !faq) {
            const slug = formData.question
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.question, faq]);

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.question?.trim()) {
            newErrors.question = 'La pregunta es requerida';
        }
        if (!formData.answer?.trim()) {
            newErrors.answer = 'La respuesta es requerida';
        }
        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        setErrors(newErrors);
        
        // Mostrar errores si los hay
        if (Object.keys(newErrors).length > 0) {
            alert('Por favor corrige los errores en el formulario:\n' + Object.values(newErrors).join('\n'));
            // Cambiar a la pestaña básica si hay errores ahí
            if (newErrors.question || newErrors.answer || newErrors.category) {
                setActiveTab('basic');
            }
        }
        
        return Object.keys(newErrors).length === 0;
    };

    const saveFaqTags = async (faqId, tagIds) => {
        try {
            await supabase
                .from('content_tags')
                .delete()
                .eq('content_id', faqId)
                .eq('content_type', 'faq');

            if (tagIds.length > 0) {
                const contentTags = tagIds.map(tagId => ({
                    content_id: faqId,
                    content_type: 'faq',
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

            console.log('💾 Iniciando guardado de la FAQ...');
            console.log('👤 Usuario actual:', user);
            console.log('🆔 User ID:', user?.id, 'Tipo:', typeof user?.id);
            console.log('📝 Datos del formulario:', formData);
            console.log('🔗 Propiedad seleccionada:', selectedProperty);

            // Validar que los IDs sean UUIDs válidos
            const propertyId = selectedProperty?.id ? String(selectedProperty.id) : null;
            
            // Manejar user ID con fallback más seguro
            let userId;
            if (user?.id && String(user.id).trim()) {
                userId = String(user.id);
            } else {
                console.log('⚠️ User ID no disponible, usando ID por defecto');
                userId = DEFAULT_ADMIN_USER_ID;
            }

            console.log('🔍 Validando IDs:', {
                propertyId,
                propertyIdType: typeof propertyId,
                userId,
                userIdType: typeof userId,
                selectedPropertyId: selectedProperty?.id,
                selectedPropertyIdType: typeof selectedProperty?.id,
                defaultAdminId: DEFAULT_ADMIN_USER_ID
            });

            // Validar formato UUID usando la función helper
            if (propertyId && !isValidUUID(propertyId)) {
                console.error('❌ Property ID no es un UUID válido:', propertyId);
                alert('Error: ID de propiedad inválido. Por favor selecciona otra propiedad.');
                return;
            }

            if (!isValidUUID(userId)) {
                console.error('❌ User ID no es un UUID válido:', userId);
                console.error('🔍 Detalles del usuario:', {
                    user,
                    userId,
                    defaultId: DEFAULT_ADMIN_USER_ID,
                    userIdFromProp: user?.id
                });
                
                // Intentar usar el ID por defecto si el del usuario falla
                if (isValidUUID(DEFAULT_ADMIN_USER_ID)) {
                    console.log('✅ Usando ID de administrador por defecto');
                    userId = DEFAULT_ADMIN_USER_ID;
                } else {
                    alert('Error: No se puede determinar un usuario válido para guardar la FAQ. Contacta al administrador del sistema.');
                    return;
                }
            }

            const dataToSave = {
                question: formData.question,
                answer: formData.answer,
                category: formData.category,
                context_location: formData.context_location || null,
                context_property_type: formData.context_property_type || null,
                context_features: formData.context_features || [],
                sort_order: formData.sort_order || 0,
                featured: formData.featured,
                views: formData.views || 0,
                property_id: propertyId,
                created_by_id: userId,
                status: status,
                slug: formData.slug || null,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                canonical_url: formData.canonical_url || null,
                language: formData.language,
                schema_org: formData.schema_org || null,
                updated_at: new Date().toISOString()
            };

            console.log('💾 Datos preparados para guardar:', {
                ...dataToSave,
                debug_user_id: userId,
                debug_property_id: propertyId
            });

            let result;
            let faqId;

            if (faq) {
                console.log('🔄 Actualizando FAQ existente:', faq.id);
                result = await supabase
                    .from('faqs')
                    .update(dataToSave)
                    .eq('id', faq.id)
                    .select();
                
                faqId = faq.id;
            } else {
                console.log('✨ Creando nueva FAQ');
                dataToSave.created_at = new Date().toISOString();
                result = await supabase
                    .from('faqs')
                    .insert([dataToSave])
                    .select();
                
                faqId = result.data?.[0]?.id;
            }

            console.log('📤 Respuesta de Supabase:', result);

            if (result.error) {
                console.error('❌ Error de Supabase:', result.error);
                throw result.error;
            }

            if (faqId) {
                console.log('🏷️ Guardando tags de la FAQ...');
                await saveFaqTags(faqId, selectedTags);
                console.log('✅ Tags guardados exitosamente');
            }

            console.log('🎉 FAQ guardada exitosamente!');
            alert('FAQ guardada exitosamente!');
            onBack();
        } catch (err) {
            console.error('💥 Error al guardar FAQ:', err);
            alert('Error al guardar la FAQ: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Funciones para manejar modales de relaciones - modificadas para selección única
    const handleSelectProperty = (propertyId) => {
        console.log('🔄 Seleccionando propiedad:', { propertyId, type: typeof propertyId });
        setSelectedPropertyId(propertyId);
    };

    const handleConfirmProperty = () => {
        console.log('✅ Confirmando selección de propiedad:', { 
            selectedPropertyId, 
            type: typeof selectedPropertyId 
        });
        
        if (selectedPropertyId) {
            const selectedProp = properties.find(p => String(p.id) === String(selectedPropertyId));
            if (selectedProp) {
                console.log('✅ Propiedad encontrada para confirmar:', selectedProp.name);
                setSelectedProperty(selectedProp);
            } else {
                console.error('❌ No se encontró la propiedad con ID:', selectedPropertyId);
                alert('Error: No se pudo encontrar la propiedad seleccionada');
            }
        } else {
            console.log('🚫 Deseleccionando propiedad');
            setSelectedProperty(null);
        }
        setShowPropertyModal(false);
    };

    const handleRemoveProperty = () => {
        console.log('🗑️ Removiendo propiedad seleccionada');
        setSelectedProperty(null);
        setSelectedPropertyId(null);
    };

    // Pestañas de navegación
    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: <FileText className="w-4 h-4" /> },
        { id: 'relations', label: 'Relaciones', icon: <Building className="w-4 h-4" /> },
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
                                {faq ? 'Editar FAQ' : 'Nueva FAQ'}
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
                            selectedProperty={selectedProperty}
                            onRemoveProperty={handleRemoveProperty}
                        />
                    )}

                    {activeTab === 'relations' && (
                        <RelationsTab
                            selectedProperty={selectedProperty}
                            properties={properties}
                            onShowPropertyModal={() => {
                                setSelectedPropertyId(selectedProperty ? selectedProperty.id : null);
                                setShowPropertyModal(true);
                            }}
                            onRemoveProperty={handleRemoveProperty}
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
                            selectedTags={selectedTags}
                            availableTags={availableTags}
                        />
                    )}
                </div>
            </div>

            {/* Modal de Selección de Propiedad */}
            <PropertySelectionModal
                isOpen={showPropertyModal}
                onClose={() => setShowPropertyModal(false)}
                properties={properties}
                selectedId={selectedPropertyId}
                onSelectProperty={handleSelectProperty}
                onConfirm={handleConfirmProperty}
            />
        </div>
    );
};

export default FAQEditor;