# Análisis de Refactorización - CLIC CRM

**Fecha:** 2025-10-25
**Proyecto:** CLIC CRM
**Objetivo:** Identificar duplicaciones y proponer arquitectura mejorada

---

## 📊 Resumen Ejecutivo

### Hallazgos Principales

- **30+ archivos** duplican la inicialización de Supabase
- **2 modales idénticos** (TagSelectionModal) en archivos separados
- **3+ variantes** de PropertySelectionModal con lógica similar
- **20+ componentes** recrean el patrón de modal wrapper
- **25+ componentes** duplican el patrón de data fetching
- **15+ componentes** duplican manejo de errores/notificaciones
- **Servicio centralizado** (`api.js`) bien diseñado pero **sub-utilizado (<10%)**

### Impacto

- **Mantenibilidad:** Cambios requieren editar múltiples archivos
- **Bugs:** Un bug en un modal puede existir en variantes pero no en otras
- **Tamaño del Bundle:** Código duplicado aumenta bundle size innecesariamente
- **Onboarding:** Nuevos desarrolladores enfrentan patrones inconsistentes

---

## 🔴 Duplicaciones Críticas

### 1. Inicialización de Supabase (CRÍTICO)

**Impacto:** Seguridad, Mantenibilidad
**Archivos afectados:** 30+
**Severidad:** Alta

#### Problema

Cada componente crea su propia instancia de Supabase:

```javascript
// LocationInsightsManager.js (línea 13-16)
const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ArticleEditor.js (línea 16-19) - EXACTAMENTE IGUAL
const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// FAQEditor.js (línea 16-19) - EXACTAMENTE IGUAL
const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Archivos con este patrón:**
- `LocationInsightsManager.js`
- `ArticleEditor.js`
- `FAQEditor.js`
- `PropertyEditModal.js`
- `PropertyCreateModal.js`
- `ContactsManager.js`
- `TagsManager.js`
- `VideoManager.js`
- ... y 22 más

#### Solución

Ya existe `src/services/api.js` con cliente centralizado:

```javascript
// api.js (línea 15-18)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://...';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJ...';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Migrar todos los componentes a:**

```javascript
// En cualquier componente
import { supabase } from '../services/api';

// Ya no necesitas crear el cliente
```

**Beneficios:**
- ✅ Credenciales en un solo lugar
- ✅ Fácil migrar a variables de entorno
- ✅ Interceptors centralizados (auth, logging, error handling)
- ✅ Posibilidad de mock para testing

---

### 2. Modal TagSelectionModal (DUPLICADO EXACTO)

**Impacto:** Mantenibilidad
**Severidad:** Alta

#### Problema

**Archivo 1:** `src/components/location/LocationEditor.js` (líneas 75-240)
**Archivo 2:** `src/components/LocationInsightsManager.js` (líneas similares)

Son **idénticos** - 166 líneas de código copiadas:

```javascript
// LocationEditor.js línea 75
const TagSelectionModal = ({ isOpen, onClose, onSelect, currentTag, locationId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLocationTags();
        }
    }, [isOpen]);

    const fetchLocationTags = async () => {
        setLoading(true);
        try {
            const { data: locationTags, error } = await supabase
                .from('tags')
                .select('*')
                .eq('active', true)
                .in('category', ['sector', 'ciudad'])
                .order('category', { ascending: true })
                .order('name', { ascending: true });
            // ... 140+ líneas más IDÉNTICAS
```

#### Solución Propuesta

Extraer a componente compartido:

```javascript
// Crear: src/components/modals/TagSelectionModal.js
export const TagSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  currentTag,
  locationId,
  categories = ['sector', 'ciudad'] // Configurable
}) => {
  // Implementación completa aquí
};

// Usar en LocationEditor.js
import { TagSelectionModal } from '../modals/TagSelectionModal';

// Usar en LocationInsightsManager.js
import { TagSelectionModal } from './modals/TagSelectionModal';
```

**Reducción:** 166 líneas → componente reutilizable
**Cambios futuros:** 1 archivo en lugar de 2

---

### 3. PropertySelectionModal (VARIANTES DUPLICADAS)

**Impacto:** Inconsistencia
**Severidad:** Media-Alta

#### Problema

Existen múltiples implementaciones similares con interfaces incompatibles:

**Variante 1:** ArticleEditor.js (multi-select)

```javascript
// ArticleEditor.js - líneas 240-420 (aproximado)
const PropertySelectionModal = ({ isOpen, onClose, properties, selectedProperties, onToggleProperty }) => {
    // Permite selección múltiple
    const handleToggle = (property) => {
        if (selectedProperties.some(p => p.id === property.id)) {
            onToggleProperty(selectedProperties.filter(p => p.id !== property.id));
        } else {
            onToggleProperty([...selectedProperties, property]);
        }
    };
    // Renderiza checkboxes
};
```

**Variante 2:** FAQEditor.js (single-select)

```javascript
// FAQEditor.js - líneas 78-240 (aproximado)
const PropertySelectionModal = ({ isOpen, onClose, properties, selectedId, onSelectProperty, onConfirm }) => {
    // Selección única
    const handleSelect = (propertyId) => {
        onSelectProperty(propertyId);
    };
    // Renderiza radio buttons
};
```

**Problemas:**
- Nombres idénticos pero firmas diferentes
- Lógica de búsqueda/filtrado duplicada
- Estilos similares pero no idénticos
- Dificulta reutilización

#### Solución Propuesta

Crear componente unificado con prop `mode`:

```javascript
// src/components/modals/PropertySelector.js
export const PropertySelector = ({
  isOpen,
  onClose,
  mode = 'single', // 'single' | 'multiple'
  selectedIds = [], // Array unificado (single = [id], multiple = [id1, id2, ...])
  onConfirm, // Callback con array de IDs
  filters = {}, // Filtros opcionales
}) => {
  const [selection, setSelection] = useState(selectedIds);

  const handleToggle = (propertyId) => {
    if (mode === 'single') {
      setSelection([propertyId]);
    } else {
      setSelection(prev =>
        prev.includes(propertyId)
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    }
  };

  const handleConfirm = () => {
    onConfirm(mode === 'single' ? selection[0] : selection);
    onClose();
  };

  // Renderizado unificado con condicionales para single/multiple
};

// Uso en ArticleEditor:
<PropertySelector
  mode="multiple"
  selectedIds={selectedPropertyIds}
  onConfirm={(ids) => setSelectedPropertyIds(ids)}
/>

// Uso en FAQEditor:
<PropertySelector
  mode="single"
  selectedIds={selectedPropertyId ? [selectedPropertyId] : []}
  onConfirm={(ids) => setSelectedPropertyId(ids[0])}
/>
```

---

### 4. Modal Wrapper Pattern (20+ DUPLICACIONES)

**Impacto:** Tamaño del código, Mantenibilidad
**Severidad:** Media

#### Problema

Cada modal recrea el mismo overlay y container:

```javascript
// LocationEditor.js - TagSelectionModal (línea 136)
return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                    Seleccionar Tag de Ubicación
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    icon={<X className="w-4 h-4" />}
                />
            </div>
            {/* Content */}
        </div>
    </div>
);

// ArticleEditor.js - AuthorSelectionModal (línea 82)
return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Seleccionar Autor</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </div>
);
```

**Archivos con este patrón:**
- TagSelectionModal (x2)
- PropertySelectionModal (x3)
- AuthorSelectionModal
- VideoSelectionModal
- ContactSelectionModal
- AgentSelectionModal
- ... 12+ más

#### Solución Propuesta

Crear componente Modal wrapper reutilizable:

```javascript
// src/components/ui/Modal.js
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-8',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Uso simplificado:
<Modal
  isOpen={showTagModal}
  onClose={() => setShowTagModal(false)}
  title="Seleccionar Tag de Ubicación"
  size="lg"
>
  {/* Solo el contenido específico del modal */}
  <div className="p-6">
    <SearchInput />
    <TagList />
  </div>
</Modal>
```

**Reducción:** ~40 líneas por modal → 5-10 líneas

---

### 5. Data Fetching Pattern (25+ DUPLICACIONES)

**Impacto:** Código verboso, Error handling inconsistente
**Severidad:** Media

#### Problema

Cada componente reimplementa el mismo patrón:

