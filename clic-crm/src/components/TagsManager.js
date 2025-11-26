import React, { useState } from 'react';
import {
    Plus, Search, Tag, Layers, Target, Link2
} from 'lucide-react';
import { Button, Badge, Input } from './ui';
import { Modal } from './ui/Modal';
import { Toast } from './ui/Toast';

// FASE 1: Supabase centralizado
import { supabase } from '../services/api';

// FASE 2: Hooks personalizados
import { useDataFetch, useNotification } from '../hooks';

// Importar los componentes modulares
import TagsGeneral from './TagsGeneral';
import TagsCategories from './TagsCategories';
import TagsGroups from './TagsGroups';
import TagsRelation from './TagsRelation';

// Modal de confirmación usando componente base (FASE 1)
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

    // Estados de modales y elementos seleccionados
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

    // FASE 2: useNotification reemplaza alert()
    const { notification, showSuccess, showError, clearNotification } = useNotification();

    // FASE 2: useDataFetch reemplaza loadTags() (15 líneas → 4 líneas)
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

    // FASE 2: useDataFetch reemplaza loadCategories() (16 líneas → 4 líneas)
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

    // FASE 2: useDataFetch reemplaza loadTagGroups() (19 líneas → 5 líneas)
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

    // FASE 2: useDataFetch para relaciones (16 líneas → 3 líneas)
    const {
        data: relations,
        refetch: refetchRelations
    } = useDataFetch('content_tags', {
        select: 'id'
    });

    // Estado de loading combinado
    const loading = loadingTags || loadingCategories || loadingGroups;

    // Funciones de guardado con notificaciones (FASE 2)
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

            refetchTags(); // Refetch en lugar de reload completo
            setShowModal(false);
            setSelectedTag(null);
        } catch (err) {
            console.error('Error saving tag:', err);
            showError('Error al guardar el tag: ' + err.message);
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

            refetchCategories(); // Refetch específico
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

            refetchGroups(); // Refetch específico
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

    // Funciones de eliminación y activación/desactivación
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

            // Refetch específico según tipo
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

            // Refetch específico según tipo
            if (type === 'tag') refetchTags();
            else if (type === 'category') refetchCategories();
            else if (type === 'group') refetchGroups();

            showSuccess('Estado actualizado exitosamente');
        } catch (err) {
            console.error(`Error toggling ${type} active state:`, err);
            showError(`Error al cambiar el estado: ${err.message}`);
        }
    };

    // Funciones de manejo de modales
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

    // Configuración del header según la vista activa
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
                    buttonAction: () => {} // TagsRelation maneja sus propios modales
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
            {/* FASE 2: Toast de notificaciones */}
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

            {/* Modal de confirmación */}
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