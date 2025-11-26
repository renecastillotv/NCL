-- ============================================
-- ASIGNAR ROL SUPER_ADMIN A rcastillo@clic.do
-- ============================================

-- PASO 1: Crear el rol super_admin si no existe
INSERT INTO roles (name, display_name, description, level, is_system_role)
VALUES ('super_admin', 'Super Administrador', 'Acceso total al sistema', 10, true)
ON CONFLICT (name) DO UPDATE 
SET display_name = 'Super Administrador', 
    level = 10,
    is_system_role = true;

-- PASO 2: Asignar el rol super_admin a rcastillo@clic.do
DO $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    -- Buscar el ID del usuario en la tabla users
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = 'rcastillo@clic.do';
    
    -- Buscar el ID del rol super_admin
    SELECT id INTO v_role_id 
    FROM roles 
    WHERE name = 'super_admin';
    
    -- Verificar que ambos existen
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario rcastillo@clic.do no encontrado en tabla users';
    END IF;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Rol super_admin no encontrado en tabla roles';
    END IF;
    
    -- PASO 3: Desactivar otros roles del usuario
    UPDATE user_roles 
    SET active = false 
    WHERE user_id = v_user_id;
    
    -- PASO 4: Asignar el rol super_admin
    INSERT INTO user_roles (user_id, role_id, active, granted_at)
    VALUES (v_user_id, v_role_id, true, NOW())
    ON CONFLICT (user_id, role_id) DO UPDATE 
    SET active = true, 
        granted_at = NOW();
    
    RAISE NOTICE 'Rol super_admin asignado exitosamente a rcastillo@clic.do';
END $$;

-- PASO 5: Verificar el resultado
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    r.display_name,
    r.level,
    ur.active,
    ur.granted_at
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'rcastillo@clic.do'
ORDER BY r.level DESC;
