import { baseRolesConfig } from './RolesConfigBase';

// Configuración específica para República Dominicana (DOM)
export const dominicanaRolesConfig = {
  super_admin: {
    ...baseRolesConfig.super_admin,
    modules: [
      ...baseRolesConfig.super_admin.modules,
      // Módulos específicos de República Dominicana
      {
        id: 'dgii',
        name: 'DGII',
        icon: 'FileText',
        component: 'DGIIModule',
        country: 'DOM',
        sections: [
          { id: 'integration', name: 'Integración DGII', icon: 'Link', component: 'DGIIIntegration' },
          { id: 'reports', name: 'Reportes DGII', icon: 'BarChart3', component: 'DGIIReports' }
        ]
      },
      {
        id: 'cedula',
        name: 'Validación Cédula',
        icon: 'Shield',
        component: 'CedulaModule',
        country: 'DOM',
        sections: [
          { id: 'validator', name: 'Validador', icon: 'CheckCircle', component: 'CedulaValidator' },
          { id: 'batch', name: 'Validación Masiva', icon: 'Upload', component: 'CedulaBatch' }
        ]
      }
    ]
  },

  admin: {
    ...baseRolesConfig.admin,
    modules: [
      ...baseRolesConfig.admin.modules,
      'dgii', 'cedula'  // Admin también puede acceder a módulos DOM
    ]
  },

  manager: {
    ...baseRolesConfig.manager,
    modules: [
      ...baseRolesConfig.manager.modules,
      'cedula'  // Manager solo acceso a validación de cédula
    ]
  },

  agent: baseRolesConfig.agent,      // Sin cambios para agentes
  accountant: baseRolesConfig.accountant,  // Sin cambios para contadores
  client: baseRolesConfig.client,    // Sin cambios para clientes
  viewer: baseRolesConfig.viewer     // Sin cambios para viewers
};

// Configuraciones adicionales específicas de República Dominicana
export const dominicanaSettings = {
  currency: 'DOP',
  taxRate: 0.18,
  legalDocs: ['titulo', 'planos', 'catastro'],
  propertyTypes: ['apartamento', 'casa', 'villa', 'penthouse', 'local'],
  integrations: {
    dgii: {
      enabled: true,
      apiUrl: 'https://api.dgii.gov.do'
    },
    cedula: {
      enabled: true,
      provider: 'jce'
    }
  }
};