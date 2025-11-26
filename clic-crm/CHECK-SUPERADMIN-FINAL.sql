-- ============================================
-- VERIFICAR USUARIOS CON ROL SUPER_ADMIN
-- ============================================

-- 1. Ver todos los usuarios con sus roles
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_user_id,
    u.country_code,
    u.role as legacy_role,
    r.name as role_name,
    r.display_name as role_display,
    r.level as role_level,
    ur.active as role_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'rcastillo@clic.do'
ORDER BY r.level DESC NULLS LAST;

-- 2. Ver TODOS los roles disponibles en el sistema
SELECT * FROM roles ORDER BY level DESC;

-- 3. Ver si existe el rol super_admin
SELECT id, name, display_name, level, is_system_role 
FROM roles 
WHERE name = 'super_admin';

-- 4. Ver TODOS los usuarios con rol super_admin
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.display_name,
    ur.active
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin'
AND ur.active = true;

-- 5. Verificar el auth_user_id de tu usuario
SELECT 
    u.id as user_table_id,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_user_id,
    au.id as auth_users_id,
    au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'rcastillo@clic.do';