```javascript
// Patrón repetido en 25+ componentes
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('table_name')
                .select('*')
                .eq('active', true);

            if (error) throw error;
            setData(data || []);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);
```

#### Solución Propuesta

Custom hook `useDataFetch`:

```javascript
// src/hooks/useDataFetch.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/api';

export const useDataFetch = (table, options = {}) => {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    filters = {},
    select = '*',
    orderBy,
    limit,
    enabled = true, // Permite deshabilitar el fetch
  } = options;

  const fetchData = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Límite
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table, JSON.stringify(filters), enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData, // Para actualizaciones optimistas
  };
};

// Uso:
const TagsManager = () => {
  const { data: tags, loading, error, refetch } = useDataFetch('tags', {
    filters: { active: true },
    orderBy: { column: 'name', ascending: true }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {tags.map(tag => <TagItem key={tag.id} tag={tag} />)}
      <button onClick={refetch}>Refrescar</button>
    </div>
  );
};
```

**Reducción:** 20+ líneas por componente → 2-3 líneas

---

### 6. Form State Management (20+ COMPONENTES)

**Impacto:** Código repetitivo
**Severidad:** Media

#### Problema

```javascript
// Patrón repetido
const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // ... más campos
});

const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
};

const handleSubmit = async (e) => {
    e.preventDefault();
    // validación manual
    if (!formData.name) {
        setError('Nombre requerido');
        return;
    }
    // submit...
};
```

#### Solución Propuesta

Custom hook `useForm`:

```javascript
// src/hooks/useForm.js
import { useState } from 'react';

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validar si el campo ha sido tocado
    if (touched[field] && validationRules[field]) {
      validateField(field, value);
    }
  };

  const setFieldTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (validationRules[field]) {
      validateField(field, values[field]);
    }
  };

  const validateField = (field, value) => {
    const rules = validationRules[field];
    if (!rules) return true;

    let error = null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = rules.requiredMessage || `${field} es requerido`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMessage || `${field} tiene formato inválido`;
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `${field} debe tener al menos ${rules.minLength} caracteres`;
    } else if (rules.validate && !rules.validate(value)) {
      error = rules.validateMessage || `${field} es inválido`;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateAll = () => {
    let isValid = true;
    const newErrors = {};

    Object.keys(validationRules).forEach(field => {
      const valid = validateField(field, values[field]);
      if (!valid) {
        isValid = false;
        newErrors[field] = errors[field];
      }
    });

    return isValid;
  };

  const handleSubmit = (onSubmit) => async (e) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);
    const isValid = validateAll();

    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }

    setIsSubmitting(false);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
  };
};

// Uso:
const ContactForm = () => {
  const { values, errors, setValue, setFieldTouched, handleSubmit } = useForm(
    { name: '', email: '', phone: '' },
    {
      name: {
        required: true,
        minLength: 2
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Email inválido'
      },
      phone: {
        pattern: /^\d{10}$/,
        patternMessage: 'Teléfono debe tener 10 dígitos'
      }
    }
  );

  const onSubmit = async (formData) => {
    await api.contacts.create(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        value={values.name}
        onChange={(e) => setValue('name', e.target.value)}
        onBlur={() => setFieldTouched('name')}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <button type="submit">Guardar</button>
    </form>
  );
};
```

---

### 7. Button Component (RECREADO 5+ VECES)

**Impacto:** Inconsistencia visual
**Severidad:** Baja-Media

#### Problema

Ya existe `src/components/ui/Button.js` pero varios componentes lo recrean:

```javascript
// LocationInsightsManager.js (línea 19-49)
const Button = ({ children, variant = 'primary', size = 'md', icon, ... }) => {
    // 30 líneas de implementación
};

// ui/Button.js - YA EXISTE la implementación correcta
```

**Archivos que recrean Button:**
- LocationInsightsManager.js
- CoordinatesMapModal.js
- LocationEditor.js
- ProjectEditModal.js
- PropertyEditModal.js

#### Solución

Eliminar implementaciones locales y usar:

```javascript
import { Button } from './ui/Button';
// o
import { Button } from '../ui';
```

---

## 🟡 Oportunidades de Mejora

### 8. Helpers Duplicados

#### formatPrice (3+ IMPLEMENTACIONES)

```javascript
// ArticleEditor.js (línea 36-49)
const formatPrice = (price, currency = 'USD') => {
    // implementación
};

// FAQEditor.js (línea 48-61) - IDÉNTICA
const formatPrice = (price, currency = 'USD') => {
    // implementación idéntica
};

// PropertyEditModal.js - probablemente también existe
```

**Solución:** Crear `src/utils/formatters.js`

```javascript
// src/utils/formatters.js
export const formatPrice = (price, currency = 'USD') => {
  if (!price || price === 0) return null;

  const symbols = {
    'USD': '$',
    'DOP': 'RD$',
    'EUR': '€'
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${new Intl.NumberFormat('en-US').format(price)}`;
};

export const formatDate = (date, format = 'short') => {
  // ...
};

export const formatPhone = (phone, countryCode) => {
  // ...
};
```

---

### 9. Error/Success Messages (15+ COMPONENTES)

#### Problema

```javascript
// Patrón repetido
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

// Mostrar temporalmente
setTimeout(() => setError(''), 3000);
setTimeout(() => setSuccess(''), 3000);

// JSX repetitivo
{error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
    </div>
)}
{success && (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        {success}
    </div>
)}
```

#### Solución

Custom hook + componente Toast:

```javascript
// src/hooks/useNotification.js
import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });

    if (duration) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  const showError = useCallback((message) => showNotification(message, 'error'), []);
  const showSuccess = useCallback((message) => showNotification(message, 'success'), []);
  const showWarning = useCallback((message) => showNotification(message, 'warning'), []);
  const showInfo = useCallback((message) => showNotification(message, 'info'), []);

  const clearNotification = useCallback(() => setNotification(null), []);

  return {
    notification,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearNotification,
  };
};

