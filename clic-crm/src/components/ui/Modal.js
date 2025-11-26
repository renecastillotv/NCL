import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Componente Modal Base Reutilizable
 *
 * Reemplaza el patrón de overlay + container duplicado en 20+ componentes
 *
 * @param {boolean} isOpen - Controla visibilidad del modal
 * @param {function} onClose - Callback al cerrar
 * @param {string} title - Título del modal (opcional)
 * @param {ReactNode} children - Contenido del modal
 * @param {ReactNode} footer - Contenido del footer (opcional)
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} showCloseButton - Mostrar botón X
 * @param {boolean} closeOnOverlayClick - Cerrar al hacer click fuera
 * @param {boolean} closeOnEscape - Cerrar con tecla Escape
 * @param {string} className - Clases adicionales para el container
 *
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Seleccionar Usuario"
 *   size="lg"
 * >
 *   <div className="p-6">
 *     Contenido aquí
 *   </div>
 * </Modal>
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-8',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevenir que clicks internos cierren el modal
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b">
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
