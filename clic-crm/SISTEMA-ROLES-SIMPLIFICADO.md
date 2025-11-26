# Sistema de Roles Simplificado - Usando Tablas Existentes

## 🎯 Análisis de Tablas Actuales

### Tabla `users` (principal) ✅
- **Ya tiene:** `auth_user_id` (link a auth.users)
- **Ya tiene:** `role` (VARCHAR 50) - **ROL SIMPLE**
- **Ya tiene:** `team_id`, `country_code`, `office_id`
- **Esta es tu tabla PRINCIPAL** de asesores

### Tabla `user_roles` (múltiples roles) ✅
- **Permite:** Múltiples roles por usuario
- **Ya tiene:** `user_id` (FK a users.id)
- **Ya tiene:** `role_id` (FK a roles.id)
- **Ya tiene:** Fechas de inicio/fin (para roles temporales)
- **Perfecto para:** Agente + Estudiante, Manager + Contador, etc.

### Tabla `roles` ✅
- **Ya tiene:** id, name, display_name
- **Ya tiene:** level (jerarquía)
- **Simple y funcional**

### Tabla `user_profiles` ❌ ELIMINAR
- **Problema:** Duplica lo que ya hace `users`
- **Solución:** NO USARLA, usar solo `users`

---

## ✅ Sistema Simplificado Propuesto

### 1. Flujo de Autenticación

```
auth.users (Supabase Auth)
    ↓ (auth_user_id)
public.users (Datos del asesor)
    ↓ (users.id)
public.user_roles (Roles múltiples)
    ↓ (role_id)
public.roles (Catálogo de roles)
```

### 2. Estructura de Datos

**users:**
```sql
id: uuid
auth_user_id: uuid → auth.users.id
email: varchar
first_name: varchar
last_name: varchar
role: varchar(50) → ROL PRINCIPAL (para legacy/fallback)
team_id: uuid
country_code: varchar(3)
office_id: uuid
active: boolean
```

**user_roles:** (para MÚLTIPLES roles)
```sql
id: serial
user_id: uuid → users.id
role_id: integer → roles.id
active: boolean
start_date: timestamp (cuando se otorgó)
end_date: timestamp (NULL = permanente)
auto_expire: boolean
```

**roles:**
```sql
id: serial
name: varchar(100) - 'admin', 'manager', 'agent', 'student', etc.
display_name: varchar(200) - 'Administrador', 'Manager', etc.
level: integer - Para jerarquía (1=basic, 10=super_admin)
```

---

## 🔧 Actualizar useAuth.js

