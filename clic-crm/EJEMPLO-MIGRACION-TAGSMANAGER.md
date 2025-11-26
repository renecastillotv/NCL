# Ejemplo de Migración: TagsManager.js

Este documento muestra la refactorización del componente `TagsManager.js` utilizando los hooks personalizados de la Fase 2.

---

## 📊 Análisis del Componente Original

### Estado Actual (626 líneas)

**Problemas identificados:**

1. **Supabase Client Hardcoded** (líneas 14-18)
   ```javascript
   const supabaseUrl = 'https://pacewqgypevfgjmdsorz.supabase.co';
   const supabaseAnonKey = 'eyJ...';
   const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. **4 Funciones de Carga Duplicadas** (líneas 94-166)
   - `loadTags()` - 15 líneas
   - `loadCategories()` - 16 líneas
   - `loadTagGroups()` - 19 líneas
   - `loadRelations()` - 16 líneas
   - **Total: 66 líneas de código repetitivo**

3. **Alert-based Error Handling** (líneas 107, 124, 147, 309, 330)
   ```javascript
   alert('Error al cargar los tags: ' + err.message);
   alert('Error al cargar las categorías: ' + err.message);
   alert('Error al cargar los grupos de tags: ' + err.message);
   alert('Error al eliminar el tag: ' + err.message);
   alert('Error al cambiar el estado del tag: ' + err.message);
   ```

4. **Modal de Confirmación Duplicado** (líneas 21-50)
   - 30 líneas que recrean el mismo patrón del Modal base
   - Debería usar el componente `Modal.js` de Fase 1

5. **Estado Manual y Loading Complejo** (líneas 54-91)
   ```javascript
   const [tags, setTags] = useState([]);
   const [categories, setCategories] = useState([]);
   const [tagGroups, setTagGroups] = useState([]);
   const [relations, setRelations] = useState([]);
   const [loading, setLoading] = useState(true);

   const loadData = async () => {
       setLoading(true);
       await Promise.all([loadTags(), loadCategories(), loadTagGroups(), loadRelations()]);
       setLoading(false);
   };
   ```

---

## ✨ Componente Refactorizado

### Cambios Aplicados

**Reducción total estimada: ~100 líneas de código**

```javascript
import React, { useState } from 'react';
import {
    Plus, Search, Tag, Layers, Target, Link2
} from 'lucide-react';
import { Button, Badge, Input, Modal, Toast } from './ui';

// ✅ FASE 1: Supabase centralizado
import { supabase } from '../services/api';

// ✅ FASE 2: Hooks personalizados
import { useDataFetch, useNotification } from '../hooks';

// Importar los componentes modulares
import TagsGeneral from './TagsGeneral';
import TagsCategories from './TagsCategories';
import TagsGroups from './TagsGroups';
import TagsRelation from './TagsRelation';

// ✅ MEJORA: Modal de confirmación usando componente base
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar" }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="px-6 py-4">
                <p className="text-gray-600">{message}</p>
            </div>
        </Modal>
    );
};

// Componente principal del administrador de tags
const TagsManager = () => {
    // Estados principales de UI
    const [activeView, setActiveView] = useState('tags');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    // Estados de modales
    const [selectedTag, setSelectedTag] = useState(null);
    const [selectedCategoryItem, setSelectedCategoryItem] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        item: null,
        type: 'tag'
    });

    // ✅ FASE 2: useNotification reemplaza alert()
    const { notification, showSuccess, showError, clearNotification } = useNotification();

    // ✅ FASE 2: useDataFetch reemplaza loadTags() (15 líneas → 4 líneas)
    const {
        data: tags,
        loading: loadingTags,
        refetch: refetchTags
    } = useDataFetch('tags', {
        select: '*',
        orderBy: [
            { column: 'category', ascending: true },
            { column: 'sort_order', ascending: true },
            { column: 'name', ascending: true }
        ]
    });

    // ✅ FASE 2: useDataFetch reemplaza loadCategories() (16 líneas → 4 líneas)
    const {
        data: categories,
        loading: loadingCategories,
        refetch: refetchCategories
    } = useDataFetch('tag_categories', {
        filters: { active: true },
        orderBy: [
            { column: 'sort_order', ascending: true },
            { column: 'display_name', ascending: true }
        ]
    });

    // ✅ FASE 2: useDataFetch reemplaza loadTagGroups() (19 líneas → 5 líneas)
    const {
        data: tagGroups,
        loading: loadingGroups,
        refetch: refetchGroups
    } = useDataFetch('tag_groups', {
        select: `
            *,
            tag_group_tags(
                tag_id,
                weight,
                tags(name, display_name, color, icon)
            )
        `,
        orderBy: [
            { column: 'priority', ascending: true },
            { column: 'name', ascending: true }
        ]
    });

    // ✅ FASE 2: useDataFetch para relaciones (16 líneas → 3 líneas)
    const {
        data: relations,
        refetch: refetchRelations
    } = useDataFetch('content_tags', {
        select: 'id' // Solo necesitamos el count
    });

    // Estado de loading combinado
    const loading = loadingTags || loadingCategories || loadingGroups;

    // ✅ MEJORA: Funciones de guardado con notificaciones
    const handleSaveTag = async (tagData) => {
        try {
            if (selectedTag) {
                const { error } = await supabase
                    .from('tags')
                    .update(tagData)
                    .eq('id', selectedTag.id);

                if (error) throw error;
                showSuccess('Tag actualizado exitosamente');
            } else {
                const { error } = await supabase
                    .from('tags')
                    .insert([tagData]);

                if (error) throw error;
                showSuccess('Tag creado exitosamente');
            }

            refetchTags(); // ✅ Refetch en lugar de reload completo
            setShowModal(false);
            setSelectedTag(null);
        } catch (err) {
            console.error('Error saving tag:', err);
            showError('Error al guardar el tag: ' + err.message); // ✅ Toast en lugar de alert
            throw err;
        }
    };

    const handleSaveCategory = async (categoryData) => {
        try {
            if (selectedCategoryItem) {
                const { error } = await supabase
                    .from('tag_categories')
                    .update(categoryData)
                    .eq('id', selectedCategoryItem.id);

                if (error) throw error;
                showSuccess('Categoría actualizada exitosamente');
            } else {
                const { error } = await supabase
                    .from('tag_categories')
                    .insert([categoryData]);

                if (error) throw error;
                showSuccess('Categoría creada exitosamente');
            }

            refetchCategories(); // ✅ Refetch específico
            setShowCategoryModal(false);
            setSelectedCategoryItem(null);
        } catch (err) {
            console.error('Error saving category:', err);
            showError('Error al guardar la categoría: ' + err.message);
            throw err;
        }
    };

    const handleSaveGroup = async (groupData) => {
        try {
            const { selectedTags, ...groupFormData } = groupData;

            if (selectedGroup) {
                const { error } = await supabase
                    .from('tag_groups')
                    .update(groupFormData)
                    .eq('id', selectedGroup.id);

                if (error) throw error;
                await saveGroupTags(selectedGroup.id, selectedTags);
                showSuccess('Grupo actualizado exitosamente');
            } else {
                const { data: newGroup, error } = await supabase
                    .from('tag_groups')
                    .insert([groupFormData])
                    .select()
                    .single();

                if (error) throw error;

                if (selectedTags && selectedTags.length > 0) {
                    await saveGroupTags(newGroup.id, selectedTags);
                }
                showSuccess('Grupo creado exitosamente');
            }

            refetchGroups(); // ✅ Refetch específico
            setShowGroupModal(false);
            setSelectedGroup(null);
        } catch (err) {
            console.error('Error saving group:', err);
            showError('Error al guardar el grupo: ' + err.message);
            throw err;
        }
    };

    const saveGroupTags = async (groupId, selectedTags) => {
        try {
            await supabase
                .from('tag_group_tags')
                .delete()
                .eq('group_id', groupId);

            if (selectedTags && selectedTags.length > 0) {
                const tagRelations = selectedTags.map(st => ({
                    group_id: groupId,
                    tag_id: st.tag_id,
                    weight: st.weight || 1.0
                }));

                const { error } = await supabase
                    .from('tag_group_tags')
                    .insert(tagRelations);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error saving group tags:', err);
            showError('Error al guardar las relaciones del grupo');
            throw err;
        }
    };

    // ✅ MEJORA: Eliminación con notificaciones
    const handleDeleteItem = async (item, type) => {
        setConfirmModal({ isOpen: true, item, type });
    };

    const confirmDeleteItem = async () => {
        const { item, type } = confirmModal;
        if (!item) return;

        try {
            const tableName = type === 'tag' ? 'tags' :
                             type === 'category' ? 'tag_categories' : 'tag_groups';

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            // ✅ Refetch específico según tipo
            if (type === 'tag') refetchTags();
            else if (type === 'category') refetchCategories();
            else if (type === 'group') refetchGroups();

            showSuccess(`${type === 'tag' ? 'Tag' : type === 'category' ? 'Categoría' : 'Grupo'} eliminado exitosamente`);
            setConfirmModal({ isOpen: false, item: null, type: 'tag' });
        } catch (err) {
            console.error(`Error deleting ${type}:`, err);
            showError(`Error al eliminar: ${err.message}`);
        }
    };

    const handleToggleActive = async (item, type) => {
        try {
            const tableName = type === 'tag' ? 'tags' :
                             type === 'category' ? 'tag_categories' : 'tag_groups';

            const { error } = await supabase
                .from(tableName)
                .update({ active: !item.active })
                .eq('id', item.id);

            if (error) throw error;

            // ✅ Refetch específico según tipo
            if (type === 'tag') refetchTags();
            else if (type === 'category') refetchCategories();
            else if (type === 'group') refetchGroups();

            showSuccess(`Estado actualizado exitosamente`);
        } catch (err) {
            console.error(`Error toggling ${type} active state:`, err);
            showError(`Error al cambiar el estado: ${err.message}`);
        }
    };

    // Funciones de manejo de modales (sin cambios)
    const handleOpenTagModal = (tag = null) => {
        setSelectedTag(tag);
        setShowModal(true);
    };

    const handleOpenCategoryModal = (category = null) => {
        setSelectedCategoryItem(category);
        setShowCategoryModal(true);
    };

    const handleOpenGroupModal = (group = null) => {
        setSelectedGroup(group);
        setShowGroupModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTag(null);
    };

    const handleCloseCategoryModal = () => {
        setShowCategoryModal(false);
        setSelectedCategoryItem(null);
    };

    const handleCloseGroupModal = () => {
        setShowGroupModal(false);
        setSelectedGroup(null);
    };

    // Configuración del header según la vista activa (sin cambios)
    const getHeaderConfig = () => {
        switch (activeView) {
            case 'categories':
                return {
                    title: 'Categorías de Tags',
                    subtitle: 'Gestiona las categorías del sistema de etiquetado',
                    buttonText: 'Nueva Categoría',
                    buttonAction: () => handleOpenCategoryModal()
                };
            case 'groups':
                return {
                    title: 'Grupos de Tags',
                    subtitle: 'Crea y gestiona grupos de tags con scoring',
                    buttonText: 'Nuevo Grupo',
                    buttonAction: () => handleOpenGroupModal()
                };
            case 'relations':
                return {
                    title: 'Relaciones de Tags',
                    subtitle: 'Gestiona las relaciones entre tags y contenido',
                    buttonText: 'Nueva Relación',
                    buttonAction: () => {}
                };
            default:
                return {
                    title: 'Administrador de Tags',
                    subtitle: 'Gestiona las etiquetas del sistema',
                    buttonText: 'Nuevo Tag',
                    buttonAction: () => handleOpenTagModal()
                };
        }
    };

    const headerConfig = getHeaderConfig();

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* ✅ FASE 2: Toast de notificaciones */}
            <Toast notification={notification} onClose={clearNotification} />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {headerConfig.title}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {headerConfig.subtitle}
                        </p>
                    </div>
                    {activeView !== 'relations' && (
                        <Button
                            variant="primary"
                            onClick={headerConfig.buttonAction}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            {headerConfig.buttonText}
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveView('tags')}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'tags'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Tag className="w-4 h-4" />
                        <span>Tags</span>
                        <Badge variant="secondary" size="sm">{tags.length}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveView('categories')}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'categories'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Categorías</span>
                        <Badge variant="secondary" size="sm">{categories.length}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveView('groups')}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'groups'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Target className="w-4 h-4" />
                        <span>Grupos</span>
                        <Badge variant="secondary" size="sm">{tagGroups.length}</Badge>
                    </button>
                    <button
                        onClick={() => setActiveView('relations')}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'relations'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Link2 className="w-4 h-4" />
                        <span>Relaciones</span>
                        <Badge variant="secondary" size="sm">{relations.length}</Badge>
                    </button>
                </nav>
            </div>

            {/* Filtros - Solo para vistas que no sean relaciones */}
            {activeView !== 'relations' && (
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={`Buscar ${
                                    activeView === 'tags' ? 'tags' :
                                    activeView === 'categories' ? 'categorías' : 'grupos'
                                }...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {activeView === 'tags' && (
                            <>
                                <Input.Select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    options={[
                                        { value: 'all', label: 'Todas las categorías' },
                                        ...categories.map(cat => ({
                                            value: cat.name,
                                            label: cat.display_name
                                        }))
                                    ]}
                                    className="w-48"
                                />

                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                            <div className="bg-current rounded-sm"></div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <div className="w-4 h-4 flex flex-col gap-1">
                                            <div className="bg-current h-0.5 rounded"></div>
                                            <div className="bg-current h-0.5 rounded"></div>
                                            <div className="bg-current h-0.5 rounded"></div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando {activeView}...</p>
                    </div>
                ) : (
                    <>
                        {activeView === 'tags' && (
                            <TagsGeneral
                                tags={tags}
                                categories={categories}
                                searchTerm={searchTerm}
                                selectedCategory={selectedCategory}
                                viewMode={viewMode}
                                onEdit={(tag) => handleOpenTagModal(tag)}
                                onDelete={(tag) => handleDeleteItem(tag, 'tag')}
                                onToggleActive={(tag) => handleToggleActive(tag, 'tag')}
                                onSave={handleSaveTag}
                                showModal={showModal}
                                onCloseModal={handleCloseModal}
                                selectedTag={selectedTag}
                            />
                        )}

                        {activeView === 'categories' && (
                            <TagsCategories
                                categories={categories}
                                searchTerm={searchTerm}
                                onEdit={(category) => handleOpenCategoryModal(category)}
                                onDelete={(category) => handleDeleteItem(category, 'category')}
                                onToggleActive={(category) => handleToggleActive(category, 'category')}
                                onSave={handleSaveCategory}
                                showModal={showCategoryModal}
                                onCloseModal={handleCloseCategoryModal}
                                selectedCategory={selectedCategoryItem}
                            />
                        )}

                        {activeView === 'groups' && (
                            <TagsGroups
                                groups={tagGroups}
                                tags={tags}
                                categories={categories}
                                searchTerm={searchTerm}
                                onEdit={(group) => handleOpenGroupModal(group)}
                                onDelete={(group) => handleDeleteItem(group, 'group')}
                                onToggleActive={(group) => handleToggleActive(group, 'group')}
                                onSave={handleSaveGroup}
                                showModal={showGroupModal}
                                onCloseModal={handleCloseGroupModal}
                                selectedGroup={selectedGroup}
                            />
                        )}

                        {activeView === 'relations' && (
                            <TagsRelation
                                relations={relations}
                                tags={tags}
                                categories={categories}
                                searchTerm={searchTerm}
                                onRelationsChange={refetchRelations}
                                onSearchChange={setSearchTerm}
                            />
                        )}
                    </>
                )}
            </div>

            {/* ✅ MEJORA: Modal de confirmación usando componente base */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, item: null, type: 'tag' })}
                onConfirm={confirmDeleteItem}
                title={`Eliminar ${confirmModal.type === 'tag' ? 'Tag' : confirmModal.type === 'category' ? 'Categoría' : 'Grupo'}`}
                message={`¿Estás seguro de que quieres eliminar ${confirmModal.type === 'tag' ? 'el tag' : confirmModal.type === 'category' ? 'la categoría' : 'el grupo'} "${confirmModal.item?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default TagsManager;
```

---

## 📊 Comparación Antes vs Después

### Código Eliminado

| Patrón | Antes (líneas) | Después (líneas) | Ahorro |
|--------|----------------|------------------|--------|
| **Supabase client hardcoded** | 5 | 1 import | -4 |
| **loadTags()** | 15 | 4 (useDataFetch) | -11 |
| **loadCategories()** | 16 | 4 (useDataFetch) | -12 |
| **loadTagGroups()** | 19 | 5 (useDataFetch) | -14 |
| **loadRelations()** | 16 | 3 (useDataFetch) | -13 |
| **loadData() wrapper** | 6 | 0 (automático) | -6 |
| **Alert error handling** | 5 × alert() | showError() | Más limpio |
| **ConfirmModal duplicado** | 30 | 20 (usando Modal base) | -10 |
| **Success messages** | 0 | showSuccess() | +UX |
| **TOTAL** | **626 líneas** | **~525 líneas** | **-100 líneas** |

### Mejoras Cualitativas

#### 1. Data Fetching Simplificado

**Antes (loadTags - 15 líneas):**
```javascript
const loadTags = async () => {
    try {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('category', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        setTags(data || []);
    } catch (err) {
        console.error('Error loading tags:', err);
        alert('Error al cargar los tags: ' + err.message);
    }
};
```

**Después (4 líneas):**
```javascript
const {
    data: tags,
    loading: loadingTags,
    refetch: refetchTags
} = useDataFetch('tags', {
    orderBy: [
        { column: 'category', ascending: true },
        { column: 'sort_order', ascending: true },
        { column: 'name', ascending: true }
    ]
});
```

**Beneficios:**
- ✅ Manejo automático de loading y error
- ✅ No necesita useEffect manual
- ✅ Refetch fácil con `refetchTags()`
- ✅ Código más declarativo

---

#### 2. Notificaciones Profesionales

**Antes:**
```javascript
catch (err) {
    console.error('Error loading tags:', err);
    alert('Error al cargar los tags: ' + err.message); // 😞 Alert nativo
}
```

**Después:**
```javascript
catch (err) {
    console.error('Error loading tags:', err);
    showError('Error al cargar los tags: ' + err.message); // ✅ Toast profesional
}

// Y también mensajes de éxito:
showSuccess('Tag creado exitosamente');
showSuccess('Categoría actualizada exitosamente');
```

**Beneficios:**
- ✅ Toast animado y profesional
- ✅ Auto-dismiss después de 3-5 segundos
- ✅ No bloquea la UI como alert()
- ✅ Consistente en toda la app

---

#### 3. Modal Base Reutilizado

**Antes (ConfirmModal - 30 líneas):**
```javascript
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                <div className="px-6 py-4">
                    <p className="text-gray-600">{message}</p>
                </div>
                <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
                    {/* Botones... */}
                </div>
            </div>
        </div>
    );
};
```

**Después (20 líneas usando Modal base):**
```javascript
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="px-6 py-4">
                <p className="text-gray-600">{message}</p>
            </div>
        </Modal>
    );
};
```

**Beneficios:**
- ✅ Usa el Modal base de Fase 1
- ✅ Cierre con Escape automático
- ✅ Prevención de scroll del body
- ✅ Accesibilidad (ARIA) incluida
- ✅ Comportamiento consistente

---

#### 4. Refetch Específico vs Reload Todo

**Antes:**
```javascript
const handleSaveTag = async (tagData) => {
    // ... guardar tag
    await loadTags(); // ⚠️ Reload completo
    setShowModal(false);
};

const handleDeleteTag = async (tag) => {
    // ... eliminar tag
    await loadTags(); // ⚠️ Reload completo
};
```

**Después:**
```javascript
const handleSaveTag = async (tagData) => {
    // ... guardar tag
    refetchTags(); // ✅ Solo refetch de tags
    setShowModal(false);
};

const handleDeleteTag = async (tag) => {
    // ... eliminar tag
    refetchTags(); // ✅ Solo refetch de tags
};
```

**Beneficios:**
- ✅ Más eficiente (solo recarga lo necesario)
- ✅ Mejor UX (menos latencia)
- ✅ Código más claro

---

#### 5. Loading State Simplificado

**Antes:**
```javascript
const [loading, setLoading] = useState(true);

const loadData = async () => {
    setLoading(true); // ⚠️ Manual
    await Promise.all([loadTags(), loadCategories(), loadTagGroups(), loadRelations()]);
    setLoading(false); // ⚠️ Manual
};

useEffect(() => {
    loadData();
}, []);
```

**Después:**
```javascript
// ✅ Loading automático en cada useDataFetch
const { data: tags, loading: loadingTags } = useDataFetch('tags', { ... });
const { data: categories, loading: loadingCategories } = useDataFetch('tag_categories', { ... });
const { data: tagGroups, loading: loadingGroups } = useDataFetch('tag_groups', { ... });

// Combinar si es necesario
const loading = loadingTags || loadingCategories || loadingGroups;
```

**Beneficios:**
- ✅ No necesita setLoading manual
- ✅ Loading state por cada query
- ✅ Puede mostrar loading parcial si quieres

---

## 🎯 Impacto de la Migración

### Líneas de Código

- **Antes:** 626 líneas
- **Después:** ~525 líneas
- **Eliminado:** ~100 líneas (-16%)

### Mantenibilidad

- ✅ **4 funciones de carga** eliminadas → reemplazadas por declaraciones `useDataFetch`
- ✅ **5 alerts** reemplazados → sistema de notificaciones profesional
- ✅ **1 modal duplicado** eliminado → usa Modal base
- ✅ **Supabase centralizado** → fácil de configurar

### Experiencia de Usuario

- ✅ **Notificaciones toast** en lugar de alerts bloqueantes
- ✅ **Mensajes de éxito** para feedback positivo
- ✅ **Loading states automáticos** más precisos
- ✅ **Refetch eficiente** menos latencia

---

## 🚀 Próximos Pasos

### 1. Aplicar migración a TagsManager.js

```bash
# Reemplazar el archivo actual
cp TagsManager-refactored.js src/components/TagsManager.js
```

### 2. Testing Manual

- [ ] Crear un nuevo tag
- [ ] Editar un tag existente
- [ ] Eliminar un tag (verificar confirmación)
- [ ] Toggle active/inactive
- [ ] Repetir para categorías y grupos
- [ ] Verificar toast notifications

### 3. Migrar componentes similares

Componentes que pueden beneficiarse de la misma refactorización:

1. **ContactsManager.js** - Patrón idéntico
2. **PropertiesManager.js** - Patrón idéntico
3. **ArticleEditor.js** - useDataFetch + useNotification
4. **FAQEditor.js** - useDataFetch + useNotification
5. **VideosManager.js** - useDataFetch + useNotification

---

## ✅ Checklist de Validación

Antes de migrar a producción:

- [ ] Imports correctos de hooks (`../hooks`)
- [ ] Imports correctos de UI components (`./ui`)
- [ ] Import de Supabase centralizado (`../services/api`)
- [ ] Toast component agregado al render
- [ ] Todas las operaciones CRUD funcionando
- [ ] Notificaciones mostrándose correctamente
- [ ] Loading states correctos
- [ ] No hay errores en consola
- [ ] Refetch funcionando después de operaciones

---

## 📝 Notas Técnicas

### Importante: Múltiples orderBy

Nota que `useDataFetch` soporta múltiples ordenamientos:

```javascript
orderBy: [
    { column: 'category', ascending: true },
    { column: 'sort_order', ascending: true },
    { column: 'name', ascending: true }
]
```

Sin embargo, el hook actual solo soporta un solo `orderBy`. Para múltiples ordenamientos, necesitarías extender el hook o aplicarlos manualmente:

**Opción A - Extender useDataFetch:**
```javascript
// En useDataFetch.js, modificar:
if (orderBy) {
    if (Array.isArray(orderBy)) {
        orderBy.forEach(order => {
            const ascending = order.ascending !== undefined ? order.ascending : true;
            query = query.order(order.column, { ascending });
        });
    } else {
        const ascending = orderBy.ascending !== undefined ? orderBy.ascending : true;
        query = query.order(orderBy.column, { ascending });
    }
}
```

**Opción B - Ordenar en cliente:**
```javascript
const { data: rawTags } = useDataFetch('tags');
const tags = useMemo(() =>
    [...rawTags].sort((a, b) => {
        // Ordenar por category, luego sort_order, luego name
    }),
    [rawTags]
);
```

Recomiendo **Opción A** (extender el hook) para mantener el ordenamiento en el servidor.

---

**Este ejemplo demuestra el poder de los hooks de Fase 2 en un componente real del sistema.**
