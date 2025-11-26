import React, { useState, useEffect } from 'react';
import { Upload, Eye, CheckCircle2, Circle, RefreshCw, X, Download, FileText, Image } from 'lucide-react';



import { supabase } from '../services/api';

const Button = ({ children, variant = 'primary', size = 'sm', icon, className = '', disabled = false, onClick, title, ...props }) => {
    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 border border-orange-600',
        secondary: 'bg-gray-700 text-white hover:bg-gray-800 border border-gray-700',
        outline: 'border border-gray-400 text-gray-700 bg-white hover:bg-gray-50',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    };

    const sizes = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm'
    };

    return (
        <button
            className={`inline-flex items-center justify-center font-medium rounded transition-colors ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
            title={title}
            {...props}
        >
            {icon && <span className="mr-1">{icon}</span>}
            {children}
        </button>
    );
};

const CompactExpediente = ({ dealId, deal }) => {
    const [requerimientos, setRequerimientos] = useState([]);
    const [itemsSubidos, setItemsSubidos] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState({});
    const [error, setError] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFile, setViewerFile] = useState(null);

    useEffect(() => {
        if (dealId && deal) {
            loadData();
        }
    }, [dealId, deal]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Determinar categoría
            const tipoOperacion = deal?.operation_type?.name?.toLowerCase() || 'venta';
            const categoria = tipoOperacion.includes('alquiler') || tipoOperacion.includes('renta') ?
                'cierre_alquiler' : 'cierre_venta';

            // 1. Obtener todos los requerimientos de la categoría
            const { data: reqData, error: reqError } = await supabase
                .from('deals_expediente_requerimientos')
                .select('*')
                .eq('categoria', categoria)
                .eq('activo', true)
                .order('orden_visualizacion');

            if (reqError) throw reqError;

            // 2. Obtener items ya subidos para este deal
            const { data: itemsData, error: itemsError } = await supabase
                .from('deal_expediente_items')
                .select('*')
                .eq('deal_id', dealId);

            if (itemsError) throw itemsError;

            // 3. Crear mapa de items subidos por requerimiento_id
            const itemsMap = {};
            (itemsData || []).forEach(item => {
                if (item.requerimiento_id) {
                    itemsMap[item.requerimiento_id] = item;
                }
            });

            setRequerimientos(reqData || []);
            setItemsSubidos(itemsMap);

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            setError('Error al cargar datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const uploadDocument = async (requerimiento, file) => {
        try {
            setUploading({ ...uploading, [requerimiento.id]: true });
            setError(null);

            // Validar archivo
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error('Archivo demasiado grande. Máximo 10MB.');
            }

            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const allowedTypes = requerimiento.tipos_archivo_permitidos || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

            if (!allowedTypes.includes(fileExt)) {
                throw new Error(`Tipo de archivo no permitido. Use: ${allowedTypes.join(', ')}`);
            }

            // Generar nombre de archivo
            const timestamp = Date.now();
            const cleanTitle = requerimiento.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const fileName = `${cleanTitle}_${timestamp}.${fileExt}`;
            const filePath = `deals/${dealId}/expediente/${fileName}`;

            // STEP 1: Subir a bucket
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('expediente-documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error('Error subiendo archivo al bucket: ' + uploadError.message);
            }

            // STEP 2: Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('expediente-documents')
                .getPublicUrl(filePath);

            if (!publicUrl) {
                throw new Error('No se pudo generar URL pública');
            }

            // STEP 3: Preparar datos para BD
            const itemData = {
                deal_id: dealId,
                requerimiento_id: requerimiento.id,
                titulo: requerimiento.titulo,
                descripcion: requerimiento.descripcion,
                categoria: requerimiento.categoria,
                tipo: requerimiento.tipo,
                requiere_documento: requerimiento.requiere_documento,
                es_obligatorio: requerimiento.es_obligatorio,
                estado: 'completado',
                url_documento: publicUrl,
                ruta_documento: filePath,
                tipo_archivo: file.type,
                tamaño_archivo: file.size,
                nombre_documento: file.name,
                fecha_subida_documento: new Date().toISOString(),
                subido_por: 'current_user',
                creado_en: new Date().toISOString()
            };

            // STEP 4: Verificar si ya existe item para este requerimiento
            const existingItem = itemsSubidos[requerimiento.id];

            if (existingItem) {
                // Actualizar existente
                const { data: updateData, error: updateError } = await supabase
                    .from('deal_expediente_items')
                    .update(itemData)
                    .eq('id', existingItem.id)
                    .select();

                if (updateError) {
                    throw new Error('Error actualizando en BD: ' + updateError.message);
                }
            } else {
                // Crear nuevo
                const { data: insertData, error: insertError } = await supabase
                    .from('deal_expediente_items')
                    .insert(itemData)
                    .select();

                if (insertError) {
                    if (insertError.message.includes('row-level security policy')) {
                        throw new Error('Error de permisos: La tabla tiene restricciones de seguridad. Contacta al administrador para desactivar RLS en deal_expediente_items.');
                    }
                    throw new Error('Error creando en BD: ' + insertError.message);
                }
            }

            // STEP 5: Recargar datos
            await loadData();

        } catch (error) {
            console.error('❌ Error completo en uploadDocument:', error);
            setError(error.message);
        } finally {
            setUploading({ ...uploading, [requerimiento.id]: false });
        }
    };

    const downloadFile = async (url, fileName) => {
        try {
            setError(null);

            const response = await fetch(url);
            const blob = await response.blob();

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('❌ Error descargando archivo:', error);
            setError('Error al descargar archivo: ' + error.message);
        }
    };

    const viewFile = (item, requerimiento) => {
        setViewerFile({
            url: item.url,
            name: item.nombre_documento || requerimiento.titulo,
            type: item.tipo_archivo || 'application/pdf',
            fecha: item.fecha,
            titulo: requerimiento.titulo
        });
        setViewerOpen(true);
    };

    const closeViewer = () => {
        setViewerOpen(false);
        setViewerFile(null);
    };

    const getFileIcon = (fileName, fileType) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || fileType?.startsWith('image/')) {
            return <Image className="w-4 h-4" />;
        }
        return <FileText className="w-4 h-4" />;
    };

    const isImageFile = (fileName, fileType) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext) || fileType?.startsWith('image/');
    };

    const isPDFFile = (fileName, fileType) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        return ext === 'pdf' || fileType === 'application/pdf';
    };

    const handleFileSelect = (requerimiento, event) => {
        const file = event.target.files[0];
        if (file) {
            uploadDocument(requerimiento, file);
        }
        event.target.value = '';
    };

    const getEstadoItem = (requerimiento) => {
        const item = itemsSubidos[requerimiento.id];
        if (!item) return { estado: 'pendiente', texto: 'Sin subir', color: 'text-gray-500' };

        if (item.url_documento) {
            return {
                estado: 'completado',
                texto: 'Subido',
                color: 'text-green-600',
                fecha: item.fecha_subida_documento ? new Date(item.fecha_subida_documento).toLocaleDateString() : '',
                url: item.url_documento,
                nombre_documento: item.nombre_documento,
                tipo_archivo: item.tipo_archivo
            };
        }

        return { estado: 'pendiente', texto: 'Pendiente', color: 'text-yellow-600' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando expediente...</p>
                </div>
            </div>
        );
    }

    const completados = requerimientos.filter(req => itemsSubidos[req.id]?.url_documento).length;
    const obligatorios = requerimientos.filter(req => req.es_obligatorio);
    const obligatoriosCompletos = obligatorios.filter(req => itemsSubidos[req.id]?.url_documento).length;

    return (
        <div className="space-y-4">
            {/* Header ultra-compacto */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Expediente de Cierre</h2>
                        <p className="text-xs text-gray-500">
                            {completados}/{requerimientos.length} documentos • {obligatoriosCompletos}/{obligatorios.length} obligatorios
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadData}
                        icon={<RefreshCw className="w-4 h-4" />}
                        disabled={loading}
                        size="xs"
                    >
                        Actualizar
                    </Button>
                </div>

                {/* Progreso compacto en una sola línea */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 w-16">General</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(completados / requerimientos.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{Math.round((completados / requerimientos.length) * 100)}%</span>
                    </div>

                    {obligatorios.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 w-16">Obligat.</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${obligatoriosCompletos === obligatorios.length ? 'bg-green-500' : 'bg-amber-500'}`}
                                    style={{ width: `${(obligatoriosCompletos / obligatorios.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{Math.round((obligatoriosCompletos / obligatorios.length) * 100)}%</span>
                        </div>
                    )}
                </div>

                {/* Estado compacto */}
                {obligatorios.length > 0 && (
                    <div className={`mt-3 px-3 py-2 rounded border-l-4 text-sm ${obligatoriosCompletos === obligatorios.length ?
                        'border-green-500 bg-green-50 text-green-800' : 'border-amber-500 bg-amber-50 text-amber-800'
                        }`}>
                        {obligatoriosCompletos === obligatorios.length ?
                            '✅ Expediente Completo - Comisión Liberada' :
                            `⏳ Faltan ${obligatorios.length - obligatoriosCompletos} documentos obligatorios`
                        }
                    </div>
                )}
            </div>

            {/* Error compacto */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <p className="text-red-800 text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Lista ultra-compacta de requerimientos */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900">Documentos Requeridos</h3>
                </div>

                <div className="divide-y divide-gray-200">
                    {requerimientos.map((req) => {
                        const estado = getEstadoItem(req);
                        const isUploading = uploading[req.id];

                        return (
                            <div key={req.id} className="px-4 py-3 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                        {/* Estado visual compacto */}
                                        <div className="flex-shrink-0">
                                            {estado.estado === 'completado' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Contenido ultra-compacto */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{req.titulo}</h4>
                                                {req.es_obligatorio && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                                        Obligatorio
                                                    </span>
                                                )}
                                                <span className={`text-xs ${estado.color}`}>{estado.texto}</span>
                                                {estado.fecha && (
                                                    <span className="text-xs text-gray-400">• {estado.fecha}</span>
                                                )}
                                            </div>

                                            {/* Descripción solo si es corta */}
                                            {req.descripcion && req.descripcion.length < 80 && (
                                                <p className="text-xs text-gray-600 truncate">{req.descripcion}</p>
                                            )}

                                            {/* Instrucciones compactas */}
                                            {req.instrucciones && req.instrucciones.length < 60 && (
                                                <p className="text-xs text-blue-600 italic truncate">{req.instrucciones}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acciones compactas */}
                                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                                        {estado.url && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    onClick={() => viewFile(estado, req)}
                                                    icon={<Eye className="w-3 h-3" />}
                                                    title="Ver archivo"
                                                />

                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    onClick={() => downloadFile(estado.url, estado.nombre_documento || `${req.titulo}.pdf`)}
                                                    icon={<Download className="w-3 h-3" />}
                                                    title="Descargar archivo"
                                                />
                                            </>
                                        )}

                                        <input
                                            type="file"
                                            id={`upload-${req.id}`}
                                            className="hidden"
                                            accept={req.tipos_archivo_permitidos?.map(t => `.${t}`).join(',') || '.pdf,.jpg,.jpeg,.png,.doc,.docx'}
                                            onChange={(e) => handleFileSelect(req, e)}
                                            disabled={isUploading}
                                        />

                                        <Button
                                            variant={estado.estado === 'completado' ? 'outline' : 'primary'}
                                            size="xs"
                                            onClick={() => document.getElementById(`upload-${req.id}`).click()}
                                            disabled={isUploading}
                                            icon={isUploading ?
                                                <RefreshCw className="w-3 h-3 animate-spin" /> :
                                                <Upload className="w-3 h-3" />
                                            }
                                        >
                                            {isUploading ? 'Subiendo...' : (estado.estado === 'completado' ? 'Actualizar' : 'Subir')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {requerimientos.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No hay requerimientos configurados para este tipo de operación.</p>
                </div>
            )}

            {/* Visor de archivos modal - Sin cambios */}
            {viewerOpen && viewerFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col">
                        {/* Header del visor */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                {getFileIcon(viewerFile.name, viewerFile.type)}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{viewerFile.titulo}</h3>
                                    <p className="text-sm text-gray-600">{viewerFile.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(viewerFile.url, viewerFile.name)}
                                    icon={<Download className="w-4 h-4" />}
                                >
                                    Descargar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(viewerFile.url, '_blank')}
                                    icon={<Eye className="w-4 h-4" />}
                                >
                                    Abrir en nueva pestaña
                                </Button>
                                <button
                                    onClick={closeViewer}
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Contenido del visor */}
                        <div className="flex-1 overflow-hidden">
                            {isImageFile(viewerFile.name, viewerFile.type) ? (
                                <div className="flex items-center justify-center h-full p-4">
                                    <img
                                        src={viewerFile.url}
                                        alt={viewerFile.titulo}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div className="hidden text-center text-gray-500">
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        <p>No se puede mostrar la imagen</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(viewerFile.url, '_blank')}
                                            className="mt-2"
                                        >
                                            Abrir en nueva pestaña
                                        </Button>
                                    </div>
                                </div>
                            ) : isPDFFile(viewerFile.name, viewerFile.type) ? (
                                <div className="w-full h-full">
                                    <iframe
                                        src={viewerFile.url}
                                        className="w-full h-full border-0"
                                        title={viewerFile.titulo}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center p-4">
                                    <div>
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">Vista previa no disponible</h4>
                                        <p className="text-gray-600 mb-4">
                                            Este tipo de archivo no se puede visualizar directamente.
                                        </p>
                                        <div className="space-x-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => downloadFile(viewerFile.url, viewerFile.name)}
                                                icon={<Download className="w-4 h-4" />}
                                            >
                                                Descargar Archivo
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open(viewerFile.url, '_blank')}
                                                icon={<Eye className="w-4 h-4" />}
                                            >
                                                Abrir en nueva pestaña
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer con info del archivo */}
                        {viewerFile.fecha && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 flex-shrink-0">
                                Subido el {viewerFile.fecha}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompactExpediente;