// Authentication middleware
// Extracts JWT, validates user, loads roles and permissions, builds context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export interface UserContext {
  userId: string;
  email: string;
  name?: string;
  roles: Array<{
    id: string;
    name: string;
    display_name: string;
  }>;
  permissions: string[];
  country_code: string;
  country?: string;
  team_id?: string;
  scope: 'own' | 'team' | 'country' | 'all';
  profile_photo_url?: string;
}

// Data scope mapping based on role
const ROLE_SCOPE_MAP: Record<string, 'own' | 'team' | 'country' | 'all'> = {
  super_admin: 'all',
  admin: 'country',
  manager: 'team',
  agent: 'own',
  accountant: 'country',
  client: 'own',
  viewer: 'all',
};

export async function authenticateUser(req: Request): Promise<UserContext> {
  // Get authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw { message: 'No authorization header', status: 401 };
  }

  // Extract JWT token
  const token = authHeader.replace('Bearer ', '');

  // Create Supabase client with service role (bypasses RLS)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw { message: 'Invalid or expired token', status: 401 };
  }

  // Load user profile with roles and permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles!inner(
        roles(
          id,
          name,
          display_name
        )
      )
    `)
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error loading profile:', profileError);
    // Fallback: create basic context from auth user
    return createFallbackContext(user);
  }

  // Extract roles
  const roles = profile.user_roles?.map((ur: any) => ur.roles) || [];
  const primaryRole = roles[0]?.name || 'agent';

  // Determine data scope based on primary role
  const scope = ROLE_SCOPE_MAP[primaryRole] || 'own';

  // Build user context
  const context: UserContext = {
    userId: user.id,
    email: user.email!,
    name: profile.name || profile.full_name,
    roles,
    permissions: [], // TODO: Load from permissions table if needed
    country_code: profile.country_code || 'DOM',
    country: profile.country,
    team_id: profile.team_id,
    scope,
    profile_photo_url: profile.profile_photo_url,
  };

  return context;
}

// Fallback context if profile not found
function createFallbackContext(user: any): UserContext {
  // Try to detect role from email
  const email = user.email.toLowerCase();
  let role = 'agent';

  if (email.includes('admin')) role = 'admin';
  else if (email.includes('manager')) role = 'manager';
  else if (email.includes('client')) role = 'client';

  return {
    userId: user.id,
    email: user.email,
    roles: [{ id: 'fallback', name: role, display_name: role }],
    permissions: [],
    country_code: 'DOM',
    scope: ROLE_SCOPE_MAP[role] || 'own',
  };
}
