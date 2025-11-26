import React, { useState, useEffect } from 'react';
import {
    Plus, Edit3, Trash2, Copy, Settings, Users, MapPin, Camera,
    Percent, DollarSign, Award, Crown, Star, UserCheck, Building,
    Save, X, ChevronDown, ChevronRight, Eye, EyeOff, MoreHorizontal
} from 'lucide-react';

const CommissionAdminConfig = () => {
    const [activeTab, setActiveTab] = useState('templates');
    
    // Plantillas base de asesores
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'Nuevo Ingreso',
            type: 'position',
            isDefault: true,
            active: true,
            distribution: {
                ready_properties: {
                    venta: 50,
                    captacion: 25,
                    clic: 25
                },
                projects: {
                    venta: 50,
                    captacion: 10,
                    clic: 40
                }
            },
            rules: {
                properties_ready_base: 3.0,
                properties_project_base: 3.5,
                referral_bonus: 500,
                capture_bonus: 300
            },
            users_count: 5,
            created_at: '2024-01-15'
        },
        {
            id: 2,
            name: 'Asesor Pro',
            type: 'position',
            isDefault: true,
            active: true,
            distribution: {
                ready_properties: {
                    venta: 55,
                    captacion: 25,
                    clic: 20
                },
                projects: {
                    venta: 55,
                    captacion: 15,
                    clic: 30
                }
            },
            rules: {
                properties_ready_base: 4.0,
                properties_project_base: 4.5,
                referral_bonus: 750,
                capture_bonus: 500
            },
            users_count: 12,
            created_at: '2024-01-15'
        },
        {
            id: 3,
            name: 'Top Producer',
            type: 'position',
            isDefault: true,
            active: true,
            distribution: {
                ready_properties: {
                    venta: 60,
                    captacion: 25,
                    clic: 15
                },
                projects: {
                    venta: 60,
                    captacion: 20,
                    clic: 20
                }
            },
            rules: {
                properties_ready_base: 5.0,
                properties_project_base: 5.5,
                referral_bonus: 1000,
                capture_bonus: 750
            },
            users_count: 3,
            created_at: '2024-01-15'
        }
    ]);

    // Especialidades adicionales
    const [specialties, setSpecialties] = useState([
        {
            id: 1,
            name: 'Especialidad Influencer',
            type: 'specialty',
            percentage_bonus: 5,
            active: true,
            description: 'Bonificación adicional para asesores con influencia en redes sociales',
            users_count: 2
        },
        {
            id: 2,
            name: 'Filmmaker',
            type: 'specialty',
            percentage_bonus: 5,
            active: true,
            description: 'Porcentaje destinado al equipo de filmación cuando se usa el servicio',
            users_count: 1
        },
        {
            id: 3,
            name: 'Administrativo',
            type: 'specialty',
            percentage_bonus: 5,
            active: true,
            description: 'Porcentaje para funciones administrativas especiales',
            users_count: 0
        },
        {
            id: 4,
            name: 'Franquicia',
            type: 'specialty',
            percentage_bonus: 7,
            active: true,
            description: 'Porcentaje destinado a regalías de franquicia',
            users_count: 0
        },
        {
            id: 5,
            name: 'Líder de Equipo',
            type: 'specialty',
            percentage_bonus: 5,
            active: true,
            description: 'Bonificación por liderazgo y desarrollo de equipo',
            users_count: 1
        },
        {
            id: 6,
            name: 'Mentor',
            type: 'specialty',
            percentage_bonus: 5,
            active: true,
            description: 'Porcentaje destinado a mentores por desarrollo de nuevos asesores',
            users_count: 3
        }
    ]);

    // División interna de CLIC
    const [internalDivision, setInternalDivision] = useState([
        {
            id: 1,
            name: 'María - Servicios Café',
            department: 'Servicios Generales',
            percentage: 3,
            active: true,
            description: 'Mantenimiento de espacios comunes y servicios de café',
            created_at: '2024-01-15'
        },
        {
            id: 2,
            name: 'Juana - Contabilidad',
            department: 'Finanzas',
            percentage: 10,
            active: true,
            description: 'Procesamiento contable y gestión financiera',
            created_at: '2024-01-15'
        },
        {
            id: 3,
            name: 'Pedro - Mensajería',
            department: 'Logística',
            percentage: 2,
            active: true,
            description: 'Servicios de mensajería y transporte',
            created_at: '2024-01-15'
        },
        {
            id: 4,
            name: 'Gastos Operativos',
            department: 'Administración',
            percentage: 8,
            active: true,
            description: 'Gastos generales de operación y mantenimiento',
            created_at: '2024-01-15'
        }
    ]);

    const [automaticRules, setAutomaticRules] = useState([
        {
            id: 1,
            name: 'Franquicia Punta Cana',
            type: 'location',
            condition: 'ubicacion_propiedad',
            value: 'Punta Cana',
            specialty_applied: 'Franquicia',
            percentage_share: 7,
            active: true,
            priority: 1
        },
        {
            id: 2,
            name: 'Servicio Filmmaker',
            type: 'service',
            condition: 'servicios_incluye',
            value: 'filmmaker',
            specialty_applied: 'Filmmaker',
            percentage_share: 5,
            active: true,
            priority: 2
        },
        {
            id: 3,
            name: 'Líder de Equipo Activo',
            type: 'relationship',
            condition: 'es_lider_equipo',
            value: true,
            specialty_applied: 'Líder de Equipo',
            percentage_share: 5,
            active: true,
            priority: 3
        }
    ]);

    const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
        const variants = {
            primary: 'bg-orange-600 text-white hover:bg-orange-700',
            secondary: 'bg-gray-600 text-white hover:bg-gray-700',
            outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
            ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            danger: 'bg-red-600 text-white hover:bg-red-700',
            success: 'bg-green-600 text-white hover:bg-green-700'
        };

        const sizes = {
            xs: 'px-2 py-1 text-xs',
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base'
        };

        return (
            <button
                className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={disabled}
                onClick={onClick}
                {...props}
            >
                {icon && <span className="mr-2">{icon}</span>}
                {children}
            </button>
        );
    };

    const Badge = ({ children, variant = 'default', className = '' }) => {
        const variants = {
            default: 'bg-gray-100 text-gray-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            danger: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800',
            primary: 'bg-orange-100 text-orange-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
                {children}
            </span>
        );
    };

    const DistributionBar = ({ distribution, type }) => {
        const data = distribution[type] || {};
        const items = Object.entries(data).map(([key, percentage]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            percentage
        }));

        return (
            <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 flex-1">
                            <span className="font-medium text-gray-700">{item.label}</span>
                            <span className="font-bold text-gray-900">{item.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Configuración de Comisiones</h1>
                    <p className="text-gray-600 mt-1">Gestiona plantillas, especialidades y reglas automáticas</p>
                </div>

                {/* Tabs */}
                <div className="px-6">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'templates'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Plantillas de Asesores
                        </button>
                        <button
                            onClick={() => setActiveTab('division')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'division'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <DollarSign className="w-4 h-4 inline mr-2" />
                            División Interna
                        </button>
                        <button
                            onClick={() => setActiveTab('specialties')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'specialties'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Star className="w-4 h-4 inline mr-2" />
                            Especialidades
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'rules'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Settings className="w-4 h-4 inline mr-2" />
                            Reglas Automáticas
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Plantillas de Asesores */}
                {activeTab === 'templates' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Plantillas de Asesores</h2>
                                <p className="text-gray-600">Distribución base para cada tipo de asesor</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    <strong>Ejemplo:</strong> Comisión total de $10,000 USD distribuida según porcentajes
                                </p>
                            </div>
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Nueva Plantilla
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {templates.map((template) => (
                                <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <Users className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge variant="primary">Plantilla Base</Badge>
                                                    <Badge variant="success">Activo</Badge>
                                                    <span className="text-sm text-gray-500">{template.users_count} usuarios</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Propiedades Listas */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">Propiedades Listas</h4>
                                                <span className="text-lg font-bold text-green-600">
                                                    {template.rules.properties_ready_base}% base
                                                </span>
                                            </div>
                                            <DistributionBar distribution={template.distribution} type="ready_properties" />
                                        </div>

                                        {/* Proyectos */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">Proyectos</h4>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {template.rules.properties_project_base}% base
                                                </span>
                                            </div>
                                            <DistributionBar distribution={template.distribution} type="projects" />
                                        </div>
                                    </div>

                                    {/* Bonos adicionales */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Bono Referido:</span>
                                                <span className="font-medium">${template.rules.referral_bonus}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Bono Captación:</span>
                                                <span className="font-medium">${template.rules.capture_bonus}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* División Interna */}
                {activeTab === 'division' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">División Interna</h2>
                                <p className="text-gray-600">Distribución manual del porcentaje CLIC entre personal interno</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Define qué porcentaje de la parte CLIC va a cada persona o departamento
                                </p>
                            </div>
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Agregar División
                            </Button>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                                    <div className="col-span-3">Persona/Concepto</div>
                                    <div className="col-span-2">Departamento</div>
                                    <div className="col-span-1">% de CLIC</div>
                                    <div className="col-span-4">Descripción</div>
                                    <div className="col-span-1">Estado</div>
                                    <div className="col-span-1">Acciones</div>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {internalDivision.map((division) => (
                                    <div key={division.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <DollarSign className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{division.name}</h3>
                                                        <p className="text-xs text-gray-500">
                                                            Creado: {new Date(division.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <Badge variant="info">{division.department}</Badge>
                                            </div>

                                            <div className="col-span-1">
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-green-600">{division.percentage}%</p>
                                                </div>
                                            </div>

                                            <div className="col-span-4">
                                                <p className="text-sm text-gray-600">{division.description}</p>
                                            </div>

                                            <div className="col-span-1">
                                                <Badge variant={division.active ? 'success' : 'danger'}>
                                                    {division.active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>

                                            <div className="col-span-1">
                                                <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Resumen total */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Total asignado:</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {internalDivision.reduce((sum, div) => sum + div.percentage, 0)}% de CLIC
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ejemplo: En una comisión de $10,000 con 25% CLIC ($2,500), este total representa ${internalDivision.reduce((sum, div) => sum + (2500 * div.percentage / 100), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Especialidades */}
                {activeTab === 'specialties' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Especialidades</h2>
                                <p className="text-gray-600">Porcentajes adicionales para servicios especiales</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Estos porcentajes se aplican automáticamente cuando se cumplen las condiciones
                                </p>
                            </div>
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Nueva Especialidad
                            </Button>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                                    <div className="col-span-4">Especialidad</div>
                                    <div className="col-span-2">% Adicional</div>
                                    <div className="col-span-4">Descripción</div>
                                    <div className="col-span-1">Usuarios</div>
                                    <div className="col-span-1">Acciones</div>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {specialties.map((specialty) => (
                                    <div key={specialty.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-4">
                                                <div className="flex items-center space-x-3">
                                                    <Star className="w-4 h-4 text-purple-500" />
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                                                        <Badge variant={specialty.active ? 'success' : 'danger'}>
                                                            {specialty.active ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-orange-600">{specialty.percentage_bonus}%</p>
                                                </div>
                                            </div>

                                            <div className="col-span-4">
                                                <p className="text-sm text-gray-600">{specialty.description}</p>
                                            </div>

                                            <div className="col-span-1">
                                                <div className="text-center">
                                                    <p className="font-medium text-gray-900">{specialty.users_count}</p>
                                                </div>
                                            </div>

                                            <div className="col-span-1">
                                                <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reglas Automáticas */}
                {activeTab === 'rules' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Reglas Automáticas</h2>
                                <p className="text-gray-600">Aplicación automática de especialidades según condiciones</p>
                            </div>
                            <Button icon={<Plus className="w-4 h-4" />}>
                                Nueva Regla
                            </Button>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                                    <div className="col-span-3">Regla</div>
                                    <div className="col-span-4">Condición</div>
                                    <div className="col-span-3">Especialidad Aplicada</div>
                                    <div className="col-span-1">% Aplicado</div>
                                    <div className="col-span-1">Acciones</div>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {automaticRules.map((rule) => (
                                    <div key={rule.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    {rule.type === 'location' && <MapPin className="w-4 h-4 text-green-500" />}
                                                    {rule.type === 'service' && <Camera className="w-4 h-4 text-blue-500" />}
                                                    {rule.type === 'relationship' && <UserCheck className="w-4 h-4 text-purple-500" />}
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                                                        <Badge variant={rule.active ? 'success' : 'danger'}>
                                                            {rule.active ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-4">
                                                <div className="bg-gray-50 rounded p-2 text-sm">
                                                    <p className="font-medium text-gray-900">
                                                        {rule.condition.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-gray-600">= "{rule.value}"</p>
                                                </div>
                                            </div>

                                            <div className="col-span-3">
                                                <Badge variant="primary">{rule.specialty_applied}</Badge>
                                            </div>

                                            <div className="col-span-1">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-orange-600">{rule.percentage_share}%</p>
                                                </div>
                                            </div>

                                            <div className="col-span-1">
                                                <Button variant="ghost" size="sm" icon={<MoreHorizontal className="w-4 h-4" />} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommissionAdminConfig;