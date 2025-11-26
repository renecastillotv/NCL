# 📁 Estructura Edge Functions - CLIC CRM

## ✅ Estructura Verificada y Lista para Deploy

```
clic-crm/
├── supabase/                                    ← Carpeta principal Supabase
│   ├── config.toml                              ✅ Configuración del proyecto
│   ├── .gitignore                               ✅ Ignora archivos temporales
│   ├── README.md                                ✅ Documentación completa
│   │
│   └── functions/                               ← Edge Functions
│       │
│       ├── _shared/                             ← Código compartido
│       │   └── cors.ts                          ✅ CORS headers
│       │
│       ├── crm-manager/                         ✅ FUNCIÓN PRINCIPAL (15 archivos)
│       │   ├── index.ts                         ← Entry point & router
│       │   │
│       │   ├── middleware/                      ← Auth & Permissions
│       │   │   ├── auth.ts                      ✅ JWT + User Context
│       │   │   └── permissions.ts               ✅ Role-based access
│       │   │
│       │   ├── handlers/                        ← Module Handlers
│       │   │   ├── properties.ts                ✅ Properties CRUD
│       │   │   ├── contacts.ts                  ✅ Contacts CRUD
│       │   │   ├── deals.ts                     ✅ Deals CRUD + Stats
│       │   │   ├── content.ts                   ✅ Content CRUD
│       │   │   ├── users.ts                     ✅ User Management
│       │   │   └── config.ts                    ✅ Config & Lookups
│       │   │
│       │   └── utils/                           ← Utilities
│       │       ├── query-builder.ts             ✅ Auto-filtering
│       │       └── response.ts                  ✅ Response format
│       │
│       └── get-user-permissions/                ✅ FUNCIÓN DE SESIÓN (1 archivo)
│           └── index.ts                         ← User permissions loader
│
├── src/services/                                ← Frontend API Layer
│   └── api.js                                   ✅ Clean API wrapper
│
├── .env.example                                 ✅ Environment vars template
├── DEPLOYMENT-CHECKLIST.md                      ✅ Checklist paso a paso
└── ESTRUCTURA-EDGE-FUNCTIONS.md                 ✅ Este archivo
```

## 📊 Resumen de Archivos

| Categoría | Archivos | Status |
|-----------|----------|--------|
| **Configuración** | 3 | ✅ |
| **Edge Functions** | 13 TypeScript | ✅ |
| **Documentación** | 3 Markdown | ✅ |
| **Frontend Service** | 1 JavaScript | ✅ |
| **TOTAL** | 20 archivos | ✅ COMPLETO |

## 🎯 Edge Functions Implementadas

### 1. crm-manager (Función Principal)

**Endpoint:** `POST /functions/v1/crm-manager`

**Módulos:**
- ✅ Properties (con 9+ tablas relacionadas)
- ✅ Contacts
- ✅ Deals (+ estadísticas)
- ✅ Content (articles, videos, testimonials, FAQs)
- ✅ Users (gestión de usuarios)
- ✅ Config (tags, categories, cities, sectors)

**Acciones por módulo:**
- `list` - Listar con filtros y paginación
- `get` - Obtener por ID
- `create` - Crear nuevo
- `update` - Actualizar
- `delete` - Eliminar
- `export` - Exportar a CSV
- `bulk_create` - Crear múltiples (properties)
- `stats` - Estadísticas (deals)
- `update_roles` - Actualizar roles (users)

### 2. get-user-permissions (Enriquecimiento de Sesión)

**Endpoint:** `POST /functions/v1/get-user-permissions`

