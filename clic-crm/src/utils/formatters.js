/**
 * Utilidades de Formateo - CLIC CRM
 *
 * Funciones comunes para formatear datos
 * Extraídas de: ArticleEditor.js, FAQEditor.js, PropertyEditModal.js, y otros
 *
 * Uso:
 *   import { formatPrice, formatDate, formatPhone } from '../utils/formatters';
 *   const price = formatPrice(150000, 'USD'); // "$150,000"
 */

/**
 * Formatea precios con símbolo de moneda
 * @param {number} price - Precio a formatear
 * @param {string} currency - Código de moneda (USD, DOP, EUR)
 * @returns {string|null} Precio formateado o null si es 0
 */
export const formatPrice = (price, currency = 'USD') => {
  if (!price || price === 0) return null;

  const symbols = {
    'USD': '$',
    'DOP': 'RD$',
    'EUR': '€',
    'MXN': 'MX$',
    'COP': 'COL$'
  };

  const symbol = symbols[currency] || currency;
  const formattedPrice = new Intl.NumberFormat('en-US').format(price);

  return `${symbol}${formattedPrice}`;
};

/**
 * Obtiene el precio principal de una propiedad
 * Prioridad: Venta > Renta > Renta temporal
 * @param {object} property - Objeto propiedad con sale_price, rental_price, etc.
 * @returns {string|null} Precio formateado con tipo
 */
export const getMainPrice = (property) => {
  if (property.sale_price && property.sale_price > 0) {
    return formatPrice(property.sale_price, property.sale_currency);
  }
  if (property.rental_price && property.rental_price > 0) {
    return formatPrice(property.rental_price, property.rental_currency) + '/mes';
  }
  if (property.temp_rental_price && property.temp_rental_price > 0) {
    return formatPrice(property.temp_rental_price, property.temp_rental_currency) + '/día';
  }
  return null;
};

/**
 * Formatea fechas de manera legible
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - 'short' | 'long' | 'relative'
 * @param {string} locale - Locale para formateo (default: 'es-DO')
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, format = 'short', locale = 'es-DO') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Fecha inválida';

  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' }
  };

  return new Intl.DateTimeFormat(locale, options[format] || options.short).format(dateObj);
};

/**
 * Formatea fecha relativa (hace 2 días, hace 3 horas, etc.)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha relativa
 */
export const formatRelativeDate = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) !== 1 ? 's' : ''}`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) !== 1 ? 'es' : ''}`;

  return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) !== 1 ? 's' : ''}`;
};

/**
 * Formatea números de teléfono
 * @param {string} phone - Número de teléfono
 * @param {string} countryCode - Código de país ('DOM', 'USA', 'MEX')
 * @returns {string} Teléfono formateado
 */
export const formatPhone = (phone, countryCode = 'DOM') => {
  if (!phone) return '';

  // Eliminar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');

  const formats = {
    DOM: (num) => {
      // Formato: (809) 555-1234
      if (num.length === 10) {
        return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
      }
      return num;
    },
    USA: (num) => {
      // Formato: (555) 123-4567
      if (num.length === 10) {
        return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
      }
      return num;
    },
    MEX: (num) => {
      // Formato: 55 1234 5678
      if (num.length === 10) {
        return `${num.slice(0, 2)} ${num.slice(2, 6)} ${num.slice(6)}`;
      }
      return num;
    }
  };

  const formatter = formats[countryCode] || formats.DOM;
  return formatter(cleaned);
};

/**
 * Formatea porcentajes
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Porcentaje formateado
 */
export const formatPercent = (value, decimals = 0) => {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatea metros cuadrados
 * @param {number} value - Valor en m²
 * @returns {string} Metros cuadrados formateados
 */
export const formatSquareMeters = (value) => {
  if (!value) return '';
  return `${new Intl.NumberFormat('en-US').format(value)} m²`;
};

/**
 * Trunca texto con elipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Formatea nombres completos
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} Nombre completo formateado
 */
export const formatFullName = (firstName, lastName) => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ').trim();
};

/**
 * Formatea números con separadores de miles
 * @param {number} value - Número a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (value) => {
  if (typeof value !== 'number') return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Formatea file size (bytes a KB, MB, GB)
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Genera iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales (máximo 2 letras)
 */
export const getInitials = (name) => {
  if (!name) return '';

  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formatea área (alias de formatSquareMeters para compatibilidad)
 * @param {number} area - Área en m²
 * @returns {string} Área formateada
 */
export const formatArea = (area) => {
  if (!area) return '';
  return `${area} m²`;
};

/**
 * Formatea fecha como "hace X tiempo" (alias de formatRelativeDate)
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} - La fecha formateada
 */
export const formatTimeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return '1 día';
  if (diffInDays < 30) return `${diffInDays} días`;
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 mes' : `${months} meses`;
  }
  const years = Math.floor(diffInDays / 365);
  return years === 1 ? '1 año' : `${years} años`;
};
