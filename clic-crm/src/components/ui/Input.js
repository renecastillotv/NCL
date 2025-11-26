import React from 'react';

const Input = ({ 
  type = 'text',
  size = 'default',
  variant = 'default',
  label = null,
  placeholder = '',
  error = null,
  success = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  value,
  onChange,
  ...props 
}) => {
  
  // Base classes for input
  const baseClasses = "block w-full border rounded-lg transition-colors focus:ring-2 focus:border-transparent";
  
  // Size variants
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    default: "px-4 py-3 text-sm",
    lg: "px-4 py-4 text-base"
  };
  
  // Variant classes
  const variantClasses = {
    default: "border-gray-300",
    filled: "bg-gray-50 border-gray-200"
  };
  
  // State classes
  const stateClasses = error ? 
    "border-red-300 focus:ring-red-500" : 
    success ? 
    "border-green-300 focus:ring-green-500" :
    "focus:ring-orange-500"; // CLIC brand color
  
  // Icon padding
  const iconPadding = icon ? 
    (iconPosition === 'left' ? 'pl-10' : 'pr-10') : 
    '';
  
  // Disabled state
  const disabledClasses = disabled ? 
    "bg-gray-100 text-gray-500 cursor-not-allowed" : 
    "";
  
  // Combine all classes
  const inputClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${stateClasses}
    ${iconPadding}
    ${disabledClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Focus ring color style
  const focusStyle = !error && !success ? 
    { '--tw-ring-color': '#e03f07' } : 
    {};

  return (
    <div className={`${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {icon}
            </span>
          </div>
        )}
        
        {/* Input field */}
        <input
          type={type}
          className={inputClasses}
          style={focusStyle}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...props}
        />
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {icon}
            </span>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {/* Success message */}
      {success && typeof success === 'string' && (
        <p className="mt-2 text-sm text-green-600">
          {success}
        </p>
      )}
    </div>
  );
};

// Search Input variant
Input.Search = ({ onSearch, ...props }) => {
  return (
    <Input
      type="text"
      placeholder="Buscar..."
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      iconPosition="left"
      onChange={(e) => onSearch && onSearch(e.target.value)}
      {...props}
    />
  );
};

// Select variant
Input.Select = ({ options = [], children, className = '', ...props }) => {
  const selectClasses = `
    block w-full px-4 py-3 text-sm border border-gray-300 rounded-lg 
    focus:ring-2 focus:border-transparent transition-colors
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  const focusStyle = { '--tw-ring-color': '#e03f07' };

  return (
    <select 
      className={selectClasses}
      style={focusStyle}
      {...props}
    >
      {children || options.map((option, index) => (
        <option key={index} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  );
};

// Textarea variant
Input.Textarea = ({ rows = 3, className = '', ...props }) => {
  const textareaClasses = `
    block w-full px-4 py-3 text-sm border border-gray-300 rounded-lg 
    focus:ring-2 focus:border-transparent transition-colors resize-vertical
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  const focusStyle = { '--tw-ring-color': '#e03f07' };

  return (
    <textarea 
      rows={rows}
      className={textareaClasses}
      style={focusStyle}
      {...props}
    />
  );
};

export default Input;