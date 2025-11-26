import * as XLSX from 'xlsx';

/**
 * Formatea las propiedades para exportación
 * @param {Array} properties - Array de propiedades
 * @returns {Array} Array de objetos formateados para exportación
 */
export const formatPropertiesForExport = (properties) => {
    return properties.map(property => ({
        'Código': property.code || '',
        'Nombre': property.name || '',
        'Categoría': property.property_category?.name || '',
        'Tipo': property.property_type || '',
        'Operación': property.operation_type || '',
        'Estado': property.property_status || '',
        'Precio Venta (USD)': property.sale_price || '',
        'Moneda Venta': property.sale_currency || '',
        'Precio Alquiler (USD)': property.rental_price || '',
        'Moneda Alquiler': property.rental_currency || '',
        'Habitaciones': property.bedrooms || 0,
        'Baños': property.bathrooms || 0,
        'Parqueos': property.parking_spaces || 0,
        'Área Construida (m²)': property.built_area || '',
        'Área Terreno (m²)': property.land_area || '',
        'Ciudad': property.property_city?.name || '',
        'Sector': property.property_sector?.name || '',
        'Dirección': property.address || '',
        'Condición': property.property_condition || '',
        'Agente': property.agent?.name || '',
        'Fecha Creación': property.created_at ? new Date(property.created_at).toLocaleDateString() : '',
        'Última Actualización': property.updated_at ? new Date(property.updated_at).toLocaleDateString() : ''
    }));
};

/**
 * Exporta propiedades a Excel
 * @param {Array} properties - Array de propiedades
 * @param {String} filename - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (properties, filename = 'propiedades') => {
    try {
        const formattedData = formatPropertiesForExport(properties);

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();

        // Crear hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 12 }, // Código
            { wch: 30 }, // Nombre
            { wch: 15 }, // Categoría
            { wch: 12 }, // Tipo
            { wch: 12 }, // Operación
            { wch: 12 }, // Estado
            { wch: 15 }, // Precio Venta
            { wch: 12 }, // Moneda Venta
            { wch: 15 }, // Precio Alquiler
            { wch: 12 }, // Moneda Alquiler
            { wch: 12 }, // Habitaciones
            { wch: 10 }, // Baños
            { wch: 10 }, // Parqueos
            { wch: 18 }, // Área Construida
            { wch: 18 }, // Área Terreno
            { wch: 15 }, // Ciudad
            { wch: 20 }, // Sector
            { wch: 30 }, // Dirección
            { wch: 12 }, // Condición
            { wch: 20 }, // Agente
            { wch: 15 }, // Fecha Creación
            { wch: 18 }  // Última Actualización
        ];
        ws['!cols'] = colWidths;

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');

        // Generar y descargar archivo
        XLSX.writeFile(wb, `${filename}.xlsx`);

        return { success: true, count: properties.length };
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Exporta propiedades a CSV
 * @param {Array} properties - Array de propiedades
 * @param {String} filename - Nombre del archivo (sin extensión)
 */
export const exportToCSV = (properties, filename = 'propiedades') => {
    try {
        const formattedData = formatPropertiesForExport(properties);

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();

        // Crear hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');

        // Generar y descargar archivo CSV
        XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });

        return { success: true, count: properties.length };
    } catch (error) {
        console.error('Error al exportar a CSV:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Exporta propiedades al formato especificado
 * @param {Array} properties - Array de propiedades
 * @param {String} format - Formato de exportación ('excel' | 'csv')
 * @param {String} filename - Nombre del archivo (opcional)
 */
export const exportProperties = (properties, format = 'excel', filename = 'propiedades') => {
    if (!properties || properties.length === 0) {
        return { success: false, error: 'No hay propiedades para exportar' };
    }

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}`;

    switch (format) {
        case 'excel':
            return exportToExcel(properties, finalFilename);
        case 'csv':
            return exportToCSV(properties, finalFilename);
        default:
            return { success: false, error: 'Formato no soportado' };
    }
};
