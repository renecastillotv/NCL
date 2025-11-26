# 🏗️ Arquitectura CRM v2.0 - Con Edge Functions Integradas

## 🎯 Objetivo

Crear un CRM limpio, desacoplado y potente donde:
- ✅ **Frontend** solo pide y muestra
- ✅ **Edge Functions** deciden permisos y filtran data
- ✅ **Sin lógica de negocio en frontend** - Todo en el backend
- ✅ **Diseño visual consistente** - Mantener estilos actuales (naranja #f04e00, Tailwind, Lucide icons)

---

## 📐 Flujo de Construcción

### Fase 1: Login → Dashboard (Base)
1. ✅ Login Page con Supabase Auth
2. ✅ Llamar `get-user-permissions` edge function
3. ✅ Mostrar Dashboard con perfil y roles
4. ✅ Menú lateral con módulos según rol

### Fase 2: Módulos Progresivos
1. ✅ Properties (con permisos view all / edit own)
2. ✅ Contacts
3. ✅ Deals + Stats
4. ✅ Content
5. ✅ Users (solo admin)
6. ✅ Config (solo admin)

---

## 🎨 Diseño Visual (Mantener)

### Colores
- **Primary:** `#f04e00` (Naranja CLIC)
- **Secondary:** `#d94400` (Naranja oscuro)
- **Success:** `#10b981` (Verde)
- **Danger:** `#ef4444` (Rojo)
- **Gray scale:** Tailwind defaults

### Iconos
- **Librería:** Lucide React
- **Estilo:** Line icons, 20-24px
- **Consistencia:** Mismo icono para misma acción en todo el CRM

### Layout
- **Sidebar:** Fijo izquierdo, colapsable en móvil
- **Header:** Sticky top con perfil usuario
- **Content:** Max-width container con padding
- **Cards:** Rounded-lg con shadow-sm

---

## 📁 Nueva Estructura de Archivos

```
src/
├── App.js                        ← Router principal (simple)
├── index.js                      ← Entry point
├── index.css                     ← Tailwind imports
│
├── services/
│   └── api.js                    ✅ Ya existe - wrapper edge functions
│
├── components/
│   │
│   ├── auth/                     ← Autenticación
│   │   ├── LoginPage.js          ← Login con Supabase
│   │   └── ProtectedRoute.js     ← HOC para rutas protegidas
│   │
│   ├── layout/                   ← Layout components
│   │   ├── Layout.js             ← Wrapper principal
│   │   ├── Sidebar.js            ← Navegación lateral (con roles)
│   │   ├── Header.js             ← Top bar con perfil
│   │   └── MobileMenu.js         ← Menú móvil
│   │
│   ├── dashboard/                ← Dashboard
│   │   ├── Dashboard.js          ← Dashboard principal
│   │   ├── StatsCard.js          ← Tarjeta de estadísticas
│   │   ├── ActivityFeed.js       ← Feed de actividad
│   │   └── QuickActions.js       ← Acciones rápidas
│   │
│   ├── properties/               ← Módulo Propiedades
│   │   ├── PropertiesList.js     ← Lista (todos ven según país)
│   │   ├── PropertyCard.js       ← Card individual
│   │   ├── PropertyDetail.js     ← Vista detalle
│   │   ├── PropertyForm.js       ← Create/Edit (solo si tiene permiso)
│   │   └── PropertyActions.js    ← Botones (edit/delete según ownership)
│   │
│   ├── contacts/                 ← Módulo Contactos
│   │   ├── ContactsList.js
│   │   ├── ContactCard.js
│   │   ├── ContactDetail.js
│   │   └── ContactForm.js
│   │
│   ├── deals/                    ← Módulo Ventas
│   │   ├── DealsList.js
│   │   ├── DealCard.js
│   │   ├── DealDetail.js
│   │   ├── DealForm.js
│   │   └── DealStats.js          ← Estadísticas según scope
│   │
│   ├── content/                  ← Módulo Contenido
│   │   ├── ContentTabs.js        ← Tabs: Articles/Videos/FAQs
│   │   ├── ArticlesList.js
│   │   ├── ArticleForm.js
│   │   └── ContentEditor.js      ← WYSIWYG compartido
│   │
│   ├── users/                    ← Módulo Usuarios (admin)
│   │   ├── UsersList.js
│   │   ├── UserCard.js
│   │   └── UserForm.js
│   │
│   ├── config/                   ← Módulo Config (admin)
│   │   ├── ConfigTabs.js         ← Tags/Categories/Cities
│   │   └── ConfigList.js         ← Lista genérica reutilizable
│   │
│   └── ui/                       ← UI Components (reutilizables)
│       ├── Button.js
│       ├── Card.js
│       ├── Badge.js
│       ├── Input.js
│       ├── Select.js
│       ├── Textarea.js
│       ├── Modal.js
│       ├── Table.js
│       ├── Pagination.js
│       ├── SearchBar.js
│       ├── FilterBar.js
│       └── EmptyState.js
│
├── hooks/                        ← Custom Hooks
│   ├── useAuth.js                ← Auth state & permissions
│   ├── useProperties.js          ← Wrapper api.properties
│   ├── useContacts.js            ← Wrapper api.contacts
│   ├── useDeals.js               ← Wrapper api.deals
│   ├── useUsers.js               ← Wrapper api.users
│   └── usePagination.js          ← Paginación reutilizable
│
├── utils/
│   ├── formatters.js             ← Format money, dates, etc
│   ├── validators.js             ← Form validation
│   └── constants.js              ← Constants (roles, statuses)
│
└── configs/
    └── RolesConfig.js            ✅ Mantener - definición de módulos por rol
```

**Total estimado:** ~40 archivos (vs 73 actuales)

---

## 🔐 Modelo de Permisos (Edge Function Driven)

### Regla Fundamental
**Frontend NO decide permisos - Solo pregunta y confía en la respuesta**

### Flujo de Permisos

```javascript
// 1. Frontend pide data
const { data, meta, error } = await api.properties.list({ status: 'active' });

// 2. Edge function filtra automáticamente según:
// - Rol del usuario (agent/manager/admin/super_admin)
// - País del usuario (country_code)
// - Equipo del usuario (team_id)

// 3. Frontend recibe:
// - data: propiedades que PUEDE ver
// - meta.scope: 'own' | 'team' | 'country' | 'all'
// - meta.total: total que puede ver

// 4. Frontend muestra botones según ownership
propiedades.map(prop => (
  <PropertyCard
    property={prop}
    canEdit={prop.created_by === user.id || user.hasRole('manager')}
    canDelete={prop.created_by === user.id}
  />
))
```

### Matriz de Permisos por Módulo

| Módulo | Todos ven | Pueden Editar | Pueden Eliminar |
|--------|-----------|---------------|-----------------|
| **Properties** | Todas del país | Solo propias (o manager puede editar del equipo) | Solo propias |
| **Contacts** | Según scope | Según scope | Solo admin |
| **Deals** | Según scope | Según scope | Solo admin |
| **Content** | Según país | Solo admin/content creators | Solo admin |
| **Users** | Solo admin | Solo admin | Solo super_admin |
| **Config** | Solo admin | Solo admin | Solo super_admin |

### Scopes por Rol

```javascript
// Agent
scope: 'own'  // Solo sus registros

// Manager
scope: 'team' // Registros de su equipo + propios

// Admin
scope: 'country' // Todos los registros de su país

// Super Admin
scope: 'all' // Todos los registros de todas las franquicias
```

---

## 🎬 Fase 1: Login + Dashboard (AHORA)

### Componentes a Crear

#### 1. LoginPage.js
```javascript
- Email/Password input
- Submit → supabase.auth.signInWithPassword()
- Success → call get-user-permissions edge function
- Store user with roles in state/context
- Redirect to /dashboard
```

#### 2. Layout.js
```javascript
- Sidebar (navegación)
- Header (perfil usuario)
- Content area (children)
- Responsive (mobile collapse sidebar)
```

#### 3. Dashboard.js
```javascript
- Welcome section con nombre y rol
- Stats cards (propiedades, contactos, deals)
- Recent activity feed
- Quick actions según rol
```

#### 4. useAuth.js Hook
```javascript
- Login/Logout
- Get current user
- Check permissions
- Get user scope
```

### Diseño de Login

```
┌─────────────────────────────────────────┐
│                                         │
│        🏠 CLIC Inmobiliaria             │
│           Sistema CRM                    │
│                                         │
│   ┌─────────────────────────────┐      │
│   │  Email                      │      │
│   │  [________________]         │      │
│   │                             │      │
│   │  Password                   │      │
│   │  [________________]         │      │
│   │                             │      │
│   │  [  Iniciar Sesión  ]      │      │
│   └─────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

### Diseño de Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR         │  HEADER                              │
│                  │  Bienvenido, Juan Pérez (Agente)    │
│  🏠 Dashboard    ├──────────────────────────────────────│
│  🏘️  Propiedades │                                      │
│  👥 Contactos    │  📊 ESTADÍSTICAS                     │
│  💰 Ventas       │  ┌────────┬────────┬────────┐       │
│  📝 Contenido    │  │   50   │   30   │  $2.5M │       │
│  ⚙️  Config      │  │ Props  │ Leads  │ Ventas │       │
│                  │  └────────┴────────┴────────┘       │
│  👤 Mi Perfil    │                                      │
│  🚪 Salir        │  📋 ACTIVIDAD RECIENTE              │
│                  │  • Nueva propiedad agregada          │
│                  │  • Contacto asignado                 │
└──────────────────┴──────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
- ✅ React 19.1.0
- ✅ Tailwind CSS
- ✅ Lucide React (icons)
- ✅ React Router (navegación)

### Backend
- ✅ Supabase Edge Functions (Deno)
- ✅ PostgreSQL (Supabase)
- ✅ Supabase Auth

### API Layer
- ✅ `src/services/api.js` (wrapper)
- ✅ Custom hooks por módulo

---

## 📝 Orden de Implementación

### Sprint 1: Base (Hoy)
1. ✅ Crear estructura de carpetas
2. ✅ LoginPage.js
3. ✅ useAuth.js hook
4. ✅ Layout.js + Sidebar.js + Header.js
5. ✅ Dashboard.js básico
6. ✅ Probar flujo completo: Login → Dashboard

### Sprint 2: Properties (Próximo)
1. ✅ PropertiesList.js
2. ✅ PropertyCard.js
3. ✅ PropertyDetail.js
4. ✅ PropertyForm.js
5. ✅ Permisos: View all → Edit own → Delete own

### Sprint 3: Contacts
### Sprint 4: Deals + Stats
### Sprint 5: Content
### Sprint 6: Users + Config

---

## 🎨 Guía de Estilos (Mantener)

### Botones
```jsx
// Primary (naranja)
<button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg">

// Secondary (gris)
<button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">

// Outline
<button className="border border-orange-600 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg">
```

### Cards
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
```

### Badges
```jsx
// Status badge
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Activa
</span>
```

---

## 🚀 Empezar AHORA

¿Listo para crear el Sprint 1?

Voy a generar:
1. ✅ Estructura de carpetas limpia
2. ✅ LoginPage.js completo
3. ✅ useAuth.js hook
4. ✅ Layout + Sidebar + Header
5. ✅ Dashboard básico

¿Procedemos? 🎯
