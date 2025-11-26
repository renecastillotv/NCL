import React, { useState } from 'react';
import {
    FileText, Upload, Link, Download, AlertCircle, CheckCircle, 
    Clock, Search, X, Copy, RefreshCw, FileSpreadsheet,
    Image, FileX
} from 'lucide-react';

// Componentes UI (mantienen igual)
const Button = ({ children, variant = 'primary', size = 'md', disabled, onClick, icon, className = '' }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300'
    };
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        {children}
    </div>
);

Card.Body = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
);

const Badge = ({ children, variant = 'primary', size = 'md' }) => {
    const variantClasses = {
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-100 text-gray-800'
    };
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm'
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
            {children}
        </span>
    );
};

const Disponibilidad = () => {
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('url'); // 'url' o 'file'

    // URL de la Edge Function
    const EDGE_FUNCTION_URL = 'https://pacewqgypevfgjmdsorz.supabase.co/functions/v1/disponibilidad';

    const resetState = () => {
        setResult(null);
        setError(null);
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            resetState();
        }
    };

    const getFileType = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'pdf';
            case 'csv':
                return 'csv';
            case 'xlsx':
            case 'xls':
                return 'excel';
            case 'docx':
            case 'doc':
                return 'document';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return 'image';
            default:
                return 'unknown';
        }
    };

    // FUNCIÓN CORREGIDA - Manejo diferente para URL vs Archivo
    const processFile = async () => {
        if (!url && !file) {
            setError('Por favor, proporciona una URL o selecciona un archivo');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let response;

            if (mode === 'url' && url) {
                // Para URLs - enviar JSON como antes (esto funciona)
                console.log('Enviando URL a Edge Function...', { url: url.trim() });
                
                response = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs',
                    },
                    body: JSON.stringify({ url: url.trim() })
                });

            } else if (mode === 'file' && file) {
                // Para archivos - enviar FormData (CORREGIDO)
                console.log('Enviando archivo a Edge Function...', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });

                // Crear FormData con el archivo
                const formData = new FormData();
                formData.append('file', file); // Nombre del campo debe ser 'file'

                response = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        // NO incluir Content-Type para FormData - el browser lo agrega automáticamente
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhY2V3cWd5cGV2ZmdqbWRzb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NjU4OTksImV4cCI6MjA2NDI0MTg5OX0.Qlg-UVy-sikr76GxYmTcfCz1EnAqPHxvFeLrdqnjuWs',
                    },
                    body: formData // Enviar FormData directamente
                });
            }

            console.log('Respuesta HTTP:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}\n${errorText}`);
            }

            const data = await response.json();
            console.log('Respuesta exitosa:', data);
            setResult(data);

            if (!data.success) {
                setError(data.error || 'Error procesando el archivo');
            }

        } catch (err) {
            console.error('Error completo:', err);
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (result) {
            try {
                await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                console.log('Copiado al portapapeles');
            } catch (err) {
                console.error('Error copiando:', err);
            }
        }
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />;
            case 'csv':
            case 'excel':
                return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
            case 'image':
                return <Image className="w-5 h-5 text-purple-500" />;
            case 'document':
                return <FileText className="w-5 h-5 text-blue-500" />;
            default:
                return <FileX className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusIcon = () => {
        if (loading) return <Clock className="w-5 h-5 text-blue-500" />;
        if (error) return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (result?.success) return <CheckCircle className="w-5 h-5 text-green-500" />;
        return null;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Extractor de Disponibilidad
                </h1>
                <p className="text-gray-600">
                    Procesa archivos PDF, Excel, CSV y más para extraer información de disponibilidad
                </p>
            </div>

            {/* Selector de modo */}
            <Card>
                <Card.Body>
                    <div className="flex items-center justify-center space-x-4 mb-6">
                        <Button
                            variant={mode === 'url' ? 'primary' : 'outline'}
                            onClick={() => {
                                setMode('url');
                                resetState();
                            }}
                            icon={<Link className="w-4 h-4" />}
                        >
                            URL
                        </Button>
                        <Button
                            variant={mode === 'file' ? 'primary' : 'outline'}
                            onClick={() => {
                                setMode('file');
                                resetState();
                            }}
                            icon={<Upload className="w-4 h-4" />}
                        >
                            Archivo
                        </Button>
                    </div>

                    {/* Input por URL */}
                    {mode === 'url' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL del archivo
                                </label>
                                <div className="flex space-x-2">
                                    <Input
                                        value={url}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            resetState();
                                        }}
                                        placeholder="https://example.com/archivo.pdf"
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={processFile}
                                        disabled={loading || !url.trim()}
                                        icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    >
                                        {loading ? 'Procesando...' : 'Procesar'}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Soporta: Google Drive, Dropbox, URLs directas
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Input por archivo */}
                    {mode === 'file' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleccionar archivo
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.csv,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <Button
                                        onClick={processFile}
                                        disabled={loading || !file}
                                        icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    >
                                        {loading ? 'Procesando...' : 'Procesar'}
                                    </Button>
                                </div>
                                {file && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                                        {getFileIcon(getFileType(file))}
                                        <span>{file.name}</span>
                                        <Badge variant="info" size="sm">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Badge>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Formatos: PDF, CSV, Excel, Word, Imágenes (Para OCR: solo PDF e imágenes)
                                </p>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Estado y resultado */}
            <Card>
                <Card.Body>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">Resultado</h3>
                            {getStatusIcon()}
                        </div>
                        {result && (
                            <div className="flex items-center space-x-2">
                                <Badge 
                                    variant={result.success ? 'success' : 'error'}
                                    size="sm"
                                >
                                    {result.success ? 'Éxito' : 'Error'}
                                </Badge>
                                {result.type && (
                                    <Badge variant="info" size="sm">
                                        {result.type.toUpperCase()}
                                    </Badge>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    icon={<Copy className="w-4 h-4" />}
                                >
                                    Copiar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                            <div className="flex">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                            <div className="flex items-center">
                                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Procesando archivo... Esto puede tomar unos momentos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resultado JSON */}
                    {result && (
                        <div className="space-y-4">
                            {/* Resumen rápido si es exitoso */}
                            {result.success && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-900 mb-2">Resumen</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        {result.size && (
                                            <div>
                                                <span className="text-green-700">Tamaño:</span>
                                                <span className="ml-1 font-medium">
                                                    {(result.size / 1024 / 1024).toFixed(2)} MB
                                                </span>
                                            </div>
                                        )}
                                        {result.type && (
                                            <div>
                                                <span className="text-green-700">Tipo:</span>
                                                <span className="ml-1 font-medium">{result.type.toUpperCase()}</span>
                                            </div>
                                        )}
                                        {result.filename && (
                                            <div>
                                                <span className="text-green-700">Archivo:</span>
                                                <span className="ml-1 font-medium">{result.filename}</span>
                                            </div>
                                        )}
                                        {/* Para OCR */}
                                        {result.ocrSpaceRawResponse?.ParsedResults?.[0]?.ParsedText && (
                                            <div className="col-span-full">
                                                <span className="text-green-700">Texto extraído:</span>
                                                <span className="ml-1 font-medium">
                                                    {result.ocrSpaceRawResponse.ParsedResults[0].ParsedText.length} caracteres
                                                </span>
                                            </div>
                                        )}
                                        {/* Para Excel/CSV */}
                                        {result.content?.totalRows && (
                                            <div>
                                                <span className="text-green-700">Filas:</span>
                                                <span className="ml-1 font-medium">{result.content.totalRows}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* JSON completo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Respuesta JSON completa
                                </label>
                                <textarea
                                    value={JSON.stringify(result, null, 2)}
                                    readOnly
                                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Estado inicial */}
                    {!result && !error && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>Selecciona un archivo o URL para comenzar</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Disponibilidad;