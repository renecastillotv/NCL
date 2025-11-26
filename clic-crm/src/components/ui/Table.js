import React from 'react';

const Table = ({ 
  variant = 'default',
  size = 'default', 
  striped = false,
  hoverable = true,
  bordered = false,
  className = '',
  children,
  ...props 
}) => {
  
  // Base classes
  const baseClasses = "min-w-full divide-y divide-gray-200";
  
  // Variant classes
  const variantClasses = {
    default: "",
    compact: "text-sm"
  };
  
  // Border classes
  const borderClasses = bordered ? "border border-gray-200" : "";
  
  // Combine classes
  const tableClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${borderClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses} {...props}>
        {children}
      </table>
    </div>
  );
};

// Table Head component
Table.Head = ({ children, className = '', ...props }) => (
  <thead className={`bg-gray-50 ${className}`} {...props}>
    {children}
  </thead>
);

// Table Header Cell component
Table.Th = ({ 
  children, 
  sortable = false, 
  sorted = null, // 'asc', 'desc', null
  onSort = null,
  className = '',
  ...props 
}) => {
  const baseClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const sortableClasses = sortable ? "cursor-pointer hover:bg-gray-100 select-none" : "";
  
  const handleClick = () => {
    if (sortable && onSort) {
      const nextSort = sorted === 'asc' ? 'desc' : 'asc';
      onSort(nextSort);
    }
  };

  return (
    <th 
      className={`${baseClasses} ${sortableClasses} ${className}`}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <span className="flex flex-col">
            <svg 
              className={`w-3 h-3 ${sorted === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg 
              className={`w-3 h-3 ${sorted === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
};

// Table Body component
Table.Body = ({ striped = false, hoverable = true, children, className = '', ...props }) => {
  const bodyClasses = `bg-white divide-y divide-gray-200 ${className}`;
  
  return (
    <tbody className={bodyClasses} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            striped: striped && index % 2 === 1,
            hoverable
          });
        }
        return child;
      })}
    </tbody>
  );
};

// Table Row component
Table.Tr = ({ 
  striped = false, 
  hoverable = true, 
  selected = false,
  onClick = null,
  children, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "transition-colors";
  const stripedClasses = striped ? "bg-gray-50" : "";
  const hoverClasses = hoverable ? "hover:bg-gray-50" : "";
  const selectedClasses = selected ? "bg-orange-50" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  const rowClasses = `
    ${baseClasses}
    ${stripedClasses}
    ${hoverClasses}
    ${selectedClasses}
    ${clickableClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <tr className={rowClasses} onClick={onClick} {...props}>
      {children}
    </tr>
  );
};

// Table Data Cell component
Table.Td = ({ 
  children, 
  align = 'left',
  className = '',
  ...props 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  };
  
  const cellClasses = `px-6 py-4 whitespace-nowrap text-sm ${alignClasses[align]} ${className}`;

  return (
    <td className={cellClasses} {...props}>
      {children}
    </td>
  );
};

// Table Footer component (para paginación)
Table.Footer = ({ children, className = '', ...props }) => (
  <div className={`bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

// Checkbox cell component
Table.CheckboxCell = ({ checked = false, onChange = null, ...props }) => (
  <Table.Td {...props}>
    <input 
      type="checkbox" 
      className="rounded focus:ring-2 focus:ring-orange-500" 
      checked={checked}
      onChange={onChange}
    />
  </Table.Td>
);

// Avatar cell component (para usuarios)
Table.AvatarCell = ({ name, email = null, avatarUrl = null, ...props }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <Table.Td {...props}>
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
             style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{name}</div>
          {email && <div className="text-sm text-gray-500">{email}</div>}
        </div>
      </div>
    </Table.Td>
  );
};

// Actions cell component
Table.ActionsCell = ({ actions = [], ...props }) => (
  <Table.Td {...props}>
    <div className="flex space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`p-1 transition-colors ${action.className || 'text-gray-400 hover:text-gray-600'}`}
          title={action.title}
        >
          {action.icon}
        </button>
      ))}
    </div>
  </Table.Td>
);

export default Table;