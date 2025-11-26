import React from 'react';
import { MapPin, Bed, Bath, Car } from 'lucide-react';
import PropertyImageGallery from './PropertyImageGallery';
import AgentAvatar from './AgentAvatar';
import { formatPrice, formatArea, formatTimeAgo } from '../../utils/formatters';

/**
 * Componente de tarjeta de propiedad
 * Muestra información completa de una propiedad en formato de tarjeta
 */
const PropertyCard = ({
    property,
    isSelected = false,
    onSelect,
    onViewDetails
}) => {
    const handleCardClick = () => {
        onViewDetails(property.id);
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onSelect(property.id, e.target.checked);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
            {/* Imagen de la propiedad con galería mejorada */}
            <div className="relative">
                <PropertyImageGallery
                    property={property}
                    onViewDetails={handleCardClick}
                />

                {/* Avatar del asesor */}
                <AgentAvatar agent={property.users} />

                {/* Checkbox de selección */}
                <div className="absolute top-3 left-3">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 bg-white/80 backdrop-blur-sm"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                    />
                </div>

                {/* Código y estado */}
                <div className="absolute top-3 right-3 flex flex-col items-end space-y-2">
                    <span className="bg-black/50 text-white px-2 py-1 rounded text-sm font-medium">
                        #{property.code}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${property.property_status === 'Publicada' ? 'bg-green-500 text-white' :
                            property.property_status === 'Vendida' ? 'bg-red-500 text-white' :
                                property.property_status === 'Pre-venta' ? 'bg-blue-500 text-white' :
                                    'bg-gray-500 text-white'
                        }`}>
                        {property.property_status || 'Sin Estado'}
                    </span>
                    {property.is_project && (
                        <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                            PROYECTO
                        </span>
                    )}
                </div>
            </div>

            {/* Contenido de la tarjeta - También clickeable */}
            <div
                className="p-4 pt-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleCardClick}
            >
                {/* Título */}
                <div className="mb-2">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1 leading-tight">
                        {property.name}
                    </h3>
                    {property.private_name && (
                        <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">
                            {property.private_name}
                        </p>
                    )}
                </div>

                {/* Ubicación */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">
                        {property.sectors?.name && property.cities?.name
                            ? `${property.sectors.name}, ${property.cities.name}`
                            : property.cities?.name || 'Ubicación no especificada'
                        }
                    </span>
                </div>

                {/* Características */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-3">
                        {property.bedrooms && (
                            <div className="flex items-center">
                                <Bed className="w-4 h-4 mr-1" />
                                <span>{property.bedrooms}</span>
                            </div>
                        )}
                        {property.bathrooms && (
                            <div className="flex items-center">
                                <Bath className="w-4 h-4 mr-1" />
                                <span>{property.bathrooms}</span>
                            </div>
                        )}
                        {property.parking_spots > 0 && (
                            <div className="flex items-center">
                                <Car className="w-4 h-4 mr-1" />
                                <span>{property.parking_spots}</span>
                            </div>
                        )}
                    </div>
                    {property.built_area && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {formatArea(property.built_area)}
                        </span>
                    )}
                </div>

                {/* Precios */}
                <div className="mb-2">
                    {property.sale_price && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Venta:</span>
                            <span className="font-bold text-orange-600 text-base">
                                {formatPrice(property.sale_price, property.sale_currency)}
                            </span>
                        </div>
                    )}
                    {property.rental_price && (
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600">Alquiler:</span>
                            <span className="font-semibold text-blue-600">
                                {formatPrice(property.rental_price, property.rental_currency)}/mes
                            </span>
                        </div>
                    )}
                </div>

                {/* Fechas discretas - más compactas */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-1.5 mt-2">
                    <div className="flex justify-between">
                        <span>Creada hace {formatTimeAgo(property.created_at)}</span>
                        <span>Actualizada hace {formatTimeAgo(property.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
