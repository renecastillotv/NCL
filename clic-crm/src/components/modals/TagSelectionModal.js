import React, { useState, useEffect } from 'react';
import { Search, Tag, RefreshCw, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../services/api';

/**
 * Modal Reutilizable para Selección de Tags
 *
 * Extraído de LocationEditor.js y LocationInsightsManager.js (duplicado exacto)
 * Ahora usa el componente Modal base para evitar duplicación de wrapper
 *
 * @param {boolean} isOpen - Controla visibilidad
 * @param {function} onClose - Callback al cerrar
 * @param {function} onSelect - Callback al seleccionar tag (recibe tag object o null)
 * @param {object} currentTag - Tag actualmente seleccionado
 * @param {string} locationId - ID de la ubicación (para filtrado)
 * @param {array} categories - Categorías de tags a mostrar (default: ['sector', 'ciudad'])
 *
 * @example
 * <TagSelectionModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSelect={(tag) => handleTagSelect(tag)}
 *   currentTag={location.tag}
 *   locationId={location.id}
 * />
 */
export const TagSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  currentTag,
  locationId,
  categories = ['sector', 'ciudad']
}) => {
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
        .in('category', categories)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error en consulta principal:', error);
        throw error;
      }

      setAvailableTags(locationTags || []);

    } catch (error) {
      console.error('Error fetching location tags:', error);
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = availableTags.filter(tag => {
    const matchesSearch = !searchTerm ||
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.display_name && tag.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tag.slug && tag.slug.toLowerCase().includes(searchTerm.toLowerCase()));

    const isNotAssigned = !tag.location_insight_id || tag.id === currentTag?.id;

    return matchesSearch && isNotAssigned;
  });

  const handleSelect = async (tag) => {
    await onSelect(tag);
    onClose();
  };

  const handleRemoveTag = async () => {
    await onSelect(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Tag de Ubicación"
      size="lg"
    >
      {/* Search Section */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar tags por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {currentTag && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">Tag actual:</span>
              <div className="flex items-center space-x-1">
                {currentTag.icon && <span>{currentTag.icon}</span>}
                <span className="font-medium">{currentTag.display_name || currentTag.name}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveTag}
              icon={<X className="w-4 h-4" />}
            >
              Quitar Tag
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Cargando tags...</span>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {availableTags.length === 0 ? 'No se encontraron tags' : 'No hay resultados'}
            </h4>
            <p className="text-gray-600">
              {availableTags.length === 0
                ? `No hay tags con categorías disponibles`
                : searchTerm
                  ? `No se encontraron tags que coincidan con "${searchTerm}"`
                  : 'Todos los tags están asignados a otras ubicaciones'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTags.map(tag => (
              <div
                key={tag.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  currentTag?.id === tag.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleSelect(tag)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {tag.icon && <span className="text-lg">{tag.icon}</span>}
                      <h4 className="font-medium text-gray-900 truncate">
                        {tag.display_name || tag.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {tag.slug}
                    </p>
                    {tag.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {tag.description}
                      </p>
                    )}
                  </div>
                  {tag.location_insight_id && tag.id !== currentTag?.id && (
                    <div className="text-xs text-yellow-600 font-medium">
                      Asignado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredTags.length} de {availableTags.length} tag{availableTags.length !== 1 ? 's' : ''} mostrado{filteredTags.length !== 1 ? 's' : ''}
          </div>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TagSelectionModal;
