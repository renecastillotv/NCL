import React, { useState, useEffect } from 'react';
import {
    X, Save, Home, Building2, MapPin, DollarSign,
    Bed, Bath, Car, Square, Calendar, User, AlertCircle,
    CheckCircle, Loader2, Camera, Plus
} from 'lucide-react';



import { supabase } from '../services/api';

// Componente principal adaptado para el entorno de desarrollo
const PropertyCreateModal = ({ user, permissions }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createdProperties, setCreatedProperties] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        property_status: 'Borrador',
        is_project: false,
        description: '',
        sale_price: null,
        sale_currency: 'USD'
    });

    // Cargar propiedades creadas recientemente
    useEffect(() => {
        loadRecentProperties();
    }, []);

    const loadRecentProperties = async () => {
        try {
            const { data } = await supabase
                .from('properties')
                .select('id, name, code, property_status, is_project, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            setCreatedProperties(data || []);
        } catch (error) {
            console.error('Error cargando propiedades:', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('El nombre es requerido');
            return;
        }

        try {
            setLoading(true);

            // Generar código único
            const code = Date.now().toString();

            const propertyData = {
                name: formData.name,
                description: formData.description || null,
                property_status: formData.property_status,
                is_project: formData.is_project,
                code: code,
                sale_price: formData.sale_price,
                sale_currency: formData.sale_currency,
                agent_id: '6e9575f8-d8ef-4671-aa7f-e7193a2d3f21', // ID fijo para entorno de prueba
                availability: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };


            console.log('🏠 Creando propiedad:', propertyData);

            const { data: newProperty, error } = await supabase
                .from('properties')
                .insert([propertyData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Propiedad creada exitosamente:', newProperty);

            // Crear project_details si es proyecto
            if (formData.is_project) {
                const { error: projectError } = await supabase
                    .from('project_details')
                    .insert([{
                        property_id: newProperty.id,
                        guarantees: JSON.stringify([]),
                        completion_percentage: 0,
                        total_units: 0,
                        available_units: 0
                    }]);

                if (projectError) {
                    console.warn('Error creando project_details:', projectError);
                }
            }

            // Reset form y cerrar modal
            setFormData({
                name: '',
                property_status: 'Borrador',
                is_project: false,
                description: '',
                sale_price: null,
                sale_currency: 'USD'
            });
            setShowModal(false);

            // Recargar lista
            await loadRecentProperties();

            alert(`¡${formData.is_project ? 'Proyecto' : 'Propiedad'} creada exitosamente!`);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 min-h-[600px]">
            <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Crear Nueva Propiedad/Proyecto
                    </h2>
                    <p className="text-gray-600">
                        Entorno de desarrollo para crear propiedades y proyectos
                    </p>
                </div>

                {/* Botón para abrir modal */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Crear Nueva Propiedad</span>
                    </button>
                </div>

                {/* Lista de propiedades recientes */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Propiedades Creadas Recientemente
                    </h3>
                    {createdProperties.length > 0 ? (
                        <div className="space-y-3">
                            {createdProperties.map((property) => (
                                <div key={property.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{property.name}</h4>
                                            <p className="text-sm text-gray-600">Código: {property.code}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {property.is_project && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    PROYECTO
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs rounded-full ${property.property_status === 'Publicada'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {property.property_status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Creada: {new Date(property.created_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            No hay propiedades creadas aún. ¡Crea tu primera propiedad!
                        </p>
                    )}
                </div>

                {/* Info del entorno */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Entorno de Desarrollo</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p>• Usuario: {user?.name} (ID: {user?.id})</p>
                        <p>• Permisos: {permissions?.userRole}</p>
                        <p>• Base de datos: Supabase (Producción)</p>
                        <p>• Estado: Desarrollo/Testing</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Crear Nueva Propiedad
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Publicación
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_project: false }))}
                                        className={`p-3 rounded-lg border-2 transition-all ${!formData.is_project
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <Home className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                                        <div className="text-sm font-medium">Propiedad</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_project: true }))}
                                        className={`p-3 rounded-lg border-2 transition-all ${formData.is_project
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <Building2 className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                                        <div className="text-sm font-medium">Proyecto</div>
                                    </button>
                                </div>
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej: Villa moderna en Punta Cana"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Descripción de la propiedad..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                />
                            </div>

                            {/* Precio */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio de Venta
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sale_price || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            sale_price: e.target.value ? parseFloat(e.target.value) : null
                                        }))}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Moneda
                                    </label>
                                    <select
                                        value={formData.sale_currency}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sale_currency: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="DOP">DOP</option>
                                    </select>
                                </div>
                            </div>

                            {/* Estado */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={formData.property_status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, property_status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="Borrador">Borrador</option>
                                    <option value="Publicada">Publicada</option>
                                    <option value="Pre-venta">Pre-venta</option>
                                    <option value="Vendida">Vendida</option>
                                    <option value="Alquilada">Alquilada</option>
                                    <option value="Suspendida">Suspendida</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.name.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{loading ? 'Creando...' : 'Crear'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyCreateModal;