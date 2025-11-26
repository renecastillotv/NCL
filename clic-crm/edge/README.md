# CLIC CRM - Edge Functions Documentation

## Overview

This folder contains Supabase Edge Functions for the CLIC CRM system. These functions provide a secure, role-based API layer that handles authentication, authorization, and data filtering automatically.

## Architecture

### Main Edge Function: `crm-manager`

A unified endpoint that handles all CRM operations through module-based routing. This eliminates the need for multiple edge functions and centralizes authentication/authorization logic.

**Benefits:**
- ✅ Single endpoint for all operations
- ✅ Automatic country/team/role filtering
- ✅ No permission logic needed in frontend
- ✅ Multi-franchise support built-in
- ✅ Consistent API responses

## Edge Functions

### 1. `crm-manager` - Main CRM API

**Endpoint:** `POST /functions/v1/crm-manager`

**Request Format:**
```javascript
{
  "module": "properties" | "contacts" | "deals" | "content" | "users" | "config",
  "action": "list" | "get" | "create" | "update" | "delete" | "export" | "bulk_create",
  "params": { /* action-specific parameters */ },
  "pagination": {
    "page": 1,
    "limit": 30
  } // Optional
}
```

**Response Format:**
```javascript
{
  "success": true,
  "data": [ /* results */ ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 30,
    "pages": 5,
    "scope": "team", // User's data scope
    "filters_applied": { /* auto-applied filters */ },
    "timestamp": "2025-10-25T10:30:00.000Z"
  }
}
```

### 2. `get-user-permissions` - User Session Enrichment

**Endpoint:** `POST /functions/v1/get-user-permissions`

Called after login to load user roles, permissions, and profile data.

**Response:**
```javascript
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": [
    {
      "id": "uuid",
      "name": "agent",
      "display_name": "Agente"
    }
  ],
  "permissions": [],
  "country_code": "DOM",
  "team_id": "uuid",
  "profile_photo_url": "https://...",
  "source": "edge_function"
}
```

## Module Handlers

### Properties Module

**Actions:**
- `list` - List properties with filters
- `get` - Get single property by ID
- `create` - Create new property
- `update` - Update property
- `delete` - Delete property
- `bulk_create` - Create multiple properties
- `export` - Export properties to CSV

**Example - List Properties:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: {
      status: 'active',
      category_id: 'uuid',
      min_price: 100000,
      max_price: 500000,
      search: 'apartamento'
    },
    pagination: { page: 1, limit: 30 }
  }
});

// Response includes properties filtered by user's scope:
// - Agent: only their properties
// - Manager: team properties
// - Admin: all properties in their country
// - Super Admin: all properties
```

**Example - Create Property:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'create',
    params: {
      title: 'Apartamento en Piantini',
      operation_type: 'sale',
      category_id: 'uuid',
      price: 250000,
      currency: 'USD',
      bedrooms: 3,
      bathrooms: 2,
      area_m2: 120,
      // country_code is AUTO-ASSIGNED from user
      // created_by is AUTO-ASSIGNED from user
      // team_id is AUTO-ASSIGNED from user
      features: [
        { feature_type: 'amenity', feature_value: 'Pool' },
        { feature_type: 'amenity', feature_value: 'Gym' }
      ],
      tags: ['tag-uuid-1', 'tag-uuid-2']
    }
  }
});

// Property is automatically tagged with user's country
// No need to specify country_code, created_by, or team_id
```

### Contacts Module

**Actions:** `list`, `get`, `create`, `update`, `delete`, `export`

**Example - List Contacts:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'contacts',
    action: 'list',
    params: {
      status: 'active',
      type_id: 'lead-type-uuid',
      search: 'john'
    },
    pagination: { page: 1, limit: 30 }
  }
});
```

**Example - Create Contact:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'contacts',
    action: 'create',
    params: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-809-555-1234',
      type_id: 'lead-type-uuid',
      source: 'website'
      // assigned_to defaults to current user
      // country_code auto-assigned
    }
  }
});
```

### Deals Module

**Actions:** `list`, `get`, `create`, `update`, `delete`, `stats`, `export`

**Example - List Deals (Role-based):**
```javascript
// If user is AGENT:
// - Sees only their deals

// If user is MANAGER:
// - Sees team deals

// If user is ADMIN:
// - Sees all deals in their country

// If user is SUPER_ADMIN:
// - Sees all deals across all franchises

const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'deals',
    action: 'list',
    params: {
      status_id: 'closed-status-uuid',
      date_from: '2025-01-01',
      date_to: '2025-12-31'
    },
    pagination: { page: 1, limit: 30 }
  }
});
```

**Example - Get Deal Statistics:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'deals',
    action: 'stats',
    params: {}
  }
});

// Returns statistics based on user's scope
// {
//   total_deals: 45,
//   total_amount: 5000000,
//   by_status: { ... },
//   by_agent: { ... },
//   scope: 'team'
// }
```

### Content Module

**Content Types:** `articles`, `videos`, `testimonials`, `faqs`

**Example - List Articles:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'content',
    action: 'list',
    params: {
      content_type: 'articles',
      status: 'published',
      search: 'inversión'
    },
    pagination: { page: 1, limit: 20 }
  }
});
```

**Example - Create Article:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'content',
    action: 'create',
    params: {
      content_type: 'articles',
      title: 'Guía de Inversión Inmobiliaria',
      content: '<p>Contenido del artículo...</p>',
      status: 'draft',
      is_published: false
      // country_code auto-assigned
    }
  }
});
```

### Users Module

**Actions:** `list`, `get`, `create`, `update`, `delete`, `update_roles`

**Example - List Users:**
```javascript
// Only admins can list users
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'users',
    action: 'list',
    params: {
      status: 'active',
      search: 'maria'
    },
    pagination: { page: 1, limit: 50 }
  }
});

