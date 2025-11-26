// Edge Function: crm-manager
// Unified endpoint for all CRM operations with role-based authorization
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser, UserContext } from './middleware/auth.ts';
import { checkPermission } from './middleware/permissions.ts';
import { handleProperties } from './handlers/properties.ts';
import { handleContacts } from './handlers/contacts.ts';
import { handleDeals } from './handlers/deals.ts';
import { handleContent } from './handlers/content.ts';
import { handleUsers } from './handlers/users.ts';
import { handleConfig } from './handlers/config.ts';
import { formatResponse, formatError } from './utils/response.ts';

// Module handlers registry
const moduleHandlers = {
  properties: handleProperties,
  contacts: handleContacts,
  deals: handleDeals,
  content: handleContent,
  users: handleUsers,
  config: handleConfig,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { module, action, params = {}, pagination } = await req.json();

    // Validate required fields
    if (!module || !action) {
      return formatError('Module and action are required', 400);
    }

    // Authenticate user and build context
    const context = await authenticateUser(req);

    console.log('🔐 Request:', {
      module,
      action,
      user: context.userId,
      role: context.roles[0]?.name,
      country: context.country_code,
      scope: context.scope,
    });

    // Check if user has permission for this module/action
    const hasPermission = checkPermission(context, module, action);
    if (!hasPermission) {
      return formatError(
        `No tienes permisos para ${action} en ${module}`,
        403
      );
    }

    // Get the appropriate handler
    const handler = moduleHandlers[module];
    if (!handler) {
      return formatError(`Module '${module}' not found`, 404);
    }

    // Execute handler with context
    const result = await handler(action, params, context, pagination);

    // Return formatted response
    return formatResponse(result, context);
  } catch (error) {
    console.error('❌ Error in crm-manager:', error);
    return formatError(error.message, error.status || 500);
  }
});
