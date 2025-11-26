// Engine de permisos completamente local
import { baseRolesConfig } from '../roles/RolesConfigBase';
import { dominicanaRolesConfig } from '../roles/RolesConfigDominicana';
import { colombiaRolesConfig } from '../roles/RolesConfigColombia';

// Configuraciones por país
const countryConfigs = {
  'DOM': dominicanaRolesConfig,
  'CO': colombiaRolesConfig,
  'PA': baseRolesConfig, // Panamá usa config base por ahora
  // Agregar más países aquí...
};

// Función principal para obtener configuración del usuario
export const getUserConfig = (user) => {
  if (!user) return null;

  // Determinar país del usuario
  const country = user.country_code || 'DOM';
  
  // Determinar rol principal del usuario
  const userRole = user.roles?.[0]?.name || user.role || 'viewer';
  
  // Obtener configuración del país
  const countryConfig = countryConfigs[country] || baseRolesConfig;
  
  // Obtener configuración del rol
  const roleConfig = countryConfig[userRole] || baseRolesConfig.viewer;
  
  console.log(`🎯 Config cargada: País=${country}, Rol=${userRole}, Módulos=${roleConfig.modules?.length || 0}`);
  
  return {
    country,
    role: userRole,
    modules: processModules(roleConfig.modules, userRole),
    permissions: roleConfig.permissions || { dataScope: 'own', actions: ['read'] },
    settings: getCountrySettings(country)
  };
};

// Procesar módulos (expandir referencias de string)
const processModules = (modules, userRole) => {
  if (!modules) return [];
  
  return modules.map(module => {
    if (typeof module === 'string') {
      // Es una referencia a módulo base, expandirla
      const baseModule = baseRolesConfig.super_admin.modules.find(m => m.id === module);
      if (baseModule) {
        return filterModuleSections(baseModule, userRole);
      } else {
        console.warn(`⚠️ Module '${module}' not found in base config`);
        return null;
      }
    } else {
      // Es un módulo completo, filtrar secciones según rol
      return filterModuleSections(module, userRole);
    }
  }).filter(Boolean); // Remover nulls
};

// Filtrar secciones de módulo según rol
const filterModuleSections = (module, userRole) => {
  if (!module.sections) return module;
  
  // Reglas de filtrado por rol
  const sectionFilters = {
    'agent': (section) => !['roles', 'management', 'invoices'].includes(section.id),
    'accountant': (section) => ['transactions', 'invoices', 'reports'].includes(section.id) || section.id.includes('accounting'),
    'client': (section) => ['listings', 'availability'].includes(section.id),
    'viewer': (section) => section.id === 'reports'
  };
  
  const filter = sectionFilters[userRole];
  
  if (filter) {
    return {
      ...module,
      sections: module.sections.filter(filter)
    };
  }
  
  return module; // Sin filtro para admin/super_admin/manager
};

// Obtener configuraciones específicas del país
const getCountrySettings = (country) => {
  const countrySettings = {
    'DOM': {
      currency: 'DOP',
      taxRate: 0.18,
      locale: 'es-DO',
      timezone: 'America/Santo_Domingo'
    },
    'CO': {
      currency: 'COP', 
      taxRate: 0.19,
      locale: 'es-CO',
      timezone: 'America/Bogota'
    },
    'PA': {
      currency: 'USD',
      taxRate: 0.07,
      locale: 'es-PA', 
      timezone: 'America/Panama'
    }
  };
  
  return countrySettings[country] || countrySettings['DOM'];
};

// Hook de permisos simplificado
export const useLocalPermissions = (user) => {
  const config = getUserConfig(user);
  
  if (!config) {
    return {
      hasModuleAccess: () => false,
      hasAction: () => false,
      getDataScope: () => 'none',
      canAccessSection: () => false,
      userRole: 'viewer',
      userLevel: 0,
      modules: [],
      settings: {}
    };
  }
  
  // Super admin tiene acceso a todo automáticamente
  if (config.role === 'super_admin') {
    return {
      hasModuleAccess: () => true,
      hasAction: () => true,
      getDataScope: () => 'all',
      canAccessSection: () => true,
      userRole: config.role,
      userLevel: 10,
      modules: config.modules,
      settings: config.settings
    };
  }
  
  // Para otros roles, verificar permisos específicos
  const moduleIds = config.modules.map(m => m.id);
  const sectionIds = config.modules.flatMap(m => 
    (m.sections || []).map(s => `${m.id}.${s.id}`)
  );
  
  return {
    hasModuleAccess: (moduleId) => moduleIds.includes(moduleId),
    
    hasAction: (action) => config.permissions.actions.includes(action),
    
    getDataScope: () => config.permissions.dataScope,
    
    canAccessSection: (moduleId, sectionId) => {
      if (!moduleIds.includes(moduleId)) return false;
      if (!sectionId) return true; // Acceso al módulo principal
      return sectionIds.includes(`${moduleId}.${sectionId}`);
    },
    
    userRole: config.role,
    userLevel: user.roles?.[0]?.level || 1,
    modules: config.modules,
    settings: config.settings
  };
};

// Función para debugging
export const debugUserPermissions = (user) => {
  const config = getUserConfig(user);
  
  console.group('🔍 DEBUG: User Permissions');
  console.log('User:', user);
  console.log('Config:', config);
  console.log('Modules:', config?.modules?.map(m => ({
    id: m.id,
    name: m.name,
    sections: m.sections?.length || 0
  })));
  console.groupEnd();
  
  return config;
};