// Filtered by user's scope:
// - Admin: users in their country
// - Super Admin: all users
```

**Example - Create User:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'users',
    action: 'create',
    params: {
      email: 'newagent@clic.com',
      password: 'secure-password',
      name: 'Maria Garcia',
      role_ids: ['agent-role-uuid'],
      team_id: 'team-uuid'
      // country_code auto-assigned from admin's country
    }
  }
});
```

### Config Module

**Config Types:** `tags`, `categories`, `cities`, `sectors`, `configurations`

**Example - List Tags:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'config',
    action: 'list',
    params: {
      config_type: 'tags',
      active: true
    }
  }
});
```

**Example - Update Configuration:**
```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'config',
    action: 'update',
    params: {
      config_type: 'configurations',
      key: 'usd_to_dop_rate',
      value: '60.50'
    }
  }
});
```

## Role-Based Access Control

### Roles Hierarchy

| Role | Scope | Can Create | Can Update | Can Delete | Can Export |
|------|-------|------------|------------|------------|------------|
| **super_admin** | All franchises | ✅ | ✅ | ✅ | ✅ |
| **admin** | Country | ✅ | ✅ | ✅ | ✅ |
| **manager** | Team | ✅ | ✅ | ❌ | ✅ |
| **agent** | Own | ✅ | ✅ (own) | ❌ | ❌ |
| **accountant** | Country | ❌ | ❌ | ❌ | ✅ |
| **client** | Own | ❌ | ❌ | ❌ | ❌ |
| **viewer** | All | ❌ | ❌ | ❌ | ❌ |

### Data Scope Filtering

The edge function automatically filters data based on the user's scope:

```javascript
// Agent (scope: 'own')
// SQL: WHERE created_by = user_id AND country_code = 'DOM'

// Manager (scope: 'team')
// SQL: WHERE (team_id = user_team_id OR created_by = user_id) AND country_code = 'DOM'

// Admin (scope: 'country')
// SQL: WHERE country_code = 'DOM'

// Super Admin (scope: 'all')
// SQL: No country filter
```

## Frontend Integration

### Setup Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

### Example: Properties List Component

```javascript
import React, { useState, useEffect } from 'react';

function PropertiesList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  useEffect(() => {
    loadProperties();
  }, [page]);

  const loadProperties = async () => {
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('crm-manager', {
      body: {
        module: 'properties',
        action: 'list',
        params: {
          status: 'active'
        },
        pagination: { page, limit: 30 }
      }
    });

    if (error) {
      console.error('Error:', error);
    } else {
      setProperties(data.data);
      setMeta(data.meta);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Propiedades</h1>
      <p>Mostrando {meta.scope} scope - {meta.total} total</p>

      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}

      <Pagination
        page={meta.page}
        pages={meta.pages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Example: Create Property

```javascript
async function createProperty(propertyData) {
  const { data, error } = await supabase.functions.invoke('crm-manager', {
    body: {
      module: 'properties',
      action: 'create',
      params: propertyData
      // No need to add country_code, created_by, team_id
      // Edge function handles this automatically
    }
  });

  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert('Propiedad creada exitosamente');
    console.log('Created:', data.data);
    console.log('Country assigned:', data.meta.country_assigned);
  }
}
```

## Deployment

### Prerequisites

1. Supabase CLI installed
2. Project linked to Supabase

### Deploy Commands

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy crm-manager
supabase functions deploy get-user-permissions
```

### Environment Variables

Set these in Supabase Dashboard > Edge Functions > Secrets:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing

### Test with curl

```bash
# Get auth token first
TOKEN="your-jwt-token"

# Test get-user-permissions
curl -X POST https://your-project.supabase.co/functions/v1/get-user-permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test crm-manager - list properties
curl -X POST https://your-project.supabase.co/functions/v1/crm-manager \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "properties",
    "action": "list",
    "params": { "status": "active" },
    "pagination": { "page": 1, "limit": 10 }
  }'
```

### Test from Frontend

```javascript
// Login first
const { data: session } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Test edge function
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: {}
  }
});

console.log('Response:', data);
console.log('Your scope:', data.meta.scope);
```

## Error Handling

All edge functions return consistent error format:

```javascript
{
  "success": false,
  "error": {
    "message": "No tienes permisos para esta acción",
    "code": "FORBIDDEN"
  }
}
```

**Error Codes:**
- `401 UNAUTHORIZED` - Invalid or missing token
- `403 FORBIDDEN` - Insufficient permissions
- `404 NOT_FOUND` - Resource not found
- `400 BAD_REQUEST` - Invalid parameters
- `500 ERROR` - Server error

## Security Features

✅ **JWT Authentication** - All requests require valid JWT token
✅ **Role-Based Access Control** - Permissions checked on every request
✅ **Automatic Data Scoping** - Users only see data they're allowed to
✅ **Country Isolation** - Multi-franchise support with data separation
✅ **Audit Trail** - created_by and updated_by tracked automatically
✅ **Service Role Key** - Edge functions bypass RLS with secure key

## Performance Tips

1. **Use Pagination** - Always paginate large datasets
2. **Specific Filters** - More filters = faster queries
3. **Limit Fields** - Only request fields you need (TODO: implement field selection)
4. **Cache on Frontend** - Cache frequently accessed data
5. **Batch Operations** - Use `bulk_create` for multiple inserts

## Roadmap

- [ ] Field selection in SELECT queries
- [ ] Real-time subscriptions with scope filtering
- [ ] Audit log table
- [ ] Rate limiting
- [ ] Request caching layer
- [ ] GraphQL endpoint option
- [ ] Webhooks for events

## Support

For issues or questions, contact the development team or check the main project README.

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
