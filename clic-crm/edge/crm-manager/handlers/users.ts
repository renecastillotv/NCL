// Users handler - User management operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { UserContext } from '../middleware/auth.ts';
import { buildQuery, QueryOptions } from '../utils/query-builder.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const USER_SELECT = `
  *,
  user_roles(
    roles(id, name, display_name)
  ),
  teams(id, name)
`;

export async function handleUsers(
  action: string,
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  switch (action) {
    case 'list':
      return await listUsers(params, context, pagination);

    case 'get':
      return await getUser(params.id, context);

    case 'create':
      return await createUser(params, context);

    case 'update':
      return await updateUser(params.id, params.data, context);

    case 'delete':
      return await deleteUser(params.id, context);

    case 'update_roles':
      return await updateUserRoles(params.user_id, params.role_ids, context);

    default:
      throw { message: `Unknown action: ${action}`, status: 400 };
  }
}

async function listUsers(
  params: any,
  context: UserContext,
  pagination?: { page: number; limit: number }
) {
  const { status, role, team_id, search } = params;

  const filters: Record<string, any> = {};
  if (status) filters.status = status;
  if (team_id) filters.team_id = team_id;

  const queryOptions: QueryOptions = {
    filters,
    search,
    searchFields: ['name', 'email', 'position'],
    orderBy: params.orderBy || 'created_at',
    orderDirection: params.orderDirection || 'desc',
    pagination,
  };

  let query = supabase
    .from('profiles')
    .select(USER_SELECT, { count: 'exact' });

  // Users are country-scoped unless super_admin
  if (context.scope !== 'all') {
    query = query.eq('country_code', context.country_code);
  }

  // Team-scoped
  if (context.scope === 'team' && context.team_id) {
    query = query.eq('team_id', context.team_id);
  }

  query = buildQuery(query, context, queryOptions, {
    ownerField: 'id', // Users don't have created_by
    countryField: 'country_code',
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

async function getUser(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'User ID is required', status: 400 };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(USER_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    throw { message: error.message, status: 404 };
  }

  // Check if user can view this profile
  if (context.scope === 'country' && data.country_code !== context.country_code) {
    throw { message: 'No tienes acceso a este usuario', status: 403 };
  }

  if (context.scope === 'team' && data.team_id !== context.team_id) {
    throw { message: 'No tienes acceso a este usuario', status: 403 };
  }

  return { data, meta: {} };
}

async function createUser(params: any, context: UserContext) {
  // Only admin and super_admin can create users
  const primaryRole = context.roles[0]?.name;
  if (!['super_admin', 'admin'].includes(primaryRole)) {
    throw { message: 'No tienes permisos para crear usuarios', status: 403 };
  }

  const { email, password, name, role_ids, team_id } = params;

  if (!email || !password || !name) {
    throw { message: 'Email, password y nombre son requeridos', status: 400 };
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw { message: authError.message, status: 500 };
  }

  // Create profile
  const profileData = {
    id: authUser.user.id,
    email,
    name,
    country_code: context.country_code, // Auto-assign country
    team_id: team_id || context.team_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert(profileData);

  if (profileError) {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw { message: profileError.message, status: 500 };
  }

  // Assign roles
  if (role_ids && role_ids.length > 0) {
    const userRoles = role_ids.map((roleId: string) => ({
      user_id: authUser.user.id,
      role_id: roleId,
    }));
    await supabase.from('user_roles').insert(userRoles);
  }

  console.log('✅ User created:', authUser.user.id);

  return {
    data: { id: authUser.user.id, email, name },
    meta: { message: 'Usuario creado exitosamente' },
  };
}

async function updateUser(id: string, data: any, context: UserContext) {
  if (!id) {
    throw { message: 'User ID is required', status: 400 };
  }

  // Check permissions
  const primaryRole = context.roles[0]?.name;
  const canUpdate = ['super_admin', 'admin'].includes(primaryRole) || id === context.userId;

  if (!canUpdate) {
    throw { message: 'No tienes permisos para modificar este usuario', status: 403 };
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Don't allow changing country_code unless super_admin
  if (primaryRole !== 'super_admin') {
    delete updateData.country_code;
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (updateError) {
    throw { message: updateError.message, status: 500 };
  }

  console.log('✅ User updated:', id);

  return {
    data: updated,
    meta: { message: 'Usuario actualizado exitosamente' },
  };
}

async function deleteUser(id: string, context: UserContext) {
  if (!id) {
    throw { message: 'User ID is required', status: 400 };
  }

  // Only super_admin can delete users
  const primaryRole = context.roles[0]?.name;
  if (primaryRole !== 'super_admin') {
    throw { message: 'Solo super_admin puede eliminar usuarios', status: 403 };
  }

  // Delete auth user (cascades to profile)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

  if (deleteError) {
    throw { message: deleteError.message, status: 500 };
  }

  console.log('✅ User deleted:', id);

  return {
    data: { id },
    meta: { message: 'Usuario eliminado exitosamente' },
  };
}

async function updateUserRoles(userId: string, roleIds: string[], context: UserContext) {
  // Only admin/super_admin can change roles
  const primaryRole = context.roles[0]?.name;
  if (!['super_admin', 'admin'].includes(primaryRole)) {
    throw { message: 'No tienes permisos para cambiar roles', status: 403 };
  }

  // Delete existing roles
  await supabase.from('user_roles').delete().eq('user_id', userId);

  // Insert new roles
  if (roleIds && roleIds.length > 0) {
    const userRoles = roleIds.map((roleId: string) => ({
      user_id: userId,
      role_id: roleId,
    }));
    const { error } = await supabase.from('user_roles').insert(userRoles);

    if (error) {
      throw { message: error.message, status: 500 };
    }
  }

  console.log('✅ User roles updated:', userId);

  return {
    data: { user_id: userId, role_ids: roleIds },
    meta: { message: 'Roles actualizados exitosamente' },
  };
}
