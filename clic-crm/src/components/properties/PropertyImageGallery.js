import React, { useState, useEffect } from 'react';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { processPropertyImages } from '../../utils/imageProcessor';

/**
 * Componente de galería de imágenes para propiedades
 * Muestra un carrusel de imágenes con navegación
 */
const PropertyImageGallery = ({ property, onViewDetails }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [images, setImages] = useState([]);

    useEffect(() => {
        // ✅ Usar imageProcessor centralizado (elimina ~85 líneas de código duplicado)
        const propertyImages = processPropertyImages(property);
        setImages(propertyImages);
        setCurrentImageIndex(0);
    }, [property]);

    const nextImage = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (images.length > 0) {
            setCurrentImageIndex((prev) => {
                const nextIndex = (prev + 1) % images.length;
                console.log(`🔄 Next: ${prev + 1} → ${nextIndex + 1}/${images.length}`);
                return nextIndex;
            });
        }
    };

    const prevImage = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (images.length > 0) {
            setCurrentImageIndex((prev) => {
                const prevIndex = (prev - 1 + images.length) % images.length;
                console.log(`🔄 Prev: ${prev + 1} → ${prevIndex + 1}/${images.length}`);
                return prevIndex;
            });
        }
    };

    if (images.length === 0) {
        return (
            <div className="relative h-48 bg-gray-200 cursor-pointer hover:opacity-95 transition-opacity group" onClick={onViewDetails}>
                <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-12 h-12 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-48 bg-gray-200 cursor-pointer hover:opacity-95 transition-opacity group" onClick={onViewDetails}>
            {(() => {
                const currentImage = images[currentImageIndex];
                const hasValidImage = currentImage && currentImage.url && currentImage.url.trim();

                if (!hasValidImage && images.length > 0) {
                    console.log('⚠️ Sin imagen válida en índice:', currentImageIndex, 'de', images.length);
                }

                if (hasValidImage) {
                    return (
                        <img
                            src={currentImage.url}
                            alt={currentImage.title || property.name}
                            className="w-full h-full object-cover"
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
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all duration-200 z-10 shadow-lg opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-all duration-200 z-10 shadow-lg opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {currentImageIndex + 1}/{images.length}
                    </div>

                    <div className="absolute bottom-2 left-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setCurrentImageIndex(index);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${index === currentImageIndex
                                    ? 'bg-white'
                                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PropertyImageGallery;
