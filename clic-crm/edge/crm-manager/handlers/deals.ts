// Deals handler - CRUD operations for deals/sales
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { checkRecordAccess } from '../middleware/permissions.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const DEAL_SELECT = `
  *,
  properties(id, title, reference_code, operation_type, price, currency),
  contacts(id, name, email, phone),
  users!deals_agent_id_fkey(id, name, email),
  deal_types(id, name),
  deal_statuses(id, name, color),
  operation_types(id, name),
  teams(id, name)
`;

export async function handleDeals(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  switch (action) {
    case 'list':
      return await listDeals(params, context, pagination);

    case 'get':
      return await getDeal(params.id, context);

    case 'create':
      return await createDeal(params, context);

    case 'update':
      return await updateDeal(params.id, params.data, context);

    case 'delete':
      return await deleteDeal(params.id, context);

    case 'stats':
      return await getDealStats(params, context);

    case 'export':
      return await exportDeals(params, context);

    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

async function listDeals(
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const {
    status_id,
    type_id,
    agent_id,
    team_id,
    operation_type_id,
    min_amount,
    max_amount,
    date_from,
    date_to,
    is_external,
    search,
  } = params;

  const filters: Record<string, any> = {};
  if (status_id) filters.status_id = status_id;
  if (type_id) filters.type_id = type_id;
  if (agent_id) filters.agent_id = agent_id;
  if (team_id) filters.team_id = team_id;
  if (operation_type_id) filters.operation_type_id = operation_type_id;
  if (is_external !== undefined) filters.is_external = is_external;

  // Amount range
  if (min_amount !== undefined || max_amount !== undefined) {
    filters.deal_amount = {};
    if (min_amount !== undefined) filters.deal_amount.gte = min_amount;
    if (max_amount !== undefined) filters.deal_amount.lte = max_amount;
  }

  // Date range
  if (date_from || date_to) {
    filters.deal_date = {};
    if (date_from) filters.deal_date.gte = date_from;
    if (date_to) filters.deal_date.lte = date_to;
  }

  const queryOptions: QueryOptions = {
    filters,
    search,
    searchFields: ['deal_number', 'notes'],
    orderBy: params.orderBy || 'deal_date',
    orderDirection: params.orderDirection || 'desc',
    pagination,
  };

  let query = supabase
    .from('deals')
    .select(DEAL_SELECT, { count: 'exact' });

  // Apply scope based on role
  query = buildQuery(query, context, queryOptions, {
    ownerField: 'agent_id', // Deals belong to agent
  });

  const { data, error, count } = await query;

  if (error) {
    throw { message: error.message, status: 500 };
  }

  const meta: any = {
    total: count || 0,
    filters_applied: filters,
  };

  if (pagination) {
    meta.page = pagination.page;
    meta.limit = pagination.limit;
    meta.pages = Math.ceil((count || 0) / pagination.limit);
  }

  return { data, meta };
}

async function getDeal(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Deal ID is required', status: 400 };
  }

  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    throw { message: error.message, status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    data.agent_id,
    data.team_id,
    data.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes acceso a esta venta', status: 403 };
  }

  return { data, meta: {} };
}

async function createDeal(params: any, context: UserContext) {
  const dealData = {
    ...params,
    agent_id: params.agent_id || context.userId,
    created_by: context.userId,
    country_code: context.country_code,
    team_id: context.team_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Validate required fields
  const required = ['property_id', 'contact_id', 'deal_amount', 'deal_date'];
  for (const field of required) {
    if (!dealData[field]) {
      throw { message: `Campo requerido: ${field}`, status: 400 };
    }
  }

  const { data, error } = await supabase
    .from('deals')
    .insert(dealData)
    .select(DEAL_SELECT)
    .single();

  if (error) {
    throw { message: error.message, status: 500 };
  }

  console.log('✅ Deal created:', data.id);

  return {
    data,
    meta: {
      message: 'Venta creada exitosamente',
      country_assigned: context.country_code,
    },
  };
}

async function updateDeal(id: string, data: any, context: UserContext) {
  if (!id) {
    throw { message: 'Deal ID is required', status: 400 };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('deals')
    .select('id, agent_id, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Venta no encontrada', status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    existing.agent_id,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para modificar esta venta', status: 403 };
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    updated_by: context.userId,
  };

  delete updateData.country_code;
  delete updateData.created_by;

  const { data: updated, error: updateError } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', id)
    .select(DEAL_SELECT)
    .single();

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  console.log('✅ Deal updated:', id);

  return {
    data: updated,
    meta: { message: 'Venta actualizada exitosamente' },
  };
}

async function deleteDeal(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Deal ID is required', status: 400 };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('deals')
    .select('id, agent_id, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Venta no encontrada', status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    existing.agent_id,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para eliminar esta venta', status: 403 };
  }

  const { error: deleteError } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  console.log('✅ Deal deleted:', id);

  return {
    data: { id },
    meta: { message: 'Venta eliminada exitosamente' },
  };
}

// Get deal statistics based on user scope
async function getDealStats(params: any, context: UserContext) {
  // Build base query with scope
  let query = supabase
    .from('deals')
    .select('deal_amount, currency, deal_date, status_id, agent_id, team_id, country_code');

  // Apply scope filtering
  if (context.scope === 'own') {
    query = query.eq('agent_id', context.userId);
  } else if (context.scope === 'team') {
    if (context.team_id) {
      query = query.or(`team_id.eq.${context.team_id},agent_id.eq.${context.userId}`);
    } else {
      query = query.eq('agent_id', context.userId);
    }
  } else if (context.scope === 'country') {
    query = query.eq('country_code', context.country_code);
  }
  // 'all' scope: no filtering

  const { data, error } = await query;

  if (error) {
    throw { message: error.message, status: 500 };
  }

  // Calculate statistics
  const stats = {
    total_deals: data.length,
    total_amount: data.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0),
    by_status: {},
    by_agent: {},
    by_country: {},
    scope: context.scope,
  };

  return { data: stats, meta: {} };
}

async function exportDeals(params: any, context: UserContext) {
  const { data } = await listDeals(params, context);

  const exportData = data.map((deal: any) => ({
    ID: deal.id,
    Número: deal.deal_number,
    Propiedad: deal.properties?.title,
    Cliente: deal.contacts?.name,
    Agente: deal.users?.name,
    Monto: deal.deal_amount,
    Moneda: deal.currency,
    Estado: deal.deal_statuses?.name,
    Fecha: deal.deal_date,
    'Es Externa': deal.is_external ? 'Sí' : 'No',
  }));

  return {
    data: exportData,
    meta: {
      format: 'csv',
      filename: `deals_${new Date().toISOString().split('T')[0]}.csv`,
    },
  };
}
