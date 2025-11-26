import React, { useState, useEffect, Suspense } from 'react';
import { loadComponent } from '../configs/components/ComponentRegistry';

// Loading component
const LoadingComponent = ({ componentName }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Cargando {componentName}...</p>
    </div>
  </div>
);

// Error component
const ErrorComponent = ({ componentName, error }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-red-500 text-xl">⚠️</span>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">Componente no disponible</h3>
      <p className="mt-2 text-sm text-gray-600">
        El componente <code className="bg-gray-100 px-2 py-1 rounded">{componentName}</code> no se pudo cargar.
      </p>
      {error && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-red-600">Ver detalles del error</summary>
          <pre className="mt-2 text-xs bg-red-50 p-2 rounded border overflow-auto">
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  </div>
);

// Component wrapper that handles dynamic loading
const DynamicComponent = ({ componentName, ...props }) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!componentName) {
      setError(new Error('No component name provided'));
      setLoading(false);
      return;
    }

    console.log(`🔄 Cargando componente dinámico: ${componentName}`);
    
    loadComponent(componentName)
      .then((LoadedComponent) => {
        if (LoadedComponent) {
          console.log(`✅ Componente cargado: ${componentName}`);
          setComponent(() => LoadedComponent);
          setError(null);
        } else {
          console.warn(`⚠️ Componente no encontrado: ${componentName}`);
          setError(new Error(`Component ${componentName} not found in registry`));
        }
      })
      .catch((err) => {
        console.error(`❌ Error cargando ${componentName}:`, err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [componentName]);

  if (loading) {
    return <LoadingComponent componentName={componentName} />;
  }

  if (error || !Component) {
    return <ErrorComponent componentName={componentName} error={error} />;
  }

  return (
    <Suspense fallback={<LoadingComponent componentName={componentName} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Main DynamicModuleRenderer
const DynamicModuleRenderer = ({ 
  activeModule, 
  currentSection, 
  user, 
  dashboardData, 
  permissions 
}) => {
  console.log('🎯 Renderizando módulo:', activeModule, 'sección:', currentSection?.id);

  // Encontrar el módulo actual en la configuración del usuario
  const currentModuleConfig = permissions.modules?.find(m => m.id === activeModule);
  
  if (!currentModuleConfig) {
    console.warn(`⚠️ Módulo ${activeModule} no encontrado en configuración del usuario`);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Módulo no disponible</h3>
          <p className="mt-2 text-sm text-gray-600">
            El módulo <strong>{activeModule}</strong> no está configurado para tu rol.
          </p>
        </div>
      </div>
    );
  }

  // Determinar qué componente renderizar
  let componentName;
  let componentProps = {
    user,
    permissions,
    activeModule,
    currentSection
  };

  if (activeModule === 'dashboard') {
    // Dashboard siempre usa el componente Dashboard
    componentName = 'Dashboard';
    componentProps.dashboardData = dashboardData;
  } else if (currentSection) {
    // Si hay sección activa, usar el componente de la sección
    const sectionConfig = currentModuleConfig.sections?.find(s => s.id === currentSection.id);
    if (sectionConfig) {
      componentName = sectionConfig.component;
      console.log(`🎯 Renderizando sección: ${currentSection.id} con componente: ${componentName}`);
    } else {
      console.warn(`⚠️ Sección ${currentSection.id} no encontrada en módulo ${activeModule}`);
      componentName = currentModuleConfig.component; // Fallback al componente del módulo
    }
  } else {
    // Sin sección activa, usar el componente principal del módulo
    componentName = currentModuleConfig.component;
    console.log(`🎯 Renderizando módulo principal: ${activeModule} con componente: ${componentName}`);
  }

  if (!componentName) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Componente no configurado</h3>
          <p className="mt-2 text-sm text-gray-600">
            No se ha configurado un componente para {currentSection ? `la sección ${currentSection.id}` : `el módulo ${activeModule}`}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <DynamicComponent 
        componentName={componentName}
        {...componentProps}
      />
    </div>
  );
};

export default DynamicModuleRenderer;