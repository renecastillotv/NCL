# 🚀 Deploy Edge Functions - Comandos Exactos

## Pasos para Deploy AHORA

### 1️⃣ Verificar Prerequisitos

```bash
# Verificar que estás en el directorio correcto
cd "c:\Users\Rene Castillo\clic-crm"
pwd

# Verificar estructura
ls supabase/functions/

# Debería mostrar:
# _shared/
# crm-manager/
# get-user-permissions/
```

### 2️⃣ Verificar Supabase CLI

```bash
# Verificar instalación
supabase --version

# Si no está instalado:
npm install -g supabase
```

### 3️⃣ Login a Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticación.

### 4️⃣ Link al Proyecto

```bash
supabase link --project-ref pacewqgypevfgjmdsorz
```

**Expected output:**
```
✓ Linked local project to remote project pacewqgypevfgjmdsorz
```

### 5️⃣ Configurar Secrets

**⚠️ IMPORTANTE:** Antes de deployar, configura estos secrets:

1. Ve a: https://supabase.com/dashboard/project/pacewqgypevfgjmdsorz/settings/functions
2. Click en "**Add Secret**"
3. Agrega:

```
Name: SUPABASE_URL
Value: https://pacewqgypevfgjmdsorz.supabase.co
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Tu service role key aquí]
```

**Para obtener tu service role key:**
1. Ve a: https://supabase.com/dashboard/project/pacewqgypevfgjmdsorz/settings/api
2. Copia el valor de "**Service Role Key (secret)**"
3. Pégalo en el secret

### 6️⃣ Deploy Edge Functions

```bash
# Deploy ambas funciones
supabase functions deploy
```

**Expected output:**
```
Deploying Function crm-manager (project ref: pacewqgypevfgjmdsorz)
✓ Deployed Function crm-manager successfully

Deploying Function get-user-permissions (project ref: pacewqgypevfgjmdsorz)
✓ Deployed Function get-user-permissions successfully
```

**Si prefieres deploy individual:**

```bash
# Deploy solo crm-manager
supabase functions deploy crm-manager

# Deploy solo get-user-permissions
supabase functions deploy get-user-permissions
```

### 7️⃣ Verificar Deployment

```bash
# Ver logs de crm-manager (en tiempo real)
supabase functions logs crm-manager --follow

# En otra terminal, ver logs de get-user-permissions
supabase functions logs get-user-permissions --follow
```

---

## 🧪 Testing Inmediato

### Test 1: Desde PowerShell/CMD

```powershell
# Set your token (obtén uno logueándote en tu app)
$TOKEN = "tu-jwt-token-aqui"

# Test get-user-permissions
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/get-user-permissions `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json"

# Test crm-manager
curl -X POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/crm-manager `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"module\":\"properties\",\"action\":\"list\",\"params\":{},\"pagination\":{\"page\":1,\"limit\":10}}'
```

### Test 2: Desde Browser Console

**Abre tu app en el navegador y ejecuta:**

```javascript
// 1. Login primero (si no estás logueado)
const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
  email: 'tu-email@ejemplo.com',
  password: 'tu-password'
});

console.log('✅ Logged in:', session.user.email);

// 2. Test get-user-permissions
const { data: userData, error: userError } = await supabase.functions.invoke('get-user-permissions');

if (userError) {
  console.error('❌ Error:', userError);
} else {
  console.log('✅ User Data:', userData);
  console.log('   - Email:', userData.email);
  console.log('   - Roles:', userData.roles);
  console.log('   - Country:', userData.country_code);
  console.log('   - Source:', userData.source); // Should be 'edge_function'
}

// 3. Test crm-manager - list properties
const { data: propData, error: propError } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: { status: 'active' },
    pagination: { page: 1, limit: 10 }
  }
});

if (propError) {
  console.error('❌ Error:', propError);
} else {
  console.log('✅ Properties:', propData);
  console.log('   - Success:', propData.success);
  console.log('   - Total:', propData.meta.total);
  console.log('   - Scope:', propData.meta.scope);
  console.log('   - Properties:', propData.data.length);
}

// 4. Test crm-manager - create property
const { data: createData, error: createError } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'create',
    params: {
      title: 'Propiedad de Prueba Edge Function',
      operation_type: 'sale',
      category_id: 'tu-categoria-uuid', // Reemplaza con UUID real
      price: 999999,
      currency: 'USD',
      status: 'draft'
    }
  }
});

if (createError) {
  console.error('❌ Error creating:', createError);
} else {
  console.log('✅ Created Property:', createData);
  console.log('   - ID:', createData.data.id);
  console.log('   - Title:', createData.data.title);
  console.log('   - Country Assigned:', createData.meta.country_assigned);
}
```

---

## ✅ Checklist de Verificación

Después del deployment, verifica:

- [ ] ✅ `get-user-permissions` responde sin errores
- [ ] ✅ Devuelve roles correctos
- [ ] ✅ `source` es `'edge_function'` (no `'fallback'`)
- [ ] ✅ `crm-manager` responde a `list`
- [ ] ✅ `crm-manager` responde a `create`
- [ ] ✅ Auto-context funciona (country_code asignado)
- [ ] ✅ Filtrado por scope funciona
- [ ] ✅ No hay errores en logs

---

## 🐛 Troubleshooting

### Error: "Command not found: supabase"

```bash
npm install -g supabase
```

### Error: "Not logged in"

```bash
supabase login
```

### Error: "Project not linked"

```bash
supabase link --project-ref pacewqgypevfgjmdsorz
```

### Error: "Service role key not found"

1. Ve a Dashboard > Edge Functions > Secrets
2. Agrega `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy: `supabase functions deploy`

### Error: "Module not found"

Verifica que todos los archivos estén en `supabase/functions/`:

```bash
ls -R supabase/functions/
```

### Error: "CORS error"

CORS ya está configurado. Si persiste, verifica que el frontend esté usando el dominio correcto.

### Ver logs detallados

```bash
# Ver últimas 100 líneas
supabase functions logs crm-manager -n 100

# Ver solo errores
supabase functions logs crm-manager | grep ERROR

# Ver en tiempo real
supabase functions logs crm-manager --follow
```

---

## 📊 Dashboard de Monitoreo

Después del deployment, monitorea en:

**URL:** https://supabase.com/dashboard/project/pacewqgypevfgjmdsorz/functions

Verás:
- ✅ Estado de las funciones (running/stopped)
- ✅ Invocaciones por minuto
- ✅ Errores
- ✅ Response time
- ✅ Logs en tiempo real

---

## 🎯 Siguiente: Migrar Frontend

Una vez que las edge functions funcionen:

1. ✅ Copiar `src/services/api.js` (ya existe)
2. ✅ Actualizar un componente de prueba
3. ✅ Verificar que funciona
4. ✅ Migrar resto de componentes gradualmente

**Ejemplo de migración en [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)**

---

## 💡 Quick Reference

```bash
# Deploy todo
supabase functions deploy

# Ver logs
supabase functions logs crm-manager --follow

# Re-deploy después de cambios
supabase functions deploy crm-manager

# Verificar status
supabase functions list
```

---

**¿Listo para deployar?** Ejecuta los comandos en orden desde el paso 1️⃣

**¿Problemas?** Revisa Troubleshooting o [supabase/README.md](supabase/README.md)

---

**Última Actualización:** 2025-10-25
**Status:** Ready to deploy
**Time to deploy:** ~5 minutos
