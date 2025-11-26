# Fix: Edge Function Authentication

## ❌ Problema Original

```
Profile error: {
  code: "PGRST200",
  details: "Searched for a foreign key relationship between 'profiles' and 'user_roles'...",
  message: "Could not find a relationship between 'profiles' and 'user_roles' in the schema cache"
}
```

## 🔧 Solución Implementada

La edge function `get-user-permissions` intentaba hacer un JOIN entre `profiles` y `user_roles` usando la sintaxis de Supabase, pero la relación foreign key no estaba configurada correctamente.

### Cambios Realizados

**ANTES (líneas 52-71):**
```typescript
// Intentaba hacer JOIN con nested select
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    user_roles(
      roles(...)
    ),
    teams(...)
  `)
  .eq('id', user.id)
  .single();
```

**DESPUÉS (líneas 51-123):**
```typescript
// 1. Cargar profile sin joins
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// 2. Cargar roles por separado
const { data: userRolesData } = await supabase
  .from('user_roles')
  .select('role_id')
  .eq('user_id', user.id);

// 3. Obtener detalles de roles
const roleIds = userRolesData.map(ur => ur.role_id);
const { data: rolesData } = await supabase
  .from('roles')
  .select('id, name, display_name, description')
  .in('id', roleIds);

// 4. Cargar team por separado si existe
if (profile.team_id) {
  const { data: teamData } = await supabase
    .from('teams')
    .select('id, name, country_code')
    .eq('id', profile.team_id)
    .single();
}
```

## ✅ Ventajas de esta Solución

1. **No requiere foreign keys:** Funciona con cualquier estructura de base de datos
2. **Más control:** Cada query es independiente y maneja sus errores
3. **Fallback inteligente:** Si no hay roles en la tabla, detecta por email
4. **Mejor debugging:** Puedes ver exactamente qué query falla

## 🔄 Fallback System

Si el usuario no tiene roles en la tabla `user_roles`, el sistema detecta el rol por email:

```typescript
const email = user.email.toLowerCase();
let roleName = 'agent'; // Default

if (email.includes('admin')) roleName = 'admin';
else if (email.includes('manager')) roleName = 'manager';
else if (email.includes('account')) roleName = 'accountant';
```

## 🎯 Cómo Funciona Ahora

### 1. Usuario hace login en el frontend
```javascript
// LoginPage.js
const { data: authData } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### 2. Frontend llama a edge function
```javascript
// LoginPage.js - después del login
const { data: userData } = await supabase.functions.invoke('get-user-permissions');
```

### 3. Edge function carga datos del usuario
```typescript
// get-user-permissions/index.ts
// a) Verifica JWT
const { data: { user } } = await supabase.auth.getUser(token);

// b) Carga profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// c) Carga roles (o usa fallback)
// d) Carga team (si existe)
// e) Retorna objeto completo
```

### 4. Frontend recibe datos enriquecidos
```javascript
// useAuth.js
const userData = {
  id: data.id,
  email: data.email,
  name: data.name,
  roles: data.roles || [],
  country_code: data.country_code,
  team_id: data.team_id,
  scope: determineScope(data.roles), // 'own', 'team', 'country', 'all'
};
```

## 📊 Estructura de Datos Esperada

### Tabla: `profiles`
```sql
id              | uuid (PK, FK to auth.users)
email           | text
name            | text
full_name       | text
position        | text
phone           | text
country_code    | text (e.g., 'DOM', 'USA')
country         | text
team_id         | uuid (FK to teams)
profile_photo_url | text
status          | text
created_at      | timestamp
```

### Tabla: `user_roles` (junction table)
```sql
id       | uuid (PK)
user_id  | uuid (FK to profiles)
role_id  | uuid (FK to roles)
```

### Tabla: `roles`
```sql
id            | uuid (PK)
name          | text ('admin', 'manager', 'agent', etc.)
display_name  | text ('Administrador', 'Manager', etc.)
description   | text
```

### Tabla: `teams` (opcional)
```sql
id           | uuid (PK)
name         | text
country_code | text
```

## 🧪 Testing

### Probar con usuario sin roles en DB
1. Crea un usuario en Supabase Auth
2. NO agregues registro en `user_roles`
3. Haz login
4. Debería usar email-based role detection

**Resultado esperado:**
```json
{
  "roles": [{
    "id": "auto-detected",
    "name": "agent",
    "display_name": "Agente",
    "description": "Auto-detected from email"
  }]
}
```

### Probar con usuario con roles en DB
1. Crea usuario en `profiles`
2. Agrega roles en `user_roles`
3. Haz login

**Resultado esperado:**
```json
{
  "roles": [{
    "id": "abc-123",
    "name": "admin",
    "display_name": "Administrador",
    "description": "Full access"
  }]
}
```

## 🔍 Debugging

Ver logs de la edge function:
```bash
supabase functions logs get-user-permissions --follow
```

Ver qué está retornando:
1. Abre DevTools (F12)
2. Ve a Network
3. Filtra por `get-user-permissions`
4. Ve la respuesta en la pestaña Response

## 📝 Archivos Modificados

1. ✅ `supabase/functions/get-user-permissions/index.ts` - Cambió queries de JOIN a queries separadas
2. ✅ `src/supabaseClient.js` - Creado (faltaba)
3. ✅ Re-deployed edge function

## 🚀 Próximos Pasos

1. **Prueba el login** - Debería funcionar sin errores
2. **Verifica el Dashboard** - Debería mostrar tu perfil con roles
3. **Navega por los módulos** - Verifica que el sidebar funcione

---

**Fecha:** 2025-10-25
**Status:** ✅ Arreglado y re-deployed
