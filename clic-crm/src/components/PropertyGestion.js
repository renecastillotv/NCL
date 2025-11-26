import React, { useState } from 'react';
import {
    Eye, BarChart3, MessageSquare, Globe, Plus, User, Settings
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';

const PropertyGestion = ({ propertyId, property }) => {
    const [newComment, setNewComment] = useState('');

    const handleAddComment = () => {
        if (newComment.trim()) {
            // Aquí implementarías la lógica para agregar comentario
            console.log('Nuevo comentario:', newComment);
            setNewComment('');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Portales */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Eye className="w-5 h-5 text-orange-600" />
                            <span>Portales</span>
                        </h3>
                        <Button variant="outline" size="sm">
                            Configurar
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">Portal Principal</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="font-medium">Portal Secundario</span>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-medium">MLS</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        </div>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Portal
                    </Button>
                </Card>

                {/* Reportes */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-orange-600" />
                            <span>Reportes</span>
                        </h3>
                        <Button variant="outline" size="sm">
                            Ver Todos
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Visualizaciones</span>
                                <span className="text-2xl font-bold text-orange-600">1,247</span>
                            </div>
                            <p className="text-xs text-gray-600">Este mes</p>
                            <div className="mt-2 flex items-center text-xs text-green-600">
                                <span>↗ +12% vs mes anterior</span>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Contactos</span>
                                <span className="text-2xl font-bold text-orange-600">23</span>
                            </div>
                            <p className="text-xs text-gray-600">Últimos 30 días</p>
                            <div className="mt-2 flex items-center text-xs text-green-600">
                                <span>↗ +8% vs mes anterior</span>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Calificación</span>
                                <span className="text-2xl font-bold text-orange-600">4.8</span>
                            </div>
                            <p className="text-xs text-gray-600">Promedio general</p>
                            <div className="mt-2 flex items-center text-xs text-orange-600">
                                <span>→ Sin cambios</span>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Tiempo en Portal</span>
                                <span className="text-2xl font-bold text-orange-600">3:42</span>
                            </div>
                            <p className="text-xs text-gray-600">Promedio por visita</p>
                            <div className="mt-2 flex items-center text-xs text-green-600">
                                <span>↗ +15% vs mes anterior</span>
                            </div>
                        </div>
                    </div>

                    <Button variant="primary" className="w-full mt-4 bg-orange-600 hover:bg-orange-700">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Reporte Completo
                    </Button>
                </Card>

                {/* Comentarios */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <MessageSquare className="w-5 h-5 text-orange-600" />
                            <span>Comentarios</span>
                        </h3>
                        <Badge className="bg-orange-100 text-orange-800">
                            5 nuevos
                        </Badge>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">Juan Pérez</span>
                                        <span className="text-xs text-gray-500">hace 2 horas</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Cliente interesado, solicita más información sobre financiamiento y posibilidad de reserva.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">María García</span>
                                        <span className="text-xs text-gray-500">ayer</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Actualizar precio según nueva valoración del mercado. Cliente dispuesto a negociar.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">Carlos López</span>
                                        <span className="text-xs text-gray-500">hace 3 días</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Visita programada para el viernes. Familia joven interesada en mudarse pronto.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm">Sistema</span>
                                        <span className="text-xs text-gray-500">hace 1 semana</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Propiedad publicada en todos los portales activos. Campaña de marketing iniciada.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Escribir comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 text-sm"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddComment();
                                    }
                                }}
                            />
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={handleAddComment}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Sección adicional de métricas detalladas */}
            <div className="mt-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Métricas Detalladas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
                            <p className="text-sm text-gray-600">Favoritos</p>
                            <p className="text-xs text-green-600 mt-1">↗ +5 esta semana</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
                            <p className="text-sm text-gray-600">Tasa de Interés</p>
                            <p className="text-xs text-orange-600 mt-1">→ Estable</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
                            <p className="text-sm text-gray-600">Visitas Programadas</p>
                            <p className="text-xs text-green-600 mt-1">↗ +3 esta semana</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">4.2</div>
                            <p className="text-sm text-gray-600">Días Promedio</p>
                            <p className="text-xs text-gray-600 mt-1">Para contacto inicial</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PropertyGestion;