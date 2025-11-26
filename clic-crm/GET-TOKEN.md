# Obtener Access Token para Postman

## 1. En la Consola del Navegador (F12)

Ejecuta esto mientras estés logueado:

```javascript
// Importar supabase desde window
import('../supabaseClient.js').then(module => {
  module.supabase.auth.getSession().then(({ data }) => {
    console.log('🔑 ACCESS TOKEN:');
    console.log(data.session.access_token);
    console.log('\n📋 Copia esto para Postman');
  });
});
```

O más simple, ve a la pestaña **Application** → **Local Storage** → `http://localhost:3000` → busca la key que empiece con `sb-pacewqgypevfgjmdsorz-auth-token` y copia el `access_token` del JSON.

## 2. URLs para Postman

### get-user-permissions
```
POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/get-user-permissions
```

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs
Content-Type: application/json
```

**Body:** (ninguno, solo headers)

**Respuesta esperada:**
```json
{
  "id": "...",
  "email": "rcastillo@clic.do",
  "name": "René Castillo",
  "roles": [
    {"name": "super_admin", "display_name": "Super Administrador"},
    {"name": "admin", "display_name": "Administrador"}
  ],
  "country_code": "DOM",
  "scope": "all"
}
```

---

### crm-manager (properties.list)
```
POST https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/crm-manager
```

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs
Content-Type: application/json
```

**Body:**
```json
{
  "module": "properties",
  "action": "list",
  "params": {},
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [ /* array de propiedades */ ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "total_pages": 10
  }
}
```

---

## 3. Obtener Token Fácil

En DevTools → **Application** → **Local Storage**:

1. Busca: `sb-pacewqgypevfgjmdsorz-auth-token`
2. Click en el valor (es un JSON largo)
3. Busca `"access_token":"`
4. Copia el token (empieza con `eyJ...`)

---

## 4. Verificar que las Edge Functions existen

Lista local:
```bash
cd "c:\Users\Rene Castillo\clic-crm"
supabase functions list
```

Deberías ver:
- ✅ get-user-permissions (v26)
- ✅ crm-manager (v2)
