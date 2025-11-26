import React, { useState } from 'react';
import { UserPlus, CheckCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { Button, Card, Badge, Input, Table, commonClasses } from './ui';

const CRMContacts = () => {
    const [contacts, setContacts] = useState([
        { id: 1, name: 'María González', email: 'maria@email.com', phone: '809-555-0123', status: 'Activo', lastContact: '2024-06-08' },
        { id: 2, name: 'Juan Pérez', email: 'juan@email.com', phone: '809-555-0124', status: 'Pendiente', lastContact: '2024-06-07' },
        { id: 3, name: 'Ana Rodríguez', email: 'ana@email.com', phone: '809-555-0125', status: 'Activo', lastContact: '2024-06-06' },
        { id: 4, name: 'Carlos Martínez', email: 'carlos@email.com', phone: '809-555-0126', status: 'Inactivo', lastContact: '2024-06-05' },
        { id: 5, name: 'Laura Fernández', email: 'laura@email.com', phone: '809-555-0127', status: 'Activo', lastContact: '2024-06-04' }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);

    // Filtrar contactos
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             contact.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || contact.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Manejar selección de contactos
    const handleSelectAll = (checked) => {
        setSelectedContacts(checked ? filteredContacts.map(c => c.id) : []);
    };

    const handleSelectContact = (contactId, checked) => {
        if (checked) {
            setSelectedContacts([...selectedContacts, contactId]);
        } else {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        }
    };

    // Acciones
    const handleContactAction = (action, contactId) => {
        console.log(`Acción ${action} para contacto ${contactId}`);
    };

    const handleBulkAction = (action) => {
        console.log(`Acción ${action} para contactos:`, selectedContacts);
    };

    // Stats calculadas
    const stats = {
        total: contacts.length,
        active: contacts.filter(c => c.status === 'Activo').length,
        pending: contacts.filter(c => c.status === 'Pendiente').length,
        inactive: contacts.filter(c => c.status === 'Inactivo').length
    };

    return (
        <div className={commonClasses.pageContainer}>
            {/* Header con acciones */}
            <div className={commonClasses.sectionHeader}>
                <div>
                    <h2 className={commonClasses.pageTitle}>Gestión de Contactos</h2>
                    <p className={commonClasses.pageSubtitle}>Administra tu base de datos de clientes</p>
                </div>
                <Button 
                    variant="primary" 
                    icon={<UserPlus className="w-4 h-4" />}
                    onClick={() => handleContactAction('create')}
                >
                    Nuevo Contacto
                </Button>
            </div>

            {/* Stats rápidas */}
            <div className={commonClasses.statsGrid}>
                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <UserPlus className="w-8 h-8 text-blue-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total Contactos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Activos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card variant="default" hover>
                    <Card.Body>
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-yellow-500" />
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
                            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Inactivos</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Filtros y búsqueda */}
            <Card>
                <Card.Body>
                    <div className={commonClasses.filtersRow}>
                        <div className="flex flex-1 space-x-4">
                            <Input.Search 
                                placeholder="Buscar contactos por nombre o email..."
                                value={searchTerm}
                                onSearch={setSearchTerm}
                                className="flex-1"
                            />
                            <Input.Select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[
                                    { value: '', label: 'Todos los estados' },
                                    { value: 'Activo', label: 'Activo' },
                                    { value: 'Pendiente', label: 'Pendiente' },
                                    { value: 'Inactivo', label: 'Inactivo' }
                                ]}
                            />
                        </div>
                        <div className="flex space-x-2">
                            {selectedContacts.length > 0 && (
                                <>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleBulkAction('activate')}
                                    >
                                        Activar ({selectedContacts.length})
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleBulkAction('delete')}
                                    >
                                        Eliminar ({selectedContacts.length})
                                    </Button>
                                </>
                            )}
                            <Button variant="secondary">
                                Exportar
                            </Button>
                            <Button variant="outline">
                                Importar
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Tabla de contactos */}
            <Card>
                <Card.Header>
                    <h3 className={commonClasses.sectionTitle}>
                        Lista de Contactos ({filteredContacts.length})
                    </h3>
                </Card.Header>
                
                <Table>
                    <Table.Head>
                        <Table.Tr>
                            <Table.Th>
                                <input 
                                    type="checkbox" 
                                    className="rounded"
                                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </Table.Th>
                            <Table.Th sortable>Nombre</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Teléfono</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Último Contacto</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Head>
                    
                    <Table.Body hoverable>
                        {filteredContacts.map((contact) => (
                            <Table.Tr 
                                key={contact.id}
                                selected={selectedContacts.includes(contact.id)}
                            >
                                <Table.CheckboxCell 
                                    checked={selectedContacts.includes(contact.id)}
                                    onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                                />
                                
                                <Table.AvatarCell 
                                    name={contact.name} 
                                />
                                
                                <Table.Td>{contact.email}</Table.Td>
                                <Table.Td>{contact.phone}</Table.Td>
                                
                                <Table.Td>
                                    <Badge.Status status={contact.status} />
                                </Table.Td>
                                
                                <Table.Td>{contact.lastContact}</Table.Td>
                                
                                <Table.ActionsCell 
                                    actions={[
                                        {
                                            icon: <Eye className="w-4 h-4" />,
                                            onClick: () => handleContactAction('view', contact.id),
                                            title: 'Ver detalles',
                                            className: 'text-gray-400 hover:text-blue-600'
                                        },
                                        {
                                            icon: <Edit className="w-4 h-4" />,
                                            onClick: () => handleContactAction('edit', contact.id),
                                            title: 'Editar contacto',
                                            className: 'text-gray-400 hover:text-orange-600'
                                        },
                                        {
                                            icon: <Trash2 className="w-4 h-4" />,
                                            onClick: () => handleContactAction('delete', contact.id),
                                            title: 'Eliminar contacto',
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
                        Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredContacts.length}</span> de <span className="font-medium">{contacts.length}</span> resultados
                    </div>
                    <div className={commonClasses.paginationButtons}>
                        <Button variant="secondary" size="sm">Anterior</Button>
                        <Button variant="primary" size="sm">1</Button>
                        <Button variant="secondary" size="sm">Siguiente</Button>
                    </div>
                </Table.Footer>
            </Card>

            {/* Mostrar mensaje si no hay resultados */}
            {filteredContacts.length === 0 && (
                <Card>
                    <Card.Body>
                        <div className="text-center py-8">
                            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron contactos</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || filterStatus ? 
                                    'Prueba ajustando los filtros de búsqueda.' : 
                                    'Comienza agregando tu primer contacto.'
                                }
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={() => handleContactAction('create')}
                            >
                                Crear Primer Contacto
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default CRMContacts;