-- ============================================
-- DIAGNÓSTICO DE ESTRUCTURA DE TABLAS
-- ============================================

-- 1. Ver estructura de la tabla roles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'roles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver estructura de la tabla user_roles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_roles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver constraints/keys de user_roles
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_roles'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- 4. Ver todos los roles que existen
SELECT * FROM roles ORDER BY level DESC;

-- 5. Ver todos los registros en user_roles
SELECT * FROM user_roles LIMIT 10;
