// Registry de componentes dinámicos
// Mapea component_name (string) -> Componente React real

// Componentes base existentes
const baseComponents = {
  // Dashboard
  'Dashboard': () => import('../components/Dashboard'),
  
  // CRM
  'CRMModule': () => import('../components/CRMModule'),
  'ContactsManager': () => import('../components/ContactsManager'),
  'CRMUsers': () => import('../components/CRMUsers'),
  'CRMRequests': () => import('../components/CRMRequests'),
  
  // Properties
  'PropertiesModule': () => import('../components/PropertiesModule'),
  'Propiedades': () => import('../components/CRMProperties'),
  'Disponibilidad': () => import('../components/Disponibilidad'),
  'PropertyCreateModal': () => import('../components/PropertyCreateWizard'),
  'PropertyEvaluations': () => import('../components/PropertyEvaluations'),
  
  // Sales
  'SalesModule': () => import('../components/SalesModule'),
  'DealsManager': () => import('../components/DealsManager'),
  'SalesPipeline': () => import('../components/SalesPipeline'),
  'CommissionAdminConfig': () => import('../components/CommissionAdminConfig'),
  
  // Content
  'ContentModule': () => import('../components/ContentModule'),
  'ArticleManager': () => import('../components/ArticleManager'),
  'VideoManager': () => import('../components/VideoManager'),
  'TestimonialManager': () => import('../components/TestimonialManager'),
  'SEOContentManager': () => import('../components/SEOContentManager'),
  'FAQsManager': () => import('../components/FAQsManager'),
  'TagsManager': () => import('../components/TagsManager'),
  
  // Location
  'LocationModule': () => import('../components/LocationModule'),
  'LocationInsightsManager': () => import('../components/location/LocationInsightsManager'),
  
  // Calendar
  'CalendarModule': () => import('../components/CalendarModule'),
  
  // Reports
  'ReportsModule': () => import('../components/ReportsModule'),
  
  // Accounting
  'AccountingModule': () => import('../components/AccountingModule'),
  'AccountingTransactions': () => import('../components/AccountingTransactions'),
  'AccountingInvoices': () => import('../components/AccountingInvoices'),
  
  // Users
  'UsersModule': () => import('../components/UsersModule'),
  'UsersManagement': () => import('../components/UsersManagement'),
  'UsersRoles': () => import('../components/UsersRoles'),
  
  // Settings
  'SettingsModule': () => import('../components/SettingsModule')
};

// Componentes específicos por país
const countryComponents = {
  // República Dominicana (DOM)
  'DGIIModule': () => import('../components/dominicana/DGIIModule'),
  'DGIIIntegration': () => import('../components/dominicana/DGIIIntegration'),
  'DGIIReports': () => import('../components/dominicana/DGIIReports'),
  'CedulaModule': () => import('../components/dominicana/CedulaModule'),
  'CedulaValidator': () => import('../components/dominicana/CedulaValidator'),
  'CedulaBatch': () => import('../components/dominicana/CedulaBatch'),
  
  // Colombia (CO)
  'DIANModule': () => import('../components/colombia/DIANModule'),
  'DIANIntegration': () => import('../components/colombia/DIANIntegration'),
  'DIANInvoicing': () => import('../components/colombia/DIANInvoicing'),
  'InactiveAgentsModule': () => import('../components/colombia/InactiveAgentsModule'),
  'InactiveAgentsReport': () => import('../components/colombia/InactiveAgentsReport'),
  'InactiveAgentsAlerts': () => import('../components/colombia/InactiveAgentsAlerts'),
  'FedelonjasModule': () => import('../components/colombia/FedelonjasModule'),
  'FedelonjasValuations': () => import('../components/colombia/FedelonjasValuations'),
  
  // Panamá (PA) - Placeholder para futuros componentes
  'AIGModule': () => import('../components/panama/AIGModule'),
  'PanamaRegistryModule': () => import('../components/panama/PanamaRegistryModule')
};

// Registry completo
export const componentRegistry = {
  ...baseComponents,
  ...countryComponents
};

// Cache de componentes cargados
const componentCache = new Map();

// Función para cargar componente dinámicamente
export const loadComponent = async (componentName) => {
  if (!componentName) {
    console.warn('⚠️ Component name is empty');
    return null;
  }

  // Verificar cache primero
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName);
  }

  // Buscar en registry
  const componentLoader = componentRegistry[componentName];
  
  if (!componentLoader) {
    console.warn(`⚠️ Component '${componentName}' not found in registry`);
    return null;
  }

  try {
    console.log(`📦 Loading component: ${componentName}`);
    const module = await componentLoader();
    const Component = module.default;
    
    // Guardar en cache
    componentCache.set(componentName, Component);
    
    return Component;
  } catch (error) {
    console.error(`❌ Error loading component '${componentName}':`, error);
    return null;
  }
};

// Función para precargar componentes críticos
export const preloadCriticalComponents = async () => {
  const criticalComponents = ['Dashboard', 'CRMModule', 'PropertiesModule'];
  
  console.log('🚀 Preloading critical components...');
  
  await Promise.all(
    criticalComponents.map(componentName => loadComponent(componentName))
  );
  
  console.log('✅ Critical components preloaded');
};

// Función para limpiar cache (útil para desarrollo)
export const clearComponentCache = () => {
  componentCache.clear();
  console.log('🧹 Component cache cleared');
};