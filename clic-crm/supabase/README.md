# Supabase Edge Functions - CLIC CRM

## 📁 Estructura Actual

```
supabase/
├── config.toml                          # Configuración del proyecto Supabase
├── .gitignore                           # Ignora archivos temporales
├── functions/
│   ├── _shared/
│   │   └── cors.ts                      # CORS compartido
│   ├── crm-manager/                     # ✅ Edge Function Principal
│   │   ├── index.ts                     # Entry point
│   │   ├── middleware/
│   │   │   ├── auth.ts                  # Autenticación JWT
│   │   │   └── permissions.ts           # Control de permisos
│   │   ├── handlers/
│   │   │   ├── properties.ts            # CRUD Propiedades
│   │   │   ├── contacts.ts              # CRUD Contactos
│   │   │   ├── deals.ts                 # CRUD Ventas
│   │   │   ├── content.ts               # CRUD Contenido
│   │   │   ├── users.ts                 # Gestión Usuarios
│   │   │   └── config.ts                # Configuraciones
│   │   └── utils/
│   │       ├── query-builder.ts         # Constructor de queries
│   │       └── response.ts              # Formato de respuestas
│   └── get-user-permissions/            # ✅ Enriquecimiento de sesión
│       └── index.ts
```

## ✅ Verificación de Archivos

Todos los archivos necesarios están presentes:
- ✅ `config.toml` - Configuración del proyecto
- ✅ `functions/_shared/cors.ts` - CORS headers
- ✅ `functions/crm-manager/` - Edge function principal (15 archivos)
- ✅ `functions/get-user-permissions/` - Edge function de sesión

## 🚀 Deployment

### 1. Prerequisitos

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
supabase --version
```

### 2. Login a Supabase

```bash
supabase login
```

### 3. Link al Proyecto

```bash
cd "c:\Users\Rene Castillo\clic-crm"
supabase link --project-ref pacewqgypevfgjmdsorz
```

### 4. Configurar Secrets

Ve a: **Supabase Dashboard > Edge Functions > Secrets**

Agrega estas variables:

```
SUPABASE_URL=https://pacewqgypevfgjmdsorz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu-service-role-key
```

**⚠️ IMPORTANTE:** Obtén tu service role key de:
`Supabase Dashboard > Settings > API > Service Role Key (secret)`

### 5. Deploy Edge Functions

```bash
# Deploy todas las funciones
supabase functions deploy

# O deploy individual
supabase functions deploy crm-manager
supabase functions deploy get-user-permissions
```

### 6. Verificar Deployment

```bash
# Ver logs en tiempo real
supabase functions logs crm-manager --follow
supabase functions logs get-user-permissions --follow
```

## 🧪 Testing

### Obtener Token de Prueba

Desde el navegador o Postman:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'tu-usuario@ejemplo.com',
  password: 'tu-password'
});

console.log('Token:', data.session.access_token);
```

### Test con cURL

```bash
# Set token
TOKEN="tu-jwt-token-aqui"

# Test get-user-permissions
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/get-user-permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test crm-manager - list properties
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/crm-manager \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "properties",
    "action": "list",
    "params": {"status": "active"},
    "pagination": {"page": 1, "limit": 10}
  }'
```

### Test desde Frontend

```javascript
// Test get-user-permissions
const { data: user, error: userError } = await supabase.functions.invoke('get-user-permissions');
console.log('User:', user);

// Test crm-manager
const { data: properties, error: propError } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: { status: 'active' }
  }
});
console.log('Properties:', properties);
```

## 📊 Endpoints Disponibles

### 1. get-user-permissions

**URL:** `POST /functions/v1/get-user-permissions`

**Descripción:** Carga roles y permisos del usuario después del login

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Juan Pérez",
  "roles": [{"id": "uuid", "name": "agent", "display_name": "Agente"}],
  "country_code": "DOM",
  "team_id": "uuid",
  "source": "edge_function"
}
```

### 2. crm-manager

**URL:** `POST /functions/v1/crm-manager`

**Request:**
```json
{
  "module": "properties|contacts|deals|content|users|config",
  "action": "list|get|create|update|delete|...",
  "params": {},
  "pagination": {"page": 1, "limit": 30}
}
```

**Response:**
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 30,
    "scope": "team",
    "filters_applied": {}
  }
}
```

**Módulos soportados:**
- ✅ `properties` - Propiedades (CRUD completo)
- ✅ `contacts` - Contactos/Leads
- ✅ `deals` - Ventas y estadísticas
- ✅ `content` - Articles, videos, testimonials, FAQs
- ✅ `users` - Gestión de usuarios
- ✅ `config` - Tags, categories, cities, sectors

## 🔒 Seguridad

### Variables de Entorno

**NUNCA** commits estos valores:
- ❌ Service Role Key
- ❌ Database passwords
- ❌ API keys privadas

**Solo en Dashboard de Supabase** > Edge Functions > Secrets

### CORS

CORS está configurado para aceptar todas las origins (`*`). En producción, puedes restringirlo editando `_shared/cors.ts`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tu-dominio.com',
  // ...
};
```

## 📝 Logs y Monitoreo

### Ver Logs

```bash
# Logs de una función específica
supabase functions logs crm-manager

# Logs en tiempo real (follow)
supabase functions logs crm-manager --follow

# Últimas 100 líneas
supabase functions logs crm-manager -n 100
```

### Dashboard de Supabase

Monitorea en: **Supabase Dashboard > Edge Functions > [Función] > Logs & Metrics**

## 🐛 Troubleshooting

### Error: "Module not found"

**Solución:** Verifica que todos los archivos estén en `supabase/functions/` y los imports usen rutas relativas correctas.

### Error: "Service role key not found"

**Solución:** Configura los secrets en Supabase Dashboard > Edge Functions > Secrets

### Error: "CORS error"

**Solución:** Verifica que `corsHeaders` se devuelvan en todas las respuestas, incluyendo errores.

### Error: "Profile not found"

**Solución:** Asegúrate de que el usuario tenga un registro en la tabla `profiles`.

## 📚 Documentación Adicional

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- Ver `src/services/api.js` para ejemplos de uso desde el frontend

## 🎯 Próximos Pasos

Después del deployment:

1. ✅ Verificar que ambas funciones respondan correctamente
2. ✅ Probar con diferentes roles de usuario
3. ✅ Actualizar componentes del frontend para usar `api.properties.list()` etc.
4. ✅ Migrar credenciales hardcoded a variables de entorno
5. ✅ Configurar monitoring y alertas

## 💡 Tips

- **Deploy frecuente**: Haz deploy después de cada cambio para detectar errores temprano
- **Logs**: Siempre revisa los logs después del deploy
- **Testing**: Prueba cada endpoint con diferentes roles antes de pasar a producción
- **Rollback**: Si algo falla, simplemente redeploy la versión anterior del código

---

**Última Actualización:** 2025-10-25
**Status:** ✅ Listo para deployment