```javascript
const loadUserPermissions = async (authUser) => {
  console.log('📊 Cargando datos del usuario:', authUser.email);

  try {
    // 1. Buscar en tabla users por auth_user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !user) {
      console.warn('⚠️ Usuario no encontrado en tabla users');
      // Fallback por email
      const email = authUser.email.toLowerCase();
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email.split('@')[0],
        roles: [{ name: email.includes('admin') ? 'admin' : 'agent', display_name: 'Agente' }],
        country_code: 'DOM',
        scope: 'own',
      });
      setLoading(false);
      return;
    }

    // 2. Cargar roles MÚLTIPLES desde user_roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          display_name,
          level
        )
      `)
      .eq('user_id', user.id)
      .eq('active', true)
      .is('end_date', null); // Solo roles activos y sin fecha de expiración

    let roles = [];

    if (userRoles && userRoles.length > 0) {
      // Tiene roles en user_roles
      roles = userRoles.map(ur => ur.roles);
    } else if (user.role) {
      // Fallback: usar campo 'role' de la tabla users
      roles = [{
        id: 'legacy',
        name: user.role,
        display_name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        level: 5
      }];
    } else {
      // Default: agent
      roles = [{ id: 'default', name: 'agent', display_name: 'Agente', level: 1 }];
    }

    // 3. Determinar scope por el rol de mayor nivel
    const maxLevel = Math.max(...roles.map(r => r.level || 1));
    let scope = 'own';
    if (maxLevel >= 10) scope = 'all';      // super_admin
    else if (maxLevel >= 8) scope = 'country'; // admin
    else if (maxLevel >= 5) scope = 'team';    // manager
    else scope = 'own';                        // agent

    const userData = {
      id: user.id,
      auth_user_id: authUser.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      first_name: user.first_name,
      last_name: user.last_name,
      roles: roles, // Array de roles
      country_code: user.country_code,
      team_id: user.team_id,
      office_id: user.office_id,
      profile_photo_url: user.profile_photo_url,
      scope: scope,
      active: user.active,
    };

    console.log('✅ Usuario cargado:', userData);
    console.log('🎭 Roles:', roles.map(r => r.name).join(', '));
    setUser(userData);
  } catch (err) {
    console.error('❌ Error:', err);
    setUser({
      id: authUser.id,
      email: authUser.email,
      name: authUser.email.split('@')[0],
      roles: [{ name: 'agent', display_name: 'Agente' }],
      country_code: 'DOM',
      scope: 'own',
    });
  } finally {
    setLoading(false);
  }
};
```

---

## 📊 Roles Recomendados

```sql
-- Insertar roles básicos
INSERT INTO roles (name, display_name, level, is_system_role) VALUES
('super_admin', 'Super Administrador', 10, true),
('admin', 'Administrador', 8, true),
('manager', 'Manager', 5, true),
('agent', 'Agente', 3, true),
('accountant', 'Contador', 4, false),
('student', 'Estudiante', 1, false),
('viewer', 'Visor', 1, false);
```

---

## 🎯 Ejemplo de Uso - Múltiples Roles

### Usuario que es Manager + Estudiante

```sql
-- Usuario en tabla users
INSERT INTO users (id, auth_user_id, first_name, last_name, email, role, country_code)
VALUES (
  gen_random_uuid(),
  'auth-user-id-aqui',
  'René',
  'Castillo',
  'rcastillo@clic.do',
  'manager', -- rol principal (legacy)
  'DOM'
);

-- Asignar rol de manager
INSERT INTO user_roles (user_id, role_id, active)
SELECT
  u.id,
  r.id,
  true
FROM users u
CROSS JOIN roles r
WHERE u.email = 'rcastillo@clic.do'
AND r.name = 'manager';

-- Asignar rol de estudiante
INSERT INTO user_roles (user_id, role_id, active)
SELECT
  u.id,
  r.id,
  true
FROM users u
CROSS JOIN roles r
WHERE u.email = 'rcastillo@clic.do'
AND r.name = 'student';
```

**Resultado:**
```javascript
user.roles = [
  { name: 'manager', display_name: 'Manager', level: 5 },
  { name: 'student', display_name: 'Estudiante', level: 1 }
]
user.scope = 'team' // Porque manager tiene level 5
```

---

## 🔍 Queries Útiles

### Ver usuario con todos sus roles
```sql
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.country_code,
  u.team_id,
  json_agg(
    json_build_object(
      'role_id', r.id,
      'role_name', r.name,
      'display_name', r.display_name,
      'level', r.level
    )
  ) as roles
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.active = true
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.auth_user_id = 'auth-user-id-aqui'
GROUP BY u.id;
```

### Ver todos los usuarios con roles múltiples
```sql
SELECT
  u.email,
  u.first_name || ' ' || u.last_name as name,
  string_agg(r.display_name, ', ') as roles
FROM users u
JOIN user_roles ur ON ur.user_id = u.id AND ur.active = true
JOIN roles r ON r.id = ur.role_id
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING count(ur.id) > 1; -- Solo los que tienen múltiples roles
```

---

## 🚀 Próximos Pasos

1. **Insertar roles en la tabla `roles`** (si no existen)
2. **Actualizar useAuth.js** con el código de arriba
3. **Crear tu usuario en `users`** con link a `auth.users`
4. **Asignar roles en `user_roles`**
5. **Probar login**

¿Quieres que actualice useAuth.js ahora con esta lógica?
