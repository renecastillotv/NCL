import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, Plus, Trash2, Edit3, RefreshCw, X, Check, 
  AlertCircle, Users, Eye, EyeOff, Search, Loader2
} from 'lucide-react';



import { supabase } from '../services/api';

const EmailAccountsManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemReady, setSystemReady] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Iniciando sistema...');

  // Estados para crear nueva cuenta
  const [newAccount, setNewAccount] = useState({
    username: '', // Solo la parte antes del @
    password: '',
    quota: 0
  });

  // Estados para cambiar contraseña
  const [passwordChange, setPasswordChange] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Función para limpiar mensajes
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Función para mostrar mensajes
  const showMessage = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(message);
      setSuccess('');
    }
  }, []);

  // Inicialización completa del sistema
  const initializeSystem = useCallback(async () => {
    try {
      setLoading(true);
      setSystemReady(false);
      setLoadingMessage('Conectando con MXroute...');

      // Paso 1: Test de conexión
      const { data: connectionData, error: connectionError } = await supabase.functions.invoke('email-manager', {
        body: { action: 'test_connection', data: {} }
      });

      if (connectionError) throw new Error(`Error de conexión: ${connectionError.message}`);
      if (!connectionData?.success) throw new Error(connectionData?.error || 'Error de conexión');

      setLoadingMessage('Autenticando...');

      // Paso 2: Autenticación
      const { data: authData, error: authError } = await supabase.functions.invoke('email-manager', {
        body: { action: 'login', data: {} }
      });

      if (authError) throw new Error(`Error de autenticación: ${authError.message}`);
      if (!authData?.success) throw new Error(authData?.error || 'Error de autenticación');

      setLoadingMessage('Cargando cuentas de email...');

      // Paso 3: Cargar cuentas
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke('email-manager', {
        body: { action: 'list_accounts', data: {} }
      });

      if (accountsError) throw new Error(`Error cargando cuentas: ${accountsError.message}`);
      if (!accountsData?.success) throw new Error(accountsData?.error || 'Error cargando cuentas');

      // Todo exitoso
      setAccounts(accountsData.accounts || []);
      setSystemReady(true);
      const count = accountsData.accounts?.length || 0;
      showMessage(`✅ Sistema listo - ${count} cuenta${count !== 1 ? 's' : ''} cargada${count !== 1 ? 's' : ''}`);

    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
      showMessage(`❌ ${error.message}`, 'error');
      setSystemReady(false);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Efecto de inicialización (solo una vez)
  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  // Validaciones
  const validateUsername = (username) => {
    if (!username) return 'El nombre de usuario es requerido';
    if (username.length < 2) return 'El nombre de usuario debe tener al menos 2 caracteres';
    if (username.length > 32) return 'El nombre de usuario no puede tener más de 32 caracteres';
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) return 'Solo se permiten letras, números, puntos, guiones y guiones bajos';
    if (username.startsWith('.') || username.endsWith('.')) return 'No puede comenzar o terminar con punto';
    if (username.includes('..')) return 'No se permiten puntos consecutivos';
    
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/(?=.*[a-z])/.test(password)) return 'La contraseña debe contener al menos una letra minúscula';
    if (!/(?=.*[A-Z])/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula';
    if (!/(?=.*\d)/.test(password)) return 'La contraseña debe contener al menos un número';
    
    return null;
  };

  // Recargar cuentas
  const reloadAccounts = async () => {
    try {
      setLoading(true);
      clearMessages();

      const { data, error } = await supabase.functions.invoke('email-manager', {
        body: { action: 'list_accounts', data: {} }
      });

      if (error) throw new Error(`Error: ${error.message}`);
      if (!data?.success) throw new Error(data?.error || 'Error cargando cuentas');

      setAccounts(data.accounts || []);
      const count = data.accounts?.length || 0;
      showMessage(`✅ Lista actualizada - ${count} cuenta${count !== 1 ? 's' : ''}`);

    } catch (error) {
      console.error('❌ Error recargando:', error);
      showMessage(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Crear cuenta
  const createAccount = async () => {
    try {
      // Validaciones
      const usernameError = validateUsername(newAccount.username);
      if (usernameError) {
        showMessage(usernameError, 'error');
        return;
      }

      const passwordError = validatePassword(newAccount.password);
      if (passwordError) {
        showMessage(passwordError, 'error');
        return;
      }

      // Construir email completo
      const fullEmail = `${newAccount.username}@clicinmobiliaria.com`;

      // Verificar duplicados
      const exists = accounts.find(acc => acc.email.toLowerCase() === fullEmail.toLowerCase());
      if (exists) {
        showMessage('Ya existe una cuenta con este nombre de usuario', 'error');
        return;
      }

      setLoading(true);
      clearMessages();

      console.log('🔧 Enviando datos a Edge Function:', {
        email: fullEmail,
        quota: newAccount.quota || 0
      });

      const { data, error } = await supabase.functions.invoke('email-manager', {
        body: {
          action: 'create_account',
          data: {
            email: fullEmail,
            password: newAccount.password,
            quota: newAccount.quota || 0
          }
        }
      });

      console.log('📨 Respuesta de Edge Function:', { data, error });

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Error del servidor: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      if (!data.success) {
        console.error('❌ Error en respuesta:', data);
        throw new Error(data.error || 'Error desconocido del servidor');
      }

      // Éxito
      showMessage(`✅ Cuenta ${fullEmail} creada exitosamente`);
      setShowCreateModal(false);
      setNewAccount({ username: '', password: '', quota: 0 });
      setShowPassword(false);
      
      // Recargar lista
      setTimeout(reloadAccounts, 1500);

    } catch (error) {
      console.error('❌ Error completo creando cuenta:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      
      let errorMessage = 'Error creando cuenta';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con el servidor';
      } else if (error.message.includes('Edge Function')) {
        errorMessage = 'Error en el servicio de email';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showMessage(`❌ ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cuenta
  const deleteAccount = async (email) => {
    const confirmed = window.confirm(
      `¿Eliminar la cuenta ${email}?\n\n⚠️ ADVERTENCIA:\n• Se eliminará permanentemente\n• Se perderán todos los emails\n• Esta acción no se puede deshacer\n\n¿Continuar?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      clearMessages();

      const { data, error } = await supabase.functions.invoke('email-manager', {
        body: {
          action: 'delete_account',
          data: { email }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Error eliminando cuenta');

      showMessage(`✅ Cuenta ${email} eliminada exitosamente`);
      setAccounts(prev => prev.filter(acc => acc.email !== email));
      
      setTimeout(reloadAccounts, 1000);

    } catch (error) {
      console.error('❌ Error eliminando:', error);
      showMessage(`❌ Error eliminando cuenta: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const changePassword = async () => {
    try {
      if (!passwordChange.password || !passwordChange.confirmPassword) {
        showMessage('Ambas contraseñas son requeridas', 'error');
        return;
      }

      if (passwordChange.password !== passwordChange.confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
      }

      const passwordError = validatePassword(passwordChange.password);
      if (passwordError) {
        showMessage(passwordError, 'error');
        return;
      }

      setLoading(true);
      clearMessages();

      const { data, error } = await supabase.functions.invoke('email-manager', {
        body: {
          action: 'change_password',
          data: {
            email: passwordChange.email,
            new_password: passwordChange.password
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Error cambiando contraseña');

      showMessage(`✅ Contraseña actualizada para ${passwordChange.email}`);
      setShowPasswordModal(false);
      setPasswordChange({ email: '', password: '', confirmPassword: '' });
      setShowPassword(false);
      setShowConfirmPassword(false);

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modales
  const openCreateModal = () => {
    if (!systemReady) {
      showMessage('⚠️ Sistema no está listo. Espera un momento...', 'error');
      return;
    }
    clearMessages();
    setNewAccount({ username: '', password: '', quota: 0 });
    setShowPassword(false);
    setShowCreateModal(true);
  };

  const openPasswordModal = (account) => {
    if (!systemReady) {
      showMessage('⚠️ Sistema no está listo. Espera un momento...', 'error');
      return;
    }
    clearMessages();
    setSelectedAccount(account);
    setPasswordChange({ email: account.email, password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Formatear cuota
  const formatQuota = (used, limit) => {
    if (!limit || limit === 0) return 'Sin límite';
    return `${used || 0} / ${limit} MB`;
  };

  const getQuotaPercentage = (used, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min((used || 0) / limit * 100, 100);
  };

  // Filtrar cuentas
  const filteredAccounts = accounts.filter(account => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return account.email.toLowerCase().includes(term) || 
           account.username.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <Mail className="w-8 h-8 text-orange-500" />
          <span>Administrador de Cuentas de Email</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona las cuentas de correo de @clicinmobiliaria.com
        </p>
      </div>

      {/* Status */}
      {loading && !systemReady && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-700 font-medium">{loadingMessage}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-red-700 font-medium">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-start space-x-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-green-700 font-medium">{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {systemReady && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Cuentas de Email ({filteredAccounts.length})</span>
            </h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cuentas..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={reloadAccounts}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            <button
              onClick={openCreateModal}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta</span>
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {systemReady && (
        <>
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron cuentas' : 'No hay cuentas creadas'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No hay cuentas que coincidan con "${searchTerm}"`
                  : 'Crea tu primera cuenta de correo para comenzar'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                >
                  Crear Primera Cuenta
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAccounts.map((account, index) => (
                <div key={`${account.email}-${index}`} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{account.email}</h4>
                        <p className="text-gray-600">Usuario: {account.username}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Activo</span>
                          </span>
                          {account.created_at && (
                            <span>Creada: {formatDate(account.created_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Quota */}
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatQuota(account.quota_used, account.quota_limit)}
                        </div>
                        {account.quota_limit && account.quota_limit > 0 && (
                          <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300"
                              style={{ width: `${getQuotaPercentage(account.quota_used, account.quota_limit)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openPasswordModal(account)}
                          disabled={loading}
                          className="p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 group disabled:opacity-50"
                          title="Cambiar contraseña"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                        </button>
                        <button 
                          onClick={() => deleteAccount(account.email)}
                          disabled={loading}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 group disabled:opacity-50"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nueva Cuenta de Email</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAccount({ username: '', password: '', quota: 0 });
                  setShowPassword(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({...newAccount, username: e.target.value.toLowerCase()})}
                    placeholder="usuario"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm">
                    @clicinmobiliaria.com
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras, números, puntos, guiones y guiones bajos
                </p>
                {newAccount.username && (
                  <p className="text-xs text-blue-600 mt-1">
                    📧 Email completo: <strong>{newAccount.username}@clicinmobiliaria.com</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Segura *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                    placeholder="Mínimo 8 caracteres, mayúsculas, minúsculas y números"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Debe incluir mayúsculas, minúsculas, números y al menos 8 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuota de Almacenamiento
                </label>
                <select
                  value={newAccount.quota}
                  onChange={(e) => setNewAccount({...newAccount, quota: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={0}>Sin límite (recomendado)</option>
                  <option value={500}>500 MB</option>
                  <option value={1000}>1 GB</option>
                  <option value={2000}>2 GB</option>
                  <option value={5000}>5 GB</option>
                  <option value={10000}>10 GB</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAccount({ username: '', password: '', quota: 0 });
                    setShowPassword(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAccount}
                  disabled={loading || !newAccount.username || !newAccount.password}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando...</span>
                    </span>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedAccount(null);
                  setPasswordChange({ email: '', password: '', confirmPassword: '' });
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cuenta:</span> {selectedAccount?.email}
              </p>
            </div>

            {/* Modal Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordChange.password}
                    onChange={(e) => setPasswordChange({...passwordChange, password: e.target.value})}
                    placeholder="Mínimo 8 caracteres con mayúsculas, minúsculas y números"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordChange.confirmPassword}
                    onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                    placeholder="Repite la nueva contraseña"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordChange.password && passwordChange.confirmPassword && 
               passwordChange.password !== passwordChange.confirmPassword && (
                <div className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Las contraseñas no coinciden</span>
                </div>
              )}

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedAccount(null);
                    setPasswordChange({ email: '', password: '', confirmPassword: '' });
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={changePassword}
                  disabled={loading || !passwordChange.password || !passwordChange.confirmPassword || passwordChange.password !== passwordChange.confirmPassword}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </span>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAccountsManager;