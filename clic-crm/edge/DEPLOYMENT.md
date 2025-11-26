# Edge Functions Deployment Guide

## Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Supabase Account** with a project created

3. **Git** for version control

## Step 1: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 2: Link Your Project

```bash
cd "c:\Users\Rene Castillo\clic-crm"
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase Dashboard > Settings > General > Reference ID

## Step 3: Set Environment Variables

Go to Supabase Dashboard > Edge Functions > Secrets and add:

```
SUPABASE_URL=https://pacewqgypevfgjmdsorz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ IMPORTANT:** Never commit the service role key to Git!

Get your service role key from:
Supabase Dashboard > Settings > API > Service Role Key (secret)

## Step 4: Deploy Edge Functions

### Deploy All Functions

```bash
supabase functions deploy
```

### Deploy Specific Function

```bash
# Deploy crm-manager
supabase functions deploy crm-manager

# Deploy get-user-permissions
supabase functions deploy get-user-permissions
```

## Step 5: Test Deployment

### Get a Test Token

```javascript
// In browser console or Postman
const { data } = await supabase.auth.signInWithPassword({
  email: 'your-test-user@example.com',
  password: 'your-password'
});

console.log('Token:', data.session.access_token);
```

### Test with curl

```bash
TOKEN="your-jwt-token"

# Test get-user-permissions
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/get-user-permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test crm-manager
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/crm-manager \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "properties",
    "action": "list",
    "params": {},
    "pagination": {"page": 1, "limit": 10}
  }'
```

## Step 6: Update Frontend

### Option A: Update Existing Components

Replace direct Supabase queries with edge function calls.

**Before:**
```javascript
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'active');
```

**After:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: { status: 'active' }
  }
});

const properties = data.data; // Note: data is nested
```

### Option B: Create API Service Layer

Create `src/services/api.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const api = {
  // Properties
  properties: {
    list: async (params = {}, pagination) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'properties',
          action: 'list',
          params,
          pagination
        }
      });
      return { data: data?.data, meta: data?.meta, error };
    },

    get: async (id) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'properties',
          action: 'get',
          params: { id }
        }
      });
      return { data: data?.data, error };
    },

    create: async (propertyData) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'properties',
          action: 'create',
          params: propertyData
        }
      });
      return { data: data?.data, error };
    },

    update: async (id, updates) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'properties',
          action: 'update',
          params: { id, data: updates }
        }
      });
      return { data: data?.data, error };
    },

    delete: async (id) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'properties',
          action: 'delete',
          params: { id }
        }
      });
      return { data: data?.data, error };
    }
  },

  // Contacts
  contacts: {
    list: async (params = {}, pagination) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'contacts',
          action: 'list',
          params,
          pagination
        }
      });
      return { data: data?.data, meta: data?.meta, error };
    },
    // ... similar methods
  },

  // Deals
  deals: {
    list: async (params = {}, pagination) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'deals',
          action: 'list',
          params,
          pagination
        }
      });
      return { data: data?.data, meta: data?.meta, error };
    },

    stats: async (params = {}) => {
      const { data, error } = await supabase.functions.invoke('crm-manager', {
        body: {
          module: 'deals',
          action: 'stats',
          params
        }
      });
      return { data: data?.data, error };
    },
    // ... similar methods
  }
};
```

Then use in components:

```javascript
import { api } from '../services/api';

// In component
const loadProperties = async () => {
  const { data, meta, error } = await api.properties.list(
    { status: 'active' },
    { page: 1, limit: 30 }
  );

  if (error) {
    console.error('Error:', error);
  } else {
    setProperties(data);
    setMeta(meta);
  }
};
```

## Step 7: Database Setup

### Required Tables

Ensure these tables exist in your Supabase database:

1. **profiles** - User profiles
   - id (uuid, primary key)
   - email (text)
   - name (text)
   - country_code (text)
   - team_id (uuid)
   - profile_photo_url (text)
   - created_at (timestamp)

2. **roles** - User roles
   - id (uuid, primary key)
   - name (text) - e.g., 'super_admin', 'admin', 'agent'
   - display_name (text)

3. **user_roles** - User-Role junction table
   - user_id (uuid, fk to profiles)
   - role_id (uuid, fk to roles)

4. **properties, contacts, deals, etc.** - Your existing tables

### Row Level Security (RLS)

**IMPORTANT:** Since edge functions use the service role key, they bypass RLS. The edge function handles all security.

You can disable RLS on tables accessed by edge functions:

```sql
-- Disable RLS (edge function handles security)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
```

Or keep RLS enabled for direct client access but configure policies:

```sql
-- Allow authenticated users to read (edge function bypasses this)
CREATE POLICY "Enable read for authenticated users"
ON properties FOR SELECT
TO authenticated
USING (true);
```

## Step 8: Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs crm-manager --follow

# Specific function
supabase functions logs get-user-permissions
```

### Supabase Dashboard

Monitor edge function performance in:
Supabase Dashboard > Edge Functions > [Function Name] > Logs & Metrics

## Troubleshooting

### Error: "Module not found"

Make sure all imported files exist:
- `_shared/cors.ts`
- All handler files
- All middleware files

### Error: "Service role key not found"

Set environment variables in Supabase Dashboard > Edge Functions > Secrets

### Error: "CORS error"

Check that CORS headers are returned in all responses, including errors.

### Error: "Profile not found"

Ensure user has a profile in the `profiles` table. The edge function falls back to creating a basic user object.

### Error: "No authorization header"

Make sure the JWT token is being sent:
```javascript
// Supabase client automatically sends token
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: { /* ... */ }
});
```

## Rollback

If something goes wrong, you can rollback to a previous version:

```bash
# List deployments
supabase functions list

# Rollback to specific version (if supported)
# Or simply redeploy previous code
git checkout previous-commit
supabase functions deploy
```

## Production Checklist

- [ ] Environment variables set in Supabase
- [ ] Service role key secured (not in code)
- [ ] Edge functions deployed successfully
- [ ] Frontend updated to use edge functions
- [ ] Test all major operations (create, read, update, delete)
- [ ] Test with different user roles
- [ ] Test pagination
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Document any custom configurations

## Next Steps

1. Gradually migrate components to use edge functions
2. Remove hardcoded Supabase keys from frontend
3. Set up proper environment variables
4. Implement error tracking
5. Add audit logging
6. Set up monitoring alerts

## Support

For issues, check:
1. Edge function logs in Supabase Dashboard
2. Browser console for frontend errors
3. README.md for API documentation
