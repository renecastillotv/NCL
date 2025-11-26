import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, DollarSign, TrendingUp, Calendar,
    User, Building, MapPin, X, Save, AlertCircle, Check, Star,
    Eye, EyeOff, FileText, Users, Phone, Mail,
    Filter, Download, BarChart3, Target, Clock, CheckCircle,
    ArrowLeft
} from 'lucide-react';

import DealDetails from './DealDetails'; // Importar el componente real


import { supabase } from '../services/api';

// Componentes UI básicos
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        primary: 'bg-orange-100 text-orange-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

const DealsManager = () => {
    // Estados básicos
    const [deals, setDeals] = useState([]);
    const [agents, setAgents] = useState([]);
    const [properties, setProperties] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [dealTypes, setDealTypes] = useState([]);
    const [dealStatuses, setDealStatuses] = useState([]);
    const [operationTypes, setOperationTypes] = useState([]);
    const [teams, setTeams] = useState([]);
    const [usdToDopRate, setUsdToDopRate] = useState(60.00); // Rate por defecto
    const [loading, setLoading] = useState(true);

    // Estados de navegación
    const [viewMode, setViewMode] = useState('list');
    const [selectedDealId, setSelectedDealId] = useState(null);

    // Estados de filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [selectedOperationType, setSelectedOperationType] = useState('');
    const [selectedDealType, setSelectedDealType] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isExternal, setIsExternal] = useState('');
    const [showMyDeals, setShowMyDeals] = useState(false);
    const [showParticipatedDeals, setShowParticipatedDeals] = useState(false);

    // Estados de modales
    const [showModal, setShowModal] = useState(false);
    const [showAgentsModal, setShowAgentsModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);

    // Estados del formulario
    const [editingDeal, setEditingDeal] = useState(null);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(30);

    const currencies = [
        { value: 'USD', label: 'USD ($)' },
        { value: 'DOP', label: 'DOP (RD$)' },
        { value: 'EUR', label: 'EUR (€)' }
    ];

    // Función para obtener la tasa de cambio desde configuraciones
    const fetchExchangeRate = async () => {
        try {
            const { data, error } = await supabase
                .from('configurations')
                .select('value')
                .eq('key', 'usd_to_dop_rate')
                .eq('active', true)
                .single();

            if (error) {
                console.error('Error obteniendo tasa de cambio:', error);
                return;
            }

            if (data) {
                setUsdToDopRate(parseFloat(data.value));
                console.log('✅ Tasa de cambio USD/DOP:', data.value);
            }
        } catch (err) {
            console.error('Error fetching exchange rate:', err);
        }
    };

    // Función para convertir montos a USD
    const convertToUSD = (amount, currency) => {
        const numAmount = parseFloat(amount || 0);

        switch (currency) {
            case 'USD':
                return numAmount;
            case 'DOP':
                return numAmount / usdToDopRate;
            case 'EUR':
                // Asumiendo tasa EUR/USD aproximada - idealmente debería venir de configuración también
                return numAmount * 1.1; // Tasa aproximada, deberías configurar esto también
            default:
                return numAmount; // Asumir USD si no se especifica
        }
    };

    // Función para calcular comisión en USD
    const calculateCommissionUSD = (deal) => {
        const closingValueUSD = convertToUSD(deal.closing_value, deal.currency);
        const commissionPercentage = parseFloat(deal.commission_percentage || 0);
        return (closingValueUSD * commissionPercentage) / 100;
    };

    // Función para truncar texto largo
    const truncateText = (text, maxLength = 60) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Función para obtener ciudades únicas
    const getUniqueCities = () => {
        const cities = deals.map(deal => deal.property_city).filter(Boolean);
        return [...new Set(cities)].sort();
    };

    // Función para obtener sectores únicos
    const getUniqueSectors = () => {
        const sectors = deals.map(deal => deal.property_sector).filter(Boolean);
        return [...new Set(sectors)].sort();
    };

    // Función para obtener categorías únicas
    const getUniqueCategories = () => {
        const categories = deals.map(deal => deal.property_category).filter(Boolean);
        return [...new Set(categories)].sort();
    };

    // Función para cargar deals
    const fetchDeals = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching deals with manual processing...');

            // Obtener deals básicos
            const { data: dealsData, error: dealsError } = await supabase
                .from('deals')
                .select('*')
                .order('created_at', { ascending: false });

            if (dealsError) {
                console.error('Error obteniendo deals:', dealsError);
                throw dealsError;
            }

            console.log('✅ Basic deals loaded:', dealsData?.length);

            if (!dealsData || dealsData.length === 0) {
                console.log('⚠️ No deals found');
                setDeals([]);
                return;
            }

            // Obtener IDs únicos para las consultas relacionales
            const agentIds = [...new Set(dealsData.map(d => d.closed_by_agent_id).filter(Boolean))];
            const propertyIds = [...new Set(dealsData.map(d => d.property_id).filter(Boolean))];
            const contactIds = [...new Set(dealsData.map(d => d.contact_id).filter(Boolean))];
            const dealTypeIds = [...new Set(dealsData.map(d => d.deal_type_id).filter(Boolean))];
            const dealStatusIds = [...new Set(dealsData.map(d => d.deal_status_id).filter(Boolean))];
            const operationTypeIds = [...new Set(dealsData.map(d => d.operation_type_id).filter(Boolean))];
            const teamIds = [...new Set(dealsData.map(d => d.team_id).filter(Boolean))];

            // Realizar consultas paralelas
            const [
                agentsData,
                propertiesData,
                contactsData,
                dealTypesData,
                dealStatusesData,
                operationTypesData,
                teamsData
            ] = await Promise.all([
                agentIds.length > 0 ? supabase.from('users').select('id, first_name, last_name').in('id', agentIds) : { data: [] },
                propertyIds.length > 0 ? supabase.from('properties').select('id, name, code, main_image_url').in('id', propertyIds) : { data: [] },
                contactIds.length > 0 ? supabase.from('contacts').select('id, name, email, phone').in('id', contactIds) : { data: [] },
                dealTypeIds.length > 0 ? supabase.from('deal_types').select('id, name').in('id', dealTypeIds) : { data: [] },
                dealStatusIds.length > 0 ? supabase.from('deal_statuses').select('id, name, is_final').in('id', dealStatusIds) : { data: [] },
                operationTypeIds.length > 0 ? supabase.from('operation_types').select('id, name').in('id', operationTypeIds) : { data: [] },
                teamIds.length > 0 ? supabase.from('teams').select('id, name').in('id', teamIds) : { data: [] }
            ]);

            // Crear mapas para lookup eficiente
            const agentsMap = new Map((agentsData.data || []).map(agent => [agent.id, agent]));
            const propertiesMap = new Map((propertiesData.data || []).map(prop => [prop.id, prop]));
            const contactsMap = new Map((contactsData.data || []).map(contact => [contact.id, contact]));
            const dealTypesMap = new Map((dealTypesData.data || []).map(type => [type.id, type]));
            const dealStatusesMap = new Map((dealStatusesData.data || []).map(status => [status.id, status]));
            const operationTypesMap = new Map((operationTypesData.data || []).map(op => [op.id, op]));
            const teamsMap = new Map((teamsData.data || []).map(team => [team.id, team]));

            // Combinar datos
            const enrichedDeals = dealsData.map(deal => ({
                ...deal,
                agent: agentsMap.get(deal.closed_by_agent_id) || null,
                property: propertiesMap.get(deal.property_id) || null,
                contact: contactsMap.get(deal.contact_id) || null,
                deal_type: dealTypesMap.get(deal.deal_type_id) || null,
                deal_status: dealStatusesMap.get(deal.deal_status_id) || null,
                operation_type: operationTypesMap.get(deal.operation_type_id) || null,
                team: teamsMap.get(deal.team_id) || null
            }));

            console.log('✅ Enriched deals:', enrichedDeals.length);
            setDeals(enrichedDeals);

        } catch (err) {
            console.error('❌ Error fetching deals:', err);
            setDeals([]);
        } finally {
            setLoading(false);
        }
    };

    // Funciones para cargar datos relacionados
    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, first_name, last_name')
                .eq('active', true)
                .order('first_name');

            if (error) throw error;
            setAgents(data || []);
        } catch (err) {
            console.error('Error fetching agents:', err);
        }
    };

    const fetchProperties = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('id, name, code, main_image_url')
                .eq('availability', 1)
                .order('name');

            if (error) throw error;
            setProperties(data || []);
        } catch (err) {
            console.error('Error fetching properties:', err);
        }
    };

    const fetchContacts = async () => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('id, name, email, phone')
                .order('name');

            if (error) throw error;
            setContacts(data || []);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        }
    };

    const fetchDealTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('deal_types')
                .select('id, name')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setDealTypes(data || []);
        } catch (err) {
            console.error('Error fetching deal types:', err);
        }
    };

    const fetchDealStatuses = async () => {
        try {
            const { data, error } = await supabase
                .from('deal_statuses')
                .select('id, name, is_final')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setDealStatuses(data || []);
        } catch (err) {
            console.error('Error fetching deal statuses:', err);
        }
    };

    const fetchOperationTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('operation_types')
                .select('id, name')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setOperationTypes(data || []);
        } catch (err) {
            console.error('Error fetching operation types:', err);
        }
    };

    const fetchTeams = async () => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('id, name')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setTeams(data || []);
        } catch (err) {
            console.error('Error fetching teams:', err);
        }
    };

    // Función para obtener imagen de la propiedad
    const getPropertyImage = (deal) => {
        if (deal.property && deal.property.main_image_url) {
            return deal.property.main_image_url;
        }
        return null;
    };

    // Función para navegar al detalle
    const handleViewDeal = (dealId) => {
        console.log('Navegando al detalle de cierre:', dealId);
        setSelectedDealId(dealId);
        setViewMode('detail');
    };

    // Función para volver a la lista
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedDealId(null);
    };

    // Función para formatear moneda
    const formatCurrency = (amount, currency) => {
        const symbols = { USD: '$', DOP: 'RD$', EUR: '€' };
        return `${symbols[currency] || currency} ${parseFloat(amount || 0).toLocaleString()}`;
    };

    // Función para formatear fecha
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Función para obtener configuración de badge de estado
    const getStatusBadge = (status, isFinal) => {
        if (isFinal) {
            return { variant: 'success', icon: CheckCircle };
        }
        return { variant: 'warning', icon: Clock };
    };

    // Cargar datos iniciales
    useEffect(() => {
        fetchExchangeRate(); // Cargar tasa de cambio primero
        fetchDeals();
        fetchAgents();
        fetchProperties();
        fetchContacts();
        fetchDealTypes();
        fetchDealStatuses();
        fetchOperationTypes();
        fetchTeams();
    }, []);

    // Reset página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, selectedAgent, selectedTeam, selectedDateRange,
        customDateRange, selectedOperationType, selectedDealType, selectedCity,
        selectedSector, selectedCategory, isExternal, showMyDeals, showParticipatedDeals]);

    // Filtrar deals
    const filteredDeals = deals.filter(deal => {
        // Filtro de búsqueda por texto
        const matchesSearch = !searchTerm ||
            deal.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.deal_number?.toString().includes(searchTerm.toLowerCase()) ||
            deal.property_code?.toString().includes(searchTerm.toLowerCase()) ||
            deal.property?.code?.toString().includes(searchTerm.toLowerCase());

        // Filtro por estado del deal
        const matchesStatus = !selectedStatus || deal.deal_status_id === selectedStatus;

        // Filtro por agente específico
        const matchesAgent = !selectedAgent || deal.closed_by_agent_id === selectedAgent;

        // Filtro por equipo
        const matchesTeam = !selectedTeam || deal.team_id === selectedTeam;

        // Filtro por tipo de operación
        const matchesOperationType = !selectedOperationType || deal.operation_type_id === selectedOperationType;

        // Filtro por tipo de deal
        const matchesDealType = !selectedDealType || deal.deal_type_id === selectedDealType;

        // Filtro por ciudad
        const matchesCity = !selectedCity || deal.property_city === selectedCity;

        // Filtro por sector
        const matchesSector = !selectedSector || deal.property_sector === selectedSector;

        // Filtro por categoría
        const matchesCategory = !selectedCategory || deal.property_category === selectedCategory;

        // Filtro por propiedad externa/interna
        const matchesExternal = !isExternal ||
            (isExternal === 'external' && deal.is_external_property) ||
            (isExternal === 'internal' && !deal.is_external_property);

        // Filtro "Mis Cierres" (necesitaríamos el ID del usuario actual)
        const matchesMyDeals = !showMyDeals || deal.closed_by_agent_id === 'current_user_id'; // Reemplazar con ID real

        // Filtro "Cierres donde participo" (referidor, asistente, etc.)
        const matchesParticipatedDeals = !showParticipatedDeals ||
            deal.referrer_name || // Si es referidor
            deal.closed_by_agent_id === 'current_user_id'; // O es el agente cerrador - ampliar según necesidad

        // Filtro por rango de fechas
        let matchesDateRange = true;
        if (selectedDateRange || (customDateRange.start && customDateRange.end)) {
            const dealDate = new Date(deal.won_date || deal.created_at);
            const today = new Date();

            if (selectedDateRange) {
                switch (selectedDateRange) {
                    case 'today':
                        matchesDateRange = dealDate.toDateString() === today.toDateString();
                        break;
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        matchesDateRange = dealDate.toDateString() === yesterday.toDateString();
                        break;
                    case 'last_week':
                        const lastWeek = new Date(today);
                        lastWeek.setDate(lastWeek.getDate() - 7);
                        matchesDateRange = dealDate >= lastWeek && dealDate <= today;
                        break;
                    case 'this_month':
                        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        matchesDateRange = dealDate >= thisMonthStart && dealDate <= today;
                        break;
                    case 'last_month':
                        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                        matchesDateRange = dealDate >= lastMonthStart && dealDate <= lastMonthEnd;
                        break;
                    case 'last_quarter':
                        const currentQuarter = Math.floor(today.getMonth() / 3);
                        const lastQuarterStart = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
                        const lastQuarterEnd = new Date(today.getFullYear(), currentQuarter * 3, 0);
                        matchesDateRange = dealDate >= lastQuarterStart && dealDate <= lastQuarterEnd;
                        break;
                    case 'last_semester':
                        const currentSemester = Math.floor(today.getMonth() / 6);
                        const lastSemesterStart = new Date(today.getFullYear(), (currentSemester - 1) * 6, 1);
                        const lastSemesterEnd = new Date(today.getFullYear(), currentSemester * 6, 0);
                        matchesDateRange = dealDate >= lastSemesterStart && dealDate <= lastSemesterEnd;
                        break;
                    case 'this_year':
                        const thisYearStart = new Date(today.getFullYear(), 0, 1);
                        matchesDateRange = dealDate >= thisYearStart && dealDate <= today;
                        break;
                    case 'last_year':
                        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
                        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                        matchesDateRange = dealDate >= lastYearStart && dealDate <= lastYearEnd;
                        break;
                }
            } else if (customDateRange.start && customDateRange.end) {
                const startDate = new Date(customDateRange.start);
                const endDate = new Date(customDateRange.end);
                matchesDateRange = dealDate >= startDate && dealDate <= endDate;
            }
        }

        return matchesSearch && matchesStatus && matchesAgent && matchesTeam &&
            matchesOperationType && matchesDealType && matchesCity && matchesSector &&
            matchesCategory && matchesExternal && matchesMyDeals && matchesParticipatedDeals &&
            matchesDateRange;
    });

    // Paginación
    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage);

    // Estadísticas
    const totalValueUSD = filteredDeals.reduce((sum, deal) => sum + convertToUSD(deal.closing_value, deal.currency), 0);
    const totalCommissionUSD = filteredDeals.reduce((sum, deal) => sum + calculateCommissionUSD(deal), 0);
    const completedDeals = filteredDeals.filter(deal => deal.is_completed).length;
    const averageDealValueUSD = filteredDeals.length > 0 ? totalValueUSD / filteredDeals.length : 0;

    // Si estamos en modo detalle, mostrar DealDetails
    if (viewMode === 'detail' && selectedDealId) {
        return (
            <DealDetails
                dealId={selectedDealId}
                onBack={handleBackToList}
            />
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando cierres...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header minimalista y profesional */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cierres</h1>
                        <p className="text-sm text-gray-500">
                            {filteredDeals.length} {filteredDeals.length === 1 ? 'cierre' : 'cierres'} • ${totalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                    >
                        Exportar
                    </Button>
                    <Button
                        onClick={() => setShowModal(true)}
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Nuevo Cierre
                    </Button>
                </div>
            </div>

            {/* Estadísticas compactas */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Cierres</p>
                            <p className="text-xl font-semibold text-gray-900">{filteredDeals.length}</p>
                        </div>
                        <BarChart3 className="w-6 h-6 text-orange-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Valor Total (USD)</p>
                            <p className="text-xl font-semibold text-gray-900">
                                ${totalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Comisiones (USD)</p>
                            <p className="text-xl font-semibold text-gray-900">
                                ${totalCommissionUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completados</p>
                            <p className="text-xl font-semibold text-gray-900">{completedDeals}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-purple-500" />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Tasa Éxito</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {filteredDeals.length > 0 ? ((completedDeals / filteredDeals.length) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <Target className="w-6 h-6 text-indigo-500" />
                    </div>
                </Card>
            </div>

            {/* Filtros avanzados */}
            <Card className="p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar cierres..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <button
                            onClick={() => setShowAgentsModal(true)}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedAgent || selectedTeam || showMyDeals || showParticipatedDeals
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Agentes
                            {(selectedAgent || selectedTeam || showMyDeals || showParticipatedDeals) && (
                                <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs">
                                    •
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setShowDateModal(true)}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedDateRange || (customDateRange.start && customDateRange.end)
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Seleccionar Período
                        </button>

                        <button
                            onClick={() => setShowAdvancedModal(true)}
                            className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedStatus || selectedOperationType || selectedDealType || selectedCity ||
                                selectedSector || selectedCategory || isExternal
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Más Filtros
                        </button>

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedStatus('');
                                setSelectedAgent('');
                                setSelectedTeam('');
                                setSelectedDateRange('');
                                setCustomDateRange({ start: '', end: '' });
                                setSelectedOperationType('');
                                setSelectedDealType('');
                                setSelectedCity('');
                                setSelectedSector('');
                                setSelectedCategory('');
                                setIsExternal('');
                                setShowMyDeals(false);
                                setShowParticipatedDeals(false);
                                setCurrentPage(1);
                            }}
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium px-2 py-1 hover:bg-orange-50 rounded"
                        >
                            Borrar filtros
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">
                        {filteredDeals.length} resultados
                    </div>
                </div>
            </Card>

            {/* Lista de cierres */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                                    Inmueble
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                                    Solicitud
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                    Cerrado por
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                    Monto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedDeals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay cierres registrados
                                    </td>
                                </tr>
                            ) : (
                                paginatedDeals.map((deal) => {
                                    const statusConfig = getStatusBadge(deal.deal_status?.name, deal.deal_status?.is_final);
                                    const StatusIcon = statusConfig.icon;
                                    const propertyImage = getPropertyImage(deal);

                                    return (
                                        <tr
                                            key={deal.id}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleViewDeal(deal.id)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {propertyImage ? (
                                                            <img
                                                                src={propertyImage}
                                                                alt="Propiedad"
                                                                className="w-16 h-16 rounded-lg object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center ${propertyImage ? 'hidden' : 'flex'}`}>
                                                            <Building className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {truncateText(deal.property?.name || deal.property_name || 'Propiedad Externa', 50)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Cierre #{deal.deal_number} • {deal.property?.code || deal.property_code || 'Sin código'}
                                                        </div>
                                                        {deal.unit_number && (
                                                            <div className="text-xs text-gray-400">
                                                                Unidad: {deal.unit_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {truncateText(deal.business_name || 'Sin nombre', 40)}
                                                </div>
                                                {deal.contact?.name && (
                                                    <div className="text-sm text-gray-500">
                                                        {truncateText(deal.contact.name, 30)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {deal.agent ? `${deal.agent.first_name} ${deal.agent.last_name}` : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(deal.closing_value, deal.currency)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ${convertToUSD(deal.closing_value, deal.currency).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                                                </div>
                                                {deal.commission_percentage && (
                                                    <div className="text-xs text-green-600 font-medium">
                                                        Com: ${calculateCommissionUSD(deal).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-500">
                                                    {deal.won_date ? formatDate(deal.won_date) : formatDate(deal.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant={statusConfig.variant}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {deal.deal_status?.name || 'Sin estado'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación minimalista */}
                {totalPages > 1 && (
                    <div className="px-4 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDeals.length)} de {filteredDeals.length}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    ← Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Siguiente →
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modales de filtros */}
            {showAgentsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Agentes</h3>
                            <button onClick={() => setShowAgentsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-orange-50 p-3 rounded-lg space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={showMyDeals}
                                        onChange={(e) => setShowMyDeals(e.target.checked)}
                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-medium text-orange-900">Mis Cierres</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={showParticipatedDeals}
                                        onChange={(e) => setShowParticipatedDeals(e.target.checked)}
                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-medium text-orange-900">Cierres donde participo</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Agente específico:</label>
                                <select
                                    value={selectedAgent}
                                    onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Todos los agentes</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.first_name} {agent.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Equipo:</label>
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Todos los equipos</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between space-x-2 p-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedAgent('');
                                    setSelectedTeam('');
                                    setShowMyDeals(false);
                                    setShowParticipatedDeals(false);
                                }}
                            >
                                Limpiar este filtro
                            </Button>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => setShowAgentsModal(false)}>Cancelar</Button>
                                <Button onClick={() => {
                                    setShowAgentsModal(false);
                                    setCurrentPage(1);
                                }}>Aplicar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Seleccionar Período</h3>
                            <button onClick={() => setShowDateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Períodos predefinidos:</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'today', label: 'Hoy' },
                                        { value: 'yesterday', label: 'Ayer' },
                                        { value: 'last_week', label: 'Semana pasada' },
                                        { value: 'this_month', label: 'Este mes' },
                                        { value: 'last_month', label: 'Mes pasado' },
                                        { value: 'last_quarter', label: 'Trimestre pasado' },
                                        { value: 'last_semester', label: 'Semestre pasado' },
                                        { value: 'this_year', label: 'Este año' },
                                        { value: 'last_year', label: 'Año pasado' }
                                    ].map(period => (
                                        <label key={period.value} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="dateRange"
                                                value={period.value}
                                                checked={selectedDateRange === period.value}
                                                onChange={(e) => {
                                                    setSelectedDateRange(e.target.value);
                                                    setCustomDateRange({ start: '', end: '' }); // Limpiar fechas personalizadas
                                                }}
                                                className="text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{period.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Período personalizado:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={customDateRange.start}
                                        onChange={(e) => {
                                            setCustomDateRange(prev => ({ ...prev, start: e.target.value }));
                                            setSelectedDateRange(''); // Limpiar período predefinido
                                        }}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <input
                                        type="date"
                                        value={customDateRange.end}
                                        onChange={(e) => {
                                            setCustomDateRange(prev => ({ ...prev, end: e.target.value }));
                                            setSelectedDateRange(''); // Limpiar período predefinido
                                        }}
                                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between space-x-2 p-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedDateRange('');
                                    setCustomDateRange({ start: '', end: '' });
                                }}
                            >
                                Limpiar este filtro
                            </Button>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => setShowDateModal(false)}>Cancelar</Button>
                                <Button onClick={() => {
                                    setShowDateModal(false);
                                    setCurrentPage(1);
                                }}>Aplicar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAdvancedModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Más Filtros</h3>
                            <button onClick={() => setShowAdvancedModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Columna 1 - Filtros de ubicación y operación */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad:</label>
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {getUniqueCities().map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sector:</label>
                                        <select
                                            value={selectedSector}
                                            onChange={(e) => setSelectedSector(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {getUniqueSectors().map(sector => (
                                                <option key={sector} value={sector}>{sector}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría:</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {getUniqueCategories().map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Operación:</label>
                                        <select
                                            value={selectedOperationType}
                                            onChange={(e) => setSelectedOperationType(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {operationTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Columna 2 - Filtros de tipo y estado */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cierre:</label>
                                        <select
                                            value={selectedDealType}
                                            onChange={(e) => setSelectedDealType(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {dealTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Etapa del cierre:</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Seleccionar</option>
                                            {dealStatuses.map(status => (
                                                <option key={status.id} value={status.id}>{status.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cierre Interno o Externo:</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="external"
                                                    value="internal"
                                                    checked={isExternal === 'internal'}
                                                    onChange={(e) => setIsExternal(e.target.value)}
                                                    className="text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Interno</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="external"
                                                    value="external"
                                                    checked={isExternal === 'external'}
                                                    onChange={(e) => setIsExternal(e.target.value)}
                                                    className="text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Externo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between space-x-2 p-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedOperationType('');
                                    setSelectedDealType('');
                                    setSelectedStatus('');
                                    setSelectedCity('');
                                    setSelectedSector('');
                                    setSelectedCategory('');
                                    setIsExternal('');
                                }}
                            >
                                Limpiar este filtro
                            </Button>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => setShowAdvancedModal(false)}>Cancelar</Button>
                                <Button onClick={() => {
                                    setShowAdvancedModal(false);
                                    setCurrentPage(1);
                                }}>Aplicar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealsManager;