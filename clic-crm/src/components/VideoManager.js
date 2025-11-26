import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Filter, Eye, Edit, Trash2, Search, Calendar, User, Tag,
    Play, Globe, Clock, TrendingUp, MoreHorizontal, Upload, Image as ImageIcon,
    Save, X, ExternalLink, CheckCircle, MapPin, Home, Youtube, Video, Camera, 
    Star, DollarSign, Bed, Bath, Car, Maximize, Building, Users, Loader,
    Grid3X3, List, Sliders
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, commonClasses } from './ui';

import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';
import RelationsTab from './RelationsTab';


import { supabase } from '../services/api';

// Componente para subir archivos a Supabase Storage
const FileUploader = ({ 
    onFileSelect, 
    accept = "image/*", 
    maxSize = 5, 
    folder = "videos",
    multiple = false,
    children,
    className = "",
    disabled = false
}) => {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    
    // Generar ID único para este componente
    const [inputId] = useState(() => `file-upload-${Date.now()}-${Math.random().toString(36).substring(2)}`);

    const uploadFile = async (file) => {
        try {
            setUploading(true);
            
            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // Subir archivo a Supabase Storage
            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (error) throw error;

            // Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            return {
                path: filePath,
                url: publicUrlData.publicUrl,
                name: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) return;

        const filesToUpload = Array.from(files);
        
        // Validar tamaño
        const oversizedFiles = filesToUpload.filter(file => file.size > maxSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            alert(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`);
            return;
        }

        try {
            if (multiple) {
                const uploadedFiles = await Promise.all(
                    filesToUpload.map(file => uploadFile(file))
                );
                onFileSelect(uploadedFiles);
            } else {
                const uploadedFile = await uploadFile(filesToUpload[0]);
                onFileSelect(uploadedFile);
            }
        } catch (error) {
            alert('Error al subir archivo(s): ' + error.message);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    if (children) {
        return (
            <div className={className}>
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id={inputId}
                    disabled={disabled || uploading}
                />
                <div
                    className={`cursor-pointer ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                        if (!disabled && !uploading) {
                            document.getElementById(inputId).click();
                        }
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {uploading ? (
                        <div className="flex items-center">
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                            Subiendo...
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
            } ${className}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id={inputId}
                disabled={disabled || uploading}
            />
            <label
                htmlFor={inputId}
                className={`cursor-pointer ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                        <p className="text-sm text-gray-600">Subiendo archivo...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                            Arrastra archivos aquí o <span className="text-orange-600 font-medium">haz clic para seleccionar</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            {accept.includes('image') ? 'Imágenes' : 'Archivos'} hasta {maxSize}MB
                        </p>
                    </div>
                )}
            </label>
        </div>
    );
};

// Componente para gestionar galería de fotos
const PhotoGalleryManager = ({ photos = [], onChange, disabled = false }) => {
    const [galleryPhotos, setGalleryPhotos] = useState(photos);

    useEffect(() => {
        setGalleryPhotos(photos);
    }, [photos]);

    const handleAddPhotos = (uploadedFiles) => {
        const newPhotos = uploadedFiles.map((file, index) => ({
            id: Date.now() + index,
            url: file.url,
            path: file.path,
            name: file.name,
            caption: '',
            alt: '',
            order: galleryPhotos.length + index
        }));

        const updatedPhotos = [...galleryPhotos, ...newPhotos];
        setGalleryPhotos(updatedPhotos);
        onChange(updatedPhotos);
    };

    const handleRemovePhoto = (photoId) => {
        const updatedPhotos = galleryPhotos.filter(photo => photo.id !== photoId);
        setGalleryPhotos(updatedPhotos);
        onChange(updatedPhotos);
    };

    const handleUpdatePhoto = (photoId, field, value) => {
        const updatedPhotos = galleryPhotos.map(photo =>
            photo.id === photoId ? { ...photo, [field]: value } : photo
        );
        setGalleryPhotos(updatedPhotos);
        onChange(updatedPhotos);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Galeria de Fotos</h4>
                <span className="text-sm text-gray-500">{galleryPhotos.length} fotos</span>
            </div>

            {/* Uploader */}
            <FileUploader
                onFileSelect={handleAddPhotos}
                accept="image/*"
                multiple={true}
                folder="videos/gallery"
                maxSize={10}
                disabled={disabled}
                className="mb-4"
            />

            {/* Grid de fotos */}
            {galleryPhotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={photo.url}
                                    alt={photo.alt || photo.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg">
                                <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex space-x-1">
                                    <button
                                        onClick={() => handleRemovePhoto(photo.id)}
                                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                                        disabled={disabled}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 space-y-1">
                                <Input
                                    type="text"
                                    placeholder="Título de la imagen..."
                                    value={photo.caption}
                                    onChange={(e) => handleUpdatePhoto(photo.id, 'caption', e.target.value)}
                                    className="text-xs"
                                    disabled={disabled}
                                />
                                <Input
                                    type="text"
                                    placeholder="Texto alternativo (ALT)..."
                                    value={photo.alt}
                                    onChange={(e) => handleUpdatePhoto(photo.id, 'alt', e.target.value)}
                                    className="text-xs"
                                    disabled={disabled}
                                />
                            </div>

                            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {galleryPhotos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay fotos en la galeria</p>
                    <p className="text-sm">Sube fotos para complementar el video</p>
                </div>
            )}
        </div>
    );
};

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

// Función helper para obtener badge de plataforma
const getPlatformBadge = (platform) => {
    const platformConfig = {
        'youtube': { variant: 'danger', text: 'YouTube', icon: Youtube },
        'vimeo': { variant: 'info', text: 'Vimeo', icon: Video },
        'self': { variant: 'warning', text: 'Propio', icon: Camera }
    };

    const config = platformConfig[platform] || { variant: 'default', text: platform, icon: Video };
    return (
        <Badge variant={config.variant} className="flex items-center space-x-1">
            <config.icon className="w-3 h-3" />
            <span>{config.text}</span>
        </Badge>
    );
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

// Función helper para obtener el tipo de operación
const getOperationType = (property) => {
    if (property.sale_price && property.sale_price > 0) return 'Venta';
    if (property.rental_price && property.rental_price > 0) return 'Alquiler';
    if (property.temp_rental_price && property.temp_rental_price > 0) return 'Alquiler Temporal';
    return 'Consultar';
};

// Componente para la pestaña de Información Básica
const BasicInfoTab = ({ formData, handleInputChange, cities, loadingCities, previewUrl }) => {
    const thumbnailInputRef = useRef(null);

    const handleThumbnailUpload = (uploadedFile) => {
        handleInputChange('thumbnail', uploadedFile.url);
    };

    const handleChangeThumbnailClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Clic en cambiar imagen detectado');
        console.log('Ref actual:', thumbnailInputRef.current);
        
        if (thumbnailInputRef.current) {
            console.log('Haciendo clic en el input file');
            thumbnailInputRef.current.click();
        } else {
            console.error('No se encontró la referencia del input');
        }
    };

    const handleThumbnailFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo excede el tamaño máximo de 5MB');
                return;
            }

            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `videos/thumbnails/${fileName}`;

            // Subir archivo a Supabase Storage
            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (error) throw error;

            // Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            handleInputChange('thumbnail', publicUrlData.publicUrl);
        } catch (error) {
            console.error('Error al subir thumbnail:', error);
            alert('Error al subir la imagen: ' + error.message);
        }

        // Limpiar el input para permitir seleccionar el mismo archivo otra vez
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Preview del video */}
            {previewUrl && (
                <Card>
                    <Card.Header>
                        <h3 className="text-lg font-semibold">Vista Previa</h3>
                    </Card.Header>
                    <Card.Body>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title="Video preview"
                            />
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
                                placeholder="Título del video"
                                className="text-lg"
                                required
                            />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug *
                                </label>
                                <Input
                                    value={formData.video_slug}
                                    onChange={(e) => handleInputChange('video_slug', e.target.value)}
                                    placeholder="url-del-video"
                                    required
                                />
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
                                        { value: 'decoracion', label: 'Decoración' },
                                        { value: 'casa-famosos', label: 'Casa de Famosos' },
                                        { value: 'proyectos', label: 'Proyectos' },
                                        { value: 'recorridos', label: 'Recorridos' },
                                        { value: 'entrevistas', label: 'Entrevistas' },
                                        { value: 'tips', label: 'Tips' }
                                    ]}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <WYSIWYGSEOEditor
                                value={formData.description}
                                onChange={(content) => handleInputChange('description', content)}
                                placeholder="Descripción detallada del video..."
                                cities={cities}
                                propertyTypes={[
                                    'apartamento', 'casa', 'villa', 'penthouse', 
                                    'oficina', 'local comercial', 'terreno'
                                ]}
                            />
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Configuración del video */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Configuración del Video</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plataforma *
                                </label>
                                <Input.Select
                                    value={formData.video_platform}
                                    onChange={(e) => handleInputChange('video_platform', e.target.value)}
                                    options={[
                                        { value: 'youtube', label: 'YouTube' },
                                        { value: 'vimeo', label: 'Vimeo' },
                                        { value: 'self', label: 'Propio' }
                                    ]}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ID del Video *
                                </label>
                                <Input
                                    value={formData.video_id}
                                    onChange={(e) => handleInputChange('video_id', e.target.value)}
                                    placeholder={formData.video_platform === 'youtube' ? 'dQw4w9WgXcQ' : 'ID del video'}
                                    required
                                />
                            </div>
                        </div>

                        {/* Thumbnail con subida de archivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imagen Miniatura (Thumbnail) *
                            </label>
                            
                            {/* Input file para el thumbnail */}
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailFileChange}
                                style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                            />
                            
                            {formData.thumbnail ? (
                                <div className="space-y-3">
                                    <div className="relative inline-block">
                                        <img
                                            src={formData.thumbnail}
                                            alt="Thumbnail preview"
                                            className="w-48 h-32 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('thumbnail', '')}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="button"
                                            value="📁 Cambiar imagen"
                                            onClick={handleChangeThumbnailClick}
                                            className="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">o</span>
                                        <Input
                                            value={formData.thumbnail}
                                            onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                                            placeholder="URL de la imagen"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <FileUploader
                                        onFileSelect={handleThumbnailUpload}
                                        accept="image/*"
                                        folder="videos/thumbnails"
                                        maxSize={5}
                                    />
                                    <div className="flex items-center">
                                        <div className="flex-1 border-t border-gray-300"></div>
                                        <span className="px-3 text-sm text-gray-500">o ingresa URL</span>
                                        <div className="flex-1 border-t border-gray-300"></div>
                                    </div>
                                    <Input
                                        value={formData.thumbnail}
                                        onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                                        placeholder="https://ejemplo.com/thumbnail.jpg"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duración
                                </label>
                                <Input
                                    value={formData.duration}
                                    onChange={(e) => handleInputChange('duration', e.target.value)}
                                    placeholder="5:30"
                                />
                            </div>
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
                            <div className="flex items-center justify-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={formData.featured}
                                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Video destacado
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Información inmobiliaria */}
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-semibold">Información Inmobiliaria</h3>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación
                                </label>
                                {loadingCities ? (
                                    <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                        <span className="text-sm text-gray-500">Cargando ciudades...</span>
                                    </div>
                                ) : (
                                    <Input.Select
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
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
                                    value={formData.property_type}
                                    onChange={(e) => handleInputChange('property_type', e.target.value)}
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
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

// Componente para la pestaña de Galería de Fotos
const GalleryTab = ({ photoGallery, onPhotoGalleryChange }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">Galería de Fotos</h3>
                <p className="text-sm text-gray-600">
                    Agrega fotos adicionales que complementen el video
                </p>
            </Card.Header>
            <Card.Body>
                <PhotoGalleryManager
                    photos={photoGallery}
                    onChange={onPhotoGalleryChange}
                />
            </Card.Body>
        </Card>
    );
};

// Componente para mostrar información de una propiedad
const PropertyCard = ({ property, isSelected, onToggle, selectedProperty, onUpdateRelation }) => {
    const mainPrice = getMainPrice(property);
    const operationType = getOperationType(property);

    return (
        <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
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
                        className={`w-24 h-18 bg-gray-200 rounded-lg flex items-center justify-center ${
                            property.main_image_url ? 'hidden' : 'flex'
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
                                        className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                #{property.code}
                                            </span>
                                            {property.is_project && (
                                                <Badge variant="info" size="sm">
                                                    <Building className="w-3 h-3 mr-1" />
                                                    Proyecto
                                                </Badge>
                                            )}
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
                                        <p className="text-xs text-gray-500">
                                            {operationType}
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
                                        property.provinces?.name,
                                        property.countries?.name
                                    ].filter(Boolean).join(', ')}
                                    {property.sectors?.name && ` • ${property.sectors.name}`}
                                </span>
                            </div>

                            {/* Características de la propiedad */}
                            <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                                {property.bedrooms && (
                                    <div className="flex items-center">
                                        <Bed className="w-3 h-3 mr-1" />
                                        <span>{property.bedrooms}</span>
                                    </div>
                                )}
                                {property.bathrooms && (
                                    <div className="flex items-center">
                                        <Bath className="w-3 h-3 mr-1" />
                                        <span>{property.bathrooms}</span>
                                    </div>
                                )}
                                {property.parking_spots && (
                                    <div className="flex items-center">
                                        <Car className="w-3 h-3 mr-1" />
                                        <span>{property.parking_spots}</span>
                                    </div>
                                )}
                                {property.built_area && (
                                    <div className="flex items-center">
                                        <Maximize className="w-3 h-3 mr-1" />
                                        <span>{property.built_area}m²</span>
                                    </div>
                                )}
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
                                {property.availability === 0 && (
                                    <Badge variant="danger" size="sm">
                                        No Disponible
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Configuración de relación (solo si está seleccionado) */}
                    {isSelected && selectedProperty && onUpdateRelation && (
                        <div 
                            className="mt-4 pt-4 border-t border-orange-200 bg-orange-25 rounded-lg p-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h5 className="text-xs font-semibold text-orange-900 mb-3">
                                Configuración de Relación
                            </h5>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-orange-800 mb-1">
                                        Tipo:
                                    </label>
                                    <Input.Select
                                        value={selectedProperty.relation_type}
                                        onChange={(e) => onUpdateRelation('relation_type', e.target.value)}
                                        options={[
                                            { value: 'related', label: 'Relacionado' },
                                            { value: 'featured', label: 'Destacado' },
                                            { value: 'tour', label: 'Recorrido' },
                                            { value: 'showcase', label: 'Showcase' },
                                            { value: 'comparison', label: 'Comparación' }
                                        ]}
                                        className="text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-orange-800 mb-1">
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
                                    <label className="block text-xs font-medium text-orange-800 mb-1">
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
                                <p className="text-sm font-medium text-orange-600">
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
                    <div className="lg:col-span-3">
                        <Input
                            placeholder="Buscar por nombre, código o ubicación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
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

// Componente para la pestaña de Propiedades
const PropertiesTab = ({ selectedProperties, properties, onShowModal, updatePropertyRelation, handlePropertyToggle }) => {
    return (
        <Card>
            <Card.Header>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Propiedades Relacionadas</h3>
                        <p className="text-sm text-gray-600">
                            Asocia este video con propiedades específicas
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
                                                            { value: 'tour', label: 'Recorrido' },
                                                            { value: 'showcase', label: 'Showcase' },
                                                            { value: 'comparison', label: 'Comparación' }
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
                            Asocia este video con propiedades específicas para mejorar la experiencia del usuario
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

// Componente para la pestaña de SEO
const SEOTab = ({ formData, handleInputChange }) => {
    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">SEO y Metadatos</h3>
                <p className="text-sm text-gray-600">
                    Optimiza el video para motores de búsqueda
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                                placeholder="https://ejemplo.com/video"
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
                            <h5 className="text-orange-600 text-lg leading-tight">
                                {formData.meta_title || formData.title || 'Título del video'}
                            </h5>
                            <p className="text-green-700 text-sm">
                                ejemplo.com/videos/{formData.video_slug || 'slug-del-video'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {formData.meta_description || 
                                 (formData.description ? formData.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...' : 'Descripción del video aparecerá aquí...')
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

// Componente Editor de Videos con pestañas organizadas
const VideoEditor = ({ video, onBack, user, permissions, availableTags, tagCategories }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        video_slug: '',
        description: '',
        video_id: '',
        video_platform: 'youtube',
        thumbnail: '',
        duration: '',
        category: '',
        location: '',
        property_type: '',
        featured: false,
        status: 'draft',
        meta_title: '',
        meta_description: '',
        canonical_url: '',
        language: 'es',
        photo_gallery: [],
        ...video
    });

    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [properties, setProperties] = useState([]);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
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
                    bedrooms,
                    bathrooms,
                    parking_spots,
                    built_area,
                    land_area,
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
                    ),
                    sectors!properties_sector_id_fkey(
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

    // Cargar propiedades relacionadas al video
    const loadVideoProperties = async (videoId) => {
        try {
            const { data, error } = await supabase
                .from('content_property_relations')
                .select('property_id, relation_type, weight, notes')
                .eq('content_id', videoId)
                .eq('content_type', 'video');

            if (error) throw error;

            setSelectedProperties(data ? data.map(rel => ({
                id: rel.property_id,
                relation_type: rel.relation_type,
                weight: rel.weight,
                notes: rel.notes
            })) : []);
        } catch (err) {
            console.error('Error al cargar propiedades del video:', err);
            setSelectedProperties([]);
        }
    };

    // Cargar tags del video cuando se edita
    const loadVideoTags = async (videoId) => {
        try {
            const { data, error } = await supabase
                .from('content_tags')
                .select('tag_id')
                .eq('content_id', videoId)
                .eq('content_type', 'video');

            if (error) throw error;
            setSelectedTags(data ? data.map(ct => ct.tag_id) : []);
        } catch (err) {
            console.error('Error al cargar tags del video:', err);
            setSelectedTags([]);
        }
    };

    useEffect(() => {
        if (video) {
            console.log('Cargando video existente:', video);
            setFormData({
                id: video.id, // Aseguramos que el ID esté presente
                title: video.title || '',
                subtitle: video.subtitle || '',
                video_slug: video.video_slug || '',
                description: video.description || '',
                video_id: video.video_id || '',
                video_platform: video.video_platform || 'youtube',
                thumbnail: video.thumbnail || '',
                duration: video.duration || '',
                category: video.category || '',
                location: video.location || '',
                property_type: video.property_type || '',
                featured: video.featured || false,
                status: video.status || 'draft',
                meta_title: video.meta_title || '',
                meta_description: video.meta_description || '',
                canonical_url: video.canonical_url || '',
                language: video.language || 'es',
                photo_gallery: video.photo_gallery || [],
                related_videos: video.related_videos || [],
                area_advisors: video.area_advisors || [],
                related_articles: video.related_articles || []
            });

            if (video.id) {
                loadVideoTags(video.id);
                loadVideoProperties(video.id);
            }
        } else {
            console.log('Inicializando nuevo video');
            setFormData({
                id: null, // Para videos nuevos, ID será null
                title: '',
                subtitle: '',
                video_slug: '',
                description: '',
                video_id: '',
                video_platform: 'youtube',
                thumbnail: '',
                duration: '',
                category: '',
                location: '',
                property_type: '',
                featured: false,
                status: 'draft',
                meta_title: '',
                meta_description: '',
                canonical_url: '',
                language: 'es',
                photo_gallery: [],
                related_videos: [],
                area_advisors: [],
                related_articles: []
            });
            setSelectedTags([]);
            setSelectedProperties([]);
        }
    }, [video]);

    // Auto-generar slug del título
    useEffect(() => {
        if (formData.title && !video) {
            const slug = formData.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100);
            setFormData(prev => ({ ...prev, video_slug: slug }));
        }
    }, [formData.title, video]);

    // Generar preview URL
    useEffect(() => {
        if (formData.video_id && formData.video_platform) {
            if (formData.video_platform === 'youtube') {
                setPreviewUrl(`https://www.youtube.com/embed/${formData.video_id}`);
            } else if (formData.video_platform === 'vimeo') {
                setPreviewUrl(`https://player.vimeo.com/video/${formData.video_id}`);
            }
        }
    }, [formData.video_id, formData.video_platform]);

    // Auto-generar thumbnail de YouTube
    useEffect(() => {
        if (formData.video_id && formData.video_platform === 'youtube' && !formData.thumbnail) {
            const thumbnailUrl = `https://img.youtube.com/vi/${formData.video_id}/maxresdefault.jpg`;
            setFormData(prev => ({ ...prev, thumbnail: thumbnailUrl }));
        }
    }, [formData.video_id, formData.video_platform]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

    const saveVideoProperties = async (videoId, propertyRelations) => {
        try {
            await supabase
                .from('content_property_relations')
                .delete()
                .eq('content_id', videoId)
                .eq('content_type', 'video');

            if (propertyRelations.length > 0) {
                const relations = propertyRelations.map(rel => ({
                    content_id: videoId,
                    content_type: 'video',
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

    const handlePhotoGalleryChange = (photos) => {
        setFormData(prev => ({ ...prev, photo_gallery: photos }));
    };

    const handleTagToggle = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const saveVideoTags = async (videoId, tagIds) => {
        try {
            await supabase
                .from('content_tags')
                .delete()
                .eq('content_id', videoId)
                .eq('content_type', 'video');

            if (tagIds.length > 0) {
                const contentTags = tagIds.map(tagId => ({
                    content_id: videoId,
                    content_type: 'video',
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

            // Validaciones básicas
            if (!formData.title.trim()) {
                alert('El título es requerido');
                return;
            }
            if (!formData.video_slug.trim()) {
                alert('El slug es requerido');
                return;
            }
            if (!formData.category) {
                alert('La categoría es requerida');
                return;
            }
            if (!formData.video_id.trim()) {
                alert('El ID del video es requerido');
                return;
            }
            if (!formData.thumbnail.trim()) {
                alert('La imagen miniatura es requerida');
                return;
            }

            console.log('FormData completo antes de guardar:', formData);

            const dataToSave = {
                title: formData.title.trim(),
                subtitle: formData.subtitle?.trim() || null,
                video_slug: formData.video_slug.trim(),
                description: formData.description || null,
                video_id: formData.video_id.trim(),
                video_platform: formData.video_platform,
                thumbnail: formData.thumbnail.trim(),
                duration: formData.duration?.trim() || null,
                category: formData.category,
                location: formData.location || null,
                property_type: formData.property_type || null,
                featured: formData.featured,
                status: status,
                meta_title: formData.meta_title?.trim() || null,
                meta_description: formData.meta_description?.trim() || null,
                canonical_url: formData.canonical_url?.trim() || null,
                language: formData.language,
                photo_gallery: formData.photo_gallery && formData.photo_gallery.length > 0 ? formData.photo_gallery : null,
                related_videos: formData.related_videos && formData.related_videos.length > 0 ? formData.related_videos : null,
                area_advisors: formData.area_advisors && formData.area_advisors.length > 0 ? formData.area_advisors : null,
                related_articles: formData.related_articles && formData.related_articles.length > 0 ? formData.related_articles : null,
                updated_at: new Date().toISOString()
            };

            console.log('Datos a guardar:', dataToSave);

            if (status === 'published' && !video?.published_at) {
                dataToSave.published_at = new Date().toISOString();
            }

            let result;
            let videoId;

            if (video) {
                // Actualizar video existente
                result = await supabase
                    .from('videos')
                    .update(dataToSave)
                    .eq('id', video.id)
                    .select();
                
                videoId = video.id;
                console.log('Video actualizado:', result);
            } else {
                // Crear nuevo video
                dataToSave.created_at = new Date().toISOString();
                
                // Solo agregar created_by_id si existe y es válido
                if (user && user.id && typeof user.id === 'string' && user.id.length > 0) {
                    dataToSave.created_by_id = user.id;
                }
                
                result = await supabase
                    .from('videos')
                    .insert([dataToSave])
                    .select();
                
                videoId = result.data?.[0]?.id;
                console.log('Video creado:', result);
            }

            if (result.error) {
                console.error('Error en la operación de base de datos:', result.error);
                throw result.error;
            }

            if (videoId) {
                await Promise.all([
                    saveVideoTags(videoId, selectedTags),
                    saveVideoProperties(videoId, selectedProperties)
                ]);
            }

            alert('Video guardado exitosamente!');
            onBack();
        } catch (err) {
            console.error('Error al guardar video:', err);
            alert('Error al guardar el video: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Pestañas de navegación
    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: <Video className="w-4 h-4" /> },
        { id: 'gallery', label: 'Galería', icon: <ImageIcon className="w-4 h-4" /> },
        { id: 'properties', label: 'Propiedades', icon: <Home className="w-4 h-4" /> },
        { id: 'tags', label: 'Etiquetas', icon: <Tag className="w-4 h-4" /> },
        { id: 'relations', label: 'Relaciones', icon: <Users className="w-4 h-4" /> },
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
                                {video ? 'Editar Video' : 'Nuevo Video'}
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
                            icon={saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
                                    ? 'border-orange-500 text-orange-600'
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
                            cities={cities}
                            loadingCities={loadingCities}
                            previewUrl={previewUrl}
                        />
                    )}

                    {activeTab === 'gallery' && (
                        <GalleryTab
                            photoGallery={formData.photo_gallery}
                            onPhotoGalleryChange={handlePhotoGalleryChange}
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

                    {activeTab === 'tags' && (
                        <Card>
                            <Card.Header>
                                <h3 className="text-lg font-semibold">Etiquetas</h3>
                                <p className="text-sm text-gray-600">
                                    Selecciona las etiquetas que mejor describan este video
                                </p>
                            </Card.Header>
                            <Card.Body>
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
                                                            <button
                                                                key={tag.id}
                                                                type="button"
                                                                onClick={() => handleTagToggle(tag.id)}
                                                                className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                                                                    isSelected
                                                                        ? 'border-orange-300 text-orange-700 shadow-sm'
                                                                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                                                }`}
                                                                style={{
                                                                    backgroundColor: isSelected 
                                                                        ? (tag.color ? tag.color + '20' : '#fed7aa')
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
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {selectedTags.length > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <h5 className="font-medium text-orange-900 mb-2">
                                                Etiquetas seleccionadas ({selectedTags.length})
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTags.map(tagId => {
                                                    const tag = availableTags.find(t => t.id === tagId);
                                                    if (!tag) return null;
                                                    return (
                                                        <span
                                                            key={tag.id}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
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
                            </Card.Body>
                        </Card>
                    )}

                    {activeTab === 'relations' && (
                        <RelationsTab
                            formData={formData}
                            handleInputChange={handleInputChange}
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

// Componente principal del Video Manager
const VideoManager = ({ user, permissions }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);
    const [tagCategories, setTagCategories] = useState([]);

    // Estados para filtros y vista
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('');
    const [filterFeatured, setFilterFeatured] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [listViewMode, setListViewMode] = useState('grid'); // 'grid' | 'table'

    useEffect(() => {
        Promise.all([
            fetchVideos(),
            fetchTags()
        ]);
    }, []);

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('active', true)
                .order('category, sort_order, name');

            if (error) throw error;

            setAvailableTags(data || []);
            
            const categories = [...new Set((data || []).map(tag => tag.category))];
            setTagCategories(categories);
        } catch (err) {
            console.error('Error al cargar tags:', err);
        }
    };

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (err) {
            console.error('Error al cargar videos:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar videos
    const filteredVideos = videos.filter(video => {
        const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.video_slug?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !filterStatus || video.status === filterStatus;
        const matchesCategory = !filterCategory || video.category === filterCategory;
        const matchesPlatform = !filterPlatform || video.video_platform === filterPlatform;
        const matchesFeatured = !filterFeatured || 
            (filterFeatured === 'featured' ? video.featured : !video.featured);

        return matchesSearch && matchesStatus && matchesCategory && matchesPlatform && matchesFeatured;
    });

    // Ordenar videos
    const sortedVideos = [...filteredVideos].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'published_at') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Paginación
    const totalPages = Math.ceil(sortedVideos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVideos = sortedVideos.slice(startIndex, endIndex);

    const handleCreateVideo = () => {
        setSelectedVideo(null);
        setViewMode('editor');
    };

    const handleEditVideo = (video) => {
        setSelectedVideo(video);
        setViewMode('editor');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedVideo(null);
        fetchVideos();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterCategory, filterPlatform, filterFeatured, sortBy, sortOrder]);

    if (viewMode === 'editor') {
        return (
            <VideoEditor
                video={selectedVideo}
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando videos...</p>
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
                    <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
                    <p className="text-sm text-gray-600">
                        {sortedVideos.length} videos encontrados
                        {sortedVideos.length !== videos.length && ` de ${videos.length} totales`}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Toggle de vista */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setListViewMode('grid')}
                            className={`p-2 rounded transition-colors ${
                                listViewMode === 'grid' 
                                    ? 'bg-white text-orange-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setListViewMode('table')}
                            className={`p-2 rounded transition-colors ${
                                listViewMode === 'table' 
                                    ? 'bg-white text-orange-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {permissions?.hasAction('create') && (
                        <Button
                            variant="primary"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={handleCreateVideo}
                        >
                            Nuevo Video
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Input
                        placeholder="Buscar videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
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
                        className="min-w-40"
                    />
                    
                    <Input.Select
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las plataformas' },
                            { value: 'youtube', label: 'YouTube' },
                            { value: 'vimeo', label: 'Vimeo' },
                            { value: 'self', label: 'Propio' }
                        ]}
                        className="min-w-40"
                    />
                    
                    <Input.Select
                        value={filterFeatured}
                        onChange={(e) => setFilterFeatured(e.target.value)}
                        options={[
                            { value: '', label: 'Todos' },
                            { value: 'featured', label: 'Destacados' },
                            { value: 'not-featured', label: 'No destacados' }
                        ]}
                        className="min-w-40"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Ordenar por:</span>
                        <Input.Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={[
                                { value: 'created_at', label: 'Fecha de creación' },
                                { value: 'updated_at', label: 'Última modificación' },
                                { value: 'published_at', label: 'Fecha de publicación' },
                                { value: 'title', label: 'Título' },
                                { value: 'category', label: 'Categoría' }
                            ]}
                            className="w-48"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            icon={<TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                        >
                            {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                        </Button>
                    </div>
                    
                    {(searchTerm || filterStatus || filterCategory || filterPlatform || filterFeatured) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('');
                                setFilterCategory('');
                                setFilterPlatform('');
                                setFilterFeatured('');
                            }}
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>

            {/* Lista de videos */}
            <div className="flex-1 overflow-y-auto">
                {currentVideos.length > 0 ? (
                    <>
                        {listViewMode === 'grid' ? (
                            // Vista en grid
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {currentVideos.map((video) => (
                                    <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                        <Card.Body onClick={() => handleEditVideo(video)}>
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                                                {video.thumbnail ? (
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Play className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}
                                                
                                                {/* Overlay con duración */}
                                                {video.duration && (
                                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                                        {video.duration}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                                {video.title}
                                            </h3>
                                            
                                            {video.subtitle && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {video.subtitle}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center justify-between mb-3">
                                                {getStatusBadge(video.status)}
                                                {getPlatformBadge(video.video_platform)}
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatDate(video.created_at)}</span>
                                                {video.featured && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            // Vista en tabla
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Video
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Categoría
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Plataforma
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentVideos.map((video) => (
                                            <tr key={video.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-shrink-0">
                                                            {video.thumbnail ? (
                                                                <img
                                                                    src={video.thumbnail}
                                                                    alt={video.title}
                                                                    className="w-16 h-10 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                                    <Play className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {video.title}
                                                            </div>
                                                            {video.subtitle && (
                                                                <div className="text-sm text-gray-500 truncate">
                                                                    {video.subtitle}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    /{video.video_slug}
                                                                </span>
                                                                {video.featured && (
                                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant="secondary">
                                                        {video.category?.replace('-', ' ') || 'Sin categoría'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPlatformBadge(video.video_platform)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(video.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(video.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {permissions?.hasAction('update') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Edit className="w-4 h-4" />}
                                                                onClick={() => handleEditVideo(video)}
                                                            />
                                                        )}
                                                        {video.status === 'published' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<ExternalLink className="w-4 h-4" />}
                                                                onClick={() => {
                                                                    if (video.video_platform === 'youtube') {
                                                                        window.open(`https://youtube.com/watch?v=${video.video_id}`, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 mt-6">
                                <div className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, sortedVideos.length)} de {sortedVideos.length} videos
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
                    <div className="text-center py-12">
                        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || filterStatus || filterCategory || filterPlatform || filterFeatured
                                ? 'No se encontraron videos'
                                : 'No hay videos'
                            }
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus || filterCategory || filterPlatform || filterFeatured
                                ? 'Prueba ajustando los filtros de búsqueda'
                                : 'Comienza creando tu primer video'
                            }
                        </p>
                        {permissions?.hasAction('create') && (
                            <Button
                                variant="primary"
                                onClick={handleCreateVideo}
                            >
                                Crear Primer Video
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoManager;