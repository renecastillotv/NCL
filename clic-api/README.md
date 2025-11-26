# CLIC CRM API

API multitenant para CRM inmobiliario. Diseñada para escalar a 500+ inmobiliarias.

## Stack Tecnológico

- **Framework**: [Hono](https://hono.dev/) - Web framework ultrarrápido
- **Database**: [Neon](https://neon.tech/) - PostgreSQL serverless
- **ORM**: [Drizzle](https://orm.drizzle.team/) - TypeScript ORM
- **Auth**: [Clerk](https://clerk.com/) - Autenticación con Organizations
- **Hosting**: Vercel (migrable a AWS App Runner)
- **Validation**: [Zod](https://zod.dev/)

## Arquitectura Multitenant

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIC CRM API                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Request → Tenant Middleware → Auth Middleware → Handler    │
│              ↓                      ↓                       │
│         X-Tenant-ID            JWT Token                    │
│         Subdomain              Clerk Verify                 │
│         Clerk Org ID           Load User                    │
│              ↓                      ↓                       │
│         Load Tenant            Check Permissions            │
│         Check Plan             Apply Data Scope             │
│              ↓                      ↓                       │
│         c.set('tenant')        c.set('user')                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Resolution Strategies

1. **Header**: `X-Tenant-ID: {tenant_id_or_slug}`
2. **Clerk Organization**: Automático desde JWT
3. **Subdomain**: `inmobiliaria.clicinmobiliaria.com`
4. **Path**: `/t/{tenant_slug}/...`

### Data Isolation

Todas las tablas incluyen `tenant_id` con índices optimizados:

```sql
-- Ejemplo de índice compuesto
CREATE INDEX properties_tenant_status_idx
ON properties(tenant_id, status);
```

## Estructura del Proyecto

```
clic-api/
├── api/
│   └── index.ts          # Vercel entry point
├── src/
│   ├── db/
│   │   ├── schema/       # Drizzle schemas
│   │   │   ├── tenants.ts
│   │   │   ├── users.ts
│   │   │   ├── properties.ts
│   │   │   ├── contacts.ts
│   │   │   └── deals.ts
│   │   └── index.ts      # DB connection
│   ├── middleware/
│   │   ├── tenant.ts     # Tenant resolution
│   │   └── auth.ts       # Authentication
│   ├── modules/
│   │   ├── properties/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── users/
│   │   └── tenants/
│   ├── lib/
│   │   ├── errors.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   └── index.ts          # App entry
├── drizzle/              # Migrations
├── package.json
├── tsconfig.json
└── vercel.json
```

## Endpoints API

### Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.clicinmobiliaria.com/api/v1`

### Autenticación

Todas las rutas requieren:
- **Header**: `Authorization: Bearer {clerk_jwt_token}`
- **Header**: `X-Tenant-ID: {tenant_slug}` (opcional si usa Clerk Organizations)

### Módulos

#### Properties
```
GET    /properties          # Listar propiedades
GET    /properties/:id      # Obtener propiedad
POST   /properties          # Crear propiedad
PATCH  /properties/:id      # Actualizar propiedad
DELETE /properties/:id      # Archivar propiedad
GET    /properties/stats/summary  # Estadísticas
```

#### Contacts
```
GET    /contacts            # Listar contactos
GET    /contacts/:id        # Obtener contacto con actividades
POST   /contacts            # Crear contacto
PATCH  /contacts/:id        # Actualizar contacto
DELETE /contacts/:id        # Archivar contacto
POST   /contacts/:id/activities  # Agregar actividad
GET    /contacts/stats/summary   # Estadísticas
```

#### Deals
```
GET    /deals               # Listar negocios
GET    /deals/:id           # Obtener negocio con historial
POST   /deals               # Crear negocio
PATCH  /deals/:id           # Actualizar negocio
DELETE /deals/:id           # Eliminar negocio
GET    /deals/stats/summary # Estadísticas
GET    /deals/pipelines     # Obtener pipelines con stages
```

#### Users
```
GET    /users               # Listar usuarios (admin)
GET    /users/me            # Obtener usuario actual
GET    /users/:id           # Obtener usuario
POST   /users/invite        # Invitar usuario
PATCH  /users/:id           # Actualizar usuario
DELETE /users/:id           # Desactivar usuario
GET    /users/teams         # Listar equipos
POST   /users/teams         # Crear equipo
```

#### Tenants
```
GET    /tenants/current     # Obtener tenant actual
PATCH  /tenants/current     # Actualizar tenant
PATCH  /tenants/current/settings  # Actualizar settings
GET    /tenants/current/domains   # Listar dominios
POST   /tenants/current/domains   # Agregar dominio
POST   /tenants/onboard     # Crear nuevo tenant (signup)
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 30,
    "pages": 4,
    "hasMore": true,
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "status": 400,
    "details": { ... }
  }
}
```

## Permisos (RBAC)

### Roles

| Rol | Descripción |
|-----|-------------|
| `owner` | Dueño de la inmobiliaria (1 por tenant) |
| `admin` | Administrador con acceso total |
| `manager` | Gerente de equipo |
| `agent` | Asesor inmobiliario |
| `assistant` | Asistente administrativo |
| `accountant` | Solo acceso financiero |
| `viewer` | Solo lectura |

### Scopes

- `own`: Solo recursos propios
- `team`: Recursos del equipo
- `all`: Todos los recursos del tenant

## Planes y Límites

| Plan | Usuarios | Propiedades | Features |
|------|----------|-------------|----------|
| `free` | 3 | 50 | Básico |
| `starter` | 5 | 200 | + Deals, Analytics |
| `professional` | 20 | 1,000 | + Marketing, API, Reports |
| `enterprise` | ∞ | ∞ | + White-label, AI |

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar migraciones
npm run db:generate

# Aplicar migraciones
npm run db:push

# Iniciar servidor de desarrollo
npm run dev
```

## Despliegue

### Vercel (Actual)

```bash
vercel deploy
```

### AWS App Runner (Futuro)

El proyecto está preparado para migrar a AWS App Runner:

1. Crear Dockerfile
2. Configurar App Runner con la imagen
3. Configurar variables de entorno
4. Actualizar DNS

## Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# API
PORT=3001
NODE_ENV=development
```

## Migración desde Supabase

Para migrar los datos existentes de Supabase:

1. Exportar datos de Supabase
2. Transformar al nuevo esquema
3. Importar a Neon
4. Migrar usuarios a Clerk
5. Actualizar frontends

## Licencia

Propietario - CLIC Inmobiliaria
