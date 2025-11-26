import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Save, X, Upload, Camera, User, Mail, Phone, MapPin, 
    Calendar, Briefcase, Globe, Facebook, Instagram, Twitter, 
    Linkedin, Youtube, FileText, Shield, Eye, EyeOff, AlertCircle,
    CheckCircle, Building, Users, Hash, CreditCard, HelpCircle, Search
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';

import WYSIWYGSEOEditor from './WYSIWYGSEOEditor'; // Importar el editor WYSIWYG


import { supabase } from '../services/api';

// Componente SearchableSelect para ciudades y sectores
const SearchableSelect = ({ options, value, onChange, placeholder, maxItems = 3, multiple = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const selectedIds = multiple ? (value || []) : (value ? [value] : []);
    
    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (optionId) => {
        if (multiple) {
            let newValue;
            if (selectedIds.includes(optionId)) {
                newValue = selectedIds.filter(id => id !== optionId);
            } else {
                if (selectedIds.length < maxItems) {
                    newValue = [...selectedIds, optionId];
                } else {
                    return;
                }
            }
            onChange(newValue);
        } else {
            onChange(optionId);
            setIsOpen(false);
        }
    };

    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

    return (
        <div className="relative">
            <div 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 min-h-[42px] cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOptions.length > 0 ? (
                    multiple ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedOptions.map(option => (
                                <span 
                                    key={option.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    {option.name}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(option.id);
                                        }}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-900">{selectedOptions[0]?.name}</span>
                    )
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Barra de búsqueda */}
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    
                    {/* Lista de opciones */}
                    <div className="max-h-48 overflow-auto">
                        {filteredOptions.map(option => (
                            <div
                                key={option.id}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                    selectedIds.includes(option.id) ? 'bg-blue-50 text-blue-900' : ''
                                } ${
                                    multiple && !selectedIds.includes(option.id) && selectedIds.length >= maxItems 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                                onClick={() => {
                                    if (!multiple || selectedIds.includes(option.id) || selectedIds.length < maxItems) {
                                        handleToggle(option.id);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{option.name}</span>
                                    {selectedIds.includes(option.id) && (
                                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                                {searchTerm ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {multiple && (
                <p className="text-xs text-gray-500 mt-1">
                    {selectedIds.length}/{maxItems} seleccionados
                </p>
            )}
        </div>
    );
};

// Componente MultiSelect para categorías de propiedades (sin búsqueda)
const MultiSelectSpecialty = ({ options, value, onChange, placeholder, maxItems = 3 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedIds = value || [];
    
    const handleToggle = (optionId) => {
        let newValue;
        if (selectedIds.includes(optionId)) {
            newValue = selectedIds.filter(id => id !== optionId);
        } else {
            if (selectedIds.length < maxItems) {
                newValue = [...selectedIds, optionId];
            } else {
                return;
            }
        }
        onChange(newValue);
    };

    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

    return (
        <div className="relative">
            <div 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 min-h-[42px] cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {selectedOptions.map(option => (
                            <span 
                                key={option.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {option.name}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(option.id);
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <div
                            key={option.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                selectedIds.includes(option.id) ? 'bg-blue-50 text-blue-900' : ''
                            } ${
                                !selectedIds.includes(option.id) && selectedIds.length >= maxItems 
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                            onClick={() => {
                                if (selectedIds.includes(option.id) || selectedIds.length < maxItems) {
                                    handleToggle(option.id);
                                }
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <span>{option.name}</span>
                                {selectedIds.includes(option.id) && (
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-gray-500">No hay opciones disponibles</div>
                    )}
                </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
                {selectedIds.length}/{maxItems} seleccionados
            </p>
        </div>
    );
};

// Componente para el modal de confirmación
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", variant = "warning" }) => {
    if (!isOpen) return null;

    const iconColor = variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-yellow-500' : 'text-blue-500';
    const buttonColor = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center space-x-3 mb-4">
                    <HelpCircle className={`w-6 h-6 ${iconColor}`} />
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6">{message}</p>
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white ${buttonColor} rounded-md transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente mejorado para el avatar del usuario con foto de perfil - Optimizado
const UserAvatarEditor = React.memo(({ user, onPhotoChange, uploading }) => {
    const [dragActive, setDragActive] = useState(false);

    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const profilePhotoUrl = user?.profile_photo_url;

    const getInitials = React.useCallback((first, last) => {
        const firstInitial = first ? first.charAt(0).toUpperCase() : '';
        const lastInitial = last ? last.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial || user?.email?.charAt(0).toUpperCase() || '?';
    }, [user?.email]);

    const initials = getInitials(firstName, lastName);
    const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Usuario';

    // Solo mostrar debug cuando cambia la URL de la foto
    React.useEffect(() => {
        console.log('🖼️ DEBUG Avatar - URL de foto actualizada:', profilePhotoUrl);
    }, [profilePhotoUrl]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onPhotoChange(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            onPhotoChange(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div
                className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 ${
                    dragActive ? 'border-blue-500 bg-blue-50' : ''
                } ${uploading ? 'opacity-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {profilePhotoUrl ? (
                    <>
                        <img 
                            src={profilePhotoUrl} 
                            alt={fullName}
                            className="w-full h-full object-cover"
                            onLoad={() => console.log('✅ Imagen cargada correctamente:', profilePhotoUrl)}
                            onError={(e) => {
                                console.log('❌ Error cargando imagen:', profilePhotoUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div 
                            className="w-full h-full bg-blue-100 flex items-center justify-center"
                            style={{ display: 'none' }}
                        >
                            <span className="text-2xl font-bold text-blue-600">
                                {initials}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                            {initials}
                        </span>
                    </div>
                )}
                
                {/* Overlay de carga */}
                {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}

                {/* Overlay de edición */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                </div>

                {/* Input file oculto */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />
            </div>

            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                
                <div className={`flex mt-3 ${profilePhotoUrl ? 'space-x-2' : 'justify-center'}`}>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploading}
                        />
                        <span className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {uploading ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border border-gray-300 rounded-full border-t-blue-500 mr-2" />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Cambiar foto
                                </>
                            )}
                        </span>
                    </label>
                    {profilePhotoUrl && (
                        <button
                            type="button"
                            onClick={() => onPhotoChange(null)}
                            disabled={uploading}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Eliminar
                        </button>
                    )}
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                    Arrastra una imagen aquí o haz clic para seleccionar
                </p>
            </div>
        </div>
    );
});

// Componente principal de edición de usuario
const UserEditPage = ({ userId, onBack, onSave }) => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Estados para dropdowns
    const [teams, setTeams] = useState([]);
    const [offices, setOffices] = useState([]);
    const [cities, setCities] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [propertyCategories, setPropertyCategories] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);

    // Hook para cargar usuario y verificar storage
    useEffect(() => {
        if (userId) {
            fetchUser();
            checkStorageConfiguration();
            loadDropdownData();
        }
    }, [userId]);

    // Cargar datos para los dropdowns
    const loadDropdownData = async () => {
        try {
            setLoadingDropdowns(true);
            
            // Cargar equipos
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('id, name, description, active')
                .eq('active', true)
                .order('name');

            if (teamsError) {
                console.warn('Error cargando equipos:', teamsError);
            } else {
                console.log('✅ Equipos cargados:', teamsData?.length || 0);
                setTeams(teamsData || []);
            }

            // Cargar oficinas
            const { data: officesData, error: officesError } = await supabase
                .from('offices')
                .select('id, name, address, city_id, active')
                .eq('active', true)
                .order('name');

            if (officesError) {
                console.warn('Error cargando oficinas:', officesError);
            } else {
                console.log('✅ Oficinas cargadas:', officesData?.length || 0);
                setOffices(officesData || []);
            }

            // Cargar ciudades con provincias
            const { data: citiesData, error: citiesError } = await supabase
                .from('cities')
                .select(`
                    id, 
                    name,
                    provinces!inner(id, name)
                `)
                .order('name');

            if (citiesError) {
                console.warn('Error cargando ciudades:', citiesError);
            } else {
                console.log('✅ Ciudades cargadas:', citiesData?.length || 0);
                setCities(citiesData || []);
            }

            // Cargar sectores
            const { data: sectorsData, error: sectorsError } = await supabase
                .from('sectors')
                .select(`
                    id, 
                    name,
                    cities!inner(id, name)
                `)
                .order('name');

            if (sectorsError) {
                console.warn('Error cargando sectores:', sectorsError);
            } else {
                console.log('✅ Sectores cargados:', sectorsData?.length || 0);
                setSectors(sectorsData || []);
            }

            // Cargar categorías de propiedades
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('property_categories')
                .select('id, name, description, active')
                .eq('active', true)
                .order('name');

            if (categoriesError) {
                console.warn('Error cargando categorías:', categoriesError);
            } else {
                console.log('✅ Categorías cargadas:', categoriesData?.length || 0);
                setPropertyCategories(categoriesData || []);
            }

        } catch (error) {
            console.error('💥 Error cargando datos de dropdowns:', error);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    // Verificar configuración de Supabase Storage
    const checkStorageConfiguration = async () => {
        try {
            console.log('🔧 Verificando configuración de Storage...');
            
            // Verificar si el bucket existe
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            
            if (bucketsError) {
                console.error('❌ Error listando buckets:', bucketsError);
                return;
            }

            console.log('📦 Buckets disponibles:', buckets.map(b => b.name));
            
            const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
            if (avatarsBucket) {
                console.log('✅ Bucket "avatars" encontrado:', avatarsBucket);
                
                // Probar acceso al bucket
                try {
                    const { data: files, error: filesError } = await supabase.storage
                        .from('avatars')
                        .list('', { limit: 1 });
                    
                    if (filesError) {
                        console.log('⚠️ Error accediendo al bucket:', filesError);
                    } else {
                        console.log('✅ Acceso al bucket exitoso, archivos encontrados:', files.length);
                    }
                } catch (err) {
                    console.log('⚠️ Error probando acceso al bucket:', err.message);
                }
            } else {
                console.warn('⚠️ Bucket "avatars" NO encontrado. Crea el bucket en Supabase Dashboard.');
            }

        } catch (error) {
            console.error('💥 Error verificando Storage:', error);
        }
    };

    const fetchUser = async () => {
        try {
            console.log('🔍 Cargando usuario con ID:', userId);
            setLoading(true);
            
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            console.log('📥 Respuesta de carga de usuario:');
            console.log('- Data:', data);
            console.log('- Error:', error);

            if (error) {
                console.error('❌ Error cargando usuario:', error);
                throw error;
            }

            console.log('✅ Usuario cargado exitosamente:', data);

            setUser(data);
            
            const initialFormData = {
                ...data,
                birth_date: data.birth_date ? new Date(data.birth_date).toISOString().split('T')[0] : '',
                last_access: data.last_access ? new Date(data.last_access).toISOString().slice(0, 16) : '',
                // AÑADIR campos para especialidades múltiples y idiomas
                specialty_cities: Array.isArray(data.specialty_cities) ? data.specialty_cities : 
                                 (data.specialty_cities ? JSON.parse(data.specialty_cities) : []),
                specialty_sectors: Array.isArray(data.specialty_sectors) ? data.specialty_sectors : 
                                  (data.specialty_sectors ? JSON.parse(data.specialty_sectors) : []),
                specialty_property_categories: Array.isArray(data.specialty_property_categories) ? data.specialty_property_categories : 
                                              (data.specialty_property_categories ? JSON.parse(data.specialty_property_categories) : []),
                specialty_description: data.specialty_description || '',
                languages: Array.isArray(data.languages) ? data.languages : 
                          (data.languages ? JSON.parse(data.languages) : ['Español'])
            };
            
            console.log('📝 Datos iniciales del formulario:', initialFormData);
            setFormData(initialFormData);
            
        } catch (error) {
            console.error('💥 Error general cargando usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambios en el formulario
    const handleInputChange = (field, value) => {
        console.log(`📝 Cambio en campo "${field}":`, value);
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            console.log('📋 Nuevo estado del formulario:', newData);
            return newData;
        });
        
        setUnsavedChanges(true);
        console.log('⚠️ Marcado como cambios sin guardar');
        
        // Limpiar error del campo si existe
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name?.trim()) {
            newErrors.first_name = 'El nombre es requerido';
        }
        if (!formData.last_name?.trim()) {
            newErrors.last_name = 'El apellido es requerido';
        }
        if (!formData.email?.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El formato del email no es válido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar subida de foto
    const handlePhotoChange = async (file) => {
        console.log('📸 Iniciando cambio de foto:', file);
        
        if (!file) {
            // Eliminar foto
            console.log('🗑️ Eliminando foto de perfil');
            handleInputChange('profile_photo_url', '');
            return;
        }

        console.log('📁 Detalles del archivo:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        });

        // Validar archivo
        if (!file.type.startsWith('image/')) {
            console.error('❌ Tipo de archivo inválido:', file.type);
            console.error('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.error('❌ Archivo demasiado grande:', file.size, 'bytes');
            console.error('La imagen debe ser menor a 5MB');
            return;
        }

        try {
            setUploadingPhoto(true);
            console.log('⬆️ Iniciando subida a Supabase Storage...');

            // Crear nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `profile_photos/${fileName}`;

            console.log('📂 Ruta del archivo:', filePath);

            // Subir archivo a Supabase Storage
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            console.log('📤 Respuesta de subida:');
            console.log('- Data:', data);
            console.log('- Error:', error);

            if (error) {
                console.error('❌ Error subiendo a Storage:', error);
                console.error('Error al subir la foto: ' + error.message);
                return;
            }

            console.log('✅ Archivo subido exitosamente');

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log('🔗 URL pública generada:', publicUrl);

            // Actualizar el formulario con la nueva URL
            handleInputChange('profile_photo_url', publicUrl);
            console.log('💾 URL guardada en el formulario');

        } catch (error) {
            console.error('💥 Error general procesando foto:', error);
            console.error('Error al procesar la foto');
        } finally {
            setUploadingPhoto(false);
            console.log('🔄 Finalizando proceso de subida');
        }
    };

    // Guardar cambios
    const handleSave = async () => {
        console.log('🔄 INICIANDO GUARDADO...');
        console.log('📝 Datos del formulario a guardar:', formData);
        console.log('👤 Usuario original:', user);

        if (!validateForm()) {
            console.log('❌ Validación falló');
            return;
        }

        try {
            setSaving(true);

            // Preparar datos para actualizar
            const updateData = {
                ...formData,
                birth_date: formData.birth_date || null,
                last_access: formData.last_access ? new Date(formData.last_access).toISOString() : null,
                updated_at: new Date().toISOString(),
                // AÑADIR: Asegurar que los arrays JSON se guarden correctamente
                specialty_cities: formData.specialty_cities || [],
                specialty_sectors: formData.specialty_sectors || [],
                specialty_property_categories: formData.specialty_property_categories || [],
                languages: formData.languages || ['Español']
            };

            // Eliminar campos que no deben actualizarse o son calculados
            delete updateData.id;
            delete updateData.created_at;
            
            // Asegurar que campos vacíos no se conviertan en null si no queremos que se borren
            if (updateData.document_number === '') {
                updateData.document_number = null; // Mantener como null si está vacío
            }
            
            console.log('💾 Datos preparados para actualizar:', updateData);
            console.log('🔍 document_number específicamente:', updateData.document_number);
            console.log('🎯 Actualizando usuario con ID:', user.id);

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id)
                .select(); // Agregar select para ver qué se actualizó

            console.log('📤 Respuesta de Supabase:');
            console.log('- Data:', data);
            console.log('- Error:', error);
            console.log('- Data length:', data?.length);
            console.log('- ¿Data es array vacío?', Array.isArray(data) && data.length === 0);

            if (error) {
                console.error('❌ Error de Supabase:', error);
                console.error('Error al guardar: ' + error.message);
                return;
            }

            console.log('✅ Usuario actualizado exitosamente:', data);

            setUnsavedChanges(false);
            
            // Actualizar el usuario local con los datos guardados
            if (data && data[0]) {
                setUser(data[0]);
                console.log('🔄 Usuario local actualizado con datos de BD:', data[0]);
                onSave && onSave(data[0]);
            } else {
                console.log('🔄 Usuario local actualizado con datos combinados');
                onSave && onSave({ ...user, ...updateData });
            }
            
            // Mostrar notificación de éxito con detalles
            console.log('🎉 GUARDADO EXITOSO - Resumen:');
            console.log('- Campos actualizados:', Object.keys(updateData).length);
            console.log('- Respuesta de BD:', data ? 'Con datos' : 'Sin datos');
            console.log('- Estado cambios sin guardar:', false);

        } catch (error) {
            console.error('💥 Error general guardando usuario:', error);
            console.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Manejar salida con cambios sin guardar
    const handleBack = () => {
        if (unsavedChanges) {
            setShowConfirmModal(true);
        } else {
            onBack();
        }
    };

    // Confirmar salida con cambios sin guardar
    const handleConfirmExit = () => {
        setShowConfirmModal(false);
        onBack();
    };

    // Cancelar salida
    const handleCancelExit = () => {
        setShowConfirmModal(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando usuario...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Usuario no encontrado</p>
                    <Button variant="outline" onClick={onBack} className="mt-4">
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-4">
                    <Button 
                        variant="ghost" 
                        icon={<ArrowLeft className="w-4 h-4" />}
                        onClick={handleBack}
                    >
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Editar Usuario
                        </h1>
                        <p className="text-sm text-gray-500">
                            ID: {user.external_id || user.id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {unsavedChanges && (
                        <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Cambios sin guardar</span>
                        </div>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={handleBack}
                        icon={<X className="w-4 h-4" />}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSave}
                        disabled={saving || !unsavedChanges}
                        icon={saving ? <div className="animate-spin w-4 h-4 border border-white rounded-full border-t-transparent" /> : <Save className="w-4 h-4" />}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* Contenido principal - MEJORADO: Usar todo el ancho disponible */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="max-w-full mx-auto space-y-6">
                    
                    {/* Foto de perfil */}
                    <Card className="p-6">
                        <div className="text-center">
                            <UserAvatarEditor 
                                user={formData} 
                                onPhotoChange={handlePhotoChange}
                                uploading={uploadingPhoto}
                            />
                        </div>
                    </Card>

                    {/* REORGANIZADO: Información personal PRIMERO */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <User className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre * {errors.first_name && <span className="text-red-500">({errors.first_name})</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name || ''}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nombre del usuario"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apellido * {errors.last_name && <span className="text-red-500">({errors.last_name})</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name || ''}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Apellido del usuario"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID Externo
                                </label>
                                <input
                                    type="text"
                                    value={formData.external_id || ''}
                                    onChange={(e) => handleInputChange('external_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ID único externo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    value={formData.document_number || ''}
                                    onChange={(e) => handleInputChange('document_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Cédula, DNI, Pasaporte..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Género
                                </label>
                                <select
                                    value={formData.gender || ''}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar género</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                    <option value="Prefiero no decir">Prefiero no decir</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    value={formData.birth_date || ''}
                                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Información de contacto */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Información de Contacto</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email * {errors.email && <span className="text-red-500">({errors.email})</span>}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Información profesional */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Briefcase className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Información Profesional</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rol
                                </label>
                                <input
                                    type="text"
                                    value={formData.role || ''}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Agente, Manager, Director..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Posición
                                </label>
                                <input
                                    type="text"
                                    value={formData.position || ''}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Título del puesto"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug || ''}
                                    onChange={(e) => handleInputChange('slug', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="usuario-slug-url"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Usuario
                                </label>
                                <select
                                    value={formData.user_type || 1}
                                    onChange={(e) => handleInputChange('user_type', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>Tipo 1</option>
                                    <option value={2}>Tipo 2</option>
                                    <option value={3}>Tipo 3</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID del Equipo
                                </label>
                                {loadingDropdowns ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                        Cargando equipos...
                                    </div>
                                ) : (
                                    <select
                                        value={formData.team_id || ''}
                                        onChange={(e) => handleInputChange('team_id', e.target.value || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar equipo</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                                {team.description && ` - ${team.description}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID de la Oficina
                                </label>
                                {loadingDropdowns ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                        Cargando oficinas...
                                    </div>
                                ) : (
                                    <select
                                        value={formData.office_id || ''}
                                        onChange={(e) => handleInputChange('office_id', e.target.value || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar oficina</option>
                                        {offices.map(office => (
                                            <option key={office.id} value={office.id}>
                                                {office.name}
                                                {office.address && ` - ${office.address}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Acuerdo de Comisión
                            </label>
                            <textarea
                                value={formData.commission_agreement || ''}
                                onChange={(e) => handleInputChange('commission_agreement', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Detalles del acuerdo de comisión..."
                            />
                        </div>
                    </Card>

                    {/* MOVIDO: Estadísticas y Experiencia del Asesor */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Estadísticas y Experiencia</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Ventas
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.sales_count || 0}
                                    onChange={(e) => handleInputChange('sales_count', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Ingreso a la Empresa
                                </label>
                                <input
                                    type="date"
                                    value={formData.company_start_date || ''}
                                    onChange={(e) => handleInputChange('company_start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Años de Experiencia Total
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.years_experience || 0}
                                    onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Experiencia total en el sector inmobiliario
                                </p>
                            </div>
                        </div>

                        {/* MEJORADA: Sección de especialidades múltiples con SearchableSelect */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                Especialidades Múltiples
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {/* Ciudades de Especialidad - CON BÚSQUEDA */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ciudades de Especialidad (Máximo 3)
                                    </label>
                                    {loadingDropdowns ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                            Cargando ciudades...
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={cities.map(city => ({
                                                id: city.id,
                                                name: `${city.name}${city.provinces ? `, ${city.provinces.name}` : ''}`
                                            }))}
                                            value={formData.specialty_cities || []}
                                            onChange={(value) => handleInputChange('specialty_cities', value)}
                                            placeholder="Busca y selecciona hasta 3 ciudades de especialidad"
                                            maxItems={3}
                                            multiple={true}
                                        />
                                    )}
                                </div>

                                {/* Sectores de Especialidad - CON BÚSQUEDA */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sectores de Especialidad (Máximo 3)
                                    </label>
                                    {loadingDropdowns ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                            Cargando sectores...
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={sectors.map(sector => ({
                                                id: sector.id,
                                                name: `${sector.name}${sector.cities ? ` (${sector.cities.name})` : ''}`
                                            }))}
                                            value={formData.specialty_sectors || []}
                                            onChange={(value) => handleInputChange('specialty_sectors', value)}
                                            placeholder="Busca y selecciona hasta 3 sectores de especialidad"
                                            maxItems={3}
                                            multiple={true}
                                        />
                                    )}
                                </div>

                                {/* Categorías de Propiedades - SIN BÚSQUEDA (pocas opciones) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipos de Propiedades de Especialidad (Máximo 3)
                                    </label>
                                    {loadingDropdowns ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                            Cargando categorías...
                                        </div>
                                    ) : (
                                        <MultiSelectSpecialty
                                            options={propertyCategories.map(category => ({
                                                id: category.id,
                                                name: category.name
                                            }))}
                                            value={formData.specialty_property_categories || []}
                                            onChange={(value) => handleInputChange('specialty_property_categories', value)}
                                            placeholder="Selecciona hasta 3 tipos de propiedades"
                                            maxItems={3}
                                        />
                                    )}
                                </div>

                                {/* Descripción de Especialidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción de Especialidad
                                    </label>
                                    <textarea
                                        value={formData.specialty_description || ''}
                                        onChange={(e) => handleInputChange('specialty_description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Experto en propiedades de lujo en Piantini y Naco, especializado en apartamentos y penthouses para inversión..."
                                    />
                                </div>

                                {/* Idiomas que maneja */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Idiomas que Maneja (Máximo 5)
                                    </label>
                                    <MultiSelectSpecialty
                                        options={[
                                            { id: 'Español', name: 'Español' },
                                            { id: 'Inglés', name: 'Inglés' },
                                            { id: 'Francés', name: 'Francés' },
                                            { id: 'Italiano', name: 'Italiano' },
                                            { id: 'Portugués', name: 'Portugués' },
                                            { id: 'Alemán', name: 'Alemán' },
                                            { id: 'Chino Mandarín', name: 'Chino Mandarín' },
                                            { id: 'Japonés', name: 'Japonés' },
                                            { id: 'Coreano', name: 'Coreano' },
                                            { id: 'Árabe', name: 'Árabe' },
                                            { id: 'Ruso', name: 'Ruso' },
                                            { id: 'Holandés', name: 'Holandés' },
                                            { id: 'Sueco', name: 'Sueco' },
                                            { id: 'Noruego', name: 'Noruego' },
                                            { id: 'Danés', name: 'Danés' },
                                            { id: 'Finlandés', name: 'Finlandés' },
                                            { id: 'Polaco', name: 'Polaco' },
                                            { id: 'Checo', name: 'Checo' },
                                            { id: 'Húngaro', name: 'Húngaro' },
                                            { id: 'Griego', name: 'Griego' },
                                            { id: 'Turco', name: 'Turco' },
                                            { id: 'Hindi', name: 'Hindi' },
                                            { id: 'Tailandés', name: 'Tailandés' },
                                            { id: 'Vietnamita', name: 'Vietnamita' },
                                            { id: 'Hebreo', name: 'Hebreo' }
                                        ]}
                                        value={formData.languages || []}
                                        onChange={(value) => handleInputChange('languages', value)}
                                        placeholder="Selecciona los idiomas que domina"
                                        maxItems={5}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Selecciona los idiomas que el asesor puede usar para atender clientes
                                    </p>
                                </div>
                            </div>

                            {/* Vista previa de especialidades */}
                            {(formData.specialty_cities?.length > 0 || 
                              formData.specialty_sectors?.length > 0 || 
                              formData.specialty_property_categories?.length > 0 ||
                              formData.languages?.length > 0 ||
                              formData.specialty_description) && (
                                <div className="border-t border-gray-200 pt-4 mt-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        👀 Vista Previa de Especialidades
                                    </h4>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            {formData.specialty_cities?.length > 0 && (
                                                <div>
                                                    <div className="font-medium text-blue-900 mb-1">Ciudades</div>
                                                    <div className="text-blue-700">
                                                        {cities
                                                            .filter(city => formData.specialty_cities.includes(city.id))
                                                            .map(city => city.name)
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {formData.specialty_sectors?.length > 0 && (
                                                <div>
                                                    <div className="font-medium text-blue-900 mb-1">Sectores</div>
                                                    <div className="text-blue-700">
                                                        {sectors
                                                            .filter(sector => formData.specialty_sectors.includes(sector.id))
                                                            .map(sector => sector.name)
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {formData.specialty_property_categories?.length > 0 && (
                                                <div>
                                                    <div className="font-medium text-blue-900 mb-1">Tipos de Propiedades</div>
                                                    <div className="text-blue-700">
                                                        {propertyCategories
                                                            .filter(cat => formData.specialty_property_categories.includes(cat.id))
                                                            .map(cat => cat.name)
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Mostrar idiomas en la vista previa */}
                                        {formData.languages?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <div className="font-medium text-blue-900 mb-1">Idiomas</div>
                                                <div className="text-blue-700 text-sm">
                                                    {formData.languages.join(', ')}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {formData.specialty_description && (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <div className="font-medium text-blue-900 mb-1">Descripción</div>
                                                <div className="text-blue-700 text-sm">{formData.specialty_description}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Información calculada en tiempo real */}
                        {(formData.sales_count > 0 || formData.company_start_date || formData.years_experience > 0) && (
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    📊 Estadísticas Calculadas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    {formData.company_start_date && (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="font-medium text-blue-900">Años en la Empresa</div>
                                            <div className="text-blue-700">
                                                {(() => {
                                                    const startDate = new Date(formData.company_start_date);
                                                    const years = Math.floor((new Date() - startDate) / (365.25 * 24 * 60 * 60 * 1000));
                                                    return years >= 0 ? `${years} años` : 'Fecha futura';
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {formData.years_experience > 0 && (
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <div className="font-medium text-green-900">Nivel de Experiencia</div>
                                            <div className="text-green-700">
                                                {formData.years_experience >= 10 ? 'Senior' :
                                                 formData.years_experience >= 5 ? 'Intermedio' :
                                                 formData.years_experience >= 2 ? 'Junior' : 'Principiante'}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {formData.sales_count > 0 && formData.company_start_date && (
                                        <div className="bg-purple-50 p-3 rounded-lg">
                                            <div className="font-medium text-purple-900">Ventas por Año</div>
                                            <div className="text-purple-700">
                                                {(() => {
                                                    const startDate = new Date(formData.company_start_date);
                                                    const years = Math.max(1, Math.floor((new Date() - startDate) / (365.25 * 24 * 60 * 60 * 1000)));
                                                    return (formData.sales_count / years).toFixed(1);
                                                })()} ventas/año
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Biografía con Editor WYSIWYG */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Biografía</h2>
                        </div>

                        <WYSIWYGSEOEditor
                            value={formData.biography || ''}
                            onChange={(value) => handleInputChange('biography', value)}
                            placeholder="Describe al usuario, su experiencia profesional, logros, especialidades en el mercado inmobiliario, etc..."
                            cities={[
                                'Santo Domingo', 'Santiago', 'Puerto Plata', 'La Romana', 'San Pedro de Macorís',
                                'Piantini', 'Naco', 'Bella Vista', 'Gazcue', 'Zona Colonial', 'Ensanche Ozama',
                                'Los Cacicazgos', 'Serrallés', 'Mirador Sur', 'Mirador Norte'
                            ]}
                            propertyTypes={[
                                'apartamentos', 'casas', 'villas', 'penthouses', 'condominios', 'townhouses',
                                'locales comerciales', 'oficinas', 'terrenos', 'solares', 'proyectos',
                                'residencias', 'estudios', 'duplex'
                            ]}
                        />
                    </Card>

                    {/* Redes sociales */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Globe className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Redes Sociales</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    <span>Facebook</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.facebook_url || ''}
                                    onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://facebook.com/usuario"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Instagram className="w-4 h-4 text-pink-600" />
                                    <span>Instagram</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.instagram_url || ''}
                                    onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://instagram.com/usuario"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Twitter className="w-4 h-4 text-blue-400" />
                                    <span>Twitter</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.twitter_url || ''}
                                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://twitter.com/usuario"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Linkedin className="w-4 h-4 text-blue-700" />
                                    <span>LinkedIn</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.linkedin_url || ''}
                                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://linkedin.com/in/usuario"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    <span>YouTube</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.youtube_url || ''}
                                    onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://youtube.com/c/usuario"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Configuración y estado */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Configuración y Estado</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={formData.active !== false}
                                        onChange={(e) => handleInputChange('active', e.target.checked)}
                                        className="rounded border-gray-300 mr-3"
                                    />
                                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                                        Usuario activo
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="show_on_website"
                                        checked={formData.show_on_website !== false}
                                        onChange={(e) => handleInputChange('show_on_website', e.target.checked)}
                                        className="rounded border-gray-300 mr-3"
                                    />
                                    <label htmlFor="show_on_website" className="text-sm font-medium text-gray-700">
                                        Mostrar en el sitio web
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Último Acceso
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.last_access || ''}
                                    onChange={(e) => handleInputChange('last_access', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Información del sistema */}
                    <Card className="p-6 bg-gray-50">
                        <div className="flex items-center space-x-2 mb-4">
                            <Hash className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-700">Información del Sistema</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">ID Interno:</span> {user.id}
                            </div>
                            <div>
                                <span className="font-medium">Fecha de Creación:</span> {
                                    user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'No disponible'
                                }
                            </div>
                            <div>
                                <span className="font-medium">Última Actualización:</span> {
                                    user.updated_at ? new Date(user.updated_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'No disponible'
                                }
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer fijo con botones */}
            <div className="border-t border-gray-200 bg-white p-4">
                <div className="max-w-full mx-auto flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {unsavedChanges ? 'Tienes cambios sin guardar' : 'Todos los cambios guardados'}
                    </div>
                    <div className="flex space-x-3">
                        <Button 
                            variant="outline" 
                            onClick={handleBack}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSave}
                            disabled={saving || !unsavedChanges}
                            icon={saving ? <div className="animate-spin w-4 h-4 border border-white rounded-full border-t-transparent" /> : <Save className="w-4 h-4" />}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación para salir */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={handleCancelExit}
                onConfirm={handleConfirmExit}
                title="Cambios sin guardar"
                message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir? Se perderán todos los cambios."
                confirmText="Salir sin guardar"
                cancelText="Continuar editando"
                variant="warning"
            />
        </div>
    );
};

export default UserEditPage;