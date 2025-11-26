# Sprint 1: Login + Dashboard - Setup Final

## ✅ Archivos Creados

Todos los componentes del Sprint 1 han sido creados:

### Autenticación
- ✅ `src/components/auth/LoginPage.js` - Página de login con Supabase Auth
- ✅ `src/hooks/useAuth.js` - Hook de autenticación con AuthProvider

### Layout
- ✅ `src/components/layout/Layout.js` - Layout principal con autenticación
- ✅ `src/components/layout/Sidebar.js` - Sidebar con navegación por módulos
- ✅ `src/components/layout/Header.js` - Header con perfil de usuario

### Dashboard
- ✅ `src/components/dashboard/Dashboard.js` - Dashboard con perfil y roles

### Nuevo App
- ✅ `src/App.v2.js` - Nuevo App.js con React Router y rutas

---

## 🚀 Pasos para Activar CRM v2.0

### 1. Instalar React Router

```bash
npm install react-router-dom
```

### 2. Reemplazar App.js

**Opción A: Renombrar y reemplazar**
```bash
# Renombrar App.js actual como backup
mv src/App.js src/App.v1-backup.js

# Renombrar App.v2.js como App.js
mv src/App.v2.js src/App.js
```

**Opción B: Manual**
1. Renombrar `src/App.js` → `src/App.v1-backup.js`
2. Renombrar `src/App.v2.js` → `src/App.js`

### 3. Verificar index.js

Asegúrate de que `src/index.js` NO tenga `<StrictMode>` duplicado. Debe ser:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 4. Iniciar el servidor

```bash
npm start
```

---

## 🧪 Probar el Login

### Paso 1: Ir a `http://localhost:3000`

Deberías ver la nueva página de login con:
- Diseño naranja (#f04e00)
- Campos de email y password
- Botón "Iniciar Sesión"

### Paso 2: Iniciar sesión

Usa tus credenciales de Supabase:
```
Email: tu-usuario@ejemplo.com
Password: tu-password
```

### Paso 3: Verificar Dashboard

Después del login deberías ver:
- ✅ Sidebar con logo CLIC y módulos
- ✅ Header con perfil de usuario
- ✅ Dashboard con información del usuario:
  - Correo electrónico
  - País
  - Roles y permisos
  - Scope de datos (own/team/country/all)

### Paso 4: Probar navegación

Haz clic en los módulos del sidebar:
- Dashboard (activo)
- Propiedades (placeholder)
- Contactos (placeholder)
- Ventas (placeholder)
- Contenido (placeholder)
- Usuarios (solo admin/manager)
- Configuración (solo admin)

---

## 🔍 Verificar Edge Functions

### 1. Abrir consola del navegador (F12)

Deberías ver logs como:
```
🔐 Obteniendo permisos del usuario via Edge Function...
✅ Permisos obtenidos exitosamente
Login exitoso: {user: "...", roles: [...], country: "DOM"}
```

### 2. Si hay errores de Edge Function

**Verificar que está deployada:**
```bash
supabase functions list
```

**Ver logs:**
```bash
supabase functions logs get-user-permissions --follow
```

**Si no está deployada, deployar:**
```bash
cd "c:\Users\Rene Castillo\clic-crm"
supabase functions deploy get-user-permissions
```

---

## 🎨 Diseño Visual

El CRM v2.0 mantiene el diseño actual:
- **Color principal:** #f04e00 (naranja CLIC)
- **Framework:** Tailwind CSS
- **Iconos:** Lucide React
- **Fuente:** System fonts

---

## 📊 Permisos y Roles

### Roles Soportados
1. **super_admin** - Scope: `all` (todas las franquicias)
2. **admin** - Scope: `country` (todo el país)
3. **manager** - Scope: `team` (equipo asignado)
4. **agent** - Scope: `own` (solo sus datos)
5. **accountant** - Scope: `country` (lectura)
6. **client** - Scope: `own` (lectura limitada)

### Visibilidad de Módulos

| Módulo | Todos | Manager | Admin |
|--------|-------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Propiedades | ✅ | ✅ | ✅ |
| Contactos | ✅ | ✅ | ✅ |
| Ventas | ✅ | ✅ | ✅ |
| Contenido | ✅ | ✅ | ✅ |
| Usuarios | ❌ | ✅ | ✅ |
| Configuración | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Error: "Cannot read property 'roles' of null"
**Solución:** El usuario no tiene roles asignados. Asigna un rol en la tabla `user_roles`.

### Error: "get-user-permissions not found"
**Solución:** Deploy la edge function:
```bash
supabase functions deploy get-user-permissions
```

### Error: "CORS error"
**Solución:** Verifica que `cors.ts` esté en `supabase/functions/get-user-permissions/`

### Login no funciona
**Solución:**
1. Verifica credenciales en Supabase Dashboard
2. Revisa consola del navegador para ver errores específicos
3. Verifica que el usuario esté confirmado (email verificado)

### Sidebar no muestra módulos
**Solución:** Asegúrate de que el usuario tiene roles asignados y que `useAuth` está cargando correctamente.

---

## 📝 Próximos Pasos

Una vez que el Sprint 1 esté funcionando:

### Sprint 2: Módulo de Propiedades
- Listar propiedades con edge function
- Crear nueva propiedad
- Editar/eliminar (solo propias o team)
- Filtros y búsqueda

### Sprint 3: Módulo de Contactos
- Listar contactos
- Crear/editar contactos
- Asignar a agentes

### Sprint 4-7: Resto de módulos
- Ventas
- Contenido
- Usuarios
- Configuración

---

## 🎯 Regla de Propiedades

**Importante:** Implementada en Sprint 2

> "Todos pueden ver todas las propiedades de su país y hasta compartirla, pero no puedes eliminarla ni editarla a menos que sea tuya o seas manager"

Esta regla se implementará en el edge function `crm-manager` y en los componentes de Propiedades.

---

**Creado:** 2025-10-25
**Sprint:** 1 - Login + Dashboard
**Status:** ✅ Archivos creados, listo para instalación
