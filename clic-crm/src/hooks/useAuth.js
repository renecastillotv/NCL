import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

// Contexto de Autenticación
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserPermissions(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);

      if (event === 'SIGNED_IN' && session) {
        await loadUserPermissions(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserPermissions = async (authUser) => {
    console.log('📊 Cargando usuario:', authUser.email);

    try {
      // TIMEOUT de 3 segundos para todas las queries
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 3000)
      );

      // 1. Buscar usuario en tabla users
      const userPromise = supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      const { data: user, error: userError } = await Promise.race([userPromise, timeout]);

      if (userError || !user) {
        throw new Error('Usuario no encontrado');
      }

      console.log('✅ Usuario encontrado:', user.email);

      // 2. Intentar cargar roles (CON TIMEOUT)
      let roles = [];
      try {
        const rolesPromise = supabase
          .from('user_roles')
          .select('role_id, roles(id, name, display_name, level)')
          .eq('user_id', user.id)
          .eq('active', true);

        const { data: userRoles } = await Promise.race([rolesPromise, timeout]);

        if (userRoles && userRoles.length > 0) {
          roles = userRoles.map(ur => ur.roles).filter(r => r);
        }
      } catch (rolesErr) {
        console.warn('⚠️ Timeout/error cargando roles');
      }

      // 3. Fallback si no hay roles
      if (roles.length === 0) {
        roles = user.role ? [{
          id: 'legacy',
          name: user.role,
          display_name: user.role,
          level: user.role === 'admin' ? 8 : 3
        }] : [{
          id: 'default',
          name: 'agent',
          display_name: 'Agente',
          level: 3
        }];
      }

      const maxLevel = Math.max(...roles.map(r => r.level || 1));
      const scope = maxLevel >= 10 ? 'all' : maxLevel >= 8 ? 'country' : maxLevel >= 5 ? 'team' : 'own';

      const userData = {
        id: user.id,
        auth_user_id: authUser.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        roles,
        country_code: user.country_code || 'DOM',
        team_id: user.team_id,
        scope,
      };

      console.log('✅ Listo:', userData.name, '- Roles:', roles.map(r => r.name).join(','));
      setUser(userData);
    } catch (err) {
      console.error('❌ Error:', err.message);
      // FALLBACK RÁPIDO
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email.split('@')[0],
        roles: [{ name: 'agent', display_name: 'Agente', level: 3 }],
        country_code: 'DOM',
        scope: 'own',
      });
    } finally {
      setLoading(false);
    }
  };

  const determineScope = (roles) => {
    if (!roles || roles.length === 0) return 'own';

    const roleNames = roles.map((r) => r.name);

    if (roleNames.includes('super_admin')) return 'all';
    if (roleNames.includes('admin')) return 'country';
    if (roleNames.includes('manager')) return 'team';
    return 'own';
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === roleName);
  };

  const hasAnyRole = (roleNames) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => roleNames.includes(r.name));
  };

  const canAccess = (moduleName) => {
    // Por defecto todos pueden acceder (el edge function manejará los permisos)
    // Aquí solo ocultamos módulos según rol si es necesario

    // Ejemplo: solo admin y super_admin pueden ver usuarios
    if (moduleName === 'users') {
      return hasAnyRole(['admin', 'super_admin', 'manager']);
    }

    // Ejemplo: solo admin y super_admin pueden ver configuración
    if (moduleName === 'config') {
      return hasAnyRole(['admin', 'super_admin']);
    }

    // Resto de módulos: todos los usuarios pueden ver
    return true;
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    hasRole,
    hasAnyRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
