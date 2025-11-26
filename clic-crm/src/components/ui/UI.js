import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import Input from './Input';
import Table from './Table';

// Componente de demostración de todos los UI components
const UIGuide = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo
  const sampleData = [
    { id: 1, name: 'María González', email: 'maria@email.com', status: 'Activo', priority: 'Alta', type: 'Compra' },
    { id: 2, name: 'Juan Pérez', email: 'juan@email.com', status: 'Pendiente', priority: 'Media', type: 'Alquiler' },
    { id: 3, name: 'Ana Rodríguez', email: 'ana@email.com', status: 'Inactivo', priority: 'Baja', type: 'Compra' }
  ];

  const handleAction = (action, id) => {
    console.log(`${action} ejecutado para ID: ${id}`);
    if (action === 'loading') {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CLIC CRM - UI Components Guide</h1>
        <p className="text-gray-600">Guía de todos los componentes UI base del sistema</p>
      </div>

      {/* Buttons Section */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Buttons</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="success">Success Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button icon={<UserPlus className="w-4 h-4" />}>With Icon</Button>
              <Button loading={loading} onClick={() => handleAction('loading')}>
                {loading ? 'Loading...' : 'Click to Load'}
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Cards Section */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Cards</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <Card.Body>
                <h3 className="font-semibold">Default Card</h3>
                <p className="text-gray-600">Tarjeta estándar del sistema</p>
              </Card.Body>
            </Card>
            
            <Card variant="highlighted" hover>
              <Card.Body>
                <h3 className="font-semibold">Highlighted Card</h3>
                <p className="text-gray-600">Tarjeta destacada con efecto hover</p>
              </Card.Body>
            </Card>
            
            <Card variant="success">
              <Card.Body>
                <h3 className="font-semibold">Success Card</h3>
                <p className="text-gray-600">Tarjeta de estado exitoso</p>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>

      {/* Badges Section */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Badges</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="primary">Primary</Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge.Status status="Activo" />
              <Badge.Status status="Pendiente" />
              <Badge.Status status="Inactivo" />
              <Badge.Status status="En Proceso" />
              <Badge.Status status="Cerrado" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge.Priority priority="Alta" />
              <Badge.Priority priority="Media" />
              <Badge.Priority priority="Baja" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge.Type type="Compra" />
              <Badge.Type type="Alquiler" />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Inputs Section */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Form Inputs</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Nombre completo"
                placeholder="Ingresa tu nombre"
                icon={<UserPlus className="w-4 h-4" />}
              />
              
              <Input.Search 
                placeholder="Buscar contactos..."
                onSearch={setSearchTerm}
              />
              
              <Input 
                label="Email"
                type="email"
                placeholder="tu@email.com"
                success="Email válido"
              />
              
              <Input 
                label="Contraseña"
                type="password"
                error="La contraseña debe tener al menos 6 caracteres"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input.Select 
                label="Estado"
                options={[
                  { value: '', label: 'Seleccionar estado' },
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo' }
                ]}
              />
              
              <Input.Textarea 
                label="Observaciones"
                placeholder="Escribe tus observaciones aquí..."
                rows={3}
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Table Section */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Data Table</h2>
        </Card.Header>
        <div className="overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Tr>
                <Table.Th>
                  <input type="checkbox" className="rounded" />
                </Table.Th>
                <Table.Th sortable sorted="asc">Nombre</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Prioridad</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Head>
            <Table.Body hoverable>
              {sampleData.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.CheckboxCell />
                  <Table.AvatarCell name={item.name} email={item.email} />
                  <Table.Td>{item.email}</Table.Td>
                  <Table.Td>
                    <Badge.Status status={item.status} />
                  </Table.Td>
                  <Table.Td>
                    <Badge.Priority priority={item.priority} />
                  </Table.Td>
                  <Table.Td>
                    <Badge.Type type={item.type} />
                  </Table.Td>
                  <Table.ActionsCell 
                    actions={[
                      {
                        icon: <Eye className="w-4 h-4" />,
                        onClick: () => handleAction('view', item.id),
                        title: 'Ver detalles',
                        className: 'text-gray-400 hover:text-blue-600'
                      },
                      {
                        icon: <Edit className="w-4 h-4" />,
                        onClick: () => handleAction('edit', item.id),
                        title: 'Editar',
                        className: 'text-gray-400 hover:text-orange-600'
                      },
                      {
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => handleAction('delete', item.id),
                        title: 'Eliminar',
                        className: 'text-gray-400 hover:text-red-600'
                      }
                    ]}
                  />
                </Table.Tr>
              ))}
            </Table.Body>
          </Table>
          
          <Table.Footer>
            <div className="text-sm text-gray-500">
              Mostrando 1 a 3 de 3 resultados
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm">Anterior</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="secondary" size="sm">Siguiente</Button>
            </div>
          </Table.Footer>
        </div>
      </Card>

      {/* Code Example */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Ejemplo de Uso</h2>
        </Card.Header>
        <Card.Body>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Importar componentes
import { Button, Card, Badge, Input, Table } from '../ui';

// Usar en tu módulo
<Card>
  <Card.Header>
    <h3>Mi Módulo</h3>
  </Card.Header>
  <Card.Body>
    <Button variant="primary">Acción Principal</Button>
    <Badge.Status status="Activo" />
  </Card.Body>
</Card>`}
          </pre>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UIGuide;