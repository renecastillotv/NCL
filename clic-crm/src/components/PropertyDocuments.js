import React, { useState } from 'react';
import {
    FileText, Upload, Download, Eye, Edit, Trash2, Plus, 
    Image, Film, File, Archive, Shield, Calendar, User
} from 'lucide-react';
import { Button, Card, Badge } from './ui';

const PropertyDocuments = ({ propertyId, property }) => {
    const [activeCategory, setActiveCategory] = useState('all');

    // Mock data - en la implementación real vendría de la base de datos
    const documents = [
        {
            id: 1,
            name: 'Escritura de la Propiedad',
            type: 'legal',
            format: 'pdf',
            size: '2.4 MB',
            uploadedBy: 'María García',
            uploadDate: '2024-01-15',
            category: 'legal',
            status: 'verified'
        },
        {
            id: 2,
            name: 'Certificado de Libertad de Gravamen',
            type: 'legal',
            format: 'pdf',
            size: '1.8 MB',
            uploadedBy: 'Carlos López',
            uploadDate: '2024-01-14',
            category: 'legal',
            status: 'verified'
        },
        {
            id: 3,
            name: 'Planos Arquitectónicos',
            type: 'technical',
            format: 'dwg',
            size: '5.2 MB',
            uploadedBy: 'Ana Rodríguez',
            uploadDate: '2024-01-12',
            category: 'technical',
            status: 'pending'
        },
        {
            id: 4,
            name: 'Avalúo Comercial',
            type: 'financial',
            format: 'pdf',
            size: '3.1 MB',
            uploadedBy: 'Juan Pérez',
            uploadDate: '2024-01-10',
            category: 'financial',
            status: 'verified'
        },
        {
            id: 5,
            name: 'Fotos Exteriores',
            type: 'media',
            format: 'zip',
            size: '15.7 MB',
            uploadedBy: 'Pedro Santos',
            uploadDate: '2024-01-08',
            category: 'media',
            status: 'verified'
        },
        {
            id: 6,
            name: 'Video Tour Virtual',
            type: 'media',
            format: 'mp4',
            size: '45.2 MB',
            uploadedBy: 'Laura Martín',
            uploadDate: '2024-01-05',
            category: 'media',
            status: 'verified'
        }
    ];

    const categories = [
        { id: 'all', name: 'Todos', icon: FileText, count: documents.length },
        { id: 'legal', name: 'Legales', icon: Shield, count: documents.filter(d => d.category === 'legal').length },
        { id: 'financial', name: 'Financieros', icon: FileText, count: documents.filter(d => d.category === 'financial').length },
        { id: 'technical', name: 'Técnicos', icon: File, count: documents.filter(d => d.category === 'technical').length },
        { id: 'media', name: 'Multimedia', icon: Image, count: documents.filter(d => d.category === 'media').length }
    ];

    const getFileIcon = (format) => {
        switch (format.toLowerCase()) {
            case 'pdf':
                return <FileText className="w-8 h-8 text-red-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <Image className="w-8 h-8 text-blue-500" />;
            case 'mp4':
            case 'avi':
            case 'mov':
                return <Film className="w-8 h-8 text-purple-500" />;
            case 'zip':
            case 'rar':
                return <Archive className="w-8 h-8 text-orange-500" />;
            case 'dwg':
            case 'dxf':
                return <File className="w-8 h-8 text-green-500" />;
            default:
                return <File className="w-8 h-8 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Sin Estado</Badge>;
        }
    };

    const filteredDocuments = activeCategory === 'all' 
        ? documents 
        : documents.filter(doc => doc.category === activeCategory);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Documentos de la Propiedad</h2>
                    <p className="text-gray-600 mt-1">Gestiona todos los documentos relacionados con esta propiedad</p>
                </div>
                <Button variant="primary" className="bg-orange-600 hover:bg-orange-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                </Button>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex space-x-1 overflow-x-auto">
                    {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                                    activeCategory === category.id
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <IconComponent className="w-4 h-4" />
                                <span className="text-sm font-medium">{category.name}</span>
                                <Badge className="bg-gray-200 text-gray-700 text-xs">
                                    {category.count}
                                </Badge>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((document) => (
                        <Card key={document.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    {getFileIcon(document.format)}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {document.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {document.format.toUpperCase()} • {document.size}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(document.status)}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>Subido por {document.uploadedBy}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(document.uploadDate)}</span>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                    <Download className="w-4 h-4 mr-1" />
                                    Descargar
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No hay documentos en esta categoría
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {activeCategory === 'all' 
                            ? 'Comienza subiendo los documentos de esta propiedad'
                            : `No hay documentos ${categories.find(c => c.id === activeCategory)?.name.toLowerCase()} registrados`
                        }
                    </p>
                    <Button variant="primary" className="bg-orange-600 hover:bg-orange-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Primer Documento
                    </Button>
                </Card>
            )}

            {/* Document Requirements Section */}
            <div className="mt-8">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Requeridos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-sm">Escritura</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Documento legal principal</p>
                            <Badge className="bg-green-100 text-green-800 text-xs">Completado</Badge>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-sm">Libertad de Gravamen</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Certificado actualizado</p>
                            <Badge className="bg-green-100 text-green-800 text-xs">Completado</Badge>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-sm">Avalúo</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Valuación comercial</p>
                            <Badge className="bg-green-100 text-green-800 text-xs">Completado</Badge>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <File className="w-5 h-5 text-yellow-600" />
                                <span className="font-medium text-sm">Planos</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Diseños técnicos</p>
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Upload className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    María García subió "Escritura de la Propiedad"
                                </p>
                                <p className="text-xs text-gray-500">Hace 2 días</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Eye className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Carlos López revisó "Certificado de Libertad de Gravamen"
                                </p>
                                <p className="text-xs text-gray-500">Hace 3 días</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Edit className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Ana Rodríguez actualizó los planos arquitectónicos
                                </p>
                                <p className="text-xs text-gray-500">Hace 1 semana</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Storage Info */}
            <div className="mt-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Almacenamiento</h3>
                        <Button variant="outline" size="sm">
                            Gestionar Espacio
                        </Button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Usado</span>
                                <span className="font-medium">68.5 MB de 500 MB</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '13.7%' }}></div>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                            86%
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                        Espacio disponible restante: 431.5 MB
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default PropertyDocuments;