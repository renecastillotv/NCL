/**
 * Image Processor - CLIC CRM
 *
 * Procesamiento centralizado de imágenes de propiedades
 * Elimina duplicación en: CRMProperties.js, PropertyGeneral.js, PropertyDetail.js
 *
 * Uso:
 *   import { processPropertyImages } from '../utils/imageProcessor';
 *   const images = processPropertyImages(property);
 */

/**
 * Procesa y normaliza las imágenes de una propiedad
 * Soporta 3 fuentes: main_image_url, gallery_images_url, property_images (tabla relacionada)
 *
 * @param {object} property - Objeto de propiedad con campos de imágenes
 * @returns {Array} Array de objetos de imagen normalizados
 */
export const processPropertyImages = (property) => {
    const images = [];
    const processedUrls = new Set(); // ✅ Rastrear URLs únicas para evitar duplicados

    if (!property) {
        console.warn('⚠️ processPropertyImages: Property is null/undefined');
        return images;
    }

    // Helper function para normalizar URLs (elimina espacios, trailing slashes, etc.)
    const normalizeUrl = (url) => {
        if (!url) return '';
        return url.trim().toLowerCase().replace(/\/$/, '');
    };

    console.log('╔════════════════════════════════════════════════════════');
    console.log('║ 🔍 DEBUG - Procesando imágenes para propiedad:', property.id);
    console.log('╠════════════════════════════════════════════════════════');
    console.log('║ 📸 main_image_url:', property.main_image_url);
    console.log('║ 🖼️  gallery_images_url:', property.gallery_images_url);
    console.log('║ 📷 property_images array length:', property.property_images?.length || 0);
    if (property.property_images && property.property_images.length > 0) {
        property.property_images.forEach((img, i) => {
            console.log(`║    [${i}] is_main: ${img.is_main}, url: ${img.url?.substring(0, 80)}...`);
        });
    }
    console.log('╚════════════════════════════════════════════════════════');

    // 1. Agregar imagen principal (main_image_url)
    if (property.main_image_url && property.main_image_url.trim()) {
        const mainUrl = property.main_image_url.trim();
        const normalizedMainUrl = normalizeUrl(mainUrl);

        images.push({
            id: 'main',
            url: mainUrl,
            title: property.name || 'Imagen principal',
            description: 'Imagen principal de la propiedad',
            is_main: true,
            sort_order: 0
        });
        processedUrls.add(normalizedMainUrl); // ✅ Marcar como procesada (normalizada)
        console.log('✅ Imagen principal agregada:', mainUrl);
        console.log('   → Normalizada:', normalizedMainUrl);
    }

    // 2. Procesar gallery_images_url (string separado por comas o JSON array)
    if (property.gallery_images_url) {
        let galleryUrls = [];

        try {
            // Intentar parsear como JSON array
            if (property.gallery_images_url.startsWith('[')) {
                galleryUrls = JSON.parse(property.gallery_images_url);
            } else {
                // Asumir que es string separado por comas
                galleryUrls = property.gallery_images_url
                    .split(',')
                    .map(url => url.trim())
                    .filter(url => url.length > 0);
            }

            galleryUrls.forEach((url, index) => {
                const normalizedUrl = normalizeUrl(url);

                // ✅ Evitar duplicados (incluyendo la imagen principal)
                if (!processedUrls.has(normalizedUrl)) {
                    images.push({
                        id: `gallery-${index}`,
                        url: url,
                        title: `Imagen ${index + 1}`,
                        description: `Imagen de galería ${index + 1}`,
                        is_main: false,
                        sort_order: index + 1
                    });
                    processedUrls.add(normalizedUrl); // ✅ Marcar como procesada (normalizada)
                    console.log(`   ✅ Galería ${index + 1}:`, url.substring(0, 60) + '...');
                } else {
                    console.log(`   ⚠️  DUPLICADO (ignorado) galería ${index + 1}:`, url.substring(0, 60) + '...');
                }
            });

            console.log(`✅ ${galleryUrls.length} imágenes de gallery_images_url procesadas`);
        } catch (error) {
            console.error('❌ Error parseando gallery_images_url:', error);
        }
    }

    // 3. Procesar property_images (relación con tabla property_images)
    if (property.property_images && Array.isArray(property.property_images)) {
        property.property_images.forEach((img, index) => {
            if (img.url && img.url.trim()) {
                const cleanUrl = img.url.trim();
                const normalizedUrl = normalizeUrl(cleanUrl);

                // ✅ Evitar duplicados usando Set (más eficiente que .some())
                if (!processedUrls.has(normalizedUrl)) {
                    images.push({
                        id: img.id || `property-image-${index}`,
                        url: cleanUrl,
                        title: img.title || `Imagen ${images.length + 1}`,
                        description: img.description || '',
                        is_main: img.is_main || false,
                        sort_order: img.sort_order !== undefined ? img.sort_order : images.length
                    });
                    processedUrls.add(normalizedUrl); // ✅ Marcar como procesada (normalizada)
                    console.log(`   ✅ Property image ${index + 1}:`, cleanUrl.substring(0, 60) + '...');
                } else {
                    console.log(`   ⚠️  DUPLICADO (ignorado) property_image ${index + 1}:`, cleanUrl.substring(0, 60) + '...');
                }
            }
        });

        console.log(`✅ ${property.property_images.length} imágenes de property_images procesadas`);
    }

    // 4. Ordenar por sort_order y is_main
    const sortedImages = images.sort((a, b) => {
        // Primero, imagen principal siempre arriba
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;

        // Luego, por sort_order
        return a.sort_order - b.sort_order;
    });

    console.log('╔════════════════════════════════════════════════════════');
    console.log(`║ 📊 RESULTADO FINAL: ${sortedImages.length} imágenes procesadas`);
    console.log('╠════════════════════════════════════════════════════════');
    sortedImages.forEach((img, i) => {
        console.log(`║ [${i}] is_main: ${img.is_main}, id: ${img.id}, url: ${img.url.substring(0, 60)}...`);
    });
    const mainCount = sortedImages.filter(img => img.is_main).length;
    if (mainCount > 1) {
        console.log(`║ ⚠️⚠️⚠️ PROBLEMA: ${mainCount} imágenes marcadas como principales!`);
    }
    console.log('╚════════════════════════════════════════════════════════');

    return sortedImages;
};

/**
 * Obtiene solo la imagen principal de una propiedad
 *
 * @param {object} property - Objeto de propiedad
 * @returns {object|null} Objeto de imagen principal o null
 */
export const getMainImage = (property) => {
    const images = processPropertyImages(property);
    return images.find(img => img.is_main) || images[0] || null;
};

/**
 * Obtiene la URL de la imagen principal
 *
 * @param {object} property - Objeto de propiedad
 * @returns {string|null} URL de imagen principal o null
 */
export const getMainImageUrl = (property) => {
    const mainImage = getMainImage(property);
    return mainImage ? mainImage.url : null;
};

/**
 * Verifica si una propiedad tiene imágenes
 *
 * @param {object} property - Objeto de propiedad
 * @returns {boolean} True si tiene al menos una imagen
 */
export const hasImages = (property) => {
    const images = processPropertyImages(property);
    return images.length > 0;
};

/**
 * Cuenta el total de imágenes de una propiedad
 *
 * @param {object} property - Objeto de propiedad
 * @returns {number} Cantidad de imágenes
 */
export const getImagesCount = (property) => {
    const images = processPropertyImages(property);
    return images.length;
};

/**
 * Filtra imágenes por tipo
 *
 * @param {object} property - Objeto de propiedad
 * @param {string} type - Tipo de imagen ('main', 'gallery', 'property_images')
 * @returns {Array} Array de imágenes filtradas
 */
export const getImagesByType = (property, type) => {
    const images = processPropertyImages(property);

    switch (type) {
        case 'main':
            return images.filter(img => img.is_main);
        case 'gallery':
            return images.filter(img => img.id && img.id.startsWith('gallery-'));
        case 'property_images':
            return images.filter(img => img.id && img.id.startsWith('property-image-'));
        default:
            return images;
    }
};

/**
 * Genera thumbnail URL (si se implementa CDN con thumbnails)
 * Por ahora retorna la URL original
 *
 * @param {string} imageUrl - URL de imagen original
 * @param {string} size - Tamaño del thumbnail ('small', 'medium', 'large')
 * @returns {string} URL de thumbnail
 */
export const getThumbnailUrl = (imageUrl, size = 'medium') => {
    if (!imageUrl) return null;

    // TODO: Implementar lógica de CDN/thumbnails cuando esté disponible
    // Por ejemplo: return imageUrl.replace('/original/', `/thumbnails/${size}/`);

    return imageUrl;
};

/**
 * Valida si una URL de imagen es válida
 *
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida
 */
export const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const validProtocols = ['http://', 'https://', 'data:image/'];

    const hasValidExtension = validExtensions.some(ext =>
        url.toLowerCase().includes(ext)
    );

    const hasValidProtocol = validProtocols.some(protocol =>
        url.toLowerCase().startsWith(protocol)
    );

    return hasValidExtension || hasValidProtocol;
};

/**
 * Limpia y normaliza URL de imagen
 *
 * @param {string} url - URL a limpiar
 * @returns {string|null} URL limpia o null
 */
export const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    // Remover espacios
    let cleaned = url.trim();

    // Validar si es URL válida
    if (!isValidImageUrl(cleaned)) return null;

    return cleaned;
};

/**
 * Obtiene el placeholder para cuando no hay imagen
 *
 * @param {string} propertyType - Tipo de propiedad (opcional)
 * @returns {string} URL de placeholder
 */
export const getPlaceholderImage = (propertyType = 'default') => {
    const placeholders = {
        'default': 'https://via.placeholder.com/800x600?text=Sin+Imagen',
        'casa': 'https://via.placeholder.com/800x600?text=Casa',
        'apartamento': 'https://via.placeholder.com/800x600?text=Apartamento',
        'terreno': 'https://via.placeholder.com/800x600?text=Terreno',
        'local': 'https://via.placeholder.com/800x600?text=Local+Comercial'
    };

    return placeholders[propertyType] || placeholders.default;
};
