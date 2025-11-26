import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, ArrowRight, Check, Home, Building2, MapPin, Camera,
    DollarSign, Bed, Bath, Car, Square, Calendar, User, Users,
    Shield, FileText, Plus, X, Upload, Eye, EyeOff, Zap, Target,
    Save, AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp,
    Edit, Info, Settings, Bold, Italic, Type, List, BookOpen, TrendingUp,
    Code, Link, Heading, ListOrdered, Globe, ExternalLink, Search, BarChart3,
    RefreshCw, Copy, Lightbulb, Tag, Trash2, Phone, Mail
} from 'lucide-react';

// Configuración real de Supabase


// Importar componentes reales - CAMBIO: SmartLocationManager en lugar de PropertyLocationManager
import ProjectComprehensiveSetup from './ProjectComprehensiveSetup';
import SmartLocationManager from './SmartLocationManager';
import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';

// Verificar si los componentes se importaron correctamente - CAMBIO: actualizar verificación
console.log('📦 Componentes importados:', {
    ProjectComprehensiveSetup: !!ProjectComprehensiveSetup,
    SmartLocationManager: !!SmartLocationManager,
    WYSIWYGSEOEditor: !!WYSIWYGSEOEditor
});


import { supabase } from '../services/api';

// Componentes UI reutilizables
const Button = ({ children, variant = 'primary', size = 'md', icon, disabled = false, onClick, className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 focus:ring-orange-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-orange-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', required = false, error, disabled = false, ...props }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
            {...props}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Select = ({ label, value, onChange, options, placeholder, required = false, error, className = '', disabled = false }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <select
            value={value || ''}
            onChange={(e) => onChange && onChange(e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        >
            <option value="">{placeholder}</option>
            {options?.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3, required = false, error, className = '', disabled = false }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <textarea
            value={value || ''}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Badge = ({ children, className = '', variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-orange-100 text-orange-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        secondary: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente Card
const Card = ({ children, title, icon, actions, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {title && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {icon && <span className="text-gray-600">{icon}</span>}
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    {actions && <div className="flex items-center space-x-2">{actions}</div>}
                </div>
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

// Exportar componentes UI para el WYSIWYGSEOEditor
export { Button, Card };

// Componente Modal de Selección de Agente
const AgentSelectionModal = ({ isOpen, onClose, agents, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAgents, setFilteredAgents] = useState(agents || []);

    useEffect(() => {
        if (!agents) return;

        const filtered = agents.filter(agent =>
            `${agent.first_name || ''} ${agent.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
                        <h3 className="text-lg font-semibold">Seleccionar Asesor</h3>
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
                            onChange={(value) => setSearchTerm(value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    <div className="space-y-3">
                        {filteredAgents && filteredAgents.length > 0 ? (
                            filteredAgents.map(agent => (
                                <div
                                    key={agent.value}
                                    onClick={() => onSelect && onSelect(agent)}
                                    className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {agent.label}
                                        </p>
                                        <p className="text-sm text-gray-600">{agent.email || 'Sin email'}</p>
                                        {agent.position && (
                                            <p className="text-xs text-gray-500">{agent.position}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No se encontraron asesores</p>
                                <p className="text-sm">Intenta con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
                    {filteredAgents?.length || 0} de {agents?.length || 0} asesores mostrados
                </div>
            </div>
        </div>
    );
};

// Componente Modal de Selección de Contacto
const ContactSelectionModal = ({ isOpen, onClose, contacts, onSelect, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredContacts, setFilteredContacts] = useState(contacts || []);

    useEffect(() => {
        if (!contacts) return;

        const filtered = contacts.filter(contact =>
            contact.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        <h3 className="text-lg font-semibold">Seleccionar Encargado/Responsable</h3>
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
                            onChange={(value) => setSearchTerm(value)}
                            className="pl-10"
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                            <p className="text-gray-600">Cargando contactos...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredContacts && filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.value}
                                        onClick={() => onSelect && onSelect(contact)}
                                        className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{contact.label}</p>
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
                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                    {contact.source}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : contacts && contacts.length === 0 ? (
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
                    {loading ? 'Cargando...' : `${filteredContacts?.length || 0} de ${contacts?.length || 0} contactos mostrados`}
                </div>
            </div>
        </div>
    );
};

// Componente SEO simplificado
const SEOManager = ({ propertyData, onSEOChange }) => {
    const [seoData, setSeoData] = useState({
        meta_title: '',
        meta_description: '',
        keywords: '',
        slug_url: '',
        location_path: '' // NUEVO: para paths de ubicación automáticos
    });

    const [analysis, setAnalysis] = useState({
        title_length: 0,
        description_length: 0,
        keywords_count: 0,
        score: 0
    });

    const catalogDataSEO = {
        categories: [
            { value: '1', label: 'Casa' },
            { value: '2', label: 'Apartamento' },
            { value: '3', label: 'Villa' },
            { value: '4', label: 'Townhouse' },
            { value: '5', label: 'Penthouse' },
            { value: '6', label: 'Local Comercial' }
        ]
    };

    useEffect(() => {
        if (propertyData?.name) {
            generateSuggestedSEO();
        }
    }, [propertyData]);

    useEffect(() => {
        analyzeSEO();
        if (onSEOChange) {
            onSEOChange(seoData);
        }
    }, [seoData, onSEOChange]);

    const generateSuggestedSEO = () => {
        if (!propertyData?.name) return;

        const { name, property_category_id, sale_price, rental_price, sale_currency, bedrooms, bathrooms } = propertyData;

        const category = catalogDataSEO.categories.find(c => c.value === property_category_id)?.label || 'Propiedad';
        const price = sale_price ? `${sale_price} ${sale_currency}` : rental_price ? `${rental_price} ${sale_currency}/mes` : '';

        // NUEVO: incorporar location_path si existe
        const slug = generateSlugFromPropertyData(name, seoData.location_path);

        const titleParts = [name];
        if (category !== 'Propiedad') titleParts.push(category);
        if (price) titleParts.push(price);
        const title = titleParts.join(' - ').substring(0, 60);

        const descParts = [name, category.toLowerCase()];
        if (bedrooms) descParts.push(`${bedrooms} habitaciones`);
        if (bathrooms) descParts.push(`${bathrooms} baños`);
        if (price) descParts.push(price);
        descParts.push('¡Contáctanos ahora!');
        const description = descParts.join(', ').substring(0, 160);

        const keywords = [
            category.toLowerCase(),
            'republica dominicana',
            'propiedad',
            'inmueble'
        ].join(', ');

        setSeoData(prev => ({
            ...prev,
            meta_title: title,
            meta_description: description,
            keywords,
            slug_url: slug
        }));
    };

    // NUEVA: función para generar slug integrando ubicación
    const generateSlugFromPropertyData = (name, locationPath) => {
        const namePart = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .replace(/^-+|-+$/g, '');

        if (locationPath) {
            return `${locationPath}/${namePart}`;
        }

        return namePart;
    };

    const analyzeSEO = () => {
        const title_length = seoData.meta_title.length;
        const description_length = seoData.meta_description.length;
        const keywords_count = seoData.keywords.split(',').filter(k => k.trim()).length;

        let score = 0;
        if (title_length >= 30 && title_length <= 60) score += 30;
        else if (title_length > 0) score += 15;

        if (description_length >= 120 && description_length <= 160) score += 30;
        else if (description_length > 0) score += 15;

        if (keywords_count >= 3) score += 20;
        if (seoData.slug_url) score += 20;

        setAnalysis({
            title_length,
            description_length,
            keywords_count,
            score
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Configuración SEO</h4>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestedSEO}
                    icon={<RefreshCw className="w-4 h-4" />}
                >
                    Generar Automático
                </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">Puntuación SEO</span>
                    <div className={`text-2xl font-bold ${analysis.score >= 80 ? 'text-green-600' :
                            analysis.score >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                        {analysis.score}%
                    </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                    <div>Título: {analysis.title_length}/60 caracteres</div>
                    <div>Descripción: {analysis.description_length}/160 caracteres</div>
                    <div>Keywords: {analysis.keywords_count}</div>
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    label="URL Slug"
                    value={seoData.slug_url}
                    onChange={(value) => setSeoData(prev => ({ ...prev, slug_url: value }))}
                    placeholder="distrito-nacional/bella-vista/villa-paradise-punta-cana"
                />

                <div>
                    <Input
                        label="Meta Título"
                        value={seoData.meta_title}
                        onChange={(value) => setSeoData(prev => ({ ...prev, meta_title: value }))}
                        placeholder="Villa Paradise en Punta Cana - $150K"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        {analysis.title_length}/60 caracteres
                    </div>
                </div>

                <div>
                    <Textarea
                        label="Meta Descripción"
                        value={seoData.meta_description}
                        onChange={(value) => setSeoData(prev => ({ ...prev, meta_description: value }))}
                        placeholder="Villa Paradise en Punta Cana con 3 habitaciones, 2 baños, $150K. ¡Contáctanos ahora!"
                        rows={3}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        {analysis.description_length}/160 caracteres
                    </div>
                </div>

                <Input
                    label="Keywords"
                    value={seoData.keywords}
                    onChange={(value) => setSeoData(prev => ({ ...prev, keywords: value }))}
                    placeholder="villa, punta cana, republica dominicana"
                />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Vista Previa en Google</h5>
                <div className="bg-white p-3 rounded border">
                    <div className="text-blue-600 text-sm hover:underline cursor-pointer line-clamp-1 font-medium">
                        {seoData.meta_title || 'Título no definido'}
                    </div>
                    <div className="text-green-700 text-xs mt-1">
                        clicinmobiliaria.com/comprar/{seoData.slug_url || 'slug'}
                    </div>
                    <div className="text-gray-600 text-xs mt-2 line-clamp-2">
                        {seoData.meta_description || 'Descripción no definida...'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente utility para imágenes
const ImageUploader = ({ images = [], onImagesChange, maxImages = 15, allowMultiple = true }) => {
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const newImages = files.map((file, index) => ({
            id: Date.now() + index,
            url: URL.createObjectURL(file),
            file: file,
            isMain: images.length === 0 && index === 0
        }));

        if (onImagesChange) {
            onImagesChange([...images, ...newImages].slice(0, maxImages));
        }
    };

    const removeImage = (imageId) => {
        if (onImagesChange) {
            onImagesChange(images.filter(img => img.id !== imageId));
        }
    };

    const setAsMain = (imageId) => {
        if (onImagesChange) {
            onImagesChange(images.map(img => ({
                ...img,
                isMain: img.id === imageId
            })));
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                    type="file"
                    multiple={allowMultiple}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-600">
                        <span className="font-medium">Haz clic para subir imágenes</span> o arrastra y suelta
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        PNG, JPG hasta 10MB cada una (máximo {maxImages})
                    </div>
                </label>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group">
                            <img
                                src={image.url}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                            />
                            {image.isMain && (
                                <div className="absolute top-2 left-2">
                                    <Badge variant="primary" className="text-xs">Principal</Badge>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!image.isMain && (
                                    <button
                                        onClick={() => setAsMain(image.id)}
                                        className="p-1 bg-white rounded-full text-gray-600 hover:text-orange-600"
                                        title="Establecer como principal"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="p-1 bg-white rounded-full text-gray-600 hover:text-red-600"
                                    title="Eliminar imagen"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente para campos del sidebar
const SidebarFields = ({
    detailsData,
    setDetailsData,
    pricingData,
    setPricingData,
    errors,
    availableAmenities,
    propertyAmenities,
    setPropertyAmenities
}) => {
    const [expandedSections, setExpandedSections] = useState({
        sale: true,
        rental: false,
        furnished: false,
        temp: false,
        other: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleAmenity = (amenityId) => {
        if (!propertyAmenities || !setPropertyAmenities) return;

        const isSelected = propertyAmenities.some(pa => pa.amenity_id === amenityId);

        if (isSelected) {
            setPropertyAmenities(prev => prev.filter(pa => pa.amenity_id !== amenityId));
        } else {
            const amenity = availableAmenities?.find(a => a.id === amenityId);
            if (amenity) {
                const newAmenity = {
                    id: Date.now(),
                    amenity_id: amenityId,
                    value: null,
                    amenities: amenity
                };
                setPropertyAmenities(prev => [...prev, newAmenity]);
            }
        }
    };

    const updateAmenityValue = (amenityId, newValue) => {
        if (!propertyAmenities || !setPropertyAmenities) return;

        setPropertyAmenities(prev =>
            prev.map(pa =>
                pa.amenity_id === amenityId
                    ? { ...pa, value: newValue }
                    : pa
            )
        );
    };

    const amenitiesByCategory = (availableAmenities || []).reduce((acc, amenity) => {
        const category = amenity.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(amenity);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <Card title="Características" icon={<Square className="w-5 h-5" />}>
                <div className="space-y-4">
                    <Input
                        label="Habitaciones"
                        type="number"
                        value={detailsData?.bedrooms || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, bedrooms: value }))}
                        placeholder="3"
                    />
                    <Input
                        label="Baños"
                        type="number"
                        step="0.5"
                        value={detailsData?.bathrooms || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, bathrooms: value }))}
                        placeholder="2.5"
                    />
                    <Input
                        label="Parqueos"
                        type="number"
                        value={detailsData?.parking_spots || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, parking_spots: value }))}
                        placeholder="2"
                    />
                    <Input
                        label="Nivel/Piso"
                        type="number"
                        value={detailsData?.nivel || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, nivel: value }))}
                        placeholder="5"
                    />
                    <Input
                        label="Área construida (m²)"
                        type="number"
                        value={detailsData?.built_area || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, built_area: value }))}
                        placeholder="150"
                    />
                    <Input
                        label="Área del terreno (m²)"
                        type="number"
                        value={detailsData?.land_area || ''}
                        onChange={(value) => setDetailsData && setDetailsData(prev => ({ ...prev, land_area: value }))}
                        placeholder="200"
                    />
                </div>
            </Card>

            <Card title="Precios" icon={<DollarSign className="w-5 h-5" />}>
                <div className="space-y-4">
                    {errors?.pricing && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                            <p className="text-red-800 text-xs">{errors.pricing}</p>
                        </div>
                    )}

                    {/* Precio de Venta */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => toggleSection('sale')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-medium text-gray-900">💰 Venta</span>
                            {expandedSections.sale ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.sale && (
                            <div className="px-3 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={pricingData?.sale_price || ''}
                                        onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, sale_price: value }))}
                                        placeholder="250000"
                                        type="number"
                                    />
                                    <Select
                                        value={pricingData?.sale_currency || 'USD'}
                                        onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, sale_currency: value }))}
                                        options={[
                                            { value: 'USD', label: 'USD' },
                                            { value: 'DOP', label: 'DOP' },
                                            { value: 'EUR', label: 'EUR' }
                                        ]}
                                    />
                                </div>
                                <Input
                                    label="Comisión (%)"
                                    type="number"
                                    step="0.1"
                                    value={pricingData?.sale_commission || ''}
                                    onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, sale_commission: value }))}
                                    placeholder="3.0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Precio de Alquiler */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => toggleSection('rental')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-medium text-gray-900">🏠 Alquiler</span>
                            {expandedSections.rental ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.rental && (
                            <div className="px-3 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={pricingData?.rental_price || ''}
                                        onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, rental_price: value }))}
                                        placeholder="1500"
                                        type="number"
                                    />
                                    <Select
                                        value={pricingData?.rental_currency || 'USD'}
                                        onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, rental_currency: value }))}
                                        options={[
                                            { value: 'USD', label: 'USD' },
                                            { value: 'DOP', label: 'DOP' },
                                            { value: 'EUR', label: 'EUR' }
                                        ]}
                                    />
                                </div>
                                <Input
                                    label="Comisión (%)"
                                    type="number"
                                    step="0.1"
                                    value={pricingData?.rental_commission || ''}
                                    onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, rental_commission: value }))}
                                    placeholder="10.0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Precios Amueblados */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => toggleSection('furnished')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-medium text-gray-900">🛋️ Amueblado</span>
                            {expandedSections.furnished ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.furnished && (
                            <div className="px-3 pb-3 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Venta Amueblado</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={pricingData?.furnished_sale_price || ''}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, furnished_sale_price: value }))}
                                            placeholder="300000"
                                            type="number"
                                        />
                                        <Select
                                            value={pricingData?.furnished_sale_currency || 'USD'}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, furnished_sale_currency: value }))}
                                            options={[
                                                { value: 'USD', label: 'USD' },
                                                { value: 'DOP', label: 'DOP' },
                                                { value: 'EUR', label: 'EUR' }
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Alquiler Amueblado</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={pricingData?.furnished_rental_price || ''}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, furnished_rental_price: value }))}
                                            placeholder="2000"
                                            type="number"
                                        />
                                        <Select
                                            value={pricingData?.furnished_rental_currency || 'USD'}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, furnished_rental_currency: value }))}
                                            options={[
                                                { value: 'USD', label: 'USD' },
                                                { value: 'DOP', label: 'DOP' },
                                                { value: 'EUR', label: 'EUR' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Alquiler Temporal */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => toggleSection('temp')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-medium text-gray-900">📅 Temporal</span>
                            {expandedSections.temp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.temp && (
                            <div className="px-3 pb-3 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Alquiler por día</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={pricingData?.temp_rental_price || ''}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, temp_rental_price: value }))}
                                            placeholder="150"
                                            type="number"
                                        />
                                        <Select
                                            value={pricingData?.temp_rental_currency || 'USD'}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, temp_rental_currency: value }))}
                                            options={[
                                                { value: 'USD', label: 'USD' },
                                                { value: 'DOP', label: 'DOP' },
                                                { value: 'EUR', label: 'EUR' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Otros Costos */}
                    <div className="border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => toggleSection('other')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        >
                            <span className="text-sm font-medium text-gray-900">💳 Otros Costos</span>
                            {expandedSections.other ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.other && (
                            <div className="px-3 pb-3 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Mantenimiento</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={pricingData?.maintenance_price || ''}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, maintenance_price: value }))}
                                            placeholder="200"
                                            type="number"
                                        />
                                        <Select
                                            value={pricingData?.maintenance_currency || 'USD'}
                                            onChange={(value) => setPricingData && setPricingData(prev => ({ ...prev, maintenance_currency: value }))}
                                            options={[
                                                { value: 'USD', label: 'USD' },
                                                { value: 'DOP', label: 'DOP' },
                                                { value: 'EUR', label: 'EUR' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card title="Amenidades" icon={<Zap className="w-5 h-5" />}>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.keys(amenitiesByCategory).length > 0 ? (
                        Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                            <div key={category}>
                                <h5 className="text-xs font-medium text-gray-700 mb-2">{category}</h5>
                                <div className="space-y-2">
                                    {amenities.map((amenity) => {
                                        const isSelected = propertyAmenities?.some(pa => pa.amenity_id === amenity.id);
                                        const selectedAmenity = propertyAmenities?.find(pa => pa.amenity_id === amenity.id);

                                        return (
                                            <div key={amenity.id} className="space-y-2">
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected || false}
                                                        onChange={() => toggleAmenity(amenity.id)}
                                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{amenity.name}</span>
                                                </label>
                                                {isSelected && amenity.has_value && (
                                                    <Input
                                                        value={selectedAmenity?.value || ''}
                                                        onChange={(value) => updateAmenityValue(amenity.id, value)}
                                                        placeholder="Valor"
                                                        className="ml-6"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 text-sm">No hay amenidades disponibles</div>
                    )}
                </div>
            </Card>

            <div className="space-y-3">
                {errors && Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm font-medium text-red-800">
                                {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 'es' : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Mock data inicial para catálogos
const initialCatalogData = {
    categories: [],
    countries: [],
    provinces: [],
    cities: [],
    sectors: [],
    agents: [],
    contacts: []
};

// Componente principal del wizard
const PropertyCreateWizard = ({ onBack, onComplete }) => {
    // Estados principales del componente
    const [currentTab, setCurrentTab] = useState('informacion-basica');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Estado para catálogos de datos
    const [catalogData, setCatalogData] = useState(initialCatalogData);
    const [catalogLoading, setCatalogLoading] = useState(true);

    // Estados para los modales de selección
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(false);

    // Estados para agentes y contactos seleccionados
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);

    // Estados de datos de la propiedad
    const [basicData, setBasicData] = useState({
        name: '',
        private_name: '',
        property_category_id: '',
        property_status: 'Borrador',
        is_project: false
    });

    const [locationData, setLocationData] = useState({
        country_id: '',
        province_id: '',
        city_id: '',
        sector_id: '',
        exact_address: '',
        show_exact_location: false
    });

    const [detailsData, setDetailsData] = useState({
        bedrooms: '',
        bathrooms: '',
        parking_spots: '',
        built_area: '',
        land_area: '',
        nivel: ''
    });

    const [pricingData, setPricingData] = useState({
        sale_price: '',
        sale_currency: 'USD',
        rental_price: '',
        rental_currency: 'USD',
        sale_commission: '',
        rental_commission: '',
        maintenance_price: '',
        maintenance_currency: 'USD',
        furnished_rental_price: '',
        furnished_rental_currency: 'USD',
        furnished_sale_price: '',
        furnished_sale_currency: 'USD',
        temp_rental_price: '',
        temp_rental_currency: 'USD'
    });

    const [projectData, setProjectData] = useState({
        total_units: '',
        available_units: '',
        completion_percentage: 0,
        estimated_completion_date: '',
        guarantees: [],
        developer: {
            name: '',
            legal_name: '',
            email: '',
            phone: '',
            website: '',
            years_experience: '',
            description: ''
        },
        typologies: [],
        phases: [],
        payment_plans: [],
        availability_external_url: '',
        availability_external_type: '',
        availability_external_description: '',
        availability_auto_sync: false
    });

    const [mediaData, setMediaData] = useState({
        main_image_url: '',
        gallery_images: [],
        images: [],
        description: ''
    });

    const [seoData, setSeoData] = useState({
        meta_title: '',
        meta_description: '',
        keywords: '',
        slug_url: '',
        location_path: '' // NUEVO: para manejar rutas automáticas
    });

    // Estados para ubicación y warnings
    const [locationCoordinates, setLocationCoordinates] = useState(null);
    const [warnings, setWarnings] = useState([]);

    // Estado para la propiedad temporal (para el mapa)
    const [tempProperty, setTempProperty] = useState(null);

    // Estados para amenidades y agentes
    const [availableAmenities, setAvailableAmenities] = useState([]);
    const [propertyAmenities, setPropertyAmenities] = useState([]);
    const [agentData, setAgentData] = useState({
        agent_id: '',
        contacto_id: ''
    });

    // Cargar datos de catálogos al inicializar
    useEffect(() => {
        loadCatalogData();
        loadAmenities();
        detectUserCountry();
    }, []);

    // FUNCIÓN SIMPLIFICADA: El SmartLocationManager maneja la detección automática
    const detectUserCountry = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('🌍 Ubicación detectada para SmartLocationManager:', { latitude, longitude });

                // El SmartLocationManager manejará esto automáticamente
                // Solo notificar que se detectó la ubicación
            },
            (error) => {
                console.log('ℹ️ No se pudo obtener ubicación, SmartLocationManager usará configuración por defecto');
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 600000
            }
        );
    };

    // Actualizar propiedad temporal cuando cambian los datos
    useEffect(() => {
        const updateTempProperty = () => {
            const updatedProperty = {
                id: 'temp-' + Date.now(),
                name: basicData.name || 'Nueva Propiedad',
                country_id: locationData.country_id,
                province_id: locationData.province_id,
                city_id: locationData.city_id,
                sector_id: locationData.sector_id,
                exact_address: locationData.exact_address,
                show_exact_location: locationData.show_exact_location,
                exact_coordinates: locationCoordinates
            };

            console.log('🔄 Actualizando tempProperty para SmartLocationManager:', updatedProperty);
            setTempProperty(updatedProperty);
        };

        updateTempProperty();
    }, [basicData.name, locationData, locationCoordinates]);

    // CAMBIO: Handler mejorado para SmartLocationManager
    const handleLocationUpdate = (updatedProperty) => {
        console.log('🗺️ Ubicación actualizada desde SmartLocationManager:', updatedProperty);

        // Actualizar coordenadas exactas
        if (updatedProperty.exact_coordinates) {
            console.log('📍 Actualizando coordenadas exactas:', updatedProperty.exact_coordinates);
            setLocationCoordinates(updatedProperty.exact_coordinates);
        }

        // Actualizar jerarquía de ubicación de forma más eficiente
        if (updatedProperty.country_id !== undefined ||
            updatedProperty.province_id !== undefined ||
            updatedProperty.city_id !== undefined ||
            updatedProperty.sector_id !== undefined) {

            setLocationData(prev => ({
                ...prev,
                country_id: updatedProperty.country_id ?? prev.country_id,
                province_id: updatedProperty.province_id ?? prev.province_id,
                city_id: updatedProperty.city_id ?? prev.city_id,
                sector_id: updatedProperty.sector_id ?? prev.sector_id
            }));
        }

        // NUEVO: Manejar datos SEO automáticos
        if (updatedProperty.seo_path) {
            console.log('🎯 SEO path automático recibido:', updatedProperty.seo_path);
            setSeoData(prev => ({
                ...prev,
                location_path: updatedProperty.seo_path,
                // Regenerar slug automáticamente con nueva ruta
                slug_url: generateSlugFromLocationData(basicData.name, updatedProperty.seo_path)
            }));
        }

        // NUEVO: Manejar breadcrumb automático  
        if (updatedProperty.display_path) {
            console.log('🍞 Breadcrumb automático recibido:', updatedProperty.display_path);
            // Podrías mostrarlo en la UI si quisieras
        }

        // Actualizar dirección exacta
        if (updatedProperty.exact_address !== undefined) {
            console.log('🏠 Actualizando dirección exacta:', updatedProperty.exact_address);
            setLocationData(prev => ({
                ...prev,
                exact_address: updatedProperty.exact_address
            }));
        }

        // Actualizar configuración de privacidad
        if (updatedProperty.show_exact_location !== undefined) {
            console.log('👁️ Actualizando configuración de privacidad:', updatedProperty.show_exact_location);
            setLocationData(prev => ({
                ...prev,
                show_exact_location: updatedProperty.show_exact_location
            }));
        }
    };

    // NUEVA: función helper para generar slug con datos de ubicación
    const generateSlugFromLocationData = (name, locationPath) => {
        if (!name) return 'propiedad';

        const namePart = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .replace(/^-+|-+$/g, '');

        if (locationPath) {
            return `${locationPath}/${namePart}`;
        }

        return namePart;
    };

    // Calcular progreso y validaciones en tiempo real
    useEffect(() => {
        const newWarnings = [];

        if (!mediaData.description) {
            newWarnings.push('Agregar una descripción ayudará a atraer más clientes');
        }
        if (!detailsData.built_area) {
            newWarnings.push('El área construida es importante para los compradores');
        }
        if (!pricingData.sale_commission && !pricingData.rental_commission) {
            newWarnings.push('Define la comisión para facilitar el trabajo con otros agentes');
        }
        if (!locationData.exact_address) {
            newWarnings.push('Agregar la dirección exacta mejora la ubicación de la propiedad');
        }
        if (!mediaData.main_image_url && (!mediaData.images || mediaData.images.length === 0)) {
            newWarnings.push('Agregar imágenes es esencial para atraer clientes');
        }

        setWarnings(newWarnings);
    }, [basicData, locationData, detailsData, pricingData, projectData, mediaData]);

    // Configuración de tabs dinámicos
    const getTabs = () => {
        const baseTabs = [
            { id: 'informacion-basica', name: 'Información Básica', icon: Info, description: 'Datos generales, ubicación y mapa' },
            { id: 'contenido-multimedia', name: 'Contenido y Multimedia', icon: BookOpen, description: 'Descripción, imágenes y contenido' },
            { id: 'seo-optimizacion', name: 'SEO y Optimización', icon: Target, description: 'Optimización para motores de búsqueda' }
        ];

        if (basicData?.is_project) {
            baseTabs.push({ id: 'datos-proyecto', name: 'Datos de Proyecto', icon: Building2, description: 'Información específica del proyecto' });
        }

        return baseTabs;
    };

    const tabs = getTabs();

    // Función para cargar contactos desde Supabase
    const loadContacts = async () => {
        try {
            setContactsLoading(true);
            console.log('🔄 Cargando contactos desde Supabase...');

            const { data: contacts, error: contactsError } = await supabase
                .from('contacts')
                .select('id, name, email, phone, document_number, address, source')
                .order('name');

            if (contactsError) {
                console.warn('Error cargando contactos:', contactsError);
                return [];
            } else {
                console.log('✅ Contactos cargados:', contacts?.length || 0);
                return contacts?.map(contact => ({
                    value: contact.id.toString(),
                    label: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    document_number: contact.document_number,
                    source: contact.source,
                    address: contact.address
                })) || [];
            }
        } catch (error) {
            console.error('❌ Error cargando contactos:', error);
            return [];
        } finally {
            setContactsLoading(false);
        }
    };

    // Función para cargar catálogos desde Supabase Y location_insights
    const loadCatalogData = async () => {
        try {
            setCatalogLoading(true);
            console.log('🔄 Cargando catálogos desde Supabase y location_insights...');

            // Cargar catálogos tradicionales
            const [categoriesResult, agentsResult] = await Promise.all([
                supabase.from('property_categories').select('id, name').order('name'),
                supabase.from('users').select('id, first_name, last_name, email, phone').order('first_name')
            ]);

            // Cargar ubicaciones desde location_insights
            const { data: locationInsights, error: locationError } = await supabase
                .from('location_insights')
                .select('id, location_name, location_type, parent_location_id, coordinates')
                .eq('status', 'active')
                .order('location_type, location_name');

            if (locationError) {
                console.warn('Error cargando location_insights:', locationError);
            }

            console.log('📍 Location insights cargados:', locationInsights?.length || 0);

            // Procesar location_insights en estructura jerárquica
            const countries = [];
            const provinces = [];
            const cities = [];
            const sectors = [];

            if (locationInsights) {
                locationInsights.forEach(location => {
                    let coordinates = null;

                    // Parsear coordenadas correctamente desde PostgreSQL
                    if (location.coordinates) {
                        if (typeof location.coordinates === 'string') {
                            const coordsMatch = location.coordinates.match(/\(([^,]+),([^)]+)\)/);
                            if (coordsMatch) {
                                const lng = parseFloat(coordsMatch[1]); // Primer valor = longitud
                                const lat = parseFloat(coordsMatch[2]); // Segundo valor = latitud

                                // Validar que estén en RD
                                if (lat >= 17 && lat <= 20 && lng >= -73 && lng <= -68) {
                                    coordinates = { lat, lng };
                                    console.log(`✅ Coordenadas parseadas para ${location.location_name}:`, coordinates);
                                } else {
                                    console.warn(`⚠️ Coordenadas fuera de RD para ${location.location_name}:`, { lat, lng });
                                }
                            }
                        } else if (typeof location.coordinates === 'object') {
                            coordinates = location.coordinates;
                        }
                    }

                    const item = {
                        value: location.id.toString(),
                        label: location.location_name,
                        coordinates: coordinates // Coordenadas parseadas correctamente
                    };

                    switch (location.location_type) {
                        case 'country':
                            countries.push(item);
                            break;
                        case 'province':
                            provinces.push({
                                ...item,
                                country_id: location.parent_location_id?.toString()
                            });
                            break;
                        case 'city':
                            cities.push({
                                ...item,
                                province_id: location.parent_location_id?.toString()
                            });
                            break;
                        case 'sector':
                            sectors.push({
                                ...item,
                                city_id: location.parent_location_id?.toString()
                            });
                            break;
                    }
                });
            }

            // Fallback: usar catálogos tradicionales si location_insights está vacío
            let finalCountries = countries;
            let finalProvinces = provinces;
            let finalCities = cities;
            let finalSectors = sectors;

            if (countries.length === 0) {
                console.log('⚠️ No hay países en location_insights, usando catálogos tradicionales...');

                const [countriesResult, provincesResult, citiesResult, sectorsResult] = await Promise.all([
                    supabase.from('countries').select('id, name').order('name'),
                    supabase.from('provinces').select('id, name, country_id').order('name'),
                    supabase.from('cities').select('id, name, province_id').order('name'),
                    supabase.from('sectors').select('id, name, city_id').order('name')
                ]);

                if (!countriesResult.error && countriesResult.data) {
                    finalCountries = countriesResult.data.map(country => ({
                        value: country.id.toString(),
                        label: country.name
                    }));
                }
                if (!provincesResult.error && provincesResult.data) {
                    finalProvinces = provincesResult.data.map(province => ({
                        value: province.id.toString(),
                        label: province.name,
                        country_id: province.country_id?.toString()
                    }));
                }
                if (!citiesResult.error && citiesResult.data) {
                    finalCities = citiesResult.data.map(city => ({
                        value: city.id.toString(),
                        label: city.name,
                        province_id: city.province_id?.toString()
                    }));
                }
                if (!sectorsResult.error && sectorsResult.data) {
                    finalSectors = sectorsResult.data.map(sector => ({
                        value: sector.id.toString(),
                        label: sector.name,
                        city_id: sector.city_id?.toString()
                    }));
                }
            }

            setCatalogData({
                categories: categoriesResult.data?.map(cat => ({ value: cat.id.toString(), label: cat.name })) || [],
                countries: finalCountries,
                provinces: finalProvinces,
                cities: finalCities,
                sectors: finalSectors,
                agents: agentsResult.data?.map(agent => ({
                    value: agent.id.toString(),
                    label: `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email,
                    email: agent.email,
                    phone: agent.phone,
                    first_name: agent.first_name,
                    last_name: agent.last_name
                })) || [],
                contacts: []
            });

            console.log('✅ Catálogos cargados exitosamente:', {
                categories: categoriesResult.data?.length || 0,
                countries: finalCountries.length,
                provinces: finalProvinces.length,
                cities: finalCities.length,
                sectors: finalSectors.length,
                agents: agentsResult.data?.length || 0
            });

            // Datos de respaldo si no hay nada
            if (finalCountries.length === 0) {
                console.log('🔄 Agregando datos de respaldo...');
                setCatalogData(prev => ({
                    ...prev,
                    countries: [{ value: 'DR', label: 'República Dominicana' }]
                }));
            }

        } catch (error) {
            console.error('❌ Error cargando catálogos:', error);

            // Datos de respaldo completos
            setCatalogData({
                categories: [
                    { value: '1', label: 'Casa' },
                    { value: '2', label: 'Apartamento' },
                    { value: '3', label: 'Villa' },
                    { value: '4', label: 'Townhouse' },
                    { value: '5', label: 'Penthouse' },
                    { value: '6', label: 'Local Comercial' }
                ],
                countries: [{ value: 'DR', label: 'República Dominicana' }],
                provinces: [
                    { value: '1', label: 'Distrito Nacional', country_id: 'DR' },
                    { value: '2', label: 'Santo Domingo', country_id: 'DR' },
                    { value: '3', label: 'Santiago', country_id: 'DR' },
                    { value: '4', label: 'La Altagracia', country_id: 'DR' }
                ],
                cities: [],
                sectors: [],
                agents: [],
                contacts: []
            });

            console.log('🔄 Usando datos de respaldo completos');
        } finally {
            setCatalogLoading(false);
        }
    };

    // Función para cargar amenidades
    const loadAmenities = async () => {
        try {
            const { data: amenities, error: amenitiesError } = await supabase
                .from('amenities')
                .select('*')
                .order('category, name');

            if (amenitiesError) {
                console.warn('Error cargando amenidades:', amenitiesError);
            } else {
                setAvailableAmenities(amenities || []);
                console.log('✅ Amenidades cargadas:', amenities?.length || 0);
            }
        } catch (error) {
            console.error('❌ Error cargando amenidades:', error);
        }
    };

    // Funciones para manejar modales de selección
    const handleSelectAgent = (agent) => {
        setSelectedAgent(agent);
        setAgentData(prev => ({ ...prev, agent_id: agent.value }));
        setShowAgentModal(false);
    };

    const handleSelectContact = async (contact) => {
        setSelectedContact(contact);
        setAgentData(prev => ({ ...prev, contacto_id: contact.value }));
        setShowContactModal(false);
    };

    const handleRemoveAgent = () => {
        setSelectedAgent(null);
        setAgentData(prev => ({ ...prev, agent_id: '' }));
    };

    const handleRemoveContact = () => {
        setSelectedContact(null);
        setAgentData(prev => ({ ...prev, contacto_id: '' }));
    };

    // Cargar contactos al abrir el modal
    const handleOpenContactModal = async () => {
        if (catalogData.contacts.length === 0) {
            const loadedContacts = await loadContacts();
            setCatalogData(prev => ({ ...prev, contacts: loadedContacts }));
        }
        setShowContactModal(true);
    };

    // Función para calcular progreso
    const getProgressPercentage = () => {
        let completedFields = 0;
        const totalRequiredFields = 7;

        if (basicData.name) completedFields++;
        if (basicData.property_category_id) completedFields++;
        if (locationData.country_id) completedFields++;
        if (locationData.province_id) completedFields++;
        if (pricingData.sale_price || pricingData.rental_price) completedFields++;
        if (detailsData.bedrooms) completedFields++;
        if (detailsData.bathrooms) completedFields++;

        if (basicData.is_project) {
            const projectRequiredFields = 2;
            let projectCompletedFields = 0;

            if (projectData.developer?.name) projectCompletedFields++;
            if (projectData.total_units) projectCompletedFields++;

            const totalFields = totalRequiredFields + projectRequiredFields;
            const totalCompleted = completedFields + projectCompletedFields;
            return Math.round((totalCompleted / totalFields) * 100);
        }

        return Math.round((completedFields / totalRequiredFields) * 100);
    };

    const validateCurrentData = () => {
        const newErrors = {};

        if (!basicData.name) newErrors.name = 'El nombre es requerido';
        if (!basicData.property_category_id) newErrors.property_category_id = 'La categoría es requerida';
        if (!locationData.country_id) newErrors.country_id = 'El país es requerido';
        if (!locationData.province_id) newErrors.province_id = 'La provincia es requerida';

        if (!pricingData.sale_price && !pricingData.rental_price) {
            newErrors.pricing = 'Debe definir al menos un precio (venta o alquiler)';
        }

        if (basicData.is_project) {
            if (!projectData.total_units) {
                newErrors.total_units = 'Total de unidades es requerido para proyectos';
            }
            if (!projectData.developer?.name) {
                newErrors.developer_name = 'Nombre del desarrollador es requerido para proyectos';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generatePropertyCode = async () => {
        try {
            const { data: lastProperty } = await supabase
                .from('properties')
                .select('code')
                .order('code', { ascending: false })
                .limit(1);

            let nextCode = 1;
            if (lastProperty && lastProperty.length > 0) {
                nextCode = lastProperty[0].code + 1;
            }

            return nextCode;
        } catch (error) {
            console.error('Error generando código de propiedad:', error);
            return Date.now(); // Fallback usando timestamp
        }
    };

    // Guardar amenidades de la propiedad
    const savePropertyAmenities = async (propertyId, amenities) => {
        try {
            const amenityData = amenities.map((amenity) => ({
                property_id: propertyId,
                amenity_id: amenity.amenity_id,
                value: amenity.value || null
            }));

            const { error } = await supabase
                .from('property_amenities')
                .insert(amenityData);

            if (error) throw error;

            console.log('✅ Amenidades guardadas exitosamente');
        } catch (error) {
            console.error('❌ Error guardando amenidades:', error);
            throw error;
        }
    };

    // Guardar imágenes de la propiedad
    const savePropertyImages = async (propertyId, images) => {
        try {
            const imageData = images.map((image, index) => ({
                property_id: propertyId,
                url: image.url,
                title: image.title || `Imagen ${index + 1}`,
                description: image.description || null,
                is_main: image.isMain || false,
                sort_order: index
            }));

            const { error } = await supabase
                .from('property_images')
                .insert(imageData);

            if (error) throw error;

            console.log('✅ Imágenes guardadas exitosamente');
        } catch (error) {
            console.error('❌ Error guardando imágenes:', error);
            throw error;
        }
    };

    // Crear desarrollador si es necesario
    const createDeveloper = async (developerData) => {
        try {
            const { data: newDeveloper, error } = await supabase
                .from('developers')
                .insert([{
                    name: developerData.name,
                    legal_name: developerData.legal_name,
                    email: developerData.email,
                    phone: developerData.phone,
                    website: developerData.website,
                    years_experience: developerData.years_experience ? parseInt(developerData.years_experience) : null,
                    description: developerData.description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return newDeveloper;
        } catch (error) {
            console.error('❌ Error creando desarrollador:', error);
            throw error;
        }
    };

    // Crear datos del proyecto expandidos
    const createProjectDetailsExpanded = async (propertyId, projectData, developerId = null) => {
        try {
            const projectPayload = {
                property_id: propertyId,
                total_units: projectData.total_units ? parseInt(projectData.total_units) : null,
                available_units: projectData.available_units ? parseInt(projectData.available_units) : null,
                completion_percentage: projectData.completion_percentage ? parseInt(projectData.completion_percentage) : 0,
                estimated_completion_date: projectData.estimated_completion_date || null,
                guarantees: projectData.guarantees || [],
                developer_id: developerId,
                availability_external_url: projectData.availability_external_url || null,
                availability_external_type: projectData.availability_external_type || null,
                availability_external_description: projectData.availability_external_description || null,
                availability_auto_sync: projectData.availability_auto_sync || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: projectDetails, error } = await supabase
                .from('project_details')
                .insert([projectPayload])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Project details creado:', projectDetails);
            return projectDetails;
        } catch (error) {
            console.error('❌ Error creando project details:', error);
            throw error;
        }
    };

    // Crear tipologías del proyecto
    const createProjectTypologies = async (projectId, typologies) => {
        if (!typologies || typologies.length === 0) return;

        try {
            const typologiesData = typologies.map((typology, index) => ({
                project_id: projectId,
                name: typology.name,
                description: typology.description,
                bedrooms: typology.bedrooms ? parseInt(typology.bedrooms) : null,
                bathrooms: typology.bathrooms ? parseFloat(typology.bathrooms) : null,
                built_area: typology.built_area ? parseFloat(typology.built_area) : null,
                balcony_area: typology.balcony_area ? parseFloat(typology.balcony_area) : null,
                sale_price_from: typology.sale_price_from ? parseFloat(typology.sale_price_from) : null,
                sale_price_to: typology.sale_price_to ? parseFloat(typology.sale_price_to) : null,
                sale_currency: typology.sale_currency || 'USD',
                total_units: typology.total_units ? parseInt(typology.total_units) : null,
                available_units: typology.available_units ? parseInt(typology.available_units) : null,
                is_sold_out: typology.is_sold_out || false,
                sort_order: index,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('project_typologies')
                .insert(typologiesData);

            if (error) throw error;
            console.log('✅ Tipologías creadas:', typologiesData.length);
        } catch (error) {
            console.error('❌ Error creando tipologías:', error);
            throw error;
        }
    };

    // Crear fases del proyecto
    const createProjectPhases = async (projectId, phases) => {
        if (!phases || phases.length === 0) return;

        try {
            const phasesData = phases.map((phase, index) => ({
                project_id: projectId,
                phase_name: phase.phase_name,
                description: phase.description,
                construction_start: phase.construction_start || null,
                estimated_delivery: phase.estimated_delivery || null,
                total_units: phase.total_units ? parseInt(phase.total_units) : null,
                available_units: phase.available_units ? parseInt(phase.available_units) : null,
                status: phase.status || 'planning',
                completion_percentage: phase.completion_percentage ? parseInt(phase.completion_percentage) : 0,
                sort_order: index,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('project_phases')
                .insert(phasesData);

            if (error) throw error;
            console.log('✅ Fases creadas:', phasesData.length);
        } catch (error) {
            console.error('❌ Error creando fases:', error);
            throw error;
        }
    };

    // Crear planes de pago del proyecto
    const createProjectPaymentPlans = async (projectId, paymentPlans) => {
        if (!paymentPlans || paymentPlans.length === 0) return;

        try {
            const plansData = paymentPlans.map((plan, index) => ({
                project_id: projectId,
                plan_name: plan.plan_name,
                description: plan.description,
                reservation_amount: plan.reservation_amount ? parseFloat(plan.reservation_amount) : null,
                reservation_currency: plan.reservation_currency || 'USD',
                separation_percentage: plan.separation_percentage ? parseFloat(plan.separation_percentage) : null,
                construction_percentage: plan.construction_percentage ? parseFloat(plan.construction_percentage) : null,
                construction_frequency: plan.construction_frequency || 'monthly',
                delivery_percentage: plan.delivery_percentage ? parseFloat(plan.delivery_percentage) : null,
                is_default: index === 0, // El primer plan es el por defecto
                is_active: plan.is_active !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('project_payment_plans')
                .insert(plansData);

            if (error) throw error;
            console.log('✅ Planes de pago creados:', plansData.length);
        } catch (error) {
            console.error('❌ Error creando planes de pago:', error);
            throw error;
        }
    };

    const saveProperty = async () => {
        if (!validateCurrentData()) {
            return;
        }

        try {
            setLoading(true);

            // Generar código único numérico
            const propertyCode = await generatePropertyCode();

            const propertyPayload = {
                // Información básica
                name: basicData.name,
                private_name: basicData.private_name,
                code: propertyCode,
                property_status: basicData.property_status,
                is_project: basicData.is_project,

                // Categoría y ubicación
                category_id: basicData.property_category_id,
                country_id: locationData.country_id,
                province_id: locationData.province_id,
                city_id: locationData.city_id || null,
                sector_id: locationData.sector_id || null,
                exact_address: locationData.exact_address,
                show_exact_location: locationData.show_exact_location,

                // Agentes
                agent_id: agentData.agent_id || null,
                contacto_id: agentData.contacto_id || null,

                // Coordenadas
                exact_coordinates: locationCoordinates ?
                    `(${locationCoordinates.lng},${locationCoordinates.lat})` : null, // PostgreSQL: (lng, lat)

                // Características
                bedrooms: detailsData.bedrooms ? parseInt(detailsData.bedrooms) : null,
                bathrooms: detailsData.bathrooms ? parseFloat(detailsData.bathrooms) : null,
                parking_spots: detailsData.parking_spots ? parseInt(detailsData.parking_spots) : null,
                built_area: detailsData.built_area ? parseFloat(detailsData.built_area) : null,
                land_area: detailsData.land_area ? parseFloat(detailsData.land_area) : null,
                nivel: detailsData.nivel ? parseInt(detailsData.nivel) : null,

                // Precios principales
                sale_price: pricingData.sale_price ? parseFloat(pricingData.sale_price) : null,
                sale_currency: pricingData.sale_currency,
                rental_price: pricingData.rental_price ? parseFloat(pricingData.rental_price) : null,
                rental_currency: pricingData.rental_currency,
                sale_commission: pricingData.sale_commission ? parseFloat(pricingData.sale_commission) : null,
                rental_commission: pricingData.rental_commission ? parseFloat(pricingData.rental_commission) : null,

                // Precios amueblados
                furnished_sale_price: pricingData.furnished_sale_price ? parseFloat(pricingData.furnished_sale_price) : null,
                furnished_sale_currency: pricingData.furnished_sale_currency,
                furnished_rental_price: pricingData.furnished_rental_price ? parseFloat(pricingData.furnished_rental_price) : null,
                furnished_rental_currency: pricingData.furnished_rental_currency,

                // Alquiler temporal
                temp_rental_price: pricingData.temp_rental_price ? parseFloat(pricingData.temp_rental_price) : null,
                temp_rental_currency: pricingData.temp_rental_currency,

                // Otros costos
                maintenance_price: pricingData.maintenance_price ? parseFloat(pricingData.maintenance_price) : null,
                maintenance_currency: pricingData.maintenance_currency,

                // Contenido multimedia
                description: mediaData.description,
                main_image_url: mediaData.main_image_url,
                gallery_images_url: mediaData.gallery_images?.length > 0 ?
                    mediaData.gallery_images.join(',') : null,

                // SEO - MEJORADO: usar slug con ubicación automática
                slug_url: seoData.slug_url || generateSlugFromLocationData(basicData.name, seoData.location_path),

                // Metadatos
                availability: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('💾 Guardando propiedad:', propertyPayload);

            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .insert([propertyPayload])
                .select()
                .single();

            if (propertyError) throw propertyError;

            console.log('✅ Propiedad creada:', propertyData);

            // Guardar amenidades si existen
            if (propertyAmenities && propertyAmenities.length > 0) {
                console.log('🏷️ Guardando amenidades...');
                await savePropertyAmenities(propertyData.id, propertyAmenities);
            }

            // Guardar imágenes si existen
            if (mediaData.images && mediaData.images.length > 0) {
                console.log('📷 Guardando imágenes...');
                await savePropertyImages(propertyData.id, mediaData.images);
            }

            // Si es proyecto, crear datos completos del proyecto
            if (basicData.is_project) {
                console.log('🏗️ Creando datos completos del proyecto...');

                // 1. Crear desarrollador si tiene datos
                let developerId = null;
                if (projectData.developer?.name) {
                    console.log('👤 Creando desarrollador...');
                    const developer = await createDeveloper(projectData.developer);
                    developerId = developer.id;
                }

                // 2. Crear project_details con desarrollador asociado
                const projectDetails = await createProjectDetailsExpanded(propertyData.id, projectData, developerId);

                // 3. Crear tipologías si existen
                if (projectData.typologies && projectData.typologies.length > 0) {
                    console.log('🏠 Creando tipologías...');
                    await createProjectTypologies(projectDetails.id, projectData.typologies);
                }

                // 4. Crear fases si existen
                if (projectData.phases && projectData.phases.length > 0) {
                    console.log('📅 Creando fases...');
                    await createProjectPhases(projectDetails.id, projectData.phases);
                }

                // 5. Crear planes de pago si existen
                if (projectData.payment_plans && projectData.payment_plans.length > 0) {
                    console.log('💳 Creando planes de pago...');
                    await createProjectPaymentPlans(projectDetails.id, projectData.payment_plans);
                }
            }

            alert(`¡Propiedad "${basicData.name}" creada exitosamente!\nCódigo: ${propertyCode}${seoData.location_path ? `\nURL SEO: /comprar/${seoData.slug_url}` : ''}`);

            if (onComplete) {
                onComplete(propertyData);
            } else if (onBack) {
                onBack();
            }

        } catch (error) {
            console.error('❌ Error guardando propiedad:', error);
            alert('Error al guardar la propiedad: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Mostrar loading mientras cargan los catálogos
    if (catalogLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando datos del sistema...</p>
                </div>
            </div>
        );
    }

    // Render contenido de cada tab
    const renderTabContent = () => {
        switch (currentTab) {
            case 'informacion-basica':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Información General */}
                            <Card
                                title="Información General"
                                icon={<Home className="w-5 h-5" />}
                            >
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Nombre de la propiedad"
                                            value={basicData.name}
                                            onChange={(value) => setBasicData(prev => ({ ...prev, name: value }))}
                                            placeholder="Villa Paradise en Punta Cana"
                                            required
                                            error={errors.name}
                                        />

                                        <Input
                                            label="Nombre privado (interno)"
                                            value={basicData.private_name}
                                            onChange={(value) => setBasicData(prev => ({ ...prev, private_name: value }))}
                                            placeholder="Casa de Juan Pérez"
                                        />

                                        <Select
                                            label="Categoría"
                                            value={basicData.property_category_id}
                                            onChange={(value) => setBasicData(prev => ({ ...prev, property_category_id: value }))}
                                            options={catalogData.categories}
                                            placeholder="Seleccionar categoría"
                                            required
                                            error={errors.property_category_id}
                                        />

                                        <Select
                                            label="Estado"
                                            value={basicData.property_status}
                                            onChange={(value) => setBasicData(prev => ({ ...prev, property_status: value }))}
                                            options={[
                                                { value: 'Borrador', label: 'Borrador' },
                                                { value: 'Publicada', label: 'Publicada' },
                                                { value: 'Pre-venta', label: 'Pre-venta' },
                                                { value: 'Vendida', label: 'Vendida' },
                                                { value: 'Suspendida', label: 'Suspendida' }
                                            ]}
                                            placeholder="Seleccionar estado"
                                        />
                                    </div>

                                    {/* Switch para proyecto */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-md font-medium text-gray-900">Tipo de Propiedad</h4>
                                                <p className="text-sm text-gray-500">¿Es parte de un proyecto inmobiliario?</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBasicData(prev => ({ ...prev, is_project: !prev.is_project }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${basicData.is_project ? 'bg-orange-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${basicData.is_project ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                        {basicData.is_project && (
                                            <div className="mt-4">
                                                <Badge variant="primary">Esta propiedad será parte de un proyecto</Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sección de Agentes */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                            <Users className="w-5 h-5 mr-2 text-gray-600" />
                                            Asignación de Responsables
                                        </h4>
                                        <div className="space-y-4">
                                            {/* Asesor Captador */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Asesor Captador
                                                </label>
                                                {selectedAgent ? (
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {selectedAgent.label}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {selectedAgent.email || 'Sin email'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => setShowAgentModal(true)}
                                                                className="text-orange-600 hover:text-orange-700 text-sm"
                                                            >
                                                                Cambiar
                                                            </button>
                                                            <button
                                                                onClick={handleRemoveAgent}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setShowAgentModal(true)}
                                                        icon={<Plus className="w-4 h-4" />}
                                                        className="w-full justify-center"
                                                    >
                                                        Seleccionar Asesor
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Encargado/Responsable */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Encargado/Responsable
                                                </label>
                                                {selectedContact ? (
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {selectedContact.label}
                                                                </p>
                                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                    {selectedContact.email && (
                                                                        <span>{selectedContact.email}</span>
                                                                    )}
                                                                    {selectedContact.phone && (
                                                                        <span>📞 {selectedContact.phone}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={handleOpenContactModal}
                                                                className="text-blue-600 hover:text-blue-700 text-sm"
                                                            >
                                                                Cambiar
                                                            </button>
                                                            <button
                                                                onClick={handleRemoveContact}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleOpenContactModal}
                                                        icon={<Plus className="w-4 h-4" />}
                                                        className="w-full justify-center"
                                                        disabled={contactsLoading}
                                                    >
                                                        {contactsLoading ? 'Cargando...' : 'Seleccionar Encargado'}
                                                    </Button>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Contacto de la tabla CRM que será el responsable de esta propiedad
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* CAMBIO PRINCIPAL: SmartLocationManager en lugar de PropertyLocationManager */}
                            <SmartLocationManager
                                property={tempProperty}
                                onLocationUpdate={handleLocationUpdate}
                                mode="create"
                            />
                        </div>

                        {/* Sidebar con campos */}
                        <div className="lg:col-span-1">
                            <SidebarFields
                                detailsData={detailsData}
                                setDetailsData={setDetailsData}
                                pricingData={pricingData}
                                setPricingData={setPricingData}
                                errors={errors}
                                availableAmenities={availableAmenities}
                                propertyAmenities={propertyAmenities}
                                setPropertyAmenities={setPropertyAmenities}
                            />
                        </div>
                    </div>
                );

            case 'contenido-multimedia':
                return (
                    <div className="space-y-8">
                        {/* Descripción */}
                        <Card title="Descripción de la Propiedad" icon={<BookOpen className="w-5 h-5" />}>
                            <WYSIWYGSEOEditor
                                value={mediaData.description}
                                onChange={(value) => setMediaData(prev => ({ ...prev, description: value }))}
                                placeholder="Describe las características, ubicación y beneficios de la propiedad..."
                                cities={catalogData.cities || []}
                                propertyTypes={catalogData.categories?.map(cat => cat.label) || []}
                            />
                        </Card>

                        {/* Imágenes */}
                        <Card title="Galería de Imágenes" icon={<Camera className="w-5 h-5" />}>
                            <ImageUploader
                                images={mediaData.images}
                                onImagesChange={(images) => setMediaData(prev => ({ ...prev, images }))}
                                maxImages={15}
                            />
                        </Card>
                    </div>
                );

            case 'seo-optimizacion':
                return (
                    <div className="space-y-8">
                        <Card title="Optimización SEO" icon={<Target className="w-5 h-5" />}>
                            <SEOManager
                                propertyData={{
                                    name: basicData.name,
                                    property_category_id: basicData.property_category_id,
                                    sale_price: pricingData.sale_price,
                                    rental_price: pricingData.rental_price,
                                    sale_currency: pricingData.sale_currency,
                                    bedrooms: detailsData.bedrooms,
                                    bathrooms: detailsData.bathrooms
                                }}
                                onSEOChange={(data) => setSeoData(prev => ({ ...prev, ...data }))}
                            />
                        </Card>
                    </div>
                );

            case 'datos-proyecto':
                return (
                    <div className="space-y-8">
                        <Card title="Configuración Completa del Proyecto" icon={<Building2 className="w-5 h-5" />}>
                            <ProjectComprehensiveSetup
                                projectData={projectData}
                                onProjectDataChange={setProjectData}
                                errors={errors}
                                catalogData={catalogData}
                            />
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {basicData.name || 'Nueva Propiedad'}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {basicData.is_project ? 'Proyecto inmobiliario' : 'Propiedad individual'}
                                    {seoData.location_path && (
                                        <span className="ml-2 text-green-600">
                                            • SEO: /{seoData.location_path}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                Progreso: {getProgressPercentage()}%
                            </div>
                            <Button
                                onClick={saveProperty}
                                disabled={loading || Object.keys(errors).length > 0}
                                icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                variant="primary"
                            >
                                {loading ? 'Guardando...' : 'Crear Propiedad'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setCurrentTab(tab.id)}
                                    className={`${isActive
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">{tab.name}</span>
                                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {renderTabContent()}
            </div>

            {/* Modales de Selección */}
            <AgentSelectionModal
                isOpen={showAgentModal}
                onClose={() => setShowAgentModal(false)}
                agents={catalogData.agents}
                onSelect={handleSelectAgent}
            />

            <ContactSelectionModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                contacts={catalogData.contacts}
                onSelect={handleSelectContact}
                loading={contactsLoading}
            />
        </div>
    );
};

export default PropertyCreateWizard;