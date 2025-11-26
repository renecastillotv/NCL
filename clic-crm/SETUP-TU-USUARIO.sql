-- =========================================
-- SETUP USUARIO: rcastillo@clic.do
-- =========================================

-- 1. Verificar que existe en auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'rcastillo@clic.do';

-- Si NO existe, créalo primero en Supabase Dashboard → Authentication → Users


-- 2. Verificar si existe en tabla users
SELECT id, auth_user_id, email, first_name, last_name, role, country_code, team_id
FROM users
WHERE email = 'rcastillo@clic.do';


-- 3A. Si NO existe en users, crearlo y vincularlo
INSERT INTO users (
  auth_user_id,
  email,
  first_name,
  last_name,
  role,
  country_code,
  active,
  show_on_website,
  user_type
)
SELECT
  au.id,                     -- auth_user_id desde auth.users
  'rcastillo@clic.do',
  'René',
  'Castillo',
  'admin',                   -- Rol legacy (fallback)
  'DOM',
  true,
  true,
  1
FROM auth.users au
WHERE au.email = 'rcastillo@clic.do'
ON CONFLICT (email) DO NOTHING;


-- 3B. Si YA existe en users pero falta auth_user_id, actualizarlo
UPDATE users
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'rcastillo@clic.do'
)
WHERE email = 'rcastillo@clic.do'
AND auth_user_id IS NULL;


-- 4. Verificar/crear roles básicos en tabla roles
INSERT INTO roles (name, display_name, level, is_system_role)
VALUES
  ('super_admin', 'Super Administrador', 10, true),
  ('admin', 'Administrador', 8, true),
  ('manager', 'Manager', 5, true),
  ('agent', 'Agente', 3, true),
  ('accountant', 'Contador', 4, false),
  ('student', 'Estudiante', 1, false)
ON CONFLICT (name) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level;


-- 5. Asignar rol ADMIN a tu usuario
INSERT INTO user_roles (user_id, role_id, active, granted_at)
SELECT
  u.id,
  r.id,
  true,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'rcastillo@clic.do'
AND r.name = 'admin'
ON CONFLICT DO NOTHING;


-- 6. (OPCIONAL) Asignar rol adicional (ejemplo: student)
-- Descomenta si quieres probar múltiples roles
/*
INSERT INTO user_roles (user_id, role_id, active, granted_at)
SELECT
  u.id,
  r.id,
  true,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'rcastillo@clic.do'
AND r.name = 'student'
ON CONFLICT DO NOTHING;
*/


-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

-- Ver usuario completo con todos sus roles
SELECT
  u.id as user_id,
  u.auth_user_id,
  u.email,
  u.first_name || ' ' || u.last_name as name,
  u.country_code,
  u.team_id,
  u.role as legacy_role,
  json_agg(
    json_build_object(
      'role_id', r.id,
      'role_name', r.name,
      'display_name', r.display_name,
      'level', r.level,
      'active', ur.active
    )
  ) FILTER (WHERE r.id IS NOT NULL) as roles
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.active = true
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'rcastillo@clic.do'
GROUP BY u.id, u.auth_user_id, u.email, u.first_name, u.last_name, u.country_code, u.team_id, u.role;


-- Ver TODOS los usuarios con múltiples roles
SELECT
  u.email,
  u.first_name || ' ' || u.last_name as name,
  string_agg(r.display_name, ', ' ORDER BY r.level DESC) as roles,
  max(r.level) as max_level
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.active = true
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.active = true
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY max_level DESC NULLS LAST;
