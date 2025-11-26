import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar todos los filtros de propiedades
 * Centraliza la lógica de estado y reset de filtros
 */
const usePropertyFilters = () => {
    // Estados de filtros básicos
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCondition, setFilterCondition] = useState('');
    const [showMyProperties, setShowMyProperties] = useState(false);

    // Filtros de ubicación
    const [filterCities, setFilterCities] = useState([]);
    const [filterSectors, setFilterSectors] = useState([]);

    // Filtros de agentes
    const [filterAgents, setFilterAgents] = useState([]);

    // Filtros de operación y precio
    const [filterOperation, setFilterOperation] = useState('');
    const [filterCurrency, setFilterCurrency] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    // Filtros de características
    const [filterBedrooms, setFilterBedrooms] = useState('');
    const [filterBathrooms, setFilterBathrooms] = useState('');
    const [filterParking, setFilterParking] = useState('');

    // Filtros de área
    const [areaRange, setAreaRange] = useState({ min: '', max: '' });
    const [landAreaRange, setLandAreaRange] = useState({ min: '', max: '' });

    // Estados temporales para modales (antes de aplicar)
    const [tempFilterCities, setTempFilterCities] = useState([]);
    const [tempFilterSectors, setTempFilterSectors] = useState([]);
    const [tempFilterAgents, setTempFilterAgents] = useState([]);
    const [tempShowMyProperties, setTempShowMyProperties] = useState(false);
    const [tempFilterBedrooms, setTempFilterBedrooms] = useState('');
    const [tempFilterBathrooms, setTempFilterBathrooms] = useState('');
    const [tempFilterParking, setTempFilterParking] = useState('');
    const [tempAreaRange, setTempAreaRange] = useState({ min: '', max: '' });
    const [tempLandAreaRange, setTempLandAreaRange] = useState({ min: '', max: '' });
    const [tempFilterOperation, setTempFilterOperation] = useState('');
    const [tempFilterCurrency, setTempFilterCurrency] = useState('');
    const [tempPriceRange, setTempPriceRange] = useState({ min: '', max: '' });
    const [tempFilterCategory, setTempFilterCategory] = useState('');
    const [tempFilterStatus, setTempFilterStatus] = useState('');
    const [tempFilterType, setTempFilterType] = useState('');
    const [tempFilterCondition, setTempFilterCondition] = useState('');

    // Resetear todos los filtros
    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterCities([]);
        setFilterSectors([]);
        setFilterAgents([]);
        setFilterType('');
        setFilterOperation('');
        setFilterCurrency('');
        setPriceRange({ min: '', max: '' });
        setFilterBedrooms('');
        setFilterBathrooms('');
        setFilterParking('');
        setFilterCondition('');
        setAreaRange({ min: '', max: '' });
        setLandAreaRange({ min: '', max: '' });
        setShowMyProperties(false);
    }, []);

    // Contar filtros activos
    const activeFiltersCount = useCallback(() => {
        let count = 0;
        if (searchTerm) count++;
        if (filterCategory) count++;
        if (filterStatus) count++;
        if (filterCities.length > 0) count++;
        if (filterSectors.length > 0) count++;
        if (filterAgents.length > 0) count++;
        if (filterType) count++;
        if (filterOperation) count++;
        if (filterCurrency) count++;
        if (priceRange.min || priceRange.max) count++;
        if (filterBedrooms) count++;
        if (filterBathrooms) count++;
        if (filterParking) count++;
        if (filterCondition) count++;
        if (areaRange.min || areaRange.max) count++;
        if (landAreaRange.min || landAreaRange.max) count++;
        if (showMyProperties) count++;
        return count;
    }, [
        searchTerm, filterCategory, filterStatus, filterCities, filterSectors,
        filterAgents, filterType, filterOperation, filterCurrency, priceRange,
        filterBedrooms, filterBathrooms, filterParking, filterCondition,
        areaRange, landAreaRange, showMyProperties
    ]);

    return {
        // Estados de filtros
        searchTerm,
        setSearchTerm,
        filterCategory,
        setFilterCategory,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        filterCondition,
        setFilterCondition,
        showMyProperties,
        setShowMyProperties,
        filterCities,
        setFilterCities,
        filterSectors,
        setFilterSectors,
        filterAgents,
        setFilterAgents,
        filterOperation,
        setFilterOperation,
        filterCurrency,
        setFilterCurrency,
        priceRange,
        setPriceRange,
        filterBedrooms,
        setFilterBedrooms,
        filterBathrooms,
        setFilterBathrooms,
        filterParking,
        setFilterParking,
        areaRange,
        setAreaRange,
        landAreaRange,
        setLandAreaRange,

        // Estados temporales para modales
        tempFilterCities,
        setTempFilterCities,
        tempFilterSectors,
        setTempFilterSectors,
        tempFilterAgents,
        setTempFilterAgents,
        tempShowMyProperties,
        setTempShowMyProperties,
        tempFilterBedrooms,
        setTempFilterBedrooms,
        tempFilterBathrooms,
        setTempFilterBathrooms,
        tempFilterParking,
        setTempFilterParking,
        tempAreaRange,
        setTempAreaRange,
        tempLandAreaRange,
        setTempLandAreaRange,
        tempFilterOperation,
        setTempFilterOperation,
        tempFilterCurrency,
        setTempFilterCurrency,
        tempPriceRange,
        setTempPriceRange,
        tempFilterCategory,
        setTempFilterCategory,
        tempFilterStatus,
        setTempFilterStatus,
        tempFilterType,
        setTempFilterType,
        tempFilterCondition,
        setTempFilterCondition,

        // Funciones auxiliares
        resetFilters,
        activeFiltersCount
    };
};

export default usePropertyFilters;
