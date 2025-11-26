import React, { useState, useEffect } from 'react';
import { Users, Plus, Filter, Eye, Edit, Trash2, Mail, Phone, Calendar, User, Search, UserPlus, Shield, MapPin, Camera, Upload } from 'lucide-react';
import { Button, Card, Badge, Input, Table, commonClasses } from './ui';

import UserEditPage from './UserEditPage';
import UserCreatePage from './UserCreatePage'; // Importar el nuevo componente simplificado


import { supabase } from '../services/api';

// Componente optimizado para el avatar del usuario
const UserAvatar = React.memo(({ user, onClick, size = 'md' }) => {
    const getInitials = React.useMemo(() => {
        if (!user) return '?';
        
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || '?';
    }, [user?.first_name, user?.last_name, user?.email]);

    const fullName = React.useMemo(() => {
        if (!user) return 'Usuario';
        
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        return `${firstName} ${lastName}`.trim() || user.email || `Usuario ${user.external_id || user.id}`;
    }, [user?.first_name, user?.last_name, user?.email, user?.external_id, user?.id]);

    if (!user) {
        return (
            <div className={`${size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'} rounded-full bg-gray-200 flex items-center justify-center`}>
                <User className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} text-gray-400`} />
            </div>
        );
    }

    const profilePhotoUrl = user.profile_photo_url;

    const AvatarContent = () => (
        <div className="flex items-center space-x-3">
            <div className={`${size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'} rounded-full relative overflow-hidden ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}>
                {profilePhotoUrl ? (
                    <>
                        <img 
                            src={profilePhotoUrl} 
                            alt={fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div 
                            className={`w-full h-full bg-blue-100 flex items-center justify-center`}
                            style={{ display: 'none' }}
                        >
                            <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-bold text-blue-600`}>
                                {getInitials}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <span className={`${size === 'lg' ? 'text-lg' : 'text-sm'} font-bold text-blue-600`}>
                            {getInitials}
                        </span>
                    </div>
                )}
                {onClick && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`${size === 'lg' ? 'text-base' : 'text-sm'} font-medium text-gray-900 truncate`}>
                    {fullName}
                </p>
                {user.email && (
                    <p className={`${size === 'lg' ? 'text-sm' : 'text-sm'} text-gray-500 truncate`}>
                        {user.email}
                    </p>
                )}
                {user.external_id && (
                    <p className="text-xs text-gray-400">
                        ID: {user.external_id}
                    </p>
                )}
            </div>
        </div>
    );

    return onClick ? (
        <div onClick={() => onClick(user)} className="cursor-pointer">
            <AvatarContent />
        </div>
    ) : (
        <AvatarContent />
    );
});

// Función para formatear tiempo relativo
const formatTimeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const diffInMs = now - past;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return '1 día';
    if (diffInDays < 30) return `${diffInDays} días`;
    if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 mes' : `${months} meses`;
    }
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 año' : `${years} años`;
};

const CRMUsers = ({ user, permissions }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Estados para navegación
    const [currentView, setCurrentView] = useState('list'); // 'list', 'edit', 'create'
    const [editingUserId, setEditingUserId] = useState(null);

    // Función optimizada para obtener usuarios del sistema
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🔍 Cargando usuarios del sistema...');

            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    external_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    document_number,
                    role,
                    position,
                    active,
                    show_on_website,
                    profile_photo_url,
                    years_experience,
                    company_start_date,
                    country_code,
                    created_at,
                    updated_at,
                    last_access
                `)
                .order('created_at', { ascending: false });

            if (usersError) {
                console.error('❌ Error obteniendo usuarios:', usersError);
                throw new Error(`Error accediendo a usuarios: ${usersError.message}`);
            }

            console.log(`✅ ${usersData?.length || 0} usuarios cargados del sistema`);
            setUsers(usersData || []);

        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Hook para cargar usuarios
    useEffect(() => {
        fetchUsers();
    }, []);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterStatus]);

    // Filtrar usuarios
    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.external_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = !filterRole || user.role === filterRole;
        const matchesStatus = !filterStatus || (user.active ? 'Activo' : 'Inactivo') === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Manejar selección
    const handleSelectAll = (checked) => {
        setSelectedUsers(checked ? filteredUsers.map(u => u.id) : []);
    };

    const handleSelectUser = (userId, checked) => {
        if (checked) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }
    };

    // Acciones
    const handleUserAction = (action, userId = null) => {
        console.log(`Acción ${action} para usuario ${userId}`);
        
        if (action === 'create') {
            setCurrentView('create');
        } else if (action === 'edit' || action === 'view') {
            setEditingUserId(userId);
            setCurrentView('edit');
        }
    };

    // Manejar clic en fila de usuario
    const handleUserRowClick = (user) => {
        setEditingUserId(user.id);
        setCurrentView('edit');
    };

    // Callback cuando se guarda un usuario
    const handleUserSaved = (updatedUser) => {
        if (currentView === 'create') {
            // Usuario nuevo - agregarlo a la lista
            setUsers(prevUsers => [updatedUser, ...prevUsers]);
        } else {
            // Usuario editado - actualizar en la lista
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === updatedUser.id ? updatedUser : user
                )
            );
        }
        
        // Volver a la lista
        setCurrentView('list');
        setEditingUserId(null);
    };

    // Manejar volver desde páginas de edición/creación
    const handleBackFromEdit = () => {
        setCurrentView('list');
        setEditingUserId(null);
    };

    const handleBulkAction = (action) => {
        console.log(`Acción ${action} para usuarios:`, selectedUsers);
        // TODO: Implementar acciones masivas
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRole('');
        setFilterStatus('');
    };

    // Obtener listas únicas para filtros
    const roles = [...new Set(users.map(u => u.role).filter(Boolean))];
    const statuses = ['Activo', 'Inactivo'];

    // Paginación
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Si estamos en la vista de creación, mostrar la página de creación
    if (currentView === 'create') {
        return (
            <UserCreatePage
                onBack={handleBackFromEdit}
                onSave={handleUserSaved}
            />
        );
    }

    // Si estamos en la vista de edición, mostrar la página de edición
    if (currentView === 'edit' && editingUserId) {
        return (
            <UserEditPage
                userId={editingUserId}
                onBack={handleBackFromEdit}
                onSave={handleUserSaved}
            />
        );
    }

    // Vista de lista
    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando usuarios del sistema...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center max-w-2xl">
                        <div className="text-red-500 mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-red-600 mb-4">Error cargando usuarios</h3>
                        <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
                        </div>
                        <Button variant="primary" onClick={fetchUsers}>
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Usuarios del Sistema</h2>
                    <p className="text-sm text-gray-600">
                        {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
                        {filteredUsers.length !== users.length && ` de ${users.length} totales`}
                    </p>
                </div>
                <Button
                    variant="primary"
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={() => handleUserAction('create')}
                >
                    Nuevo Usuario
                </Button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Input.Search
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onSearch={setSearchTerm}
                        className="flex-1 min-w-64"
                    />
                    <Input.Select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los roles' },
                            ...roles.map(role => ({ value: role, label: role || 'Sin rol' }))
                        ]}
                        className="min-w-40"
                    />
                    <Input.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                            { value: '', label: 'Todos los estados' },
                            ...statuses.map(status => ({ value: status, label: status }))
                        ]}
                        className="min-w-40"
                    />

                    {(searchTerm || filterRole || filterStatus) && (
                        <Button variant="ghost" onClick={clearFilters} size="sm">
                            Limpiar
                        </Button>
                    )}

                    {selectedUsers.length > 0 && (
                        <div className="flex items-center space-x-2 ml-auto">
                            <span className="text-sm text-gray-500">
                                {selectedUsers.length} seleccionados
                            </span>
                            <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                                Exportar
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                                Eliminar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de usuarios */}
            <div className="flex-1 overflow-y-auto">
                {currentUsers.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contacto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rol/Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registrado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentUsers.map((user) => (
                                        <tr 
                                            key={user.id} 
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleUserRowClick(user)}
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <UserAvatar user={user} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {user.email && (
                                                        <div className="flex items-center text-gray-600 mb-1">
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            {user.email}
                                                        </div>
                                                    )}
                                                    {user.phone && (
                                                        <div className="flex items-center text-gray-600 mb-1">
                                                            <Phone className="w-4 h-4 mr-2" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                    {user.external_id && (
                                                        <div className="text-xs text-gray-400">
                                                            ID: {user.external_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <Badge variant="outline" size="sm">
                                                        {user.role || user.position || 'Usuario'}
                                                    </Badge>
                                                    <Badge 
                                                        variant={user.active ? 'success' : 'warning'} 
                                                        size="sm"
                                                    >
                                                        {user.active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {formatTimeAgo(user.created_at)}
                                                </div>
                                                {user.last_access && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Último acceso: {formatTimeAgo(user.last_access)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Eye className="w-4 h-4" />}
                                                        onClick={() => handleUserAction('view', user.id)}
                                                        title="Ver usuario"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Edit className="w-4 h-4" />}
                                                        onClick={() => handleUserAction('edit', user.id)}
                                                        title="Editar usuario"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                <div className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        Anterior
                                    </Button>

                                    <div className="flex space-x-1">
                                        {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                                            let page;
                                            if (totalPages <= 7) {
                                                page = index + 1;
                                            } else if (currentPage <= 4) {
                                                page = index + 1;
                                            } else if (currentPage >= totalPages - 3) {
                                                page = totalPages - 6 + index;
                                            } else {
                                                page = currentPage - 3 + index;
                                            }

                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "primary" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="min-w-[2.5rem]"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Mensaje cuando no hay resultados */
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {users.length === 0 ? 'No hay usuarios en el sistema' : 'No se encontraron usuarios'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {users.length === 0 
                                ? 'Crea el primer usuario del sistema para comenzar.'
                                : 'No hay usuarios que coincidan con los filtros aplicados.'
                            }
                        </p>
                        <div className="space-x-3">
                            <Button
                                variant="primary"
                                onClick={() => handleUserAction('create')}
                            >
                                {users.length === 0 ? 'Crear Primer Usuario' : 'Crear Usuario'}
                            </Button>
                            {users.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                >
                                    Limpiar Filtros
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer con información */}
            <div className="mt-4 text-center text-sm text-gray-600">
                Total de usuarios: {users.length}
                {filteredUsers.length !== users.length && ` • Filtrados: ${filteredUsers.length}`}
                {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
            </div>
        </div>
    );
};

export default CRMUsers;