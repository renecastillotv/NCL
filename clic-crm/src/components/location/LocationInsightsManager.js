import React, { useState, useEffect } from 'react';
import { Database, Plus, Settings } from 'lucide-react';

// Importar los componentes separados
import LocationsList from './LocationsList';
import { LocationDetail, CreateLocation } from './LocationEditor';
import DataCleanup from './DataCleanup';

// FASE 1: Supabase centralizado
import { supabase } from '../../services/api';

// Componente Tab
const Tab = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            active
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
    </button>
);

// Componente principal
const LocationInsightsManager = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('location_insights')
                .select('*')
                .neq('status', 'inactive') // Filtrar los fusionados/inactivos
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLocations(data || []);
        } catch (err) {
            console.error('Error fetching locations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSave = async (locationId, formData) => {
        try {
            const { error } = await supabase
                .from('location_insights')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', locationId);

            if (error) throw error;

            alert('Ubicación actualizada exitosamente');
            await fetchLocations();
            
            // Actualizar el objeto seleccionado
            const updatedLocation = await supabase
                .from('location_insights')
                .select('*')
                .eq('id', locationId)
                .single();
            
            if (updatedLocation.data) {
                setSelectedLocation(updatedLocation.data);
            }
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    };

    const handleLocationCreate = async (formData) => {
        try {
            const { data, error } = await supabase
                .from('location_insights')
                .insert([{
                    ...formData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            alert('Ubicación creada exitosamente');
            setShowCreateForm(false);
            await fetchLocations();
            setSelectedLocation(data);
            setActiveTab('list');
            
            return data;
        } catch (error) {
            console.error('Error creating location:', error);
            throw error;
        }
    };

    const handleLocationDelete = async (locationId) => {
        try {
            const { error } = await supabase
                .from('location_insights')
                .update({ 
                    status: 'inactive',
                    updated_at: new Date().toISOString()
                })
                .eq('id', locationId);

            if (error) throw error;

            alert('Ubicación eliminada exitosamente');
            await fetchLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
            throw error;
        }
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
    };

    const handleCreateNew = () => {
        setShowCreateForm(true);
        setActiveTab('create');
    };

    const handleBackToList = () => {
        setSelectedLocation(null);
        setShowCreateForm(false);
        setActiveTab('list');
    };

    const tabs = [
        { id: 'list', label: 'Lista de Ubicaciones', icon: <Database className="w-4 h-4" /> },
        { id: 'create', label: 'Crear Ubicación', icon: <Plus className="w-4 h-4" /> },
        { id: 'cleanup', label: 'Limpieza de Duplicados', icon: <Settings className="w-4 h-4" /> }
    ];

    // Si estamos viendo detalles de una ubicación
    if (selectedLocation && !showCreateForm) {
        return (
            <LocationDetail
                location={selectedLocation}
                locations={locations}
                onBack={handleBackToList}
                onSave={handleLocationSave}
                onDelete={handleLocationDelete}
            />
        );
    }

    // Si estamos creando una nueva ubicación
    if (showCreateForm || activeTab === 'create') {
        return (
            <CreateLocation
                locations={locations}
                onSave={handleLocationCreate}
                onCancel={handleBackToList}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Location Insights Manager</h1>
                <p className="text-gray-600">Gestiona ubicaciones y limpia duplicados</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
                {tabs.map(tab => (
                    <Tab
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowCreateForm(tab.id === 'create');
                        }}
                        icon={tab.icon}
                    >
                        {tab.label}
                    </Tab>
                ))}
            </div>

            {/* Contenido según tab activo */}
            {activeTab === 'list' && (
                <LocationsList
                    locations={locations}
                    loading={loading}
                    onLocationSelect={handleLocationSelect}
                    onCreateNew={handleCreateNew}
                />
            )}

            {activeTab === 'cleanup' && (
                <DataCleanup 
                    locations={locations.filter(l => l.status === 'active')} 
                    onRefresh={fetchLocations}
                />
            )}
        </div>
    );
};

export default LocationInsightsManager;