import React from 'react';

// Importar TODOS los componentes que EXISTEN (basado en App--.js)
import Dashboard from './Dashboard';
import ContactsManager from './ContactsManager';
import CRMProperties from './CRMProperties';
import CRMUsers from './CRMUsers';
import Disponibilidad from './Disponibilidad';
import PropertyCreateWizard from './PropertyCreateWizard';
import DealsManager from './DealsManager';
import CommissionAdminConfig from './CommissionAdminConfig';
import ArticleManager from './ArticleManager';
import VideoManager from './VideoManager';
import TestimonialManager from './TestimonialManager';
import SEOContentManager from './SEOContentManager';
import FAQsManager from './FAQsManager';
import TagsManager from './TagsManager';
import LocationInsightsManager from './location/LocationInsightsManager';
import EmailAccountsManager from './EmailAccountsManager';
import EmailInbox from './EmailInbox';
import EmailSignatureEditor from './EmailSignatureEditor';
import ImageOptimizer from './ImageOptimizer';
// Registro COMPLETO de componentes existentes
const COMPONENTS = {
    // Principales
    'Dashboard': Dashboard,

    // CRM
    'ContactsManager': ContactsManager,
    'CRMProperties': CRMProperties,
    'CRMUsers': CRMUsers,

    // Properties  
    'Disponibilidad': Disponibilidad,
    'PropertyCreateWizard': PropertyCreateWizard,

    // Sales
    'DealsManager': DealsManager,
    'CommissionAdminConfig': CommissionAdminConfig,

    // Content
    'ArticleManager': ArticleManager,
    'VideoManager': VideoManager,
    'TestimonialManager': TestimonialManager,
    'SEOContentManager': SEOContentManager,
    'FAQsManager': FAQsManager,
    'TagsManager': TagsManager,

    // Location
    'LocationInsightsManager': LocationInsightsManager,
     // Emails
    'EmailAccountsManager': EmailAccountsManager,
    'EmailInbox': EmailInbox,
    'EmailSignatureEditor': EmailSignatureEditor,
    //optimizador de imagenes
    'ImageOptimizer': ImageOptimizer
};

// Componente placeholder para cuando algo no existe
const PlaceholderComponent = ({ name, activeModule, currentSection }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚧</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">En construcción</h3>
                <p className="mt-2 text-sm text-gray-600">
                    {currentSection ?
                        `La sección "${currentSection.name}" del módulo ${activeModule} está en desarrollo.` :
                        `El módulo "${activeModule}" está en desarrollo.`
                    }
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    Componente: <code>{name}</code>
                </p>
            </div>
        </div>
    </div>
);

const SimpleModuleRenderer = ({
    activeModule,
    currentSection,
    user,
    dashboardData,
    permissions
}) => {
    console.log('🎯 Renderizando:', activeModule, currentSection?.id);

    // Dashboard siempre usa Dashboard component
    if (activeModule === 'dashboard') {
        return (
            <div className="max-w-7xl mx-auto">
                <Dashboard dashboardData={dashboardData} user={user} />
            </div>
        );
    }

    // Si hay sección activa, renderizar la sección
    if (currentSection && currentSection.component) {
        const ComponentToRender = COMPONENTS[currentSection.component];

        if (ComponentToRender) {
            console.log(`✅ Renderizando sección: ${currentSection.component}`);
            return (
                <div className="max-w-7xl mx-auto">
                    <ComponentToRender
                        user={user}
                        permissions={permissions}
                        activeModule={activeModule}
                        currentSection={currentSection}
                    />
                </div>
            );
        } else {
            console.warn(`⚠️ Componente no encontrado: ${currentSection.component}`);
            return (
                <div className="max-w-7xl mx-auto">
                    <PlaceholderComponent
                        name={currentSection.component}
                        activeModule={activeModule}
                        currentSection={currentSection}
                    />
                </div>
            );
        }
    }

    // Sin sección activa, mostrar vista general del módulo
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header del módulo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
                    </h1>
                    <p className="text-gray-600">
                        Selecciona una sección del menú lateral para comenzar.
                    </p>
                </div>

                {/* Debug info - SIMPLE */}
                {user && (
                    <div className="p-3 bg-blue-50 rounded-lg text-xs border border-blue-200">
                        <strong>🎯 Sistema SIMPLE:</strong> {permissions.modules?.length || 0} módulos •
                        <strong> País:</strong> {user.country_code} •
                        <strong> Rol:</strong> {user.roles?.[0]?.name || user.role} •
                        <strong> ✅ Sin complejidades</strong>
                    </div>
                )}
            </div>

            {/* Mostrar secciones disponibles */}
            {permissions.modules && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Secciones Disponibles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {permissions.modules
                            .find(m => m.id === activeModule)
                            ?.sections?.map((section) => (
                                <div key={section.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                                    <div className="flex items-center mb-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                                            <span className="text-orange-600 text-xl">📋</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {section.component ?
                                                    `Componente: ${section.component}` :
                                                    'Componente en desarrollo'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${section.component && COMPONENTS[section.component]
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {section.component && COMPONENTS[section.component] ? 'Disponible' : 'En desarrollo'}
                                        </span>
                                        <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                                            Abrir →
                                        </button>
                                    </div>
                                </div>
                            )) || (
                                <div className="col-span-full text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">📂</span>
                                    </div>
                                    <p className="text-gray-500">No hay secciones disponibles para este módulo</p>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleModuleRenderer;