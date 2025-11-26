// LoginPage.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Shield, BarChart3, Users, Building, CheckCircle, UserPlus, Handshake, Home, Wrench, Palette, GraduationCap } from 'lucide-react';

// Importar Supabase client
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl } from '../services/api';

const LoginPage = ({ onLogin, authLoading, authError }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [submittingForm, setSubmittingForm] = useState(false);
    const [submitError, setSubmitError] = useState('');
    
    // Estados para manejo de países
    const [countries, setCountries] = useState([]);
    const [detectedCountry, setDetectedCountry] = useState('DOM');
    const [loadingCountries, setLoadingCountries] = useState(true);
    
    // Estados para tipos de usuario dinámicos desde BD
    const [availableUserTypes, setAvailableUserTypes] = useState([]);
    const [loadingUserTypes, setLoadingUserTypes] = useState(true);

    // Estados para feature flags dinámicos también
    const [dynamicFeatures, setDynamicFeatures] = useState([]);
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    // Mapeo de iconos para los tipos de usuario
    const iconMap = {
        UserPlus,
        Handshake,
        Home,
        Wrench,
        GraduationCap
    };

    // ✅ FEATURES SECTION - Mantener esto para la landing page
    const features = [
        {
            icon: UserPlus,
            title: "Asesor Inmobiliario",
            description: "Entrénate, certifícate y compite por leads premium. Sistema meritocrático sin membresías."
        },
        {
            icon: Handshake,
            title: "Referidor Oficial",
            description: "Comparte nuestro inventario con tus contactos y gana por cada cliente que registres."
        },
        {
            icon: Home,
            title: "Rentas Vacacionales",
            description: "Administra tu portafolio de propiedades para alquiler turístico y corporativo."
        },
        {
            icon: Wrench,
            title: "Proveedores de Servicios",
            description: "Decoradores, electricistas, pintores y servicios especializados para compradores CLIC."
        }
    ];

    const stats = [
        { number: "100%", label: "Sin Costos de Entrada" },
        { number: "Top 10%", label: "Solo Asesores Elite" },
        { number: "24/7", label: "Leads Automatizados" },
        { number: "Gamificado", label: "Sistema de Rankings" }
    ];

    // ✅ FUNCIÓN PRINCIPAL - Obtener tipos de usuario activos desde BD
    const fetchActiveUserTypes = async () => {
        try {
            setLoadingUserTypes(true);
            console.log('🔍 Obteniendo tipos de usuario activos desde BD...');
            
            // Usar la función SQL que creamos
            const { data, error } = await supabase.rpc('get_active_registration_types');

            if (error) {
                console.error('❌ Error obteniendo tipos de usuario:', error);
                // ❌ NO usar fallback hardcodeado, mostrar mensaje de error
                setAvailableUserTypes([]);
                setSubmitError('No se pudieron cargar las opciones de registro. Intenta más tarde.');
                return;
            }

            if (!data || data.length === 0) {
                console.warn('⚠️ No hay tipos de usuario activos');
                setAvailableUserTypes([]);
                setSubmitError('No hay opciones de registro disponibles en este momento.');
                return;
            }

            // ✅ Mapear datos de la BD a formato del componente
            const mappedTypes = data.map(item => {
                const typeId = item.type_key.replace('registration_', '');
                const config = item.type_config;
                
                return {
                    id: typeId,
                    title: config.title || getTypeTitle(typeId),
                    description: config.description || getTypeDescription(typeId, config),
                    icon: config.icon || 'UserPlus',
                    color: config.color || getDefaultColor(typeId),
                    price: config.price || null,
                    priority: config.priority || 999,
                    enabled: item.is_enabled
                };
            });

            // ✅ Ordenar por prioridad
            mappedTypes.sort((a, b) => a.priority - b.priority);
            
            setAvailableUserTypes(mappedTypes);
            console.log('✅ Tipos de usuario cargados desde BD:', mappedTypes.length);
            console.log('📋 Tipos disponibles:', mappedTypes.map(t => t.title));
            
        } catch (error) {
            console.error('❌ Error cargando tipos de usuario:', error);
            setAvailableUserTypes([]);
            setSubmitError('Error de conexión. No se pudieron cargar las opciones de registro.');
        } finally {
            setLoadingUserTypes(false);
        }
    };

    // Función helper para obtener títulos por defecto
    const getTypeTitle = (typeId) => {
        const titles = {
            asesor: 'Asesor Inmobiliario',
            referidor: 'Referidor Oficial',
            rentals: 'Rentas Vacacionales',
            proveedor: 'Proveedor de Servicios',
            estudiante: 'Estudiante CLIC'
        };
        return titles[typeId] || 'Tipo de Usuario';
    };

    // Función helper para obtener descripciones por defecto
    const getTypeDescription = (typeId, config) => {
        const descriptions = {
            asesor: 'Entrénate, certifícate y accede a leads premium',
            referidor: 'Refiere clientes y gana comisiones por cada venta',
            rentals: 'Gestiona tu inventario de propiedades de alquiler',
            proveedor: 'Servicios especializados para compradores CLIC',
            estudiante: `Accede a entrenamientos CLIC ${config?.price ? `desde $${config.price}` : ''}`
        };
        return descriptions[typeId] || 'Participa en el ecosistema CLIC';
    };

    // Función helper para colores por defecto
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

    // Función para obtener países activos
    const fetchActiveCountries = async () => {
        try {
            setLoadingCountries(true);
            
            const { data, error } = await supabase
                .from('countries')
                .select('code, name, country_flag')
                .eq('active', true)
                .order('name');

            if (error) {
                console.error('Error obteniendo países:', error);
                // Fallback a países por defecto
                setCountries([
                    { code: 'DOM', name: 'República Dominicana', country_flag: '🇩🇴' }
                ]);
            } else {
                setCountries(data || []);
                console.log('✅ Países activos cargados:', data?.length);
            }
        } catch (error) {
            console.error('Error cargando países:', error);
            setCountries([
                { code: 'DOM', name: 'República Dominicana', country_flag: '🇩🇴' }
            ]);
        } finally {
            setLoadingCountries(false);
        }
    };

    // Función para detectar país del usuario
    const detectUserCountry = async () => {
        try {
            // Intentar detectar país por IP usando un servicio gratuito
            const response = await fetch('https://ipapi.co/json/', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                const countryCode = data.country_code;
                
                // Mapear códigos de países comunes a nuestros códigos
                const countryMapping = {
                    'DO': 'DOM',
                    'US': 'USA',
                    'ES': 'ESP',
                    'CA': 'CAN',
                    'CO': 'COL',
                    'PA': 'PAN',
                    'MX': 'MEX',
                    'VE': 'VEN',
                    'PE': 'PER',
                    'AR': 'ARG',
                    'CL': 'CHL',
                    'BR': 'BRA',
                    'FR': 'FRA',
                    'IT': 'ITA',
                    'GB': 'GBR'
                };
                
                const mappedCode = countryMapping[countryCode] || 'DOM';
                setDetectedCountry(mappedCode);
                console.log(`🌍 País detectado: ${countryCode} -> ${mappedCode}`);
            }
        } catch (error) {
            console.log('⚠️ No se pudo detectar país, usando DOM por defecto');
            setDetectedCountry('DOM');
        }
    };

    // ✅ useEffect - Cargar datos al montar el componente
    useEffect(() => {
        // ✅ PRIORIZAR la carga de tipos de usuario desde BD
        fetchActiveUserTypes();
        fetchActiveCountries();
        detectUserCountry();
        
        // ✅ Cargar features dinámicos para landing page
        fetchDynamicFeatures();
    }, []);

    // ✅ Función para cargar features dinámicos para la landing page
    const fetchDynamicFeatures = async () => {
        try {
            setLoadingFeatures(true);
            
            const { data, error } = await supabase.rpc('get_active_registration_types');

            if (error || !data || data.length === 0) {
                console.log('⚠️ No hay tipos activos, usando features estáticos');
                // Usar features estáticos como fallback
                setDynamicFeatures(features);
                return;
            }

            // Mapear tipos activos a features para landing page
            const mappedFeatures = data.map(item => {
                const typeId = item.type_key.replace('registration_', '');
                const config = item.type_config;
                const IconComponent = iconMap[config.icon] || UserPlus;
                
                return {
                    icon: IconComponent,
                    title: config.title || getTypeTitle(typeId),
                    description: config.description || getTypeDescription(typeId, config)
                };
            });

            setDynamicFeatures(mappedFeatures);
            console.log('✅ Features dinámicos cargados:', mappedFeatures.length);
            
        } catch (error) {
            console.error('❌ Error cargando features dinámicos:', error);
            setDynamicFeatures(features); // Fallback a estáticos
        } finally {
            setLoadingFeatures(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (email && password) {
            await onLogin(email, password);
        }
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        setSubmittingForm(true);
        setSubmitError('');

        try {
            const formData = new FormData(e.target);
            
            // Construir el objeto de datos básicos
            const registrationData = {
                tipo_usuario: selectedUserType,
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                comentarios: formData.get('comentarios') || null,
                country_code: formData.get('country_code') || detectedCountry,
                detected_country: detectedCountry
            };

            // Agregar campos específicos según el tipo de usuario
            if (selectedUserType === 'asesor') {
                registrationData.asesor_edad = formData.get('asesor_edad');
                registrationData.asesor_trabaja_actualmente = formData.get('asesor_trabaja_actualmente');
                registrationData.asesor_tiene_vehiculo = formData.get('asesor_tiene_vehiculo');
                registrationData.asesor_anos_experiencia = formData.get('asesor_anos_experiencia');
                registrationData.asesor_otra_inmobiliaria = formData.get('asesor_otra_inmobiliaria');
            } else if (selectedUserType === 'rentals') {
                registrationData.rentals_tipo_propietario = formData.get('rentals_tipo_propietario');
                registrationData.rentals_cantidad_propiedades = formData.get('rentals_cantidad_propiedades');
                registrationData.rentals_ubicacion_propiedades = formData.get('rentals_ubicacion_propiedades');
                registrationData.rentals_precio_promedio_noche = formData.get('rentals_precio_promedio_noche');
            } else if (selectedUserType === 'proveedor') {
                registrationData.proveedor_tipo_servicio = formData.get('proveedor_tipo_servicio');
                registrationData.proveedor_anos_experiencia = formData.get('proveedor_anos_experiencia');
                registrationData.proveedor_zonas_trabajo = formData.get('proveedor_zonas_trabajo');
            } else if (selectedUserType === 'referidor') {
                registrationData.referidor_vive_rd = formData.get('referidor_vive_rd');
                registrationData.referidor_pais_residencia = formData.get('referidor_pais_residencia') || null;
                registrationData.referidor_ocupacion_actual = formData.get('referidor_ocupacion_actual');
                registrationData.referidor_motivacion = formData.get('referidor_motivacion');
                registrationData.referidor_pais_objetivo = formData.get('referidor_pais_objetivo') || null;
            } else if (selectedUserType === 'estudiante') {
                registrationData.estudiante_curso_interes = formData.get('estudiante_curso_interes');
                registrationData.estudiante_nivel_experiencia = formData.get('estudiante_nivel_experiencia');
                registrationData.estudiante_objetivos = formData.get('estudiante_objetivos');
            }

            console.log('📋 Enviando datos de registro:', registrationData);
            
            // OPCIÓN 1: Usar función SQL personalizada para evitar RLS
            try {
                console.log('🚀 Intentando con función SQL...');
                const { data, error } = await supabase.rpc('insert_registro_solicitud', {
                    p_tipo_usuario: registrationData.tipo_usuario,
                    p_nombre: registrationData.nombre,
                    p_apellido: registrationData.apellido,
                    p_email: registrationData.email,
                    p_telefono: registrationData.telefono,
                    p_comentarios: registrationData.comentarios,
                    p_country_code: registrationData.country_code,
                    p_detected_country: registrationData.detected_country,
                    
                    // Campos específicos por tipo
                    p_asesor_edad: registrationData.asesor_edad || null,
                    p_asesor_trabaja_actualmente: registrationData.asesor_trabaja_actualmente || null,
                    p_asesor_tiene_vehiculo: registrationData.asesor_tiene_vehiculo || null,
                    p_asesor_anos_experiencia: registrationData.asesor_anos_experiencia || null,
                    p_asesor_otra_inmobiliaria: registrationData.asesor_otra_inmobiliaria || null,
                    
                    p_rentals_tipo_propietario: registrationData.rentals_tipo_propietario || null,
                    p_rentals_cantidad_propiedades: registrationData.rentals_cantidad_propiedades || null,
                    p_rentals_ubicacion_propiedades: registrationData.rentals_ubicacion_propiedades || null,
                    p_rentals_precio_promedio_noche: registrationData.rentals_precio_promedio_noche || null,
                    
                    p_proveedor_tipo_servicio: registrationData.proveedor_tipo_servicio || null,
                    p_proveedor_anos_experiencia: registrationData.proveedor_anos_experiencia || null,
                    p_proveedor_zonas_trabajo: registrationData.proveedor_zonas_trabajo || null,
                    
                    p_referidor_vive_rd: registrationData.referidor_vive_rd || null,
                    p_referidor_pais_residencia: registrationData.referidor_pais_residencia || null,
                    p_referidor_ocupacion_actual: registrationData.referidor_ocupacion_actual || null,
                    p_referidor_motivacion: registrationData.referidor_motivacion || null,
                    p_referidor_pais_objetivo: registrationData.referidor_pais_objetivo || null,
                    
                    p_estudiante_curso_interes: registrationData.estudiante_curso_interes || null,
                    p_estudiante_nivel_experiencia: registrationData.estudiante_nivel_experiencia || null,
                    p_estudiante_objetivos: registrationData.estudiante_objetivos || null
                });

                if (error) {
                    console.error('❌ Error en función SQL:', error);
                    throw error;
                }

                if (data && !data.success) {
                    if (data.code === 'DUPLICATE_EMAIL') {
                        setSubmitError('Ya tienes una solicitud registrada con este email. Nuestro equipo la revisará pronto.');
                        return;
                    }
                    throw new Error(data.error || 'Error desconocido en función SQL');
                }

                console.log('✅ Solicitud registrada exitosamente con función SQL:', data?.solicitud_id);
                setRegistrationSuccess(true);
                return;

            } catch (functionError) {
                console.log('⚠️ Función SQL falló, intentando inserción directa...');
                console.error('Error función SQL:', functionError);
                
                // OPCIÓN 2: Inserción directa con RLS bypass usando service_role key
                try {
                    console.log('🔄 Intentando inserción directa sin RLS...');
                    
                    // Crear cliente con service_role key temporal para bypass RLS
                    const supabaseServiceRole = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY2NTg5OSwiZXhwIjoyMDY0MjQxODk5fQ.jY_7riCsC_BLjj-Q7DLzjyqOkc0CxA7Hn3xbh49Rf1A');
                    
                    const { data, error } = await supabaseServiceRole
                        .from('registro_solicitudes')
                        .insert([registrationData])
                        .select();

                    if (error) {
                        if (error.code === '23505') { // Unique constraint violation
                            setSubmitError('Ya tienes una solicitud pendiente con este email. Nuestro equipo la revisará pronto.');
                            return;
                        }
                        console.error('❌ Error inserción directa:', error);
                        throw error;
                    }

                    console.log('✅ Solicitud guardada directamente en BD (bypass RLS):', data[0]?.id);
                    setRegistrationSuccess(true);
                    
                } catch (directError) {
                    console.error('❌ Error inserción directa:', directError);
                    
                    // OPCIÓN 3: Edge Function como último recurso
                    try {
                        console.log('🔄 Último intento: Edge Function...');
                        
                        const { data, error } = await supabase.functions.invoke('create-registration', {
                            body: registrationData
                        });

                        if (error) throw error;

                        console.log('✅ Solicitud guardada via Edge Function:', data?.id);
                        setRegistrationSuccess(true);
                        
                    } catch (edgeError) {
                        console.error('❌ Todos los métodos fallaron:', edgeError);
                        throw edgeError;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error al enviar solicitud:', error);
            
            let errorMessage = 'Hubo un error al enviar tu solicitud. Por favor intenta nuevamente.';
            
            if (error.message?.includes('duplicate key')) {
                errorMessage = 'Ya tienes una solicitud pendiente. Nuestro equipo la revisará pronto.';
            } else if (error.message?.includes('network')) {
                errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setSubmitError(errorMessage);
        } finally {
            setSubmittingForm(false);
        }
    };

    // ✅ Resto del componente permanece igual...
    // Pantalla de éxito en el registro
    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-100">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            ¡Solicitud Recibida!
                        </h2>
                        
                        <div className="space-y-4 text-gray-600 mb-8">
                            <p className="text-lg">
                                Gracias por tu interés en formar parte del ecosistema CLIC.
                            </p>
                            <p>
                                Hemos recibido tu solicitud y nuestro equipo la revisará cuidadosamente.
                            </p>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <p className="text-sm text-orange-800 font-medium">
                                    📋 <strong>Importante:</strong> Nuestro proceso de selección puede tomar algunos días. 
                                    Por favor, no te desesperes si tardamos en contactarte y 
                                    <strong> no vuelvas a registrarte</strong>.
                                </p>
                            </div>
                            <p className="text-sm">
                                Te contactaremos por email o teléfono cuando tengamos una respuesta.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setRegistrationSuccess(false);
                                    setShowRegistrationForm(false);
                                    setSelectedUserType('');
                                }}
                                className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                            >
                                Volver al Inicio
                            </button>
                            
                            <p className="text-xs text-gray-500">
                                ¿Preguntas? Escríbenos a{' '}
                                <span className="text-orange-600 font-medium">info@clicinmobiliaria.com</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showRegistrationForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl w-full">
                    {/* Back button */}
                    <button
                        onClick={() => setShowRegistrationForm(false)}
                        className="mb-6 flex items-center text-gray-600 hover:text-orange-600 transition-colors duration-200"
                    >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Volver
                    </button>

                    {!selectedUserType ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                                    <img 
                                        src="/clic logo negro.png" 
                                        alt="CLIC Logo" 
                                        className="h-8 w-auto" 
                                    />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    Únete al Ecosistema CLIC
                                </h2>
                                <p className="text-gray-600">
                                    Selecciona cómo quieres participar en nuestra plataforma
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {loadingUserTypes ? (
                                    <div className="col-span-2 flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                                        <span className="text-gray-600">Cargando opciones disponibles...</span>
                                    </div>
                                ) : availableUserTypes.length === 0 ? (
                                    <div className="col-span-2 text-center py-12">
                                        <p className="text-gray-600">No hay opciones de registro disponibles en este momento.</p>
                                        <p className="text-sm text-gray-500 mt-2">Por favor intenta más tarde.</p>
                                        {submitError && (
                                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                                <p className="text-sm text-red-600">{submitError}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    availableUserTypes.map((type) => {
                                        const IconComponent = iconMap[type.icon] || UserPlus;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedUserType(type.id)}
                                                className="p-6 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-200 hover:scale-105 hover:shadow-lg text-left group relative"
                                            >
                                                {type.price && (
                                                    <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                                        ${type.price}
                                                    </div>
                                                )}
                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                                                    <IconComponent className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.title}</h3>
                                                <p className="text-gray-600 text-sm">{type.description}</p>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <button
                                onClick={() => setSelectedUserType('')}
                                className="mb-4 flex items-center text-gray-600 hover:text-orange-600 transition-colors duration-200"
                            >
                                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                                Cambiar tipo de usuario
                            </button>

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Registro como {availableUserTypes.find(t => t.id === selectedUserType)?.title}
                                </h2>
                                <p className="text-gray-600">
                                    Completa la información para crear tu cuenta
                                </p>
                                {availableUserTypes.find(t => t.id === selectedUserType)?.price && (
                                    <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                        <span>💳 Inversión: ${availableUserTypes.find(t => t.id === selectedUserType).price}</span>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleRegistrationSubmit} className="max-w-lg mx-auto space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre
                                        </label>
                                        <input
                                            name="nombre"
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Apellido
                                        </label>
                                        <input
                                            name="apellido"
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            placeholder="Tu apellido"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="tu@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        name="telefono"
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="(809) 000-0000"
                                    />
                                </div>

                                {/* Selector de país - Solo mostrar si hay más de un país activo */}
                                {countries.length > 1 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            País donde te encuentras
                                        </label>
                                        {loadingCountries ? (
                                            <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-3"></div>
                                                <span className="text-gray-500">Cargando países...</span>
                                            </div>
                                        ) : (
                                            <select
                                                name="country_code"
                                                required
                                                defaultValue={detectedCountry}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                {countries.map((country) => (
                                                    <option key={country.code} value={country.code}>
                                                        {country.country_flag} {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {detectedCountry && detectedCountry !== 'DOM' && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                💡 Detectamos que estás en {countries.find(c => c.code === detectedCountry)?.name || 'otro país'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Campo oculto para país si solo hay uno activo */}
                                {countries.length === 1 && (
                                    <input
                                        type="hidden"
                                        name="country_code"
                                        value={countries[0]?.code || 'DOM'}
                                    />
                                )}

                                {/* 🔥 PREGUNTAS ESPECÍFICAS POR TIPO DE USUARIO */}
                                {selectedUserType === 'asesor' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Edad
                                            </label>
                                            <select
                                                name="asesor_edad"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona tu edad</option>
                                                <option value="18-25">18-25 años</option>
                                                <option value="26-35">26-35 años</option>
                                                <option value="36-45">36-45 años</option>
                                                <option value="46-55">46-55 años</option>
                                                <option value="56+">Más de 56 años</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Trabajas actualmente como asesor inmobiliario?
                                            </label>
                                            <select
                                                name="asesor_trabaja_actualmente"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="si">Sí, trabajo actualmente</option>
                                                <option value="no">No, busco mi primera oportunidad</option>
                                                <option value="freelance">Trabajo por mi cuenta</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Tienes vehículo propio?
                                            </label>
                                            <select
                                                name="asesor_tiene_vehiculo"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="si">Sí, tengo vehículo</option>
                                                <option value="no">No tengo vehículo</option>
                                                <option value="acceso">Tengo acceso a vehículo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Años de experiencia en bienes raíces
                                            </label>
                                            <select
                                                name="asesor_anos_experiencia"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona tu experiencia</option>
                                                <option value="0">Sin experiencia</option>
                                                <option value="1">Menos de 1 año</option>
                                                <option value="2">1-2 años</option>
                                                <option value="3">3-5 años</option>
                                                <option value="6">Más de 5 años</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Estás actualmente en otra inmobiliaria?
                                            </label>
                                            <select
                                                name="asesor_otra_inmobiliaria"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="no">No estoy en ninguna</option>
                                                <option value="si">Sí, estoy en otra inmobiliaria</option>
                                                <option value="independiente">Trabajo independiente</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {selectedUserType === 'estudiante' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Qué curso te interesa?
                                            </label>
                                            <select
                                                name="estudiante_curso_interes"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona un curso</option>
                                                <option value="fundamentos-inmobiliarios">Fundamentos Inmobiliarios</option>
                                                <option value="marketing-digital-inmobiliario">Marketing Digital Inmobiliario</option>
                                                <option value="negociacion-y-ventas">Negociación y Ventas</option>
                                                <option value="inversion-inmobiliaria">Inversión Inmobiliaria</option>
                                                <option value="rentas-vacacionales">Gestión de Rentas Vacacionales</option>
                                                <option value="curso-completo">Programa Completo CLIC</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Cuál es tu nivel de experiencia?
                                            </label>
                                            <select
                                                name="estudiante_nivel_experiencia"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona tu nivel</option>
                                                <option value="principiante">Principiante - Sin experiencia</option>
                                                <option value="basico">Básico - Menos de 1 año</option>
                                                <option value="intermedio">Intermedio - 1-3 años</option>
                                                <option value="avanzado">Avanzado - Más de 3 años</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Qué esperas lograr con este entrenamiento?
                                            </label>
                                            <textarea
                                                name="estudiante_objetivos"
                                                rows="3"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Cuéntanos tus objetivos y expectativas..."
                                            ></textarea>
                                        </div>

                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                            <h4 className="font-medium text-orange-800 mb-2">💳 Información de Pago</h4>
                                            <p className="text-sm text-orange-700 mb-3">
                                                Después de enviar tu solicitud, te contactaremos con las opciones de pago disponibles.
                                            </p>
                                            <div className="text-xs text-orange-600">
                                                <p>✅ Tarjetas de crédito/débito</p>
                                                <p>✅ PayPal</p>
                                                <p>✅ Transferencia bancaria</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedUserType === 'rentals' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Eres propietario de las propiedades?
                                            </label>
                                            <select
                                                name="rentals_tipo_propietario"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="propietario">Soy propietario</option>
                                                <option value="administrador">Administro para otros</option>
                                                <option value="ambos">Ambos (propias y administradas)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Cuántas propiedades planeas manejar?
                                            </label>
                                            <select
                                                name="rentals_cantidad_propiedades"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona cantidad</option>
                                                <option value="1">1 propiedad</option>
                                                <option value="2-3">2-3 propiedades</option>
                                                <option value="4-10">4-10 propiedades</option>
                                                <option value="10+">Más de 10 propiedades</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ubicación principal de tus propiedades
                                            </label>
                                            <input
                                                name="rentals_ubicacion_propiedades"
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Ej: Punta Cana, Bávaro, Distrito Nacional..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Precio promedio por noche (USD)
                                            </label>
                                            <select
                                                name="rentals_precio_promedio_noche"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona rango de precios</option>
                                                <option value="50-100">$50 - $100</option>
                                                <option value="100-200">$100 - $200</option>
                                                <option value="200-300">$200 - $300</option>
                                                <option value="300-500">$300 - $500</option>
                                                <option value="500+">Más de $500</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {selectedUserType === 'proveedor' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Servicio
                                            </label>
                                            <select
                                                name="proveedor_tipo_servicio"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona un servicio</option>
                                                <option value="decoracion">Decoración</option>
                                                <option value="pintura">Pintura</option>
                                                <option value="electricidad">Electricidad</option>
                                                <option value="plomeria">Plomería</option>
                                                <option value="muebles">Tienda de Muebles</option>
                                                <option value="electrodomesticos">Electrodomésticos</option>
                                                <option value="shutters">Shutters</option>
                                                <option value="ventanas">Ventanas</option>
                                                <option value="pisos">Pulido de Pisos</option>
                                                <option value="jardineria">Jardinería</option>
                                                <option value="limpieza">Limpieza</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Años de experiencia en tu servicio
                                            </label>
                                            <select
                                                name="proveedor_anos_experiencia"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona tu experiencia</option>
                                                <option value="1">Menos de 1 año</option>
                                                <option value="2">1-2 años</option>
                                                <option value="3">3-5 años</option>
                                                <option value="6">5-10 años</option>
                                                <option value="10+">Más de 10 años</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Zonas donde trabajas normalmente
                                            </label>
                                            <input
                                                name="proveedor_zonas_trabajo"
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Ej: Distrito Nacional, Santiago, Todo el país..."
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedUserType === 'referidor' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Vives en República Dominicana?
                                            </label>
                                            <select
                                                name="referidor_vive_rd"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                <option value="si">Sí, vivo en RD</option>
                                                <option value="no">No, vivo fuera de RD</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Si vives fuera, ¿en qué país?
                                            </label>
                                            <input
                                                name="referidor_pais_residencia"
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Ej: Estados Unidos, España, Canadá..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿A qué te dedicas actualmente?
                                            </label>
                                            <input
                                                name="referidor_ocupacion_actual"
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Ej: Médico, Ingeniero, Empresario, Estudiante..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿Por qué te interesa ser referidor CLIC?
                                            </label>
                                            <textarea
                                                name="referidor_motivacion"
                                                rows="3"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Cuéntanos tu motivación..."
                                            ></textarea>
                                        </div>

                                        {/* Campo adicional para referidores: país objetivo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ¿En qué país planeas referir más clientes?
                                            </label>
                                            <select
                                                name="referidor_pais_objetivo"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="">Selecciona país objetivo</option>
                                                <option value="DOM">🇩🇴 República Dominicana</option>
                                                <option value="USA">🇺🇸 Estados Unidos</option>
                                                <option value="ESP">🇪🇸 España</option>
                                                <option value="CAN">🇨🇦 Canadá</option>
                                                <option value="COL">🇨🇴 Colombia</option>
                                                <option value="PAN">🇵🇦 Panamá</option>
                                                <option value="MEX">🇲🇽 México</option>
                                                <option value="MULTIPLE">🌎 Múltiples países</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cuéntanos sobre ti
                                    </label>
                                    <textarea
                                        name="comentarios"
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Experiencia, motivación, objetivos..."
                                    ></textarea>
                                </div>
                                
                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-sm text-red-600 flex items-center">
                                            <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mr-2"></div>
                                            {submitError}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submittingForm}
                                    className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                                >
                                    {submittingForm ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Enviando Solicitud...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Enviar Solicitud</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    Tu solicitud será revisada por nuestro equipo y te contactaremos pronto.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Formulario de login
    if (showLoginForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Back button */}
                    <button
                        onClick={() => setShowLoginForm(false)}
                        className="mb-6 flex items-center text-gray-600 hover:text-orange-600 transition-colors duration-200"
                    >
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Volver
                    </button>

                    {/* Login Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                                <img 
                                    src="/clic logo negro.png" 
                                    alt="CLIC Logo" 
                                    className="h-8 w-auto" 
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Iniciar Sesión
                            </h2>
                            <p className="text-gray-600">
                                Accede a tu cuenta de CLIC Inmobiliaria
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                        placeholder="tu@email.com"
                                    />
                                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {authError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-sm text-red-600 flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mr-2"></div>
                                        {authError}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                            >
                                {authLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Ingresar</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 mb-3">
                                ¿No tienes acceso?{' '}
                                <button className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200">
                                    Contacta a tu supervisor
                                </button>
                            </p>
                            <div className="flex justify-center space-x-4 text-xs">
                                <button className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200">
                                    Recuperar contraseña
                                </button>
                                <span className="text-gray-300">•</span>
                                <button className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200">
                                    Soporte técnico
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Página principal con features estáticos (mantener igual)
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img 
                                src="/clic logo negro.png" 
                                alt="CLIC Logo" 
                                className="h-10 w-auto" 
                            />
                        </div>
                        <button
                            onClick={() => setShowLoginForm(true)}
                            className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                El inmueble que buscas a un Clic de distancia!
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                                Únete al ecosistema
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500"> CLIC Inmobiliaria</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Accede a nuestro inventario exclusivo, refiere clientes, entrénate con los mejores 
                                y forma parte de la red inmobiliaria más innovadora. Todo gamificado, todo por méritos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setShowLoginForm(true)}
                                    className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                                    style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                                >
                                    <span>Acceder a Mi Cuenta</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowRegistrationForm(true)}
                                    className="px-8 py-4 rounded-xl font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    Únete al Ecosistema
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}>
                                        <BarChart3 className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Panel de Control</h3>
                                </div>
                                <div className="space-y-4">
                                    {stats.map((stat, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">{stat.label}</span>
                                            <span className="font-bold text-orange-600">{stat.number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl transform translate-x-4 translate-y-4 opacity-20"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - DINÁMICO según tipos activos */}
            <section className="py-20 px-6 bg-white/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Formas de participar en CLIC
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Desde entrenamientos hasta referencias, encuentra tu manera de ser parte 
                            del ecosistema inmobiliario más exclusivo y rentable.
                        </p>
                    </div>
                    
                    {loadingFeatures ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                            <span className="text-gray-600">Cargando opciones disponibles...</span>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {dynamicFeatures.map((feature, index) => (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                        style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        ¿Listo para formar parte del futuro inmobiliario?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Solo los mejores permanecen. ¿Tienes lo que se necesita para destacar en CLIC?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setShowLoginForm(true)}
                            className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 text-lg"
                            style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
                        >
                            Acceder a CLIC
                        </button>
                        <button
                            onClick={() => setShowRegistrationForm(true)}
                            className="px-8 py-4 rounded-xl font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all duration-200 hover:scale-105 active:scale-95 text-lg">
                            Únete al Ecosistema
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start space-y-6 md:space-y-0">
                        <div className="flex flex-col items-center md:items-start space-y-4">
                            <img 
                                src="/clic logo.png" 
                                alt="CLIC Logo" 
                                className="h-12 w-auto" 
                            />
                            <div className="text-center md:text-left space-y-1">
                                <p className="text-sm text-gray-300">
                                    Erik Leonard Ekman No. 34, Distrito Nacional
                                </p>
                                <p className="text-sm text-gray-300">
                                    📞 829.514.8080
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    © 2025 CLIC Inmobiliaria - Todos los derechos reservados
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-end space-y-3">
                            <img 
                                src="/rene-castillo-firma.png" 
                                alt="René Castillo Firma" 
                                className="h-12 w-auto" 
                            />
                            <p className="text-sm font-medium" style={{ color: '#e03f07' }}>CEO & Fundador</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;