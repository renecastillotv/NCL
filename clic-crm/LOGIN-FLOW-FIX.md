# Fix: Login Flow - Evitar Doble Llamada

## ❌ Problema

El login se quedaba cargando infinitamente porque había **dos procesos compitiendo**:

1. **LoginPage.js** llamaba manualmente a `get-user-permissions`
2. **useAuth.js** escuchaba el evento SIGNED_IN y también llamaba a `get-user-permissions`

**Resultado:** Loop infinito y estado inconsistente

## ✅ Solución

**Simplificar LoginPage** - Solo hace login, NO carga permisos

**ANTES:**
```javascript
// LoginPage.js hacía DEMASIADO
const { data: authData } = await supabase.auth.signInWithPassword({...});
const { data: userData } = await supabase.functions.invoke('get-user-permissions'); // ❌ DUPLICADO
navigate('/dashboard'); // ❌ Manual
```

**DESPUÉS:**
```javascript
// LoginPage.js solo hace login
const { error } = await supabase.auth.signInWithPassword({...});
// useAuth detecta SIGNED_IN y hace el resto automáticamente ✅
```

## 🔄 Flujo Correcto

```
┌─────────────────────────────────────┐
│  1. Usuario envía form de login    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. LoginPage.handleLogin()         │
│     supabase.auth.signInWithPassword│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. Supabase Auth emite evento:     │
│     SIGNED_IN                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. useAuth detecta SIGNED_IN       │
│     - Llama get-user-permissions    │
│     - Carga roles, country, team    │
│     - Actualiza contexto user       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. LoginPage detecta user !== null │
│     - useEffect redirige /dashboard │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  6. Layout verifica user            │
│     - Si existe, muestra Dashboard  │
│     - Si no, redirige a /           │
└─────────────────────────────────────┘
```

## 📝 Cambios Realizados

### LoginPage.js

**Agregado:**
```javascript
import { useAuth } from '../../hooks/useAuth';

const { user } = useAuth();

// Redirigir automáticamente cuando user se cargue
useEffect(() => {
  if (user) {
    navigate('/dashboard');
  }
}, [user, navigate]);
```

**Simplificado:**
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // ✅ useAuth se encarga del resto
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
};
```

### useAuth.js (sin cambios)

Ya estaba bien configurado:
```javascript
useEffect(() => {
  // ...
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserPermissions(session.user); // ✅ Carga permisos
      }
    }
  );
}, []);
```

## 🎯 Responsabilidades Claras

| Componente | Responsabilidad |
|------------|-----------------|
| **LoginPage.js** | Solo login (signInWithPassword) |
| **useAuth.js** | Detectar auth changes, cargar permisos |
| **Layout.js** | Verificar auth, proteger rutas |
| **Dashboard.js** | Mostrar datos del usuario |

## 🧪 Testing

1. **Credenciales incorrectas:**
   - ✅ Muestra error inmediatamente
   - ✅ Deja de cargar
   - ✅ No redirige

2. **Credenciales correctas:**
   - ✅ Loading durante auth
   - ✅ useAuth carga permisos
   - ✅ Redirige a /dashboard
   - ✅ Muestra perfil con roles

3. **Refresh en /dashboard:**
   - ✅ useAuth detecta sesión existente
   - ✅ Carga permisos del cache/servidor
   - ✅ Mantiene en dashboard

4. **Usuario ya logueado visita /:**
   - ✅ LoginPage detecta user !== null
   - ✅ Redirige a /dashboard inmediatamente

---

**Fecha:** 2025-10-25
**Fix:** Eliminada doble llamada a get-user-permissions
**Status:** ✅ Listo para probar
