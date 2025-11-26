// Contacts handler - CRUD operations for contacts/leads
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { checkRecordAccess } from '../middleware/permissions.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const CONTACT_SELECT = `
  *,
  cities(id, name),
  users!contacts_assigned_to_fkey(id, name, email),
  contact_types(id, name)
`;

export async function handleContacts(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  switch (action) {
    case 'list':
      return await listContacts(params, context, pagination);

    case 'get':
      return await getContact(params.id, context);

    case 'create':
      return await createContact(params, context);

    case 'update':
      return await updateContact(params.id, params.data, context);

    case 'delete':
      return await deleteContact(params.id, context);

    case 'export':
      return await exportContacts(params, context);

    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

async function listContacts(
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const {
    status,
    type_id,
    city_id,
    assigned_to,
    source,
    search,
  } = params;

  const filters: Record<string, any> = {};
  if (status) filters.status = status;
  if (type_id) filters.type_id = type_id;
  if (city_id) filters.city_id = city_id;
  if (assigned_to) filters.assigned_to = assigned_to;
  if (source) filters.source = source;

  const queryOptions: QueryOptions = {
    filters,
    search,
    searchFields: ['name', 'email', 'phone', 'company'],
    orderBy: params.orderBy || 'created_at',
    orderDirection: params.orderDirection || 'desc',
    pagination,
  };

  let query = supabase
    .from('contacts')
    .select(CONTACT_SELECT, { count: 'exact' });

  query = buildQuery(query, context, queryOptions, {
    ownerField: 'assigned_to', // Contacts use assigned_to instead of created_by
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

async function getContact(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Contact ID is required', status: 400 };
  }

  const { data, error } = await supabase
    .from('contacts')
    .select(CONTACT_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    throw { message: error.message, status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    data.assigned_to || data.created_by,
    data.team_id,
    data.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes acceso a este contacto', status: 403 };
  }

  return { data, meta: {} };
}

async function createContact(params: any, context: UserContext) {
  const contactData = {
    ...params,
    assigned_to: params.assigned_to || context.userId,
    created_by: context.userId,
    country_code: context.country_code,
    team_id: context.team_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Validate required fields
  if (!contactData.name || !contactData.email) {
    throw { message: 'Nombre y email son requeridos', status: 400 };
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(contactData)
    .select(CONTACT_SELECT)
    .single();

  if (error) {
    throw { message: error.message, status: 500 };
  }

  console.log('✅ Contact created:', data.id);

  return {
    data,
    meta: { message: 'Contacto creado exitosamente' },
  };
}

async function updateContact(id: string, data: any, context: UserContext) {
  if (!id) {
    throw { message: 'Contact ID is required', status: 400 };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('contacts')
    .select('id, assigned_to, created_by, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Contacto no encontrado', status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    existing.assigned_to || existing.created_by,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para modificar este contacto', status: 403 };
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    updated_by: context.userId,
  };

  delete updateData.country_code;
  delete updateData.created_by;

  const { data: updated, error: updateError } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', id)
    .select(CONTACT_SELECT)
    .single();

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  console.log('✅ Contact updated:', id);

  return {
    data: updated,
    meta: { message: 'Contacto actualizado exitosamente' },
  };
}

async function deleteContact(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Contact ID is required', status: 400 };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('contacts')
    .select('id, assigned_to, created_by, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Contacto no encontrado', status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    existing.assigned_to || existing.created_by,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para eliminar este contacto', status: 403 };
  }

  const { error: deleteError } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  console.log('✅ Contact deleted:', id);

  return {
    data: { id },
    meta: { message: 'Contacto eliminado exitosamente' },
  };
}

async function exportContacts(params: any, context: UserContext) {
  const { data } = await listContacts(params, context);

  const exportData = data.map((contact: any) => ({
    ID: contact.id,
    Nombre: contact.name,
    Email: contact.email,
    Teléfono: contact.phone,
    Empresa: contact.company,
    Ciudad: contact.cities?.name,
    Estado: contact.status,
    Asignado: contact.users?.name,
    'Fecha Creación': contact.created_at,
  }));

  return {
    data: exportData,
    meta: {
      format: 'csv',
      filename: `contacts_${new Date().toISOString().split('T')[0]}.csv`,
    },
  };
}
