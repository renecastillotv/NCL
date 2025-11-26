// Properties handler - CRUD operations for properties and related tables
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { checkRecordAccess } from '../middleware/permissions.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

// Initialize Supabase client with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Property with all related data
const PROPERTY_SELECT = `
  *,
  property_categories(id, name, slug),
  cities(id, name),
  sectors(id, name, city_id),
  users!properties_created_by_fkey(id, name, email, profile_photo_url),
  property_features(
    id,
    feature_type,
    feature_value,
    feature_unit
  ),
  property_images(
    id,
    image_url,
    image_order,
    is_primary,
    caption
  ),
  property_documents(
    id,
    document_type,
    document_url,
    document_name
  ),
  property_availability(
    id,
    available_from,
    available_to,
    status
  ),
  property_tags(
    tags(id, name, slug, color)
  )
`;

export async function handleProperties(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  switch (action) {
    case 'list':
      return await listProperties(params, context, pagination);

    case 'get':
      return await getProperty(params.id, context);

    case 'create':
      return await createProperty(params, context);

    case 'update':
      return await updateProperty(params.id, params.data, context);

    case 'delete':
      return await deleteProperty(params.id, context);

    case 'bulk_create':
      return await bulkCreateProperties(params.properties, context);

    case 'export':
      return await exportProperties(params, context);

    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

// List properties with filters and pagination
async function listProperties(
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const {
    status,
    category_id,
    city_id,
    sector_id,
    operation_type,
    min_price,
    max_price,
    bedrooms,
    bathrooms,
    search,
    is_featured,
    is_project,
    tags,
  } = params;

  // Build filters
  const filters: Record<string, any> = {};
  if (status) filters.status = status;
  if (category_id) filters.category_id = category_id;
  if (city_id) filters.city_id = city_id;
  if (sector_id) filters.sector_id = sector_id;
  if (operation_type) filters.operation_type = operation_type;
  if (is_featured !== undefined) filters.is_featured = is_featured;
  if (is_project !== undefined) filters.is_project = is_project;

  // Price range
  if (min_price !== undefined || max_price !== undefined) {
    filters.price = {};
    if (min_price !== undefined) filters.price.gte = min_price;
    if (max_price !== undefined) filters.price.lte = max_price;
  }

  // Bedrooms/bathrooms
  if (bedrooms !== undefined) filters.bedrooms = bedrooms;
  if (bathrooms !== undefined) filters.bathrooms = bathrooms;

  // Build query with scope and filters
  const queryOptions: QueryOptions = {
    filters,
    search,
    searchFields: ['title', 'description', 'reference_code'],
    orderBy: params.orderBy || 'created_at',
    orderDirection: params.orderDirection || 'desc',
    pagination,
  };

  let query = supabase
    .from('properties')
    .select(PROPERTY_SELECT, { count: 'exact' });

  query = buildQuery(query, context, queryOptions);

  // Handle tag filtering (if specified)
  if (tags && tags.length > 0) {
    // Join with property_tags table
    const { data: propertyIds, error: tagError } = await supabase
      .from('property_tags')
      .select('property_id')
      .in('tag_id', tags);

    if (!tagError && propertyIds) {
      const ids = propertyIds.map(p => p.property_id);
      query = query.in('id', ids);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing properties:', error);
    throw { message: error.message, status: 500 };
  }

  // Calculate meta information
  const meta: any = {
    total: count || 0,
    filters_applied: {
      ...filters,
      country_code: context.scope !== 'all' ? context.country_code : undefined,
      scope: context.scope,
    },
  };

  if (pagination) {
    meta.page = pagination.page;
    meta.limit = pagination.limit;
    meta.pages = Math.ceil((count || 0) / pagination.limit);
  }

  return { data, meta };
}

// Get single property by ID
async function getProperty(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Property ID is required', status: 400 };
  }

  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    throw { message: error.message, status: 404 };
  }

  // Check access
  const hasAccess = await checkRecordAccess(
    context,
    data.created_by,
    data.team_id,
    data.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes acceso a esta propiedad', status: 403 };
  }

  return { data, meta: {} };
}

// Create new property
async function createProperty(params: any, context: UserContext) {
  // Auto-inject user context
  const propertyData = {
    ...params,
    created_by: context.userId,
    country_code: context.country_code, // Auto-assign country
    team_id: context.team_id, // Auto-assign team
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Validate required fields
  const required = ['title', 'operation_type', 'category_id'];
  for (const field of required) {
    if (!propertyData[field]) {
      throw { message: `Campo requerido: ${field}`, status: 400 };
    }
  }

  // Start transaction by inserting main property
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single();

  if (propertyError) {
    console.error('Error creating property:', propertyError);
    throw { message: propertyError.message, status: 500 };
  }

  // Insert related data if provided
  const propertyId = property.id;

  // Features
  if (params.features && params.features.length > 0) {
    const features = params.features.map((f: any) => ({
      ...f,
      property_id: propertyId,
    }));
    await supabase.from('property_features').insert(features);
  }

  // Images
  if (params.images && params.images.length > 0) {
    const images = params.images.map((img: any) => ({
      ...img,
      property_id: propertyId,
    }));
    await supabase.from('property_images').insert(images);
  }

  // Tags
  if (params.tags && params.tags.length > 0) {
    const propertyTags = params.tags.map((tagId: string) => ({
      property_id: propertyId,
      tag_id: tagId,
    }));
    await supabase.from('property_tags').insert(propertyTags);
  }

  // Documents
  if (params.documents && params.documents.length > 0) {
    const documents = params.documents.map((doc: any) => ({
      ...doc,
      property_id: propertyId,
    }));
    await supabase.from('property_documents').insert(documents);
  }

  // Reload property with all relations
  const { data: fullProperty } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', propertyId)
    .single();

  console.log('✅ Property created:', propertyId);

  return {
    data: fullProperty,
    meta: {
      message: 'Propiedad creada exitosamente',
      country_assigned: context.country_code,
    },
  };
}

// Update property
async function updateProperty(id: string, data: any, context: UserContext) {
  if (!id) {
    throw { message: 'Property ID is required', status: 400 };
  }

  // Check if property exists and user has access
  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('id, created_by, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Propiedad no encontrada', status: 404 };
  }

  // Verify access
  const hasAccess = await checkRecordAccess(
    context,
    existing.created_by,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para modificar esta propiedad', status: 403 };
  }

  // Update main property
  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    updated_by: context.userId,
  };

  // Don't allow changing country_code or created_by
  delete updateData.country_code;
  delete updateData.created_by;

  const { error: updateError } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  // Handle related data updates if provided
  if (data.features !== undefined) {
    // Delete old features and insert new ones
    await supabase.from('property_features').delete().eq('property_id', id);
    if (data.features.length > 0) {
      const features = data.features.map((f: any) => ({
        ...f,
        property_id: id,
      }));
      await supabase.from('property_features').insert(features);
    }
  }

  if (data.tags !== undefined) {
    // Update tags
    await supabase.from('property_tags').delete().eq('property_id', id);
    if (data.tags.length > 0) {
      const propertyTags = data.tags.map((tagId: string) => ({
        property_id: id,
        tag_id: tagId,
      }));
      await supabase.from('property_tags').insert(propertyTags);
    }
  }

  // Reload updated property
  const { data: updated } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)
    .single();

  console.log('✅ Property updated:', id);

  return {
    data: updated,
    meta: { message: 'Propiedad actualizada exitosamente' },
  };
}

// Delete property
async function deleteProperty(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'Property ID is required', status: 400 };
  }

  // Check access
  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('id, created_by, team_id, country_code')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw { message: 'Propiedad no encontrada', status: 404 };
  }

  const hasAccess = await checkRecordAccess(
    context,
    existing.created_by,
    existing.team_id,
    existing.country_code
  );

  if (!hasAccess) {
    throw { message: 'No tienes permisos para eliminar esta propiedad', status: 403 };
  }

  // Delete related data first (cascade delete or manual)
  await supabase.from('property_features').delete().eq('property_id', id);
  await supabase.from('property_images').delete().eq('property_id', id);
  await supabase.from('property_documents').delete().eq('property_id', id);
  await supabase.from('property_tags').delete().eq('property_id', id);
  await supabase.from('property_availability').delete().eq('property_id', id);

  // Delete main property
  const { error: deleteError } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  console.log('✅ Property deleted:', id);

  return {
    data: { id },
    meta: { message: 'Propiedad eliminada exitosamente' },
  };
}

// Bulk create properties
async function bulkCreateProperties(properties: any[], context: UserContext) {
  if (!properties || properties.length === 0) {
    throw { message: 'No properties provided', status: 400 };
  }

  // Auto-inject context for all properties
  const propertiesWithContext = properties.map((prop) => ({
    ...prop,
    created_by: context.userId,
    country_code: context.country_code,
    team_id: context.team_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('properties')
    .insert(propertiesWithContext)
    .select();

  if (error) {
    throw { message: error.message, status: 500 };
  }

  console.log(`✅ Bulk created ${data.length} properties`);

  return {
    data,
    meta: {
      message: `${data.length} propiedades creadas exitosamente`,
      created_count: data.length,
    },
  };
}

// Export properties to CSV/Excel format
async function exportProperties(params: any, context: UserContext) {
  // Get all properties without pagination
  const { data } = await listProperties(params, context);

  // Format data for export
  const exportData = data.map((prop: any) => ({
    ID: prop.id,
    Referencia: prop.reference_code,
    Titulo: prop.title,
    Categoria: prop.property_categories?.name,
    'Tipo de Operación': prop.operation_type,
    Precio: prop.price,
    Moneda: prop.currency,
    Habitaciones: prop.bedrooms,
    Baños: prop.bathrooms,
    'Área (m²)': prop.area_m2,
    Ciudad: prop.cities?.name,
    Sector: prop.sectors?.name,
    Estado: prop.status,
    'Es Proyecto': prop.is_project ? 'Sí' : 'No',
    'Fecha Creación': prop.created_at,
  }));

  return {
    data: exportData,
    meta: {
      format: 'csv',
      filename: `properties_${new Date().toISOString().split('T')[0]}.csv`,
    },
  };
}
