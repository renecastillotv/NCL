import React, { useState, useEffect } from 'react';
import {
    DollarSign, Percent, CreditCard, CheckCircle, Clock
} from 'lucide-react';



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

const DealCommissions = ({ deal, onUpdate }) => {
    const [commissionData, setCommissionData] = useState({
        status: deal.commission_status || 'pending',
        paid_amount: deal.commission_paid_amount || 0,
        total_amount: 0,
        payment_date: deal.commission_payment_date || '',
        notes: deal.commission_notes || ''
    });
    const [loading, setLoading] = useState(false);

    // Calcular monto total de comisión
    useEffect(() => {
        const closingValue = parseFloat(deal.closing_value || 0);
        const commissionPercentage = parseFloat(deal.commission_percentage || 0);
        const totalCommission = (closingValue * commissionPercentage) / 100;

        setCommissionData(prev => ({
            ...prev,
            total_amount: totalCommission
        }));
    }, [deal]);

    const updateCommissionStatus = async (newStatus) => {
        setLoading(true);
        try {
            const updateData = {
                commission_status: newStatus,
                commission_paid_amount: commissionData.paid_amount,
                commission_payment_date: newStatus === 'paid' ? new Date().toISOString() : commissionData.payment_date,
                commission_notes: commissionData.notes
            };

            const { error } = await supabase
                .from('deals')
                .update(updateData)
                .eq('id', deal.id);

            if (error) throw error;

            setCommissionData(prev => ({ ...prev, status: newStatus }));
            
            // Notificar al componente padre sobre la actualización
            if (onUpdate) {
                onUpdate({ ...deal, ...updateData });
            }
        } catch (error) {
            console.error('Error actualizando comisión:', error);
            alert('Error al actualizar la comisión: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: deal.currency || 'USD'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partial': return 'bg-yellow-100 text-yellow-800';
            case 'pending': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Pagado Completo';
            case 'partial': return 'Pago Parcial';
            case 'pending': return 'Pendiente';
            default: return 'Sin Estado';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'partial': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'pending': return <Clock className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const pendingAmount = Math.max(0, commissionData.total_amount - commissionData.paid_amount);
    const paymentProgress = commissionData.total_amount > 0 ? 
        (commissionData.paid_amount / commissionData.total_amount) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        {getStatusIcon(commissionData.status)}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Gestión de Comisiones</h3>
                            <p className="text-sm text-gray-500">Estado actual del pago de comisión</p>
                        </div>
                    </div>
                    <Badge className={getStatusColor(commissionData.status)}>
                        {getStatusText(commissionData.status)}
                    </Badge>
                </div>

                {/* Resumen financiero */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Valor del Cierre</p>
                                <p className="text-xl font-bold text-blue-800">
                                    {formatCurrency(deal.closing_value)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Base para cálculo de comisión
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">
                                    Comisión Total ({deal.commission_percentage || 0}%)
                                </p>
                                <p className="text-xl font-bold text-orange-800">
                                    {formatCurrency(commissionData.total_amount)}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    Monto total a cobrar
                                </p>
                            </div>
                            <Percent className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Monto Pagado</p>
                                <p className="text-xl font-bold text-green-800">
                                    {formatCurrency(commissionData.paid_amount)}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Pendiente: {formatCurrency(pendingAmount)}
                                </p>
                            </div>
                            <CreditCard className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Barra de progreso de pago */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progreso de Pago</span>
                        <span className="text-sm text-gray-500">{Math.round(paymentProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${paymentProgress}%` }}
                        />
                    </div>
                </div>

                {/* Acciones de pago */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto a registrar:
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={commissionData.paid_amount}
                                    onChange={(e) => setCommissionData(prev => ({
                                        ...prev,
                                        paid_amount: parseFloat(e.target.value) || 0
                                    }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                                    min="0"
                                    max={commissionData.total_amount}
                                    step="0.01"
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                    de {formatCurrency(commissionData.total_amount)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado deseado:
                            </label>
                            <div className="flex space-x-2">
                                <Button
                                    onClick={() => updateCommissionStatus('partial')}
                                    disabled={loading || commissionData.paid_amount === 0}
                                    variant="outline"
                                    size="sm"
                                    icon={<CreditCard className="w-4 h-4" />}
                                >
                                    Parcial
                                </Button>
                                <Button
                                    onClick={() => updateCommissionStatus('paid')}
                                    disabled={loading || commissionData.paid_amount < commissionData.total_amount}
                                    variant="success"
                                    size="sm"
                                    icon={<CheckCircle className="w-4 h-4" />}
                                >
                                    Completo
                                </Button>
                                <Button
                                    onClick={() => updateCommissionStatus('pending')}
                                    disabled={loading}
                                    variant="outline"
                                    size="sm"
                                    icon={<Clock className="w-4 h-4" />}
                                >
                                    Pendiente
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas de pago:
                        </label>
                        <textarea
                            value={commissionData.notes}
                            onChange={(e) => setCommissionData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                            rows="3"
                            placeholder="Detalles del pago, método utilizado, banco, número de referencia, etc."
                        />
                    </div>

                    {/* Información adicional */}
                    {commissionData.payment_date && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Fecha de último pago:</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(commissionData.payment_date).toLocaleDateString('es-DO', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                {commissionData.notes && (
                                    <div className="max-w-xs">
                                        <p className="text-xs text-gray-500">Notas:</p>
                                        <p className="text-xs text-gray-600 truncate" title={commissionData.notes}>
                                            {commissionData.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Advertencias y validaciones */}
                {commissionData.paid_amount > commissionData.total_amount && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-yellow-800">
                                El monto ingresado excede la comisión total. 
                                Exceso: {formatCurrency(commissionData.paid_amount - commissionData.total_amount)}
                            </p>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <p className="text-sm text-blue-800">Actualizando estado de comisión...</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Resumen de comisiones históricas */}
            <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumen de Comisiones</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">
                            {deal.commission_percentage || 0}%
                        </p>
                        <p className="text-xs text-gray-500">Porcentaje</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(commissionData.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(commissionData.paid_amount)}
                        </p>
                        <p className="text-xs text-gray-500">Pagado</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(pendingAmount)}
                        </p>
                        <p className="text-xs text-gray-500">Pendiente</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DealCommissions;