// ComponentPlayground.js - Entorno de desarrollo aislado
import React, { useState } from 'react';
import { Button, Card } from './components/ui';
import { 
    Play, 
    Search, 
    HelpCircle, 
    Tag, 
    Image, 
    BarChart3,
    ArrowLeft,
    Code,
    TestTube
} from 'lucide-react';

// Aquí importaremos los componentes cuando los creemos
// import VideoManager from './components/VideoManager';
// import SEOContent from './components/SEOContent';
// import FAQsManager from './components/FAQsManager';

const ComponentPlayground = ({ onExit }) => {
    const [activeComponent, setActiveComponent] = useState('video');
    
    // Mock data para testing
    const mockUser = {
        id: 1,
        name: 'Admin Test',
        email: 'admin@test.com',
        role: 'admin'
    };
    
    const mockPermissions = {
        hasAction: (action) => {
            console.log(`🔍 Checking permission: ${action}`);
            return true;  // Siempre true para testing
        },
        getDataScope: () => 'all',
        hasModuleAccess: (module) => true,
        canAccessSection: (module, section) => true,
        userRole: 'admin',
        permissions: {
            modules: ['content', 'crm', 'properties'],
            dataScope: 'all',
            actions: ['create', 'read', 'update', 'delete', 'export']
        }
    };

    // Lista de componentes en desarrollo
    const components = [
        {
            id: 'video',
            name: 'Video Manager',
            icon: Play,
            description: 'Gestión de videos y contenido multimedia',
            status: 'planning' // planning, development, testing, ready
        },
        {
            id: 'seo',
            name: 'SEO Content',
            icon: Search,
            description: 'Optimización SEO y meta contenido',
            status: 'planning'
        },
        {
            id: 'faqs',
            name: 'FAQs Manager',
            icon: HelpCircle,
            description: 'Sistema de preguntas frecuentes',
            status: 'planning'
        },
        {
            id: 'tags',
            name: 'Tags System',
            icon: Tag,
            description: 'Sistema de etiquetas y categorización',
            status: 'planning'
        },
        {
            id: 'media',
            name: 'Media Library Advanced',
            icon: Image,
            description: 'Biblioteca de medios avanzada',
            status: 'planning'
        },
        {
            id: 'analytics',
            name: 'Content Analytics',
            icon: BarChart3,
            description: 'Análisis y métricas de contenido',
            status: 'planning'
        }
    ];

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

    const activeComponentData = components.find(c => c.id === activeComponent);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header del Playground */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <TestTube className="w-8 h-8 text-purple-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Component Playground</h1>
                                    <p className="text-sm text-gray-600">Entorno de desarrollo aislado</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                                <p className="font-medium text-gray-700">Modo: Desarrollo</p>
                                <p className="text-gray-500">Usuario: {mockUser.name}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={onExit}
                                icon={<ArrowLeft className="w-4 h-4" />}
                            >
                                Volver al Sistema
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex h-screen">
                {/* Sidebar con lista de componentes */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Componentes en Desarrollo</h2>
                        
                        <div className="space-y-2">
                            {components.map((component) => {
                                const IconComponent = component.icon;
                                return (
                                    <button
                                        key={component.id}
                                        onClick={() => setActiveComponent(component.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                                            activeComponent === component.id
                                                ? 'border-purple-200 bg-purple-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg ${
                                                activeComponent === component.id
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">
                                                    {component.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {component.description}
                                                </p>
                                                <div className="mt-2">
                                                    {getStatusBadge(component.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Info del entorno */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">🔧 Entorno de Testing</h3>
                            <div className="text-xs text-blue-700 space-y-1">
                                <p>• Usuario: <strong>{mockUser.role}</strong> (todos los permisos)</p>
                                <p>• Scope: <strong>{mockPermissions.getDataScope()}</strong></p>
                                <p>• Mock Data: <strong>Activo</strong></p>
                                <p>• Base de Datos: <strong>Desconectado</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área principal del componente */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                        {/* Header del componente activo */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <activeComponentData.icon className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {activeComponentData.name}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {activeComponentData.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusBadge(activeComponentData.status)}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Code className="w-4 h-4" />}
                                        title="Ver código fuente"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contenido del componente */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                            <div className="max-w-full">
                                {/* Aquí renderizamos el componente activo */}
                                {activeComponent === 'video' && (
                                    <ComponentPlaceholder
                                        name="Video Manager"
                                        description="Aquí irá el componente VideoManager una vez creado"
                                        nextSteps={[
                                            "Crear archivo components/VideoManager.js",
                                            "Importarlo en este playground",
                                            "Desarrollar funcionalidades paso a paso",
                                            "Integrar con Supabase cuando esté listo"
                                        ]}
                                    />
                                )}
                                
                                {activeComponent === 'seo' && (
                                    <ComponentPlaceholder
                                        name="SEO Content Manager"
                                        description="Aquí irá el componente SEOContent una vez creado"
                                        nextSteps={[
                                            "Crear archivo components/SEOContent.js",
                                            "Diseñar formularios de meta tags",
                                            "Implementar preview de SEO",
                                            "Integrar con análisis de palabras clave"
                                        ]}
                                    />
                                )}
                                
                                {activeComponent === 'faqs' && (
                                    <ComponentPlaceholder
                                        name="FAQs Manager"
                                        description="Aquí irá el componente FAQsManager una vez creado"
                                        nextSteps={[
                                            "Crear archivo components/FAQsManager.js",
                                            "Diseñar CRUD de preguntas frecuentes",
                                            "Implementar categorización",
                                            "Agregar búsqueda y filtros"
                                        ]}
                                    />
                                )}
                                
                                {(activeComponent === 'tags' || activeComponent === 'media' || activeComponent === 'analytics') && (
                                    <ComponentPlaceholder
                                        name={activeComponentData.name}
                                        description={`Aquí irá el componente ${activeComponentData.name} una vez creado`}
                                        nextSteps={[
                                            `Crear archivo components/${activeComponentData.name.replace(/\s+/g, '')}.js`,
                                            "Diseñar la interfaz básica",
                                            "Implementar funcionalidades core",
                                            "Integrar con el sistema principal"
                                        ]}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente placeholder temporal para mostrar el plan de cada componente
const ComponentPlaceholder = ({ name, description, nextSteps = [] }) => {
    return (
        <Card>
            <Card.Header>
                <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Code className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
                    <p className="text-gray-600 max-w-md mx-auto">{description}</p>
                </div>
            </Card.Header>
            <Card.Body>
                <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">🚧 En Construcción</h4>
                        <p className="text-sm text-yellow-700">
                            Este componente está listo para ser desarrollado. Puedes empezar creando el archivo y probándolo aquí.
                        </p>
                    </div>

                    {nextSteps.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">📋 Próximos Pasos:</h4>
                            <div className="space-y-2">
                                {nextSteps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-2">
                                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-gray-700 flex-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">✅ Cuando esté listo</h4>
                        <p className="text-sm text-green-700">
                            Una vez que el componente funcione perfectamente aquí, lo integraremos al ModuleRenderer.js y añadiremos los permisos correspondientes.
                        </p>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ComponentPlayground;