import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Home, Building, BookOpen, Target, BarChart3, FileText,
    ExternalLink, MapPin, Bed, Bath, Car, Calendar, User, Phone, Mail,
    ChevronLeft, ChevronRight, Star, Award, Globe, MapPinIcon,
    DollarSign, Ruler, Layers, Wifi, Car as CarIcon, Waves,
    TreePine, ShieldCheck, Clock, Eye, Edit, Copy, Share2,
    Instagram, Facebook, Linkedin, Building2, Users, TrendingUp,
    X, Plus, MessageCircle
} from 'lucide-react';

import PropertyGeneral from './PropertyGeneral';
import PropertyProject from './PropertyProject';
import PropertyContent from './PropertyContent';
import PropertySEO from './PropertySEO';
import PropertyGestion from './PropertyGestion';
import PropertyDocuments from './PropertyDocuments';
import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';
import PropertyLocationManager from './PropertyLocationManager';
import PropertyEditModal from './PropertyEditModal';
import { processPropertyImages } from '../utils/imageProcessor';
import { supabase } from '../services/api';

// Componente Button
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-orange-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
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

// Componente Badge
const Badge = ({ children, className = '', variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-orange-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente para renderizar HTML de descripción de forma hermosa
const DescriptionRenderer = ({ htmlContent, onEdit }) => {
    if (!htmlContent || !htmlContent.trim()) {
        return (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Sin descripción</p>
                <p className="text-sm">Agrega una descripción atractiva para mejorar esta propiedad</p>
                {onEdit && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-1" />
                        Agregar Descripción
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

// Componente de Galería Mejorada
const PropertyImageGallery = ({ property }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // ✅ Usar imageProcessor centralizado (elimina ~85 líneas de código duplicado)
        const propertyImages = processPropertyImages(property);
        setImages(propertyImages);
        setCurrentImageIndex(0);
    }, [property]);

    // ✅ Protección: Si currentImageIndex está fuera de rango, resetear a 0
    useEffect(() => {
        if (images.length > 0 && currentImageIndex >= images.length) {
            console.warn(`⚠️ currentImageIndex (${currentImageIndex}) fuera de rango. Reseteando a 0.`);
            setCurrentImageIndex(0);
        }
    }, [images, currentImageIndex]);

    const nextImage = (e) => {
        e?.stopPropagation();
        e?.preventDefault();

        if (images.length > 0) {
            setCurrentImageIndex((prev) => {
                // Protección: asegurar que prev está dentro del rango antes de calcular
                const safePrev = Math.min(prev, images.length - 1);
                const nextIndex = (safePrev + 1) % images.length;
                console.log(`🔄 Next: ${safePrev + 1} → ${nextIndex + 1}/${images.length}`);
                return nextIndex;
            });
        }
    };

    const prevImage = (e) => {
        e?.stopPropagation();
        e?.preventDefault();

        if (images.length > 0) {
            setCurrentImageIndex((prev) => {
                // Protección: asegurar que prev está dentro del rango antes de calcular
                const safePrev = Math.min(prev, images.length - 1);
                const prevIndex = (safePrev - 1 + images.length) % images.length;
                console.log(`🔄 Prev: ${safePrev + 1} → ${prevIndex + 1}/${images.length}`);
                return prevIndex;
            });
        }
    };

    if (images.length === 0) {
        return (
            <div className="relative h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <Home className="w-16 h-16 mx-auto mb-2" />
                    <p>Sin imágenes disponibles</p>
                    <p className="text-sm mt-1">Agrega imágenes para mejorar esta propiedad</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="relative h-80 bg-gray-200 rounded-lg overflow-hidden group">
                {(() => {
                    // ✅ Protección: Asegurar que el índice está dentro del rango
                    const safeIndex = Math.min(currentImageIndex, images.length - 1);
                    const currentImage = images[safeIndex];
                    const hasValidImage = currentImage && currentImage.url && currentImage.url.trim();

                    if (!hasValidImage && images.length > 0) {
                        console.log('⚠️ Sin imagen válida en índice:', safeIndex, 'de', images.length);
                    }

                    if (hasValidImage) {
                        return (
                            <img
                                src={currentImage.url}
                                alt={currentImage.title || property.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                                onError={(e) => {
                                    console.error('❌ Error cargando imagen:', currentImage.url.substring(0, 80) + '...');
                                    e.target.style.display = 'none';
                                    e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'flex');
                                }}
                            />
                        );
                    } else {
                        return (
                            <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-12 h-12 text-gray-400" />
                            </div>
                        );
                    }
                })()}

                <div className="w-full h-full items-center justify-center hidden">
                    <Home className="w-12 h-12 text-gray-400" />
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 z-10 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 z-10 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {currentImageIndex + 1}/{images.length}
                        </div>

                        <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setCurrentImageIndex(index);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentImageIndex
                                        ? 'bg-white'
                                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-4 right-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                    <Eye className="w-5 h-5" />
                </button>
            </div>

            {/* Modal Fullscreen */}
            {isFullscreen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {(() => {
                            // ✅ Protección: Asegurar índice seguro en modal fullscreen
                            const safeIndex = Math.min(currentImageIndex, images.length - 1);
                            const currentImage = images[safeIndex];

                            if (!currentImage || !currentImage.url) {
                                return (
                                    <div className="text-white text-center">
                                        <Home className="w-16 h-16 mx-auto mb-4" />
                                        <p>Imagen no disponible</p>
                                    </div>
                                );
                            }

                            return (
                                <img
                                    src={currentImage.url}
                                    alt={currentImage.title || property.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            );
                        })()}

                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-4 right-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// Componente de Información del Asesor
const AgentInfoCard = ({ agent, agentStats }) => {
    if (!agent) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Sin asesor asignado</p>
                    <p className="text-sm">Asigna un asesor para mejorar la gestión</p>
                </div>
            </div>
        );
    }

    const fullName = `${agent.first_name} ${agent.last_name}`.trim();
    const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();

    const experienceLevel = agentStats?.experience_level || 'Nuevo';
    const levelColors = {
        'Nuevo': 'bg-blue-100 text-blue-800',
        'Junior': 'bg-green-100 text-green-800',
        'Intermedio': 'bg-orange-100 text-orange-800',
        'Senior': 'bg-purple-100 text-purple-800',
        'Experto': 'bg-red-100 text-red-800'
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header del Card */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Asesor Captador</h3>
            </div>

            <div className="p-4">
                <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {agent.profile_photo_url ? (
                            <>
                                <img
                                    src={agent.profile_photo_url}
                                    alt={fullName}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-gray-200 items-center justify-center hidden">
                                    <span className="text-orange-600 font-bold text-lg">{initials}</span>
                                </div>
                            </>
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-gray-200 flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-lg">{initials}</span>
                            </div>
                        )}
                    </div>

                    {/* Info Principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{fullName}</h4>
                            <Badge className={levelColors[experienceLevel] || levelColors['Nuevo']}>
                                {experienceLevel}
                            </Badge>
                        </div>

                        {agent.position && (
                            <p className="text-sm text-gray-600 mb-2">{agent.position}</p>
                        )}

                        {/* Idiomas */}
                        {agent.languages && Array.isArray(agent.languages) && (
                            <div className="flex items-center space-x-1 mb-2 text-xs text-gray-600">
                                <Globe className="w-3 h-3" />
                                <span>{agent.languages.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Acciones de Contacto */}
                    <div className="flex flex-col space-y-1">
                        {agent.phone && (
                            <button
                                onClick={() => window.open(`tel:${agent.phone}`, '_self')}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title={`Llamar a ${agent.phone}`}
                            >
                                <Phone className="w-4 h-4" />
                            </button>
                        )}
                        {agent.email && (
                            <button
                                onClick={() => window.open(`mailto:${agent.email}`, '_self')}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={`Enviar email a ${agent.email}`}
                            >
                                <Mail className="w-4 h-4" />
                            </button>
                        )}
                        {agent.phone && (
                            <button
                                onClick={() => window.open(`https://wa.me/${agent.phone.replace(/\D/g, '')}`, '_blank')}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Enviar WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Información Detallada */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">

                    {/* Descripción de Especialidad */}
                    {agent.specialty_description && (
                        <div>
                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                <Award className="w-3 h-3 mr-1" />
                                <span className="font-medium">Especialidad</span>
                            </div>
                            <div className="text-sm text-gray-900">{agent.specialty_description}</div>
                        </div>
                    )}

                    {/* Estadísticas de Performance */}
                    {(agentStats?.years_experience || agentStats?.sales_count || agentStats?.sales_per_year) && (
                        <div>
                            <div className="text-xs text-gray-500 font-medium mb-2">Performance</div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                {agentStats?.years_experience && (
                                    <div className="bg-gray-50 rounded p-2">
                                        <div className="text-lg font-bold text-gray-900">{agentStats.years_experience}</div>
                                        <div className="text-xs text-gray-600">años exp.</div>
                                    </div>
                                )}
                                {agentStats?.sales_count && (
                                    <div className="bg-gray-50 rounded p-2">
                                        <div className="text-lg font-bold text-gray-900">{agentStats.sales_count}</div>
                                        <div className="text-xs text-gray-600">ventas</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Equipo/Empresa */}
                    {agentStats?.years_in_company && (
                        <div>
                            <div className="text-xs text-gray-500 font-medium mb-1">En la empresa</div>
                            <div className="text-sm text-gray-900">
                                {agentStats.years_in_company} años
                            </div>
                        </div>
                    )}

                    {/* Fecha de Creación */}
                    <div>
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span className="font-medium">Miembro desde</span>
                        </div>
                        <div className="text-sm text-gray-900">
                            {agent.created_at ? new Date(agent.created_at).toLocaleDateString('es-DO', {
                                year: 'numeric',
                                month: 'long'
                            }) : 'No disponible'}
                        </div>
                    </div>

                    {/* Redes Sociales */}
                    {(agent.instagram_url || agent.facebook_url || agent.linkedin_url) && (
                        <div className="flex space-x-2 pt-2 border-t border-gray-100">
                            {agent.instagram_url && (
                                <a href={agent.instagram_url} target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-pink-500 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {agent.facebook_url && (
                                <a href={agent.facebook_url} target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-blue-600 transition-colors">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            )}
                            {agent.linkedin_url && (
                                <a href={agent.linkedin_url} target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-blue-700 transition-colors">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente Principal
const PropertyDetail = ({ propertyId, onBack, onPropertyUpdate }) => {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [agentStats, setAgentStats] = useState(null);
    const [propertyAmenities, setPropertyAmenities] = useState([]);
    const [propertyTags, setPropertyTags] = useState([]);
    const [contactInfo, setContactInfo] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false); // Rastrea si se editó la propiedad

    useEffect(() => {
        if (propertyId) {
            fetchPropertyData();
        }
    }, [propertyId]);

    const fetchPropertyData = async () => {
        try {
            setLoading(true);
            setError('');

            // Cargar datos principales de la propiedad con specialty_description
            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .select(`
                    *,
                    property_categories(name),
                    countries(name),
                    provinces(name),
                    cities(name),
                    sectors(name),
                    users!properties_agent_id_fkey(
                        id, first_name, last_name, position, email, phone,
                        facebook_url, instagram_url, linkedin_url, biography,
                        languages, specialty_cities, specialty_sectors, 
                        specialty_property_categories, specialty_description,
                        profile_photo_url, created_at
                    ),
                    property_images(
                        id, url, title, description, is_main, sort_order
                    )
                `)
                .eq('id', propertyId)
                .single();

            if (propertyError) throw propertyError;
            setProperty(propertyData);

            console.log('🏠 Propiedad cargada:', propertyData);

            // CARGAR INFORMACIÓN DEL CONTACTO - CORREGIDO PARA ESTRUCTURA REAL
            if (propertyData.contacto_id) {
                console.log('🔍 Cargando contacto con ID:', propertyData.contacto_id);

                try {
                    // Primero verificar qué columnas existen en contacts
                    const { data: contactData, error: contactError } = await supabase
                        .from('contacts')
                        .select('*') // Seleccionar todas las columnas disponibles
                        .eq('id', propertyData.contacto_id)
                        .single();

                    if (contactError) {
                        console.error('❌ Error en consulta de contacto:', contactError);
                        console.error('❌ Detalles del error:', {
                            message: contactError.message,
                            details: contactError.details,
                            hint: contactError.hint,
                            code: contactError.code
                        });

                        setContactInfo({
                            error: 'Error cargando contacto: ' + contactError.message,
                            id: propertyData.contacto_id
                        });
                    } else if (contactData) {
                        console.log('✅ Contacto cargado exitosamente:', contactData);
                        console.log('📋 Columnas disponibles:', Object.keys(contactData));
                        setContactInfo(contactData);
                    } else {
                        console.log('⚠️ No se encontraron datos del contacto');
                        setContactInfo({
                            error: 'Sin datos del contacto',
                            id: propertyData.contacto_id
                        });
                    }
                } catch (err) {
                    console.error('❌ Error inesperado cargando contacto:', err);
                    setContactInfo({
                        error: 'Error de conexión: ' + err.message,
                        id: propertyData.contacto_id
                    });
                }
            } else {
                console.log('⚠️ La propiedad no tiene contacto_id asignado');
                setContactInfo(null);
            }

            // Cargar stats del agente si existe
            if (propertyData.agent_id) {
                const { data: statsData } = await supabase
                    .from('user_stats_view')
                    .select('*')
                    .eq('id', propertyData.agent_id)
                    .single();

                setAgentStats(statsData);
            }

            // DEBUGGING EXHAUSTIVO DE AMENIDADES - CORREGIDO SIN DESCRIPTION
            console.log('🔍 === INICIO DEBUG AMENIDADES ===');
            console.log('🏠 Propiedad ID:', propertyId);
            console.log('🏠 Propiedad completa:', propertyData);

            // Primero, verificar si hay registros en property_amenities para esta propiedad
            console.log('🔍 Paso 1: Verificando registros en property_amenities...');
            const { data: rawAmenitiesCheck, error: rawError } = await supabase
                .from('property_amenities')
                .select('*')
                .eq('property_id', propertyId);

            console.log('📊 Registros RAW en property_amenities:', rawAmenitiesCheck);
            console.log('❓ Error en consulta RAW:', rawError);

            if (rawAmenitiesCheck && rawAmenitiesCheck.length > 0) {
                console.log('✅ Se encontraron', rawAmenitiesCheck.length, 'registros de amenidades');
                rawAmenitiesCheck.forEach((item, index) => {
                    console.log(`📝 Registro ${index + 1}:`, {
                        id: item.id,
                        property_id: item.property_id,
                        amenity_id: item.amenity_id,
                        value: item.value
                    });
                });
            } else {
                console.log('❌ NO se encontraron registros en property_amenities para esta propiedad');
            }

            // Segundo, hacer la consulta con JOIN - SIN DESCRIPTION
            console.log('🔍 Paso 2: Haciendo consulta con JOIN (SIN description)...');
            const { data: amenitiesData, error: amenitiesError } = await supabase
                .from('property_amenities')
                .select(`
                    id, 
                    value,
                    amenities(id, name, icon, category)
                `)
                .eq('property_id', propertyId);

            console.log('📊 Resultado de consulta con JOIN:', amenitiesData);
            console.log('❓ Error en consulta con JOIN:', amenitiesError);

            if (amenitiesError) {
                console.error('❌ Error cargando amenidades:', amenitiesError);
                console.error('❌ Código de error:', amenitiesError.code);
                console.error('❌ Mensaje:', amenitiesError.message);
                console.error('❌ Detalles:', amenitiesError.details);
                console.error('❌ Hint:', amenitiesError.hint);
                setPropertyAmenities([]);
            } else {
                console.log('✅ Consulta con JOIN exitosa');
                console.log('📊 Total elementos retornados:', amenitiesData?.length || 0);

                if (amenitiesData && amenitiesData.length > 0) {
                    console.log('🔍 Analizando cada elemento...');
                    amenitiesData.forEach((item, index) => {
                        console.log(`📝 Elemento ${index + 1}:`, {
                            id: item.id,
                            value: item.value,
                            amenities: item.amenities,
                            amenities_exists: !!item.amenities,
                            amenities_name: item.amenities?.name,
                            amenities_icon: item.amenities?.icon,
                            amenities_category: item.amenities?.category
                        });
                    });

                    // Filtrar amenidades válidas
                    const validAmenities = amenitiesData.filter(item => {
                        const isValid = item && item.amenities && item.amenities.name;
                        console.log(`✅ Elemento ${item.id} es válido:`, isValid);
                        return isValid;
                    });

                    console.log('✅ Amenidades válidas después del filtrado:', validAmenities.length);

                    if (validAmenities.length > 0) {
                        console.log('🎉 Estableciendo amenidades en el estado:', validAmenities);
                        console.log('🎉 Primera amenidad procesada:', {
                            id: validAmenities[0].id,
                            value: validAmenities[0].value,
                            name: validAmenities[0].amenities.name,
                            icon: validAmenities[0].amenities.icon,
                            category: validAmenities[0].amenities.category
                        });
                    }

                    setPropertyAmenities(validAmenities);
                } else {
                    console.log('❌ No hay datos en la respuesta de la consulta con JOIN');
                    setPropertyAmenities([]);
                }
            }

            console.log('🔍 === FIN DEBUG AMENIDADES ===');

            // Cargar tags
            const { data: tagsData } = await supabase
                .from('content_tags')
                .select(`
                    id, weight, auto_generated,
                    tags(id, name, slug, category, display_name, description, icon, color)
                `)
                .eq('content_id', propertyId)
                .eq('content_type', 'property');

            setPropertyTags(tagsData || []);

        } catch (err) {
            console.error('Error al cargar propiedad:', err);
            setError('Error al cargar la propiedad: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para toggle del estado de proyecto
    const toggleProjectStatus = async () => {
        try {
            const newProjectStatus = !property.is_project;

            console.log(`🔄 Cambiando estado de proyecto: ${property.is_project} → ${newProjectStatus}`);

            // Actualizar en la base de datos
            const { data, error } = await supabase
                .from('properties')
                .update({ is_project: newProjectStatus })
                .eq('id', propertyId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error actualizando estado de proyecto:', error);
                throw error;
            }

            console.log('✅ Estado de proyecto actualizado exitosamente:', data);

            // Actualizar el estado local
            setProperty(prev => ({
                ...prev,
                is_project: newProjectStatus
            }));

            // Si se convierte a proyecto y no está en el tab proyecto, cambiar automáticamente
            if (newProjectStatus && activeTab === 'general') {
                setActiveTab('proyecto');
            }

            // Si se quita el proyecto y está en el tab proyecto, volver a general
            if (!newProjectStatus && activeTab === 'proyecto') {
                setActiveTab('general');
            }

        } catch (err) {
            console.error('❌ Error en toggleProjectStatus:', err);
            setError('Error al cambiar el estado del proyecto: ' + err.message);

            // Mostrar el error temporalmente
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    const formatPrice = (price, currency) => {
        if (!price) return null;
        const formatter = new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: currency === 'DOP' ? 'DOP' : 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(price);
    };

    const formatArea = (area) => {
        if (!area) return '';
        return `${area} m²`;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Configuración de tabs dinámicos
    const getTabs = () => {
        const baseTabs = [
            { id: 'general', name: 'General', icon: Home },
            { id: 'contenido', name: 'Contenido', icon: BookOpen },
            { id: 'seo', name: 'SEO', icon: Target },
            { id: 'gestion', name: 'Gestión', icon: BarChart3 },
            { id: 'documentos', name: 'Documentos', icon: FileText }
        ];

        if (property?.is_project) {
            baseTabs.splice(1, 0,
                { id: 'proyecto', name: 'Datos del Proyecto', icon: Building }
            );
        }

        return baseTabs;
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando propiedad...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">⚠️</div>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button variant="primary" onClick={fetchPropertyData}>
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Propiedad no encontrada</p>
                        <Button variant="outline" onClick={() => onBack(hasChanges)} className="mt-4">
                            Volver
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-50">
            {/* Header Optimizado */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                {/* Navegación superior */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-8">
                        <Button
                            variant="ghost"
                            icon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => onBack(hasChanges)}
                            className="text-gray-600"
                        >
                            Volver atrás
                        </Button>

                        {/* Tabs Navigation */}
                        <nav className="flex space-x-6">
                            {getTabs().map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
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
                </div>

                {/* Separador visual entre tabs e información */}
                <div className="border-b border-gray-100"></div>

                {/* Información Principal Compacta */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {/* Código en línea separada */}
                        <div className="text-sm text-gray-500 font-medium mb-1">#{property.code}</div>

                        {/* Título más pequeño */}
                        <h1 className="text-xl font-bold text-gray-900 mb-1">
                            {property.name}
                        </h1>

                        {/* Nombre privado */}
                        {property.private_name && (
                            <p className="text-gray-600 mb-2 text-sm">{property.private_name}</p>
                        )}

                        {/* Badges compactos */}
                        <div className="flex items-center space-x-2 mb-2">
                            <Badge
                                variant={
                                    property.property_status === 'Publicada' ? 'success' :
                                        property.property_status === 'Vendida' ? 'error' :
                                            property.property_status === 'Pre-venta' ? 'warning' : 'default'
                                }
                            >
                                {property.property_status || 'Sin Estado'}
                            </Badge>
                            <Badge variant="info">
                                {property.property_categories?.name || 'Sin Categoría'}
                            </Badge>

                            {/* Toggle Proyecto - Diseño formal con grises */}
                            <button
                                onClick={toggleProjectStatus}
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:shadow-sm border ${property.is_project
                                        ? 'bg-gray-700 text-white hover:bg-gray-800 border-gray-700'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200'
                                    }`}
                                title={property.is_project ? 'Convertir a propiedad regular' : 'Convertir a proyecto'}
                            >
                                <Building2 className="w-3 h-3 mr-1" />
                                {property.is_project ? 'PROYECTO' : 'CONVERTIR A PROYECTO'}
                            </button>
                        </div>

                        {/* Ubicación y características compactas */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs">
                                    {property.sectors?.name && property.cities?.name
                                        ? `${property.sectors.name}, ${property.cities.name}`
                                        : property.cities?.name || 'Ubicación no especificada'
                                    }
                                </span>
                            </div>

                            {property.bedrooms && (
                                <div className="flex items-center space-x-1">
                                    <Bed className="w-3 h-3" />
                                    <span className="text-xs">{property.bedrooms}</span>
                                </div>
                            )}
                            {property.bathrooms && (
                                <div className="flex items-center space-x-1">
                                    <Bath className="w-3 h-3" />
                                    <span className="text-xs">{property.bathrooms}</span>
                                </div>
                            )}
                            {property.parking_spots > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Car className="w-3 h-3" />
                                    <span className="text-xs">{property.parking_spots}</span>
                                </div>
                            )}
                            {property.built_area && (
                                <div className="flex items-center space-x-1">
                                    <Ruler className="w-3 h-3" />
                                    <span className="text-xs">{formatArea(property.built_area)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                        {property.sale_price && (
                            <div className="text-xl font-bold text-orange-600 mb-1">
                                {formatPrice(property.sale_price, property.sale_currency)}
                            </div>
                        )}
                        {property.rental_price && (
                            <div className="text-lg font-semibold text-blue-600">
                                {formatPrice(property.rental_price, property.rental_currency)}/mes
                            </div>
                        )}
                        {!property.sale_price && !property.rental_price && (
                            <div className="text-gray-400 text-sm">
                                <DollarSign className="w-4 h-4 mx-auto mb-1" />
                                <p>Sin precio definido</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area - Renderizado dinámico de tabs */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'general' && (
                    <div className="p-6">
                        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Columna Principal */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Galería de Imágenes */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Galería de Imágenes</h2>
                                    <PropertyImageGallery property={property} />
                                </div>

                                {/* Descripción */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Descripción</h2>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={<Edit className="w-4 h-4" />}
                                            onClick={() => setShowEditModal(true)}
                                        >
                                            Editar
                                        </Button>
                                    </div>
                                    <DescriptionRenderer
                                        htmlContent={property.description}
                                        onEdit={() => setShowEditModal(true)}
                                    />
                                </div>

                                {/* Características Principales */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Características Principales</h2>
                                    {(() => {
                                        const characteristics = [
                                            {
                                                value: property.bedrooms,
                                                label: 'Habitaciones',
                                                icon: Bed,
                                                color: 'text-orange-600'
                                            },
                                            {
                                                value: property.bathrooms,
                                                label: 'Baños',
                                                icon: Bath,
                                                color: 'text-blue-600'
                                            },
                                            {
                                                value: property.parking_spots,
                                                label: 'Estacionamientos',
                                                icon: CarIcon,
                                                color: 'text-purple-600'
                                            },
                                            {
                                                value: property.built_area,
                                                label: 'm² construidos',
                                                icon: Ruler,
                                                color: 'text-green-600'
                                            },
                                        ];

                                        // Agregar nivel si existe
                                        if (property.nivel) {
                                            characteristics.push({
                                                value: property.nivel,
                                                label: 'Nivel',
                                                icon: Layers,
                                                color: 'text-indigo-600'
                                            });
                                        }

                                        // Determinar el número de columnas basado en la cantidad
                                        const totalItems = characteristics.length;
                                        let gridCols = 'grid-cols-2 md:grid-cols-4';

                                        if (totalItems === 5) {
                                            gridCols = 'grid-cols-2 md:grid-cols-5';
                                        } else if (totalItems === 6) {
                                            gridCols = 'grid-cols-2 md:grid-cols-6';
                                        }

                                        return (
                                            <div className={`grid ${gridCols} gap-4`}>
                                                {characteristics.map((char, index) => {
                                                    const IconComponent = char.icon;
                                                    return (
                                                        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                                                            <IconComponent className={`w-6 h-6 ${char.color} mx-auto mb-2`} />
                                                            <div className="font-semibold text-lg">{char.value || 0}</div>
                                                            <div className="text-sm text-gray-600">{char.label}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Detalles adicionales */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {property.land_area && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Área de terreno:</span>
                                                <span className="font-semibold">{formatArea(property.land_area)}</span>
                                            </div>
                                        )}
                                        {property.floor_level && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Nivel:</span>
                                                <span className="font-semibold">{property.floor_level}</span>
                                            </div>
                                        )}
                                        {property.year_built && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Año de construcción:</span>
                                                <span className="font-semibold">{property.year_built}</span>
                                            </div>
                                        )}
                                        {property.is_furnished !== null && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">Amueblado:</span>
                                                <Badge variant={property.is_furnished ? 'success' : 'default'}>
                                                    {property.is_furnished ? 'Sí' : 'No'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Amenidades - DISEÑO MEJORADO Y COMPACTO */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Amenidades
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                {propertyAmenities.length}
                                            </span>
                                        </h2>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={<Edit className="w-4 h-4" />}
                                            onClick={() => setShowEditModal(true)}
                                        >
                                            Editar
                                        </Button>
                                    </div>

                                    {propertyAmenities.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Lista compacta con iconos y categorías */}
                                            <div className="flex flex-wrap gap-2">
                                                {propertyAmenities.map((amenity, index) => (
                                                    <div
                                                        key={amenity.id}
                                                        className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:shadow-sm transition-all duration-200"
                                                    >
                                                        {/* Icono personalizado o emoji */}
                                                        <span className="text-orange-600 text-lg flex-shrink-0">
                                                            {amenity.amenities?.icon ||
                                                                (amenity.amenities?.category === 'Edificio' ? '🏢' :
                                                                    amenity.amenities?.category === 'Interior' ? '🏠' :
                                                                        amenity.amenities?.category === 'Exterior' ? '🌳' :
                                                                            amenity.amenities?.category === 'Seguridad' ? '🔒' :
                                                                                amenity.amenities?.category === 'Ubicación' ? '📍' :
                                                                                    '✨')
                                                            }
                                                        </span>

                                                        {/* Nombre de la amenidad */}
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {amenity.amenities?.name || 'Sin nombre'}
                                                        </span>

                                                        {/* Valor opcional */}
                                                        {amenity.value && (
                                                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                                {amenity.value}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Resumen por categorías */}
                                            {(() => {
                                                const categoriesCount = propertyAmenities.reduce((acc, amenity) => {
                                                    const category = amenity.amenities?.category || 'Otros';
                                                    acc[category] = (acc[category] || 0) + 1;
                                                    return acc;
                                                }, {});

                                                return Object.keys(categoriesCount).length > 1 && (
                                                    <div className="pt-3 border-t border-gray-100">
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(categoriesCount).map(([category, count]) => (
                                                                <span
                                                                    key={category}
                                                                    className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                                                                >
                                                                    <span className="mr-1">
                                                                        {category === 'Edificio' ? '🏢' :
                                                                            category === 'Interior' ? '🏠' :
                                                                                category === 'Exterior' ? '🌳' :
                                                                                    category === 'Seguridad' ? '🔒' :
                                                                                        category === 'Ubicación' ? '📍' :
                                                                                            '📋'}
                                                                    </span>
                                                                    {category}: {count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                            <div className="text-4xl mb-3">🏠</div>
                                            <p className="font-medium text-gray-700">Sin amenidades registradas</p>
                                            <p className="text-sm text-gray-500 mb-4">Agrega amenidades para hacer más atractiva esta propiedad</p>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                                                icon={<Plus className="w-4 h-4" />}
                                                onClick={() => setShowEditModal(true)}
                                            >
                                                Agregar Amenidades
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Ubicación de la Propiedad */}
                                <PropertyLocationManager
                                    property={property}
                                    onLocationUpdate={(updatedProperty) => {
                                        setProperty(updatedProperty);
                                    }}
                                />

                                {/* Tags y Categorías */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags y Categorías</h2>
                                    {propertyTags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {propertyTags.map((tagRelation) => (
                                                <Badge
                                                    key={tagRelation.id}
                                                    className={`${tagRelation.tags.color || 'bg-gray-100 text-gray-800'} ${tagRelation.auto_generated ? 'border border-dashed' : ''
                                                        }`}
                                                >
                                                    {tagRelation.tags.icon && (
                                                        <span className="mr-1">{tagRelation.tags.icon}</span>
                                                    )}
                                                    {tagRelation.tags.display_name || tagRelation.tags.name}
                                                    {tagRelation.auto_generated && (
                                                        <span className="ml-1 text-xs">🤖</span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                            <Target className="w-8 h-8 mx-auto mb-2" />
                                            <p className="font-medium">Sin tags asignados</p>
                                            <p className="text-sm">Agrega tags para mejorar la categorización y SEO</p>
                                            <Button variant="outline" size="sm" className="mt-3">
                                                <Plus className="w-4 h-4 mr-1" />
                                                Agregar Tags
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">

                                {/* Acciones Rápidas */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copiar Link
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Compartir
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Ver Pública
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar Propiedad
                                        </Button>
                                    </div>
                                </div>

                                {/* Información del Asesor */}
                                <AgentInfoCard agent={property.users} agentStats={agentStats} />

                                {/* Datos Técnicos */}
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h3 className="font-semibold text-gray-900">Detalles de la Propiedad</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {/* Comisión */}
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-1">Comisión:</div>
                                            <div className="text-sm text-gray-900 font-bold">
                                                {property.sale_commission ? `${property.sale_commission}%` :
                                                    property.rental_commission ? `${property.rental_commission}%` : 'No definida'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                <span className="font-medium">Ciudad</span>
                                            </div>
                                            <div className="text-sm text-gray-900">
                                                {property.cities?.name || 'No especificada'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <MapPinIcon className="w-3 h-3 mr-1" />
                                                <span className="font-medium">Sector</span>
                                            </div>
                                            <div className="text-sm text-gray-900">
                                                {property.sectors?.name || 'No especificado'}
                                            </div>
                                        </div>

                                        {/* Encargado/Propietario - CORREGIDO CON FLEXIBILIDAD */}
                                        <div>
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <Building className="w-3 h-3 mr-1" />
                                                <span className="font-medium">Encargado/Propietario</span>
                                            </div>

                                            {(() => {
                                                // Caso 1: No hay contacto_id
                                                if (!property.contacto_id) {
                                                    return (
                                                        <div className="text-sm text-gray-500">
                                                            No especificado
                                                        </div>
                                                    );
                                                }

                                                // Caso 2: Hay contacto_id pero error cargando
                                                if (contactInfo?.error) {
                                                    return (
                                                        <div className="space-y-1">
                                                            <div className="text-sm text-red-600 font-medium">
                                                                {contactInfo.error}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {contactInfo.id}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    console.log('🔄 Reintentando cargar contacto...');
                                                                    fetchPropertyData();
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                            >
                                                                Reintentar
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                // Caso 3: Contacto cargado exitosamente
                                                if (contactInfo && !contactInfo.error) {
                                                    return (
                                                        <div className="space-y-1">
                                                            <div className="text-sm text-blue-600 font-medium">
                                                                {(() => {
                                                                    // Basado en los logs, la tabla tiene campo 'name'
                                                                    if (contactInfo.name) {
                                                                        return contactInfo.name;
                                                                    }

                                                                    // Fallback para otros posibles nombres
                                                                    const possibleFirstNames = ['first_name', 'firstname', 'full_name', 'nombre'];
                                                                    const possibleLastNames = ['last_name', 'lastname', 'apellido'];

                                                                    let firstName = '';
                                                                    let lastName = '';

                                                                    for (const field of possibleFirstNames) {
                                                                        if (contactInfo[field]) {
                                                                            firstName = contactInfo[field];
                                                                            break;
                                                                        }
                                                                    }

                                                                    for (const field of possibleLastNames) {
                                                                        if (contactInfo[field]) {
                                                                            lastName = contactInfo[field];
                                                                            break;
                                                                        }
                                                                    }

                                                                    const fullName = `${firstName} ${lastName}`.trim();
                                                                    return fullName || 'Sin nombre';
                                                                })()}
                                                            </div>

                                                            {/* Empresa/Posición - Flexible */}
                                                            {(() => {
                                                                const possibleCompanyFields = ['company_name', 'company', 'empresa'];
                                                                const possiblePositionFields = ['position', 'cargo', 'puesto'];

                                                                let company = '';
                                                                let position = '';

                                                                for (const field of possibleCompanyFields) {
                                                                    if (contactInfo[field]) {
                                                                        company = contactInfo[field];
                                                                        break;
                                                                    }
                                                                }

                                                                for (const field of possiblePositionFields) {
                                                                    if (contactInfo[field]) {
                                                                        position = contactInfo[field];
                                                                        break;
                                                                    }
                                                                }

                                                                if (company || position) {
                                                                    return (
                                                                        <div className="text-xs text-gray-600">
                                                                            {[company, position].filter(Boolean).join(' - ')}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            {/* Email - Flexible */}
                                                            {(() => {
                                                                const possibleEmailFields = ['email', 'correo', 'email_address'];
                                                                let email = '';

                                                                for (const field of possibleEmailFields) {
                                                                    if (contactInfo[field]) {
                                                                        email = contactInfo[field];
                                                                        break;
                                                                    }
                                                                }

                                                                if (email) {
                                                                    return (
                                                                        <div className="text-xs text-gray-600 flex items-center">
                                                                            <Mail className="w-3 h-3 mr-1" />
                                                                            <a
                                                                                href={`mailto:${email}`}
                                                                                className="hover:text-blue-600 hover:underline"
                                                                            >
                                                                                {email}
                                                                            </a>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            {/* Teléfono - Flexible */}
                                                            {(() => {
                                                                const possiblePhoneFields = ['phone', 'telefono', 'phone_number', 'celular'];
                                                                let phone = '';

                                                                for (const field of possiblePhoneFields) {
                                                                    if (contactInfo[field]) {
                                                                        phone = contactInfo[field];
                                                                        break;
                                                                    }
                                                                }

                                                                if (phone) {
                                                                    return (
                                                                        <div className="text-xs text-gray-600 flex items-center">
                                                                            <Phone className="w-3 h-3 mr-1" />
                                                                            <a
                                                                                href={`tel:${phone}`}
                                                                                className="hover:text-blue-600 hover:underline"
                                                                            >
                                                                                {phone}
                                                                            </a>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            {/* Acciones - Solo si hay teléfono o email */}
                                                            {(() => {
                                                                const emailField = ['email', 'correo', 'email_address'].find(field => contactInfo[field]);
                                                                const phoneField = ['phone', 'telefono', 'phone_number', 'celular'].find(field => contactInfo[field]);

                                                                if (emailField || phoneField) {
                                                                    return (
                                                                        <div className="flex items-center space-x-2 mt-2">
                                                                            {phoneField && (
                                                                                <a
                                                                                    href={`https://wa.me/${contactInfo[phoneField].replace(/\D/g, '')}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                                >
                                                                                    <MessageCircle className="w-3 h-3 mr-1" />
                                                                                    WhatsApp
                                                                                </a>
                                                                            )}
                                                                            {emailField && (
                                                                                <a
                                                                                    href={`mailto:${contactInfo[emailField]}`}
                                                                                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                                >
                                                                                    <Mail className="w-3 h-3 mr-1" />
                                                                                    Email
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    );
                                                }

                                                // Caso 4: Cargando
                                                return (
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500 mr-2"></div>
                                                        Cargando contacto...
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Código interno */}
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-1">Código interno:</div>
                                            <div className="text-sm text-gray-900">
                                                {property.internal_code || 'No asignado'}
                                            </div>
                                        </div>

                                        {/* Fechas */}
                                        <div>
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                <span className="font-medium">Fecha creada</span>
                                            </div>
                                            <div className="text-sm text-gray-900">
                                                {formatDate(property.created_at)}
                                            </div>
                                        </div>

                                        {property.delivery_date && (
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium mb-1">Fecha de entrega:</div>
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(property.delivery_date)}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-1">Disponibilidad:</div>
                                            <Badge variant={property.availability ? 'success' : 'error'}>
                                                {property.availability ? 'Disponible' : 'No disponible'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Notas Privadas */}
                                {property.nota_privada && (
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Notas Privadas</h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                                {property.nota_privada}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Performance */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Vistas:</span>
                                            <span className="font-medium">{property.views_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Interesados:</span>
                                            <span className="font-medium">{property.leads_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Visitas:</span>
                                            <span className="font-medium">{property.visits_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Días publicada:</span>
                                            <span className="font-medium">
                                                {property.created_at ?
                                                    Math.floor((new Date() - new Date(property.created_at)) / (1000 * 60 * 60 * 24))
                                                    : 0
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'proyecto' && property?.is_project && (
                    <PropertyProject
                        propertyId={propertyId}
                        property={property}
                    />
                )}

                {activeTab === 'contenido' && (
                    <PropertyContent
                        propertyId={propertyId}
                        property={property}
                    />
                )}

                {activeTab === 'seo' && (
                    <PropertySEO
                        propertyId={propertyId}
                        property={property}
                    />
                )}

                {activeTab === 'gestion' && (
                    <PropertyGestion
                        propertyId={propertyId}
                        property={property}
                    />
                )}

                {activeTab === 'documentos' && (
                    <PropertyDocuments
                        propertyId={propertyId}
                        property={property}
                    />
                )}
            </div>

            {/* Modal de Edición */}
            <PropertyEditModal
                property={property}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={(updatedProperty) => {
                    setProperty(updatedProperty);
                    setHasChanges(true); // Marcar que hubo cambios
                    // Recargar amenidades
                    fetchPropertyData();
                    // Notificar al componente padre que se actualizó
                    if (onPropertyUpdate) {
                        onPropertyUpdate(updatedProperty);
                    }
                }}
            />
        </div>
    );
};

export default PropertyDetail;