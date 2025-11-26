import React from 'react';
import { TrendingUp, Users, Home, DollarSign, Clock, User, Calendar, AlertCircle } from 'lucide-react';

const Dashboard = ({ dashboardData, user }) => {
    // Provide default data structure if dashboardData is undefined
    const defaultData = {
        stats: {
            new_leads: 0,
            active_properties: 0,
            pending_deals: 0,
            monthly_revenue: 0
        },
        activities: [],
        tasks: []
    };

    // Use provided data or fallback to defaults
    const data = dashboardData || defaultData;
    const stats = data.stats || defaultData.stats;
    const activities = data.activities || defaultData.activities;
    const tasks = data.tasks || defaultData.tasks;

    // Format currency for Dominican Republic
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-DO').format(num);
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            ¡Bienvenido{user?.name ? `, ${user.name}` : ''}!
                        </h1>
                        <p className="text-orange-100 mt-1">
                            {user?.country_code === 'DOM' ? 'República Dominicana' : 'Panel de Control'} •
                            {user?.roles?.[0]?.display_name || user?.role?.replace('_', ' ') || 'Usuario'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-orange-100">
                            {new Date().toLocaleDateString('es-DO', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Nuevos Leads</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.new_leads)}</p>
                            <p className="text-sm text-green-600 mt-1">+12% vs mes anterior</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Propiedades Activas</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.active_properties)}</p>
                            <p className="text-sm text-green-600 mt-1">+8% vs mes anterior</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Deals Pendientes</p>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.pending_deals)}</p>
                            <p className="text-sm text-green-600 mt-1">+15% vs mes anterior</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Revenue Mensual</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthly_revenue)}</p>
                            <p className="text-sm text-green-600 mt-1">+22% vs mes anterior</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Actividades Recientes</h3>
                    </div>
                    <div className="p-6">
                        {activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                            <div className="flex items-center mt-2">
                                                <Clock className="w-3 h-3 text-gray-400 mr-1" />
                                                <span className="text-xs text-gray-500">hace {activity.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No hay actividades recientes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Tareas Pendientes</h3>
                    </div>
                    <div className="p-6">
                        {tasks.length > 0 ? (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                            <div className="flex items-center mt-2 space-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                                                    <span className="text-xs text-gray-500">{task.due}</span>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'Alta'
                                                        ? 'bg-red-100 text-red-700'
                                                        : task.priority === 'Media'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No hay tareas pendientes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Users className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Nuevo Cliente</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Home className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Nueva Propiedad</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Calendar className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Agendar Cita</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Nuevo Deal</span>
                    </button>
                </div>
            </div>

            {/* Debug Info - Show when data is missing */}
            {!dashboardData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-700">
                            <strong>Modo de desarrollo:</strong> Usando datos por defecto.
                            El componente Dashboard no recibió dashboardData válido.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;