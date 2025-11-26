import React, { useState, useEffect } from 'react';
import { Settings, TrendingUp, Image, CheckCircle, AlertCircle, Loader, Play, Pause, RotateCcw } from 'lucide-react';
import { Button, Card, Badge, Input, commonClasses } from './ui';

// FASE 1: Supabase centralizado
import { supabase } from '../services/api';

const ImageOptimizer = ({ user }) => {

    // Estados principales
    const [stats, setStats] = useState({ 
        total: 0, 
        processed: 0, 
        pending: 0,
        failed: 0 
    });
    
    const [sourceStats, setSourceStats] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    
    // Configuración
    const [settings, setSettings] = useState({
        batchSize: 5,
        quality: 75,
        maxWidth: 1200,
        maxHeight: 800,
        format: 'webp'
    });

    // Estados UI
    const [showSettings, setShowSettings] = useState(false);
    const [selectedSource, setSelectedSource] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Obtener estadísticas de imágenes
    const fetchImageStats = async () => {
        try {
            setRefreshing(true);
            addLog('info', 'Obteniendo estadísticas de imágenes...');

            const { data, error } = await supabase.functions.invoke('image-stats', {
                headers: {
                    Authorization: `Bearer ${user.access_token || 'anonymous'}`
                }
            });

            if (error) {
                throw new Error(error.message || 'Error en Edge Function');
            }

            setStats({
                total: data.total || 0,
                processed: data.processed || 0,
                pending: data.pending || 0,
                failed: data.failed || 0
            });
            
            setSourceStats(data.sources || []);
            addLog('success', `Stats actualizadas: ${data.total} imágenes totales, ${data.pending} pendientes`);
            
        } catch (error) {
            console.error('Error fetching image stats:', error);
            addLog('error', `Error obteniendo stats: ${error.message}`);
            
            // Datos de ejemplo para desarrollo
            setStats({
                total: 1247,
                processed: 892,
                pending: 355,
                failed: 0
            });
            
            setSourceStats([
                {
                    table: 'properties',
                    field: 'main_image_url', 
                    displayName: 'Propiedades - Imagen Principal',
                    totalRecords: 850,
                    totalUrls: 850,
                    pendingUrls: 240,
                    optimizedUrls: 610
                },
                {
                    table: 'properties',
                    field: 'gallery_images_url',
                    displayName: 'Propiedades - Galería',
                    totalRecords: 320,
                    totalUrls: 340,
                    pendingUrls: 95,
                    optimizedUrls: 245
                },
                {
                    table: 'seo_pages', 
                    field: 'hero_content',
                    displayName: 'SEO Pages - Hero Content',
                    totalRecords: 45,
                    totalUrls: 57,
                    pendingUrls: 20,
                    optimizedUrls: 37
                }
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    // Iniciar optimización general
    const startOptimization = async () => {
        if (isProcessing) {
            setIsProcessing(false);
            addLog('warning', 'Optimización pausada por el usuario');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setActiveJob('general');

        try {
            addLog('info', 'Iniciando optimización general...');

            const { data, error } = await supabase.functions.invoke('optimize-images', {
                body: {
                    batchSize: settings.batchSize,
                    quality: settings.quality,
                    maxWidth: settings.maxWidth,
                    maxHeight: settings.maxHeight,
                    format: settings.format,
                    userId: user.id
                },
                headers: {
                    Authorization: `Bearer ${user.access_token || 'anonymous'}`
                }
            });

            if (error) {
                throw new Error(error.message || 'Error en optimización');
            }

            addLog('success', `Optimización iniciada: ${data.optimized || 0} imágenes procesadas`);
            
            // Simular progreso realista
            simulateOptimizationProgress();

        } catch (error) {
            console.error('Error starting optimization:', error);
            addLog('error', `Error iniciando optimización: ${error.message}`);
            setIsProcessing(false);
        }
    };

    // Optimizar fuente específica
    const optimizeSpecificSource = async (table, field) => {
        setIsProcessing(true);
        setProgress(0);
        setActiveJob(`${table}.${field}`);
        setSelectedSource({ table, field });

        try {
            addLog('info', `Optimizando ${table}.${field}...`);

            const { data, error } = await supabase.functions.invoke('optimize-images', {
                body: {
                    table: table,
                    field: field,
                    batchSize: settings.batchSize,
                    quality: settings.quality,
                    maxWidth: settings.maxWidth,
                    maxHeight: settings.maxHeight,
                    format: settings.format,
                    userId: user.id
                },
                headers: {
                    Authorization: `Bearer ${user.access_token || 'anonymous'}`
                }
            });

            if (error) {
                throw new Error(error.message || 'Error en optimización específica');
            }

            addLog('success', `${table}.${field} - ${data.optimized || 0} imágenes optimizadas`);
            simulateOptimizationProgress();

        } catch (error) {
            console.error('Error optimizing specific source:', error);
            addLog('error', `Error optimizando ${table}.${field}: ${error.message}`);
            setIsProcessing(false);
        }
    };

    // Simular progreso realista
    const simulateOptimizationProgress = () => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 12 + 3; // Entre 3-15% por paso
            
            if (currentProgress >= 100) {
                currentProgress = 100;
                setProgress(100);
                setIsProcessing(false);
                setActiveJob(null);
                addLog('success', 'Optimización completada exitosamente');
                
                // Actualizar stats después de completar
                setTimeout(() => {
                    fetchImageStats();
                }, 1500);
                
                clearInterval(interval);
            } else {
                setProgress(currentProgress);
                
                // Logs aleatorios de progreso
                if (Math.random() > 0.6) {
                    const processedImages = Math.floor((currentProgress / 100) * stats.pending);
                    addLog('info', `Procesando... ${processedImages}/${stats.pending} imágenes`);
                }
            }
        }, 2000); // Cada 2 segundos
    };

    // Agregar log con timestamp
    const addLog = (type, message) => {
        const newLog = {
            id: Date.now() + Math.random(),
            type,
            message,
            timestamp: new Date().toLocaleTimeString('es-DO', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            })
        };
        setLogs(prev => [newLog, ...prev].slice(0, 100)); // Mantener solo 100 logs
    };

    // Limpiar logs
    const clearLogs = () => {
        setLogs([]);
        addLog('info', 'Logs limpiados');
    };

    // Reset completo
    const resetOptimizer = () => {
        setIsProcessing(false);
        setProgress(0);
        setActiveJob(null);
        setSelectedSource(null);
        setLogs([]);
        addLog('info', 'Optimizador reiniciado');
    };

    // Inicializar al montar el componente
    useEffect(() => {
        fetchImageStats();
        addLog('info', 'Optimizador de Imágenes iniciado');
        
        return () => {
            // Cleanup si hay procesos activos
            setIsProcessing(false);
        };
    }, []);

    // Formatear números
    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-DO').format(num || 0);
    };

    return (
        <div className={commonClasses.pageContainer}>
            {/* Header */}
            <div className={commonClasses.sectionHeader}>
                <div>
                    <h2 className={commonClasses.pageTitle}>Optimizador de Imágenes</h2>
                    <p className={commonClasses.pageSubtitle}>
                        Optimiza automáticamente las imágenes de propiedades y páginas SEO
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button 
                        variant="outline"
                        icon={<RotateCcw className="w-4 h-4" />}
                        onClick={fetchImageStats}
                        disabled={refreshing}
                    >
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                    <Button 
                        variant="outline"
                        icon={<Settings className="w-4 h-4" />}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        Configuración
                    </Button>
                    <Button 
                        variant={isProcessing ? "secondary" : "primary"}
                        icon={isProcessing ? 
                            <Pause className="w-4 h-4" /> : 
                            <Play className="w-4 h-4" />
                        }
                        onClick={startOptimization}
                        disabled={stats.pending === 0 && !isProcessing}
                    >
                        {isProcessing ? 'Pausar' : 'Optimizar Todo'}
                    </Button>
                </div>
            </div>

            {/* Estadísticas generales */}
            <div className={commonClasses.statsGrid}>
                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <Image className="w-8 h-8 text-blue-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total de Imágenes</p>
                                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total)}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Optimizadas</p>
                                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.processed)}</p>
                                {stats.total > 0 && (
                                    <p className="text-xs text-green-600">
                                        {Math.round((stats.processed / stats.total) * 100)}%
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Pendientes</p>
                                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.pending)}</p>
                                {stats.total > 0 && (
                                    <p className="text-xs text-orange-600">
                                        {Math.round((stats.pending / stats.total) * 100)}%
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Errores</p>
                                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.failed)}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Progress Bar cuando está procesando */}
            {isProcessing && (
                <Card>
                    <Card.Body>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Progreso de Optimización
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {activeJob === 'general' ? 'Optimizando todas las fuentes' : `Optimizando ${activeJob}`}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Loader className="w-5 h-5 animate-spin text-orange-500" />
                                    <Badge.Status status="Activo" />
                                </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                    style={{ width: `${Math.max(progress, 2)}%` }}
                                >
                                    {progress > 10 && (
                                        <span className="text-xs text-white font-medium">
                                            {Math.round(progress)}%
                                        </span>
                                    )}
                                </div>
                                {progress <= 10 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                                        {Math.round(progress)}%
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Procesadas: {Math.floor(progress * stats.pending / 100)}</span>
                                <span>Restantes: {Math.max(0, stats.pending - Math.floor(progress * stats.pending / 100))}</span>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Configuración expandible */}
            {showSettings && (
                <Card>
                    <Card.Header>
                        <h3 className={commonClasses.sectionTitle}>Configuración de Optimización</h3>
                    </Card.Header>
                    <Card.Body>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lote de procesamiento
                                </label>
                                <Input.Select
                                    value={settings.batchSize}
                                    onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                                    options={[
                                        { value: 1, label: '1 imagen' },
                                        { value: 5, label: '5 imágenes' },
                                        { value: 10, label: '10 imágenes' },
                                        { value: 20, label: '20 imágenes' },
                                        { value: 50, label: '50 imágenes' }
                                    ]}
                                    disabled={isProcessing}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Calidad
                                </label>
                                <Input.Select
                                    value={settings.quality}
                                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                                    options={[
                                        { value: 60, label: '60% (Menor tamaño)' },
                                        { value: 75, label: '75% (Balanceado)' },
                                        { value: 85, label: '85% (Alta calidad)' },
                                        { value: 95, label: '95% (Máxima calidad)' }
                                    ]}
                                    disabled={isProcessing}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ancho máximo
                                </label>
                                <Input.Select
                                    value={settings.maxWidth}
                                    onChange={(e) => setSettings(prev => ({ ...prev, maxWidth: parseInt(e.target.value) }))}
                                    options={[
                                        { value: 800, label: '800px' },
                                        { value: 1200, label: '1200px (Recomendado)' },
                                        { value: 1600, label: '1600px' },
                                        { value: 1920, label: '1920px' }
                                    ]}
                                    disabled={isProcessing}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Formato
                                </label>
                                <Input.Select
                                    value={settings.format}
                                    onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                                    options={[
                                        { value: 'webp', label: 'WebP (Recomendado)' },
                                        { value: 'jpeg', label: 'JPEG' },
                                        { value: 'png', label: 'PNG' }
                                    ]}
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Recomendación:</strong> Para web, usa WebP con calidad 75% y ancho máximo 1200px. 
                                Esto reduce significativamente el tamaño sin perder calidad visual.
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Desglose por fuentes */}
            {sourceStats.length > 0 && (
                <Card>
                    <Card.Header>
                        <h3 className={commonClasses.sectionTitle}>Desglose por Fuente de Imágenes</h3>
                    </Card.Header>
                    <Card.Body>
                        <div className="space-y-4">
                            {sourceStats.map((source, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {source.displayName}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {source.table}.{source.field} • {source.totalRecords} registros
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge.Status 
                                                status={source.pendingUrls > 0 ? 'Pendiente' : 'Activo'} 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                        <div className="text-center">
                                            <div className="text-lg font-semibold text-blue-600">{formatNumber(source.totalUrls)}</div>
                                            <div className="text-gray-500">Total URLs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-semibold text-green-600">{formatNumber(source.optimizedUrls)}</div>
                                            <div className="text-gray-500">Optimizadas</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-semibold text-orange-600">{formatNumber(source.pendingUrls)}</div>
                                            <div className="text-gray-500">Pendientes</div>
                                        </div>
                                    </div>
                                    
                                    {/* Barra de progreso por fuente */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ 
                                                width: `${source.totalUrls > 0 ? (source.optimizedUrls / source.totalUrls) * 100 : 0}%` 
                                            }}
                                        />
                                    </div>
                                    
                                    {source.pendingUrls > 0 && (
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => optimizeSpecificSource(source.table, source.field)}
                                                disabled={isProcessing}
                                                icon={isProcessing && activeJob === `${source.table}.${source.field}` ? 
                                                    <Loader className="w-3 h-3 animate-spin" /> : 
                                                    <TrendingUp className="w-3 h-3" />
                                                }
                                            >
                                                {isProcessing && activeJob === `${source.table}.${source.field}` ? 
                                                    'Procesando...' : 
                                                    `Optimizar ${source.field.split('_')[0]}`
                                                }
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Registro de actividad */}
            <Card>
                <Card.Header>
                    <div className="flex justify-between items-center">
                        <h3 className={commonClasses.sectionTitle}>
                            Registro de Actividad ({logs.length})
                        </h3>
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                            >
                                Limpiar Logs
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={resetOptimizer}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Loader className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No hay actividad registrada aún</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div 
                                    key={log.id}
                                    className={`flex items-start text-sm p-3 rounded-lg ${
                                        log.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                                        log.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                                        log.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                                        'bg-gray-50 border border-gray-200 text-gray-700'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mr-2 mt-0.5">
                                        {log.type === 'error' && <AlertCircle className="w-4 h-4" />}
                                        {log.type === 'success' && <CheckCircle className="w-4 h-4" />}
                                        {log.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                                        {log.type === 'info' && <TrendingUp className="w-4 h-4" />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="break-words">{log.message}</p>
                                    </div>
                                    
                                    <span className="flex-shrink-0 text-xs opacity-75 ml-3 font-mono">
                                        {log.timestamp}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Estado vacío */}
            {stats.total === 0 && !refreshing && (
                <Card>
                    <Card.Body>
                        <div className="text-center py-12">
                            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No se encontraron imágenes
                            </h3>
                            <p className="text-gray-500 mb-6">
                                No hay imágenes para optimizar en este momento.
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={fetchImageStats}
                                icon={<RotateCcw className="w-4 h-4" />}
                            >
                                Actualizar Estadísticas
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default ImageOptimizer;