// Configuración base de roles (común para todos los países)
export const baseRolesConfig = {
  super_admin: {
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutDashboard',
        component: 'Dashboard'
      },
      {
        id: 'crm',
        name: 'CRM',
        icon: 'Users',
        component: 'CRMModule',
        sections: [
          { id: 'contacts', name: 'Contactos', icon: 'UserPlus', component: 'ContactsManager' },
          { id: 'users', name: 'Usuarios CRM', icon: 'Users', component: 'CRMUsers' },
          { id: 'requests', name: 'Solicitudes', icon: 'ClipboardList', component: 'CRMRequests' }
        ]
      },
      {
        id: 'properties',
        name: 'Propiedades',
        icon: 'Home',
        component: 'PropertiesModule',
        sections: [
          { id: 'listings', name: 'Listados', icon: 'Home', component: 'Propiedades' },
          { id: 'availability', name: 'Disponibilidad', icon: 'Calendar', component: 'Disponibilidad' },
          { id: 'create', name: 'Crear Propiedad', icon: 'Plus', component: 'PropertyCreateModal' },
          { id: 'evaluations', name: 'Evaluaciones', icon: 'FileText', component: 'PropertyEvaluations' }
        ]
      },
      {
        id: 'sales',
        name: 'Ventas',
        icon: 'TrendingUp',
        component: 'SalesModule',
        sections: [
          { id: 'deals', name: 'Deals', icon: 'Handshake', component: 'DealsManager' },
          { id: 'pipeline', name: 'Pipeline', icon: 'BarChart3', component: 'SalesPipeline' },
          { id: 'commissions', name: 'Configuración Comisiones', icon: 'Settings', component: 'CommissionAdminConfig' }
        ]
      },
      {
        id: 'content',
        name: 'Contenido',
        icon: 'FileText',
        component: 'ContentModule',
        sections: [
          { id: 'articles', name: 'Artículos', icon: 'FileText', component: 'ArticleManager' },
          { id: 'videos', name: 'Videos', icon: 'Video', component: 'VideoManager' },
          { id: 'testimonials', name: 'Testimonios', icon: 'MessageSquare', component: 'TestimonialManager' },
          { id: 'seo', name: 'SEO', icon: 'Search', component: 'SEOContentManager' },
          { id: 'faqs', name: 'FAQs', icon: 'HelpCircle', component: 'FAQsManager' },
          { id: 'tags', name: 'Etiquetas', icon: 'Tag', component: 'TagsManager' }
        ]
      },
      {
        id: 'calendar',
        name: 'Calendario',
        icon: 'Calendar',
        component: 'CalendarModule'
      },
      {
        id: 'reports',
        name: 'Reportes',
        icon: 'BarChart3',
        component: 'ReportsModule'
      },
      {
        id: 'accounting',
        name: 'Contabilidad',
        icon: 'DollarSign',
        component: 'AccountingModule',
        sections: [
          { id: 'transactions', name: 'Transacciones', icon: 'FileText', component: 'AccountingTransactions' },
          { id: 'invoices', name: 'Facturas', icon: 'Building', component: 'AccountingInvoices' }
        ]
      },
      {
        id: 'users',
        name: 'Usuarios',
        icon: 'Users',
        component: 'UsersModule',
        sections: [
          { id: 'management', name: 'Gestión', icon: 'UserPlus', component: 'UsersManagement' },
          { id: 'roles', name: 'Roles', icon: 'Settings', component: 'UsersRoles' }
        ]
      },
      {
        id: 'location',
        name: 'Ubicaciones',
        icon: 'MapPin',
        component: 'LocationModule',
        sections: [
          { id: 'insights', name: 'Análisis de Ubicación', icon: 'TrendingUp', component: 'LocationInsightsManager' }
        ]
      },
      {
        id: 'settings',
        name: 'Configuración',
        icon: 'Settings',
        component: 'SettingsModule'
      }
    ],
    permissions: {
      dataScope: 'all',
      actions: ['create', 'read', 'update', 'delete', 'export', 'manage']
    }
  },

  admin: {
    modules: [
      // Hereda de super_admin pero sin algunos módulos críticos
      'dashboard', 'crm', 'properties', 'sales', 'content', 'calendar', 'reports', 'settings'
    ],
    permissions: {
      dataScope: 'all', 
      actions: ['create', 'read', 'update', 'delete', 'export']
    }
  },

  manager: {
    modules: [
      'dashboard', 'crm', 'properties', 'sales', 'content', 'calendar', 'reports'
    ],
    permissions: {
      dataScope: 'team',
      actions: ['create', 'read', 'update', 'export']
    }
  },

  agent: {
    modules: [
      'dashboard', 'crm', 'properties', 'sales', 'calendar'
    ],
    permissions: {
      dataScope: 'own',
      actions: ['create', 'read', 'update']
    }
  },

  accountant: {
    modules: [
      'dashboard', 'accounting', 'reports'
    ],
    permissions: {
      dataScope: 'all',
      actions: ['create', 'read', 'update', 'export']
    }
  },

  client: {
    modules: [
      'dashboard', 'properties'
    ],
    permissions: {
      dataScope: 'own',
      actions: ['read']
    }
  },

  viewer: {
    modules: [
      'dashboard', 'reports'
    ],
    permissions: {
      dataScope: 'all',
      actions: ['read']
    }
  }
};