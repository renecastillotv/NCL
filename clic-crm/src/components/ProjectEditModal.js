import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit, CheckCircle } from 'lucide-react';

// Componentes UI
const Input = ({ label, type = "text", value, onChange, placeholder, className = "", ...props }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
            {...props}
        />
    </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
    </div>
);

const Select = ({ label, value, onChange, options, placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const Button = ({ children, variant = "primary", onClick, className = "" }) => {
    const variants = {
        primary: "bg-orange-600 text-white hover:bg-orange-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    };
    
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

const ProjectEditModal = ({ 
    isOpen, 
    section, 
    data, 
    onClose, 
    onSave, 
    onDelete, 
    projectId, 
    availableDocuments = [], 
    availableBenefits = [] 
}) => {
    const [formData, setFormData] = useState({});

    // Inicializar formData cuando se abre el modal
    useEffect(() => {
        if (isOpen && data) {
            setFormData({ ...data });
        } else if (isOpen && !data) {
            const defaultValues = getDefaultValues(section);
            setFormData(defaultValues);
        }
    }, [isOpen, data, section]);

    // Función para obtener valores por defecto según la sección
    const getDefaultValues = (section) => {
        const defaults = {
            'developer': {
                name: '',
                legal_name: '',
                email: '',
                phone: '',
                website: '',
                years_experience: null,
                description: ''
            },
            'guarantees': {
                guarantees_text: ''
            },
            'typologies': {
                project_id: projectId,
                name: '',
                description: '',
                bedrooms: null,
                bathrooms: null,
                built_area: null,
                balcony_area: null,
                total_area: null,
                sale_price_from: null,
                sale_price_to: null,
                sale_currency: 'USD',
                total_units: null,
                available_units: null,
                is_sold_out: false,
                sort_order: 0
            },
            'phases': {
                project_id: projectId,
                phase_name: '',
                description: '',
                construction_start: null,
                estimated_delivery: null,
                total_units: null,
                available_units: null,
                status: 'planning',
                completion_percentage: 0,
                sort_order: 0
            },
            'availability': {
                availability_external_url: '',
                availability_external_type: '',
                availability_external_description: '',
                availability_auto_sync: false
            },
            'payments': {
                project_id: projectId,
                plan_name: '',
                description: '',
                reservation_amount: null,
                reservation_currency: 'USD',
                separation_percentage: null,
                construction_percentage: null,
                construction_frequency: '',
                delivery_percentage: null,
                is_default: false,
                is_active: true
            },
            'benefits': {
                project_id: projectId,
                benefit_id: null,
                custom_value_amount: null,
                custom_value_percentage: null,
                custom_description: '',
                project_specific_conditions: '',
                start_date: null,
                end_date: null,
                is_active: true
            },
            'documents': {
                selectedDocuments: []
            }
        };
        
        return defaults[section] || {};
    };

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleGuaranteesChange = useCallback((value) => {
        setFormData(prev => ({
            ...prev,
            guarantees_text: value
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            const processedData = processFormDataForSection(section, formData);
            await onSave(processedData);
            onClose();
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    }, [formData, onSave, onClose, section]);

    const processFormDataForSection = (section, data) => {
        switch (section) {
            case 'typologies':
            case 'phases':
            case 'payments':
            case 'benefits':
                return {
                    ...data,
                    project_id: projectId
                };
                
            case 'guarantees':
                const guaranteesArray = data.guarantees_text 
                    ? data.guarantees_text.split('\n').filter(line => line.trim() !== '')
                    : [];
                return {
                    guarantees: guaranteesArray
                };
                
            case 'availability':
                return {
                    availability_external_url: data.availability_external_url || null,
                    availability_external_type: data.availability_external_type || null,
                    availability_external_description: data.availability_external_description || null,
                    availability_auto_sync: data.availability_auto_sync || false
                };
                
            case 'documents':
                return {
                    project_id: projectId,
                    documents: data.selectedDocuments || []
                };
                
            default:
                return data;
        }
    };

    const handleDocumentChange = useCallback((documentId, field, value) => {
        setFormData(prev => {
            const selectedDocuments = [...(prev.selectedDocuments || [])];
            const existingIndex = selectedDocuments.findIndex(d => d.document_catalog_id === documentId);
            
            if (existingIndex >= 0) {
                if (field === 'selected' && !value) {
                    selectedDocuments.splice(existingIndex, 1);
                } else {
                    selectedDocuments[existingIndex] = {
                        ...selectedDocuments[existingIndex],
                        [field]: value
                    };
                }
            } else if (field === 'selected' && value) {
                selectedDocuments.push({
                    document_catalog_id: documentId,
                    clic_has_document: true,
                    notes: '',
                    verification_date: new Date().toISOString().split('T')[0]
                });
            }
            
            return {
                ...prev,
                selectedDocuments
            };
        });
    }, []);

    const handleDelete = useCallback(async () => {
        if (!data?.id || !onDelete) return;
        
        const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este elemento?');
        if (!confirmDelete) return;
        
        try {
            await onDelete(data.id);
            onClose();
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    }, [data, onDelete, onClose]);

    const handleCancel = useCallback(() => {
        setFormData({});
        onClose();
    }, [onClose]);

    if (!isOpen) return null;

    const getModalContent = () => {
        switch (section) {
            case 'developer':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Editar Desarrollador</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre"
                                value={formData.name}
                                onChange={(value) => handleInputChange('name', value)}
                                placeholder="Nombre del desarrollador"
                            />
                            <Input
                                label="Razón Social"
                                value={formData.legal_name}
                                onChange={(value) => handleInputChange('legal_name', value)}
                                placeholder="Razón social (opcional)"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(value) => handleInputChange('email', value)}
                                placeholder="email@desarrollador.com"
                            />
                            <Input
                                label="Teléfono"
                                value={formData.phone}
                                onChange={(value) => handleInputChange('phone', value)}
                                placeholder="+1 809-555-0123"
                            />
                            <Input
                                label="Sitio Web"
                                value={formData.website}
                                onChange={(value) => handleInputChange('website', value)}
                                placeholder="https://desarrollador.com"
                            />
                            <Input
                                label="Años de Experiencia"
                                type="number"
                                value={formData.years_experience}
                                onChange={(value) => handleInputChange('years_experience', value ? parseInt(value) : null)}
                                placeholder="15"
                            />
                        </div>
                        <Textarea
                            label="Descripción"
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Descripción del desarrollador..."
                            rows={3}
                        />
                    </div>
                );

            case 'guarantees':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Editar Garantías</h3>
                        <Textarea
                            label="Garantías del Proyecto"
                            value={Array.isArray(formData.guarantees) ? formData.guarantees.join('\n') : formData.guarantees_text || ''}
                            onChange={handleGuaranteesChange}
                            placeholder="Escriba cada garantía en una línea diferente:&#10;Desarrollador certificado&#10;Garantía de construcción&#10;Permisos depositados"
                            rows={8}
                        />
                        <p className="text-sm text-gray-600">
                            Escriba cada garantía en una línea separada.
                        </p>
                    </div>
                );

            case 'typologies':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {formData.id ? 'Editar Tipología' : 'Nueva Tipología'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre de la Tipología"
                                value={formData.name}
                                onChange={(value) => handleInputChange('name', value)}
                                placeholder="Ej: Estudio, 2H/2B, Penthouse"
                            />
                            <Input
                                label="Habitaciones"
                                type="number"
                                value={formData.bedrooms}
                                onChange={(value) => handleInputChange('bedrooms', value ? parseInt(value) : null)}
                                placeholder="2"
                            />
                            <Input
                                label="Baños"
                                type="number"
                                step="0.5"
                                value={formData.bathrooms}
                                onChange={(value) => handleInputChange('bathrooms', value ? parseFloat(value) : null)}
                                placeholder="2.5"
                            />
                            <Input
                                label="Área Construida (m²)"
                                type="number"
                                step="0.01"
                                value={formData.built_area}
                                onChange={(value) => handleInputChange('built_area', value ? parseFloat(value) : null)}
                                placeholder="75"
                            />
                            <Input
                                label="Área Balcón (m²)"
                                type="number"
                                step="0.01"
                                value={formData.balcony_area}
                                onChange={(value) => handleInputChange('balcony_area', value ? parseFloat(value) : null)}
                                placeholder="12"
                            />
                            <Input
                                label="Precio Desde (USD)"
                                type="number"
                                step="0.01"
                                value={formData.sale_price_from}
                                onChange={(value) => handleInputChange('sale_price_from', value ? parseFloat(value) : null)}
                                placeholder="145000"
                            />
                            <Input
                                label="Precio Hasta (USD)"
                                type="number"
                                step="0.01"
                                value={formData.sale_price_to}
                                onChange={(value) => handleInputChange('sale_price_to', value ? parseFloat(value) : null)}
                                placeholder="165000"
                            />
                            <Input
                                label="Total de Unidades"
                                type="number"
                                value={formData.total_units}
                                onChange={(value) => handleInputChange('total_units', value ? parseInt(value) : null)}
                                placeholder="60"
                            />
                            <Input
                                label="Unidades Disponibles"
                                type="number"
                                value={formData.available_units}
                                onChange={(value) => handleInputChange('available_units', value ? parseInt(value) : null)}
                                placeholder="25"
                            />
                            <Select
                                label="Moneda"
                                value={formData.sale_currency}
                                onChange={(value) => handleInputChange('sale_currency', value)}
                                options={[
                                    { value: 'USD', label: 'USD - Dólares' },
                                    { value: 'DOP', label: 'DOP - Pesos' }
                                ]}
                                placeholder="Seleccionar moneda"
                            />
                        </div>
                        <Textarea
                            label="Descripción"
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Descripción de la tipología..."
                        />
                    </div>
                );

            case 'phases':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {formData.id ? 'Editar Etapa' : 'Nueva Etapa'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre de la Etapa"
                                value={formData.phase_name}
                                onChange={(value) => handleInputChange('phase_name', value)}
                                placeholder="Ej: Torre A, Fase 1"
                            />
                            <Input
                                label="Porcentaje de Avance"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.completion_percentage}
                                onChange={(value) => handleInputChange('completion_percentage', value ? parseInt(value) : 0)}
                                placeholder="75"
                            />
                            <Input
                                label="Fecha de Inicio"
                                type="date"
                                value={formData.construction_start}
                                onChange={(value) => handleInputChange('construction_start', value || null)}
                            />
                            <Input
                                label="Fecha de Entrega Estimada"
                                type="date"
                                value={formData.estimated_delivery}
                                onChange={(value) => handleInputChange('estimated_delivery', value || null)}
                            />
                            <Input
                                label="Total de Unidades"
                                type="number"
                                value={formData.total_units}
                                onChange={(value) => handleInputChange('total_units', value ? parseInt(value) : null)}
                                placeholder="60"
                            />
                            <Input
                                label="Unidades Disponibles"
                                type="number"
                                value={formData.available_units}
                                onChange={(value) => handleInputChange('available_units', value ? parseInt(value) : null)}
                                placeholder="20"
                            />
                            <Select
                                label="Estado"
                                value={formData.status}
                                onChange={(value) => handleInputChange('status', value)}
                                options={[
                                    { value: 'planning', label: 'Planeando' },
                                    { value: 'in_progress', label: 'En Construcción' },
                                    { value: 'completed', label: 'Completado' },
                                    { value: 'delivered', label: 'Entregado' }
                                ]}
                                placeholder="Seleccionar estado"
                            />
                        </div>
                        <Textarea
                            label="Descripción"
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Descripción de la etapa..."
                        />
                    </div>
                );

            case 'availability':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Configurar Disponibilidad Externa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Tipo de Enlace"
                                value={formData.availability_external_type}
                                onChange={(value) => handleInputChange('availability_external_type', value)}
                                options={[
                                    { value: 'drive', label: 'Google Drive' },
                                    { value: 'dropbox', label: 'Dropbox' },
                                    { value: 'excel_online', label: 'Excel Online' },
                                    { value: 'csv_url', label: 'CSV en línea' },
                                    { value: 'website', label: 'Página web' },
                                    { value: 'other', label: 'Otro' }
                                ]}
                                placeholder="Seleccionar tipo"
                            />
                            <Input
                                label="URL del Enlace"
                                value={formData.availability_external_url}
                                onChange={(value) => handleInputChange('availability_external_url', value)}
                                placeholder="https://drive.google.com/..."
                            />
                            <div className="md:col-span-2">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.availability_auto_sync || false}
                                        onChange={(e) => handleInputChange('availability_auto_sync', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Sincronización automática</span>
                                </label>
                            </div>
                        </div>
                        <Textarea
                            label="Descripción"
                            value={formData.availability_external_description}
                            onChange={(value) => handleInputChange('availability_external_description', value)}
                            placeholder="Descripción del enlace de disponibilidad..."
                        />
                    </div>
                );

            case 'payments':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {formData.id ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre del Plan"
                                value={formData.plan_name}
                                onChange={(value) => handleInputChange('plan_name', value)}
                                placeholder="Plan Tradicional"
                            />
                            <Input
                                label="Monto de Reserva (USD)"
                                type="number"
                                step="0.01"
                                value={formData.reservation_amount}
                                onChange={(value) => handleInputChange('reservation_amount', value ? parseFloat(value) : null)}
                                placeholder="5000"
                            />
                            <Input
                                label="Porcentaje de Separación (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.separation_percentage}
                                onChange={(value) => handleInputChange('separation_percentage', value ? parseFloat(value) : null)}
                                placeholder="10"
                            />
                            <Input
                                label="Porcentaje Durante Construcción (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.construction_percentage}
                                onChange={(value) => handleInputChange('construction_percentage', value ? parseFloat(value) : null)}
                                placeholder="70"
                            />
                            <Input
                                label="Porcentaje en Entrega (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.delivery_percentage}
                                onChange={(value) => handleInputChange('delivery_percentage', value ? parseFloat(value) : null)}
                                placeholder="20"
                            />
                            <Select
                                label="Frecuencia de Pagos"
                                value={formData.construction_frequency}
                                onChange={(value) => handleInputChange('construction_frequency', value)}
                                options={[
                                    { value: 'monthly', label: 'Mensual' },
                                    { value: 'quarterly', label: 'Trimestral' },
                                    { value: 'biannual', label: 'Semestral' }
                                ]}
                                placeholder="Seleccionar frecuencia"
                            />
                            <Select
                                label="Moneda"
                                value={formData.reservation_currency}
                                onChange={(value) => handleInputChange('reservation_currency', value)}
                                options={[
                                    { value: 'USD', label: 'USD - Dólares' },
                                    { value: 'DOP', label: 'DOP - Pesos' }
                                ]}
                                placeholder="Seleccionar moneda"
                            />
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_default || false}
                                        onChange={(e) => handleInputChange('is_default', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Plan por defecto</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active !== false}
                                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Activo</span>
                                </label>
                            </div>
                        </div>
                        <Textarea
                            label="Descripción del Plan"
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Descripción del plan de pago..."
                        />
                    </div>
                );

            case 'benefits':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {formData.id ? 'Editar Beneficio' : 'Nuevo Beneficio'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Beneficio del Catálogo"
                                value={formData.benefit_id}
                                onChange={(value) => handleInputChange('benefit_id', value)}
                                options={availableBenefits.map(benefit => ({
                                    value: benefit.id,
                                    label: benefit.name
                                }))}
                                placeholder="Seleccionar beneficio"
                            />
                            <Input
                                label="Porcentaje de Descuento (%)"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.custom_value_percentage}
                                onChange={(value) => handleInputChange('custom_value_percentage', value ? parseFloat(value) : null)}
                                placeholder="5"
                            />
                            <Input
                                label="Monto Fijo (USD)"
                                type="number"
                                step="0.01"
                                value={formData.custom_value_amount}
                                onChange={(value) => handleInputChange('custom_value_amount', value ? parseFloat(value) : null)}
                                placeholder="15000"
                            />
                            <Input
                                label="Fecha de Inicio"
                                type="date"
                                value={formData.start_date}
                                onChange={(value) => handleInputChange('start_date', value || null)}
                            />
                            <Input
                                label="Fecha de Fin"
                                type="date"
                                value={formData.end_date}
                                onChange={(value) => handleInputChange('end_date', value || null)}
                            />
                            <div className="flex items-center">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active !== false}
                                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Activo</span>
                                </label>
                            </div>
                        </div>
                        <Textarea
                            label="Descripción Personalizada"
                            value={formData.custom_description}
                            onChange={(value) => handleInputChange('custom_description', value)}
                            placeholder="Descripción personalizada del beneficio..."
                        />
                        <Textarea
                            label="Condiciones Específicas"
                            value={formData.project_specific_conditions}
                            onChange={(value) => handleInputChange('project_specific_conditions', value)}
                            placeholder="Condiciones específicas para este proyecto..."
                        />
                    </div>
                );

            case 'documents':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Gestión de Documentos</h3>
                        <p className="text-sm text-gray-600">
                            Marca qué documentos están disponibles para este proyecto.
                        </p>
                        <div className="space-y-3">
                            {availableDocuments.map((document) => {
                                const selectedDocument = formData.selectedDocuments?.find(d => d.document_catalog_id === document.id);
                                const isSelected = !!selectedDocument;
                                
                                return (
                                    <div key={document.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center space-x-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={(e) => handleDocumentChange(document.id, 'selected', e.target.checked)}
                                                    className="rounded"
                                                />
                                                <div>
                                                    <span className="font-medium">{document.display_name}</span>
                                                    {document.description && (
                                                        <p className="text-sm text-gray-500">{document.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                        
                                        {isSelected && (
                                            <div className="mt-3">
                                                <Textarea
                                                    label="Notas"
                                                    value={selectedDocument?.notes || ''}
                                                    onChange={(value) => handleDocumentChange(document.id, 'notes', value)}
                                                    placeholder="Notas adicionales sobre este documento..."
                                                    rows={2}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Sección "{section}" no encontrada</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Editar {section === 'developer' ? 'Desarrollador' : 
                               section === 'typologies' ? 'Tipologías' :
                               section === 'phases' ? 'Etapas' :
                               section === 'guarantees' ? 'Garantías' :
                               section === 'availability' ? 'Disponibilidad' :
                               section === 'payments' ? 'Plan de Pago' :
                               section === 'benefits' ? 'Beneficios' :
                               section === 'documents' ? 'Documentos' : 'Sección'}
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {getModalContent()}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        {data?.id && onDelete && (
                            <Button 
                                variant="outline" 
                                onClick={handleDelete}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                                🗑️ Eliminar
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSubmit}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            💾 Guardar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectEditModal;