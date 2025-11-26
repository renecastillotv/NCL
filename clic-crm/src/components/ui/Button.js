import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  children, 
  onClick,
  className = '',
  ...props 
}) => {
  
  // Base classes
  const baseClasses = "font-medium rounded-lg transition-all duration-200 flex items-center justify-center";
  
  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };
  
  // Variant styles
  const variants = {
    primary: {
      className: "text-white hover:opacity-90 disabled:opacity-50",
      style: { background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }
    },
    secondary: {
      className: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50",
      style: {}
    },
    outline: {
      className: "border-2 bg-transparent hover:bg-gray-50 disabled:opacity-50",
      style: { 
        borderColor: '#e03f07', 
        color: '#e03f07' 
      }
    },
    ghost: {
      className: "bg-transparent hover:bg-gray-100 disabled:opacity-50",
      style: { color: '#e03f07' }
    },
    danger: {
      className: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
      style: {}
    },
    success: {
      className: "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50", 
      style: {}
    }
  };
  
  const variantConfig = variants[variant] || variants.primary;
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantConfig.className}
    ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonClasses}
      style={variantConfig.style}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
      )}
      
      {icon && !loading && (
        <span className="mr-2">
          {icon}
        </span>
      )}
      
      {children}
    </button>
  );
};

export default Button;