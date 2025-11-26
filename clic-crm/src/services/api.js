/**
 * API Service Layer for CLIC CRM
 *
 * This service wraps the crm-manager edge function and provides
 * a clean, typed interface for all API operations.
 *
 * Usage:
 *   import { api } from './services/api';
 *   const { data, meta, error } = await api.properties.list({ status: 'active' });
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export URL and key for Edge Function calls
export { supabaseUrl, supabaseAnonKey };

/**
 * Helper function to call edge function
 * @private
 */
async function callEdgeFunction(module, action, params = {}, pagination = null) {
  try {
    const { data, error } = await supabase.functions.invoke('crm-manager', {
      body: {
        module,
        action,
        params,
        ...(pagination && { pagination })
      }
    });

    if (error) {
      console.error(`API Error [${module}.${action}]:`, error);
      return { data: null, meta: null, error };
    }

    if (!data.success) {
      console.error(`API Error [${module}.${action}]:`, data.error);
      return { data: null, meta: null, error: data.error };
    }

    return {
      data: data.data,
      meta: data.meta,
      error: null
    };
  } catch (err) {
    console.error(`API Exception [${module}.${action}]:`, err);
    return {
      data: null,
      meta: null,
      error: { message: err.message || 'Unknown error' }
    };
  }
}

/**
 * Properties API
 */
export const properties = {
  /**
   * List properties with filters and pagination
   * @param {Object} params - Filter parameters
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<{data, meta, error}>}
   */
  list: async (params = {}, pagination = { page: 1, limit: 30 }) => {
    return callEdgeFunction('properties', 'list', params, pagination);
  },

  /**
   * Get single property by ID
   * @param {string} id - Property ID
   * @returns {Promise<{data, meta, error}>}
   */
  get: async (id) => {
    return callEdgeFunction('properties', 'get', { id });
  },

  /**
   * Create new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<{data, meta, error}>}
   */
  create: async (propertyData) => {
    return callEdgeFunction('properties', 'create', propertyData);
  },

  /**
   * Update property
   * @param {string} id - Property ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data, meta, error}>}
   */
  update: async (id, updates) => {
    return callEdgeFunction('properties', 'update', { id, data: updates });
  },

  /**
   * Delete property
   * @param {string} id - Property ID
   * @returns {Promise<{data, meta, error}>}
   */
  delete: async (id) => {
    return callEdgeFunction('properties', 'delete', { id });
  },

  /**
   * Bulk create properties
   * @param {Array} properties - Array of property objects
   * @returns {Promise<{data, meta, error}>}
   */
  bulkCreate: async (properties) => {
    return callEdgeFunction('properties', 'bulk_create', { properties });
  },

  /**
   * Export properties
   * @param {Object} params - Filter parameters
   * @returns {Promise<{data, meta, error}>}
   */
  export: async (params = {}) => {
    return callEdgeFunction('properties', 'export', params);
  }
};

/**
 * Contacts API
 */
export const contacts = {
  list: async (params = {}, pagination = { page: 1, limit: 30 }) => {
    return callEdgeFunction('contacts', 'list', params, pagination);
  },

  get: async (id) => {
    return callEdgeFunction('contacts', 'get', { id });
  },

  create: async (contactData) => {
    return callEdgeFunction('contacts', 'create', contactData);
  },

  update: async (id, updates) => {
    return callEdgeFunction('contacts', 'update', { id, data: updates });
  },

  delete: async (id) => {
    return callEdgeFunction('contacts', 'delete', { id });
  },

  export: async (params = {}) => {
    return callEdgeFunction('contacts', 'export', params);
  }
};

/**
 * Deals API
 */
export const deals = {
  list: async (params = {}, pagination = { page: 1, limit: 30 }) => {
    return callEdgeFunction('deals', 'list', params, pagination);
  },

  get: async (id) => {
    return callEdgeFunction('deals', 'get', { id });
  },

  create: async (dealData) => {
    return callEdgeFunction('deals', 'create', dealData);
  },

  update: async (id, updates) => {
    return callEdgeFunction('deals', 'update', { id, data: updates });
  },

  delete: async (id) => {
    return callEdgeFunction('deals', 'delete', { id });
  },

  /**
   * Get deal statistics based on user scope
   * @param {Object} params - Filter parameters
   * @returns {Promise<{data, meta, error}>}
   */
  stats: async (params = {}) => {
    return callEdgeFunction('deals', 'stats', params);
  },

  export: async (params = {}) => {
    return callEdgeFunction('deals', 'export', params);
  }
};

/**
 * Content API (articles, videos, testimonials, faqs)
 */
export const content = {
  list: async (contentType, params = {}, pagination = { page: 1, limit: 20 }) => {
    return callEdgeFunction('content', 'list', { content_type: contentType, ...params }, pagination);
  },

  get: async (contentType, id) => {
    return callEdgeFunction('content', 'get', { content_type: contentType, id });
  },

  create: async (contentType, contentData) => {
    return callEdgeFunction('content', 'create', { content_type: contentType, ...contentData });
  },

  update: async (contentType, id, updates) => {
    return callEdgeFunction('content', 'update', { content_type: contentType, id, data: updates });
  },

  delete: async (contentType, id) => {
    return callEdgeFunction('content', 'delete', { content_type: contentType, id });
  }
};

/**
 * Users API
 */
export const users = {
  list: async (params = {}, pagination = { page: 1, limit: 50 }) => {
    return callEdgeFunction('users', 'list', params, pagination);
  },

  get: async (id) => {
    return callEdgeFunction('users', 'get', { id });
  },

  create: async (userData) => {
    return callEdgeFunction('users', 'create', userData);
  },

  update: async (id, updates) => {
    return callEdgeFunction('users', 'update', { id, data: updates });
  },

  delete: async (id) => {
    return callEdgeFunction('users', 'delete', { id });
  },

  updateRoles: async (userId, roleIds) => {
    return callEdgeFunction('users', 'update_roles', { user_id: userId, role_ids: roleIds });
  }
};

/**
 * Config API (tags, categories, cities, sectors, configurations)
 */
export const config = {
  list: async (configType, params = {}, pagination = null) => {
    return callEdgeFunction('config', 'list', { config_type: configType, ...params }, pagination);
  },

  get: async (configType, id) => {
    return callEdgeFunction('config', 'get', { config_type: configType, id });
  },

  create: async (configType, configData) => {
    return callEdgeFunction('config', 'create', { config_type: configType, ...configData });
  },

  update: async (configType, id, updates) => {
    return callEdgeFunction('config', 'update', { config_type: configType, id, data: updates });
  },

  delete: async (configType, id) => {
    return callEdgeFunction('config', 'delete', { config_type: configType, id });
  }
};

/**
 * Auth helpers
 */
export const auth = {
  /**
   * Get current user with permissions
   * Called after login to enrich session
   */
  getUserPermissions: async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-permissions');

      if (error) {
        console.error('Error getting user permissions:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception getting user permissions:', err);
      return { data: null, error: { message: err.message } };
    }
  }
};

/**
 * Combined API object
 */
export const api = {
  properties,
  contacts,
  deals,
  content,
  users,
  config,
  auth,
  supabase // Export supabase client for direct access if needed
};

export default api;
