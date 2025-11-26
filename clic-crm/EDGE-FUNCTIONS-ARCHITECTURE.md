# Arquitectura de Edge Functions - CRM v2.0

## 📋 Edge Functions Disponibles

### ✅ Confirmadas en Supabase (2025-10-25)

```
get-user-permissions   | Version 26 | Login y autenticación
crm-manager           | Version 2  | CRUD de datos del CRM
```

---

## 🎯 Por Qué Están Separadas

### 1. **`get-user-permissions`** - Autenticación y Perfil

**Propósito:** Cargar perfil de usuario, roles y permisos después del login

**Cuándo se llama:**
- Inmediatamente después del login
- Al recargar la página (si hay sesión activa)
- Para actualizar permisos del usuario

**Qué retorna:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": [
    {
      "id": "role-uuid",
      "name": "admin",
      "display_name": "Administrador"
    }
  ],
  "country_code": "DOM",
  "team_id": "team-uuid",
  "scope": "country"
}
```

**Código actual (LoginPage.js):**
```javascript
// 1. Login con Supabase Auth
const { data: authData } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 2. Obtener permisos
const { data: userData } = await supabase.functions.invoke('get-user-permissions');
```

---

### 2. **`crm-manager`** - CRUD de Datos

**Propósito:** Manejar TODAS las operaciones de datos del CRM con permisos

**Módulos que maneja:**
- Properties (propiedades)
- Contacts (contactos)
- Deals (ventas)
- Content (contenido)
- Users (usuarios)
- Config (configuración)

**Qué hace:**
- ✅ Verifica permisos del usuario
- ✅ Filtra datos según scope (own/team/country/all)
- ✅ Auto-inyecta context (country_code, created_by, team_id)
- ✅ Ejecuta CRUD operations

**Ejemplo de uso:**
```javascript
// Listar propiedades (filtradas automáticamente por rol)
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: {
      status: 'active'
    },
    pagination: {
      page: 1,
      limit: 30
    }
  }
});
```

---

## 🔄 Flujo Completo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                    1. USUARIO HACE LOGIN                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              supabase.auth.signInWithPassword()             │
│         (Autenticación nativa de Supabase)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│        2. LLAMAR get-user-permissions (Edge Function)       │
│                                                              │
│  • Verifica JWT                                             │
│  • Carga profile desde tabla profiles                      │
│  • Carga roles desde user_roles + roles                    │
│  • Carga team (si aplica)                                  │
│  • Calcula scope (own/team/country/all)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           3. FRONTEND GUARDA DATOS EN CONTEXTO              │
│                                                              │
│  const user = {                                             │
│    id, email, name, roles,                                 │
│    country_code, team_id, scope                            │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          4. USUARIO NAVEGA Y USA EL CRM                     │
│                                                              │
│  Cada operación llama a crm-manager:                       │
│  • List properties → crm-manager                           │
│  • Create contact → crm-manager                            │
│  • Update deal → crm-manager                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Diferencias Clave

| Aspecto | get-user-permissions | crm-manager |
|---------|---------------------|-------------|
| **Cuándo** | Al login / reload | Durante uso del CRM |
| **Frecuencia** | 1 vez al iniciar sesión | Múltiples veces |
| **Propósito** | Autenticar + cargar perfil | Operar datos |
| **Entrada** | JWT token | JWT + module + action + params |
| **Salida** | User object con roles | Data filtrada por permisos |
| **Modifica datos** | ❌ No | ✅ Sí (CRUD) |

---

## 🛠️ Verificar Que Funcionan

### Test 1: get-user-permissions

```javascript
// En la consola del navegador después del login
const { data, error } = await supabase.functions.invoke('get-user-permissions');
console.log(data);
```

**Resultado esperado:**
```json
{
  "id": "...",
  "email": "...",
  "roles": [...],
  "country_code": "DOM",
  "source": "edge_function"
}
```

### Test 2: crm-manager

```javascript
// En la consola del navegador (después de login)
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: {},
    pagination: { page: 1, limit: 10 }
  }
});
console.log(data);
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

## 🐛 Troubleshooting

### "Function not found"

**Solución:** Re-deploy
```bash
cd "c:\Users\Rene Castillo\clic-crm"

# Deploy get-user-permissions
supabase functions deploy get-user-permissions

# Deploy crm-manager
supabase functions deploy crm-manager
```

### "Functions desaparecen del dashboard"

**Posible causa:** Problema de visualización en Supabase Dashboard

**Solución:**
1. Verifica con CLI: `supabase functions list`
2. Si aparecen en CLI pero no en dashboard, el problema es visual
3. Las funciones están activas aunque no las veas en UI

### "Permission denied"

**Causa:** El usuario no tiene roles asignados

**Solución:**
1. Verifica tabla `user_roles`
2. O usa el fallback de email (admin@, manager@, etc.)

---

## 📁 Estructura de Archivos

```
supabase/functions/
├── get-user-permissions/
│   ├── index.ts         ← Maneja autenticación
│   └── cors.ts
│
└── crm-manager/
    ├── index.ts         ← Router principal
    ├── cors.ts
    ├── middleware/
    │   ├── auth.ts      ← Verifica JWT, carga user context
    │   └── permissions.ts ← Verifica permisos
    ├── handlers/
    │   ├── properties.ts  ← CRUD propiedades
    │   ├── contacts.ts    ← CRUD contactos
    │   ├── deals.ts       ← CRUD ventas
    │   ├── content.ts     ← CRUD contenido
    │   ├── users.ts       ← CRUD usuarios
    │   └── config.ts      ← CRUD configuración
    └── utils/
        ├── query-builder.ts ← Filters por scope
        └── response.ts      ← Response helpers
```

---

## 🎯 Próximos Pasos

Ahora que ambas funciones están confirmadas:

1. **Probar login completo**
   - Login → get-user-permissions → Dashboard

2. **Implementar Sprint 2: Propiedades**
   - Usar crm-manager para listar propiedades
   - Crear/editar/eliminar con permisos

3. **Implementar Sprint 3-7**
   - Contactos, Deals, Content, Users, Config
   - Todos usan crm-manager

---

**Fecha:** 2025-10-25
**Status:** ✅ Ambas funciones confirmadas y activas
**Versiones:** get-user-permissions v26, crm-manager v2
