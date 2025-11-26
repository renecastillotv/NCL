import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Users,
    Home,
    Building,
    Calendar,
    FileText,
    BarChart3,
    Settings,
    UserPlus,
    ClipboardList,
    TrendingUp,
    DollarSign,
    LogOut,
    User,
    MapPin,
    Video,
    MessageSquare,
    Search,
    HelpCircle,
    Tag,
    Handshake,
    Plus
} from 'lucide-react';

// Importar sistema SIMPLE
import { getUserModules, hasActionPermission, getDataScope } from './configs/RolesConfig';
import SimpleModuleRenderer from './components/SimpleModuleRenderer';
import LoginPage from './components/LoginPage'; // Importar el nuevo componente

// Configuración de Supabase
const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs';

// Configuración de Supabase - SINGLETON para evitar múltiples instancias
let supabaseInstance = null;

const getSupabaseClient = () => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        console.log('🔧 Nueva instancia de Supabase creada');
    }
    return supabaseInstance;
};

const supabase = getSupabaseClient();

// Sistema de Roles (mantenido para fallback)
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    AGENT: 'agent',
    ACCOUNTANT: 'accountant',
    CLIENT: 'client',
    VIEWER: 'viewer'
};

// Iconos unificados
const ICONS = {
    Users,
    Home,
    Building,
    Calendar,
    FileText,
    BarChart3,
    Settings,
    UserPlus,
    ClipboardList,
    TrendingUp,
    DollarSign,
    MapPin,
    Video,
    MessageSquare,
    Search,
    HelpCircle,
    Tag,
    Handshake,
    Plus
};

