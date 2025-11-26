import React, { useState, useEffect } from 'react';
import {
    Building, Calendar, Users, Award, FileText, Plus, Edit, Trash2,
    DollarSign, MapPin, TrendingUp, Clock, CheckCircle, AlertCircle,
    Home, Building2, BarChart3, Download, Upload, Eye, X, Settings,
    ExternalLink, Phone, Mail, Globe, Bed, Bath, Square, Target,
    Percent, Shield, Star, ChevronRight, Layers, Car, Ruler
} from 'lucide-react';

import ProjectEditModal from './ProjectEditModal';


import { supabase } from '../services/api';

const PropertyProject = ({ propertyId = "1", property = { is_project: true } }) => {
    const [loading, setLoading] = useState(false);
    const [editingData, setEditingData] = useState({});

    // Estados para datos del proyecto - datos reales de la base de datos
    const [projectDetails, setProjectDetails] = useState(null);
    const [developer, setDeveloper] = useState(null);
    const [typologies, setTypologies] = useState([]);
    const [phases, setPhases] = useState([]);
    const [paymentPlans, setPaymentPlans] = useState([]);
    const [benefits, setBenefits] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [availability, setAvailability] = useState([]);

    // Estados para catálogos
    const [catalogData, setCatalogData] = useState({
        documents: [],
        benefits: []
    });

    // Estados para modal
    const [showModal, setShowModal] = useState(false);
    const [modalSection, setModalSection] = useState(null);

    // useEffect para cargar datos
    useEffect(() => {
        if (propertyId && property?.is_project) {
            fetchProjectData();
            fetchCatalogData();
        }
    }, [propertyId, property]);

    // Función para cargar los catálogos
    const fetchCatalogData = async () => {
        try {
            console.log('📚 Cargando datos de catálogos...');

            // Cargar catálogo de documentos
            const { data: documentsData, error: documentsError } = await supabase
                .from('project_documents_catalog')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (documentsError) {
                console.error('❌ Error cargando documentos:', documentsError);
            }

            // Cargar catálogo de beneficios
            const { data: benefitsData, error: benefitsError } = await supabase
                .from('project_benefits_catalog')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (benefitsError) {
                console.error('❌ Error cargando beneficios:', benefitsError);
            }

            setCatalogData({
                documents: documentsData || [],
                benefits: benefitsData || []
            });

            console.log('✅ Catálogos cargados:', {
                documents: documentsData?.length || 0,
                benefits: benefitsData?.length || 0
            });

        } catch (error) {
            console.error('❌ Error cargando catálogos:', error);
        }
    };

    // Función para cargar datos reales del proyecto desde la base de datos
    const fetchProjectData = async () => {
        try {
            setLoading(true);
            console.log('🏗️ Cargando datos del proyecto para property_id:', propertyId);

            // 1. Cargar project_details principal
            const { data: projectData, error: projectError } = await supabase
                .from('project_details')
                .select('*')
                .eq('property_id', propertyId)
                .single();

            if (projectError) {
                console.error('❌ Error cargando project_details:', projectError);
                if (projectError.code === 'PGRST116') {
                    console.log('📝 Creando project_details para esta propiedad...');
                    const { data: newProjectData, error: createError } = await supabase
                        .from('project_details')
                        .insert([{
                            property_id: propertyId,
                            guarantees: JSON.stringify([]),
                            completion_percentage: 0,
                            total_units: 0,
                            available_units: 0
                        }])
                        .select()
                        .single();

                    if (createError) {
                        console.error('❌ Error creando project_details:', createError);
                        setProjectDetails(null);
                    } else {
                        console.log('✅ Project_details creado:', newProjectData);
                        setProjectDetails(newProjectData);
                    }
                } else {
                    setProjectDetails(null);
                }
            } else {
                console.log('✅ Project_details cargado:', projectData);
                setProjectDetails(projectData);
            }

            const projectId = projectData?.id;

            if (projectId) {
                console.log('🔍 Usando project_id:', projectId);

                // 2. Cargar desarrollador
                if (projectData.developer_id) {
                    console.log('👤 Cargando desarrollador...');
                    const { data: developerData, error: developerError } = await supabase
                        .from('developers')
                        .select('*')
                        .eq('id', projectData.developer_id)
                        .single();

                    if (developerError) {
                        console.error('❌ Error cargando desarrollador:', developerError);
                        setDeveloper(null);
                    } else {
                        console.log('✅ Desarrollador cargado:', developerData);
                        setDeveloper(developerData);
                    }
                } else {
                    console.log('⚠️ No hay developer_id asignado');
                    setDeveloper(null);
                }

                // 3. Cargar tipologías
                console.log('🏠 Cargando tipologías...');
                const { data: typologiesData, error: typologiesError } = await supabase
                    .from('project_typologies')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('sort_order', { ascending: true });

                if (typologiesError) {
                    console.error('❌ Error cargando tipologías:', typologiesError);
                    setTypologies([]);
                } else {
                    console.log('✅ Tipologías cargadas:', typologiesData?.length || 0);
                    setTypologies(typologiesData || []);
                }

                // 4. Cargar fases/etapas
                console.log('📅 Cargando fases del proyecto...');
                const { data: phasesData, error: phasesError } = await supabase
                    .from('project_phases')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('sort_order', { ascending: true });

                if (phasesError) {
                    console.error('❌ Error cargando fases:', phasesError);
                    setPhases([]);
                } else {
                    console.log('✅ Fases cargadas:', phasesData?.length || 0);
                    setPhases(phasesData || []);
                }

                // 5. Cargar planes de pago
                console.log('💳 Cargando planes de pago...');
                const { data: paymentPlansData, error: paymentPlansError } = await supabase
                    .from('project_payment_plans')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('is_active', true)
                    .order('is_default', { ascending: false });

                if (paymentPlansError) {
                    console.error('❌ Error cargando planes de pago:', paymentPlansError);
                    setPaymentPlans([]);
                } else {
                    console.log('✅ Planes de pago cargados:', paymentPlansData?.length || 0);
                    setPaymentPlans(paymentPlansData || []);
                }

                // 6. Cargar beneficios
                console.log('🎁 Cargando beneficios...');
                const { data: benefitsData, error: benefitsError } = await supabase
                    .from('project_benefits')
                    .select(`
                        id,
                        custom_value_amount,
                        custom_value_percentage,
                        custom_description,
                        project_specific_conditions,
                        is_active,
                        project_benefits_catalog (
                            id,
                            name,
                            description,
                            benefit_type
                        )
                    `)
                    .eq('project_id', projectId)
                    .eq('is_active', true);

                if (benefitsError) {
                    console.error('❌ Error cargando beneficios:', benefitsError);
                    setBenefits([]);
                } else {
                    console.log('✅ Beneficios cargados:', benefitsData?.length || 0);
                    setBenefits(benefitsData || []);
                }

                // 7. Cargar documentos
                console.log('📄 Cargando documentos...');
                const { data: documentsData, error: documentsError } = await supabase
                    .from('project_documents')
                    .select(`
                        id,
                        clic_has_document,
                        verification_date,
                        notes,
                        project_documents_catalog (
                            id,
                            document_type,
                            display_name,
                            description,
                            category
                        )
                    `)
                    .eq('project_id', projectId);

                if (documentsError) {
                    console.error('❌ Error cargando documentos:', documentsError);
                    setDocuments([]);
                } else {
                    console.log('✅ Documentos cargados:', documentsData?.length || 0);
                    setDocuments(documentsData || []);
                }

                // 8. Cargar disponibilidad
                console.log('📊 Cargando disponibilidad...');
                const { data: availabilityData, error: availabilityError } = await supabase
                    .from('project_availability')
                    .select(`
                        id,
                        unit_identifier,
                        floor,
                        unit_number,
                        built_area,
                        balcony_area,
                        orientation,
                        sale_price,
                        sale_currency,
                        status,
                        reservation_date,
                        sale_date,
                        project_typologies (
                            id,
                            name
                        )
                    `)
                    .eq('project_id', projectId)
                    .order('unit_identifier', { ascending: true });

                if (availabilityError) {
                    console.error('❌ Error cargando disponibilidad:', availabilityError);
                    setAvailability([]);
                } else {
                    console.log('✅ Disponibilidad cargada:', availabilityData?.length || 0);
                    setAvailability(availabilityData || []);
                }

            } else {
                console.log('⚠️ No hay project_id, inicializando arrays vacíos');
                setDeveloper(null);
                setTypologies([]);
                setPhases([]);
                setPaymentPlans([]);
                setBenefits([]);
                setDocuments([]);
                setAvailability([]);
            }

            console.log('🎉 Carga de datos del proyecto completada');

        } catch (error) {
            console.error('💥 Error general al cargar datos del proyecto:', error);
        } finally {
            setLoading(false);
        }
    };

    // Funciones para modal
    const handleEdit = (section, data = null) => {
        setModalSection(section);
        setEditingData(data || {});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalSection(null);
        setEditingData({});
    };

    // Función de guardado completa
    const handleSave = async (formData) => {
        console.log('💾 Guardando datos:', modalSection, formData);

        try {
            setLoading(true);
            let result;

            switch (modalSection) {
                case 'developer':
                    // Actualizar desarrollador
                    if (formData.id) {
                        console.log('🔄 Actualizando desarrollador existente...');
                        result = await supabase
                            .from('developers')
                            .update({
                                name: formData.name,
                                legal_name: formData.legal_name,
                                email: formData.email,
                                phone: formData.phone,
                                website: formData.website,
                                years_experience: formData.years_experience,
                                description: formData.description,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', formData.id);
                    } else {
                        console.log('➕ Creando nuevo desarrollador...');
                        result = await supabase
                            .from('developers')
                            .insert([{
                                name: formData.name,
                                legal_name: formData.legal_name,
                                email: formData.email,
                                phone: formData.phone,
                                website: formData.website,
                                years_experience: formData.years_experience,
                                description: formData.description
                            }]);
                    }
                    break;

                case 'guarantees':
                    // Actualizar garantías en project_details
                    console.log('🔄 Actualizando garantías del proyecto...');
                    result = await supabase
                        .from('project_details')
                        .update({
                            guarantees: formData.guarantees,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', projectDetails?.id);
                    break;

                case 'typologies':
                    // Crear o actualizar tipología
                    if (formData.id) {
                        console.log('🔄 Actualizando tipología existente...');
                        result = await supabase
                            .from('project_typologies')
                            .update({
                                name: formData.name,
                                description: formData.description,
                                bedrooms: formData.bedrooms,
                                bathrooms: formData.bathrooms,
                                built_area: formData.built_area,
                                balcony_area: formData.balcony_area,
                                total_area: formData.total_area,
                                sale_price_from: formData.sale_price_from,
                                sale_price_to: formData.sale_price_to,
                                sale_currency: formData.sale_currency,
                                total_units: formData.total_units,
                                available_units: formData.available_units,
                                is_sold_out: formData.is_sold_out,
                                sort_order: formData.sort_order
                            })
                            .eq('id', formData.id);
                    } else {
                        console.log('➕ Creando nueva tipología...');
                        result = await supabase
                            .from('project_typologies')
                            .insert([{
                                project_id: formData.project_id,
                                name: formData.name,
                                description: formData.description,
                                bedrooms: formData.bedrooms,
                                bathrooms: formData.bathrooms,
                                built_area: formData.built_area,
                                balcony_area: formData.balcony_area,
                                total_area: formData.total_area,
                                sale_price_from: formData.sale_price_from,
                                sale_price_to: formData.sale_price_to,
                                sale_currency: formData.sale_currency,
                                total_units: formData.total_units,
                                available_units: formData.available_units,
                                is_sold_out: formData.is_sold_out || false,
                                sort_order: formData.sort_order || 0
                            }]);
                    }
                    break;

                case 'phases':
                    // Crear o actualizar fase
                    if (formData.id) {
                        console.log('🔄 Actualizando fase existente...');
                        result = await supabase
                            .from('project_phases')
                            .update({
                                phase_name: formData.phase_name,
                                description: formData.description,
                                construction_start: formData.construction_start,
                                estimated_delivery: formData.estimated_delivery,
                                total_units: formData.total_units,
                                available_units: formData.available_units,
                                status: formData.status,
                                completion_percentage: formData.completion_percentage,
                                sort_order: formData.sort_order
                            })
                            .eq('id', formData.id);
                    } else {
                        console.log('➕ Creando nueva fase...');
                        result = await supabase
                            .from('project_phases')
                            .insert([{
                                project_id: formData.project_id,
                                phase_name: formData.phase_name,
                                description: formData.description,
                                construction_start: formData.construction_start,
                                estimated_delivery: formData.estimated_delivery,
                                total_units: formData.total_units,
                                available_units: formData.available_units,
                                status: formData.status || 'planning',
                                completion_percentage: formData.completion_percentage || 0,
                                sort_order: formData.sort_order || 0
                            }]);
                    }
                    break;

                case 'availability':
                    // Actualizar campos de disponibilidad en project_details
                    console.log('🔄 Actualizando disponibilidad externa...');
                    result = await supabase
                        .from('project_details')
                        .update({
                            availability_external_url: formData.availability_external_url,
                            availability_external_type: formData.availability_external_type,
                            availability_external_description: formData.availability_external_description,
                            availability_auto_sync: formData.availability_auto_sync,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', projectDetails?.id);
                    break;

                case 'payments':
                    // Crear o actualizar plan de pago
                    if (formData.id) {
                        console.log('🔄 Actualizando plan de pago existente...');
                        result = await supabase
                            .from('project_payment_plans')
                            .update({
                                plan_name: formData.plan_name,
                                description: formData.description,
                                reservation_amount: formData.reservation_amount,
                                reservation_currency: formData.reservation_currency,
                                separation_percentage: formData.separation_percentage,
                                construction_percentage: formData.construction_percentage,
                                construction_frequency: formData.construction_frequency,
                                delivery_percentage: formData.delivery_percentage,
                                is_default: formData.is_default,
                                is_active: formData.is_active
                            })
                            .eq('id', formData.id);
                    } else {
                        console.log('➕ Creando nuevo plan de pago...');
                        result = await supabase
                            .from('project_payment_plans')
                            .insert([{
                                project_id: formData.project_id,
                                plan_name: formData.plan_name,
                                description: formData.description,
                                reservation_amount: formData.reservation_amount,
                                reservation_currency: formData.reservation_currency || 'USD',
                                separation_percentage: formData.separation_percentage,
                                construction_percentage: formData.construction_percentage,
                                construction_frequency: formData.construction_frequency,
                                delivery_percentage: formData.delivery_percentage,
                                is_default: formData.is_default || false,
                                is_active: formData.is_active !== false
                            }]);
                    }
                    break;

                case 'benefits':
                    // Crear o actualizar beneficio
                    if (formData.id) {
                        console.log('🔄 Actualizando beneficio existente...');
                        result = await supabase
                            .from('project_benefits')
                            .update({
                                benefit_id: formData.benefit_id,
                                custom_value_amount: formData.custom_value_amount,
                                custom_value_percentage: formData.custom_value_percentage,
                                custom_description: formData.custom_description,
                                project_specific_conditions: formData.project_specific_conditions,
                                start_date: formData.start_date,
                                end_date: formData.end_date,
                                is_active: formData.is_active
                            })
                            .eq('id', formData.id);
                    } else {
                        console.log('➕ Creando nuevo beneficio...');
                        result = await supabase
                            .from('project_benefits')
                            .insert([{
                                project_id: formData.project_id,
                                benefit_id: formData.benefit_id,
                                custom_value_amount: formData.custom_value_amount,
                                custom_value_percentage: formData.custom_value_percentage,
                                custom_description: formData.custom_description,
                                project_specific_conditions: formData.project_specific_conditions,
                                start_date: formData.start_date,
                                end_date: formData.end_date,
                                is_active: formData.is_active !== false
                            }]);
                    }
                    break;

                case 'documents':
                    // Manejar documentos (inserción/actualización en batch)
                    console.log('🔄 Actualizando documentos del proyecto...');

                    // Primero eliminar documentos existentes del proyecto
                    await supabase
                        .from('project_documents')
                        .delete()
                        .eq('project_id', formData.project_id);

                    // Insertar nuevos documentos
                    if (formData.documents && formData.documents.length > 0) {
                        const documentsData = formData.documents.map(document => ({
                            project_id: formData.project_id,
                            document_catalog_id: document.document_catalog_id,
                            clic_has_document: document.clic_has_document,
                            verification_date: document.verification_date,
                            notes: document.notes
                        }));

                        result = await supabase
                            .from('project_documents')
                            .insert(documentsData);
                    }
                    break;

                default:
                    throw new Error(`Sección ${modalSection} no soportada`);
            }

            // Verificar errores
            if (result?.error) {
                console.error('❌ Error al guardar:', result.error);
                throw new Error(result.error.message);
            }

            console.log('✅ Datos guardados exitosamente:', result);

            // Recargar datos
            await fetchProjectData();

            return result;

        } catch (error) {
            console.error('❌ Error en handleSave:', error);
            alert('Error al guardar los datos: ' + error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Función de eliminación
    const handleDelete = async (itemId) => {
        try {
            setLoading(true);
            console.log('🗑️ Eliminando elemento:', modalSection, itemId);

            let result;

            switch (modalSection) {
                case 'developer':
                    result = await supabase
                        .from('developers')
                        .delete()
                        .eq('id', itemId);
                    break;

                case 'typologies':
                    result = await supabase
                        .from('project_typologies')
                        .delete()
                        .eq('id', itemId);
                    break;

                case 'phases':
                    result = await supabase
                        .from('project_phases')
                        .delete()
                        .eq('id', itemId);
                    break;

                case 'payments':
                    result = await supabase
                        .from('project_payment_plans')
                        .delete()
                        .eq('id', itemId);
                    break;

                case 'benefits':
                    result = await supabase
                        .from('project_benefits')
                        .delete()
                        .eq('id', itemId);
                    break;

                case 'documents':
                    // Eliminar documento específico del proyecto
                    result = await supabase
                        .from('project_documents')
                        .delete()
                        .eq('id', itemId);
                    break;

                default:
                    throw new Error(`No se puede eliminar para la sección: ${modalSection}`);
            }

            if (result?.error) {
                console.error('❌ Error al eliminar:', result.error);
                throw new Error(result.error.message);
            }

            console.log('✅ Elemento eliminado exitosamente');

            // Recargar datos después de eliminar
            await fetchProjectData();

        } catch (error) {
            console.error('❌ Error en handleDelete:', error);
            alert('Error al eliminar: ' + error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const parseGuarantees = (guaranteesField) => {
        if (!guaranteesField) return [];
        try {
            if (Array.isArray(guaranteesField)) return guaranteesField;
            return JSON.parse(guaranteesField);
        } catch (error) {
            if (typeof guaranteesField === 'string') {
                if (guaranteesField.includes('\n')) {
                    return guaranteesField.split('\n').filter(item => item.trim());
                } else if (guaranteesField.includes(',')) {
                    return guaranteesField.split(',').map(item => item.trim()).filter(item => item);
                } else {
                    return [guaranteesField.trim()];
                }
            }
            return [];
        }
    };

    const formatPrice = (price, currency = 'USD') => {
        if (!price) return null;
        const formatter = new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: currency === 'DOP' ? 'DOP' : 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatter.format(price);
    };

    const formatDate = (date) => {
        if (!date) return 'No especificada';
        return new Date(date).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatArea = (area) => {
        return `${area} m²`;
    };

    // Componentes UI
    const Input = ({ label, type = "text", value, onChange, placeholder, className = "", ...props }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
                {...props}
            />
        </div>
    );

    const Textarea = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
            />
        </div>
    );

    const Select = ({ label, value, onChange, options, placeholder, className = "" }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const Card = ({ children, className = "" }) => (
        <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
            {children}
        </div>
    );

    const Badge = ({ children, className = "" }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    );

    const Button = ({ children, variant = "primary", size = "md", icon, className = "", onClick, ...props }) => {
        const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors";
        const variants = {
            primary: "bg-orange-600 text-white hover:bg-orange-700",
            outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        };
        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-sm"
        };

        return (
            <button
                className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
                onClick={onClick}
                {...props}
            >
                {icon && <span className="mr-2">{icon}</span>}
                {children}
            </button>
        );
    };

    // Componente Modal Universal
    const EditModal = () => {
        return (
            <ProjectEditModal
                isOpen={showModal}
                section={modalSection}
                data={editingData}
                onClose={handleCloseModal}
                onSave={handleSave}
                onDelete={handleDelete}
                projectId={projectDetails?.id}
                availableDocuments={catalogData.documents}
                availableBenefits={catalogData.benefits}
            />
        );
    };

    // Render conditions
    if (!property?.is_project) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card className="p-12 text-center">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Esta propiedad no es un proyecto
                    </h3>
                    <p className="text-gray-600">
                        Para configurar datos de proyecto, primero marca esta propiedad como proyecto.
                    </p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <span className="ml-3 text-gray-600">Cargando datos del proyecto...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna Principal - 2/3 del ancho */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Información del Desarrollador */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Users className="w-5 h-5 text-orange-600 mr-2" />
                                Información del Desarrollador
                            </h2>
                        </div>

                        <div className="p-6">
                            {developer ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">{developer.name}</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={<Edit className="w-4 h-4" />}
                                            onClick={() => handleEdit('developer', developer)}
                                        >
                                            Editar
                                        </Button>
                                    </div>

                                    {/* Información básica */}
                                    <div className="space-y-1 text-sm">
                                        {developer.email && (
                                            <div className="flex items-center text-gray-700">
                                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                <a href={`mailto:${developer.email}`} className="hover:text-orange-600">
                                                    {developer.email}
                                                </a>
                                            </div>
                                        )}
                                        {developer.phone && (
                                            <div className="flex items-center text-gray-700">
                                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                <a href={`tel:${developer.phone}`} className="hover:text-orange-600">
                                                    {developer.phone}
                                                </a>
                                            </div>
                                        )}
                                        {developer.website && (
                                            <div className="flex items-center text-gray-700">
                                                <Globe className="w-4 h-4 mr-2 text-gray-400" />
                                                <a href={developer.website} target="_blank" rel="noopener noreferrer"
                                                    className="hover:text-orange-600 flex items-center">
                                                    {developer.website.replace('https://', '')}
                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats compactas */}
                                    {(developer.years_experience || developer.total_projects) && (
                                        <div className="flex gap-4 pt-2 text-xs text-gray-600">
                                            {developer.years_experience && (
                                                <span>{developer.years_experience} años experiencia</span>
                                            )}
                                            {developer.total_projects && (
                                                <span>{developer.total_projects} proyectos</span>
                                            )}
                                        </div>
                                    )}

                                    {developer.description && (
                                        <p className="text-sm text-gray-700 leading-relaxed pt-2 border-t border-gray-100">
                                            {developer.description}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm mb-3">No hay desarrollador asignado</p>
                                    <Button variant="primary" size="sm" onClick={() => handleEdit('developer', {})}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Asignar Desarrollador
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Tipologías Disponibles */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Home className="w-5 h-5 text-orange-600 mr-2" />
                                Tipologías Disponibles
                                <Badge className="bg-blue-100 text-blue-800 ml-3">{typologies.length}</Badge>
                            </h2>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => handleEdit('typologies')}
                            >
                                Nueva Tipología
                            </Button>
                        </div>

                        <div className="p-6">
                            {typologies.length > 0 ? (
                                <div className="space-y-3">
                                    {typologies.map((typology) => (
                                        <div key={typology.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-semibold text-gray-900">{typology.name}</h4>
                                                    {typology.is_sold_out && (
                                                        <Badge className="bg-red-100 text-red-800">AGOTADO</Badge>
                                                    )}
                                                    {typology.available_units === 0 && !typology.is_sold_out && (
                                                        <Badge className="bg-orange-100 text-orange-800">SIN STOCK</Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Edit className="w-3 h-3" />}
                                                    onClick={() => handleEdit('typologies', typology)}
                                                />
                                            </div>

                                            {/* Información compacta */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center space-x-4 text-gray-600">
                                                    {typology.bedrooms && (
                                                        <div className="flex items-center space-x-1">
                                                            <Bed className="w-3 h-3" />
                                                            <span>{typology.bedrooms}</span>
                                                        </div>
                                                    )}
                                                    {typology.bathrooms && (
                                                        <div className="flex items-center space-x-1">
                                                            <Bath className="w-3 h-3" />
                                                            <span>{typology.bathrooms}</span>
                                                        </div>
                                                    )}
                                                    {typology.built_area && (
                                                        <div className="flex items-center space-x-1">
                                                            <Square className="w-3 h-3" />
                                                            <span>{typology.built_area}m²</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {typology.sale_price_from && (
                                                        <div className="font-semibold text-green-600">
                                                            {formatPrice(typology.sale_price_from, typology.sale_currency)}
                                                        </div>
                                                    )}
                                                    {typology.available_units !== undefined && typology.total_units && (
                                                        <div className="text-xs text-gray-500">
                                                            {typology.available_units}/{typology.total_units} disponibles
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-4">No hay tipologías registradas</p>
                                    <Button variant="primary" onClick={() => handleEdit('typologies', {})}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear Primera Tipología
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Etapas del Proyecto */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                                Etapas del Proyecto
                                <Badge className="bg-blue-100 text-blue-800 ml-3">{phases.length}</Badge>
                            </h2>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => handleEdit('phases')}
                            >
                                Nueva Etapa
                            </Button>
                        </div>

                        <div className="p-6">
                            {phases.length > 0 ? (
                                <div className="space-y-3">
                                    {phases.map((phase) => (
                                        <div key={phase.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="font-semibold text-gray-900">{phase.phase_name}</h4>
                                                    <div className="text-sm font-bold text-orange-600">{phase.completion_percentage || 0}%</div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Edit className="w-3 h-3" />}
                                                    onClick={() => handleEdit('phases', phase)}
                                                />
                                            </div>

                                            <div className="text-sm text-gray-600">
                                                Entrega: {formatDate(phase.estimated_delivery)}
                                            </div>

                                            {/* Barra de progreso simple */}
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                                <div
                                                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${phase.completion_percentage || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-4">No hay etapas registradas</p>
                                    <Button variant="primary" onClick={() => handleEdit('phases', {})}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear Primera Etapa
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Disponibilidad - Enlaces Externos */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <ExternalLink className="w-5 h-5 text-orange-600 mr-2" />
                                Disponibilidad Externa
                            </h2>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => handleEdit('availability')}
                            >
                                Configurar
                            </Button>
                        </div>

                        <div className="p-6">
                            {/* Enlace externo si existe */}
                            {projectDetails?.availability_external_url ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-blue-900">
                                                {projectDetails.availability_external_type === 'drive' ? '📄 Google Drive' :
                                                    projectDetails.availability_external_type === 'excel_online' ? '📊 Excel Online' :
                                                        projectDetails.availability_external_type === 'dropbox' ? '📦 Dropbox' :
                                                            '🔗 Enlace Externo'}
                                            </h4>
                                            <p className="text-blue-700 text-sm mt-1">
                                                {projectDetails.availability_external_description || 'Archivo de disponibilidad actualizado'}
                                            </p>
                                            {projectDetails.availability_last_sync && (
                                                <p className="text-blue-600 text-xs mt-1">
                                                    Última sync: {formatDate(projectDetails.availability_last_sync)}
                                                </p>
                                            )}
                                        </div>
                                        <a
                                            href={projectDetails.availability_external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Abrir
                                            <ExternalLink className="w-4 h-4 ml-1" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                    <ExternalLink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm mb-3">Sin enlace de disponibilidad</p>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Configura un enlace a Dropbox, Google Drive o Excel Online para disponibilidad en tiempo real
                                    </p>
                                    <Button variant="primary" size="sm" onClick={() => handleEdit('availability', {})}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Configurar Enlace
                                    </Button>
                                </div>
                            )}

                            {/* Resumen estadístico */}
                            {availability.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Resumen de Unidades</h4>
                                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                        <div className="bg-green-50 p-2 rounded">
                                            <div className="font-bold text-green-600">
                                                {availability.filter(u => u.status === 'available').length}
                                            </div>
                                            <div className="text-xs text-gray-600">Disponibles</div>
                                        </div>
                                        <div className="bg-orange-50 p-2 rounded">
                                            <div className="font-bold text-orange-600">
                                                {availability.filter(u => u.status === 'reserved').length}
                                            </div>
                                            <div className="text-xs text-gray-600">Reservadas</div>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded">
                                            <div className="font-bold text-red-600">
                                                {availability.filter(u => u.status === 'sold').length}
                                            </div>
                                            <div className="text-xs text-gray-600">Vendidas</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 text-center">
                                        Total: {availability.length} unidades
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Garantías */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <Shield className="w-5 h-5 text-green-600 mr-2" />
                                Garantías
                                <Badge className="bg-green-100 text-green-800 ml-2">
                                    {parseGuarantees(projectDetails?.guarantees).length}
                                </Badge>
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => handleEdit('guarantees', {
                                    guarantees_text: parseGuarantees(projectDetails?.guarantees).join('\n')
                                })}
                            >
                                Editar
                            </Button>
                        </div>

                        <div className="p-4">
                            {parseGuarantees(projectDetails?.guarantees).length > 0 ? (
                                <div className="space-y-2">
                                    {parseGuarantees(projectDetails?.guarantees).map((guarantee, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <span className="text-sm text-gray-900">{guarantee}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Sin garantías registradas</p>
                                    <Button variant="primary" size="sm" className="mt-2" onClick={() => handleEdit('guarantees', { guarantees_text: '' })}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Agregar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Plan de Pago */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                                Plan de Pago
                                {paymentPlans.length > 0 && (
                                    <Badge className="bg-green-100 text-green-800 ml-2">{paymentPlans.length}</Badge>
                                )}
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => handleEdit('payments', paymentPlans[0] || {})}
                            >
                                Editar
                            </Button>
                        </div>

                        <div className="p-4">
                            {paymentPlans.length > 0 ? (
                                <div className="space-y-3">
                                    {paymentPlans.map((plan) => (
                                        <div key={plan.id} className="space-y-3">
                                            <h4 className="font-semibold text-gray-900">{plan.plan_name}</h4>
                                            {plan.description && (
                                                <p className="text-gray-600 text-sm">{plan.description}</p>
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                                    <span className="text-sm font-medium">Reserva</span>
                                                    <span className="font-bold text-orange-600">
                                                        {formatPrice(plan.reservation_amount, plan.reservation_currency)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="text-sm font-medium">Separación</span>
                                                    <span className="font-bold">{plan.separation_percentage}%</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="text-sm font-medium">Construcción</span>
                                                    <span className="font-bold">{plan.construction_percentage}%</span>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                                    <span className="text-sm font-medium">Entrega</span>
                                                    <span className="font-bold text-green-600">{plan.delivery_percentage}%</span>
                                                </div>
                                            </div>

                                            {plan.benefits && plan.benefits.length > 0 && (
                                                <div className="pt-3 border-t border-gray-200">
                                                    <div className="text-xs text-gray-500 font-medium mb-2">Beneficios incluidos:</div>
                                                    <ul className="space-y-1">
                                                        {plan.benefits.map((benefit, index) => (
                                                            <li key={index} className="flex items-start space-x-1 text-xs text-gray-600">
                                                                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span>{benefit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Sin plan configurado</p>
                                    <Button variant="primary" size="sm" className="mt-2" onClick={() => handleEdit('payments', {})}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Configurar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Beneficios y Promociones */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <Award className="w-5 h-5 text-purple-600 mr-2" />
                                Beneficios
                                <Badge className="bg-purple-100 text-purple-800 ml-2">{benefits.length}</Badge>
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => handleEdit('benefits')}
                            >
                                Nuevo
                            </Button>
                        </div>

                        <div className="p-4">
                            {benefits.length > 0 ? (
                                <div className="space-y-2">
                                    {benefits.map((benefit) => (
                                        <div key={benefit.id} className="p-2 bg-purple-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Award className="w-4 h-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {benefit.project_benefits_catalog?.name || 'Beneficio'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {benefit.custom_value_percentage && (
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            {benefit.custom_value_percentage}%
                                                        </Badge>
                                                    )}
                                                    {benefit.custom_value_amount && (
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            {formatPrice(benefit.custom_value_amount)}
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Edit className="w-3 h-3" />}
                                                        onClick={() => handleEdit('benefits', benefit)}
                                                    />
                                                </div>
                                            </div>
                                            {benefit.custom_description && (
                                                <p className="text-xs text-gray-600 mt-1 ml-6">{benefit.custom_description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Sin beneficios registrados</p>
                                    <Button variant="primary" size="sm" className="mt-2" onClick={() => handleEdit('benefits', {})}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Agregar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Documentos */}
                    <Card className="overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 text-indigo-600 mr-2" />
                                Documentos
                                <Badge className="bg-indigo-100 text-indigo-800 ml-2">
                                    {documents.filter(d => d.clic_has_document).length}/{documents.length}
                                </Badge>
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<Upload className="w-4 h-4" />}
                                onClick={() => handleEdit('documents')}
                            >
                                Gestionar
                            </Button>
                        </div>

                        <div className="p-4">
                            {documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm text-gray-700">
                                                    {doc.project_documents_catalog?.display_name || 'Documento'}
                                                </span>
                                            </div>
                                            {doc.clic_has_document ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Sin documentos registrados</p>
                                    <Button variant="primary" size="sm" className="mt-2" onClick={() => handleEdit('documents', {})}>
                                        <Upload className="w-4 h-4 mr-1" />
                                        Configurar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal Universal para Edición */}
            <EditModal />
        </div>
    );
};

export default PropertyProject;