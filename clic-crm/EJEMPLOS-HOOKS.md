# Ejemplos de Uso - Custom Hooks

Guía práctica para usar los custom hooks de CLIC CRM

---

## 📦 useDataFetch

Simplifica la carga de datos desde Supabase.

### Ejemplo 1: Lista Simple

**ANTES** (20+ líneas):
```javascript
const TagsManager = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setTags(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <TagsList tags={tags} />;
};
```

**DESPUÉS** (3 líneas):
```javascript
import { useDataFetch } from '../hooks';

const TagsManager = () => {
  const { data: tags, loading, error } = useDataFetch('tags', {
    filters: { active: true },
    orderBy: { column: 'name', ascending: true }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <TagsList tags={tags} />;
};
```

**Reducción: 93% menos código**

---

### Ejemplo 2: Con Refetch

```javascript
const ContactsManager = () => {
  const { data: contacts, loading, refetch } = useDataFetch('contacts', {
    filters: { active: true },
    orderBy: { column: 'created_at', ascending: false },
    limit: 50
  });

  const handleCreate = async (newContact) => {
    await supabase.from('contacts').insert(newContact);
    refetch(); // Recargar lista
  };

  const handleDelete = async (id) => {
    await supabase.from('contacts').delete().eq('id', id);
    refetch(); // Recargar lista
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Nuevo Contacto</Button>
      <ContactsList contacts={contacts} onDelete={handleDelete} />
    </>
  );
};
```

---

### Ejemplo 3: Con Joins y Transformación

```javascript
const PropertiesPage = () => {
  const { data: properties, loading } = useDataFetch('properties', {
    select: 'id, name, sale_price, sale_currency, cities(name), provinces(name)',
    filters: { status: 'active' },
    orderBy: { column: 'created_at', ascending: false },
    transform: (props) => props.map(p => ({
      ...p,
      cityName: p.cities?.name || 'N/A',
      provinceName: p.provinces?.name || 'N/A',
      priceFormatted: formatPrice(p.sale_price, p.sale_currency)
    }))
  });

  return <PropertiesGrid properties={properties} loading={loading} />;
};
```

---

### Ejemplo 4: Fetch Condicional

```javascript
const UserProperties = ({ userId }) => {
  // Solo fetch cuando userId existe
  const { data: properties, loading } = useDataFetch('properties', {
    filters: { user_id: userId },
    enabled: !!userId,  // Solo si userId no es null
    dependencies: [userId]  // Refetch cuando userId cambia
  });

  if (!userId) return <p>Selecciona un usuario</p>;
  if (loading) return <LoadingSpinner />;

  return <PropertiesList properties={properties} />;
};
```

---

### Ejemplo 5: Un Solo Registro

```javascript
import { useDataFetchOne } from '../hooks';

const PropertyDetail = ({ propertyId }) => {
  const { data: property, loading, error, refetch } = useDataFetchOne('properties', propertyId, {
    select: 'id, name, sale_price, description, cities(name), amenities(*)'
  });

  const handleUpdate = async (updates) => {
    await supabase.from('properties').update(updates).eq('id', propertyId);
    refetch(); // Recargar datos actualizados
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!property) return <NotFound />;

  return <PropertyDetails property={property} onUpdate={handleUpdate} />;
};
```

---

## 🔔 useNotification

Sistema de notificaciones toast para feedback al usuario.

### Ejemplo 1: Success/Error Simple

```javascript
import { useNotification } from '../hooks';
import { Toast } from '../ui';

const ContactForm = () => {
  const { notification, showSuccess, showError, clearNotification } = useNotification();

  const handleSave = async () => {
    try {
      await supabase.from('contacts').insert(formData);
      showSuccess('Contacto creado exitosamente');
    } catch (err) {
      showError('Error al crear contacto: ' + err.message);
    }
  };

  return (
    <>
      <form onSubmit={handleSave}>
        {/* Campos del formulario */}
        <Button type="submit">Guardar</Button>
      </form>

      <Toast notification={notification} onClose={clearNotification} />
    </>
  );
};
```

---

### Ejemplo 2: Diferentes Tipos

```javascript
const PropertyActions = () => {
  const { notification, showSuccess, showError, showWarning, showInfo, clearNotification } = useNotification();

  const handlePublish = async () => {
    showInfo('Publicando propiedad...');

    try {
      await publishProperty(id);
      showSuccess('Propiedad publicada exitosamente', 5000); // 5 segundos
    } catch (err) {
      showError('Error al publicar', 0); // No auto-close
    }
  };

  const handleDraft = () => {
    showWarning('La propiedad quedará como borrador');
  };

  return (
    <>
      <Button onClick={handlePublish}>Publicar</Button>
      <Button onClick={handleDraft}>Guardar Borrador</Button>

      <Toast notification={notification} onClose={clearNotification} position="top-center" />
    </>
  );
};
```

---

### Ejemplo 3: Con Posiciones

```javascript
// Top-right (default)
<Toast notification={notification} onClose={clear} position="top-right" />

// Top-center
<Toast notification={notification} onClose={clear} position="top-center" />

// Bottom-right
<Toast notification={notification} onClose={clear} position="bottom-right" />
```

---

## 📝 useForm

Manejo de formularios con validación automática.

### Ejemplo 1: Formulario Básico

**ANTES** (40+ líneas):
```javascript
const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Nombre requerido';
    if (!formData.email) newErrors.email = 'Email requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await supabase.from('contacts').insert(formData);
      alert('Guardado');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      {/* Más campos... */}
    </form>
  );
};
```

**DESPUÉS** (15 líneas):
```javascript
import { useForm } from '../hooks';

const ContactForm = () => {
  const { values, errors, setValue, handleSubmit } = useForm(
    { name: '', email: '', phone: '' },
    {
      name: { required: true },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Email inválido'
      },
      phone: { minLength: 10 }
    }
  );

  const onSubmit = async (formData) => {
    await supabase.from('contacts').insert(formData);
    showSuccess('Contacto creado');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        value={values.name}
        onChange={(e) => setValue('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <input
        type="email"
        value={values.email}
        onChange={(e) => setValue('email', e.target.value)}
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <button type="submit">Guardar</button>
    </form>
  );
};
```

---

### Ejemplo 2: Validaciones Avanzadas

```javascript
const PropertyForm = () => {
  const { values, errors, touched, setValue, setFieldTouched, handleSubmit } = useForm(
    {
      name: '',
      sale_price: 0,
      description: '',
      password: '',
      confirm_password: ''
    },
    {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100
      },
      sale_price: {
        required: true,
        min: 1000,
        minMessage: 'El precio debe ser al menos $1,000'
      },
      description: {
        required: true,
        minLength: 20,
        maxLengthMessage: 'La descripción debe tener al menos 20 caracteres'
      },
      password: {
        required: true,
        minLength: 8,
        validate: (value) => /[A-Z]/.test(value) && /[0-9]/.test(value),
        validateMessage: 'Debe contener mayúscula y número'
      },
      confirm_password: {
        required: true,
        match: 'password',
        matchMessage: 'Las contraseñas no coinciden'
      }
    }
  );

  return (
    <form onSubmit={handleSubmit(async (data) => {
      await supabase.from('properties').insert(data);
    })}>
      <input
        value={values.name}
        onChange={(e) => setValue('name', e.target.value)}
        onBlur={() => setFieldTouched('name')}
      />
      {touched.name && errors.name && <span>{errors.name}</span>}

      {/* Más campos... */}
    </form>
  );
};
```

---

### Ejemplo 3: Reset y Valores Iniciales

```javascript
const EditContactForm = ({ contactId }) => {
  const { data: contact } = useDataFetchOne('contacts', contactId);
  const { values, setValue, reset, handleSubmit } = useForm(
    contact || { name: '', email: '', phone: '' }
  );

  // Resetear cuando carguen los datos
  useEffect(() => {
    if (contact) {
      reset(contact);
    }
  }, [contact, reset]);

  const onSubmit = async (formData) => {
    await supabase.from('contacts').update(formData).eq('id', contactId);
  };

  const handleCancel = () => {
    reset(); // Volver a valores iniciales
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos */}
      <Button type="submit">Guardar</Button>
      <Button type="button" onClick={handleCancel}>Cancelar</Button>
    </form>
  );
};
```

---

## 🔥 Combinando Hooks

Ejemplo real combinando todos los hooks:

```javascript
import { useDataFetch, useNotification, useForm } from '../hooks';
import { Toast } from '../ui';

const TagsManager = () => {
  // Data fetching
  const { data: tags, loading, refetch } = useDataFetch('tags', {
    filters: { active: true },
    orderBy: { column: 'name', ascending: true }
  });

  // Notificaciones
  const { notification, showSuccess, showError, clearNotification } = useNotification();

  // Formulario
  const { values, errors, setValue, handleSubmit, reset } = useForm(
    { name: '', display_name: '', color: '#6B7280' },
    {
      name: { required: true, minLength: 2 },
      display_name: { required: true }
    }
  );

  const onSubmit = async (formData) => {
    try {
      await supabase.from('tags').insert(formData);
      showSuccess('Tag creado exitosamente');
      reset();
      refetch();
    } catch (err) {
      showError('Error al crear tag: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await supabase.from('tags').delete().eq('id', id);
      showSuccess('Tag eliminado');
      refetch();
    } catch (err) {
      showError('Error al eliminar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
          placeholder="Nombre del tag"
        />
        {errors.name && <span className="error">{errors.name}</span>}

        <input
          value={values.display_name}
          onChange={(e) => setValue('display_name', e.target.value)}
          placeholder="Nombre a mostrar"
        />
        {errors.display_name && <span className="error">{errors.display_name}</span>}

        <input
          type="color"
          value={values.color}
          onChange={(e) => setValue('color', e.target.value)}
        />

        <Button type="submit">Crear Tag</Button>
      </form>

      <TagsList tags={tags} onDelete={handleDelete} />

      <Toast notification={notification} onClose={clearNotification} />
    </>
  );
};
```

---

## 📚 Cheat Sheet

### Imports

```javascript
// Hooks
import { useDataFetch, useDataFetchOne, useNotification, useForm } from '../hooks';

// UI Components
import { Modal, Toast, Button } from '../ui';

// Utils
import { formatPrice, formatDate } from '../utils';

// API
import { supabase } from '../services/api';
```

### useDataFetch

```javascript
// Simple
const { data, loading, error } = useDataFetch('table');

// Con filtros
const { data } = useDataFetch('table', {
  filters: { active: true, status: 'published' }
});

// Con ordenamiento
const { data } = useDataFetch('table', {
  orderBy: { column: 'created_at', ascending: false }
});

// Con refetch
const { data, refetch } = useDataFetch('table');

// Un solo registro
const { data } = useDataFetchOne('table', id);
```

### useNotification

```javascript
const { notification, showSuccess, showError, showWarning, showInfo, clearNotification } = useNotification();

showSuccess('Mensaje');
showError('Error', 5000); // 5 segundos
showWarning('Advertencia');
showInfo('Info');
```

### useForm

```javascript
const { values, errors, setValue, handleSubmit, reset } = useForm(
  { field1: '', field2: '' },
  {
    field1: { required: true, minLength: 3 },
    field2: { pattern: /regex/, patternMessage: 'Inválido' }
  }
);
```

---

**Estos hooks van a hacer tu código mucho más limpio y mantenible!** 🚀
