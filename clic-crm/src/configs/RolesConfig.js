// Configuración SIMPLE de roles y módulos
// Solo especificamos qué módulos ve cada rol, sin complicaciones

export const rolesConfig = {
  super_admin: {
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'crm',
        name: 'CRM',
        icon: 'Users',
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
        sections: [
          { id: 'listings', name: 'Propiedades', icon: 'Home', component: 'CRMProperties' },
          { id: 'availability', name: 'Disponibilidad', icon: 'Calendar', component: 'Disponibilidad' },
          { id: 'create', name: 'Crear Propiedad', icon: 'Plus', component: 'PropertyCreateWizard' }
        ]
      },
      {
        id: 'sales',
        name: 'Ventas',
        icon: 'TrendingUp',
        sections: [
          { id: 'deals', name: 'Deals', icon: 'Handshake', component: 'DealsManager' },
          { id: 'commissions', name: 'Comisiones', icon: 'Settings', component: 'CommissionAdminConfig' }
        ]
      },
      {
        id: 'content',
        name: 'Contenido',
        icon: 'FileText',
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
        id: 'location',
        name: 'Ubicaciones',
        icon: 'MapPin',
        sections: [
          { id: 'insights', name: 'Análisis', icon: 'TrendingUp', component: 'LocationInsightsManager' }
        ]
      },
      {
        id: 'calendar',
        name: 'Calendario',
        icon: 'Calendar'
      },
      {
        id: 'reports',
        name: 'Reportes',
          icon: 'BarChart3',
          sections: [
              { id: 'imageoptimizer', name: 'Optimizar Imagenes', icon: 'TrendingUp', component: 'ImageOptimizer' }
          ]
      },
      {
        id: 'settings',
        name: 'Configuración',
        icon: 'Settings',
        sections: [
            { id: 'email_accounts', name: 'Cuentas de Email', icon: 'MessageSquare', component: 'EmailAccountsManager' },
            { id: 'email_inbox', name: 'Bandeja de Entrada', icon: 'MessageSquare', component: 'EmailInbox' }
        ]
      }
    ]
  },

  admin: {
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'crm',
        name: 'CRM',
        icon: 'Users',
        sections: [
          { id: 'contacts', name: 'Contactos', icon: 'UserPlus', component: 'ContactsManager' },
          { id: 'requests', name: 'Solicitudes', icon: 'ClipboardList', component: 'CRMRequests' }
        ]
      },
      {
        id: 'properties',
        name: 'Propiedades',
        icon: 'Home',
        sections: [
          { id: 'listings', name: 'Propiedades', icon: 'Home', component: 'CRMProperties' },
          { id: 'availability', name: 'Disponibilidad', icon: 'Calendar', component: 'Disponibilidad' }
        ]
      },
      {
        id: 'content',
        name: 'Contenido',
        icon: 'FileText',
        sections: [
          { id: 'articles', name: 'Artículos', icon: 'FileText', component: 'ArticleManager' },
          { id: 'videos', name: 'Videos', icon: 'Video', component: 'VideoManager' }
        ]
      },
      {
        id: 'settings',
        name: 'Configuración',
        icon: 'Settings',
        sections: [
          { id: 'email_accounts', name: 'Cuentas de Email', icon: 'MessageSquare', component: 'EmailAccountsManager' }
        ]
      }
    ]
  },

  manager: {
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'crm',
        name: 'CRM',
        icon: 'Users',
        sections: [
          { id: 'contacts', name: 'Contactos', icon: 'UserPlus', component: 'ContactsManager' }
        ]
      },
      {
        id: 'properties',
        name: 'Propiedades',
        icon: 'Home',
        sections: [
          { id: 'listings', name: 'Listados', icon: 'Home', component: 'CRMProperties' }
        ]
      }
    ]
  },

  agent: {
    modules: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'crm',
        name: 'CRM',
        icon: 'Users',
        sections: [
          { id: 'contacts', name: 'Contactos', icon: 'UserPlus', component: 'ContactsManager' }
        ]
      },
      {
        id: 'properties',
        name: 'Propiedades',
        icon: 'Home',
        sections: [
          { id: 'listings', name: 'Listados', icon: 'Home', component: 'CRMProperties' }
        ]
          },
          {
              id: 'mensajeria',
              name: 'Mensajeria',
              icon: 'Settings',
              sections: [
                  { id: 'Whatsapp', name: 'Whatsapp', icon: 'MessageSquare', component: 'WhatsappBusiness' },
                  { id: 'email_inbox', name: 'Bandeja de Entrada', icon: 'MessageSquare', component: 'EmailInbox' },
                  { id: 'email_signature', name: 'Configura Firma de Correo', icon: 'MessageSquare', component: 'EmailSignatureEditor' },
                  { id: 'configurar', name: 'Configuracion', icon: 'Settings', component: 'MensajeriaConfiguration' }
              ]
          }

    ]
  }
};

// Configuraciones específicas por país (OPCIONAL para casos especiales)
// NOTA: Se eliminó la sección DGII como solicitado
export const countrySpecificModules = {
  'CO': {
    // Colombia - módulos adicionales para super_admin
    super_admin: [
      {
        id: 'dian',
        name: 'DIAN',
        icon: 'FileText',
        sections: [
          { id: 'integration', name: 'Integración', icon: 'Link', component: 'DIANIntegration' }
        ]
      }
    ]
  }
};

// Función SIMPLE para obtener módulos del usuario
export const getUserModules = (user) => {
  if (!user) {
    console.log('⚠️ getUserModules: No hay usuario');
    return [];
  }

  console.log('🔍 getUserModules - Datos del usuario:', {
    hasRoles: !!user.roles,
    rolesArray: user.roles,
    hasRole: !!user.role,
    roleString: user.role,
    country_code: user.country_code
  });

  const role = user.roles?.[0]?.name || user.role || 'agent';
  const country = user.country_code || 'DOM';

  console.log(`🎯 Obteniendo módulos para rol: ${role}, país: ${country}`);

  // Obtener módulos base del rol
  let modules = rolesConfig[role]?.modules || rolesConfig.agent.modules;

  if (!rolesConfig[role]) {
    console.warn(`⚠️ Rol "${role}" no existe en rolesConfig, usando "agent" por defecto`);
  }
  
  // Agregar módulos específicos del país (solo para super_admin por ahora)
  if (role === 'super_admin' && countrySpecificModules[country]) {
    const countryModules = countrySpecificModules[country].super_admin || [];
    modules = [...modules, ...countryModules];
  }
  
  console.log(`📦 Módulos cargados: ${modules.length}`);
  modules.forEach(m => console.log(`  - ${m.name} (${m.sections?.length || 0} secciones)`));
  
  return modules;
};

// Función para verificar permisos
export const hasModuleAccess = (user, moduleId) => {
  const modules = getUserModules(user);
  return modules.some(m => m.id === moduleId);
};

export const hasActionPermission = (user, action) => {
  const role = user.roles?.[0]?.name || user.role || 'agent';
  
  const rolePermissions = {
    super_admin: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    admin: ['create', 'read', 'update', 'delete', 'export'],
    manager: ['create', 'read', 'update', 'export'],
    agent: ['create', 'read', 'update'],
    client: ['read'],
    viewer: ['read']
  };
  
  return rolePermissions[role]?.includes(action) || false;
};

export const getDataScope = (user) => {
  const role = user.roles?.[0]?.name || user.role || 'agent';
  
  const scopeMap = {
    super_admin: 'all',
    admin: 'all', 
    manager: 'team',
    agent: 'own',
    client: 'own',
    viewer: 'all'
  };
  
  return scopeMap[role] || 'own';
};