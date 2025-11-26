import React from 'react';
import { Card } from './ui';
import WYSIWYGSEOEditor from './WYSIWYGSEOEditor';

const SEOContentSection = ({ formData, handleInputChange, cities = [], propertyTypes = [] }) => {
    // Lista predeterminada de tipos de propiedades si no se proporciona
    const defaultPropertyTypes = [
        'apartamento', 'casa', 'villa', 'penthouse', 
        'oficina', 'local comercial', 'terreno', 'estudio',
        'duplex', 'triplex', 'loft', 'townhouse'
    ];

    // Usar tipos proporcionados o los predeterminados
    const typesToUse = propertyTypes.length > 0 ? propertyTypes : defaultPropertyTypes;

    return (
        <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold">Contenido SEO</h3>
                <p className="text-sm text-gray-600">
                    Editor visual WYSIWYG - Ve el contenido exactamente como aparecerá en la página
                </p>
            </Card.Header>
            <Card.Body>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contenido Principal
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <WYSIWYGSEOEditor
                            value={formData.seo_content}
                            onChange={(value) => handleInputChange('seo_content', value)}
                            placeholder="Escribe tu contenido SEO aquí...\n\nEjemplo:\nSelecciona 'apartamentos' y hazlo bold.\nEscribe 'Santo Domingo' y se detectará automáticamente para enlaces.\n\nUsa H2 para títulos principales y H3 para subtítulos."
                            cities={cities}
                            propertyTypes={typesToUse}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            <strong>Vista Visual:</strong> Edita el contenido como se verá en la página final. 
                            <strong>Vista HTML:</strong> Haz clic en "HTML" para ver/editar el código fuente.
                        </p>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SEOContentSection;