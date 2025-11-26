import { useState, useCallback } from 'react';

/**
 * Hook useNotification - Sistema de notificaciones toast
 *
 * Reemplaza el patrón repetido en 15+ componentes de:
 * - useState para error/success
 * - setTimeout para limpiar mensajes
 * - JSX duplicado para mostrar alertas
 *
 * @returns {object} Funciones y estado de notificaciones
 *
 * @example
 * const { notification, showSuccess, showError, showWarning } = useNotification();
 *
 * const handleSave = async () => {
 *   try {
 *     await saveData();
 *     showSuccess('Guardado exitosamente');
 *   } catch (err) {
 *     showError('Error al guardar: ' + err.message);
 *   }
 * };
 *
 * // Renderizar el Toast
 * <Toast notification={notification} onClose={clearNotification} />
 */
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  /**
   * Muestra una notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Duración en ms (0 = no auto-close)
   */
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();

    setNotification({
      id,
      message,
      type,
      timestamp: new Date()
    });

    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => prev?.id === id ? null : prev);
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message, duration = 3000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 5000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 4000) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 3000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification,
  };
};

export default useNotification;
