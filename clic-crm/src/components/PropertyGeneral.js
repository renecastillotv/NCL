import React, { useState, useEffect } from 'react';
import {
    Camera, ChevronLeft, ChevronRight, Edit, Plus, X, User, Mail, Phone,
    Facebook, Instagram, Linkedin, MapPin, Bed, Bath, Car, Home, Calendar,
    DollarSign, TrendingUp, Check, ExternalLink, ImageIcon
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';
import { processPropertyImages } from '../utils/imageProcessor';
import { supabase } from '../services/api';

const PropertyGeneral = ({ property, propertyTags, onRefresh }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

    useEffect(() => {
        if (property) {
            // ✅ Usar imageProcessor centralizado (elimina ~71 líneas de código duplicado)
            const processedImages = processPropertyImages(property);
            setImages(processedImages);
            fetchAvailableTags();
            setImageLoadErrors(new Set()); // Reset errors when property changes
        }
    }, [property]);

    const fetchAvailableTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('active', true)
                .order('category, name');

            if (error) throw error;
            setAvailableTags(data || []);
        } catch (err) {
            console.error('Error al cargar tags disponibles:', err);
        }
    };

    const addTagToProperty = async (tagId) => {
        try {
            const { error } = await supabase
                .from('content_tags')
                .insert({
                    content_id: property.id,
                    content_type: 'property',
                    tag_id: tagId,
                    weight: 1.0,
                    auto_generated: false
                });

            if (error) throw error;
            setShowTagModal(false);
            onRefresh();
        } catch (err) {
            console.error('Error al agregar tag:', err);
        }
    };

    const removeTagFromProperty = async (contentTagId) => {
        try {
            const { error } = await supabase
                .from('content_tags')
                .delete()
                .eq('id', contentTagId);

            if (error) throw error;
            onRefresh();
        } catch (err) {
            console.error('Error al eliminar tag:', err);
        }
    };

    const handleImageError = (imageIndex, imageUrl) => {
        console.warn('Error loading image:', imageUrl);
        setImageLoadErrors(prev => new Set([...prev, imageIndex]));
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
        if (!date) return 'No especificada';
        return new Date(date).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const filteredAvailableTags = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
        tag.display_name?.toLowerCase().includes(tagSearchTerm.toLowerCase())
    );

    const renderImageViewer = () => {
        if (images.length === 0) {
            return (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay imágenes disponibles</p>
                        {/* Debug info - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                <div><strong>Debug Info:</strong></div>
                                <div>Total images found: {images.length}</div>
                                <div>Main image: {property.main_image_url ? 'Yes' : 'No'}</div>
                                <div>gallery_images_url type: {typeof property.gallery_images_url}</div>
                                <div>gallery_images_url: {property.gallery_images_url}</div>
                                <div>property_images count: {property.property_images?.length || 0}</div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const currentImage = images[currentImageIndex];
        const hasError = imageLoadErrors.has(currentImageIndex);

        return (
            <>
                <div className="relative h-96 bg-gray-200 group rounded-lg overflow-hidden">
                    {!hasError ? (
                        <img
                            src={currentImage?.url}
                            alt={currentImage?.title || property.name}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(currentImageIndex, currentImage?.url)}
                            onLoad={() => {
                                // Remove from error set if it loads successfully
                                setImageLoadErrors(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(currentImageIndex);
                                    return newSet;
                                });
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Error al cargar imagen</p>
                            </div>
                        </div>
                    )}

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-md transition-all duration-200"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-md transition-all duration-200"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                    </div>

                    {/* Indicator for main image */}
                    {currentImage?.is_main && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Principal
                        </div>
                    )}
                </div>

                {/* Thumbnail navigation */}
                <div className="p-4">
                    <div className="grid grid-cols-8 gap-2">
                        {images.slice(0, 8).map((image, index) => {
                            const thumbnailHasError = imageLoadErrors.has(index);
                            return (
                                <button
                                    key={image.id || index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`relative h-16 bg-gray-200 rounded overflow-hidden border-2 transition-all ${index === currentImageIndex
                                            ? 'border-orange-500'
                                            : 'border-transparent hover:border-gray-300'
                                        }`}
                                    title={image.title}
                                >
                                    {!thumbnailHasError ? (
                                        <img
                                            src={image.url}
                                            alt={image.title}
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(index, image.url)}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                    {image.is_main && (
                                        <div className="absolute top-0 right-0 bg-orange-500 w-2 h-2 rounded-bl"></div>
                                    )}
                                </button>
                            );
                        })}
                        {images.length > 8 && (
                            <div className="h-16 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-xs text-gray-500">+{images.length - 8}</span>
                            </div>
                        )}
                    </div>

                    {/* Image source indicator */}
                    {images.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            {images.filter(img => img.is_main).length > 0 && (
                                <span className="inline-flex items-center mr-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                                    Principal
                                </span>
                            )}
                            <span>
                                Total: {images.length} imagen{images.length !== 1 ? 'es' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Columna Principal - Imágenes y descripción */}
                <div className="lg:col-span-3">
                    <Card className="p-0 overflow-hidden mb-6">
                        {renderImageViewer()}
                    </Card>

                    {/* Descripción de la Propiedad */}
                    {property.description && (
                        <Card className="p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                            <div className="prose prose-gray max-w-none">
                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: property.description }}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Información General */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Información General</h3>
                            <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />}>
                                Editar
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <span className="text-sm text-gray-500">Código:</span>
                                <p className="font-medium">{property.code}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Tipo:</span>
                                <p className="font-medium">{property.property_categories?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Provincia:</span>
                                <p className="font-medium">{property.provinces?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Ciudad:</span>
                                <p className="font-medium">{property.cities?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Sector:</span>
                                <p className="font-medium">{property.sectors?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Área Construida:</span>
                                <p className="font-medium">{formatArea(property.built_area)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Área de Terreno:</span>
                                <p className="font-medium">{formatArea(property.land_area)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Mantenimiento:</span>
                                <p className="font-medium">
                                    {property.maintenance_price
                                        ? formatPrice(property.maintenance_price, property.maintenance_currency)
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Comisión integrada */}
                        {property.sale_commission && (
                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-gray-500">Comisión de Venta:</span>
                                        <p className="font-medium text-lg text-orange-600">{property.sale_commission}%</p>
                                    </div>
                                    {property.shared_commission && (
                                        <div className="text-right">
                                            <span className="text-sm text-gray-500">Comisión Compartida:</span>
                                            <p className="font-medium">50%</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">TAGS</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setShowTagModal(true)}
                                    className="text-orange-600 hover:text-orange-700"
                                >
                                    Agregar Tag
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {propertyTags && propertyTags.length > 0 ? propertyTags.map((tagRelation) => (
                                    <div
                                        key={tagRelation.id}
                                        className="inline-flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        <span>{tagRelation.tags?.display_name || tagRelation.tags?.name}</span>
                                        <button
                                            onClick={() => removeTagFromProperty(tagRelation.id)}
                                            className="ml-2 text-orange-600 hover:text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )) : (
                                    <span className="text-gray-400 text-sm italic">No hay tags asignados</span>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Derecho */}
                <div className="space-y-6">
                    {/* Debug de información del agente */}
                    {process.env.NODE_ENV === 'development' && (
                        <Card className="p-4 bg-yellow-50 border-yellow-200">
                            <h4 className="text-sm font-semibold text-yellow-800 mb-2">Debug - Datos del Agente</h4>
                            <div className="text-xs space-y-1">
                                <div><strong>agent_id:</strong> {property.agent_id || 'No definido'}</div>
                                <div><strong>agent object:</strong> {property.agent ? 'Existe' : 'No existe'}</div>
                                <div><strong>users object:</strong> {property.users ? 'Existe' : 'No existe'}</div>
                                {property.agent && (
                                    <div><strong>agent.first_name:</strong> {property.agent.first_name}</div>
                                )}
                                {property.users && (
                                    <div><strong>users.first_name:</strong> {property.users.first_name}</div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Información del Agente */}
                    {property.agent_id && property.agent && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Asesor Asignado</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {property.agent.first_name} {property.agent.last_name}
                                        </p>
                                        {property.agent.position && (
                                            <p className="text-sm text-gray-600">{property.agent.position}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {property.agent.email && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <a href={`mailto:${property.agent.email}`} className="text-orange-600 hover:underline">
                                                {property.agent.email}
                                            </a>
                                        </div>
                                    )}
                                    {property.agent.phone && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <a href={`tel:${property.agent.phone}`} className="text-orange-600 hover:underline">
                                                {property.agent.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {property.agent.biography && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">{property.agent.biography}</p>
                                    </div>
                                )}

                                {/* Redes sociales del agente */}
                                <div className="flex space-x-2 pt-2">
                                    {property.agent.facebook_url && (
                                        <a
                                            href={property.agent.facebook_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            <Facebook className="w-4 h-4" />
                                        </a>
                                    )}
                                    {property.agent.instagram_url && (
                                        <a
                                            href={property.agent.instagram_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {property.agent.linkedin_url && (
                                        <a
                                            href={property.agent.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>

                                <div className="flex space-x-2 mt-4">
                                    <Button variant="primary" size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                                        Contactar
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <User className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Información del Agente Captador (fallback si no hay agent_id) */}
                    {(!property.agent_id || !property.agent) && property.users && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Asesor Captador</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {property.users.first_name} {property.users.last_name}
                                        </p>
                                        {property.users.position && (
                                            <p className="text-sm text-gray-600">{property.users.position}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {property.users.email && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <a href={`mailto:${property.users.email}`} className="text-orange-600 hover:underline">
                                                {property.users.email}
                                            </a>
                                        </div>
                                    )}
                                    {property.users.phone && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <a href={`tel:${property.users.phone}`} className="text-orange-600 hover:underline">
                                                {property.users.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {property.users.biography && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">{property.users.biography}</p>
                                    </div>
                                )}

                                {/* Redes sociales del agente */}
                                <div className="flex space-x-2 pt-2">
                                    {property.users.facebook_url && (
                                        <a
                                            href={property.users.facebook_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            <Facebook className="w-4 h-4" />
                                        </a>
                                    )}
                                    {property.users.instagram_url && (
                                        <a
                                            href={property.users.instagram_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors"
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {property.users.linkedin_url && (
                                        <a
                                            href={property.users.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>

                                <div className="flex space-x-2 mt-4">
                                    <Button variant="primary" size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                                        Contactar
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <User className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Mensaje si no hay datos de agente */}
                    {!property.agent_id && !property.users && (
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Asesor</h3>
                            <div className="text-center text-gray-500">
                                <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No hay información de asesor disponible</p>
                            </div>
                        </Card>
                    )}

                    {/* Panel de Publicación */}
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">Publicada</span>
                            </div>
                            <Button variant="outline" size="sm">
                                Editar
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-200">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Editar portales
                        </Button>
                    </Card>

                    {/* Fechas Importantes */}
                    <Card className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Fechas Importantes</h3>
                        <div className="space-y-3">
                            {property.delivery_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Fecha de Entrega:</span>
                                    <span className="font-medium text-sm">{formatDate(property.delivery_date)}</span>
                                </div>
                            )}
                            {property.release_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Fecha de Lanzamiento:</span>
                                    <span className="font-medium text-sm">{formatDate(property.release_date)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Creado:</span>
                                <span className="font-medium text-sm">{formatDate(property.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Actualizado:</span>
                                <span className="font-medium text-sm">{formatDate(property.updated_at)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal para agregar tags */}
            {showTagModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Agregar Tags</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<X className="w-4 h-4" />}
                                onClick={() => setShowTagModal(false)}
                            />
                        </div>

                        <Input.Search
                            placeholder="Buscar tags..."
                            value={tagSearchTerm}
                            onSearch={setTagSearchTerm}
                            className="mb-4"
                        />

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {Object.entries(
                                filteredAvailableTags.reduce((acc, tag) => {
                                    const category = tag.category || 'otros';
                                    if (!acc[category]) acc[category] = [];
                                    acc[category].push(tag);
                                    return acc;
                                }, {})
                            ).map(([category, tags]) => (
                                <div key={category}>
                                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                                        {category.replace('_', ' ')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {tags.map((tag) => {
                                            const isAssigned = propertyTags && propertyTags.some(pt => pt.tags?.id === tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => !isAssigned && addTagToProperty(tag.id)}
                                                    disabled={isAssigned}
                                                    className={`flex items-center space-x-2 p-2 rounded border text-left ${isAssigned
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                                        }`}
                                                >
                                                    <span className="text-sm">
                                                        {tag.display_name || tag.name}
                                                    </span>
                                                    {isAssigned && <Check className="w-4 h-4 text-green-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyGeneral;