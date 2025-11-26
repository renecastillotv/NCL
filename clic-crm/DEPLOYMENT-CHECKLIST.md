# 🚀 Deployment Checklist - CLIC CRM Edge Functions

## ✅ Pre-Deployment

### 1. Verificación de Archivos

- [x] `supabase/config.toml` existe
- [x] `supabase/functions/_shared/cors.ts` existe
- [x] `supabase/functions/crm-manager/` completo (15 archivos)
- [x] `supabase/functions/get-user-permissions/index.ts` existe
- [ ] Todos los imports son correctos (rutas relativas)
- [ ] No hay errores de TypeScript

### 2. Configuración Local

- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Logged in a Supabase (`supabase login`)
- [ ] Proyecto linkeado (`supabase link --project-ref pacewqgypevfgjmdsorz`)

### 3. Variables de Entorno

Ve a: **Supabase Dashboard > Edge Functions > Secrets**

- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado

**⚠️ IMPORTANTE:** Obtén service role key de:
`Dashboard > Settings > API > Service Role Key (secret)`

---

## 🚀 Deployment Steps

### Step 1: Deploy Edge Functions

```bash
cd "c:\Users\Rene Castillo\clic-crm"

# Deploy todas las funciones
supabase functions deploy
```

**Expected Output:**
```
Deploying Function crm-manager (project ref: pacewqgypevfgjmdsorz)
Function deployed successfully!

Deploying Function get-user-permissions (project ref: pacewqgypevfgjmdsorz)
Function deployed successfully!
```

### Step 2: Verificar Deployment

```bash
# Ver logs de crm-manager
supabase functions logs crm-manager --follow

# Ver logs de get-user-permissions
supabase functions logs get-user-permissions --follow
```

---

## 🧪 Testing

### Test 1: Get User Permissions

**From Browser Console:**
```javascript
// 1. Login first
const { data: session } = await supabase.auth.signInWithPassword({
  email: 'tu-email@ejemplo.com',
  password: 'tu-password'
});

// 2. Get permissions
const { data, error } = await supabase.functions.invoke('get-user-permissions');
console.log('User Data:', data);
console.log('Roles:', data.roles);
console.log('Country:', data.country_code);
```

**Expected Response:**
```json
{
  "id": "uuid",
  "email": "tu-email@ejemplo.com",
  "name": "Tu Nombre",
  "roles": [{"name": "agent", "display_name": "Agente"}],
  "country_code": "DOM",
  "source": "edge_function"
}
```

- [ ] ✅ Responde sin errores
- [ ] ✅ Devuelve roles correctos
- [ ] ✅ Country code correcto

### Test 2: CRM Manager - List Properties

```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: { status: 'active' },
    pagination: { page: 1, limit: 10 }
  }
});

console.log('Properties:', data.data);
console.log('Total:', data.meta.total);
console.log('Scope:', data.meta.scope);
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* array of properties */ ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "scope": "own|team|country|all",
    "filters_applied": {}
  }
}
```

- [ ] ✅ Responde sin errores
- [ ] ✅ Devuelve propiedades
- [ ] ✅ Scope correcto según rol
- [ ] ✅ Filtrado automático funciona

### Test 3: CRM Manager - Create Property

```javascript
const { data, error } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'create',
    params: {
      title: 'Propiedad de Prueba',
      operation_type: 'sale',
      category_id: 'uuid-categoria',
      price: 250000,
      currency: 'USD'
    }
  }
});

console.log('Created:', data.data);
console.log('Country assigned:', data.meta.country_assigned);
```

**Expected Response:**
```json
{
  "success": true,
  "data": { /* created property */ },
  "meta": {
    "message": "Propiedad creada exitosamente",
    "country_assigned": "DOM"
  }
}
```

- [ ] ✅ Crea propiedad
- [ ] ✅ Country code auto-asignado
- [ ] ✅ created_by auto-asignado

### Test 4: Different User Roles

**Test con diferentes usuarios:**

| Rol | Test | Expected Behavior |
|-----|------|-------------------|
| **Agent** | List properties | ✅ Solo sus propiedades |
| **Manager** | List properties | ✅ Propiedades de su equipo |
| **Admin** | List properties | ✅ Todas del país |
| **Super Admin** | List properties | ✅ Todas las franquicias |

- [ ] Agent ve solo sus datos
- [ ] Manager ve datos del equipo
- [ ] Admin ve datos del país
- [ ] Super Admin ve todo

---

## 📊 Monitoreo Post-Deployment

### 1. Logs

```bash
# Monitorear errores
supabase functions logs crm-manager | grep ERROR
supabase functions logs get-user-permissions | grep ERROR
```

### 2. Performance

Ve a: **Supabase Dashboard > Edge Functions > [Function] > Metrics**

Revisa:
- [ ] Response time < 1 segundo
- [ ] Success rate > 95%
- [ ] No memory leaks
- [ ] No timeout errors

### 3. Error Tracking

Configura alertas en Dashboard para:
- [ ] 500 errors
- [ ] 401/403 errors
- [ ] Timeouts
- [ ] High memory usage

---

## 🔄 Actualizar Frontend

### 1. Agregar API Service

- [ ] Copiar `src/services/api.js` al proyecto
- [ ] Importar en componentes: `import { api } from './services/api'`

### 2. Migrar Componentes (Gradual)

**Ejemplo: CRMProperties.js**

**Antes:**
```javascript
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'active');
```

**Después:**
```javascript
const { data, meta, error } = await api.properties.list(
  { status: 'active' },
  { page: 1, limit: 30 }
);
```

### 3. Componentes a Migrar

- [ ] CRMProperties.js
- [ ] ContactsManager.js
- [ ] DealsManager.js
- [ ] ContentArticles.js
- [ ] Dashboard.js
- [ ] PropertyCreateWizard.js
- [ ] Resto de componentes (gradualmente)

---

## 🔒 Seguridad Post-Deployment

### 1. Remover Credenciales Hardcoded

Buscar y remover:
- [ ] `supabaseUrl` hardcoded en componentes
- [ ] `supabaseAnonKey` hardcoded en componentes
- [ ] Mover a `process.env.REACT_APP_*`

### 2. Variables de Entorno

Crear `.env` local:
```
REACT_APP_SUPABASE_URL=https://pacewqgypevfgjmdsorz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key
```

- [ ] `.env` creado
- [ ] `.env` en `.gitignore`
- [ ] Variables configuradas en producción

### 3. RLS Policies

**Opcional:** Si quieres mantener RLS en tablas:

```sql
-- Disable RLS (edge function bypasses it)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
```

- [ ] Decidir estrategia de RLS
- [ ] Aplicar políticas si es necesario

---

## 📝 Documentación

- [ ] Actualizar README del proyecto
- [ ] Documentar nuevos endpoints para el equipo
- [ ] Crear guía de migración de componentes
- [ ] Documentar proceso de testing

---

## ✅ Rollback Plan

Si algo falla:

### Opción 1: Redeploy versión anterior
```bash
git checkout previous-commit
supabase functions deploy
```

### Opción 2: Revertir a queries directas
- Comentar imports de `api.js`
- Descomentar queries directas anteriores
- Deploy frontend

---

## 🎉 Success Criteria

El deployment es exitoso cuando:

- [x] Edge functions deployed sin errores
- [ ] `get-user-permissions` devuelve datos correctos
- [ ] `crm-manager` responde a todos los módulos
- [ ] Filtrado automático por rol funciona
- [ ] Auto-contexto (country, user) funciona
- [ ] No hay errores en logs
- [ ] Performance aceptable (< 1s)
- [ ] Frontend funciona con nuevo API

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs: `supabase functions logs [function-name]`
2. Verificar secrets en Dashboard
3. Probar con cURL para aislar el problema
4. Revisar documentación en `supabase/README.md`

---

**Última Actualización:** 2025-10-25
**Status:** Ready for deployment
**Next Action:** Ejecutar deployment steps
