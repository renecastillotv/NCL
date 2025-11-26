import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, User, Mail, Phone, MapPin, Shield, Camera, Upload, 
    Eye, EyeOff, Save, UserPlus, Calendar, Globe, Briefcase,
    AlertCircle, CheckCircle, Info
} from 'lucide-react';


// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================


import { supabase } from '../services/api';

// ========================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================

const VALIDATION_RULES = {
    name: { minLength: 2, maxLength: 50 },
    email: { maxLength: 150 },
    password: { minLength: 6, maxLength: 72 },
    phone: { maxLength: 20 },
    document: { maxLength: 50 },
    biography: { maxLength: 1000 },
    url: { maxLength: 200 }
};

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Mapeo de iconos para tipos de usuario
const iconMap = {
    UserPlus,
    Shield,
    User,
    Briefcase,
    Globe
};

const TABS = [
    { id: 'basic', label: 'Información Básica', icon: User },
    { id: 'role', label: 'Rol y Configuración', icon: Shield },
    { id: 'personal', label: 'Información Personal', icon: Calendar },
    { id: 'social', label: 'Redes y Foto', icon: Globe }
];

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const UserCreatePage = ({ onBack, onSave }) => {
    // =====================================
    // ESTADOS DEL FORMULARIO
    // =====================================
    const [formData, setFormData] = useState({
        // Datos básicos obligatorios
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'asesor',
        
        // Datos de contacto
        phone: '',
        document_number: '',
        
        // Datos profesionales
        position: '',
        user_type: 1,
        
        // Datos personales
        gender: '',
        birth_date: '',
        biography: '',
        
        // Configuración del sistema
        active: true,
        show_on_website: false,
        country_code: 'DOM',
        
        // Experiencia profesional
        years_experience: 0,
        company_start_date: '',
        
        // Redes sociales
        facebook_url: '',
        instagram_url: '',
        linkedin_url: '',
        youtube_url: '',
        twitter_url: '',
        
        // Especialidades
        specialty_description: '',
        languages: ['Español']
    });

    // =====================================
    // ESTADOS DE UI Y CONTROL
    // =====================================
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [successMessage, setSuccessMessage] = useState('');

    // =====================================
    // ESTADOS DE DATOS DINÁMICOS
    // =====================================
    const [availableUserTypes, setAvailableUserTypes] = useState([]);
    const [loadingUserTypes, setLoadingUserTypes] = useState(true);
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    // =====================================
    // ESTADOS DE FOTO DE PERFIL
    // =====================================
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // =====================================
    // EFECTOS Y CARGA INICIAL
    // =====================================
    useEffect(() => {
        initializeComponent();
    }, []);

    const initializeComponent = async () => {
        await Promise.all([
            fetchActiveUserTypes(),
            fetchActiveCountries()
        ]);
    };

    // =====================================
    // FUNCIONES DE CARGA DE DATOS
    // =====================================
    
    const fetchActiveUserTypes = async () => {
        try {
            setLoadingUserTypes(true);
            
            // Intentar cargar desde Supabase primero
            const { data, error } = await supabase.rpc('get_active_registration_types');

            if (error || !data) {
                console.warn('No se pudieron cargar tipos de usuario desde Supabase, usando defaults');
                setAvailableUserTypes(getDefaultUserTypes());
                return;
            }

            const mappedTypes = data.map(item => {
                const typeId = item.type_key.replace('registration_', '');
                const config = item.type_config;
                
                return {
                    id: typeId,
                    title: config.title || getTypeTitle(typeId),
                    description: config.description || getTypeDescription(typeId),
                    icon: config.icon || 'UserPlus',
                    color: config.color || getDefaultColor(typeId)
                };
            });

            // Agregar tipos administrativos
            const adminTypes = [
                { id: 'admin', title: 'Administrador', description: 'Administrador del sistema', icon: 'Shield', color: 'from-red-500 to-red-600' },
                { id: 'manager', title: 'Gerente', description: 'Gerente de oficina', icon: 'Briefcase', color: 'from-gray-500 to-gray-600' },
                { id: 'accountant', title: 'Contador', description: 'Departamento financiero', icon: 'User', color: 'from-yellow-500 to-yellow-600' }
            ];

            adminTypes.forEach(adminType => {
                if (!mappedTypes.find(t => t.id === adminType.id)) {
                    mappedTypes.push(adminType);
                }
            });

            setAvailableUserTypes(mappedTypes);

        } catch (error) {
            console.error('Error cargando tipos de usuario:', error);
            setAvailableUserTypes(getDefaultUserTypes());
        } finally {
            setLoadingUserTypes(false);
        }
    };

    const fetchActiveCountries = async () => {
        try {
            setLoadingCountries(true);
            
            const { data, error } = await supabase
                .from('countries')
                .select('code, name, country_flag')
                .eq('active', true)
                .order('name');

            if (!error && data && data.length > 0) {
                setCountries(data);
            } else {
                setCountries(getDefaultCountries());
            }
        } catch (error) {
            console.error('Error cargando países:', error);
            setCountries(getDefaultCountries());
        } finally {
            setLoadingCountries(false);
        }
    };

    // =====================================
    // FUNCIONES DE UTILIDAD
    // =====================================
    
    const getDefaultUserTypes = () => [
        { id: 'asesor', title: 'Asesor Inmobiliario', description: 'Asesor de ventas', icon: 'UserPlus', color: 'from-blue-500 to-blue-600' },
        { id: 'referidor', title: 'Referidor Oficial', description: 'Especialista en referencias', icon: 'User', color: 'from-green-500 to-green-600' },
        { id: 'admin', title: 'Administrador', description: 'Administrador del sistema', icon: 'Shield', color: 'from-red-500 to-red-600' },
        { id: 'manager', title: 'Gerente', description: 'Gerente de oficina', icon: 'Briefcase', color: 'from-gray-500 to-gray-600' }
    ];

    const getDefaultCountries = () => [
        { code: 'DOM', name: 'República Dominicana', country_flag: '🇩🇴' },
        { code: 'USA', name: 'Estados Unidos', country_flag: '🇺🇸' },
        { code: 'ESP', name: 'España', country_flag: '🇪🇸' },
        { code: 'COL', name: 'Colombia', country_flag: '🇨🇴' }
    ];

    const getTypeTitle = (typeId) => {
        const titles = {
            asesor: 'Asesor Inmobiliario',
            referidor: 'Referidor Oficial',
            rentals: 'Gestor de Rentas',
            proveedor: 'Proveedor de Servicios',
            estudiante: 'Estudiante CLIC'
        };
        return titles[typeId] || 'Usuario';
    };

    const getTypeDescription = (typeId) => {
        const descriptions = {
            asesor: 'Asesor de ventas inmobiliarias',
            referidor: 'Especialista en referencias',
            rentals: 'Gestor de rentas vacacionales',
            proveedor: 'Proveedor de servicios especializados',
            estudiante: 'Estudiante de cursos CLIC'
        };
        return descriptions[typeId] || 'Usuario del sistema';
    };

    const getDefaultColor = (typeId) => {
        const colors = {
            asesor: 'from-blue-500 to-blue-600',
            referidor: 'from-green-500 to-green-600',
            rentals: 'from-purple-500 to-purple-600',
            proveedor: 'from-orange-500 to-orange-600',
            estudiante: 'from-indigo-500 to-indigo-600'
        };
        return colors[typeId] || 'from-gray-500 to-gray-600';
    };

    const generateExternalId = () => {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `USR${timestamp.slice(-6)}${random}`;
    };

    const generateSlug = (firstName, lastName) => {
        const timestamp = Date.now().toString().slice(-4);
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${cleanFirst}-${cleanLast}-${timestamp}`;
    };

    // =====================================
    // FUNCIONES DE VALIDACIÓN
    // =====================================
    
    const validateField = (field, value) => {
        const fieldErrors = [];

        switch (field) {
            case 'first_name':
            case 'last_name':
                if (!value?.trim()) {
                    fieldErrors.push(`${field === 'first_name' ? 'Nombre' : 'Apellido'} es requerido`);
                } else if (value.length < VALIDATION_RULES.name.minLength) {
                    fieldErrors.push(`Debe tener al menos ${VALIDATION_RULES.name.minLength} caracteres`);
                } else if (value.length > VALIDATION_RULES.name.maxLength) {
                    fieldErrors.push(`No puede tener más de ${VALIDATION_RULES.name.maxLength} caracteres`);
                }
                break;

            case 'email':
                if (!value?.trim()) {
                    fieldErrors.push('Email es requerido');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    fieldErrors.push('Email no tiene un formato válido');
                } else if (value.length > VALIDATION_RULES.email.maxLength) {
                    fieldErrors.push(`Email no puede tener más de ${VALIDATION_RULES.email.maxLength} caracteres`);
                }
                break;

            case 'password':
                if (!value) {
                    fieldErrors.push('Contraseña es requerida');
                } else if (value.length < VALIDATION_RULES.password.minLength) {
                    fieldErrors.push(`Contraseña debe tener al menos ${VALIDATION_RULES.password.minLength} caracteres`);
                } else if (value.length > VALIDATION_RULES.password.maxLength) {
                    fieldErrors.push(`Contraseña no puede tener más de ${VALIDATION_RULES.password.maxLength} caracteres`);
                } else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
                    fieldErrors.push('Contraseña debe contener al menos una letra y un número');
                }
                break;

            case 'confirmPassword':
                if (value !== formData.password) {
                    fieldErrors.push('Las contraseñas no coinciden');
                }
                break;

            case 'role':
                if (!value?.trim()) {
                    fieldErrors.push('Rol es requerido');
                }
                break;

            case 'phone':
                if (value && value.length > VALIDATION_RULES.phone.maxLength) {
                    fieldErrors.push(`Teléfono no puede tener más de ${VALIDATION_RULES.phone.maxLength} caracteres`);
                }
                break;

            case 'biography':
                if (value && value.length > VALIDATION_RULES.biography.maxLength) {
                    fieldErrors.push(`Biografía no puede tener más de ${VALIDATION_RULES.biography.maxLength} caracteres`);
                }
                break;

            default:
                if (field.includes('_url') && value) {
                    if (value.length > VALIDATION_RULES.url.maxLength) {
                        fieldErrors.push(`URL no puede tener más de ${VALIDATION_RULES.url.maxLength} caracteres`);
                    } else if (!value.startsWith('http://') && !value.startsWith('https://')) {
                        fieldErrors.push('URL debe comenzar con http:// o https://');
                    }
                }
                break;
        }

        return fieldErrors;
    };

    const validateForm = () => {
        const formErrors = {};
        
        // Validar campos obligatorios
        ['first_name', 'last_name', 'email', 'password', 'confirmPassword', 'role'].forEach(field => {
            const fieldErrors = validateField(field, formData[field]);
            if (fieldErrors.length > 0) {
                formErrors[field] = fieldErrors;
            }
        });

        // Validar campos opcionales
        ['phone', 'biography', 'facebook_url', 'instagram_url', 'linkedin_url', 'youtube_url', 'twitter_url'].forEach(field => {
            if (formData[field]) {
                const fieldErrors = validateField(field, formData[field]);
                if (fieldErrors.length > 0) {
                    formErrors[field] = fieldErrors;
                }
            }
        });

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    // =====================================
    // MANEJO DE FORMULARIO
    // =====================================
    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Limpiar errores del campo al cambiar
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Limpiar mensaje de éxito al cambiar cualquier campo
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    // =====================================
    // MANEJO DE FOTO DE PERFIL
    // =====================================
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                profilePhoto: ['Tipo de archivo no soportado. Use JPG, PNG, GIF o WebP']
            }));
            return;
        }

        // Validar tamaño
        if (file.size > MAX_IMAGE_SIZE) {
            setErrors(prev => ({
                ...prev,
                profilePhoto: ['El archivo es muy grande. Máximo 5MB']
            }));
            return;
        }

        // Limpiar errores previos
        if (errors.profilePhoto) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.profilePhoto;
                return newErrors;
            });
        }

        setProfilePhotoFile(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setProfilePhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadProfilePhoto = async (userId) => {
        if (!profilePhotoFile) return null;

        try {
            setUploadingPhoto(true);
            
            const fileExt = profilePhotoFile.name.split('.').pop();
            const fileName = `profile_photos/${userId}-${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, profilePhotoFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error subiendo foto:', error);
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    };

    // =====================================
    // ENVÍO DEL FORMULARIO (DIRECTO A SUPABASE)
    // =====================================
    
    const handleSubmit = async () => {
        if (!validateForm()) {
            setActiveTab('basic'); // Ir al primer tab si hay errores
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            console.log('🚀 Creando usuario directamente en Supabase...');

            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                options: {
                    data: {
                        full_name: `${formData.first_name} ${formData.last_name}`,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        role: formData.role
                    }
                }
            });

            if (authError) {
                console.error('❌ Error creando usuario auth:', authError);
                
                if (authError.message.includes('User already registered')) {
                    throw new Error('Este email ya está registrado en el sistema');
                }
                
                throw new Error(`Error de autenticación: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario de autenticación');
            }

            console.log('✅ Usuario auth creado:', authData.user.id);

            // 2. Subir foto de perfil si existe
            let profilePhotoUrl = null;
            if (profilePhotoFile) {
                console.log('📸 Subiendo foto de perfil...');
                profilePhotoUrl = await uploadProfilePhoto(authData.user.id);
                console.log('✅ Foto subida:', profilePhotoUrl);
            }

            // 3. Crear registro en tabla users
            const userRecord = {
                auth_user_id: authData.user.id,
                external_id: generateExternalId(),
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone?.trim() || null,
                document_number: formData.document_number?.trim() || null,
                position: formData.position?.trim() || formData.role,
                role: formData.role,
                user_type: formData.user_type || 1,
                gender: formData.gender || null,
                birth_date: formData.birth_date || null,
                biography: formData.biography?.trim() || null,
                active: formData.active !== false,
                show_on_website: formData.show_on_website || false,
                country_code: formData.country_code,
                years_experience: parseInt(formData.years_experience) || 0,
                company_start_date: formData.company_start_date || null,
                facebook_url: formData.facebook_url?.trim() || null,
                instagram_url: formData.instagram_url?.trim() || null,
                linkedin_url: formData.linkedin_url?.trim() || null,
                youtube_url: formData.youtube_url?.trim() || null,
                twitter_url: formData.twitter_url?.trim() || null,
                specialty_description: formData.specialty_description?.trim() || null,
                languages: formData.languages,
                profile_photo_url: profilePhotoUrl,
                slug: generateSlug(formData.first_name, formData.last_name),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: createdUser, error: userError } = await supabase
                .from('users')
                .insert([userRecord])
                .select()
                .single();

            if (userError) {
                console.error('❌ Error creando registro usuario:', userError);
                
                // Limpiar usuario auth si falla la creación del perfil
                try {
                    await supabase.auth.admin.deleteUser(authData.user.id);
                } catch (cleanupError) {
                    console.error('Error limpiando usuario auth:', cleanupError);
                }
                
                throw new Error(`Error creando perfil de usuario: ${userError.message}`);
            }

            console.log('✅ Usuario creado exitosamente:', createdUser);

            // 4. Mostrar mensaje de éxito
            setSuccessMessage(`Usuario ${createdUser.first_name} ${createdUser.last_name} creado exitosamente`);

            // 5. Notificar al componente padre
            setTimeout(() => {
                onSave && onSave(createdUser);
            }, 2000);

        } catch (error) {
            console.error('❌ Error en proceso de creación:', error);
            
            let errorMessage = 'Hubo un error al crear el usuario. Por favor intenta nuevamente.';
            
            if (error.message?.includes('ya está registrado')) {
                errorMessage = 'Este email ya está registrado en el sistema.';
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setErrors({ submit: [errorMessage] });
        } finally {
            setLoading(false);
        }
    };

    // =====================================
    // COMPONENTES DE RENDERIZADO
    // =====================================
    
    const renderErrorMessages = (fieldName) => {
        if (!errors[fieldName]) return null;
        
        return (
            <div className="mt-1 text-sm text-red-600 space-y-1">
                {errors[fieldName].map((error, index) => (
                    <div key={index} className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderTabs = () => (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
                {TABS.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                                isActive
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <IconComponent className={`-ml-0.5 mr-2 h-5 w-5 ${
                                isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                            }`} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );

    const renderBasicTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.first_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nombre del usuario"
                        />
                        {renderErrorMessages('first_name')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido *
                        </label>
                        <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.last_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Apellido del usuario"
                        />
                        {renderErrorMessages('last_name')}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="usuario@clicinmobiliaria.com"
                        />
                        {renderErrorMessages('email')}
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña *
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Mínimo 6 caracteres"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {renderErrorMessages('password')}
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Contraseña *
                        </label>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Repetir contraseña"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {renderErrorMessages('confirmPassword')}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRoleTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rol y Configuración</h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de Usuario *
                    </label>
                    {loadingUserTypes ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                            <span className="text-gray-600">Cargando tipos de usuario...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableUserTypes.map((type) => {
                                const IconComponent = iconMap[type.icon] || UserPlus;
                                return (
                                    <label key={type.id} className={`
                                        flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                                        ${formData.role === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                                    `}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value={type.id}
                                            checked={formData.role === type.id}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                                            <IconComponent className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{type.title}</div>
                                            <div className="text-sm text-gray-600">{type.description}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {renderErrorMessages('role')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Posición/Cargo
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Asesor Senior, Gerente de Ventas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            País
                        </label>
                        {loadingCountries ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                <span className="text-gray-500">Cargando países...</span>
                            </div>
                        ) : (
                            <select
                                value={formData.country_code}
                                onChange={(e) => handleInputChange('country_code', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar país</option>
                                {countries.map(country => (
                                    <option key={country.code} value={country.code}>
                                        {country.country_flag} {country.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => handleInputChange('active', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700">
                            Usuario activo (puede iniciar sesión)
                        </label>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="show_on_website"
                            checked={formData.show_on_website}
                            onChange={(e) => handleInputChange('show_on_website', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="show_on_website" className="text-sm font-medium text-gray-700">
                            Mostrar en sitio web público
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPersonalTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <p className="text-sm text-gray-600 mb-6">Esta información es opcional y ayuda a completar el perfil del usuario.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.phone ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="(809) 000-0000"
                        />
                        {renderErrorMessages('phone')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Documento
                        </label>
                        <input
                            type="text"
                            value={formData.document_number}
                            onChange={(e) => handleInputChange('document_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="000-0000000-0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Género
                        </label>
                        <select
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar género</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="O">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Nacimiento
                        </label>
                        <input
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => handleInputChange('birth_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Años de Experiencia
                        </label>
                        <input
                            type="number"
                            value={formData.years_experience}
                            onChange={(e) => handleInputChange('years_experience', e.target.value)}
                            min="0"
                            max="50"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Inicio en la Empresa
                        </label>
                        <input
                            type="date"
                            value={formData.company_start_date}
                            onChange={(e) => handleInputChange('company_start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biografía Profesional
                    </label>
                    <textarea
                        value={formData.biography}
                        onChange={(e) => handleInputChange('biography', e.target.value)}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.biography ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Descripción profesional del usuario..."
                    />
                    {renderErrorMessages('biography')}
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.biography?.length || 0} / {VALIDATION_RULES.biography.maxLength} caracteres
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSocialTab = () => (
        <div className="space-y-8">
            {/* Redes Sociales */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Redes Sociales</h3>
                <p className="text-sm text-gray-600 mb-6">Enlaces a perfiles en redes sociales (opcional).</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                        <input
                            type="url"
                            value={formData.facebook_url}
                            onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.facebook_url ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="https://facebook.com/usuario"
                        />
                        {renderErrorMessages('facebook_url')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                        <input
                            type="url"
                            value={formData.instagram_url}
                            onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.instagram_url ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="https://instagram.com/usuario"
                        />
                        {renderErrorMessages('instagram_url')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        <input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                errors.linkedin_url ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="https://linkedin.com/in/usuario"
                        />
                        {renderErrorMessages('linkedin_url')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades</label>
                        <input
                            type="text"
                            value={formData.specialty_description}
                            onChange={(e) => handleInputChange('specialty_description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Propiedades de lujo, Inversiones"
                        />
                    </div>
                </div>
            </div>

            {/* Foto de Perfil */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Foto de Perfil
                </h3>

                <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {profilePhotoPreview ? (
                                <img 
                                    src={profilePhotoPreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => document.getElementById('photo-upload').click()}
                                disabled={uploadingPhoto}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}
                            </button>
                            {profilePhotoFile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfilePhotoFile(null);
                                        setProfilePhotoPreview('');
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Quitar
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            JPG, PNG, GIF o WebP. Máximo 5MB. Recomendado: 400x400px
                        </p>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {renderErrorMessages('profilePhoto')}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic': return renderBasicTab();
            case 'role': return renderRoleTab();
            case 'personal': return renderPersonalTab();
            case 'social': return renderSocialTab();
            default: return renderBasicTab();
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Usuario</h2>
                            <p className="text-sm text-gray-600">Completa la información para crear un usuario del sistema</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Mensaje de Éxito */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                <span className="text-sm font-medium text-green-800">{successMessage}</span>
                            </div>
                        </div>
                    )}

                    {/* Formulario con Tabs */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4">
                            {/* Navegación de Tabs */}
                            {renderTabs()}

                            {/* Contenido del Tab Activo */}
                            <div className="mt-6">
                                {renderTabContent()}
                            </div>
                        </div>

                        {/* Error Global */}
                        {errors.submit && (
                            <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="text-sm text-red-600 space-y-1">
                                    {errors.submit.map((error, index) => (
                                        <div key={index} className="flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Botones de Acción */}
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? 'Creando Usuario...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCreatePage;