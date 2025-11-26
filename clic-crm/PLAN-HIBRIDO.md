# Plan Híbrido: Migración Gradual a Edge Functions

## 🎯 Estrategia

**Usar CRM v2 con queries directas AHORA, migrar a edge functions módulo por módulo DESPUÉS**

## ✅ Lo Que Ya Funciona en v2

1. **Login + Auth** - Queries directas a `users`, `user_roles`, `roles`
2. **Dashboard** - Muestra perfil, roles, scope
3. **Propiedades** - Lista desde tabla `properties` directo
4. **Arquitectura limpia** - 40 archivos vs 73

## 🔄 Migración Gradual (Sin Romper Nada)

### Fase 1: Mantener Queries Directas (HOY)
```javascript
// PropertiesPage.js - FUNCIONA AHORA
const { data } = await supabase
  .from('properties')
  .select('*')
  .order('created_at', { ascending: false });
```

### Fase 2: Probar Edge Function en Paralelo (DESPUÉS)
```javascript
// Agregar opción de toggle
const USE_EDGE_FUNCTION = false; // Toggle manual

if (USE_EDGE_FUNCTION) {
  // Usar edge function
  const { data } = await api.properties.list();
} else {
  // Usar query directa (fallback)
  const { data } = await supabase.from('properties').select('*');
}
```

### Fase 3: Migrar Módulo por Módulo
1. ✅ Properties - Arreglamos edge function, probamos, migramos
2. ✅ Contacts - Mismo proceso
3. ✅ Deals - Mismo proceso
4. etc.

---

## 📊 Comparación: v1 vs v2

| Aspecto | CRM v1 (73 componentes) | CRM v2 (40 archivos) |
|---------|-------------------------|----------------------|
| **Archivos** | 73 componentes | ~40 componentes |
| **Navegación** | State interno (sin URLs) | React Router (con URLs) |
| **Login** | Funciona ✅ | Funciona ✅ |
| **Propiedades** | Funciona ✅ | Funciona ✅ (query directa) |
| **Edge Functions** | No usa | Preparado pero no usa |
| **Modales** | Custom por módulo | **FALTA** crear reutilizables |
| **Formularios** | Custom por módulo | **FALTA** crear reutilizables |

---

## 🎯 Plan de Acción Recomendado

### AHORA (Próximas 2 horas)

**1. Completar v2 con Queries Directas**
- ✅ Properties (ya funciona)
- ➕ Crear componentes reutilizables:
  - `Modal.js` - Modal genérico
  - `Form.js` - Formulario genérico
  - `Table.js` - Tabla con paginación
  - `FilterBar.js` - Barra de filtros

**2. Agregar Módulo de Contactos (query directa)**
- Lista de contactos
- Crear/editar con modal reutilizable
- Eliminar con confirmación

**3. Tener un CRM v2 100% FUNCIONAL sin edge functions**

### DESPUÉS (Cuando tengas tiempo)

**4. Arreglar Edge Functions una por una**
- Deploy `crm-manager` completo
- Probar cada handler en Postman
- Verificar que funcionan
- Documentar

**5. Migrar Módulo por Módulo**
- Properties: de query directa → edge function
- Contacts: de query directa → edge function
- etc.

---

## 💡 Ventajas del Enfoque Híbrido

### ✅ Corto Plazo
- Tienes CRM funcionando YA
- Menos componentes que mantener (40 vs 73)
- URLs compartibles con React Router
- Componentes reutilizables (modales, forms, tables)

### ✅ Largo Plazo
- Edge functions listas para cuando las necesites
- Migración gradual sin romper nada
- Puedes probar edge function vs query directa
- Toggle para A/B testing

---

## 🔧 Componentes Reutilizables a Crear

### 1. Modal Genérico
```javascript
// src/components/ui/Modal.js
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Crear Propiedad"
>
  <PropertyForm onSubmit={handleSubmit} />
</Modal>
```

### 2. Formulario Genérico
```javascript
// src/components/ui/Form.js
<Form
  fields={[
    { name: 'title', type: 'text', label: 'Título', required: true },
    { name: 'price', type: 'number', label: 'Precio' },
    { name: 'description', type: 'textarea', label: 'Descripción' }
  ]}
  onSubmit={handleSubmit}
  submitLabel="Guardar"
/>
```

### 3. Tabla con Paginación
```javascript
// src/components/ui/Table.js
<Table
  columns={['Título', 'Precio', 'Estado', 'Acciones']}
  data={properties}
  onRowClick={handleRowClick}
  pagination={{ page, total, onChange: setPage }}
/>
```

### 4. Confirmación de Eliminación
```javascript
// src/components/ui/ConfirmDialog.js
<ConfirmDialog
  isOpen={showConfirm}
  title="¿Eliminar propiedad?"
  message="Esta acción no se puede deshacer"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## ❓ ¿Qué Prefieres?

### Opción A: SEGUIR con v2 + Queries Directas ✅ RECOMENDADO
**Próximos pasos:**
1. Crear componentes reutilizables (Modal, Form, Table)
2. Agregar módulo de Contactos
3. Agregar módulo de Deals
4. Tener CRM v2 completo funcionando
5. **DESPUÉS** migrar a edge functions cuando tengas tiempo

### Opción B: VOLVER a v1
**Próximos pasos:**
1. Restaurar App.v1-backup.js
2. Seguir con los 73 componentes
3. Mejorar lo que ya tienes

### Opción C: PARAR TODO y arreglar edge functions
**Próximos pasos:**
1. Revisar handlers de crm-manager
2. Probar en Postman cada uno
3. Arreglar bugs
4. Deploy
5. Usar edge functions desde el inicio

---

## 🎯 Mi Recomendación Final

**OPCIÓN A** - Continuar v2 con queries directas y componentes reutilizables:

**¿Por qué?**
1. Ya tienes login funcionando
2. Ya tienes propiedades mostrándose
3. Solo falta crear los reutilizables (Modal, Form, Table)
4. En 2-3 horas tienes un CRM v2 limpio y funcional
5. Luego migras a edge functions cuando quieras

**Edge functions NO son urgentes** - Son una optimización. Lo urgente es tener un CRM con menos archivos, más mantenible, y con componentes reutilizables.

---

**¿Seguimos con v2 + queries directas + componentes reutilizables?**
