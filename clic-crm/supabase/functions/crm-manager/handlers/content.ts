// Content handler - CRUD for articles, videos, testimonials, FAQs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function handleContent(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const { content_type } = params;

  if (!content_type) {
    throw { message: 'content_type is required (articles, videos, testimonials, faqs)', status: 400 };
  }

  switch (content_type) {
    case 'articles':
      return await handleArticles(action, params, context, pagination);
    case 'videos':
      return await handleVideos(action, params, context, pagination);
    case 'testimonials':
      return await handleTestimonials(action, params, context, pagination);
    case 'faqs':
      return await handleFAQs(action, params, context, pagination);
    default:
      throw { message: `Unknown content type: ${content_type}`, status: 400 };
  }
}

// Articles
async function handleArticles(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'articles';

  switch (action) {
    case 'list':
      return await listContent(table, params, context, pagination);
    case 'get':
      return await getContent(table, params.id, context);
    case 'create':
      return await createContent(table, params, context);
    case 'update':
      return await updateContent(table, params.id, params.data, context);
    case 'delete':
      return await deleteContent(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Videos
async function handleVideos(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'videos';
  // Same CRUD operations
  switch (action) {
    case 'list':
      return await listContent(table, params, context, pagination);
    case 'get':
      return await getContent(table, params.id, context);
    case 'create':
      return await createContent(table, params, context);
    case 'update':
      return await updateContent(table, params.id, params.data, context);
    case 'delete':
      return await deleteContent(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Testimonials
async function handleTestimonials(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'testimonials';
  switch (action) {
    case 'list':
      return await listContent(table, params, context, pagination);
    case 'get':
      return await getContent(table, params.id, context);
    case 'create':
      return await createContent(table, params, context);
    case 'update':
      return await updateContent(table, params.id, params.data, context);
    case 'delete':
      return await deleteContent(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// FAQs
async function handleFAQs(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const table = 'faqs';
  switch (action) {
    case 'list':
      return await listContent(table, params, context, pagination);
    case 'get':
      return await getContent(table, params.id, context);
    case 'create':
      return await createContent(table, params, context);
    case 'update':
      return await updateContent(table, params.id, params.data, context);
    case 'delete':
      return await deleteContent(table, params.id, context);
    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// Generic list content
async function listContent(
  table: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const filters: Record<string, any> = {};
  if (params.status) filters.status = params.status;
  if (params.category) filters.category = params.category;
  if (params.is_published !== undefined) filters.is_published = params.is_published;

  const queryOptions: QueryOptions = {
    filters,
    search: params.search,
    searchFields: ['title', 'content', 'description'],
    orderBy: params.orderBy || 'created_at',
    orderDirection: params.orderDirection || 'desc',
    pagination,
  };

  let query = supabase
    .from(table)
    .select('*', { count: 'exact' });

  // Content is usually country-scoped
  if (context.scope !== 'all') {
    query = query.eq('country_code', context.country_code);
  }

  query = buildQuery(query, context, queryOptions);

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

// Generic get content
async function getContent(table: string, id: string, context: UserContext) {
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

// Generic create content
async function createContent(table: string, params: any, context: UserContext) {
  const contentData = {
    ...params,
    created_by: context.userId,
    country_code: context.country_code,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(table)
    .insert(contentData)
    .select()
    .single();

  if (error) {
    throw { message: error.message, status: 500 };
  }

  console.log(`✅ ${table} created:`, data.id);

  return {
    data,
    meta: { message: `Contenido creado exitosamente` },
  };
}

// Generic update content
async function updateContent(
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

  delete updateData.created_by;
  delete updateData.country_code;

  const { data: updated, error: updateError } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  console.log(`✅ ${table} updated:`, id);

  return {
    data: updated,
    meta: { message: 'Contenido actualizado exitosamente' },
  };
}

// Generic delete content
async function deleteContent(table: string, id: string, context: UserContext) {
  if (!id) {
    throw { message: 'ID is required', status: 400 };
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  console.log(`✅ ${table} deleted:`, id);

  return {
    data: { id },
    meta: { message: 'Contenido eliminado exitosamente' },
  };
}
