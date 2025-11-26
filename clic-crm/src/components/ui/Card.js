import React from 'react';

const Card = ({ 
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  hover = false,
  border = true,
  className = '',
  children,
  ...props 
}) => {
  
  // Base classes
  const baseClasses = "bg-white rounded-xl overflow-hidden";
  
  // Padding variants
  const paddingClasses = {
    none: "",
    sm: "p-4",
    default: "p-6", 
    lg: "p-8",
    xl: "p-10"
  };
  
  // Shadow variants
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    default: "shadow-lg",
    lg: "shadow-xl",
    xl: "shadow-2xl"
  };
  
  // Border variants
  const borderClasses = border ? "border border-gray-100" : "";
  
  // Hover effect
  const hoverClasses = hover ? "hover:shadow-xl transition-shadow duration-300" : "";
  
  // Variant styles
  const variantClasses = {
    default: "",
    highlighted: "ring-2 ring-opacity-50",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50", 
    danger: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50"
  };
  
  // Ring color for highlighted variant
  const variantStyle = variant === 'highlighted' ? 
    { ringColor: 'rgba(224, 63, 7, 0.5)' } : 
    {};
  
  // Combine all classes
  const cardClasses = `
    ${baseClasses}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${borderClasses}
    ${hoverClasses}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div 
      className={cardClasses}
      style={variantStyle}
      {...props}
    >
      {children}
    </div>
  );
};

// Sub-componentes para estructura común
Card.Header = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-b border-gray-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div 
    className={`p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;