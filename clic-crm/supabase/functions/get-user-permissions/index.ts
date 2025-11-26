// Edge Function: get-user-permissions
// Returns user profile with roles and permissions after login
// Called by App.js on every login to enrich user session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from './cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('🔐 Loading permissions for user:', user.email);

    // Load user from users table (using auth_user_id)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);

      // Fallback: create basic user object from auth (con formato nested)
      const fallbackUser = {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          country_code: 'DOM',
          country: 'República Dominicana',
        },
        roles: [{ id: 'fallback', name: 'agent', display_name: 'Agente' }],
        permissions: [],
        source: 'fallback',
      };

      console.log('⚠️ Using fallback user data');

      return new Response(JSON.stringify(fallbackUser), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Load roles separately using user_roles table
    // IMPORTANTE: usar profile.id (de tabla users), NO user.id (auth_user_id)
    const { data: userRolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id, active')
      .eq('user_id', profile.id)
      .eq('active', true);

    let roles: any[] = [];

    if (!rolesError && userRolesData && userRolesData.length > 0) {
      // Get role details
      const roleIds = userRolesData.map((ur: any) => ur.role_id);
      const { data: rolesData } = await supabase
        .from('roles')
        .select('id, name, display_name, description')
        .in('id', roleIds);

      roles = rolesData || [];
    } else {
      console.log('⚠️ No roles found for user, using email-based detection');

      // Fallback: detect role from email
      const email = user.email.toLowerCase();
      let roleName = 'agent';
      let displayName = 'Agente';

      if (email.includes('admin')) {
        roleName = 'admin';
        displayName = 'Administrador';
      } else if (email.includes('manager')) {
        roleName = 'manager';
        displayName = 'Manager';
      } else if (email.includes('account')) {
        roleName = 'accountant';
        displayName = 'Contador';
      }

      roles = [{
        id: 'auto-detected',
        name: roleName,
        display_name: displayName,
        description: 'Auto-detected from email'
      }];
    }

    // Load permissions (if you have a permissions table)
    // For now, we'll use role-based permissions only
    const permissions: string[] = [];

    // Load team info if team_id exists
    let team = null;
    if (profile.team_id) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name, country_code')
        .eq('id', profile.team_id)
        .single();
      team = teamData;
    }

    // Build user response with nested user object (formato que espera App.js)
    const userResponse = {
      user: {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email.split('@')[0],
        first_name: profile.first_name,
        last_name: profile.last_name,
        position: profile.position,
        phone: profile.phone,
        country_code: profile.country_code || 'DOM',
        country: profile.country || 'República Dominicana',
        team_id: profile.team_id,
        team: team,
        profile_photo_url: profile.profile_photo_url,
        active: profile.active,
        created_at: profile.created_at,
      },
      roles,
      permissions,
      lastUpdated: new Date().toISOString(),
      source: 'edge_function',
    };

    console.log('✅ User permissions loaded:', {
      email: userResponse.user.email,
      roles: userResponse.roles.map((r: any) => r.name),
      country: userResponse.user.country_code,
    });

    return new Response(JSON.stringify(userResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error in get-user-permissions:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
