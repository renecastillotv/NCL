// Config handler - Configuration, tags, and lookup tables
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function handleConfig(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const { config_type } = params;

  if (!config_type) {
    throw {
      message: 'config_type is required (tags, categories, cities, sectors, configurations)',
      status: 400,
    };
  }

  switch (config_type) {
    case 'tags':
      return await handleTags(action, params, context, pagination);
    case 'categories':
      return await handleCategories(action, params, context, pagination);
    case 'cities':
      return await handleCities(action, params, context, pagination);
    case 'sectors':
      return await handleSectors(action, params, context, pagination);
    case 'configurations':
      return await handleConfigurations(action, params, context);
    default:
      throw { message: `Unknown config type: ${config_type}`, status: 400 };
  }
}

// Tags
async function handleTags(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'tags';

  switch (action) {
    case 'list':
      return await listConfig(table, params, context, pagination);
    case 'get':
      return await getConfig(table, params.id, context);
    case 'create':
      return await createConfig(table, params, context);
    case 'update':
      return await updateConfig(table, params.id, params.data, context);
    case 'delete':
      return await deleteConfig(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Categories
async function handleCategories(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'property_categories';

  switch (action) {
    case 'list':
      return await listConfig(table, params, context, pagination);
    case 'get':
      return await getConfig(table, params.id, context);
    case 'create':
      return await createConfig(table, params, context);
    case 'update':
      return await updateConfig(table, params.id, params.data, context);
    case 'delete':
      return await deleteConfig(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Cities
async function handleCities(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'cities';

  switch (action) {
    case 'list':
      return await listConfig(table, params, context, pagination);
    case 'get':
      return await getConfig(table, params.id, context);
    case 'create':
      return await createConfig(table, params, context);
    case 'update':
      return await updateConfig(table, params.id, params.data, context);
    case 'delete':
      return await deleteConfig(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Sectors
async function handleSectors(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'sectors';

  switch (action) {
    case 'list': {
      // Sectors can be filtered by city
      const filters: Record<string, any> = {};
      if (params.city_id) filters.city_id = params.city_id;

      const queryOptions: QueryOptions = {
        filters,
        search: params.search,
        searchFields: ['name'],
        orderBy: 'name',
        orderDirection: 'asc',
        pagination,
      };

      let query = supabase
        .from(table)
        .select('*, cities(id, name)', { count: 'exact' });

      query = buildQuery(query, context, queryOptions, { countryField: 'country_code' });

      const { data, error, count } = await query;

      if (error) {
        throw { message: error.message, status: 500 };
      }

      return {
        data,
        meta: {
          total: count || 0,
          ...(pagination && {
            page: pagination.page,
            limit: pagination.limit,
            pages: Math.ceil((count || 0) / pagination.limit),
          }),
        },
      };
    }
    case 'get':
      return await getConfig(table, params.id, context);
    case 'create':
      return await createConfig(table, params, context);
    case 'update':
      return await updateConfig(table, params.id, params.data, context);
    case 'delete':
      return await deleteConfig(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// System configurations
async function handleConfigurations(
  action: string,
  params: any,
  context: UserContext
) {
  // Only super_admin and admin can manage configurations
  const primaryRole = context.roles[0]?.name;
  if (!['super_admin', 'admin'].includes(primaryRole)) {
    throw { message: 'No tienes permisos para gestionar configuraciones', status: 403 };
  }

  switch (action) {
    case 'list': {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('country_code', context.country_code)
        .order('key', { ascending: true });

      if (error) {
        throw { message: error.message, status: 500 };
      }

      return { data, meta: { total: data.length } };
    }

    case 'get': {
      const { key } = params;
      if (!key) {
        throw { message: 'Configuration key is required', status: 400 };
      }

      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('key', key)
        .eq('country_code', context.country_code)
        .single();

      if (error) {
        throw { message: error.message, status: 404 };
      }

      return { data, meta: {} };
    }

    case 'update': {
      const { key, value } = params;
      if (!key || value === undefined) {
        throw { message: 'Key and value are required', status: 400 };
      }

      const { data, error } = await supabase
        .from('configurations')
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        })
        .eq('key', key)
        .eq('country_code', context.country_code)
        .select()
        .single();

      if (error) {
        throw { message: error.message, status: 500 };
      }

      return { data, meta: { message: 'Configuración actualizada' } };
    }

    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Generic config CRUD
async function listConfig(
  table: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const filters: Record<string, any> = {};
  if (params.active !== undefined) filters.active = params.active;

  const queryOptions: QueryOptions = {
    filters,
    search: params.search,
    searchFields: ['name', 'slug'],
    orderBy: params.orderBy || 'name',
    orderDirection: 'asc',
    pagination,
  };

  let query = supabase.from(table).select('*', { count: 'exact' });

  // Most config tables have country_code
  if (context.scope !== 'all') {
    query = query.eq('country_code', context.country_code);
  }

  query = buildQuery(query, context, queryOptions, { countryField: 'country_code' });

  const { data, error, count } = await query;

  if (error) {
    throw { message: error.message, status: 500 };
  }

  const meta: any = { total: count || 0 };

  if (pagination) {
    meta.page = pagination.page;
    meta.limit = pagination.limit;
    meta.pages = Math.ceil((count || 0) / pagination.limit);
  }

  return { data, meta };
}

async function getConfig(table: string, id: string, context: UserContext) {
  if (!id) {
    throw { message: 'ID is required', status: 400 };
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw { message: error.message, status: 404 };
  }

  return { data, meta: {} };
}

async function createConfig(table: string, params: any, context: UserContext) {
  const configData = {
    ...params,
    country_code: context.country_code,
    created_by: context.userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(table)
    .insert(configData)
    .select()
    .single();

  if (error) {
    throw { message: error.message, status: 500 };
  }

  return {
    data,
    meta: { message: 'Creado exitosamente' },
  };
}

async function updateConfig(
  table: string,
  id: string,
  data: any,
  context: UserContext
) {
  if (!id) {
    throw { message: 'ID is required', status: 400 };
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    updated_by: context.userId,
  };

  delete updateData.country_code;
  delete updateData.created_by;

  const { data: updated, error: updateError } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  return {
    data: updated,
    meta: { message: 'Actualizado exitosamente' },
  };
}

async function deleteConfig(table: string, id: string, context: UserContext) {
  if (!id) {
    throw { message: 'ID is required', status: 400 };
  }

  const { error: deleteError } = await supabase.from(table).delete().eq('id', id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  return {
    data: { id },
    meta: { message: 'Eliminado exitosamente' },
  };
}
