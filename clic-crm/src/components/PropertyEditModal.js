import React, { useState, useEffect, useRef } from 'react';
import {
    X, Save, Plus, Trash2, Search, Edit3, BookOpen, Waves,
    Check, AlertCircle, Loader2, ChevronDown, ChevronUp, Filter,
    Tag, MapPin, Home, ExternalLink, Zap, Type, Bold, Italic, Link, 
    List, ListOrdered, Heading, Code
} from 'lucide-react';


import { supabase } from '../services/api';

// Componente Button
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 focus:ring-orange-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-orange-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

// Editor WYSIWYG integrado - CORREGIDO PARA MOSTRAR CONTENIDO EXISTENTE
const WYSIWYGEditor = ({ value, onChange, placeholder }) => {
    const [content, setContent] = useState(value || '');
    const [showSource, setShowSource] = useState(false);
    const editorRef = useRef(null);
    const sourceRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Inicializar contenido cuando el componente se monta
    useEffect(() => {
        if (value && !isInitialized) {
            setContent(value);
            setIsInitialized(true);
        }
    }, [value, isInitialized]);

    // Actualizar el editor visual cuando cambia el contenido
    useEffect(() => {
        if (editorRef.current && !showSource && isInitialized) {
            // Solo actualizar si el contenido del editor es diferente
            if (editorRef.current.innerHTML !== content) {
                editorRef.current.innerHTML = content;
            }
        }
    }, [content, showSource, isInitialized]);

    useEffect(() => {
        if (onChange && isInitialized) {
            onChange(content);
        }
    }, [content, onChange, isInitialized]);

    // Función para actualizar contenido desde el editor
    const updateContentFromEditor = () => {
        if (editorRef.current) {
            const newContent = cleanHTML(editorRef.current.innerHTML);
            if (newContent !== content) {
                setContent(newContent);
            }
        }
    };

    const execCommand = (command, value = null) => {
        try {
            document.execCommand(command, false, value);
            // Actualizar después de un pequeño delay para asegurar que el comando se ejecutó
            setTimeout(() => updateContentFromEditor(), 10);
        } catch (error) {
            console.warn('Error ejecutando comando:', command, error);
        }
    };

    const handleInput = () => {
        updateContentFromEditor();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        setTimeout(() => updateContentFromEditor(), 10);
    };

    const applyCustomFormat = (format) => {
        // Enfocar el editor antes de aplicar formato
        if (editorRef.current) {
            editorRef.current.focus();
        }

        switch (format) {
            case 'h2':
                execCommand('formatBlock', '<h2>');
                break;
            case 'h3':
                execCommand('formatBlock', '<h3>');
                break;
            case 'p':
                execCommand('formatBlock', '<p>');
                break;
            case 'link':
                const url = prompt('Ingresa la URL:');
                if (url) {
                    execCommand('createLink', url);
                }
                break;
            default:
                execCommand(format);
        }
    };

    const cleanHTML = (html) => {
        if (!html) return '';
        return html
            .replace(/<div>/g, '<p>')
            .replace(/<\/div>/g, '</p>')
            .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>')
            .replace(/<p><\/p>/g, '')
            .replace(/style="[^"]*"/g, '')
            .replace(/class=""/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const toggleSourceView = () => {
        if (showSource) {
            // Cambiando de código a visual
            const sourceContent = sourceRef.current.value;
            setContent(sourceContent);
            setShowSource(false);
            // Pequeño delay para asegurar que el DOM se actualice
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = sourceContent;
                }
            }, 10);
        } else {
            // Cambiando de visual a código
            updateContentFromEditor();
            setShowSource(true);
        }
    };

    const getPlainText = (html) => {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    const plainText = getPlainText(content);
    const stats = {
        words: plainText.split(/\s+/).filter(word => word.length > 0).length,
        chars: content.length,
        plainChars: plainText.length
    };

    return (
        <div className="space-y-2">
            {/* Toolbar compacto */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('bold')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                        title="Negrita"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('italic')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                        title="Cursiva"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('link')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                        title="Enlace"
                    >
                        <Link className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="w-px h-4 bg-gray-300"></div>
                
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('h2')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700 text-xs"
                        title="Título H2"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('h3')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700 text-xs"
                        title="Título H3"
                    >
                        H3
                    </button>
                </div>
                
                <div className="w-px h-4 bg-gray-300"></div>
                
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('insertUnorderedList')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                        title="Lista"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyCustomFormat('insertOrderedList')}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                        title="Lista numerada"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="w-px h-4 bg-gray-300"></div>
                
                <button
                    type="button"
                    onClick={toggleSourceView}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 text-xs"
                    title="Ver código HTML"
                >
                    {showSource ? 'Visual' : 'HTML'}
                </button>
                
                <div className="ml-auto text-xs text-gray-500">
                    {stats.words} palabras
                </div>
            </div>

            {/* Editor */}
            <div className="relative">
                {showSource ? (
                    <textarea
                        ref={sourceRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-mono text-sm"
                        placeholder="Código HTML..."
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onPaste={handlePaste}
                        onBlur={updateContentFromEditor}
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 prose max-w-none prose-sm overflow-y-auto"
                        style={{ 
                            outline: 'none', 
                            lineHeight: '1.5',
                            minHeight: '256px'
                        }}
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: isInitialized ? undefined : content }}
                    />
                )}
                
                {/* Placeholder solo cuando está realmente vacío */}
                {!showSource && !content.trim() && isInitialized && (
                    <div className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm">
                        {placeholder || 'Escribe una descripción atractiva...'}
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente Principal del Modal
const PropertyEditModal = ({ property, isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para descripción
    const [description, setDescription] = useState('');

    // Estados para amenidades
    const [availableAmenities, setAvailableAmenities] = useState([]);
    const [propertyAmenities, setPropertyAmenities] = useState([]);
    const [searchAmenities, setSearchAmenities] = useState('');
    const [loadingAmenities, setLoadingAmenities] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showAvailableAmenities, setShowAvailableAmenities] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        if (isOpen && property) {
            setDescription(property.description || '');
            loadPropertyAmenities();
            loadAvailableAmenities();
        }
    }, [isOpen, property]);

    // Cargar amenidades disponibles
    const loadAvailableAmenities = async () => {
        try {
            setLoadingAmenities(true);
            const { data, error } = await supabase
                .from('amenities')
                .select('*')
                .eq('active', true)
                .order('category, name');

            if (error) throw error;
            setAvailableAmenities(data || []);
        } catch (err) {
            console.error('Error cargando amenidades:', err);
            setError('Error al cargar amenidades disponibles');
        } finally {
            setLoadingAmenities(false);
        }
    };

    // Cargar amenidades de la propiedad
    const loadPropertyAmenities = async () => {
        try {
            const { data, error } = await supabase
                .from('property_amenities')
                .select(`
                    id, value,
                    amenities(id, name, icon, category)
                `)
                .eq('property_id', property.id);

            if (error) throw error;
            setPropertyAmenities(data || []);
        } catch (err) {
            console.error('Error cargando amenidades de la propiedad:', err);
            setError('Error al cargar amenidades de la propiedad');
        }
    };

    // Agregar amenidad
    const addAmenity = async (amenity) => {
        try {
            // Verificar si ya existe
            const exists = propertyAmenities.some(pa => pa.amenities.id === amenity.id);
            if (exists) {
                setError('Esta amenidad ya está agregada');
                setTimeout(() => setError(''), 3000);
                return;
            }

            const { data, error } = await supabase
                .from('property_amenities')
                .insert({
                    property_id: property.id,
                    amenity_id: amenity.id,
                    value: null
                })
                .select(`
                    id, value,
                    amenities(id, name, icon, category)
                `);

            if (error) throw error;

            setPropertyAmenities(prev => [...prev, ...data]);
            setSuccess('Amenidad agregada correctamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error agregando amenidad:', err);
            setError('Error al agregar amenidad');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Remover amenidad
    const removeAmenity = async (propertyAmenityId) => {
        try {
            const { error } = await supabase
                .from('property_amenities')
                .delete()
                .eq('id', propertyAmenityId);

            if (error) throw error;

            setPropertyAmenities(prev => prev.filter(pa => pa.id !== propertyAmenityId));
            setSuccess('Amenidad removida correctamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error removiendo amenidad:', err);
            setError('Error al remover amenidad');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Actualizar valor de amenidad
    const updateAmenityValue = async (propertyAmenityId, newValue) => {
        try {
            const { error } = await supabase
                .from('property_amenities')
                .update({ value: newValue || null })
                .eq('id', propertyAmenityId);

            if (error) throw error;

            setPropertyAmenities(prev => 
                prev.map(pa => 
                    pa.id === propertyAmenityId 
                        ? { ...pa, value: newValue }
                        : pa
                )
            );
        } catch (err) {
            console.error('Error actualizando valor de amenidad:', err);
            setError('Error al actualizar valor de amenidad');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Guardar cambios
    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            const { error } = await supabase
                .from('properties')
                .update({
                    description: description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', property.id);

            if (error) throw error;

            setSuccess('Cambios guardados correctamente');
            
            if (onSave) {
                onSave({
                    ...property,
                    description: description
                });
            }

            setTimeout(() => {
                setSuccess('');
                onClose();
            }, 1500);

        } catch (err) {
            console.error('Error guardando cambios:', err);
            setError('Error al guardar cambios: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Filtrar amenidades disponibles
    const filteredAmenities = availableAmenities.filter(amenity => {
        const matchesSearch = amenity.name.toLowerCase().includes(searchAmenities.toLowerCase());
        const matchesCategory = !categoryFilter || amenity.category === categoryFilter;
        const notAlreadyAdded = !propertyAmenities.some(pa => pa.amenities.id === amenity.id);
        return matchesSearch && matchesCategory && notAlreadyAdded;
    });

    // Obtener categorías únicas
    const categories = [...new Set(availableAmenities.map(a => a.category).filter(Boolean))];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Editar Propiedad</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {property?.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'description'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <BookOpen className="w-4 h-4 inline mr-2" />
                            Descripción
                        </button>
                        <button
                            onClick={() => setActiveTab('amenities')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'amenities'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Waves className="w-4 h-4 inline mr-2" />
                            Amenidades ({propertyAmenities.length})
                        </button>
                    </nav>
                </div>

                {/* Contenido */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 220px)' }}>
                    
                    {/* Tab: Descripción */}
                    {activeTab === 'description' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción de la Propiedad
                                </label>
                                <WYSIWYGEditor
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Escribe una descripción atractiva de la propiedad..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Usa el editor para formatear texto con negrita, cursiva, títulos y listas.
                                </p>
                            </div>

                            {/* Vista previa */}
                            {description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vista Previa
                                    </label>
                                    <div 
                                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: description }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Amenidades */}
                    {activeTab === 'amenities' && (
                        <div className="space-y-6">
                            
                            {/* Amenidades actuales - DISEÑO MEJORADO */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-orange-600" />
                                    Amenidades Actuales 
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        {propertyAmenities.length}
                                    </span>
                                </h3>
                                
                                {propertyAmenities.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {propertyAmenities.map((pa) => (
                                            <div key={pa.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg group hover:shadow-sm transition-all duration-200">
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <span className="text-lg text-orange-600">
                                                        {pa.amenities.icon || 
                                                            (pa.amenities.category === 'Edificio' ? '🏢' :
                                                             pa.amenities.category === 'Interior' ? '🏠' :
                                                             pa.amenities.category === 'Exterior' ? '🌳' :
                                                             pa.amenities.category === 'Seguridad' ? '🔒' :
                                                             pa.amenities.category === 'Ubicación' ? '📍' :
                                                             '✨')
                                                        }
                                                    </span>
                                                    <div className="flex-1">
                                                        <span className="font-medium text-gray-900 text-sm block">
                                                            {pa.amenities.name}
                                                        </span>
                                                        {pa.amenities.category && (
                                                            <span className="text-xs text-orange-600">
                                                                {pa.amenities.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Valor..."
                                                        value={pa.value || ''}
                                                        onChange={(e) => updateAmenityValue(pa.id, e.target.value)}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                    <button
                                                        onClick={() => removeAmenity(pa.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remover amenidad"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        <div className="text-4xl mb-3">🏠</div>
                                        <p className="font-medium text-gray-700">Sin amenidades</p>
                                        <p className="text-sm text-gray-500">Agrega amenidades desde la lista de abajo</p>
                                    </div>
                                )}
                            </div>

                            {/* Agregar amenidades - DISEÑO MEJORADO */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Plus className="w-5 h-5 mr-2 text-green-600" />
                                        Agregar Amenidades
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAvailableAmenities(!showAvailableAmenities)}
                                        icon={showAvailableAmenities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    >
                                        {showAvailableAmenities ? 'Ocultar' : 'Mostrar'} disponibles
                                    </Button>
                                </div>
                                
                                {showAvailableAmenities && (
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        {/* Filtros */}
                                        <div className="flex space-x-3">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar amenidades..."
                                                        value={searchAmenities}
                                                        onChange={(e) => setSearchAmenities(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <select
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                            >
                                                <option value="">Todas las categorías</option>
                                                {categories.map(category => (
                                                    <option key={category} value={category}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Lista de amenidades disponibles */}
                                        {loadingAmenities ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                                                <span className="ml-2 text-gray-600">Cargando amenidades...</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                                {filteredAmenities.map((amenity) => (
                                                    <button
                                                        key={amenity.id}
                                                        onClick={() => addAmenity(amenity)}
                                                        className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 text-left text-sm group"
                                                    >
                                                        <span className="text-base">
                                                            {amenity.icon || 
                                                                (amenity.category === 'Edificio' ? '🏢' :
                                                                 amenity.category === 'Interior' ? '🏠' :
                                                                 amenity.category === 'Exterior' ? '🌳' :
                                                                 amenity.category === 'Seguridad' ? '🔒' :
                                                                 amenity.category === 'Ubicación' ? '📍' :
                                                                 '✨')
                                                            }
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="font-medium text-gray-900 block truncate">
                                                                {amenity.name}
                                                            </span>
                                                            {amenity.category && (
                                                                <span className="text-xs text-gray-500">
                                                                    {amenity.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Plus className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {!loadingAmenities && filteredAmenities.length === 0 && (
                                            <div className="text-center py-6 text-gray-500">
                                                <Search className="w-8 h-8 mx-auto mb-2" />
                                                <p>No se encontraron amenidades disponibles</p>
                                                {(searchAmenities || categoryFilter) && (
                                                    <p className="text-sm">Intenta con otro filtro de búsqueda</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mensajes */}
                {(error || success) && (
                    <div className="px-6 py-3 border-t border-gray-200">
                        {error && (
                            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                                <Check className="w-5 h-5 mr-2" />
                                <span className="text-sm">{success}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PropertyEditModal;