// ModuleRenderer.js - ARCHIVO COMPLETO
import React from 'react';
import {
    Calendar,
    BarChart3,
    Settings,
    Home,
    TrendingUp,
    DollarSign,
    Users
} from 'lucide-react';

// Importar todos los componentes
import Dashboard from './Dashboard';
import CRMContacts from './CRMContacts';
import CRMRequests from './CRMRequests';
import CRMProperties from './CRMProperties';
import ContentArticles, { ContentMedia, ContentSEO } from './ContentArticles';

const ModuleRenderer = ({ activeModule, currentSection, user, dashboardData, permissions }) => {
    // Dashboard
    if (activeModule === 'dashboard') {
        return <Dashboard user={user} {...dashboardData} />;
    }

    // CRM Module
    if (activeModule === 'crm') {
        if (currentSection?.id === 'contacts') {
            return <CRMContacts user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'requests') {
            return <CRMRequests user={user} permissions={permissions} />;
        }
    }

    // Properties Module
    if (activeModule === 'properties') {
        if (currentSection?.id === 'listings') {
            return <CRMProperties user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'evaluations') {
            return <PropertiesEvaluations user={user} permissions={permissions} />;
        }
    }

    // Sales Module
    if (activeModule === 'sales') {
        if (currentSection?.id === 'pipeline') {
            return <SalesPipeline user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'commissions') {
            return <SalesCommissions user={user} permissions={permissions} />;
        }
    }

    // Content Module - AGREGADO
    if (activeModule === 'content') {
        if (currentSection?.id === 'articles') {
            return <ContentArticles user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'media') {
            return <ContentMedia user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'seo') {
            return <ContentSEO user={user} permissions={permissions} />;
        }
    }

    // Accounting Module
    if (activeModule === 'accounting') {
        if (currentSection?.id === 'transactions') {
            return <AccountingTransactions user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'invoices') {
            return <AccountingInvoices user={user} permissions={permissions} />;
        }
    }

    // Users Module
    if (activeModule === 'users') {
        if (currentSection?.id === 'management') {
            return <UsersManagement user={user} permissions={permissions} />;
        }
        if (currentSection?.id === 'roles') {
            return <UsersRoles user={user} permissions={permissions} />;
        }
    }

    // Módulos en desarrollo (placeholder)
    const moduleConfig = {
        calendar: { name: 'Calendario', icon: Calendar, description: 'Gestión de citas y eventos' },
        reports: { name: 'Reportes', icon: BarChart3, description: 'Análisis y estadísticas detalladas' },
        settings: { name: 'Configuración', icon: Settings, description: 'Configuración del sistema' }
    };

    const config = moduleConfig[activeModule];
    if (!config) {
        return <ModulePlaceholder
            name="Módulo Desconocido"
            description="Este módulo no está disponible"
            user={user}
            permissions={permissions}
        />;
    }

    return <ModulePlaceholder {...config} user={user} permissions={permissions} />;
};

// Componentes placeholder para futuros módulos
const PropertiesEvaluations = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Evaluaciones de Propiedades"
        icon={Home}
        description="Tasaciones y análisis de mercado inmobiliario"
        user={user}
        permissions={permissions}
    />
);

const SalesPipeline = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Pipeline de Ventas"
        icon={TrendingUp}
        description="Seguimiento de oportunidades y negociaciones"
        user={user}
        permissions={permissions}
    />
);

const SalesCommissions = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Comisiones"
        icon={DollarSign}
        description="Gestión de comisiones y pagos a agentes"
        user={user}
        permissions={permissions}
    />
);

const AccountingTransactions = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Transacciones"
        icon={DollarSign}
        description="Registro y seguimiento de transacciones financieras"
        user={user}
        permissions={permissions}
    />
);

const AccountingInvoices = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Facturas"
        icon={BarChart3}
        description="Gestión de facturación y cobros"
        user={user}
        permissions={permissions}
    />
);

const UsersManagement = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Gestión de Usuarios"
        icon={Users}
        description="Administración de usuarios del sistema"
        user={user}
        permissions={permissions}
    />
);

const UsersRoles = ({ user, permissions }) => (
    <ModulePlaceholder
        name="Gestión de Roles"
        icon={Settings}
        description="Configuración de roles y permisos"
        user={user}
        permissions={permissions}
    />
);

// Componente placeholder para módulos en desarrollo
const ModulePlaceholder = ({ name, icon: IconComponent, description, user, permissions }) => {
    const hasCreateAccess = permissions?.hasAction('create') || false;
    const hasUpdateAccess = permissions?.hasAction('update') || false;
    const hasDeleteAccess = permissions?.hasAction('delete') || false;

    return (
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 min-h-[500px]">
            <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                        background: `linear-gradient(135deg, #e03f07 0%, #c73307 100%)`
                    }}>
                    {IconComponent ? (
                        <IconComponent className="w-8 h-8 text-white" />
                    ) : (
                        <span className="text-2xl">🚧</span>
                    )}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {name}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {description || 'Módulo en desarrollo. Próximamente tendrás acceso completo a todas las funcionalidades.'}
                </p>

                {/* Indicador de usuario y permisos */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Usuario: <span className="text-orange-600">{user?.name || 'N/A'}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Rol: <span className="capitalize text-orange-600">{user?.role?.replace('_', ' ') || 'N/A'}</span>
                    </p>

                    {permissions && (
                        <>
                            <p className="text-sm font-medium text-gray-700 mb-2">Tus permisos en este módulo:</p>
                            <div className="flex justify-center space-x-4 text-xs">
                                <span className={`px-2 py-1 rounded ${hasCreateAccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {hasCreateAccess ? '✓' : '✗'} Crear
                                </span>
                                <span className={`px-2 py-1 rounded ${hasUpdateAccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {hasUpdateAccess ? '✓' : '✗'} Editar
                                </span>
                                <span className={`px-2 py-1 rounded ${hasDeleteAccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {hasDeleteAccess ? '✓' : '✗'} Eliminar
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Alcance de datos: <span className="font-medium">{permissions.getDataScope()}</span>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModuleRenderer;