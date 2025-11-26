import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

// Clases comunes
export const commonClasses = {
    button: {
        base: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200",
        primary: "text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:ring-orange-500",
        secondary: "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500",
        outline: "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        ghost: "text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500",
        sizes: {
            sm: "px-3 py-1.5 text-sm",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base"
        }
    },
    input: {
        base: "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm",
        error: "border-red-300 focus:ring-red-500 focus:border-red-500"
    },
    card: {
        base: "bg-white shadow-sm rounded-lg border border-gray-200",
        header: "px-6 py-4 border-b border-gray-200",
        body: "px-6 py-4"
    }
};

// Componente Button
export const Button = ({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    className = '',
    disabled = false,
    ...props
}) => {
    const baseClass = commonClasses.button.base;
    const variantClass = commonClasses.button[variant] || commonClasses.button.primary;
    const sizeClass = commonClasses.button.sizes[size] || commonClasses.button.sizes.md;

    const classes = `${baseClass} ${variantClass} ${sizeClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`.trim();

    return (
        <button
            className={classes}
            disabled={disabled}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

// Componente Input
export const Input = ({
    type = 'text',
    error = false,
    className = '',
    icon,
    ...props
}) => {
    const baseClass = commonClasses.input.base;
    const errorClass = error ? commonClasses.input.error : '';
    const classes = `${baseClass} ${errorClass} ${className}`.trim();

    if (icon) {
        return (
            <div className="relative">
                <input
                    type={type}
                    className={`${classes} pl-10`}
                    {...props}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {icon}
                </div>
            </div>
        );
    }

    return (
        <input
            type={type}
            className={classes}
            {...props}
        />
    );
};

// Componente Input.Search
Input.Search = ({
    placeholder = 'Buscar...',
    value,
    onSearch,
    className = '',
    ...props
}) => {
    return (
        <div className={`relative ${className}`}>
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onSearch?.(e.target.value)}
                icon={<Search className="w-4 h-4 text-gray-400" />}
                {...props}
            />
        </div>
    );
};

// Componente Input.Select
Input.Select = ({
    options = [],
    placeholder = 'Seleccionar...',
    className = '',
    ...props
}) => {
    return (
        <div className={`relative ${className}`}>
            <select
                className={`${commonClasses.input.base} appearance-none pr-10`}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
        </div>
    );
};

// Componente Card
export const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`${commonClasses.card.base} ${className}`} {...props}>
            {children}
        </div>
    );
};

Card.Header = ({ children, className = '', ...props }) => {
    return (
        <div className={`${commonClasses.card.header} ${className}`} {...props}>
            {children}
        </div>
    );
};

Card.Body = ({ children, className = '', ...props }) => {
    return (
        <div className={`${commonClasses.card.body} ${className}`} {...props}>
            {children}
        </div>
    );
};

// Componente Badge
export const Badge = ({
    variant = 'default',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-orange-100 text-orange-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base'
    };

    const variantClass = variants[variant] || variants.default;
    const sizeClass = sizes[size] || sizes.md;

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

// Badge.Status - Para estados específicos de propiedades
Badge.Status = ({ status, className = '', ...props }) => {
    const statusConfig = {
        'Publicada': { variant: 'success', text: 'Publicada' },
        'Pre-venta': { variant: 'info', text: 'Pre-venta' },
        'Vendida': { variant: 'danger', text: 'Vendida' },
        'Reservada': { variant: 'warning', text: 'Reservada' },
        'Suspendida': { variant: 'default', text: 'Suspendida' },
        'Borrador': { variant: 'secondary', text: 'Borrador' }
    };

    const config = statusConfig[status] || { variant: 'default', text: status || 'Sin Estado' };

    return (
        <Badge variant={config.variant} className={className} {...props}>
            {config.text}
        </Badge>
    );
};

// Componente Table
export const Table = ({ children, className = '', ...props }) => {
    return (
        <div className="overflow-x-auto">
            <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
};

Table.Header = ({ children, className = '', ...props }) => {
    return (
        <thead className={`bg-gray-50 ${className}`} {...props}>
            {children}
        </thead>
    );
};

Table.Body = ({ children, className = '', ...props }) => {
    return (
        <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
            {children}
        </tbody>
    );
};

Table.Row = ({ children, className = '', ...props }) => {
    return (
        <tr className={className} {...props}>
            {children}
        </tr>
    );
};

Table.HeaderCell = ({ children, className = '', ...props }) => {
    return (
        <th
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
            {...props}
        >
            {children}
        </th>
    );
};

Table.Cell = ({ children, className = '', ...props }) => {
    return (
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} {...props}>
            {children}
        </td>
    );
};

// Componente Modal (básico)
export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    size = 'md'
}) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    const sizeClass = sizes[size] || sizes.md;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClass} w-full ${className}`}>
                    {title && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                        </div>
                    )}
                    <div className="px-6 py-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// EXPORTACIÓN DEFAULT - Solo una vez al final
export default {
    Button,
    Input,
    Card,
    Badge,
    Table,
    Modal,
    commonClasses
};