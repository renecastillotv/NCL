import React, { useState } from 'react';
import { ClipboardList, Clock, TrendingUp, CheckCircle, Filter, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { Button, Card, Badge, Input, Table, commonClasses } from './ui';

const CRMRequests = () => {
    const [requests, setRequests] = useState([
        { 
            id: 1, 
            client: 'María González', 
            property: 'Apartamento Bella Vista', 
            type: 'Compra', 
            status: 'En Proceso', 
            date: '2024-06-08', 
            priority: 'Alta',
            budget: 'RD$ 8,500,000',
            agent: 'Carlos Ruiz'
        },
        { 
            id: 2, 
            client: 'Juan Pérez', 
            property: 'Casa Piantini', 
            type: 'Alquiler', 
            status: 'Pendiente', 
            date: '2024-06-07', 
            priority: 'Media',
            budget: 'RD$ 85,000/mes',
            agent: 'Ana López'
        },
        { 
            id: 3, 
            client: 'Ana Rodríguez', 
            property: 'Penthouse Naco', 
            type: 'Compra', 
            status: 'Cerrado', 
            date: '2024-06-06', 
            priority: 'Alta',
            budget: 'RD$ 15,000,000',
            agent: 'María Santos'
        },
        { 
            id: 4, 
            client: 'Roberto Jiménez', 
            property: 'Local Comercial Zona Colonial', 
            type: 'Alquiler', 
            status: 'En Revisión', 
            date: '2024-06-05', 
            priority: 'Baja',
            budget: 'RD$ 150,000/mes',
            agent: 'Luis García'
        },
        { 
            id: 5, 
            client: 'Carmen Delgado', 
            property: 'Villa La Romana', 
            type: 'Compra', 
            status: 'En Proceso', 
            date: '2024-06-04', 
            priority: 'Media',
            budget: 'RD$ 12,000,000',
            agent: 'David Morales'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Filtrar solicitudes
    const filteredRequests = requests.filter(request => {
        const matchesSearch = request.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             request.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             request.agent.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || request.status === filterStatus;
        const matchesType = !filterType || request.type === filterType;
        const matchesPriority = !filterPriority || request.priority === filterPriority;
        
        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    // Manejar selección
    const handleSelectAll = (checked) => {
        setSelectedRequests(checked ? filteredRequests.map(r => r.id) : []);
    };

    const handleSelectRequest = (requestId, checked) => {
        if (checked) {
            setSelectedRequests([...selectedRequests, requestId]);
        } else {
            setSelectedRequests(selectedRequests.filter(id => id !== requestId));
        }
    };

    // Acciones
    const handleRequestAction = (action, requestId) => {
        console.log(`Acción ${action} para solicitud ${requestId}`);
    };

    const handleBulkAction = (action) => {
        console.log(`Acción ${action} para solicitudes:`, selectedRequests);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('');
        setFilterType('');
        setFilterPriority('');
    };

    // Stats calculadas
    const stats = {
        total: requests.length,
        inProgress: requests.filter(r => r.status === 'En Proceso').length,
        pending: requests.filter(r => r.status === 'Pendiente').length,
        closed: requests.filter(r => r.status === 'Cerrado').length
    };

    return (
        <div className={commonClasses.pageContainer}>
            {/* Header */}
            <div className={commonClasses.sectionHeader}>
                <div>
                    <h2 className={commonClasses.pageTitle}>Solicitudes de Clientes</h2>
                    <p className={commonClasses.pageSubtitle}>Gestiona las solicitudes y requerimientos</p>
                </div>
                <Button 
                    variant="primary" 
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => handleRequestAction('create')}
                >
                    Nueva Solicitud
                </Button>
            </div>

            {/* Stats de solicitudes */}
            <div className={commonClasses.statsGrid}>
                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <ClipboardList className="w-8 h-8 text-blue-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-yellow-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">En Proceso</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
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
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Cerrados</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Filtros y búsqueda */}
            <Card>
                <Card.Body>
                    <div className="space-y-4">
                        {/* Filtros principales */}
                        <div className={commonClasses.filtersRow}>
                            <div className="flex flex-1 space-x-4">
                                <Input.Search 
                                    placeholder="Buscar por cliente, propiedad o agente..."
                                    value={searchTerm}
                                    onSearch={setSearchTerm}
                                    className="flex-1"
                                />
                                <Input.Select 
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    options={[
                                        { value: '', label: 'Todos los estados' },
                                        { value: 'En Proceso', label: 'En Proceso' },
                                        { value: 'Pendiente', label: 'Pendiente' },
                                        { value: 'Cerrado', label: 'Cerrado' },
                                        { value: 'En Revisión', label: 'En Revisión' }
                                    ]}
                                />
                                <Input.Select 
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    options={[
                                        { value: '', label: 'Todos los tipos' },
                                        { value: 'Compra', label: 'Compra' },
                                        { value: 'Alquiler', label: 'Alquiler' }
                                    ]}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <Button 
                                    variant="outline" 
                                    icon={<Filter className="w-4 h-4" />}
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                >
                                    Filtros Avanzados
                                </Button>
                                {(searchTerm || filterStatus || filterType || filterPriority) && (
                                    <Button variant="ghost" onClick={clearFilters}>
                                        Limpiar Filtros
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Filtros avanzados */}
                        {showAdvancedFilters && (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input.Select 
                                        label="Prioridad"
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value)}
                                        options={[
                                            { value: '', label: 'Todas las prioridades' },
                                            { value: 'Alta', label: 'Alta' },
                                            { value: 'Media', label: 'Media' },
                                            { value: 'Baja', label: 'Baja' }
                                        ]}
                                    />
                                    <Input 
                                        label="Rango de fechas (desde)"
                                        type="date"
                                    />
                                    <Input 
                                        label="Rango de fechas (hasta)"
                                        type="date"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Acciones masivas */}
                        {selectedRequests.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        {selectedRequests.length} solicitudes seleccionadas
                                    </span>
                                    <div className="flex space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleBulkAction('changeStatus')}
                                        >
                                            Cambiar Estado
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleBulkAction('assign')}
                                        >
                                            Asignar Agente
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => handleBulkAction('delete')}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Lista de solicitudes */}
            <Card>
                <Card.Header>
                    <div className="flex items-center justify-between">
                        <h3 className={commonClasses.sectionTitle}>
                            Solicitudes ({filteredRequests.length})
                        </h3>
                        <div className="flex space-x-2">
                            <Button variant="secondary" size="sm">
                                Exportar
                            </Button>
                            <Button variant="outline" size="sm">
                                Importar
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                
                <Table>
                    <Table.Head>
                        <Table.Tr>
                            <Table.Th>
                                <input 
                                    type="checkbox" 
                                    className="rounded"
                                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </Table.Th>
                            <Table.Th sortable>Cliente</Table.Th>
                            <Table.Th>Propiedad</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Prioridad</Table.Th>
                            <Table.Th>Presupuesto</Table.Th>
                            <Table.Th>Agente</Table.Th>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Head>
                    
                    <Table.Body hoverable>
                        {filteredRequests.map((request) => (
                            <Table.Tr 
                                key={request.id}
                                selected={selectedRequests.includes(request.id)}
                            >
                                <Table.CheckboxCell 
                                    checked={selectedRequests.includes(request.id)}
                                    onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                                />
                                
                                <Table.AvatarCell name={request.client} />
                                
                                <Table.Td>
                                    <div className="text-sm text-gray-900">{request.property}</div>
                                </Table.Td>
                                
                                <Table.Td>
                                    <Badge.Type type={request.type} />
                                </Table.Td>
                                
                                <Table.Td>
                                    <Badge.Status status={request.status} />
                                </Table.Td>
                                
                                <Table.Td>
                                    <Badge.Priority priority={request.priority} />
                                </Table.Td>
                                
                                <Table.Td>
                                    <div className="text-sm font-medium text-gray-900">{request.budget}</div>
                                </Table.Td>
                                
                                <Table.Td>
                                    <div className="text-sm text-gray-500">{request.agent}</div>
                                </Table.Td>
                                
                                <Table.Td>
                                    <div className="text-sm text-gray-500">{request.date}</div>
                                </Table.Td>
                                
                                <Table.ActionsCell 
                                    actions={[
                                        {
                                            icon: <Eye className="w-4 h-4" />,
                                            onClick: () => handleRequestAction('view', request.id),
                                            title: 'Ver detalles',
                                            className: 'text-gray-400 hover:text-blue-600'
                                        },
                                        {
                                            icon: <Edit className="w-4 h-4" />,
                                            onClick: () => handleRequestAction('edit', request.id),
                                            title: 'Editar solicitud',
                                            className: 'text-gray-400 hover:text-orange-600'
                                        },
                                        {
                                            icon: <Trash2 className="w-4 h-4" />,
                                            onClick: () => handleRequestAction('delete', request.id),
                                            title: 'Eliminar solicitud',
                                            className: 'text-gray-400 hover:text-red-600'
                                        }
                                    ]}
                                />
                            </Table.Tr>
                        ))}
                    </Table.Body>
                </Table>
                
                {/* Paginación */}
                <Table.Footer>
                    <div className={commonClasses.paginationInfo}>
                        Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredRequests.length}</span> de <span className="font-medium">{requests.length}</span> resultados
                    </div>
                    <div className={commonClasses.paginationButtons}>
                        <Button variant="secondary" size="sm">Anterior</Button>
                        <Button variant="primary" size="sm">1</Button>
                        <Button variant="secondary" size="sm">Siguiente</Button>
                    </div>
                </Table.Footer>
            </Card>

            {/* Mensaje cuando no hay resultados */}
            {filteredRequests.length === 0 && (
                <Card>
                    <Card.Body>
                        <div className="text-center py-8">
                            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || filterStatus || filterType ? 
                                    'Prueba ajustando los filtros de búsqueda.' : 
                                    'Comienza creando tu primera solicitud.'
                                }
                            </p>
                            {(searchTerm || filterStatus || filterType) ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpiar Filtros
                                </Button>
                            ) : (
                                <Button 
                                    variant="primary" 
                                    onClick={() => handleRequestAction('create')}
                                >
                                    Crear Primera Solicitud
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default CRMRequests;