import React, { useState, useEffect } from 'react';
import {
    Search, Globe, Building, Navigation, Home, MapPin, Eye, Plus,
    ArrowRight
} from 'lucide-react';

// Componentes UI básicos (reutilizables)
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente para mostrar jerarquía de ubicaciones
const LocationHierarchy = ({ location, locations }) => {
    const buildHierarchy = (loc) => {
        const hierarchy = [loc];
        let current = loc;
        
        while (current.parent_location_id) {
            const parent = locations.find(l => l.id === current.parent_location_id);
            if (parent) {
                hierarchy.unshift(parent);
                current = parent;
            } else {
                break;
            }
        }
        
        return hierarchy;
    };

    const hierarchy = buildHierarchy(location);

    return (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
            {hierarchy.map((item, index) => (
                <React.Fragment key={item.id}>
                    {index > 0 && <ArrowRight className="w-4 h-4 text-gray-400" />}
                    <span className={index === hierarchy.length - 1 ? 'font-medium text-gray-900' : ''}>
                        {item.display_name || item.location_name}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

// Componente principal de lista de ubicaciones
const LocationsList = ({ 
    locations, 
    loading, 
    onLocationSelect, 
    onCreateNew 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('active');

    const locationTypes = [
        { value: 'country', label: 'País', icon: Globe },
        { value: 'province', label: 'Provincia', icon: MapPin },
        { value: 'city', label: 'Ciudad', icon: Building },
        { value: 'sector', label: 'Sector', icon: Navigation },
        { value: 'neighborhood', label: 'Barrio', icon: Home }
    ];

    // Filtrar ubicaciones
    const filteredLocations = locations.filter(location => {
        const matchesSearch = location.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || location.location_type === selectedType;
        const matchesStatus = !selectedStatus || location.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    const getLocationIcon = (locationType) => {
        const type = locationTypes.find(t => t.value === locationType);
        return type ? React.createElement(type.icon, { className: "w-4 h-4 text-gray-400 mr-2" }) : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">Cargando ubicaciones...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar ubicaciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="">Todos los tipos</option>
                        {locationTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="draft">Borrador</option>
                    </select>

                    <div className="text-sm text-gray-600 flex items-center">
                        Total: {filteredLocations.length}
                    </div>

                    <Button
                        variant="primary"
                        onClick={onCreateNew}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Nueva Ubicación
                    </Button>
                </div>
            </Card>

            {/* Lista de ubicaciones */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ubicación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Popularidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredLocations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm || selectedType || selectedStatus !== 'active' 
                                            ? 'No se encontraron ubicaciones con los filtros aplicados'
                                            : 'No hay ubicaciones registradas'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                filteredLocations.map((location) => (
                                    <tr key={location.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getLocationIcon(location.location_type)}
                                                <div>
                                                    <div 
                                                        className="font-medium text-gray-900 cursor-pointer hover:text-orange-600"
                                                        onClick={() => onLocationSelect(location)}
                                                    >
                                                        {location.display_name || location.location_name}
                                                    </div>
                                                    {location.canonical_name && location.canonical_name !== location.location_name && (
                                                        <div className="text-sm text-gray-500">
                                                            {location.canonical_name}
                                                        </div>
                                                    )}
                                                    <LocationHierarchy location={location} locations={locations} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                            {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={
                                                location.status === 'active' ? 'success' : 
                                                location.status === 'inactive' ? 'warning' : 'danger'
                                            }>
                                                {location.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {location.popularity_score || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {location.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onLocationSelect(location)}
                                                icon={<Eye className="w-4 h-4" />}
                                            >
                                                Ver
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default LocationsList;