**Propósito:** Cargar roles, permisos y profile del usuario después del login

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Juan Pérez",
  "roles": [{"name": "agent", "display_name": "Agente"}],
  "country_code": "DOM",
  "team_id": "uuid",
  "source": "edge_function"
}
```

## 🔐 Características de Seguridad

### Autenticación
- ✅ JWT validation en cada request
- ✅ Service role key (bypasses RLS)
- ✅ Token expiration handling
- ✅ Fallback a detección por email

### Autorización
- ✅ 6 roles soportados (super_admin, admin, manager, agent, accountant, client)
- ✅ Permisos a nivel de módulo
- ✅ Permisos a nivel de acción (create, read, update, delete, export, manage)
- ✅ Verificación de ownership en registros

### Filtrado Automático
- ✅ **Agent (scope: own)** - Solo sus registros
- ✅ **Manager (scope: team)** - Registros del equipo
- ✅ **Admin (scope: country)** - Registros del país
- ✅ **Super Admin (scope: all)** - Todos los registros

### Auto-Contexto
- ✅ `created_by` - Auto-inyectado
- ✅ `country_code` - Auto-inyectado
- ✅ `team_id` - Auto-inyectado
- ✅ Timestamps - Auto-inyectados

## 🚀 Comandos de Deployment

```bash
# 1. Login
supabase login

# 2. Link proyecto
supabase link --project-ref pacewqgypevfgjmdsorz

# 3. Configurar secrets (en Dashboard)
SUPABASE_URL=https://pacewqgypevfgjmdsorz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# 4. Deploy
supabase functions deploy

# 5. Verificar logs
supabase functions logs crm-manager --follow
```

## 📝 Documentación

| Archivo | Descripción |
|---------|-------------|
| [supabase/README.md](supabase/README.md) | Documentación completa de deployment |
| [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) | Checklist paso a paso |
| [src/services/api.js](src/services/api.js) | Wrapper para usar desde frontend |
| [.env.example](.env.example) | Template de variables de entorno |

## 🎨 Ejemplo de Uso

### Desde Frontend

```javascript
import { api } from './services/api';

// Listar propiedades (filtrado automático por rol)
const { data, meta, error } = await api.properties.list(
  { status: 'active' },
  { page: 1, limit: 30 }
);

console.log('Propiedades:', data);
console.log('Scope:', meta.scope); // 'own', 'team', 'country', o 'all'

// Crear propiedad (context auto-inyectado)
const { data: newProp, error: createError } = await api.properties.create({
  title: 'Nueva Propiedad',
  price: 250000
  // country_code, created_by, team_id se agregan automáticamente
});

// Estadísticas de ventas (según rol)
const { data: stats } = await api.deals.stats({
  date_from: '2025-01-01',
  date_to: '2025-12-31'
});
```

## ✅ Estado Actual

| Item | Status |
|------|--------|
| Edge functions creadas | ✅ 2/2 |
| Handlers implementados | ✅ 6/6 |
| Middleware configurado | ✅ 2/2 |
| Utilidades creadas | ✅ 2/2 |
| Documentación | ✅ Completa |
| Frontend service layer | ✅ Creado |
| Configuración Supabase | ✅ Lista |
| **READY FOR DEPLOYMENT** | ✅ **SÍ** |

## 🎯 Próximos Pasos

1. ✅ **Estructura verificada** - Todos los archivos en su lugar
2. ⏳ **Deploy a Supabase** - Ejecutar comandos de deployment
3. ⏳ **Testing** - Probar cada endpoint
4. ⏳ **Migrar frontend** - Actualizar componentes gradualmente
5. ⏳ **Production** - Mover a producción

## 💡 Diferencias con la Carpeta Anterior

**Antes:** `edge functions/` (estructura incorrecta)
**Ahora:** `supabase/functions/` (estructura correcta para Supabase CLI)

**Cambios realizados:**
- ✅ Movido todo a `supabase/functions/`
- ✅ Agregado `config.toml` en raíz de `supabase/`
- ✅ Mantenida estructura interna idéntica
- ✅ Imports actualizados correctamente

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar [supabase/README.md](supabase/README.md) para troubleshooting
2. Verificar logs: `supabase functions logs [function-name]`
3. Consultar [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
4. Verificar que secrets estén configurados en Dashboard

---

**Última Actualización:** 2025-10-25
**Status:** ✅ Listo para deployment
**Archivos Verificados:** 20/20 ✅
