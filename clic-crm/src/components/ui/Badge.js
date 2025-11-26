import React from 'react';

const Badge = ({ 
  variant = 'default',
  size = 'default',
  icon = null,
  children,
  className = '',
  ...props 
}) => {
  
  // Base classes
  const baseClasses = "inline-flex items-center font-medium rounded-full";
  
  // Size variants
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    default: "px-2 py-1 text-xs", 
    lg: "px-3 py-1.5 text-sm"
  };
  
  // Color variants
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    
    // Status variants
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800", 
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    
    // Priority variants
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
    
    // Custom CLIC variant
    primary: "text-white",
    
    // Activity status
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    
    // Request types
    compra: "bg-blue-100 text-blue-800",
    alquiler: "bg-purple-100 text-purple-800",
    
    // Process status
    proceso: "bg-yellow-100 text-yellow-800",
    cerrado: "bg-green-100 text-green-800",
    revision: "bg-orange-100 text-orange-800"
  };
  
  // Primary variant special styling
  const primaryStyle = variant === 'primary' ? 
    { background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' } : 
    {};
  
  // Combine all classes
  const badgeClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant] || variantClasses.default}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span 
      className={badgeClasses}
      style={primaryStyle}
      {...props}
    >
      {icon && (
        <span className="mr-1">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

// Utilidades de estado predefinidas
Badge.Status = ({ status, ...props }) => {
  const statusMap = {
    'Activo': 'active',
    'Inactivo': 'inactive', 
    'Pendiente': 'pending',
    'En Proceso': 'proceso',
    'Cerrado': 'cerrado',
    'En Revisión': 'revision'
  };
  
  return (
    <Badge variant={statusMap[status] || 'default'} {...props}>
      {status}
    </Badge>
  );
};

Badge.Priority = ({ priority, ...props }) => {
  const priorityMap = {
    'Alta': 'high',
    'Media': 'medium',
    'Baja': 'low'
  };
  
  return (
    <Badge variant={priorityMap[priority] || 'default'} {...props}>
      {priority}
    </Badge>
  );
};

Badge.Type = ({ type, ...props }) => {
  const typeMap = {
    'Compra': 'compra',
    'Alquiler': 'alquiler'
  };
  
  return (
    <Badge variant={typeMap[type] || 'default'} {...props}>
      {type}
    </Badge>
  );
};

export default Badge;