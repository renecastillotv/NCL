import React, { useState } from 'react';
import {
    LayoutDashboard,
    FileText,
    Play,
    Search,
    HelpCircle,
    Tag,
    Image,
    BarChart3,
    LogOut,
    User,
    TestTube,
    ArrowLeft,
    Settings,
    Mail,
    Calendar,
    Phone,
    Building,
    DollarSign,
    TrendingUp,
    Users,
    Globe,
    Shield,
    Database,
    Zap,
    Target,
    Briefcase,
    MessageSquare,
    Bell,
    Archive,
    Gift
} from 'lucide-react';

// Importar UI components
import { Button } from './components/ui';

// Importar componentes en desarrollo
import VideoManager from './components/VideoManager';
import TestimonialManager from './components/TestimonialManager';
import SEOContent from './components/SEOContentManager';
import SEOContentManager from './components/SEOContentManager';
import FAQsManager from './components/FAQsManager';
import TagsManager from './components/TagsManager';
import ArticleManager from './components/ArticleManager';
import CRMUsers from './components/CRMUsers';
import Propiedades from './components/CRMProperties';
import Disponibilidad from './components/Disponibilidad';
import PropertyCreateModal from './components/PropertyCreateWizard';
import LocationInsightsManager from './components/location/LocationInsightsManager';
import DealsManager from './components/DealsManager';
import CommissionAdminConfig from './components/CommissionAdminConfig';
import ContactsManager from './components/ContactsManager';
const App = () => {
    const [isDevelopment, setIsDevelopment] = useState(true);
    const [activeModule, setActiveModule] = useState('video');
    const [showProductionApp, setShowProductionApp] = useState(false);

    // Mock user y permissions para desarrollo
    const mockUser = {
        id: 1,
        name: 'Admin Dev',
        email: 'admin@test.com',
        role: 'admin'
    };

    const mockPermissions = {
        hasAction: (action) => true,
        getDataScope: () => 'all',
        hasModuleAccess: (module) => true,
        canAccessSection: (module, section) => true,
        userRole: 'admin',
        permissions: {
            modules: ['content', 'crm', 'properties', 'sales'],
            dataScope: 'all',
            actions: ['create', 'read', 'update', 'delete', 'export']
        }
    };

    // Módulos principales del sidebar (los originales)
    const sidebarModules = [
        {
            id: 'video',
            name: 'Video Manager',
            icon: Play,
            description: 'Gestión de videos y contenido multimedia',
            status: 'development',
            component: VideoManager
        },
        {
            id: 'seo',
            name: 'SEO Content',
            icon: Search,
            description: 'Optimización SEO y meta contenido',
            status: 'development',
            component: SEOContentManager
        },
        {
            id: 'articles',
            name: 'Manejador de Articulos',
            icon: FileText,
            description: 'Manejador de Articulos como tipo de contenido',
            status: 'development',
            component: ArticleManager
        },
        {
            id: 'faqs',
            name: 'FAQs Manager',
            icon: HelpCircle,
            description: 'Sistema de preguntas frecuentes',
            status: 'development',
            component: FAQsManager
        },
        {
            id: 'tags',
            name: 'Tags Manager',
            icon: Tag,
            description: 'Sistema de etiquetas y categorización',
            status: 'development',
            component: TagsManager
        },
        {
            id: 'testimonials',
            name: 'Testimonios Clientes',
            icon: MessageSquare,
            description: 'La prueba de lo que hacemos',
            status: 'development',
            component: TestimonialManager
        },
        {
            id: 'users',
            name: 'Usuarios del Sistema',
            icon: Users,
            description: 'Administra los usuarios del sistema CLIC',
            status: 'development',
            component: CRMUsers
        },
        {
            id: 'propiedades',
            name: 'manejador de Propiedades',
            icon: LayoutDashboard,
            description: 'Crea, visualiza y edita propiedades',
            status: 'development',
            component: Propiedades
        }
    ];

    // Módulos adicionales para el header (nuevos para probar)
    const headerModules = [
        // Más módulos de contenido
        {
            id: 'disponibilidad',
            name: 'Dispo',
            icon: Image,
            description: 'Disponibilidad',
            status: 'development',
            component: Disponibilidad
        },
        {
            id: 'CrearProp',
            name: 'Crear una propiedad',
            icon: FileText,
            description: 'creacion de propiedades y proyectos',
            status: 'development',
            component: PropertyCreateModal
        },

        // CRM adicionales
        {
            id: 'locations',
            name: 'Locations',
            icon: User,
            description: 'Gestión de contactos y clientes',
            status: 'development',
            component: LocationInsightsManager
        },
        {
            id: 'companies',
            name: 'Ventas',
            icon: Building,
            description: 'Gestión de empresas y organizaciones',
            status: 'development',
            component: DealsManager
        },
        {
            id: 'contactos',
            name: 'Contactos',
            icon: Target,
            description: 'Gestión de Contactos',
            status: 'devolpment',
            component: ContactsManager
        },

        // Ventas
        {
            id: 'comisiones',
            name: 'Comisiones',
            icon: DollarSign,
            description: 'Pipeline de ventas y transacciones',
            status: 'development',
            component: CommissionAdminConfig
        },
        {
            id: 'contracts',
            name: 'Contratos',
            icon: Briefcase,
            description: 'Gestión de contratos y documentos',
            status: 'planning',
            component: null
        },

        // Comunicación
        {
            id: 'email',
            name: 'Email Marketing',
            icon: Mail,
            description: 'Sistema de email marketing',
            status: 'planning',
            component: null
        },
        {
            id: 'calendar',
            name: 'Calendar',
            icon: Calendar,
            description: 'Gestión de calendario y citas',
            status: 'planning',
            component: null
        },
        {
            id: 'calls',
            name: 'Llamadas',
            icon: Phone,
            description: 'Registro de llamadas y comunicación',
            status: 'planning',
            component: null
        },

        // Analytics
        {
            id: 'analytics',
            name: 'Analytics',
            icon: BarChart3,
            description: 'Análisis y métricas del sistema',
            status: 'planning',
            component: null
        },
        {
            id: 'reports',
            name: 'Reportes',
            icon: TrendingUp,
            description: 'Generación de reportes personalizados',
            status: 'planning',
            component: null
        },

        // Sistema
        {
            id: 'permissions',
            name: 'Permisos',
            icon: Shield,
            description: 'Gestión de roles y permisos',
            status: 'planning',
            component: null
        },
        {
            id: 'integrations',
            name: 'Integraciones',
            icon: Zap,
            description: 'APIs y integraciones externas',
            status: 'planning',
            component: null
        },
        {
            id: 'notifications',
            name: 'Notificaciones',
            icon: Bell,
            description: 'Sistema de notificaciones',
            status: 'planning',
            component: null
        }
    ];

    // Combinar todos los módulos
    const allModules = [...sidebarModules, ...headerModules];

    // Si queremos ver la app de producción
    if (showProductionApp) {
        return <div className="p-8 text-center">
            <h2>App de Producción no disponible</h2>
            <p>Renombra tu App.js original a AppProduction.js</p>
            <button onClick={() => setShowProductionApp(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Volver al Desarrollo
            </button>
        </div>;
    }

    const currentModule = allModules.find(m => m.id === activeModule);

    const getStatusBadge = (status) => {
        const statusConfig = {
            planning: { bg: 'bg-gray-100', text: 'text-gray-600', label: '📋 Planificando' },
            development: { bg: 'bg-blue-100', text: 'text-blue-600', label: '⚡ Desarrollando' },
            testing: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '🧪 Probando' },
            ready: { bg: 'bg-green-100', text: 'text-green-600', label: '✅ Listo' }
        };

        const config = statusConfig[status] || statusConfig.planning;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const renderIcon = (IconComponent, className = "w-5 h-5") => {
        return IconComponent ? <IconComponent className={className} /> : null;
    };

    const renderModuleContent = () => {
        if (currentModule?.component) {
            const Component = currentModule.component;
            return <Component user={mockUser} permissions={mockPermissions} />;
        }

        return (
            <div className="bg-white shadow-lg rounded-xl border border-gray-100 min-h-[600px]">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{
                            background: `linear-gradient(135deg, #e03f07 0%, #c73307 100%)`
                        }}>
                        {renderIcon(currentModule?.icon, "w-8 h-8 text-white")}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        {currentModule?.name}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {currentModule?.description}
                    </p>

                    <div className="mb-6">
                        {getStatusBadge(currentModule?.status)}
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 mb-2">🚧 Componente en Desarrollo</h4>
                            <p className="text-sm text-yellow-700">
                                Para desarrollar este módulo:
                            </p>
                            <ol className="text-sm text-yellow-700 mt-2 text-left space-y-1">
                                <li>1. Crear <code>components/{currentModule?.name.replace(/\s+/g, '')}.js</code></li>
                                <li>2. Importarlo en este App.js</li>
                                <li>3. Agregarlo al array de módulos correspondiente</li>
                                <li>4. ¡Probarlo aquí!</li>
                            </ol>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">💡 Entorno de Desarrollo</h4>
                            <div className="text-sm text-blue-700 text-left space-y-1">
                                <p>• <strong>Usuario:</strong> {mockUser.name} ({mockUser.role})</p>
                                <p>• <strong>Permisos:</strong> Todos activados</p>
                                <p>• <strong>Data:</strong> Mock/Test data</p>
                                <p>• <strong>Ubicación:</strong> {sidebarModules.find(m => m.id === activeModule) ? 'Sidebar' : 'Header'}</p>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => window.open('https://react.dev/learn', '_blank')}
                        >
                            📚 Documentación React
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden">
            {/* Sidebar Original */}
            <div className="w-20 bg-gray-900 flex flex-col items-center py-6 relative z-50 flex-shrink-0">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-8"
                    style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}>
                    <span className="text-white font-bold text-lg">DEV</span>
                </div>

                {/* Navigation modules del sidebar */}
                <nav className="flex-1 flex flex-col space-y-2">
                    {sidebarModules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => setActiveModule(module.id)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${activeModule === module.id
                                    ? 'shadow-lg'
                                    : 'hover:bg-gray-700'
                                }`}
                            style={{
                                background: activeModule === module.id
                                    ? 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)'
                                    : undefined
                            }}
                            title={module.name}
                        >
                            <span className="text-white">
                                {renderIcon(module.icon)}
                            </span>
                        </button>
                    ))}

                    {/* Separador */}
                    <div className="border-t border-gray-700 my-4 w-8 mx-auto"></div>

                    {/* Botón para ir a producción */}
                    <button
                        onClick={() => setShowProductionApp(true)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-700 border border-gray-700"
                        title="Ver App de Producción"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Compacto con Módulos Adicionales */}
                <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                    <div className="px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    🧪 {currentModule?.name || 'Desarrollo de Módulos'}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {currentModule?.description || 'Entorno de desarrollo CLIC CRM'}
                                </p>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{mockUser.name}</p>
                                    <p className="text-xs text-orange-600 font-medium">Modo Desarrollo</p>
                                </div>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, #e03f07 0%, #c73307 100%)`
                                    }}>
                                    <span className="text-white font-medium text-sm">D</span>
                                </div>
                            </div>
                        </div>

                        {/* Botones de módulos adicionales */}
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">Módulos Adicionales en Desarrollo:</p>
                            <div className="flex flex-wrap gap-2">
                                {headerModules.map((module) => (
                                    <button
                                        key={module.id}
                                        onClick={() => setActiveModule(module.id)}
                                        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeModule === module.id
                                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                            }`}
                                        title={module.description}
                                    >
                                        {renderIcon(module.icon, "w-4 h-4")}
                                        <span>{module.name}</span>
                                        {module.status === 'planning' && (
                                            <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">
                                                📋
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main content area */}
                <main className="flex-1 p-6 bg-gray-50 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-full">
                        {renderModuleContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;