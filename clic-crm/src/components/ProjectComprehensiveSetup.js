import React, { useState, useEffect } from 'react';
import {
    Building2, Users, Home, Calendar, DollarSign, Shield, ExternalLink, 
    Plus, Edit, Trash2, X, CheckCircle, Mail, Phone, Globe, Badge
} from 'lucide-react';

// Componentes UI reutilizables
const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', required = false, error, ...props }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${className}`}
            {...props}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Select = ({ label, value, onChange, options, placeholder, required = false, error, className = '' }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${className}`}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3, required = false, error, className = '' }) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-300' : 'border-gray-300'
                } ${className}`}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
);

const Button = ({ children, variant = 'primary', size = 'md', icon, disabled = false, onClick, className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 focus:ring-orange-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-orange-500'
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

const BadgeComponent = ({ children, className = '', variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-orange-100 text-orange-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        secondary: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente principal
const ProjectComprehensiveSetup = ({ projectData, onProjectDataChange, errors = {}, catalogData = {} }) => {
    const [activeSection, setActiveSection] = useState('basic');
    const [showDeveloperModal, setShowDeveloperModal] = useState(false);

    const updateProjectData = (field, value) => {
        onProjectDataChange(prev => ({ ...prev, [field]: value }));
    };

    const updateDeveloperData = (field, value) => {
        onProjectDataChange(prev => ({
            ...prev,
            developer: {
                ...prev.developer,
                [field]: value
            }
        }));
    };

    // Funciones para Tipologías
    const addTypology = () => {
        const newTypology = {
            id: Date.now(),
            name: '',
            description: '',
            bedrooms: '',
            bathrooms: '',
            built_area: '',
            balcony_area: '',
            sale_price_from: '',
            sale_price_to: '',
            sale_currency: 'USD',
            total_units: '',
            available_units: '',
            is_sold_out: false
        };
        updateProjectData('typologies', [...(projectData.typologies || []), newTypology]);
    };

    const updateTypology = (index, field, value) => {
        const updatedTypologies = [...(projectData.typologies || [])];
        updatedTypologies[index] = {
            ...updatedTypologies[index],
            [field]: value
        };
        updateProjectData('typologies', updatedTypologies);
    };

    const removeTypology = (index) => {
        const updatedTypologies = (projectData.typologies || []).filter((_, i) => i !== index);
        updateProjectData('typologies', updatedTypologies);
    };

    // Funciones para Fases
    const addPhase = () => {
        const newPhase = {
            id: Date.now(),
            phase_name: '',
            description: '',
            construction_start: '',
            estimated_delivery: '', // Este campo sí existe en project_phases
            total_units: '',
            available_units: '',
            status: 'planning',
            completion_percentage: 0
        };
        updateProjectData('phases', [...(projectData.phases || []), newPhase]);
    };

    const updatePhase = (index, field, value) => {
        const updatedPhases = [...(projectData.phases || [])];
        updatedPhases[index] = {
            ...updatedPhases[index],
            [field]: value
        };
        updateProjectData('phases', updatedPhases);
    };

    const removePhase = (index) => {
        const updatedPhases = (projectData.phases || []).filter((_, i) => i !== index);
        updateProjectData('phases', updatedPhases);
    };

    // Funciones para Planes de Pago
    const addPaymentPlan = () => {
        const newPlan = {
            id: Date.now(),
            plan_name: '',
            description: '',
            reservation_amount: '',
            reservation_currency: 'USD',
            separation_percentage: '',
            construction_percentage: '',
            construction_frequency: 'monthly',
            delivery_percentage: '',
            is_default: false,
            is_active: true
        };
        updateProjectData('payment_plans', [...(projectData.payment_plans || []), newPlan]);
    };

    const updatePaymentPlan = (index, field, value) => {
        const updatedPlans = [...(projectData.payment_plans || [])];
        updatedPlans[index] = {
            ...updatedPlans[index],
            [field]: value
        };
        updateProjectData('payment_plans', updatedPlans);
    };

    const removePaymentPlan = (index) => {
        const updatedPlans = (projectData.payment_plans || []).filter((_, i) => i !== index);
        updateProjectData('payment_plans', updatedPlans);
    };

    const sections = [
        { id: 'basic', name: 'Información Básica', icon: Building2 },
        { id: 'developer', name: 'Desarrollador', icon: Users },
        { id: 'typologies', name: 'Tipologías', icon: Home },
        { id: 'phases', name: 'Etapas', icon: Calendar },
        { id: 'payments', name: 'Planes de Pago', icon: DollarSign },
        { id: 'guarantees', name: 'Garantías', icon: Shield },
        { id: 'availability', name: 'Disponibilidad', icon: ExternalLink }
    ];

    // Secciones de Renderizado
    const renderBasicSection = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Total de unidades"
                    type="number"
                    value={projectData.total_units}
                    onChange={(value) => updateProjectData('total_units', value)}
                    placeholder="120"
                    required
                    error={errors.total_units}
                />

                <Input
                    label="Unidades disponibles"
                    type="number"
                    value={projectData.available_units}
                    onChange={(value) => updateProjectData('available_units', value)}
                    placeholder="85"
                />

                <Input
                    label="Porcentaje de avance"
                    type="number"
                    min="0"
                    max="100"
                    value={projectData.completion_percentage}
                    onChange={(value) => updateProjectData('completion_percentage', value)}
                    placeholder="45"
                />

                <Input
                    label="Fecha estimada de entrega"
                    type="date"
                    value={projectData.estimated_completion_date}
                    onChange={(value) => updateProjectData('estimated_completion_date', value)}
                />
            </div>
        </div>
    );

    const renderDeveloperSection = () => (
        <div className="space-y-6">
            {projectData.developer?.name ? (
                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{projectData.developer.name}</h4>
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => setShowDeveloperModal(true)}
                        >
                            Editar
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {projectData.developer.email && (
                            <div className="flex items-center text-gray-700">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {projectData.developer.email}
                            </div>
                        )}
                        {projectData.developer.phone && (
                            <div className="flex items-center text-gray-700">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {projectData.developer.phone}
                            </div>
                        )}
                        {projectData.developer.website && (
                            <div className="flex items-center text-gray-700">
                                <Globe className="w-4 h-4 mr-2 text-gray-400" />
                                {projectData.developer.website}
                            </div>
                        )}
                        {projectData.developer.years_experience && (
                            <div className="text-gray-700">
                                <span className="font-medium">Experiencia:</span> {projectData.developer.years_experience} años
                            </div>
                        )}
                    </div>
                    
                    {projectData.developer.description && (
                        <p className="text-gray-600 text-sm mt-4 pt-4 border-t border-gray-100">
                            {projectData.developer.description}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Información del Desarrollador</h4>
                    <p className="text-gray-600 mb-4">Agrega la información del desarrollador del proyecto</p>
                    <Button
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowDeveloperModal(true)}
                    >
                        Agregar Desarrollador
                    </Button>
                </div>
            )}

            {/* Modal para desarrollador */}
            {showDeveloperModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Información del Desarrollador</h3>
                                <button
                                    onClick={() => setShowDeveloperModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    value={projectData.developer?.name || ''}
                                    onChange={(value) => updateDeveloperData('name', value)}
                                    placeholder="Constructora ABC"
                                />
                                <Input
                                    label="Razón Social"
                                    value={projectData.developer?.legal_name || ''}
                                    onChange={(value) => updateDeveloperData('legal_name', value)}
                                    placeholder="ABC Constructora SRL"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={projectData.developer?.email || ''}
                                    onChange={(value) => updateDeveloperData('email', value)}
                                    placeholder="info@constructora.com"
                                />
                                <Input
                                    label="Teléfono"
                                    value={projectData.developer?.phone || ''}
                                    onChange={(value) => updateDeveloperData('phone', value)}
                                    placeholder="+1 809-555-0123"
                                />
                                <Input
                                    label="Sitio Web"
                                    value={projectData.developer?.website || ''}
                                    onChange={(value) => updateDeveloperData('website', value)}
                                    placeholder="https://constructora.com"
                                />
                                <Input
                                    label="Años de Experiencia"
                                    type="number"
                                    value={projectData.developer?.years_experience || ''}
                                    onChange={(value) => updateDeveloperData('years_experience', value)}
                                    placeholder="15"
                                />
                            </div>
                            <Textarea
                                label="Descripción"
                                value={projectData.developer?.description || ''}
                                onChange={(value) => updateDeveloperData('description', value)}
                                placeholder="Descripción del desarrollador..."
                                rows={3}
                            />
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeveloperModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setShowDeveloperModal(false)}
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTypologiesSection = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                    Tipologías del Proyecto
                    <BadgeComponent variant="primary" className="ml-3">
                        {(projectData.typologies || []).length}
                    </BadgeComponent>
                </h4>
                <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={addTypology}
                >
                    Nueva Tipología
                </Button>
            </div>

            {(projectData.typologies || []).length > 0 ? (
                <div className="space-y-4">
                    {projectData.typologies.map((typology, index) => (
                        <div key={typology.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-gray-900">
                                    {typology.name || `Tipología ${index + 1}`}
                                </h5>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => removeTypology(index)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Eliminar
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Nombre"
                                    value={typology.name}
                                    onChange={(value) => updateTypology(index, 'name', value)}
                                    placeholder="2H/2B"
                                />
                                <Input
                                    label="Habitaciones"
                                    type="number"
                                    value={typology.bedrooms}
                                    onChange={(value) => updateTypology(index, 'bedrooms', value)}
                                    placeholder="2"
                                />
                                <Input
                                    label="Baños"
                                    type="number"
                                    step="0.5"
                                    value={typology.bathrooms}
                                    onChange={(value) => updateTypology(index, 'bathrooms', value)}
                                    placeholder="2.5"
                                />
                                <Input
                                    label="Área Construida (m²)"
                                    type="number"
                                    value={typology.built_area}
                                    onChange={(value) => updateTypology(index, 'built_area', value)}
                                    placeholder="75"
                                />
                                <Input
                                    label="Precio Desde"
                                    type="number"
                                    value={typology.sale_price_from}
                                    onChange={(value) => updateTypology(index, 'sale_price_from', value)}
                                    placeholder="145000"
                                />
                                <Input
                                    label="Precio Hasta"
                                    type="number"
                                    value={typology.sale_price_to}
                                    onChange={(value) => updateTypology(index, 'sale_price_to', value)}
                                    placeholder="165000"
                                />
                            </div>
                            
                            <Textarea
                                label="Descripción"
                                value={typology.description}
                                onChange={(value) => updateTypology(index, 'description', value)}
                                placeholder="Descripción de la tipología..."
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No hay tipologías agregadas</p>
                    <Button variant="primary" onClick={addTypology}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primera Tipología
                    </Button>
                </div>
            )}
        </div>
    );

    const renderPhasesSection = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                    Etapas del Proyecto
                    <BadgeComponent variant="primary" className="ml-3">
                        {(projectData.phases || []).length}
                    </BadgeComponent>
                </h4>
                <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={addPhase}
                >
                    Nueva Etapa
                </Button>
            </div>

            {(projectData.phases || []).length > 0 ? (
                <div className="space-y-4">
                    {projectData.phases.map((phase, index) => (
                        <div key={phase.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-gray-900">
                                    {phase.phase_name || `Etapa ${index + 1}`}
                                </h5>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => removePhase(index)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Eliminar
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre de la Etapa"
                                    value={phase.phase_name}
                                    onChange={(value) => updatePhase(index, 'phase_name', value)}
                                    placeholder="Torre A"
                                />
                                <Input
                                    label="Porcentaje de Avance"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={phase.completion_percentage}
                                    onChange={(value) => updatePhase(index, 'completion_percentage', value)}
                                    placeholder="75"
                                />
                                <Input
                                    label="Fecha de Inicio"
                                    type="date"
                                    value={phase.construction_start}
                                    onChange={(value) => updatePhase(index, 'construction_start', value)}
                                />
                                <Input
                                    label="Fecha de Entrega"
                                    type="date"
                                    value={phase.estimated_delivery}
                                    onChange={(value) => updatePhase(index, 'estimated_delivery', value)}
                                />
                            </div>
                            
                            <Textarea
                                label="Descripción"
                                value={phase.description}
                                onChange={(value) => updatePhase(index, 'description', value)}
                                placeholder="Descripción de la etapa..."
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No hay etapas agregadas</p>
                    <Button variant="primary" onClick={addPhase}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primera Etapa
                    </Button>
                </div>
            )}
        </div>
    );

    const renderPaymentsSection = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                    Planes de Pago
                    <BadgeComponent variant="primary" className="ml-3">
                        {(projectData.payment_plans || []).length}
                    </BadgeComponent>
                </h4>
                <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={addPaymentPlan}
                >
                    Nuevo Plan
                </Button>
            </div>

            {(projectData.payment_plans || []).length > 0 ? (
                <div className="space-y-4">
                    {projectData.payment_plans.map((plan, index) => (
                        <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-gray-900">
                                    {plan.plan_name || `Plan ${index + 1}`}
                                </h5>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => removePaymentPlan(index)}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    Eliminar
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre del Plan"
                                    value={plan.plan_name}
                                    onChange={(value) => updatePaymentPlan(index, 'plan_name', value)}
                                    placeholder="Plan Tradicional"
                                />
                                <Input
                                    label="Monto de Reserva"
                                    type="number"
                                    value={plan.reservation_amount}
                                    onChange={(value) => updatePaymentPlan(index, 'reservation_amount', value)}
                                    placeholder="5000"
                                />
                                <Input
                                    label="% Separación"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={plan.separation_percentage}
                                    onChange={(value) => updatePaymentPlan(index, 'separation_percentage', value)}
                                    placeholder="10"
                                />
                                <Input
                                    label="% Construcción"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={plan.construction_percentage}
                                    onChange={(value) => updatePaymentPlan(index, 'construction_percentage', value)}
                                    placeholder="70"
                                />
                                <Input
                                    label="% Entrega"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={plan.delivery_percentage}
                                    onChange={(value) => updatePaymentPlan(index, 'delivery_percentage', value)}
                                    placeholder="20"
                                />
                                <Select
                                    label="Frecuencia"
                                    value={plan.construction_frequency}
                                    onChange={(value) => updatePaymentPlan(index, 'construction_frequency', value)}
                                    options={[
                                        { value: 'monthly', label: 'Mensual' },
                                        { value: 'quarterly', label: 'Trimestral' },
                                        { value: 'biannual', label: 'Semestral' }
                                    ]}
                                    placeholder="Seleccionar frecuencia"
                                />
                            </div>
                            
                            <Textarea
                                label="Descripción"
                                value={plan.description}
                                onChange={(value) => updatePaymentPlan(index, 'description', value)}
                                placeholder="Descripción del plan..."
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No hay planes de pago configurados</p>
                    <Button variant="primary" onClick={addPaymentPlan}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer Plan
                    </Button>
                </div>
            )}
        </div>
    );

    const renderGuaranteesSection = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Garantías del proyecto
                </label>
                <Textarea
                    value={(projectData.guarantees || []).join('\n')}
                    onChange={(value) => updateProjectData('guarantees', value.split('\n').filter(g => g.trim()))}
                    placeholder="Garantía de estructura por 10 años&#10;Garantía de acabados por 2 años&#10;Garantía contra defectos de construcción&#10;Desarrollador certificado"
                    rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">Una garantía por línea</p>
            </div>

            {(projectData.guarantees || []).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-2">Vista previa de garantías:</h5>
                    <div className="space-y-1">
                        {projectData.guarantees.map((guarantee, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">{guarantee}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderAvailabilitySection = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Tipo de Enlace"
                    value={projectData.availability_external_type || ''}
                    onChange={(value) => updateProjectData('availability_external_type', value)}
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
                    value={projectData.availability_external_url || ''}
                    onChange={(value) => updateProjectData('availability_external_url', value)}
                    placeholder="https://drive.google.com/..."
                />
            </div>
            
            <Textarea
                label="Descripción del enlace"
                value={projectData.availability_external_description || ''}
                onChange={(value) => updateProjectData('availability_external_description', value)}
                placeholder="Descripción del enlace de disponibilidad..."
                rows={3}
            />

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="auto-sync"
                    checked={projectData.availability_auto_sync || false}
                    onChange={(e) => updateProjectData('availability_auto_sync', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="auto-sync" className="text-sm font-medium text-gray-700">
                    Sincronización automática
                </label>
            </div>
        </div>
    );

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'basic': return renderBasicSection();
            case 'developer': return renderDeveloperSection();
            case 'typologies': return renderTypologiesSection();
            case 'phases': return renderPhasesSection();
            case 'payments': return renderPaymentsSection();
            case 'guarantees': return renderGuaranteesSection();
            case 'availability': return renderAvailabilitySection();
            default: return renderBasicSection();
        }
    };

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`${
                                    isActive
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {section.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Section Content */}
            <div className="min-h-[400px]">
                {renderSectionContent()}
            </div>
        </div>
    );
};

export default ProjectComprehensiveSetup;