import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Componente Toast para Notificaciones
 *
 * Muestra notificaciones temporales estilo toast
 * Trabaja junto con el hook useNotification
 *
 * @param {object} notification - Objeto de notificación { message, type, id }
 * @param {function} onClose - Callback al cerrar
 * @param {string} position - Posición: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 *
 * @example
 * import { useNotification } from '../hooks/useNotification';
 * import { Toast } from '../ui/Toast';
 *
 * const MyComponent = () => {
 *   const { notification, showSuccess, clearNotification } = useNotification();
 *
 *   return (
 *     <>
 *       <button onClick={() => showSuccess('Guardado!')}>Guardar</button>
 *       <Toast notification={notification} onClose={clearNotification} />
 *     </>
 *   );
 * };
 */
export const Toast = ({ notification, onClose, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [notification]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onClose();
    }, 300); // Duración de la animación
  };

  if (!notification || !isVisible) return null;

  const types = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800',
      iconClassName: 'text-green-500'
    },
    error: {
      icon: XCircle,
      className: 'bg-red-50 border-red-200 text-red-800',
      iconClassName: 'text-red-500'
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClassName: 'text-yellow-500'
    },
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClassName: 'text-blue-500'
    }
  };

  const config = types[notification.type] || types.info;
  const Icon = config.icon;

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  return (
    <div
      className={`fixed ${positions[position]} z-50 max-w-md w-full px-4 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${config.className}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconClassName}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {notification.message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Componente ToastContainer - Para múltiples toasts
 *
 * Permite mostrar varios toasts apilados
 *
 * @example
 * const [notifications, setNotifications] = useState([]);
 *
 * <ToastContainer notifications={notifications} onClose={(id) => removeNotification(id)} />
 */
export const ToastContainer = ({ notifications = [], onClose, position = 'top-right' }) => {
  if (!notifications || notifications.length === 0) return null;

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positions[position]} z-50 flex flex-col gap-2 max-w-md w-full px-4`}>
      {notifications.map((notification, index) => (
        <Toast
          key={notification.id || index}
          notification={notification}
          onClose={() => onClose(notification.id || index)}
          position="relative" // Override position for stacked toasts
        />
      ))}
    </div>
  );
};

export default Toast;