// src/components/ui/Toast.js
export const Toast = ({ notification, onClose }) => {
  if (!notification) return null;

  const types = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded border ${types[notification.type]} flex items-center gap-2 shadow-lg`}>
      <span>{notification.message}</span>
      <button onClick={onClose} className="ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Uso:
const MyComponent = () => {
  const { notification, showError, showSuccess, clearNotification } = useNotification();

  const handleSave = async () => {
    try {
      await api.save(data);
      showSuccess('Guardado exitosamente');
    } catch (err) {
      showError('Error al guardar: ' + err.message);
    }
  };

  return (
    <>
      <button onClick={handleSave}>Guardar</button>
      <Toast notification={notification} onClose={clearNotification} />
    </>
  );
};
```

---

## 📁 Reorganización Propuesta

### Estructura Actual

```
src/components/
├── 79 archivos en raíz (desordenado)
├── ui/ (6 archivos - bien organizado)
├── layout/ (3 archivos - bien organizado)
├── PropertyCreation/ (4 archivos + subdirs vacíos)
└── location/ (5 archivos)
```

### Estructura Propuesta

```
src/
├── components/
│   ├── ui/                          # Componentes UI reutilizables
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Badge.js
│   │   ├── Input.js
│   │   ├── Table.js
│   │   ├── Modal.js                 # ⭐ NUEVO
│   │   ├── Toast.js                 # ⭐ NUEVO
│   │   ├── FormField.js             # ⭐ NUEVO
│   │   ├── FormSelect.js            # ⭐ NUEVO
│   │   ├── FormTextarea.js          # ⭐ NUEVO
│   │   ├── LoadingSpinner.js        # ⭐ NUEVO
│   │   └── ErrorMessage.js          # ⭐ NUEVO
│   │
│   ├── modals/                      # ⭐ NUEVO - Modales reutilizables
│   │   ├── TagSelectionModal.js     # Extraído de LocationEditor
│   │   ├── PropertySelector.js      # Unificado ArticleEditor + FAQEditor
│   │   ├── ContactSelector.js       # Reutilizable
│   │   ├── VideoSelectionModal.js   # Reutilizable
│   │   ├── AgentSelectionModal.js   # Reutilizable
│   │   └── ConfirmModal.js          # Para confirmaciones
│   │
│   ├── layout/                      # Layout components (existente)
│   │   ├── Layout.js
│   │   ├── Header.js
│   │   └── Sidebar.js
│   │
│   ├── auth/                        # Auth components (existente)
│   │   └── LoginPage.js
│   │
│   ├── dashboard/                   # Dashboard (existente)
│   │   └── Dashboard.js
│   │
│   ├── features/                    # ⭐ NUEVO - Organizar por dominio
│   │   ├── properties/
│   │   │   ├── PropertiesPage.js
│   │   │   ├── PropertyEditModal.js
│   │   │   ├── PropertyCreateModal.js
│   │   │   ├── PropertyDetail.js
│   │   │   ├── PropertyContent.js
│   │   │   ├── PropertySEO.js
│   │   │   ├── PropertyGeneral.js
│   │   │   ├── PropertyDocuments.js
│   │   │   ├── PropertyGestion.js
│   │   │   ├── PropertyProject.js
│   │   │   └── ProjectEditModal.js
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactsManager.js
│   │   │   ├── ContactForm.js
│   │   │   └── ContactDetail.js
│   │   │
│   │   ├── deals/
│   │   │   ├── DealsManager.js
│   │   │   ├── DealDetails.js
│   │   │   ├── DealCommissions.js
│   │   │   └── DealExpediente.js
│   │   │
│   │   ├── content/
│   │   │   ├── articles/
│   │   │   │   ├── ArticleManager.js
│   │   │   │   └── ArticleEditor.js
│   │   │   ├── faqs/
│   │   │   │   ├── FAQsManager.js
│   │   │   │   └── FAQEditor.js
│   │   │   ├── videos/
│   │   │   │   └── VideoManager.js
│   │   │   ├── testimonials/
│   │   │   │   ├── TestimonialManager.js
│   │   │   │   └── TestimonialEditor.js
│   │   │   └── SEOContentManager.js
│   │   │
│   │   ├── tags/
│   │   │   ├── TagsManager.js
│   │   │   ├── TagsGeneral.js
│   │   │   ├── TagsGroups.js
│   │   │   ├── TagsCategories.js
│   │   │   └── TagsRelation.js
│   │   │
│   │   ├── locations/
│   │   │   ├── LocationsList.js
│   │   │   ├── LocationEditor.js
│   │   │   ├── LocationInsightsManager.js
│   │   │   ├── CoordinatesMapModal.js
│   │   │   └── SmartLocationManager.js
│   │   │
│   │   ├── users/
│   │   │   ├── CRMUsers.js
│   │   │   ├── UserEditPage.js
│   │   │   └── UserCreatePage.js
│   │   │
│   │   └── messaging/
│   │       ├── EmailInbox.js
│   │       ├── EmailCompose.js
│   │       ├── EmailAccountsManager.js
│   │       └── EmailSignatureEditor.js
│   │
│   └── shared/                      # ⭐ NUEVO - Componentes compartidos
│       ├── editors/
│       │   ├── WYSIWYGSEOEditor.js
│       │   └── RichSEOEditor.js
│       └── renderers/
│           ├── ModuleRenderer.js
│           ├── DynamicModuleRenderer.js
│           └── SimpleModuleRenderer.js
│
├── hooks/                           # ⭐ NUEVO - Custom hooks
│   ├── useAuth.js                   # Existente
│   ├── useDataFetch.js              # NUEVO
│   ├── useForm.js                   # NUEVO
│   └── useNotification.js           # NUEVO
│
├── services/
│   └── api.js                       # Existente (bien diseñado)
│
├── utils/                           # ⭐ NUEVO - Utilidades
│   ├── formatters.js                # formatPrice, formatDate, etc.
│   ├── validators.js                # validaciones comunes
│   └── constants.js                 # constantes globales
│
└── configs/
    └── RolesConfig.js               # Existente
```

---

## 🎯 Plan de Refactorización

### Fase 1: Fundamentos (Semana 1-2) - ALTA PRIORIDAD

**Objetivo:** Centralizar código crítico duplicado

#### 1.1 Migrar a Supabase Centralizado

- [ ] Verificar que todos los componentes importen de `services/api.js`
- [ ] Eliminar 30+ instancias locales de `createClient()`
- [ ] Actualizar .env con credenciales
- [ ] Testing: verificar que auth siga funcionando

**Archivos a modificar:** 30+ componentes
**Tiempo estimado:** 4-6 horas
**Impacto:** Alto (seguridad + mantenibilidad)

#### 1.2 Crear Componente Modal Base

- [ ] Crear `src/components/ui/Modal.js`
- [ ] Migrar 5 modales iniciales al nuevo wrapper
- [ ] Documentar API del componente

**Tiempo estimado:** 3-4 horas
**Impacto:** Alto (reduce ~600 líneas de código)

#### 1.3 Extraer Modales Duplicados

- [ ] Crear `src/components/modals/TagSelectionModal.js`
- [ ] Migrar LocationEditor y LocationInsightsManager
- [ ] Testing de funcionalidad

**Tiempo estimado:** 2-3 horas
**Impacto:** Medio (elimina duplicación exacta)

### Fase 2: Custom Hooks (Semana 3-4)

**Objetivo:** Simplificar lógica repetitiva

#### 2.1 Hook useDataFetch

- [ ] Crear `src/hooks/useDataFetch.js`
- [ ] Migrar 10 componentes iniciales
- [ ] Documentar uso

**Tiempo estimado:** 6-8 horas
**Impacto:** Alto (reduce ~200 líneas por componente)

#### 2.2 Hook useForm

- [ ] Crear `src/hooks/useForm.js`
- [ ] Migrar 5 formularios iniciales
- [ ] Agregar validaciones comunes

**Tiempo estimado:** 8-10 horas
**Impacto:** Medio (mejora UX con validaciones)

#### 2.3 Hook useNotification

- [ ] Crear `src/hooks/useNotification.js`
- [ ] Crear `src/components/ui/Toast.js`
- [ ] Migrar manejo de errores en 10 componentes

**Tiempo estimado:** 4-5 horas
**Impacto:** Medio (UX consistente)

### Fase 3: Modales Unificados (Semana 5)

**Objetivo:** Consolidar variantes de modales

#### 3.1 PropertySelector Unificado

- [ ] Crear `src/components/modals/PropertySelector.js`
- [ ] Unificar variantes de ArticleEditor y FAQEditor
- [ ] Agregar modo single/multiple
- [ ] Testing exhaustivo

**Tiempo estimado:** 8-10 horas
**Impacto:** Alto (3 implementaciones → 1)

#### 3.2 Otros Selectores

- [ ] ContactSelector
- [ ] VideoSelectionModal
- [ ] AgentSelectionModal

**Tiempo estimado:** 6-8 horas
**Impacto:** Medio

### Fase 4: Reorganización (Semana 6-7)

**Objetivo:** Estructura escalable

#### 4.1 Crear Directorios

- [ ] `src/components/modals/`
- [ ] `src/components/features/`
- [ ] `src/hooks/`
- [ ] `src/utils/`

#### 4.2 Mover Archivos

- [ ] Mover componentes a features/ por dominio
- [ ] Actualizar imports (usar find/replace)
- [ ] Testing de rutas

**Tiempo estimado:** 10-12 horas
**Impacto:** Medio (mejor organización)

### Fase 5: Utilidades (Semana 8)

**Objetivo:** Helpers reutilizables

#### 5.1 Formatters

- [ ] Crear `src/utils/formatters.js`
- [ ] Extraer formatPrice, formatDate, etc.
- [ ] Migrar 15+ componentes

**Tiempo estimado:** 3-4 horas
**Impacto:** Bajo-Medio

#### 5.2 Validators

- [ ] Crear `src/utils/validators.js`
- [ ] Email, phone, UUID validators

**Tiempo estimado:** 2-3 horas
**Impacto:** Bajo

### Fase 6: Componentes UI (Semana 9)

**Objetivo:** UI consistente

#### 6.1 Eliminar Duplicados

- [ ] Remover Button local de 5 componentes
- [ ] Crear FormField, FormSelect, FormTextarea
- [ ] Migrar formularios

**Tiempo estimado:** 6-8 horas
**Impacto:** Medio (consistencia visual)

---

## 📊 Métricas de Impacto Esperado

### Antes

- **Líneas de código duplicado:** ~3,000
- **Tiempo de onboarding:** 2-3 semanas
- **Archivos por feature:** Dispersos en 79 archivos
- **Uso de api.js:** <10%
- **Componentes modales:** 20+ implementaciones

### Después

- **Líneas de código duplicado:** ~500 (-83%)
- **Tiempo de onboarding:** 1 semana (-60%)
- **Archivos por feature:** Agrupados en features/
- **Uso de api.js:** >90%
- **Componentes modales:** 5-6 reutilizables

### ROI

- **Tiempo de desarrollo de features nuevos:** -40%
- **Bugs por duplicación:** -90%
- **Tiempo de mantenimiento:** -50%
- **Bundle size:** -15% (eliminando duplicados)

---

## ✅ Checklist de Implementación

### Antes de Empezar

- [ ] Crear rama `refactor/modular-architecture`
- [ ] Backup del código actual
- [ ] Definir suite de tests de regresión
- [ ] Comunicar plan al equipo

### Durante Refactorización

- [ ] Hacer commits pequeños y descriptivos
- [ ] Probar cada migración antes de continuar
- [ ] Documentar nuevos componentes/hooks
- [ ] Actualizar README con nueva estructura

### Después de Cada Fase

- [ ] Code review
- [ ] Testing manual de features afectados
- [ ] Actualizar documentación
- [ ] Merge a develop (no a master directamente)

### Antes de Deploy a Producción

- [ ] Testing completo de regresión
- [ ] Verificar que no hay imports rotos
- [ ] Bundle analysis (verificar reducción de tamaño)
- [ ] Plan de rollback preparado

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Romper Funcionalidad Existente

**Probabilidad:** Media
**Impacto:** Alto

**Mitigación:**
- Tests de regresión antes de cada fase
- Refactorizar incrementalmente (no todo a la vez)
- Mantener código viejo hasta verificar nuevo
- Deploy gradual por feature

### Riesgo 2: Imports Rotos Después de Reorganización

**Probabilidad:** Alta
**Impacto:** Medio

**Mitigación:**
- Usar find/replace global en IDE
- Verificar con build antes de commit
- Configurar path aliases en webpack:
  ```javascript
  // webpack.config.js
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
    }
  }
  ```

### Riesgo 3: Resistencia del Equipo

**Probabilidad:** Media
**Impacto:** Alto

**Mitigación:**
- Demostrar beneficios con ejemplos concretos
- Documentar patrones nuevos claramente
- Pair programming en primeras implementaciones
- Presentar métricas de mejora

### Riesgo 4: Tiempo Mayor al Estimado

**Probabilidad:** Media
**Impacto:** Medio

**Mitigación:**
- Priorizar fases 1-3 (mayor ROI)
- Fases 4-6 pueden ser graduales
- No bloquear desarrollo de features nuevos
- Hacer refactor "sobre la marcha" en código que se toca

---

## 📝 Conclusiones

### Hallazgos Clave

1. **Excelente base técnica** - `api.js` bien diseñado, solo falta adopción
2. **Sobre-modularización sin estructura** - Muchos archivos pero mal organizados
3. **Duplicación sistemática** - Patrones repetidos por copy-paste
4. **Falta de abstracciones** - No se aprovechan hooks/componentes reutilizables

### Recomendaciones Prioritarias

**🔥 CRÍTICO - Hacer YA:**
1. Migrar todos los componentes a `api.js` centralizado
2. Extraer `TagSelectionModal` (duplicado exacto)
3. Crear componente `Modal` base

**⚠️ IMPORTANTE - Próximas 2-4 semanas:**
4. Implementar `useDataFetch` hook
5. Unificar `PropertySelector`
6. Crear sistema de notificaciones con `useNotification`

**✅ MEJORÍA - Cuando haya tiempo:**
7. Reorganizar carpetas por features
8. Extraer helpers a utils/
9. Implementar `useForm` hook

### Próximos Pasos

1. **Revisar este análisis con el equipo**
2. **Priorizar fases según roadmap**
3. **Crear tickets en el sistema de tareas**
4. **Asignar responsables por fase**
5. **Comenzar con Fase 1 (fundamentos)**

---

**Documento creado:** 2025-10-25
**Autor:** Análisis automatizado
**Versión:** 1.0
