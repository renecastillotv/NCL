import React from 'react';

// Importar SOLO los componentes que YA EXISTEN
import Dashboard from './Dashboard';
import ContactsManager from './ContactsManager';
import CRMProperties from './CRMProperties';
import Disponibilidad from './Disponibilidad';
import DealsManager from './DealsManager';
import CommissionAdminConfig from './CommissionAdminConfig';
import ArticleManager from './ArticleManager';
import VideoManager from './VideoManager';
import TestimonialManager from './TestimonialManager';
import SEOContentManager from './SEOContentManager';
import FAQsManager from './FAQsManager';
import TagsManager from './TagsManager';
import LocationInsightsManager from './location/LocationInsightsManager';

// Registro SIMPLE de componentes existentes
const COMPONENTS = {
  // Principales
  'Dashboard': Dashboard,
  
  // CRM
  'ContactsManager': ContactsManager,
  'CRMProperties': CRMProperties,
  
  // Properties  
  'Disponibilidad': Disponibilidad,
  
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
  'LocationInsightsManager': LocationInsightsManager
};

// Componente placeholder para cuando algo no existe
const PlaceholderComponent = ({ name, activeModule, currentSection }) => (
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
    return <Dashboard dashboardData={dashboardData} user={user} />;
  }

  // Si hay sección activa, renderizar la sección
  if (currentSection && currentSection.component) {
    const ComponentToRender = COMPONENTS[currentSection.component];
    
    if (ComponentToRender) {
      console.log(`✅ Renderizando sección: ${currentSection.component}`);
      return (
        <ComponentToRender 
          user={user} 
          permissions={permissions}
          activeModule={activeModule}
          currentSection={currentSection}
        />
      );
    } else {
      console.warn(`⚠️ Componente no encontrado: ${currentSection.component}`);
      return (
        <PlaceholderComponent 
          name={currentSection.component}
          activeModule={activeModule}
          currentSection={currentSection}
        />
      );
    }
  }

  // Sin sección activa, mostrar vista general del módulo
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
        </h2>
        <p className="text-gray-600">
          Selecciona una sección del menú lateral para comenzar.
        </p>
      </div>

      {/* Mostrar secciones disponibles */}
      {permissions.modules && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {permissions.modules
            .find(m => m.id === activeModule)
            ?.sections?.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {section.component ? 
                    `Componente: ${section.component}` : 
                    'Componente en desarrollo'
                  }
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SimpleModuleRenderer;