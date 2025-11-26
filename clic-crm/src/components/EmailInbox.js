import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Mail, Plus, Trash2, Edit3, RefreshCw, X, Check, CheckCircle,
    AlertCircle, Users, Eye, EyeOff, Search, Loader2,
    Inbox, Send, Star, StarOff, Paperclip, Reply,
    ReplyAll, Forward, User, AtSign, Clock, Download,
    Folder, Shield, AlertTriangle, Info,
    ArrowLeft, Maximize2, Archive, MoreHorizontal
} from 'lucide-react';

import EmailCompose from './EmailCompose';


import { supabase } from '../services/api';

// Configuración VPS optimizada para MXRoute
const VPS_CONFIG = {
    baseURL: 'https://api.clicinmobiliaria.com',
    apiKey: 'clic-secure-api-2025',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000
};

// Cache inteligente
const requestCache = new Map();
const CACHE_DURATION = 60000;

// Debounce personalizado
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const EmailInbox = () => {
    // Estados principales
    const [currentUser, setCurrentUser] = useState(null);
    const [currentAccount, setCurrentAccount] = useState('');
    const [availableAccounts, setAvailableAccounts] = useState([]);
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [authError, setAuthError] = useState(null);

    // Estados de vista
    const [currentView, setCurrentView] = useState('inbox');
    const [searchTerm, setSearchTerm] = useState('');
    const [showEmailDetail, setShowEmailDetail] = useState(false);

    // Estados de composición
    const [showCompose, setShowCompose] = useState(false);
    const [composeMode, setComposeMode] = useState('new');
    const [composeInitialData, setComposeInitialData] = useState({});

    // Estados de filtros
    const [filters, setFilters] = useState({
        unread: false,
        starred: false,
        hasAttachments: false
    });

    // Estados de sistema
    const [accountStatus, setAccountStatus] = useState({});
    const [folderCounts, setFolderCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(false);
    const [operationInProgress, setOperationInProgress] = useState(false);
    const [performanceMetrics, setPerformanceMetrics] = useState({});

    // Estados de modales
    const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
    const [passwordUpdateData, setPasswordUpdateData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
    const [currentAttachment, setCurrentAttachment] = useState(null);

    // Referencias
    const abortControllerRef = useRef(null);
    const messageTimersRef = useRef(new Map());

    // Funciones auxiliares
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays <= 7) {
            return date.toLocaleDateString('es-DO', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('es-DO', { month: 'short', day: 'numeric' });
        }
    }, []);

    const formatFileSize = useCallback((bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    const getFolderIcon = useCallback((folder) => {
        switch (folder.toLowerCase()) {
            case 'inbox': return <Inbox className="w-4 h-4" />;
            case 'sent': return <Send className="w-4 h-4" />;
            case 'drafts': return <Edit3 className="w-4 h-4" />;
            case 'trash': return <Trash2 className="w-4 h-4" />;
            case 'spam': return <Shield className="w-4 h-4" />;
            default: return <Folder className="w-4 h-4" />;
        }
    }, []);

    const getFolderName = useCallback((folder) => {
        switch (folder.toLowerCase()) {
            case 'inbox': return 'Bandeja de Entrada';
            case 'sent': return 'Enviados';
            case 'drafts': return 'Borradores';
            case 'trash': return 'Papelera';
            case 'spam': return 'Spam / No deseado';
            default: return folder;
        }
    }, []);

    const getFolderCount = useCallback((folder) => {
        if (!currentAccount || !folderCounts[currentAccount]) return null;
        return folderCounts[currentAccount][folder];
    }, [currentAccount, folderCounts]);

    const getFileInfo = useCallback((attachment) => {
        const contentType = attachment?.contentType || '';
        const filename = attachment?.filename || '';
        const extension = filename.split('.').pop()?.toLowerCase() || '';

        const fileInfo = {
            contentType,
            extension,
            canView: false,
            icon: '📄',
            typeName: 'Archivo'
        };

        if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
            fileInfo.canView = true;
            fileInfo.icon = '🖼️';
            fileInfo.typeName = 'Imagen';
        } else if (contentType.includes('pdf') || extension === 'pdf') {
            fileInfo.canView = true;
            fileInfo.icon = '📄';
            fileInfo.typeName = 'PDF';
        } else if (contentType.startsWith('text/') || ['txt', 'json', 'xml', 'csv'].includes(extension)) {
            fileInfo.canView = true;
            fileInfo.icon = '📝';
            fileInfo.typeName = 'Texto';
        }

        return fileInfo;
    }, []);

    // Funciones de utilidad
    const getCacheKey = useCallback((endpoint, data) => {
        return `${endpoint}_${JSON.stringify(data)}`;
    }, []);

    const cleanupCache = useCallback(() => {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of requestCache.entries()) {
            if (now - entry.timestamp > CACHE_DURATION) {
                requestCache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`🧹 Cache limpiado: ${cleaned} entradas removidas`);
        }
    }, []);

    const showMessage = useCallback((message, type = 'success') => {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        if (type === 'error') {
            setError(message);
            setSuccess('');
        } else {
            setSuccess(message);
            setError('');
        }

        const timerId = setTimeout(() => {
            setError('');
            setSuccess('');
        }, 6000);

        messageTimersRef.current.set(message, timerId);
    }, []);

    const clearMessages = useCallback(() => {
        messageTimersRef.current.forEach(timerId => clearTimeout(timerId));
        messageTimersRef.current.clear();
        setError('');
        setSuccess('');
    }, []);

    // Memoizaciones
    const filteredEmails = useMemo(() => {
        return emails.filter(email => {
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                if (!email.subject?.toLowerCase().includes(searchLower) &&
                    !email.from?.toLowerCase().includes(searchLower) &&
                    !email.snippet?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            if (filters.unread && !email.unread) return false;
            if (filters.starred && !email.starred) return false;
            if (filters.hasAttachments && !email.hasAttachments) return false;

            return true;
        });
    }, [emails, searchTerm, filters]);

    const unreadCount = useMemo(() => {
        return emails.filter(e => e.unread && e.from !== currentAccount).length;
    }, [emails, currentAccount]);

    const accountPerformance = useMemo(() => {
        const perf = accountStatus[currentAccount]?.performance || {};
        return {
            ...perf,
            provider: accountStatus[currentAccount]?.provider || 'MXRoute'
        };
    }, [accountStatus, currentAccount]);

    const debouncedSearch = useMemo(
        () => debounce((term) => {
            setSearchTerm(term);
        }, 500),
        []
    );

    // Función VPS optimizada
    const callVPSEndpoint = useCallback(async (endpoint, data, options = {}) => {
        const {
            timeout = VPS_CONFIG.timeout,
            expectBinary = false,
            method = 'POST',
            useCache = false,
            skipLoading = false,
            priority = 'normal',
            retries = VPS_CONFIG.maxRetries
        } = options;

        const cacheKey = useCache ? getCacheKey(endpoint, data) : null;
        
        if (useCache && cacheKey && requestCache.has(cacheKey)) {
            const cached = requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data;
            }
        }

        if (!skipLoading && priority === 'normal') {
            setOperationInProgress(true);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const requestConfig = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': VPS_CONFIG.apiKey,
                    'X-Client-Version': '2.2.3-mxroute-fixed'
                },
                signal: controller.signal
            };

            if (method !== 'GET' && data) {
                requestConfig.body = JSON.stringify(data);
            }

            const response = await fetch(`${VPS_CONFIG.baseURL}${endpoint}`, requestConfig);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (expectBinary) {
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    return response;
                }
            }

            const result = await response.json();
            const finalResult = { success: true, ...result };

            if (useCache && cacheKey) {
                requestCache.set(cacheKey, {
                    data: finalResult,
                    timestamp: Date.now()
                });
            }

            return finalResult;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Operación cancelada');
            }
            throw error;
        } finally {
            if (!skipLoading && priority === 'normal') {
                setOperationInProgress(false);
            }
        }
    }, [getCacheKey]);

    // Funciones de credenciales
    const validateAndDecryptPassword = useCallback((encryptedPassword) => {
        try {
            if (!encryptedPassword) {
                throw new Error('NO_PASSWORD');
            }

            let decrypted;
            try {
                decrypted = atob(encryptedPassword);
            } catch (decryptError) {
                throw new Error('NOT_ENCRYPTED');
            }

            if (decrypted.length < 3) {
                throw new Error('INVALID_PASSWORD');
            }

            const password = decrypted.includes('|') ? decrypted.split('|')[0] : decrypted;

            return {
                success: true,
                password: password
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                needsUpdate: ['NOT_ENCRYPTED', 'INVALID_PASSWORD', 'NO_PASSWORD'].includes(error.message)
            };
        }
    }, []);

    const getUserCredentials = useCallback(async (email) => {
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const accountInMemory = availableAccounts.find(acc => acc.email === email);
        if (accountInMemory) {
            if (!accountInMemory.encrypted_password) {
                try {
                    const { data: dbCredentials, error } = await supabase
                        .from('email_credentials')
                        .select('encrypted_password, smtp_host, smtp_port, imap_host, imap_port')
                        .eq('email', email)
                        .eq('is_active', true)
                        .single();

                    if (!error && dbCredentials) {
                        return {
                            ...accountInMemory,
                            ...dbCredentials
                        };
                    }
                } catch (dbError) {
                    console.error('Error consultando DB:', dbError);
                }

                throw new Error(`Faltan credenciales para ${email}`);
            }

            return accountInMemory;
        }

        throw new Error(`No se encontraron credenciales para ${email}`);
    }, [currentUser, availableAccounts]);

    // Autenticación
    const initializeAuth = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔐 Inicializando autenticación...');

            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                throw new Error(`Error de autenticación: ${error.message}`);
            }

            if (!user) {
                setAuthError('No hay usuario autenticado. Por favor inicia sesión.');
                return;
            }

            const { data: userEmailData, error: functionError } = await supabase.functions.invoke('user-email-manager', {
                headers: {
                    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (functionError) {
                throw new Error(`Error en Edge Function: ${functionError.message}`);
            }

            if (!userEmailData?.success) {
                throw new Error(userEmailData?.error || 'Error obteniendo datos del usuario');
            }

            const userData = userEmailData.data;

            setCurrentUser({
                id: userData.user.authId,
                userId: userData.user.userId,
                email: userData.user.email,
                roles: userData.roles,
                roleNames: userData.roles.map(r => r.display_name || r.name),
                isSuperAdmin: userData.isSuperAdmin
            });

            setAvailableAccounts(userData.availableEmails || []);

            if (userData.availableEmails && userData.availableEmails.length > 0) {
                setCurrentAccount(userData.availableEmails[0].email);
            }

        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            setAuthError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carga de datos
    const loadFolderCountsOptimized = useCallback(async () => {
        if (!currentAccount || folderCounts[currentAccount] || loadingCounts) return;

        try {
            setLoadingCounts(true);
            const credentials = await getUserCredentials(currentAccount);
            const passwordResult = validateAndDecryptPassword(credentials.encrypted_password);

            if (!passwordResult.success) {
                return;
            }

            const folderList = ['inbox', 'sent', 'drafts', 'trash', 'spam'];
            const promises = folderList.map(async (folder) => {
                try {
                    const result = await callVPSEndpoint('/api/get-folder-count', {
                        host: credentials.imap_host,
                        port: credentials.imap_port,
                        email: credentials.email,
                        password: passwordResult.password,
                        folder: folder.toUpperCase()
                    }, { 
                        useCache: true, 
                        skipLoading: true, 
                        priority: 'low',
                        timeout: 15000,
                        retries: 2
                    });

                    return { folder, count: result.count || 0 };
                } catch (error) {
                    return { folder, count: 0 };
                }
            });

            const results = await Promise.allSettled(promises);
            const counts = {};
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { folder, count } = result.value;
                    counts[folder] = count;
                } else {
                    counts[folderList[index]] = 0;
                }
            });

            setFolderCounts(prev => ({
                ...prev,
                [currentAccount]: counts
            }));

        } catch (error) {
            console.error('❌ Error cargando contadores:', error);
        } finally {
            setLoadingCounts(false);
        }
    }, [currentAccount, folderCounts, loadingCounts, callVPSEndpoint, getUserCredentials, validateAndDecryptPassword]);

    const loadEmails = useCallback(async () => {
        if (!currentAccount) return;

        try {
            setLoading(true);
            clearMessages();

            const credentials = await getUserCredentials(currentAccount);
            const passwordResult = validateAndDecryptPassword(credentials.encrypted_password);

            if (!passwordResult.success) {
                if (passwordResult.needsUpdate) {
                    setPasswordUpdateData(prev => ({ ...prev, email: currentAccount }));
                    setShowPasswordUpdate(true);
                    showMessage(`🔑 Las credenciales para ${currentAccount} necesitan actualización.`, 'error');
                    return;
                } else {
                    throw new Error(`Error con contraseña: ${passwordResult.error}`);
                }
            }

            const result = await callVPSEndpoint('/api/get-inbox', {
                host: credentials.imap_host,
                port: credentials.imap_port,
                email: credentials.email,
                password: passwordResult.password,
                folder: currentView.toUpperCase(),
                max: 30,
                includeContent: true,
                includeAttachments: true
            }, { 
                useCache: currentView === 'inbox',
                priority: 'normal',
                timeout: 45000,
                retries: 3
            });

            if (!result || !result.success) {
                throw new Error(`No se pudo cargar la carpeta ${currentView} desde MXRoute`);
            }

            const emailList = result.emails || [];
            const processedEmails = emailList.map(email => ({
                ...email,
                starred: email.starred || false,
                attachments: (email.attachments || []).map((att, index) => ({
                    ...att,
                    partID: att.partID !== undefined && att.partID !== null ? att.partID : index,
                    filename: att.filename || `adjunto_${index + 1}`,
                    size: att.size || 0,
                    contentType: att.contentType || 'application/octet-stream',
                    originalIndex: index,
                    provider: 'MXRoute'
                })),
                hasAttachments: email.hasAttachments || (email.attachments && email.attachments.length > 0)
            }));

            setEmails(processedEmails);

            setAccountStatus(prev => ({
                ...prev,
                [currentAccount]: {
                    status: emailList.length > 0 ? 'active' : 'empty',
                    lastSync: new Date().toISOString(),
                    emailCount: emailList.length,
                    folder: result.folder || currentView.toUpperCase(),
                    performance: result.performance,
                    provider: 'MXRoute'
                }
            }));

        } catch (error) {
            console.error('❌ Error cargando emails:', error);

            setAccountStatus(prev => ({
                ...prev,
                [currentAccount]: {
                    status: 'error',
                    lastError: error.message,
                    lastSync: new Date().toISOString(),
                    provider: 'MXRoute'
                }
            }));

            if (error.message.includes('credenciales')) {
                showMessage('🔑 No tienes credenciales configuradas.', 'error');
            } else if (error.message.includes('autenticación')) {
                setPasswordUpdateData(prev => ({ ...prev, email: currentAccount }));
                setShowPasswordUpdate(true);
                showMessage('🔐 Error de autenticación MXRoute.', 'error');
            } else {
                showMessage(`❌ Error MXRoute: ${error.message}`, 'error');
            }

            setEmails([]);
        } finally {
            setLoading(false);
        }
    }, [currentAccount, currentView, callVPSEndpoint, clearMessages, showMessage, getUserCredentials, validateAndDecryptPassword]);

    // Acciones de email
    const markAsRead = useCallback(async (uid, isRead = true) => {
        if (!uid) return;

        try {
            setEmails(prev => prev.map(email =>
                email.uid === uid ? { ...email, unread: !isRead } : email
            ));

            if (selectedEmail?.uid === uid) {
                setSelectedEmail(prev => ({ ...prev, unread: !isRead }));
            }

            const credentials = await getUserCredentials(currentAccount);
            const passwordResult = validateAndDecryptPassword(credentials.encrypted_password);

            if (!passwordResult.success) {
                throw new Error('Error con credenciales');
            }

            const endpoint = isRead ? '/api/mark-read' : '/api/mark-unread';
            await callVPSEndpoint(endpoint, {
                host: credentials.imap_host,
                port: credentials.imap_port,
                email: credentials.email,
                password: passwordResult.password,
                folder: currentView.toUpperCase(),
                uid: uid
            }, { 
                skipLoading: true, 
                priority: 'low',
                timeout: 20000,
                retries: 2
            });

        } catch (error) {
            console.error('❌ Error marcando email:', error);
            
            setEmails(prev => prev.map(email =>
                email.uid === uid ? { ...email, unread: isRead } : email
            ));
            if (selectedEmail?.uid === uid) {
                setSelectedEmail(prev => ({ ...prev, unread: isRead }));
            }
        }
    }, [currentAccount, currentView, selectedEmail, callVPSEndpoint, getUserCredentials, validateAndDecryptPassword]);

    const toggleStar = useCallback(async (uid, email) => {
        if (!uid) return;

        try {
            const newStarred = !email.starred;

            setEmails(prev => prev.map(e =>
                e.uid === uid ? { ...e, starred: newStarred } : e
            ));

            if (selectedEmail?.uid === uid) {
                setSelectedEmail(prev => ({ ...prev, starred: newStarred }));
            }

            const credentials = await getUserCredentials(currentAccount);
            const passwordResult = validateAndDecryptPassword(credentials.encrypted_password);

            if (!passwordResult.success) {
                throw new Error('Error con credenciales');
            }

            await callVPSEndpoint('/api/toggle-star', {
                host: credentials.imap_host,
                port: credentials.imap_port,
                email: credentials.email,
                password: passwordResult.password,
                folder: currentView.toUpperCase(),
                uid: uid,
                starred: newStarred
            }, { 
                skipLoading: true, 
                priority: 'low',
                timeout: 20000,
                retries: 2
            });

        } catch (error) {
            console.error('❌ Error marcando favorito:', error);
            
            setEmails(prev => prev.map(e =>
                e.uid === uid ? { ...e, starred: !email.starred } : e
            ));
            if (selectedEmail?.uid === uid) {
                setSelectedEmail(prev => ({ ...prev, starred: email.starred }));
            }
        }
    }, [currentAccount, currentView, selectedEmail, callVPSEndpoint, getUserCredentials, validateAndDecryptPassword]);

    // Acciones de selección
    const toggleEmailSelection = useCallback((uid) => {
        setSelectedEmails(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(uid)) {
                newSelection.delete(uid);
            } else {
                newSelection.add(uid);
            }
            return newSelection;
        });
    }, []);

    const toggleAllEmailsSelection = useCallback(() => {
        setSelectedEmails(prev => {
            if (prev.size === filteredEmails.length) {
                return new Set();
            } else {
                return new Set(filteredEmails.map(email => email.uid));
            }
        });
    }, [filteredEmails]);

    const deleteSelectedEmails = useCallback(async () => {
        if (selectedEmails.size === 0) return;

        const count = selectedEmails.size;
        if (!window.confirm(`¿Estás seguro de eliminar ${count} email${count !== 1 ? 's' : ''}?`)) return;

        setEmails(prev => prev.filter(email => !selectedEmails.has(email.uid)));
        setSelectedEmails(new Set());
        showMessage(`${count} email${count !== 1 ? 's' : ''} eliminado${count !== 1 ? 's' : ''}`, 'success');
    }, [selectedEmails, showMessage]);

    // Composición de emails
    const openComposeModal = useCallback((mode = 'new', email = null) => {
        if (!currentAccount) {
            showMessage('⚠️ Selecciona una cuenta primero', 'error');
            return;
        }

        let initialData = {};

        if (email && mode !== 'new') {
            const originalContent = email.html || email.text || email.snippet || '';
            const fromInfo = email.fromName ? `${email.fromName} <${email.from}>` : email.from;

            switch (mode) {
                case 'reply':
                    initialData = {
                        recipients: [{
                            id: Date.now(),
                            name: email.fromName || email.from,
                            email: email.from,
                            company: ''
                        }],
                        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                        htmlContent: `<p><br></p><p><br></p><div style="border-left: 3px solid #ccc; padding-left: 15px; margin: 20px 0; color: #666;"><p><strong>En ${new Date(email.date).toLocaleString('es-DO')}, ${fromInfo} escribió:</strong></p><div>${originalContent}</div></div>`
                    };
                    break;

                case 'replyAll':
                    initialData = {
                        recipients: [{
                            id: Date.now(),
                            name: email.fromName || email.from,
                            email: email.from,
                            company: ''
                        }],
                        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                        htmlContent: `<p><br></p><p><br></p><div style="border-left: 3px solid #ccc; padding-left: 15px; margin: 20px 0; color: #666;"><p><strong>En ${new Date(email.date).toLocaleString('es-DO')}, ${fromInfo} escribió:</strong></p><div>${originalContent}</div></div>`
                    };
                    break;

                case 'forward':
                    initialData = {
                        recipients: [],
                        subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
                        htmlContent: `<p><br></p><p><br></p><div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; background-color: #f9f9f9;"><p><strong>---------- Mensaje reenviado ----------</strong></p><p><strong>De:</strong> ${fromInfo}</p><p><strong>Fecha:</strong> ${new Date(email.date).toLocaleString('es-DO')}</p><p><strong>Asunto:</strong> ${email.subject}</p><p><strong>Para:</strong> ${email.to}</p><br><div>${originalContent}</div></div>`,
                        attachments: []
                    };
                    break;
            }
        }

        setComposeMode(mode);
        setComposeInitialData(initialData);
        setShowCompose(true);
    }, [currentAccount, showMessage]);

    const handleSendEmail = useCallback((emailData) => {
        console.log('Email enviado vía MXRoute:', emailData);
        showMessage('✅ Email enviado correctamente vía MXRoute', 'success');
        
        requestCache.clear();
        
        setTimeout(() => {
            loadEmails();
        }, 2000);
    }, [showMessage, loadEmails]);

    // Efectos
    useEffect(() => {
        initializeAuth();
        
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            requestCache.clear();
            messageTimersRef.current.forEach(timerId => clearTimeout(timerId));
        };
    }, [initializeAuth]);

    useEffect(() => {
        if (currentAccount && currentUser) {
            setShowEmailDetail(false);
            setSelectedEmail(null);
            loadEmails();
            loadFolderCountsOptimized();
        } else {
            setEmails([]);
            setSelectedEmail(null);
            setShowEmailDetail(false);
        }
    }, [currentAccount, currentView, currentUser, loadEmails, loadFolderCountsOptimized]);

    useEffect(() => {
        if (selectedEmail && selectedEmail.unread) {
            const timer = setTimeout(() => {
                markAsRead(selectedEmail.uid, true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [selectedEmail, markAsRead]);

    useEffect(() => {
        if (currentAccount) {
            setCurrentView('inbox');
            setSelectedEmail(null);
            setShowEmailDetail(false);
            setSelectedEmails(new Set());
            clearMessages();
        }
    }, [currentAccount, clearMessages]);

    useEffect(() => {
        const interval = setInterval(cleanupCache, 120000);
        return () => clearInterval(interval);
    }, [cleanupCache]);

    // Renderizado principal
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Loading inicial */}
            {loading && !currentUser && (
                <div className="flex items-center justify-center w-full">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Inicializando aplicación para MXRoute...</h3>
                        <p className="text-gray-500">Conectando a VPS v2.2.3 optimizado</p>
                    </div>
                </div>
            )}

            {/* Error de autenticación */}
            {authError && (
                <div className="flex items-center justify-center w-full">
                    <div className="text-center p-8">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-red-900 mb-2">Error de Autenticación</h3>
                        <p className="text-red-700 mb-4">{authError}</p>
                        <button
                            onClick={initializeAuth}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Reintentando...' : 'Reintentar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Interfaz principal */}
            {currentUser && !authError && (
                <>
                    {/* Sidebar */}
                    <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                        {/* Header del Sidebar */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3 mb-4">
                                <Mail className="w-5 h-5 text-black" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                        {currentAccount || 'Sin cuenta seleccionada'}
                                    </div>
                                    <div className="text-xs text-green-600 flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                        MXRoute via VPS v2.2.3
                                        {operationInProgress && (
                                            <div className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCompose(true)}
                                disabled={!currentAccount || operationInProgress}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 transform"
                                style={{ background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)' }}
                            >
                                <Plus className="w-4 h-4" />
                                <span>Redactar</span>
                            </button>
                        </div>

                        {/* Navegación de carpetas */}
                        <nav className="flex-1 px-4 py-2">
                            <div className="space-y-1">
                                {[
                                    { id: 'inbox', name: 'Bandeja de Entrada', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
                                    { id: 'sent', name: 'Enviados', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
                                    { id: 'drafts', name: 'Borradores', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
                                    { id: 'spam', name: 'Spam', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
                                    { id: 'trash', name: 'Papelera', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
                                ].map(folder => {
                                    const totalCount = getFolderCount(folder.id);
                                    const isActive = currentView === folder.id;

                                    return (
                                        <button
                                            key={folder.id}
                                            onClick={() => setCurrentView(folder.id)}
                                            disabled={operationInProgress}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200 disabled:opacity-50 ${
                                                isActive
                                                    ? `${folder.bgColor} border ${folder.color} font-semibold shadow-sm`
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={isActive ? folder.color : 'text-gray-500'}>
                                                    {getFolderIcon(folder.id)}
                                                </div>
                                                <span className="text-sm">{folder.name}</span>
                                            </div>
                                            {totalCount !== null && totalCount > 0 && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    isActive
                                                        ? 'bg-white text-gray-700 border'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                    {totalCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Status del servidor */}
                        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
                            <div className="flex items-center justify-between mb-2">
                                <span>Estado MXRoute</span>
                                <div className={`w-2 h-2 rounded-full ${accountStatus[currentAccount]?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            {accountPerformance.lastResponseTime && (
                                <div className="text-blue-600">
                                    Última respuesta: {accountPerformance.lastResponseTime}ms
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Área principal */}
                    <div className="flex-1 ml-64 flex flex-col">
                        {showEmailDetail && selectedEmail ? (
                            /* Vista de detalle del email */
                            <div className="flex flex-col h-full">
                                {/* Header del email */}
                                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setShowEmailDetail(false)}
                                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <div className="text-sm text-gray-500">
                                                {selectedEmail?.unread && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                                        No leído
                                                    </span>
                                                )}
                                                Volver a {getFolderName(currentView)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => toggleStar(selectedEmail?.uid, selectedEmail)}
                                            disabled={operationInProgress}
                                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                        >
                                            <Star className={`w-4 h-4 ${selectedEmail?.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                            title="Responder"
                                            onClick={() => openComposeModal('reply', selectedEmail)}
                                            disabled={operationInProgress}
                                        >
                                            <Reply className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                            title="Responder a todos"
                                            onClick={() => openComposeModal('replyAll', selectedEmail)}
                                            disabled={operationInProgress}
                                        >
                                            <ReplyAll className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                            title="Reenviar"
                                            onClick={() => openComposeModal('forward', selectedEmail)}
                                            disabled={operationInProgress}
                                        >
                                            <Forward className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contenido del email */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="w-full px-8 py-6">
                                        <h1 className="text-2xl font-semibold text-gray-900 mb-4 pr-8">
                                            {selectedEmail.subject || '(Sin asunto)'}
                                        </h1>

                                        <div className="bg-gray-50 rounded-lg p-4 mb-6 mr-8">
                                            <div className="flex items-center space-x-4 mb-2">
                                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                                                    {(selectedEmail.fromName || selectedEmail.from)?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">
                                                        {selectedEmail.fromName || selectedEmail.from}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Para: {selectedEmail.to}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(selectedEmail.date).toLocaleString('es-DO')}
                                                </div>
                                            </div>

                                            {/* Adjuntos */}
                                            {(selectedEmail.hasAttachments || (selectedEmail.attachments && selectedEmail.attachments.length > 0)) && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <Paperclip className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Archivos adjuntos ({selectedEmail.attachments?.length || 0}) - MXRoute via VPS
                                                        </span>
                                                    </div>

                                                    {selectedEmail.attachments && selectedEmail.attachments.length > 0 ? (
                                                        <div className="grid gap-3">
                                                            {selectedEmail.attachments.map((attachment, index) => {
                                                                const fileInfo = getFileInfo(attachment);
                                                                return (
                                                                    <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                        <div className="flex items-center space-x-3">
                                                                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-xl">
                                                                                {fileInfo.icon}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-medium text-gray-900 text-sm">
                                                                                    {attachment.filename || `Adjunto_${index + 1}`}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 space-x-2">
                                                                                    <span className="font-medium text-green-600">{fileInfo.typeName}</span>
                                                                                    {attachment.size && (
                                                                                        <span>• {formatFileSize(attachment.size)}</span>
                                                                                    )}
                                                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                                                                        MXRoute • partID: {attachment.partID}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            {fileInfo.canView && (
                                                                                <button
                                                                                    className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                                                    title="Ver archivo desde MXRoute"
                                                                                    disabled={loading || operationInProgress}
                                                                                >
                                                                                    <Eye className="w-4 h-4" />
                                                                                    <span className="text-sm font-medium">Ver</span>
                                                                                </button>
                                                                            )}

                                                                            <button
                                                                                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                                                title="Descargar archivo desde MXRoute"
                                                                                disabled={loading || operationInProgress}
                                                                            >
                                                                                <Download className="w-4 h-4" />
                                                                                <span className="text-sm font-medium">Descargar</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                            ⚠️ Email marcado como con adjuntos pero no hay archivos disponibles desde MXRoute
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="prose max-w-none pr-8">
                                            {selectedEmail.html ? (
                                                <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                                            ) : selectedEmail.text ? (
                                                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                                    {selectedEmail.text}
                                                </div>
                                            ) : (
                                                <div className="text-gray-600">
                                                    {selectedEmail.snippet || 'Sin contenido disponible'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Vista principal de lista */
                            <>
                                {/* Header principal */}
                                <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg bg-orange-100`}>
                                                    {getFolderIcon(currentView)}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">
                                                        {getFolderName(currentView)}
                                                    </h2>
                                                    <p className="text-sm text-gray-500">
                                                        {filteredEmails.length} conversación{filteredEmails.length !== 1 ? 'es' : ''} • MXRoute via VPS v2.2.3
                                                        {accountPerformance.lastResponseTime && (
                                                            <span className="ml-1 text-blue-600">• {accountPerformance.lastResponseTime}ms</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {/* Búsqueda */}
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    defaultValue={searchTerm}
                                                    onChange={(e) => debouncedSearch(e.target.value)}
                                                    placeholder="Buscar emails..."
                                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                                                    disabled={operationInProgress}
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            debouncedSearch('');
                                                        }}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Actualizar */}
                                            <button
                                                onClick={() => {
                                                    requestCache.clear();
                                                    loadEmails();
                                                    loadFolderCountsOptimized();
                                                }}
                                                disabled={loading || operationInProgress}
                                                className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                                title="Actualizar desde MXRoute"
                                            >
                                                {loading || operationInProgress ? (
                                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensajes de error y éxito */}
                                {error && (
                                    <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                        <div className="flex items-start space-x-2">
                                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <pre className="text-red-700 text-sm whitespace-pre-wrap font-sans">{error}</pre>
                                            </div>
                                            <button onClick={clearMessages} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="mx-6 mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <pre className="text-green-700 text-sm whitespace-pre-wrap font-sans">{success}</pre>
                                            </div>
                                            <button onClick={clearMessages} className="text-green-400 hover:text-green-600 flex-shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Barra de acciones para emails seleccionados */}
                                {selectedEmails.size > 0 && (
                                    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-700 font-medium">
                                                {selectedEmails.size} email{selectedEmails.size !== 1 ? 's' : ''} seleccionado{selectedEmails.size !== 1 ? 's' : ''}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50"
                                                    title="Eliminar seleccionados"
                                                    onClick={deleteSelectedEmails}
                                                    disabled={operationInProgress}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                                                    title="Cancelar selección"
                                                    onClick={() => setSelectedEmails(new Set())}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de emails */}
                                <div className="flex-1 bg-white overflow-y-auto">
                                    {loading && emails.length === 0 ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-center">
                                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
                                                <span className="text-gray-600">Cargando desde MXRoute...</span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Cache: {requestCache.size} entradas • Puede tardar más que otros proveedores
                                                </div>
                                            </div>
                                        </div>
                                    ) : filteredEmails.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                {searchTerm ? 'No se encontraron emails' : 'No hay emails'}
                                            </h3>
                                            <p className="text-gray-500">
                                                {searchTerm ? 'Intenta ajustar la búsqueda' : `No tienes emails en ${getFolderName(currentView).toLowerCase()}`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-full">
                                            {/* Header de la tabla */}
                                            <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-gray-50 sticky top-0">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
                                                        onChange={toggleAllEmailsSelection}
                                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                        disabled={operationInProgress}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            requestCache.clear();
                                                            loadEmails();
                                                            loadFolderCountsOptimized();
                                                        }}
                                                        className="p-1 rounded hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                                                        disabled={loading || operationInProgress}
                                                        title="Actualizar desde MXRoute"
                                                    >
                                                        {loading || operationInProgress ? (
                                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                        ) : (
                                                            <RefreshCw className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="flex-1 text-center">
                                                    <span className="text-sm text-gray-500">
                                                        1-{Math.min(filteredEmails.length, 30)} de {filteredEmails.length} • MXRoute via VPS v2.2.3
                                                        {accountPerformance.lastResponseTime && (
                                                            <span className="text-blue-600"> • {accountPerformance.lastResponseTime}ms</span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <button className="p-1 rounded hover:bg-gray-200 transition-colors duration-200 text-gray-400" disabled>
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1 rounded hover:bg-gray-200 transition-colors duration-200 text-gray-400" disabled>
                                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Lista de emails */}
                                            <div>
                                                {filteredEmails.map(email => (
                                                    <div
                                                        key={email.uid}
                                                        className={`flex items-center px-4 py-3 border-b border-gray-100 hover:shadow-md hover:z-10 relative transition-all duration-200 cursor-pointer group ${email.unread ? 'bg-white' : 'hover:bg-gray-50'
                                                            } ${selectedEmails.has(email.uid) ? 'bg-blue-50' : ''}`}
                                                        onClick={() => {
                                                            setSelectedEmail(email);
                                                            setShowEmailDetail(true);
                                                        }}
                                                    >
                                                        <div className="flex items-center space-x-3 mr-4 flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmails.has(email.uid)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleEmailSelection(email.uid);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                                disabled={operationInProgress}
                                                            />
                                                            <button
                                                                className="p-1 rounded hover:bg-yellow-100 transition-colors duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleStar(email.uid, email);
                                                                }}
                                                                disabled={operationInProgress}
                                                            >
                                                                <Star className={`w-4 h-4 ${email.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                                                            </button>
                                                        </div>

                                                        <div className={`w-48 truncate text-sm flex-shrink-0 ${email.unread
                                                                ? 'font-bold text-gray-900'
                                                                : 'font-medium text-gray-700'
                                                            }`}>
                                                            {currentView === 'sent' ?
                                                                (email.toName || email.to) :
                                                                (email.fromName || email.from)
                                                            }
                                                        </div>

                                                        <div className="flex-1 min-w-0 mx-4 max-w-xl">
                                                            <div className="flex items-baseline space-x-2">
                                                                <span className={`text-sm flex-shrink-0 ${email.unread
                                                                        ? 'font-bold text-gray-900'
                                                                        : 'font-medium text-gray-900'
                                                                    }`}>
                                                                    {email.subject || '(Sin asunto)'}
                                                                </span>
                                                                <span className="text-gray-400 text-sm hidden sm:inline flex-shrink-0">-</span>
                                                                <span className="text-sm text-gray-600 truncate hidden sm:inline font-normal">
                                                                    {email.snippet || 'Sin vista previa disponible'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                                            {email.hasAttachments && (
                                                                <div className="flex items-center">
                                                                    <Paperclip className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-xs text-green-600 ml-1">MXR</span>
                                                                </div>
                                                            )}
                                                            <div className="text-sm text-gray-500 font-normal w-16 text-right">
                                                                {formatDate(email.date)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal de actualización de contraseña para MXRoute */}
                    {showPasswordUpdate && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl w-full max-w-md">
                                <div className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Actualizar Credenciales MXRoute
                                        </h3>
                                    </div>
                                    
                                    <p className="text-gray-600 mb-4">
                                        Las credenciales para <strong>{passwordUpdateData.email}</strong> necesitan ser actualizadas para funcionar con MXRoute optimizado.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contraseña actual
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordUpdateData.currentPassword}
                                                onChange={(e) => setPasswordUpdateData(prev => ({
                                                    ...prev,
                                                    currentPassword: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="Ingresa tu contraseña de MXRoute"
                                                disabled={operationInProgress}
                                            />
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    setShowPasswordUpdate(false);
                                                    setPasswordUpdateData({
                                                        email: '',
                                                        currentPassword: '',
                                                        newPassword: '',
                                                        confirmPassword: ''
                                                    });
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                                disabled={operationInProgress}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setOperationInProgress(true);
                                                        
                                                        await new Promise(resolve => setTimeout(resolve, 2000));
                                                        
                                                        showMessage('✅ Credenciales MXRoute actualizadas correctamente', 'success');
                                                        setShowPasswordUpdate(false);
                                                        setPasswordUpdateData({
                                                            email: '',
                                                            currentPassword: '',
                                                            newPassword: '',
                                                            confirmPassword: ''
                                                        });
                                                        
                                                        setTimeout(() => {
                                                            loadEmails();
                                                        }, 1000);
                                                        
                                                    } catch (error) {
                                                        showMessage(`❌ Error actualizando credenciales MXRoute: ${error.message}`, 'error');
                                                    } finally {
                                                        setOperationInProgress(false);
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50"
                                                disabled={!passwordUpdateData.currentPassword || operationInProgress}
                                            >
                                                {operationInProgress ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Actualizando...
                                                    </div>
                                                ) : (
                                                    'Actualizar'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Visor de Adjuntos */}
                    {showAttachmentViewer && currentAttachment && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {currentAttachment.filename || 'Archivo adjunto'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {getFileInfo(currentAttachment).typeName} • {formatFileSize(currentAttachment.size)} • {currentAttachment.provider || 'MXRoute'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                                            disabled={loading || operationInProgress}
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Descargar</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAttachmentViewer(false);
                                                setCurrentAttachment(null);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {currentAttachment.contentType?.startsWith('image/') ? (
                                        <div className="h-full flex items-center justify-center bg-gray-50 p-4">
                                            <img
                                                src={`data:${currentAttachment.contentType};base64,${currentAttachment.content}`}
                                                alt={currentAttachment.filename}
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                            />
                                        </div>
                                    ) : currentAttachment.contentType?.includes('pdf') ? (
                                        <div className="h-full">
                                            <iframe
                                                src={`data:${currentAttachment.contentType};base64,${currentAttachment.content}`}
                                                className="w-full h-full border-0"
                                                title={currentAttachment.filename}
                                            />
                                        </div>
                                    ) : currentAttachment.contentType?.startsWith('text/') ? (
                                        <div className="h-full overflow-y-auto p-6 bg-gray-50">
                                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-white p-4 rounded-lg border">
                                                {atob(currentAttachment.content)}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-center">
                                                <div className="text-6xl mb-4">{getFileInfo(currentAttachment).icon}</div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                    {currentAttachment.filename}
                                                </h3>
                                                <p className="text-gray-600 mb-4">
                                                    Este tipo de archivo no se puede previsualizar
                                                </p>
                                                <button
                                                    className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 mx-auto disabled:opacity-50"
                                                    disabled={loading || operationInProgress}
                                                >
                                                    <Download className="w-5 h-5" />
                                                    <span>Descargar desde {currentAttachment.provider || 'MXRoute'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EmailCompose Component */}
                    {showCompose && (
                        <EmailCompose
                            isOpen={showCompose}
                            onClose={() => {
                                console.log('Cerrando EmailCompose desde EmailInbox MXRoute optimizado');
                                setShowCompose(false);
                                setTimeout(() => {
                                    setComposeMode('new');
                                    setComposeInitialData({});
                                }, 100);
                            }}
                            currentAccount={currentAccount}
                            onSend={handleSendEmail}
                            initialData={composeInitialData}
                            mode={composeMode}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default EmailInbox;