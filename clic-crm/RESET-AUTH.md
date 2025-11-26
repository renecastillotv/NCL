# Reset Completo de Autenticación

## Problema Detectado

Tienes una **sesión previa guardada** que está causando conflicto con el nuevo login.

```
Error: Invalid login credentials (400)
Pero luego: Auth state changed: SIGNED_IN
```

Esto significa que el navegador tiene una sesión antigua de Supabase que está interfiriendo.

---

## ✅ Solución: Limpiar Todo

### Paso 1: Abrir DevTools

Presiona `F12` para abrir las herramientas de desarrollo

### Paso 2: Ir a Application/Almacenamiento

1. Ve a la pestaña **Application** (o **Almacenamiento**)
2. Expande **Local Storage**
3. Haz clic en `http://localhost:3000`

### Paso 3: Limpiar LocalStorage

**Busca y elimina estas entradas:**
- `supabase.auth.token`
- `sb-pacewqgypevfgjmdsorz-auth-token`
- Cualquier otra que empiece con `sb-` o `supabase`

**O más fácil:** Click derecho en `http://localhost:3000` → **Clear**

### Paso 4: Limpiar Session Storage

1. Expande **Session Storage**
2. Click derecho en `http://localhost:3000` → **Clear**

### Paso 5: Limpiar Cookies

1. Expande **Cookies**
2. Click derecho en `http://localhost:3000` → **Clear**

### Paso 6: Recargar Aplicación

1. Cierra DevTools
2. Presiona `Ctrl + Shift + R` (hard reload)
3. O cierra y abre nueva pestaña en `http://localhost:3000`

---

## 🧪 Crear Usuario de Prueba

Si no tienes un usuario válido, créalo en Supabase:

### Opción A: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/pacewqgypevfgjmdsorz
2. Authentication → Users
3. Click **Add user** → **Create new user**
4. Email: `admin@test.com`
5. Password: `Admin123!`
6. **Auto Confirm User**: ✅ (importante!)
7. Click **Create user**

### Opción B: Desde SQL Editor

```sql
-- Insertar usuario de prueba
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Crear perfil para el usuario
INSERT INTO public.profiles (id, email, name, country_code)
SELECT id, email, 'Admin Test', 'DOM'
FROM auth.users
WHERE email = 'admin@test.com';

-- Asignar rol de admin
INSERT INTO public.user_roles (user_id, role_id)
SELECT
  u.id,
  r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = 'admin@test.com'
AND r.name = 'admin';
```

---

## 🔍 Verificar Usuario en Supabase

### SQL para ver usuarios:

```sql
-- Ver todos los usuarios
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### SQL para ver un usuario específico con roles:

```sql
-- Ver usuario con su perfil y roles
SELECT
  u.email,
  p.name,
  p.country_code,
  r.name as role_name,
  r.display_name as role_display
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE u.email = 'admin@test.com';
```

---

## 🎯 Probar Login Limpio

Después de limpiar storage:

1. **Ve a** `http://localhost:3000`
2. **Deberías ver** la página de login (sin redirección)
3. **Ingresa:**
   - Email: `admin@test.com`
   - Password: `Admin123!`
4. **Click** Iniciar Sesión

**Resultado esperado:**
```
✅ Loading... (mientras autentica)
✅ Auth state changed: SIGNED_IN
✅ 🔐 Loading permissions for user: admin@test.com
✅ Redirección a /dashboard
✅ Dashboard muestra perfil con roles
```

---

## 🐛 Si Aún Hay Errores

### Error: "Invalid login credentials"

**Causa:** El usuario no existe o la contraseña es incorrecta

**Solución:**
1. Verifica el usuario en Supabase Dashboard → Authentication → Users
2. Si no existe, créalo con el SQL de arriba
3. Asegúrate que `email_confirmed_at` NO sea NULL

### Error: "User not found"

**Causa:** El email no está registrado

**Solución:** Usa el SQL de arriba para crear el usuario

### Error: "Email not confirmed"

**Causa:** El usuario existe pero no confirmó su email

**Solución:**
```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@test.com';
```

### Login exitoso pero no redirige

**Causa:** useAuth no está detectando el cambio

**Solución:**
1. Abre consola (F12)
2. Busca logs: `🔐 Loading permissions for user`
3. Si no aparece, hay problema en useAuth.js

---

## 📝 Checklist Final

Antes de intentar login:

- [ ] LocalStorage limpio (sin tokens de Supabase)
- [ ] SessionStorage limpio
- [ ] Cookies limpias
- [ ] Usuario existe en auth.users
- [ ] Usuario tiene email_confirmed_at
- [ ] Usuario tiene registro en profiles
- [ ] Usuario tiene rol en user_roles
- [ ] Hard reload de la página (Ctrl+Shift+R)

---

**Siguiente paso:** Limpia el storage como se indica arriba y prueba con credenciales válidas. ¿Qué usuario tienes en Supabase? Podemos verificarlo primero.
