import { baseRolesConfig } from './RolesConfigBase';

// Configuración específica para Colombia (CO)
export const colombiaRolesConfig = {
  super_admin: {
    ...baseRolesConfig.super_admin,
    modules: [
      ...baseRolesConfig.super_admin.modules,
      // Módulos específicos de Colombia
      {
        id: 'dian',
        name: 'DIAN',
        icon: 'FileText',
        component: 'DIANModule',
        country: 'CO',
        sections: [
          { id: 'integration', name: 'Integración DIAN', icon: 'Link', component: 'DIANIntegration' },
          { id: 'invoicing', name: 'Facturación Electrónica', icon: 'Receipt', component: 'DIANInvoicing' }
        ]
      },
      {
        id: 'inactive_agents',
        name: 'Agentes Inactivos',
        icon: 'UserX',
        component: 'InactiveAgentsModule',
        country: 'CO',
        sections: [
          { id: 'monthly_report', name: 'Reporte Mensual', icon: 'Calendar', component: 'InactiveAgentsReport' },
          { id: 'alerts', name: 'Alertas', icon: 'Bell', component: 'InactiveAgentsAlerts' }
        ]
      },
      {
        id: 'fedelonjas',
        name: 'FEDELONJAS',
        icon: 'Building',
        component: 'FedelonjasModule',
        country: 'CO',
        sections: [
          { id: 'valuations', name: 'Avalúos', icon: 'DollarSign', component: 'FedelonjasValuations' }
        ]
      }
    ]
  },

  admin: {
    ...baseRolesConfig.admin,
    modules: [
      ...baseRolesConfig.admin.modules,
      'dian', 'inactive_agents', 'fedelonjas'  // Admin tiene acceso a todos los módulos CO
    ]
  },

  manager: {
    ...baseRolesConfig.manager,
    modules: [
      ...baseRolesConfig.manager.modules,
      'inactive_agents'  // Manager solo ve agentes inactivos
    ]
  },

  agent: baseRolesConfig.agent,
  accountant: {
    ...baseRolesConfig.accountant,
    modules: [
      ...baseRolesConfig.accountant.modules,
      'dian'  // Contador necesita acceso a DIAN
    ]
  },
  client: baseRolesConfig.client,
  viewer: baseRolesConfig.viewer
};

// Configuraciones adicionales específicas de Colombia
export const colombiaSettings = {
  currency: 'COP',
  taxRate: 0.19,
  legalDocs: ['escritura', 'catastro', 'paz_y_salvo'],
  propertyTypes: ['apartamento', 'casa', 'finca', 'local', 'bodega'],
  integrations: {
    dian: {
      enabled: true,
      apiUrl: 'https://api.dian.gov.co'
    },
    fedelonjas: {
      enabled: true,
      provider: 'fedelonjas'
    }
  }
};