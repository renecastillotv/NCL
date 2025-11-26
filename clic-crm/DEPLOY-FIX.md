# 🔧 Deploy Fix Applied - Try Again

## Problemas Encontrados y Solucionados

### ✅ Problema 1: config.toml con configuración inválida
**Error:** `has invalid keys: edge_functions, project`

**Solución:** Simplificado `config.toml` - solo necesita configuración mínima para deployment

### ✅ Problema 2: _shared/cors.ts no encontrado
**Error:** `failed to read file: open supabase\functions\_shared\cors.ts`

**Causa:** En Windows, Supabase CLI tiene problemas con carpetas que empiezan con `_`

**Solución:**
- Duplicado `cors.ts` en cada función
- Actualizado todos los imports

## Estructura Actualizada

```
supabase/functions/
├── _shared/cors.ts              ← Ya no se usa (puedes borrar)
├── crm-manager/
│   ├── cors.ts                  ← ✅ NUEVO (duplicado)
│   ├── index.ts                 ← ✅ Import actualizado
│   ├── utils/
│   │   └── response.ts          ← ✅ Import actualizado
│   ├── middleware/
│   ├── handlers/
└── get-user-permissions/
    ├── cors.ts                  ← ✅ NUEVO (duplicado)
    └── index.ts                 ← ✅ Import actualizado
```

## 🚀 Deploy Ahora

Intenta de nuevo:

```powershell
# Desde PowerShell en c:\Users\Rene Castillo\clic-crm

# Deploy crm-manager
supabase functions deploy crm-manager

# Deploy get-user-permissions
supabase functions deploy get-user-permissions

# O deploy ambas
supabase functions deploy
```

## Expected Output (Success)

```
Uploading asset (crm-manager): supabase/functions/crm-manager/index.ts
Uploading asset (crm-manager): supabase/functions/crm-manager/cors.ts
Uploading asset (crm-manager): supabase/functions/crm-manager/utils/response.ts
... (más archivos)
✓ Deployed Function crm-manager successfully

Uploading asset (get-user-permissions): supabase/functions/get-user-permissions/index.ts
Uploading asset (get-user-permissions): supabase/functions/get-user-permissions/cors.ts
✓ Deployed Function get-user-permissions successfully
```

## Si Todavía Hay Errores

### Error: "Module not found"

Verifica que NO haya imports a `_shared`:

```powershell
# Buscar imports incorrectos
Get-ChildItem -Path "supabase\functions" -Filter "*.ts" -Recurse | Select-String "_shared"
```

Si encuentra alguno, significa que hay un archivo que no actualizamos. Avísame cuál es.

### Error: "Project not linked"

```powershell
supabase link --project-ref pacewqgypevfgjmdsorz
```

### Ver Logs Detallados

```powershell
# Deploy con debug
supabase functions deploy crm-manager --debug
```

## Verificar Deployment

Después de deployar exitosamente:

```powershell
# Ver logs
supabase functions logs crm-manager --follow
```

## Test Rápido

En el navegador, después del deploy:

```javascript
// Login primero
const { data: session } = await supabase.auth.signInWithPassword({
  email: 'tu-email@ejemplo.com',
  password: 'tu-password'
});

// Test get-user-permissions
const { data: user } = await supabase.functions.invoke('get-user-permissions');
console.log('User:', user);

// Test crm-manager
const { data: props } = await supabase.functions.invoke('crm-manager', {
  body: {
    module: 'properties',
    action: 'list',
    params: {},
    pagination: { page: 1, limit: 10 }
  }
});
console.log('Properties:', props);
```

## Archivos Modificados

- ✅ `supabase/config.toml` - Simplificado
- ✅ `supabase/functions/crm-manager/cors.ts` - Creado
- ✅ `supabase/functions/crm-manager/index.ts` - Import actualizado
- ✅ `supabase/functions/crm-manager/utils/response.ts` - Import actualizado
- ✅ `supabase/functions/get-user-permissions/cors.ts` - Creado
- ✅ `supabase/functions/get-user-permissions/index.ts` - Import actualizado

## Limpiar (Opcional)

Puedes borrar la carpeta `_shared` ya que no se usa:

```powershell
Remove-Item -Path "supabase\functions\_shared" -Recurse -Force
```

---

**Status:** ✅ Fixed - Ready to deploy
**Next Command:** `supabase functions deploy`
