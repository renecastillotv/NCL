import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Edit, Download, Building, DollarSign, Calendar,
    User, Users, CheckCircle, Clock, AlertCircle, Percent,
    Eye, MessageSquare, FileText, Ban, AlertTriangle, HomeIcon,
    Upload, RefreshCw, X
} from 'lucide-react';

import PropertyDetail from './PropertyDetail';
import DealExpediente from './DealExpediente';
import DealCommissions from './DealCommissions';


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
        xs: 'px-2 py-1 text-xs',
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

const Card = ({ children, className = '', title, ...props }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
        {title && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
        )}
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

const DealDetails = ({ dealId, onBack }) => {
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPropertyDetail, setShowPropertyDetail] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [usdToDopRate, setUsdToDopRate] = useState(60.00);

    useEffect(() => {
        const fetchDealDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data: dealData, error: dealError } = await supabase
                    .from('deals')
                    .select(`
                        *,
                        users!deals_closed_by_agent_id_fkey(
                            id, first_name, last_name, email, phone, position, 
                            profile_photo_url, active, biography, languages,
                            specialty_description, sales_count, years_experience,
                            company_start_date, created_at
                        ),
                        properties(
                            id, name, code, main_image_url, availability
                        ),
                        contacts(
                            id, name, email, phone, document_number, address, source, notes
                        ),
                        deal_statuses(
                            id, name, is_final
                        ),
                        deal_types(
                            id, name
                        ),
                        operation_types(
                            id, name
                        ),
                        teams(
                            id, name
                        )
                    `)
                    .eq('id', dealId)
                    .single();

                if (dealError) throw dealError;
                setDeal(dealData);

                const { data: rateData } = await supabase
                    .from('configurations')
                    .select('value')
                    .eq('key', 'usd_to_dop_rate')
                    .eq('active', true)
                    .single();

                if (rateData) {
                    setUsdToDopRate(parseFloat(rateData.value));
                }

            } catch (err) {
                console.error('Error al cargar deal:', err);
                setError(err.message || 'Error al cargar los detalles del cierre');
            } finally {
                setLoading(false);
            }
        };

        if (dealId) {
            fetchDealDetails();
        }
    }, [dealId]);

    const convertToUSD = (amount, currency) => {
        const numAmount = parseFloat(amount || 0);
        switch (currency) {
            case 'USD':
                return numAmount;
            case 'DOP':
                return numAmount / usdToDopRate;
            case 'EUR':
                return numAmount * 1.1;
            default:
                return numAmount;
        }
    };

    const formatCurrency = (amount, currency) => {
        if (!amount) return 'N/A';

        let symbol = '';
        if (currency === 'USD') {
            symbol = '$';
        } else if (currency === 'DOP') {
            symbol = 'RD$';
        } else if (currency === 'EUR') {
            symbol = '€';
        } else {
            symbol = currency || '';
        }

        return `${symbol} ${parseFloat(amount).toLocaleString()}`;
    };

    const formatDate = (date) => {
        if (!date) return 'No definida';
        return new Date(date).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleCancelDeal = async () => {
        try {
            const { error } = await supabase
                .from('deals')
                .update({
                    is_cancelled: true,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: 'current_user_id'
                })
                .eq('id', dealId);

            if (error) throw error;

            setDeal(prev => ({ ...prev, is_cancelled: true }));
            setShowCancelModal(false);
        } catch (error) {
            console.error('Error anulando cierre:', error);
        }
    };

    const handleDealUpdate = (updatedDeal) => {
        setDeal(updatedDeal);
    };

    if (showPropertyDetail && deal?.property_id) {
        return (
            <PropertyDetail
                propertyId={deal.property_id}
                onBack={() => setShowPropertyDetail(false)}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando detalles del cierre...</p>
                </div>
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{error || 'No se encontró el cierre'}</p>
                    <Button onClick={onBack} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a la lista
                    </Button>
                </div>
            </div>
        );
    }

    const valueUSD = convertToUSD(deal.closing_value, deal.currency);
    const commissionUSD = (valueUSD * parseFloat(deal.commission_percentage || 0)) / 100;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header simplificado */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            icon={<ArrowLeft className="w-4 h-4" />}
                            size="sm"
                        >
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Cierre #{deal.deal_number || 'Sin número'}
                                {deal.is_cancelled && (
                                    <Badge variant="danger" className="ml-2">ANULADO</Badge>
                                )}
                            </h1>
                            <p className="text-sm text-gray-600">{deal.business_name || 'Sin nombre de negocio'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>
                            Editar
                        </Button>
                        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                            Exportar
                        </Button>
                        {!deal.is_cancelled && (
                            <Button
                                variant="danger"
                                size="sm"
                                icon={<Ban className="w-4 h-4" />}
                                onClick={() => setShowCancelModal(true)}
                            >
                                Anular
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Columna principal - Solo módulos de gestión */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* MÓDULO DE COMISIONES */}
                        <DealCommissions
                            deal={deal}
                            onUpdate={handleDealUpdate}
                        />

                        {/* MÓDULO DE EXPEDIENTE */}
                        <DealExpediente dealId={dealId} deal={deal} />
                    </div>

                    {/* Sidebar - Información esencial del cierre */}
                    <div className="space-y-4">
                        {/* KPIs compactos */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Datos del Cierre</h3>

                            {/* Valor */}
                            <div className="flex items-center justify-between mb-3 p-3 bg-green-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-green-600">Valor del Cierre</p>
                                    <p className="text-lg font-bold text-green-800">
                                        {formatCurrency(deal.closing_value, deal.currency)}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        ${valueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                                    </p>
                                </div>
                                <DollarSign className="w-6 h-6 text-green-500" />
                            </div>

                            {/* Comisión */}
                            <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-blue-600">Comisión</p>
                                    <p className="text-lg font-bold text-blue-800">
                                        {deal.commission_percentage || 0}%
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        ${commissionUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                                    </p>
                                </div>
                                <Percent className="w-6 h-6 text-blue-500" />
                            </div>

                            {/* Estado */}
                            <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-600">Estado</p>
                                    <Badge variant={deal.deal_statuses?.is_final ? 'success' : 'warning'} className="mb-1">
                                        {deal.deal_statuses?.name || 'Sin estado'}
                                    </Badge>
                                    <p className="text-xs text-gray-500">
                                        {deal.is_completed ? 'Completado' : 'En proceso'}
                                    </p>
                                </div>
                                {deal.deal_statuses?.is_final ?
                                    <CheckCircle className="w-6 h-6 text-green-500" /> :
                                    <Clock className="w-6 h-6 text-yellow-500" />
                                }
                            </div>

                            {/* Fecha */}
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-purple-600">Fecha Cierre</p>
                                    <p className="text-sm font-bold text-purple-800">
                                        {formatDate(deal.won_date)}
                                    </p>
                                    <p className="text-xs text-purple-600">
                                        {deal.taxes_applied ? 'Con impuestos' : 'Sin impuestos'}
                                    </p>
                                </div>
                                <Calendar className="w-6 h-6 text-purple-500" />
                            </div>
                        </Card>

                        {/* Participantes */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Participantes</h3>

                            {/* Agente */}
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Agente de Cierre</p>
                                {deal.users ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                            {deal.users.profile_photo_url ? (
                                                <img
                                                    src={deal.users.profile_photo_url}
                                                    alt={`${deal.users.first_name} ${deal.users.last_name}`}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <User className={`w-5 h-5 text-orange-600 ${deal.users.profile_photo_url ? 'hidden' : ''}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {deal.users.first_name} {deal.users.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{deal.users.email}</p>
                                            {deal.users.position && (
                                                <p className="text-xs text-gray-400">{deal.users.position}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No asignado</p>
                                )}
                            </div>

                            {/* Cliente */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Cliente</p>
                                {deal.contacts ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{deal.contacts.name}</p>
                                            <p className="text-xs text-gray-500">{deal.contacts.email}</p>
                                            {deal.contacts.phone && (
                                                <p className="text-xs text-gray-400">{deal.contacts.phone}</p>
                                            )}
                                            {deal.contacts.source && (
                                                <p className="text-xs text-gray-400">Fuente: {deal.contacts.source}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No especificado</p>
                                )}
                            </div>
                        </Card>

                        {/* Propiedad */}
                        <Card className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">Propiedad</h3>
                                {deal.property_id && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        icon={<Eye className="w-3 h-3" />}
                                        onClick={() => setShowPropertyDetail(true)}
                                    >
                                        Ver
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                {deal.properties?.main_image_url ? (
                                    <img
                                        src={deal.properties.main_image_url}
                                        alt="Propiedad"
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Building className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 leading-tight">
                                        {deal.properties?.name || deal.property_name || 'Propiedad Externa'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Código: {deal.properties?.code || deal.property_code || 'Sin código'}
                                    </p>
                                    {deal.unit_number && (
                                        <p className="text-xs text-gray-500">Unidad: {deal.unit_number}</p>
                                    )}
                                    <div className="mt-1">
                                        <Badge variant={deal.is_external_property ? 'warning' : 'success'} className="text-xs">
                                            {deal.is_external_property ? 'Externa' : 'Interna'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Información adicional compacta */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Detalles</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Deal #</span>
                                    <span className="font-medium">#{deal.deal_number || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tipo</span>
                                    <span className="font-medium">{deal.operation_types?.name || 'N/A'}</span>
                                </div>
                                {deal.teams && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Equipo</span>
                                        <span className="font-medium">{deal.teams.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Creado</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(deal.created_at).toLocaleDateString('es-DO')}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal de cancelación */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Anular Cierre</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que deseas anular este cierre? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex space-x-3">
                            <Button
                                variant="danger"
                                onClick={handleCancelDeal}
                                icon={<Ban className="w-4 h-4" />}
                            >
                                Sí, Anular
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealDetails;