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

import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';


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

const getRatingStars = (rating) => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                />
            ))}
            <span className="text-sm text-gray-600 ml-1">({rating})</span>
        </div>
    );
};

// Componente Modal de Selección de Agente
const AgentSelectionModal = ({ isOpen, onClose, agents, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAgents, setFilteredAgents] = useState(agents);

    useEffect(() => {
        const filtered = agents.filter(agent =>
            `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.position && agent.position.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredAgents(filtered);
    }, [searchTerm, agents]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Agente</h3>
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
                        {filteredAgents.length > 0 ? (
                            filteredAgents.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => onSelect(agent)}
                                    className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    {agent.profile_photo_url ? (
                                        <img
                                            src={agent.profile_photo_url}
                                            alt={`${agent.first_name} ${agent.last_name}`}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {agent.first_name} {agent.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{agent.email}</p>
                                        {agent.position && (
                                            <p className="text-xs text-gray-500">{agent.position}</p>
                                        )}
                                        {agent.phone && (
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {agent.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron agentes</p>
                                <p className="text-sm">Intenta con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {filteredAgents.length} de {agents.length} agentes mostrados
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Contacto
const ContactSelectionModal = ({ isOpen, onClose, contacts, onSelect, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredContacts, setFilteredContacts] = useState(contacts);

    useEffect(() => {
        const filtered = contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (contact.phone && contact.phone.includes(searchTerm)) ||
            (contact.document_number && contact.document_number.includes(searchTerm))
        );
        setFilteredContacts(filtered);
    }, [searchTerm, contacts]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Contacto</h3>
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
                            placeholder="Buscar por nombre, email, teléfono o documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                            <p className="text-gray-600">Cargando contactos...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => onSelect(contact)}
                                        className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{contact.name}</p>
                                            {contact.email && (
                                                <p className="text-sm text-gray-600">{contact.email}</p>
                                            )}
                                            <div className="flex items-center space-x-3 mt-1">
                                                {contact.phone && (
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {contact.phone}
                                                    </span>
                                                )}
                                                {contact.document_number && (
                                                    <span className="text-xs text-gray-500">
                                                        Doc: {contact.document_number}
                                                    </span>
                                                )}
                                            </div>
                                            {contact.source && (
                                                <Badge variant="secondary" size="sm" className="mt-1">
                                                    {contact.source}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : contacts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p>No hay contactos disponibles</p>
                                    <p className="text-sm">
                                        {loading ? 'Cargando...' : 'Verifica los permisos de la tabla contacts'}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p>No se encontraron contactos</p>
                                    <p className="text-sm">Intenta con otro término de búsqueda</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {loading ? 'Cargando...' : `${filteredContacts.length} de ${contacts.length} contactos mostrados`}
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Propiedad
const PropertySelectionModal = ({ isOpen, onClose, properties, onSelect }) => {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map(property => (
                                <div
                                    key={property.id}
                                    onClick={() => onSelect(property)}
                                    className="flex items-start space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
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
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {filteredProperties.length} de {properties.length} propiedades mostradas
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Video
const VideoSelectionModal = ({ isOpen, onClose, videos, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [filteredVideos, setFilteredVideos] = useState(videos);

    const categories = [...new Set(videos.map(v => v.category).filter(Boolean))];

    useEffect(() => {
        let filtered = videos.filter(video =>
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (video.subtitle && video.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (video.video_slug && video.video_slug.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(v => v.category === categoryFilter);
        }

        setFilteredVideos(filtered);
    }, [searchTerm, categoryFilter, videos]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Seleccionar Video</h3>
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
                                placeholder="Buscar por título, subtítulo o slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Input.Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'Todas las categorías' },
                                ...categories.map(cat => ({
                                    value: cat,
                                    label: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                }))
                            ]}
                            className="w-48"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredVideos.length > 0 ? (
                            filteredVideos.map(video => (
                                <div
                                    key={video.id}
                                    onClick={() => onSelect(video)}
                                    className="flex items-start space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    {video.thumbnail ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-20 h-14 rounded object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                            <Play className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {video.title}
                                        </p>
                                        {video.subtitle && (
                                            <p className="text-xs text-gray-600 truncate mt-1">
                                                {video.subtitle}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-2">
                                            {video.category && (
                                                <Badge variant="secondary" size="sm">
                                                    {video.category.replace('-', ' ')}
                                                </Badge>
                                            )}
                                            {video.duration && (
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {video.duration}
                                                </span>
                                            )}
                                        </div>
                                        {video.video_slug && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                /{video.video_slug}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                <Play className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron videos</p>
                                <p className="text-sm">Intenta con otro término de búsqueda o categoría</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {filteredVideos.length} de {videos.length} videos mostrados
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
    handleAvatarUpload, 
    uploading,
    cities,
    sectors,
    selectedCity,
    selectedSector,
    selectedContact,
    selectedProperty,
    onCityChange,
    onSectorChange,
    onRemoveContact
}) => {
    return (
        <div className="space-y-6">
            {/* Vista previa del testimonio */}
            {formData.excerpt && (
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Vista Previa</h3>
                            {selectedContact && (
                                <Badge variant="info" size="sm">
                                    <Users className="w-3 h-3 mr-1" />
                                    Contacto vinculado
                                </Badge>
                            )}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                                {formData.client_avatar ? (
                                    <img
                                        src={formData.client_avatar}
                                        alt={selectedContact?.name || formData.client_name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        {getRatingStars(formData.rating)}
                                        {formData.client_verified && (
                                            <Badge variant="success" size="sm">
                                                <UserCheck className="w-3 h-3 mr-1" />
                                                Verificado
                                            </Badge>
                                        )}
                                    </div>
                                    <blockquote className="text-gray-800 italic mb-3">
                                        <div dangerouslySetInnerHTML={{ __html: formData.excerpt }} />
                                    </blockquote>
                                    <div className="text-sm text-gray-600">
                                        <strong>{selectedContact?.name || formData.client_name}</strong>
                                        {formData.client_profession && `, ${formData.client_profession}`}
                                        
                                        {/* Mostrar ubicación con prioridad: Contacto > Manual > Ciudad/Sector */}
                                        {(selectedContact?.address || formData.client_location || selectedCity || selectedSector) && (
                                            <span className="flex items-center mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {selectedContact?.address || 
                                                 formData.client_location || 
                                                 [selectedSector?.name, selectedCity?.name].filter(Boolean).join(', ')}
                                                {selectedContact?.address && (
                                                    <span className="ml-1 text-xs text-blue-600">📋</span>
                                                )}
                                                {selectedProperty && !selectedContact?.address && (
                                                    <span className="ml-1 text-xs text-green-600">🏠</span>
                                                )}
                                            </span>
                                        )}
                                        
                                        {/* Mostrar email del contacto si está disponible */}
                                        {selectedContact?.email && (
                                            <span className="flex items-center mt-1 text-xs text-gray-500">
                                                <Mail className="w-3 h-3 mr-1" />
                                                {selectedContact.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                                placeholder="Título del testimonio"
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
                                    placeholder="url-del-testimonio"
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
                                        { value: 'compradores', label: 'Compradores' },
                                        { value: 'vendedores', label: 'Vendedores' },
                                        { value: 'inversores', label: 'Inversores' },
                                        { value: 'inquilinos', label: 'Inquilinos' }
                                    ]}
                                    className={errors.category ? 'border-red-300' : ''}
                                />
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rating *
                                </label>
                                <Input.Select
                                    value={formData.rating}
                                    onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                                    options={[
                                        { value: 5, label: '⭐⭐⭐⭐⭐ (5 estrellas)' },
                                        { value: 4, label: '⭐⭐⭐⭐ (4 estrellas)' },
                                        { value: 3, label: '⭐⭐⭐ (3 estrellas)' },
                                        { value: 2, label: '⭐⭐ (2 estrellas)' },
                                        { value: 1, label: '⭐ (1 estrella)' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resumen/Extracto *
                            </label>
                            <WYSIWYGSEOEditor
                                value={formData.excerpt}
                                onChange={(value) => handleInputChange('excerpt', value)}
                                placeholder="Resumen corto del testimonio para mostrar en listas..."
                                cities={[]}
                                propertyTypes={[]}
                            />
                            {errors.excerpt && <p className="text-red-500 text-xs mt-1">{errors.excerpt}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Testimonio Completo
                            </label>
                            <WYSIWYGSEOEditor
                                value={formData.full_testimonial}
                                onChange={(value) => handleInputChange('full_testimonial', value)}
                                placeholder="Testimonio completo del cliente..."
                                cities={['Santo Domingo', 'Santiago', 'Puerto Plata', 'Piantini', 'Naco', 'Bella Vista']}
                                propertyTypes={['apartamentos', 'casas', 'villas', 'penthouses', 'oficinas', 'locales comerciales']}
                            />
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Información del cliente */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Información del Cliente</h3>
                        {selectedContact && (
                            <div className="flex items-center space-x-2">
                                <Badge variant="success" size="sm">
                                    <Users className="w-3 h-3 mr-1" />
                                    Datos desde contacto: {selectedContact.name}
                                </Badge>
                                <button
                                    onClick={onRemoveContact}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                    title="Desvincular contacto"
                                >
                                    Desvincular
                                </button>
                            </div>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        {selectedContact && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-medium text-blue-900">Contacto vinculado del CRM</p>
                                        <p className="text-blue-700">
                                            Los datos del cliente se tomarán automáticamente desde el contacto: <strong>{selectedContact.name}</strong>
                                        </p>
                                        {selectedContact.email && (
                                            <p className="text-blue-600 mt-1">📧 {selectedContact.email}</p>
                                        )}
                                        {selectedContact.phone && (
                                            <p className="text-blue-600">📞 {selectedContact.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Cliente *
                                </label>
                                <Input
                                    value={selectedContact?.name || formData.client_name}
                                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                                    placeholder="Nombre completo del cliente"
                                    className={errors.client_name ? 'border-red-300' : ''}
                                    disabled={!!selectedContact}
                                />
                                {selectedContact && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        📋 Tomado del contacto vinculado
                                    </p>
                                )}
                                {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Profesión
                                </label>
                                <Input
                                    value={formData.client_profession}
                                    onChange={(e) => handleInputChange('client_profession', e.target.value)}
                                    placeholder="Profesión u ocupación"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ciudad de la Propiedad
                                </label>
                                <Input.Select
                                    value={selectedCity?.id || ''}
                                    onChange={(e) => onCityChange(e.target.value)}
                                    options={[
                                        { value: '', label: 'Seleccionar ciudad' },
                                        ...cities.map(city => ({
                                            value: city.id,
                                            label: city.name
                                        }))
                                    ]}
                                    disabled={!!selectedProperty}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedProperty 
                                        ? '🏠 Sincronizado desde la propiedad relacionada' 
                                        : 'Se sincronizará automáticamente al seleccionar una propiedad'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sector de la Propiedad
                                </label>
                                <Input.Select
                                    value={selectedSector?.id || ''}
                                    onChange={(e) => onSectorChange(e.target.value)}
                                    options={[
                                        { value: '', label: 'Seleccionar sector' },
                                        ...sectors.map(sector => ({
                                            value: sector.id,
                                            label: sector.name
                                        }))
                                    ]}
                                    disabled={!selectedCity || !!selectedProperty}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedProperty 
                                        ? '🏠 Sincronizado desde la propiedad relacionada' 
                                        : !selectedCity 
                                        ? 'Selecciona una ciudad primero' 
                                        : 'Se sincronizará automáticamente al seleccionar una propiedad'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dirección del Cliente
                            </label>
                            <Input
                                value={selectedContact?.address || formData.client_location}
                                onChange={(e) => handleInputChange('client_location', e.target.value)}
                                placeholder="Ej: Calle Principal #123, Los Cacicazgos"
                                disabled={!!selectedContact}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedContact 
                                    ? '👤 Sincronizado desde el contacto relacionado' 
                                    : 'Dirección donde vive el cliente (diferente a la ubicación de la propiedad)'}
                            </p>
                        </div>

                        {/* Mostrar tipo de propiedad si hay una seleccionada */}
                        {selectedProperty && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Propiedad
                                </label>
                                <Input
                                    value={selectedProperty.property_categories?.name || 'No especificado'}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    🏠 Sincronizado desde la propiedad relacionada
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Avatar del Cliente
                            </label>
                            <div className="flex items-center space-x-4">
                                {formData.client_avatar ? (
                                    <img
                                        src={formData.client_avatar}
                                        alt="Avatar del cliente"
                                        className="w-16 h-16 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleAvatarUpload(e.target.files[0])}
                                        className="hidden"
                                        id="avatar-upload"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className={`cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                                            uploading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Subiendo...' : 'Subir Avatar'}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        JPG, PNG hasta 5MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.client_verified}
                                        onChange={(e) => handleInputChange('client_verified', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Cliente verificado
                                    </span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.client_is_celebrity}
                                        onChange={(e) => handleInputChange('client_is_celebrity', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Es celebridad
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Configuración del testimonio */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Configuración del Testimonio</h3>
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
                                    Tiempo de Lectura
                                </label>
                                <Input
                                    value={formData.read_time}
                                    onChange={(e) => handleInputChange('read_time', e.target.value)}
                                    placeholder="3 min"
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.featured}
                                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Testimonio destacado
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video Testimonio (URL)
                            </label>
                            <Input
                                value={formData.video_testimonial}
                                onChange={(e) => handleInputChange('video_testimonial', e.target.value)}
                                placeholder="URL del video testimonio"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ubicación de Transacción
                            </label>
                            <Input
                                value={formData.transaction_location}
                                onChange={(e) => handleInputChange('transaction_location', e.target.value)}
                                placeholder="Donde se realizó la transacción"
                            />
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
    selectedAgent, 
    selectedContact, 
    selectedProperty,
    selectedVideo,
    agents, 
    contacts, 
    properties,
    videos,
    onShowAgentModal,
    onShowContactModal,
    onShowPropertyModal,
    onShowVideoModal,
    onRemoveAgent,
    onRemoveContact,
    onRemoveProperty,
    onRemoveVideo,
    loading
}) => {
    return (
        <div className="space-y-6">
            {/* Agente relacionado */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Agente Relacionado</h3>
                            <p className="text-sm text-gray-600">
                                El agente inmobiliario que manejó esta transacción
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowAgentModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {selectedAgent ? 'Cambiar Agente' : 'Agregar Agente'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedAgent ? (
                        <div className="bg-gray-50 rounded-lg border p-4">
                            <div className="flex items-start space-x-4">
                                {selectedAgent.profile_photo_url ? (
                                    <img
                                        src={selectedAgent.profile_photo_url}
                                        alt={`${selectedAgent.first_name} ${selectedAgent.last_name}`}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">
                                                {selectedAgent.first_name} {selectedAgent.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">{selectedAgent.email}</p>
                                            {selectedAgent.position && (
                                                <p className="text-sm text-gray-500">{selectedAgent.position}</p>
                                            )}
                                            {selectedAgent.phone && (
                                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {selectedAgent.phone}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={onRemoveAgent}
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
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin agente asignado</h4>
                            <p className="text-sm mb-4">
                                Selecciona el agente que manejó esta transacción
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Contacto relacionado */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Contacto Relacionado</h3>
                            <p className="text-sm text-gray-600">
                                El contacto en el CRM que corresponde a este cliente
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowContactModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {selectedContact ? 'Cambiar Contacto' : 'Agregar Contacto'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedContact ? (
                        <div className="bg-gray-50 rounded-lg border p-4">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-900">
                                                {selectedContact.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">{selectedContact.email}</p>
                                            {selectedContact.phone && (
                                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {selectedContact.phone}
                                                </p>
                                            )}
                                            {selectedContact.address && (
                                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {selectedContact.address}
                                                </p>
                                            )}
                                            {selectedContact.source && (
                                                <Badge variant="secondary" size="sm" className="mt-2">
                                                    {selectedContact.source}
                                                </Badge>
                                            )}
                                        </div>
                                        <button
                                            onClick={onRemoveContact}
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
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin contacto asignado</h4>
                            <p className="text-sm mb-4">
                                Selecciona el contacto del CRM que corresponde a este cliente
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Propiedad relacionada */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Propiedad Relacionada</h3>
                            <p className="text-sm text-gray-600">
                                La propiedad sobre la cual es este testimonio
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowPropertyModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {selectedProperty ? 'Cambiar Propiedad' : 'Agregar Propiedad'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedProperty ? (
                        <div className="bg-gray-50 rounded-lg border p-4">
                            <div className="flex items-start space-x-4">
                                {selectedProperty.main_image_url ? (
                                    <img
                                        src={selectedProperty.main_image_url}
                                        alt={selectedProperty.name}
                                        className="w-20 h-15 rounded object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                        <Home className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
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
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {selectedProperty.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {[
                                                    selectedProperty.cities?.name,
                                                    selectedProperty.provinces?.name
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Badge variant="secondary" size="sm">
                                                    {selectedProperty.property_categories?.name || 'Sin categoría'}
                                                </Badge>
                                            </div>
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
                            <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin propiedad asignada</h4>
                            <p className="text-sm mb-4">
                                Selecciona la propiedad sobre la cual es este testimonio
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Video relacionado */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Video Relacionado</h3>
                            <p className="text-sm text-gray-600">
                                Video de nuestro catálogo relacionado con este testimonio
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={onShowVideoModal}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {selectedVideo ? 'Cambiar Video' : 'Agregar Video'}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {selectedVideo ? (
                        <div className="bg-gray-50 rounded-lg border p-4">
                            <div className="flex items-start space-x-4">
                                {selectedVideo.thumbnail ? (
                                    <img
                                        src={selectedVideo.thumbnail}
                                        alt={selectedVideo.title}
                                        className="w-20 h-12 rounded object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                        <Play className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {selectedVideo.title}
                                            </h4>
                                            {selectedVideo.subtitle && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {selectedVideo.subtitle}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-3 mt-2">
                                                <span className="text-xs text-gray-500">
                                                    /{selectedVideo.video_slug}
                                                </span>
                                                <Badge variant="secondary" size="sm">
                                                    {selectedVideo.category?.replace('-', ' ') || 'Sin categoría'}
                                                </Badge>
                                                {selectedVideo.duration && (
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {selectedVideo.duration}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={onRemoveVideo}
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
                            <Play className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin video asignado</h4>
                            <p className="text-sm mb-4">
                                Selecciona un video de nuestro catálogo relacionado con este testimonio
                            </p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente para la pestaña de Galería con subida a Supabase
const GalleryTab = ({ formData, handleInputChange, uploading, setUploading }) => {
    const [newImageFile, setNewImageFile] = useState(null);
    const [newImageCaption, setNewImageCaption] = useState('');
    const photoGallery = formData.photo_gallery || [];

    const uploadImageToSupabase = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `testimonials/${fileName}`;

            const { data, error } = await supabase.storage
                .from('testimonial-gallery')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('testimonial-gallery')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            throw error;
        }
    };

    const addImageFromFile = async () => {
        if (!newImageFile) return;

        try {
            setUploading(true);
            const imageUrl = await uploadImageToSupabase(newImageFile);
            
            const updatedGallery = [...photoGallery, {
                url: imageUrl,
                caption: newImageCaption || '',
                order: photoGallery.length + 1,
                filename: newImageFile.name
            }];
            
            handleInputChange('photo_gallery', updatedGallery);
            setNewImageFile(null);
            setNewImageCaption('');
        } catch (error) {
            alert('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const addImageFromUrl = () => {
        const url = prompt('Ingresa la URL de la imagen:');
        if (url && url.trim()) {
            const updatedGallery = [...photoGallery, {
                url: url.trim(),
                caption: '',
                order: photoGallery.length + 1
            }];
            handleInputChange('photo_gallery', updatedGallery);
        }
    };

    const removeImage = (index) => {
        const updatedGallery = photoGallery.filter((_, i) => i !== index);
        handleInputChange('photo_gallery', updatedGallery);
    };

    const updateImageCaption = (index, caption) => {
        const updatedGallery = photoGallery.map((img, i) => 
            i === index ? { ...img, caption } : img
        );
        handleInputChange('photo_gallery', updatedGallery);
    };

    const moveImage = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= photoGallery.length) return;

        const updatedGallery = [...photoGallery];
        [updatedGallery[index], updatedGallery[newIndex]] = [updatedGallery[newIndex], updatedGallery[index]];
        handleInputChange('photo_gallery', updatedGallery);
    };

    const setFeaturedImage = (imageUrl) => {
        handleInputChange('featured_image', imageUrl);
    };

    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
                <p className="text-sm text-gray-600">
                    Agrega imágenes para mostrar en el testimonio
                </p>
            </Card.Header>
            <Card.Body>
                <div className="space-y-6">
                    {/* Imagen destacada */}
                    {formData.featured_image && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3">Imagen Destacada</h4>
                            <div className="flex items-start space-x-4">
                                <img
                                    src={formData.featured_image}
                                    alt="Imagen destacada"
                                    className="w-24 h-20 rounded object-cover flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-800">
                                        Esta imagen se mostrará como imagen principal del testimonio
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFeaturedImage('')}
                                        className="mt-2"
                                    >
                                        Quitar imagen destacada
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Agregar nueva imagen */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Agregar Nueva Imagen</h4>
                        
                        {/* Subir archivo */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subir desde archivo
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewImageFile(e.target.files[0])}
                                        className="flex-1"
                                        disabled={uploading}
                                    />
                                    <Input
                                        value={newImageCaption}
                                        onChange={(e) => setNewImageCaption(e.target.value)}
                                        placeholder="Descripción (opcional)"
                                        className="flex-1"
                                        disabled={uploading}
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={addImageFromFile}
                                        disabled={!newImageFile || uploading}
                                        icon={uploading ? null : <Plus className="w-4 h-4" />}
                                    >
                                        {uploading ? 'Subiendo...' : 'Agregar'}
                                    </Button>
                                </div>
                            </div>
                            
                            {/* O desde URL */}
                            <div className="text-center">
                                <span className="text-sm text-gray-500">o</span>
                            </div>
                            
                            <div>
                                <Button
                                    variant="outline"
                                    onClick={addImageFromUrl}
                                    disabled={uploading}
                                    icon={<ExternalLink className="w-4 h-4" />}
                                >
                                    Agregar desde URL
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de imágenes */}
                    {photoGallery.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">
                                Imágenes de la Galería ({photoGallery.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {photoGallery.map((image, index) => (
                                    <div key={index} className="bg-white border rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={image.url}
                                                alt={image.caption || `Imagen ${index + 1}`}
                                                className="w-20 h-20 rounded object-cover flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div 
                                                className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0"
                                                style={{ display: 'none' }}
                                            >
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        Imagen #{index + 1}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => moveImage(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => moveImage(index, 'down')}
                                                            disabled={index === photoGallery.length - 1}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => setFeaturedImage(image.url)}
                                                            className="p-1 text-blue-400 hover:text-blue-600"
                                                            title="Marcar como destacada"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeImage(index)}
                                                            className="p-1 text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <Input
                                                    value={image.caption || ''}
                                                    onChange={(e) => updateImageCaption(index, e.target.value)}
                                                    placeholder="Descripción de la imagen"
                                                    size="sm"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {image.filename || 'Imagen externa'}
                                                </p>
                                                {formData.featured_image === image.url && (
                                                    <Badge variant="primary" size="sm" className="mt-1">
                                                        Imagen destacada
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Sin imágenes en la galería</h4>
                            <p className="text-sm mb-4">
                                Sube imágenes para mostrar junto con el testimonio
                            </p>
                        </div>
                    )}
                </div>
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
                    Optimiza el testimonio para motores de búsqueda
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
                                placeholder="https://ejemplo.com/testimonio"
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

                    {/* Preview de SEO */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Preview de SEO</h4>
                        <div className="bg-white p-3 rounded border">
                            <h5 className="text-blue-600 text-lg leading-tight">
                                {formData.meta_title || formData.title || 'Título del testimonio'}
                            </h5>
                            <p className="text-green-700 text-sm">
                                ejemplo.com/testimonios/{formData.slug || 'slug-del-testimonio'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {formData.meta_description || formData.excerpt || 'Descripción del testimonio aparecerá aquí...'}
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
                    Selecciona las etiquetas que mejor describan este testimonio
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

// Componente Editor de Testimonios
const TestimonialEditor = ({ testimonial, onBack, user, permissions, availableTags, tagCategories }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        slug: '',
        excerpt: '',
        full_testimonial: '',
        rating: 5,
        client_name: '',
        client_avatar: '',
        client_verified: false,
        client_is_celebrity: false,
        client_profession: '',
        category: 'compradores',
        video_testimonial: '',
        featured_image: '',
        views: '0',
        read_time: '3',
        featured: false,
        status: 'draft',
        transaction_location: '',
        meta_title: '',
        meta_description: '',
        canonical_url: '',
        language: 'es',
        photo_gallery: [],
        city_id: null,
        sector_id: null,
        agent_id: null,
        contact_id: null,
        property_id: null,
        video_id: null,
        ...testimonial
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingTags, setLoadingTags] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Estados para ubicación
    const [cities, setCities] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);

    // Estados para relaciones
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [agents, setAgents] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [properties, setProperties] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loadingRelations, setLoadingRelations] = useState(true);

    // Estados para modales
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showPropertyModal, setShowPropertyModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                loadCities(),
                loadRelationData()
            ]);
            
            // Test específico para contactos
            await testContactsConnection();
        };
        initializeData();
    }, []);

    // Función de test para contactos
    const testContactsConnection = async () => {
        try {
            console.log('🧪 Probando conexión directa con contactos...');
            
            // Test 1: Contar contactos
            const { count, error: countError } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true });
            
            console.log('📊 Total de contactos en BD:', count, 'Error:', countError);
            
            // Test 2: Obtener primeros 5 contactos sin filtros
            const { data: testData, error: testError } = await supabase
                .from('contacts')
                .select('id, name, email, phone')
                .limit(5);
                
            console.log('📋 Primeros 5 contactos:', testData, 'Error:', testError);
            
            // Test 3: Verificar permisos con query simple
            const { data: simpleData, error: simpleError } = await supabase
                .from('contacts')
                .select('id')
                .limit(1);
                
            console.log('🔐 Test de permisos simple:', simpleData, 'Error:', simpleError);
            
        } catch (err) {
            console.error('🚨 Error en test de contactos:', err);
        }
    };

    const loadCities = async () => {
        try {
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
            setCities(data || []);
            console.log('✅ Ciudades cargadas:', data?.length || 0);
        } catch (err) {
            console.error('❌ Error cargando ciudades:', err);
        }
    };

    const loadSectors = async (cityId) => {
        try {
            const { data, error } = await supabase
                .from('sectors')
                .select('id, name')
                .eq('city_id', cityId)
                .order('name');

            if (error) throw error;
            setSectors(data || []);
            console.log(`✅ Sectores cargados para ciudad ${cityId}:`, data?.length || 0);
            return data || [];
        } catch (err) {
            console.error('❌ Error cargando sectores:', err);
            setSectors([]);
            return [];
        }
    };

    const loadRelationData = async () => {
        try {
            setLoadingRelations(true);
            console.log('🔄 Cargando datos de relaciones...');
            
            // Cargar agentes
            console.log('📋 Cargando agentes...');
            const { data: agentsData, error: agentsError } = await supabase
                .from('users')
                .select('id, first_name, last_name, email, profile_photo_url, position, phone')
                .eq('active', true)
                .order('first_name');

            if (agentsError) {
                console.error('❌ Error cargando agentes:', agentsError);
                throw agentsError;
            }

            // Cargar contactos con debugging específico
            console.log('📋 Cargando contactos...');
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('id, name, email, phone, document_number, address, source, notes')
                .order('name');

            console.log('📞 Respuesta de contactos:', { 
                data: contactsData, 
                error: contactsError,
                count: contactsData?.length || 0 
            });

            if (contactsError) {
                console.error('❌ Error cargando contactos:', contactsError);
                // No hacer throw para que continúe con las otras cargas
                setContacts([]);
            } else {
                setContacts(contactsData || []);
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
                    sectors!properties_sector_id_fkey(
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

            // Cargar videos
            console.log('📋 Cargando videos...');
            const { data: videosData, error: videosError } = await supabase
                .from('videos')
                .select('id, title, subtitle, video_slug, thumbnail, category, duration, status')
                .eq('status', 'published')
                .order('title');

            if (videosError) {
                console.error('❌ Error cargando videos:', videosError);
                throw videosError;
            }

            setAgents(agentsData || []);
            // setContacts ya se seteo arriba con manejo de error específico
            setProperties(propertiesData || []);
            setVideos(videosData || []);

            console.log('✅ Datos cargados:', {
                agentes: agentsData?.length || 0,
                contactos: contactsData?.length || 0,
                propiedades: propertiesData?.length || 0,
                videos: videosData?.length || 0
            });

        } catch (err) {
            console.error('💥 Error cargando datos de relaciones:', err);
        } finally {
            setLoadingRelations(false);
        }
    };

    const loadTestimonialTags = async (testimonialId) => {
        try {
            setLoadingTags(true);
            const { data, error } = await supabase
                .from('content_tags')
                .select('tag_id')
                .eq('content_id', testimonialId)
                .eq('content_type', 'testimonial');

            if (error) throw error;
            setSelectedTags(data ? data.map(ct => ct.tag_id) : []);
        } catch (err) {
            console.error('Error al cargar tags del testimonio:', err);
            setSelectedTags([]);
        } finally {
            setLoadingTags(false);
        }
    };

    // Effect para cargar datos iniciales del formulario
    useEffect(() => {
        console.log('🔄 Cargando datos del formulario...', { testimonial: !!testimonial });
        
        if (testimonial) {
            setFormData({
                title: testimonial.title || '',
                subtitle: testimonial.subtitle || '',
                slug: testimonial.slug || '',
                excerpt: testimonial.excerpt || '',
                full_testimonial: testimonial.full_testimonial || '',
                rating: testimonial.rating || 5,
                client_name: testimonial.client_name || '',
                client_avatar: testimonial.client_avatar || '',
                client_verified: testimonial.client_verified || false,
                client_is_celebrity: testimonial.client_is_celebrity || false,
                client_profession: testimonial.client_profession || '',
                category: testimonial.category || 'compradores',
                video_testimonial: testimonial.video_testimonial || '',
                featured_image: testimonial.featured_image || '',
                views: testimonial.views || '0',
                read_time: testimonial.read_time || '3',
                featured: testimonial.featured || false,
                status: testimonial.status || 'draft',
                transaction_location: testimonial.transaction_location || '',
                meta_title: testimonial.meta_title || '',
                meta_description: testimonial.meta_description || '',
                canonical_url: testimonial.canonical_url || '',
                language: testimonial.language || 'es',
                photo_gallery: testimonial.photo_gallery || [],
                city_id: testimonial.city_id || null,
                sector_id: testimonial.sector_id || null,
                agent_id: testimonial.agent_id || null,
                contact_id: testimonial.contact_id || null,
                property_id: testimonial.property_id || null,
                video_id: testimonial.video_id || null
            });

            if (testimonial.id) {
                loadTestimonialTags(testimonial.id);
            }

            console.log('✅ Datos del formulario cargados con IDs:', {
                city_id: testimonial.city_id,
                sector_id: testimonial.sector_id,
                agent_id: testimonial.agent_id,
                contact_id: testimonial.contact_id,
                property_id: testimonial.property_id,
                video_id: testimonial.video_id
            });
        } else {
            // Limpiar todo si es un nuevo testimonio
            setSelectedTags([]);
            setSelectedCity(null);
            setSelectedSector(null);
            setSelectedAgent(null);
            setSelectedContact(null);
            setSelectedProperty(null);
            setSelectedVideo(null);
        }
    }, [testimonial]);

    // Effect para cargar ciudad y sectores cuando hay datos disponibles
    useEffect(() => {
        if (testimonial?.city_id && cities.length > 0) {
            console.log('🔄 Buscando ciudad con ID:', testimonial.city_id);
            const city = cities.find(c => c.id === testimonial.city_id);
            if (city) {
                console.log('✅ Ciudad encontrada:', city.name);
                setSelectedCity(city);
                
                // Cargar sectores y seleccionar el sector si existe
                loadSectors(city.id).then((sectorsData) => {
                    if (testimonial.sector_id && sectorsData.length > 0) {
                        const sector = sectorsData.find(s => s.id === testimonial.sector_id);
                        if (sector) {
                            console.log('✅ Sector encontrado:', sector.name);
                            setSelectedSector(sector);
                        } else {
                            console.log('⚠️ Sector no encontrado con ID:', testimonial.sector_id);
                        }
                    }
                });
            } else {
                console.log('⚠️ Ciudad no encontrada con ID:', testimonial.city_id);
            }
        }
    }, [testimonial?.city_id, cities]);

    // Effect para cargar agente
    useEffect(() => {
        if (testimonial?.agent_id && agents.length > 0) {
            console.log('🔄 Buscando agente con ID:', testimonial.agent_id);
            const agent = agents.find(a => a.id === testimonial.agent_id);
            if (agent) {
                console.log('✅ Agente encontrado:', agent.first_name, agent.last_name);
                setSelectedAgent(agent);
            } else {
                console.log('⚠️ Agente no encontrado con ID:', testimonial.agent_id);
            }
        }
    }, [testimonial?.agent_id, agents]);

    // Effect para cargar contacto
    useEffect(() => {
        if (testimonial?.contact_id && contacts.length > 0) {
            console.log('🔄 Buscando contacto con ID:', testimonial.contact_id);
            const contact = contacts.find(c => c.id === testimonial.contact_id);
            if (contact) {
                console.log('✅ Contacto encontrado:', contact.name);
                setSelectedContact(contact);
            } else {
                console.log('⚠️ Contacto no encontrado con ID:', testimonial.contact_id);
            }
        }
    }, [testimonial?.contact_id, contacts]);

    // Effect para cargar propiedad desde relaciones existentes
    useEffect(() => {
        if (testimonial?.id && properties.length > 0) {
            // Primero intentar cargar desde property_id directo
            if (testimonial.property_id) {
                console.log('🔄 Buscando propiedad con ID directo:', testimonial.property_id);
                const property = properties.find(p => p.id === testimonial.property_id);
                if (property) {
                    console.log('✅ Propiedad encontrada (directo):', property.name);
                    setSelectedProperty(property);
                    return;
                }
            }

            // Si no se encuentra, buscar en content_property_relations
            loadPropertyFromRelations(testimonial.id);
        }
    }, [testimonial?.id, testimonial?.property_id, properties]);

    const loadPropertyFromRelations = async (testimonialId) => {
        try {
            console.log('🔄 Buscando propiedad en content_property_relations...');
            const { data, error } = await supabase
                .from('content_property_relations')
                .select(`
                    property_id,
                    properties!content_property_relations_property_id_fkey(
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
                        cities!properties_city_id_fkey(id, name),
                        provinces!properties_province_id_fkey(id, name),
                        property_categories!properties_category_id_fkey(id, name)
                    )
                `)
                .eq('content_id', testimonialId)
                .eq('content_type', 'testimonial')
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                throw error;
            }

            if (data?.properties) {
                console.log('✅ Propiedad encontrada en relaciones:', data.properties.name);
                setSelectedProperty(data.properties);
                handleInputChange('property_id', data.properties.id);
            } else {
                console.log('ℹ️ No hay propiedad relacionada en content_property_relations');
            }
        } catch (err) {
            console.error('❌ Error cargando propiedad desde relaciones:', err);
        }
    };

    // Effect para cargar video
    useEffect(() => {
        if (testimonial?.video_id && videos.length > 0) {
            console.log('🔄 Buscando video con ID:', testimonial.video_id);
            const video = videos.find(v => v.id === testimonial.video_id);
            if (video) {
                console.log('✅ Video encontrado:', video.title);
                setSelectedVideo(video);
            } else {
                console.log('⚠️ Video no encontrado con ID:', testimonial.video_id);
            }
        }
    }, [testimonial?.video_id, videos]);

    // Auto-generar slug del título
    useEffect(() => {
        if (formData.title && !testimonial) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, testimonial]);

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

    const handleCityChange = (cityId) => {
        const city = cities.find(c => c.id === cityId);
        setSelectedCity(city || null);
        setSelectedSector(null);
        setSectors([]);
        
        handleInputChange('city_id', cityId || null);
        handleInputChange('sector_id', null);
        
        if (cityId) {
            loadSectors(cityId);
        }
    };

    const handleSectorChange = (sectorId) => {
        const sector = sectors.find(s => s.id === sectorId);
        setSelectedSector(sector || null);
        handleInputChange('sector_id', sectorId || null);
    };

    const handleTagToggle = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    // Función para subir avatar
    const handleAvatarUpload = async (file) => {
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
            const fileName = `contact_${Date.now()}.${fileExt}`;
            const filePath = `contacts/${fileName}`;

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            handleInputChange('client_avatar', publicUrl);
        } catch (error) {
            console.error('Error subiendo avatar:', error);
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
        if (!formData.client_name?.trim()) {
            newErrors.client_name = 'El nombre del cliente es requerido';
        }
        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        setErrors(newErrors);
        
        // Mostrar errores si los hay
        if (Object.keys(newErrors).length > 0) {
            alert('Por favor corrige los errores en el formulario:\n' + Object.values(newErrors).join('\n'));
            // Cambiar a la pestaña básica si hay errores ahí
            if (newErrors.title || newErrors.slug || newErrors.excerpt || newErrors.client_name || newErrors.category) {
                setActiveTab('basic');
            }
        }
        
        return Object.keys(newErrors).length === 0;
    };

    const saveTestimonialTags = async (testimonialId, tagIds) => {
        try {
            await supabase
                .from('content_tags')
                .delete()
                .eq('content_id', testimonialId)
                .eq('content_type', 'testimonial');

            if (tagIds.length > 0) {
                const contentTags = tagIds.map(tagId => ({
                    content_id: testimonialId,
                    content_type: 'testimonial',
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

            console.log('💾 Iniciando guardado del testimonio...');
            console.log('📝 Datos del formulario:', formData);
            console.log('🔗 Relaciones seleccionadas:', {
                agent: selectedAgent?.id,
                contact: selectedContact?.id,
                property: selectedProperty?.id,
                video: selectedVideo?.id,
                city: selectedCity?.id,
                sector: selectedSector?.id
            });

            const dataToSave = {
                title: formData.title,
                subtitle: formData.subtitle || null,
                slug: formData.slug,
                excerpt: formData.excerpt,
                full_testimonial: formData.full_testimonial || null,
                rating: formData.rating,
                client_name: formData.client_name,
                client_avatar: formData.client_avatar || null,
                client_location: formData.client_location || null,
                client_verified: formData.client_verified,
                client_is_celebrity: formData.client_is_celebrity,
                client_profession: formData.client_profession || null,
                category: formData.category,
                property_type: formData.property_type || null,
                video_testimonial: formData.video_testimonial || null,
                featured_image: formData.featured_image || null,
                views: formData.views || '0',
                read_time: formData.read_time || '3',
                featured: formData.featured,
                status: status,
                transaction_location: formData.transaction_location || null,
                meta_title: formData.meta_title || null,
                meta_description: formData.meta_description || null,
                canonical_url: formData.canonical_url || null,
                language: formData.language,
                photo_gallery: formData.photo_gallery || [],
                // Estas columnas YA EXISTEN en la tabla
                agent_id: selectedAgent?.id || null,
                contact_id: selectedContact?.id || null,
                property_id: selectedProperty?.id || null,
                updated_at: new Date().toISOString()
            };

            // Solo agregar las nuevas columnas si existen (city_id, sector_id, video_id)
            try {
                // Verificar city_id y video_id (que agregamos antes)
                const { error: checkError } = await supabase
                    .from('testimonials')
                    .select('city_id, video_id')
                    .limit(1);

                if (!checkError) {
                    dataToSave.city_id = selectedCity?.id || null;
                    dataToSave.video_id = selectedVideo?.id || null;
                    console.log('✅ Columnas city_id y video_id agregadas');
                }

                // Verificar sector_id por separado (puede no existir aún)
                const { error: sectorError } = await supabase
                    .from('testimonials')
                    .select('sector_id')
                    .limit(1);

                if (!sectorError) {
                    dataToSave.sector_id = selectedSector?.id || null;
                    console.log('✅ Columna sector_id detectada y agregada');
                } else {
                    console.log('⚠️ Columna sector_id no existe aún. Ejecuta: ALTER TABLE testimonials ADD COLUMN sector_id UUID REFERENCES sectors(id);');
                }

            } catch (schemaError) {
                console.log('⚠️ Error verificando esquema:', schemaError);
            }

            if (status === 'published' && !testimonial?.published_at) {
                dataToSave.published_at = new Date().toISOString();
            }

            console.log('💾 Datos preparados para guardar:', {
                ...dataToSave,
                property_type_sync: formData.property_type,
                city_id_sync: selectedCity?.id,
                sector_id_sync: selectedSector?.id
            });

            let result;
            let testimonialId;

            if (testimonial) {
                console.log('🔄 Actualizando testimonio existente:', testimonial.id);
                result = await supabase
                    .from('testimonials')
                    .update(dataToSave)
                    .eq('id', testimonial.id)
                    .select();
                
                testimonialId = testimonial.id;
            } else {
                console.log('✨ Creando nuevo testimonio');
                dataToSave.created_at = new Date().toISOString();
                result = await supabase
                    .from('testimonials')
                    .insert([dataToSave])
                    .select();
                
                testimonialId = result.data?.[0]?.id;
            }

            console.log('📤 Respuesta de Supabase:', result);

            if (result.error) {
                console.error('❌ Error de Supabase:', result.error);
                throw result.error;
            }

            if (testimonialId) {
                console.log('🏷️ Guardando tags del testimonio...');
                await saveTestimonialTags(testimonialId, selectedTags);
                console.log('✅ Tags guardados exitosamente');

                // Guardar relación bidireccional con propiedad si existe
                if (selectedProperty?.id) {
                    console.log('🏠 Guardando relación con propiedad...');
                    await savePropertyRelation(testimonialId, selectedProperty.id);
                    console.log('✅ Relación con propiedad guardada');
                }
            }

            console.log('🎉 Testimonio guardado exitosamente!');
            alert('Testimonio guardado exitosamente!');
            onBack();
        } catch (err) {
            console.error('💥 Error al guardar testimonio:', err);
            
            // Mensaje de error más específico
            let errorMessage = 'Error al guardar el testimonio: ';
            if (err.message.includes('city_id') || err.message.includes('sector_id') || err.message.includes('video_id')) {
                errorMessage += 'Algunas columnas nuevas no existen en la base de datos. Ejecuta el SQL para crearlas: city_id, sector_id, video_id';
            } else {
                errorMessage += err.message;
            }
            
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // Funciones para manejar modales de relaciones
    const handleSelectAgent = (agent) => {
        setSelectedAgent(agent);
        handleInputChange('agent_id', agent.id);
        setShowAgentModal(false);
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        handleInputChange('contact_id', contact.id);
        
        // Sincronizar datos del contacto con el testimonio
        console.log('🔄 Sincronizando datos del contacto al testimonio:', contact);
        
        // Actualizar campos en testimonials desde contacto
        if (contact.name) {
            handleInputChange('client_name', contact.name);
        }
        
        // Sincronizar dirección del contacto a client_location
        if (contact.address) {
            handleInputChange('client_location', contact.address);
            console.log('📍 Dirección sincronizada desde contacto:', contact.address);
        }
        
        console.log('✅ Datos sincronizados del contacto al testimonio');
        setShowContactModal(false);
    };

    const handleSelectProperty = async (property) => {
        setSelectedProperty(property);
        handleInputChange('property_id', property.id);
        
        // Sincronizar datos de ubicación desde la propiedad
        console.log('🔄 Sincronizando datos de propiedad al testimonio:', property);
        
        // Sincronizar ciudad desde propiedad
        if (property.cities?.id) {
            const city = cities.find(c => c.id === property.cities.id);
            if (city) {
                setSelectedCity(city);
                handleInputChange('city_id', city.id);
                console.log('🏙️ Ciudad sincronizada desde propiedad:', city.name);
                
                // Cargar sectores de esta ciudad
                const sectorsData = await loadSectors(city.id);
                
                // Sincronizar sector desde propiedad si existe
                if (property.sectors?.id && sectorsData.length > 0) {
                    const sector = sectorsData.find(s => s.id === property.sectors.id);
                    if (sector) {
                        setSelectedSector(sector);
                        handleInputChange('sector_id', sector.id);
                        console.log('🏘️ Sector sincronizado desde propiedad:', sector.name);
                    }
                }
            }
        }
        
        // Sincronizar tipo de propiedad (name desde property_categories)
        if (property.property_categories?.name) {
            handleInputChange('property_type', property.property_categories.name);
            console.log('🏠 Tipo de propiedad sincronizado:', property.property_categories.name);
        }
        
        setShowPropertyModal(false);

        // Crear relación bidireccional en content_property_relations
        if (testimonial?.id) {
            try {
                await savePropertyRelation(testimonial.id, property.id);
            } catch (err) {
                console.error('Error creando relación con propiedad:', err);
            }
        }
        
        console.log('✅ Todos los datos sincronizados desde propiedad al testimonio');
    };

    const handleSelectVideo = (video) => {
        setSelectedVideo(video);
        handleInputChange('video_id', video.id);
        setShowVideoModal(false);
    };

    const handleRemoveAgent = () => {
        setSelectedAgent(null);
        handleInputChange('agent_id', null);
    };

    const handleRemoveContact = () => {
        console.log('🔄 Desvinculando contacto del testimonio');
        setSelectedContact(null);
        handleInputChange('contact_id', null);
        
        // Opcional: limpiar campos que venían del contacto
        // (Podrías preguntar al usuario si quiere mantener los datos)
        console.log('✅ Contacto desvinculado, datos del formulario mantenidos');
    };

    const handleRemoveProperty = async () => {
        if (testimonial?.id && selectedProperty?.id) {
            try {
                await removePropertyRelation(testimonial.id, selectedProperty.id);
            } catch (err) {
                console.error('Error removiendo relación con propiedad:', err);
            }
        }
        setSelectedProperty(null);
        handleInputChange('property_id', null);
    };

    const handleRemoveVideo = () => {
        setSelectedVideo(null);
        handleInputChange('video_id', null);
    };

    // Función para crear relación bidireccional con propiedad
    const savePropertyRelation = async (testimonialId, propertyId) => {
        try {
            const { error } = await supabase
                .from('content_property_relations')
                .upsert({
                    content_id: testimonialId,
                    content_type: 'testimonial',
                    property_id: propertyId,
                    relation_type: 'related',
                    weight: 1.0,
                    auto_generated: false
                }, {
                    onConflict: 'content_id,content_type,property_id'
                });

            if (error) throw error;
            console.log('✅ Relación con propiedad creada');
        } catch (err) {
            console.error('❌ Error creando relación con propiedad:', err);
            throw err;
        }
    };

    // Función para remover relación bidireccional con propiedad
    const removePropertyRelation = async (testimonialId, propertyId) => {
        try {
            const { error } = await supabase
                .from('content_property_relations')
                .delete()
                .eq('content_id', testimonialId)
                .eq('content_type', 'testimonial')
                .eq('property_id', propertyId);

            if (error) throw error;
            console.log('✅ Relación con propiedad removida');
        } catch (err) {
            console.error('❌ Error removiendo relación con propiedad:', err);
            throw err;
        }
    };

    // Pestañas de navegación
    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: <FileText className="w-4 h-4" /> },
        { id: 'relations', label: 'Relaciones', icon: <Users className="w-4 h-4" /> },
        { id: 'tags', label: 'Etiquetas', icon: <Tag className="w-4 h-4" /> },
        { id: 'gallery', label: 'Galería', icon: <ImageIcon className="w-4 h-4" /> },
        { id: 'seo', label: 'SEO', icon: <Globe className="w-4 h-4" /> }
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
                                {testimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
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
                            handleAvatarUpload={handleAvatarUpload}
                            uploading={uploading}
                            cities={cities}
                            sectors={sectors}
                            selectedCity={selectedCity}
                            selectedSector={selectedSector}
                            selectedContact={selectedContact}
                            selectedProperty={selectedProperty}
                            onCityChange={handleCityChange}
                            onSectorChange={handleSectorChange}
                            onRemoveContact={handleRemoveContact}
                        />
                    )}

                    {activeTab === 'relations' && (
                        <RelationsTab
                            selectedAgent={selectedAgent}
                            selectedContact={selectedContact}
                            selectedProperty={selectedProperty}
                            selectedVideo={selectedVideo}
                            agents={agents}
                            contacts={contacts}
                            properties={properties}
                            videos={videos}
                            onShowAgentModal={() => setShowAgentModal(true)}
                            onShowContactModal={() => setShowContactModal(true)}
                            onShowPropertyModal={() => setShowPropertyModal(true)}
                            onShowVideoModal={() => setShowVideoModal(true)}
                            onRemoveAgent={handleRemoveAgent}
                            onRemoveContact={handleRemoveContact}
                            onRemoveProperty={handleRemoveProperty}
                            onRemoveVideo={handleRemoveVideo}
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

                    {activeTab === 'gallery' && (
                        <GalleryTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            uploading={uploading}
                            setUploading={setUploading}
                        />
                    )}

                    {activeTab === 'seo' && (
                        <SEOTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                        />
                    )}
                </div>
            </div>

            {/* Modales de Selección */}
            <AgentSelectionModal
                isOpen={showAgentModal}
                onClose={() => setShowAgentModal(false)}
                agents={agents}
                onSelect={handleSelectAgent}
            />

            <ContactSelectionModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                contacts={contacts}
                onSelect={handleSelectContact}
                loading={loadingRelations}
            />

            <PropertySelectionModal
                isOpen={showPropertyModal}
                onClose={() => setShowPropertyModal(false)}
                properties={properties}
                onSelect={handleSelectProperty}
            />

            <VideoSelectionModal
                isOpen={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                videos={videos}
                onSelect={handleSelectVideo}
            />
        </div>
    );
};

export default TestimonialEditor;