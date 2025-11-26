// Edge Function: get-user-permissions
// Returns user profile with roles and permissions after login
// Called by App.js on every login to enrich user session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

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

    // Load user profile with roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(
          roles(
            id,
            name,
            display_name,
            description
          )
        ),
        teams(
          id,
          name,
          country_code
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);

      // Fallback: create basic user object from auth
      const fallbackUser = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        roles: [{ id: 'fallback', name: 'agent', display_name: 'Agente' }],
        permissions: [],
        country_code: 'DOM',
        country: 'República Dominicana',
        source: 'fallback',
      };

      console.log('⚠️ Using fallback user data');

      return new Response(JSON.stringify(fallbackUser), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract roles from junction table
    const roles = profile.user_roles?.map((ur: any) => ur.roles) || [];

    // Load permissions (if you have a permissions table)
    // For now, we'll use role-based permissions only
    const permissions: string[] = [];

    // Build user response
    const userResponse = {
      id: profile.id,
      email: profile.email,
      name: profile.name || profile.full_name,
      position: profile.position,
      phone: profile.phone,
      roles,
      permissions,
      country_code: profile.country_code || 'DOM',
      country: profile.country || 'República Dominicana',
      team_id: profile.team_id,
      team: profile.teams,
      profile_photo_url: profile.profile_photo_url,
      status: profile.status,
      created_at: profile.created_at,
      lastUpdated: new Date().toISOString(),
      source: 'edge_function',
    };

    console.log('✅ User permissions loaded:', {
      email: userResponse.email,
      roles: userResponse.roles.map(r => r.name),
      country: userResponse.country_code,
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
