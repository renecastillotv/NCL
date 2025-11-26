// UI Components Barrel Export
// Este archivo permite importar todos los componentes desde un solo lugar

export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Input } from './Input';
export { default as Table } from './Table';
export { Modal } from './Modal';
export { Toast, ToastContainer } from './Toast';

// Re-export individual components for specific use cases
export { default as UI } from './UI';

// También puedes exportar utilidades o constantes relacionadas
export const UI_CONSTANTS = {
  colors: {
    primary: '#e03f07',
    primaryHover: '#c73307',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6'
  },
  shadows: {
    card: 'shadow-lg',
    cardHover: 'hover:shadow-xl'
  },
  spacing: {
    section: 'space-y-6',
    cardPadding: 'p-6'
  }
};

// Utilidades comunes
export const commonClasses = {
  // Layout
  pageContainer: "space-y-6",
  sectionHeader: "flex justify-between items-center",
  statsGrid: "grid grid-cols-1 md:grid-cols-4 gap-6",
  
  // Cards
  statCard: "bg-white p-6 rounded-xl shadow-lg border border-gray-100",
  contentCard: "bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden",
  
  // Headers
  pageTitle: "text-2xl font-bold text-gray-900",
  pageSubtitle: "text-gray-600",
  sectionTitle: "text-lg font-semibold text-gray-900",
  
  // Filters
  filtersContainer: "bg-white rounded-xl shadow-lg border border-gray-100 p-6",
  filtersRow: "flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4",
  
  // Tables
  tableContainer: "bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden",
  tableHeader: "p-6 border-b border-gray-200",
  
  // Pagination
  paginationContainer: "bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between",
  paginationInfo: "text-sm text-gray-500",
  paginationButtons: "flex space-x-2"
};