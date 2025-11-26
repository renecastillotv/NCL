import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Copy, AlertTriangle, Database, Zap, GitMerge,
    CheckCircle, XCircle, Check, X, Globe, MapPin, Building,
    Navigation, Eye
} from 'lucide-react';



import { supabase } from '../../services/api';

// Componentes UI básicos
const Button = ({ children, variant = 'primary', size = 'md', icon, className = '', disabled = false, onClick, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
        ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Componente para cada grupo de duplicados
const DuplicateGroup = ({ group, onMerge, merging }) => {
    const [selectedKeep, setSelectedKeep] = useState(group.items[0]?.id);
    const [expanded, setExpanded] = useState(false);

    const handleMerge = () => {
        if (!selectedKeep) {
            alert('Por favor selecciona qué ubicación mantener');
            return;
        }

        const removeIds = group.items
            .filter(item => item.id !== selectedKeep)
            .map(item => item.id);

        if (removeIds.length === 0) {
            alert('No hay duplicados para fusionar');
            return;
        }

        const confirmMessage = `¿Confirmas fusionar ${group.name}?\n\n` +
            `✅ Mantener: ${group.items.find(item => item.id === selectedKeep)?.location_name}\n` +
            `❌ Fusionar: ${removeIds.length} duplicados\n\n` +
            `Esta acción no se puede deshacer fácilmente.`;

        if (window.confirm(confirmMessage)) {
            console.log('🔄 Iniciando fusión desde componente:', {
                group: group.name,
                selectedKeep,
                removeIds
            });
            onMerge(group, selectedKeep, removeIds);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                        {group.type === 'country' && <Globe className="w-4 h-4 text-red-600" />}
                        {group.type === 'province' && <MapPin className="w-4 h-4 text-red-600" />}
                        {group.type === 'city' && <Building className="w-4 h-4 text-red-600" />}
                        {group.type === 'sector' && <Navigation className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">
                            {group.name} ({group.type})
                        </h4>
                        <p className="text-sm text-gray-600">
                            {group.items.length} instancias duplicadas
                        </p>
                        <p className="text-xs text-gray-500">
                            Seleccionado: {group.items.find(item => item.id === selectedKeep)?.location_name || 'Ninguno'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Contraer' : 'Expandir'}
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleMerge}
                        disabled={merging || !selectedKeep}
                        icon={merging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                    >
                        {merging ? 'Fusionando...' : 'Fusionar'}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="space-y-3 mt-4 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                        <strong>Selecciona cuál mantener:</strong> Se fusionarán las demás en esta ubicación.
                    </p>
                    {group.items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedKeep === item.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedKeep(item.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="radio"
                                        checked={selectedKeep === item.id}
                                        onChange={() => setSelectedKeep(item.id)}
                                        className="text-green-600 focus:ring-green-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {item.display_name || item.location_name}
                                            {index === 0 && <Badge variant="success" className="ml-2">Recomendado</Badge>}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            ID: {item.id.substring(0, 8)}... | 
                                            Popularidad: {item.popularity_score || 0} | 
                                            Uso: {item.usage_count || 0} |
                                            Status: {item.status || 'active'}
                                        </div>
                                        {item.parent_location_id && (
                                            <div className="text-xs text-gray-500">
                                                Padre: {item.parent_location_id.substring(0, 8)}...
                                            </div>
                                        )}
                                        {item.canonical_name && item.canonical_name !== item.location_name && (
                                            <div className="text-xs text-blue-600">
                                                Canónico: {item.canonical_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {selectedKeep === item.id && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <strong>Importante:</strong> Esta acción:
                                <ul className="list-disc ml-4 mt-1">
                                    <li>Moverá todos los sectores hijos a la ubicación seleccionada</li>
                                    <li>Transferirá aliases y tags relacionados</li>
                                    <li>Marcará los duplicados como "inactive"</li>
                                    <li>Combinará estadísticas de uso y popularidad</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para ubicaciones huérfanas
const OrphanItem = ({ orphan, locations, onFix }) => {
    const [selectedParent, setSelectedParent] = useState('');
    
    const potentialParents = locations.filter(loc => 
        loc.location_type === 'city' && loc.status === 'active'
    );

    return (
        <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                    <div className="font-medium text-gray-900">{orphan.location_name}</div>
                    <div className="text-sm text-gray-600">
                        {orphan.location_type} • ID: {orphan.id.substring(0, 8)}...
                    </div>
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
                <select
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                    <option value="">Seleccionar ciudad padre</option>
                    {potentialParents.map(parent => (
                        <option key={parent.id} value={parent.id}>
                            {parent.display_name || parent.location_name}
                        </option>
                    ))}
                </select>
                
                <Button
                    variant="warning"
                    size="sm"
                    onClick={() => onFix(orphan, selectedParent)}
                    disabled={!selectedParent}
                    icon={<Check className="w-4 h-4" />}
                >
                    Corregir
                </Button>
            </div>
        </div>
    );
};

// Componente principal de análisis de duplicados
const DataCleanup = ({ locations, onRefresh }) => {
    const [duplicates, setDuplicates] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [merging, setMerging] = useState({});

    useEffect(() => {
        analyzeDuplicates();
    }, [locations]);

    const analyzeDuplicates = () => {
        setAnalyzing(true);
        
        // Detectar duplicados exactos
        const duplicateGroups = {};
        const nameTypeCombos = {};
        
        locations.forEach((location) => {
            const key = `${location.location_name}_${location.location_type}`;
            
            if (nameTypeCombos[key]) {
                if (!duplicateGroups[key]) {
                    duplicateGroups[key] = [nameTypeCombos[key]];
                }
                duplicateGroups[key].push(location);
            } else {
                nameTypeCombos[key] = location;
            }
        });

        // Detectar huérfanos
        const orphansList = locations.filter(location => 
            !location.parent_location_id && location.location_type !== 'country'
        );

        setDuplicates(Object.entries(duplicateGroups).map(([key, items]) => ({
            key,
            name: items[0].location_name,
            type: items[0].location_type,
            items: items.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
        })));
        
        setOrphans(orphansList);
        setAnalyzing(false);
    };

    const mergeDuplicates = async (duplicateGroup, keepId, removeIds) => {
        console.log('🔄 Iniciando fusión:', { group: duplicateGroup.name, keepId, removeIds });
        setMerging(prev => ({ ...prev, [duplicateGroup.key]: true }));
        
        try {
            // Verificar que tenemos IDs válidos
            if (!keepId || !removeIds || removeIds.length === 0) {
                throw new Error('IDs inválidos para la fusión');
            }

            console.log('1. Moviendo relaciones de hijos...');
            // 1. Mover relaciones de hijos al principal
            for (const removeId of removeIds) {
                const { error: childError } = await supabase
                    .from('location_insights')
                    .update({ 
                        parent_location_id: keepId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('parent_location_id', removeId);
                
                if (childError) {
                    console.warn('Error moviendo hijos:', childError);
                }
            }

            console.log('2. Moviendo aliases...');
            // 2. Actualizar aliases al principal (solo si existe la tabla)
            try {
                for (const removeId of removeIds) {
                    const { error: aliasError } = await supabase
                        .from('location_aliases')
                        .update({ 
                            location_insight_id: keepId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('location_insight_id', removeId);
                    
                    if (aliasError && !aliasError.message.includes('relation "location_aliases" does not exist')) {
                        console.warn('Error moviendo aliases:', aliasError);
                    }
                }
            } catch (aliasTableError) {
                console.log('Tabla location_aliases no existe, saltando...');
            }

            console.log('3. Moviendo tags...');
            // 3. Mover content_tags al principal (solo si existen las tablas)
            try {
                for (const removeId of removeIds) {
                    // Primero verificar si existe un tag para la ubicación que vamos a eliminar
                    const { data: tagToDelete } = await supabase
                        .from('tags')
                        .select('id')
                        .eq('location_insight_id', removeId)
                        .single();

                    if (tagToDelete) {
                        // Verificar si ya existe un tag para la ubicación principal
                        const { data: mainTag } = await supabase
                            .from('tags')
                            .select('id')
                            .eq('location_insight_id', keepId)
                            .single();

                        if (mainTag) {
                            // Mover todas las relaciones content_tags al tag principal
                            const { error: contentTagError } = await supabase
                                .from('content_tags')
                                .update({ tag_id: mainTag.id })
                                .eq('tag_id', tagToDelete.id);
                            
                            if (contentTagError && !contentTagError.message.includes('does not exist')) {
                                console.warn('Error moviendo content_tags:', contentTagError);
                            }

                            // Eliminar el tag duplicado
                            await supabase
                                .from('tags')
                                .delete()
                                .eq('id', tagToDelete.id);
                        } else {
                            // Si no existe tag principal, actualizar el tag para que apunte al principal
                            await supabase
                                .from('tags')
                                .update({ location_insight_id: keepId })
                                .eq('id', tagToDelete.id);
                        }
                    }
                }
            } catch (tagTableError) {
                console.log('Tablas de tags no existen o no son accesibles, saltando...');
            }

            console.log('4. Marcando duplicados como inactivos...');
            // 4. Marcar como inactivo en lugar de merged_duplicate (evitar constraint)
            const { error: updateError } = await supabase
                .from('location_insights')
                .update({ 
                    status: 'inactive', // Usar un status válido
                    updated_at: new Date().toISOString()
                })
                .in('id', removeIds);

            if (updateError) {
                throw updateError;
            }

            console.log('5. Actualizando estadísticas del principal...');
            // 5. Actualizar estadísticas del principal
            const totalUsage = duplicateGroup.items.reduce((sum, item) => sum + (item.usage_count || 0), 0);
            const maxPopularity = Math.max(...duplicateGroup.items.map(item => item.popularity_score || 0));

            const { error: statsError } = await supabase
                .from('location_insights')
                .update({
                    usage_count: totalUsage,
                    popularity_score: Math.min(100, maxPopularity + 5),
                    updated_at: new Date().toISOString()
                })
                .eq('id', keepId);

            if (statsError) {
                console.warn('Error actualizando estadísticas:', statsError);
            }

            console.log('✅ Fusión completada exitosamente');
            alert(`✅ Fusión completada: ${duplicateGroup.name}\n${removeIds.length} duplicados marcados como inactivos.`);
            
            // Refrescar datos
            onRefresh();

        } catch (error) {
            console.error('❌ Error en fusión:', error);
            
            // Dar más información sobre el error específico
            let errorMessage = error.message;
            if (error.message.includes('constraint')) {
                errorMessage = `Error de constraint: ${error.message}\n\n` +
                              `Esto indica que el valor 'status' no está permitido.\n` +
                              `Valores válidos posibles: 'active', 'inactive', 'draft'`;
            }
            
            alert(`❌ Error al fusionar duplicados: ${errorMessage}\n\nRevisa la consola para más detalles.`);
        } finally {
            setMerging(prev => ({ ...prev, [duplicateGroup.key]: false }));
        }
    };

    const fixOrphan = async (orphan, newParentId) => {
        try {
            await supabase
                .from('location_insights')
                .update({ 
                    parent_location_id: newParentId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orphan.id);
            
            onRefresh();
        } catch (error) {
            console.error('Error fixing orphan:', error);
        }
    };

    const normalizeNames = async () => {
        try {
            // Normalizar "El Millon" a "El Millón"
            await supabase
                .from('location_insights')
                .update({
                    location_name: 'El Millón',
                    canonical_name: 'El Millón',
                    display_name: 'El Millón',
                    updated_at: new Date().toISOString()
                })
                .ilike('location_name', '%millon%')
                .not('location_name', 'like', '%Millón%');

            onRefresh();
        } catch (error) {
            console.error('Error normalizing names:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center">
                        <Copy className="w-8 h-8 text-red-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{duplicates.length}</div>
                            <div className="text-sm text-gray-600">Grupos duplicados</div>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{orphans.length}</div>
                            <div className="text-sm text-gray-600">Huérfanos</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center">
                        <Database className="w-8 h-8 text-blue-500" />
                        <div className="ml-3">
                            <div className="text-2xl font-bold text-gray-900">{locations.length}</div>
                            <div className="text-sm text-gray-600">Total ubicaciones</div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col space-y-2">
                    <Button
                        variant="warning"
                        size="sm"
                        onClick={normalizeNames}
                        icon={<Zap className="w-4 h-4" />}
                    >
                        Normalizar Nombres
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={analyzeDuplicates}
                        icon={<RefreshCw className="w-4 h-4" />}
                    >
                        Re-analizar
                    </Button>
                </div>
            </div>

            {/* Lista de duplicados */}
            {duplicates.length > 0 && (
                <Card>
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Copy className="w-5 h-5 mr-2 text-red-500" />
                            Duplicados Detectados ({duplicates.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {duplicates.map((group) => (
                            <DuplicateGroup
                                key={group.key}
                                group={group}
                                onMerge={mergeDuplicates}
                                merging={merging[group.key]}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* Lista de huérfanos */}
            {orphans.length > 0 && (
                <Card>
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                            Ubicaciones Huérfanas ({orphans.length})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Sectores sin ubicación padre
                        </p>
                    </div>
                    <div className="p-4 space-y-3">
                        {orphans.map((orphan) => (
                            <OrphanItem
                                key={orphan.id}
                                orphan={orphan}
                                locations={locations}
                                onFix={fixOrphan}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {duplicates.length === 0 && orphans.length === 0 && !analyzing && (
                <Card className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¡Base de datos limpia!
                    </h3>
                    <p className="text-gray-600">
                        No se encontraron duplicados ni ubicaciones huérfanas.
                    </p>
                </Card>
            )}

            {analyzing && (
                <Card className="p-8 text-center">
                    <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Analizando datos...
                    </h3>
                    <p className="text-gray-600">
                        Detectando duplicados y ubicaciones huérfanas
                    </p>
                </Card>
            )}
        </div>
    );
};

export default DataCleanup;