const App = () => {
    // Estados principales
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('dashboard');
    const [hoveredModule, setHoveredModule] = useState(null);
    const [currentSection, setCurrentSection] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);

    // Estados de autenticación
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Estado para prevenir múltiples procesamientos
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);

    // Estado para el menú del perfil
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // SIMPLE: Obtener módulos del usuario
    const modules = getUserModules(user);

    // SIMPLE: Permisos del usuario
    const permissions = {
        modules: modules,
        hasAction: (action) => hasActionPermission(user, action),
        getDataScope: () => getDataScope(user),
        canAccessSection: (moduleId, sectionId) => {
            const module = modules.find(m => m.id === moduleId);
            if (!module) return false;
            if (!sectionId) return true;
            return module.sections?.some(s => s.id === sectionId) || false;
        }
    };

    // useEffect para cerrar menú del perfil al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    // Función para obtener permisos del usuario via Edge Function
    const fetchUserPermissions = async (session) => {
        try {
            console.log('🔐 Obteniendo permisos del usuario via Edge Function...');

            const response = await supabase.functions.invoke('get-user-permissions', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (response.error) {
                console.error('❌ Error en Edge Function:', response.error);
                return null;
            }

            if (response.data) {
                console.log('✅ Permisos obtenidos exitosamente');
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('❌ Error llamando Edge Function:', error);
            return null;
        }
    };

    // Función para determinar rol por email (fallback)
    const getRoleFromEmail = (email) => {
        if (email.includes('admin')) return ROLES.ADMIN;
        if (email.includes('manager')) return ROLES.MANAGER;
        if (email.includes('account')) return ROLES.ACCOUNTANT;
        if (email.includes('client')) return ROLES.CLIENT;
        return ROLES.AGENT;
    };

    // Función centralizada para procesar sesión de usuario
    const processUserSession = async (session, source = 'UNKNOWN') => {
        console.log(`🔄 processUserSession ${source} - ${session.user.email}`);

        // Verificar cache existente antes de hacer llamadas
        const existingCache = localStorage.getItem('clic_user');

        if (existingCache && source !== 'MANUAL_LOGIN' && source !== 'MANUAL_SIGNUP') {
            try {
                const cachedData = JSON.parse(existingCache);
                const isRecent = cachedData.lastUpdated && (Date.now() - cachedData.lastUpdated) < 120000; // 2 minutos

                if (cachedData.source === 'edge_function' &&
                    cachedData.email === session.user.email &&
                    isRecent) {
                    console.log('✅ USANDO cache válido');
                    setUser(cachedData);
                    setIsAuthenticated(true);
                    return cachedData;
                }
            } catch (error) {
                console.error('❌ Error parseando cache:', error);
            }
        }

        // Obtener permisos desde Edge Function
        console.log('🚀 Llamando Edge Function...');

        try {
            const permissionsData = await Promise.race([
                fetchUserPermissions(session),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000))
            ]);

            if (permissionsData) {
                console.log('✅ Edge Function exitosa');
                console.log('📦 Datos recibidos de Edge Function:', permissionsData);

                // Validar que tengamos los datos necesarios
                if (!permissionsData.user || !permissionsData.user.id) {
                    console.error('❌ Edge Function no devolvió datos de usuario válidos');
                    console.error('Datos recibidos:', permissionsData);
                    throw new Error('Datos de usuario inválidos desde Edge Function');
                }

                const userData = {
                    id: permissionsData.user.id,
                    name: permissionsData.user.name,
                    email: permissionsData.user.email,
                    position: permissionsData.user.position,
                    country_code: permissionsData.user.country_code,
                    country: permissionsData.user.country,
                    profile_photo_url: permissionsData.user.profile_photo_url,
                    roles: permissionsData.roles,
                    permissions: permissionsData.permissions,
                    role: permissionsData.roles[0]?.name || 'viewer',
                    lastUpdated: Date.now(),
                    source: 'edge_function'
                };

                console.log('📊 Usuario configurado con Edge Function');
                console.log('🎯 País:', userData.country_code, 'Rol:', userData.role);
                console.log('👥 Roles completos:', userData.roles);

                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('clic_user', JSON.stringify(userData));

                return userData;
            }
        } catch (error) {
            console.error('❌ Error en Edge Function:', error.message);
        }

        // Fallback
        console.log('🔄 Usando fallback');
        const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            email: session.user.email,
            profile_photo_url: session.user.user_metadata?.profile_photo_url,
            country_code: 'DOM',
            role: getRoleFromEmail(session.user.email),
            lastUpdated: Date.now(),
            source: 'fallback'
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('clic_user', JSON.stringify(userData));

        return userData;
    };

    // Autenticación con Supabase - FUNCIÓN LIMPIA CORREGIDA
    const authenticateUser = async (email, password) => {
        setAuthLoading(true);
        setAuthError('');

        try {
            console.log('🔐 Intentando autenticar:', email);

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                // Si hay error, no crear cuenta automáticamente
                console.log('❌ Error de autenticación:', error.message);

                if (error.message.includes('Invalid login credentials') ||
                    error.message.includes('Email not confirmed') ||
                    error.message.includes('Invalid email or password')) {
                    setAuthError('Credenciales incorrectas. Usuario o contraseña no válidos.');
                } else {
                    setAuthError('Error de acceso. Verifica tus credenciales e intenta nuevamente.');
                }
            } else if (data.user) {
                console.log('✅ Login exitoso');
                setTimeout(async () => {
                    const { data: currentSession } = await supabase.auth.getSession();
                    if (currentSession.session) {
                        await processUserSession(currentSession.session, 'MANUAL_LOGIN');
                    }
                }, 500);
            }
        } catch (error) {
            console.error('❌ Error de autenticación:', error);
            setAuthError('Error de conexión. Intenta nuevamente.');
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        console.log('👋 Cerrando sesión...');
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        setActiveModule('dashboard');
        setShowProfileMenu(false);
        localStorage.removeItem('clic_user');
    };

    // Verificar autenticación al cargar
    useEffect(() => {
        const checkAuth = async () => {
            console.log('🔍 Verificando autenticación...');

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session || !session.user || !session.user.id) {
                    console.log('❌ No hay usuario autenticado');
                    setLoading(false);
                    return;
                }

                console.log('👤 Usuario autenticado encontrado:', session.user.email);

                // Verificar cache existente
                const existingCache = localStorage.getItem('clic_user');
                let shouldTryEdgeFunction = true;
                let cachedUserData = null;

                if (existingCache) {
                    try {
                        cachedUserData = JSON.parse(existingCache);
                        console.log('💾 Cache encontrado:', cachedUserData.source);

                        if (cachedUserData.source === 'edge_function' &&
                            cachedUserData.email === session.user.email &&
                            cachedUserData.lastUpdated &&
                            (Date.now() - cachedUserData.lastUpdated) < 300000) {

                            console.log('🎯 Usando datos válidos de Edge Function desde cache');
                            setUser(cachedUserData);
                            setIsAuthenticated(true);
                            shouldTryEdgeFunction = false;
                        }
                    } catch (error) {
                        console.log('❌ Error parseando cache existente:', error);
                    }
                }

                if (shouldTryEdgeFunction) {
                    console.log('🚀 Intentando obtener permisos desde Edge Function...');
                    const permissionsData = await fetchUserPermissions(session);

                    if (permissionsData && permissionsData.user && permissionsData.user.id) {
                        const userData = {
                            id: permissionsData.user.id,
                            name: permissionsData.user.name,
                            email: permissionsData.user.email,
                            position: permissionsData.user.position,
                            country_code: permissionsData.user.country_code,
                            country: permissionsData.user.country,
                            profile_photo_url: permissionsData.user.profile_photo_url,
                            roles: permissionsData.roles,
                            permissions: permissionsData.permissions,
                            role: permissionsData.roles[0]?.name || 'viewer',
                            lastUpdated: Date.now(),
                            source: 'edge_function'
                        };

                        console.log('🎯 Usuario configurado con Edge Function');
                        console.log('👥 Roles:', userData.roles);
                        console.log('🎭 Rol principal:', userData.role);
                        setUser(userData);
                        setIsAuthenticated(true);
                        localStorage.setItem('clic_user', JSON.stringify(userData));
                    } else {
                        console.log('⚠️ Edge Function falló');

                        if (cachedUserData && cachedUserData.source === 'edge_function') {
                            console.log('🛡️ Manteniendo datos de Edge Function existentes');
                            setUser(cachedUserData);
                            setIsAuthenticated(true);
                        } else {
                            console.log('🔄 Usando fallback');
                            const userData = {
                                id: session.user.id,
                                name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                                email: session.user.email,
                                profile_photo_url: session.user.user_metadata?.profile_photo_url,
                                country_code: 'DOM',
                                role: getRoleFromEmail(session.user.email),
                                lastUpdated: Date.now(),
                                source: 'fallback'
                            };

                            setUser(userData);
                            setIsAuthenticated(true);
                            localStorage.setItem('clic_user', JSON.stringify(userData));
                        }
                    }
                }

                // IMPORTANTE: Siempre llamar setLoading(false) al final del try
                setLoading(false);
            } catch (error) {
                console.error('❌ Error en checkAuth:', error);
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 AUTH STATE CHANGE - Evento:', event);

                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('✅ SIGNED_IN detectado:', session.user.email);

                    if (isProcessingAuth) {
                        console.log('⏭️ Ya procesando autenticación, ignorando evento duplicado');
                        return;
                    }

                    setIsProcessingAuth(true);

                    try {
                        await processUserSession(session, 'SIGNED_IN');
                    } finally {
                        setIsProcessingAuth(false);
                    }
                } else if (event === 'SIGNED_OUT') {
                    console.log('👋 SIGNED_OUT detectado');
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsProcessingAuth(false);
                    setShowProfileMenu(false);
                    localStorage.removeItem('clic_user');
                } else if (event !== 'INITIAL_SESSION') {
                    console.log('ℹ️ Evento de auth no manejado:', event);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [isProcessingAuth]);

    // Efecto para debugging del estado del usuario
    useEffect(() => {
        if (user) {
            const userModules = getUserModules(user);
            console.log('👤 Usuario actualizado:', {
                email: user.email,
                country: user.country_code,
                role: user.roles?.[0]?.name || user.role,
                modules: userModules.length
            });

            console.log('📦 Módulos disponibles:');
            userModules.forEach(module => {
                console.log(`  - ${module.name} (${module.sections?.length || 0} secciones)`);
            });
        }
    }, [user]);

    // Datos reales del dashboard (sin datos mock)
    const dashboardData = {
        stats: {
            new_leads: 0,
            active_properties: 0,
            pending_deals: 0,
            monthly_revenue: 0
        },
        activities: [],
        tasks: []
    };

    // Funciones de navegación
    const handleModuleClick = (moduleId) => {
        const module = modules.find(m => m.id === moduleId);

        // Si el módulo no tiene secciones, navegamos directamente
        if (!module.sections || module.sections.length === 0) {
            setActiveModule(moduleId);
            setCurrentSection(null);
            setHoveredModule(null);
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
            }
        }
        // Si tiene secciones, no hacemos nada, solo el hover manejará el submenu
    };

    const handleDashboardClick = () => {
        setActiveModule('dashboard');
        setCurrentSection(null);
        setHoveredModule(null);
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
    };

    const handleSubmenuClick = (moduleId, sectionId) => {
        if (!permissions.canAccessSection(moduleId, sectionId)) {
            console.warn('Acceso denegado a esta sección');
            return;
        }

        setHoveredModule(null);
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }

        const module = modules.find(m => m.id === moduleId);
        const section = module?.sections?.find(s => s.id === sectionId);
        setActiveModule(moduleId);
        setCurrentSection(section);
    };

    const handleMouseEnter = (moduleId) => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        const timeout = setTimeout(() => {
            setHoveredModule(moduleId);
        }, 150);
        setHoverTimeout(timeout);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        const timeout = setTimeout(() => {
            setHoveredModule(null);
        }, 150);
        setHoverTimeout(timeout);
    };

    const handleProfileClick = () => {
        setShowProfileMenu(false);
        console.log('Abrir perfil del usuario');
    };

    // Renderizar iconos unificados
    const renderIcon = (iconName, className = "w-5 h-5") => {
        const IconComponent = ICONS[iconName];
        return IconComponent ? <IconComponent className={className} /> : null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse bg-white border border-gray-100 shadow-sm">
                        <img
                            src="/clic logo negro.png"
                            alt="CLIC Logo"
                            className="h-8 w-auto"
                        />
                    </div>
                    <p className="text-gray-600 font-medium">Cargando CLIC CRM...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, mostrar la página de login
    if (!isAuthenticated) {
        return (
            <LoginPage
                onLogin={authenticateUser}
                authLoading={authLoading}
                authError={authError}
            />
        );
    }

    return (
        <div className="h-screen bg-white flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-16 bg-gray-900 flex flex-col items-center py-6 relative z-50 flex-shrink-0">
                {/* Logo - Dashboard button */}
                <button
                    onClick={handleDashboardClick}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 mb-8 hover:scale-105"
                    title="Dashboard"
                >
                    <img
                        src={activeModule === 'dashboard' ? '/clic logo on.png' : '/clic logo off.png'}
                        alt="CLIC Logo"
                        className="w-10 h-10 transition-all duration-200"
                    />
                </button>

                {/* Navigation modules */}
                <nav className="flex-1 flex flex-col space-y-2">
                    {modules.filter(module => module.id !== 'dashboard').map((module) => (
                        <div key={module.id} className="relative">
                            <button
                                onClick={() => handleModuleClick(module.id)}
                                onMouseEnter={() => handleMouseEnter(module.id)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${activeModule === module.id
                                        ? 'shadow-lg scale-105'
                                        : 'hover:bg-gray-700 hover:scale-105'
                                    } ${
                                    // Deshabilitar click si tiene subsecciones
                                    module.sections && module.sections.length > 0
                                        ? 'cursor-default'
                                        : 'cursor-pointer'
                                    }`}
                                style={{
                                    background: activeModule === module.id
                                        ? 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)'
                                        : undefined
                                }}
                            >
                                <span className="text-white">
                                    {renderIcon(module.icon)}
                                </span>
                            </button>

                            {/* Submenu */}
                            {hoveredModule === module.id && module.sections && module.sections.length > 0 && (
                                <div
                                    className="absolute left-14 top-0 bg-gray-800 rounded-lg shadow-xl py-2 min-w-48 z-50"
                                    onMouseEnter={() => handleMouseEnter(module.id)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="absolute left-0 top-4 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 -ml-1"></div>

                                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                                        {module.name}
                                    </div>

                                    {module.sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => handleSubmenuClick(module.id, section.id)}
                                            className={`w-full flex items-center px-3 py-3 text-sm transition-colors duration-150 text-left ${currentSection?.id === section.id
                                                    ? 'bg-orange-500 bg-opacity-20 text-white border-r-2'
                                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }`}
                                            style={{
                                                borderRightColor: currentSection?.id === section.id ? '#e03f07' : undefined
                                            }}
                                        >
                                            <span className="mr-3">
                                                {renderIcon(section.icon, "w-4 h-4")}
                                            </span>
                                            {section.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Profile at bottom */}
                <div className="mt-auto pt-4 border-t border-gray-700">
                    <div className="flex flex-col items-center">
                        {/* User Avatar with dropdown menu */}
                        <div className="relative profile-menu-container">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-10 h-10 rounded-full flex items-center justify-center ring-2 cursor-pointer transition-all duration-200 hover:scale-105 overflow-hidden"
                                style={{
                                    background: user?.profile_photo_url
                                        ? 'transparent'
                                        : `linear-gradient(135deg, #e03f07 0%, #c73307 100%)`,
                                    ringColor: 'rgba(224, 63, 7, 0.2)'
                                }}
                            >
                                {user?.profile_photo_url ? (
                                    <img
                                        src={user.profile_photo_url}
                                        alt={user?.name || 'Usuario'}
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <span
                                    className="text-white font-medium text-sm w-full h-full flex items-center justify-center"
                                    style={{
                                        display: user?.profile_photo_url ? 'none' : 'flex'
                                    }}
                                >
                                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                            </button>

                            {/* Dropdown menu */}
                            {showProfileMenu && (
                                <div className="absolute left-16 bottom-0 bg-white rounded-lg shadow-xl py-2 min-w-48 z-50 border border-gray-200">
                                    <div className="absolute right-0 bottom-4 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-white -mr-1"></div>

                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="font-medium text-sm text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-orange-600 font-medium capitalize bg-orange-50 px-2 py-1 rounded">
                                                {user?.roles?.[0]?.display_name || user?.role?.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {user?.country_code}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Menu options */}
                                    <div className="py-1">
                                        <button
                                            onClick={handleProfileClick}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <User className="w-4 h-4 mr-3 text-gray-400" />
                                            Mi Perfil
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                logout();
                                            }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                        >
                                            <LogOut className="w-4 h-4 mr-3 text-red-400" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                    <div className="max-w-full">
                        <SimpleModuleRenderer
                            activeModule={activeModule}
                            currentSection={currentSection}
                            user={user}
                            dashboardData={dashboardData}
                            permissions={permissions}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;