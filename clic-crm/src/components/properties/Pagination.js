import React from 'react';
import { Button } from '../ui';

/**
 * Componente de paginación
 * Maneja la navegación entre páginas de resultados
 */
const Pagination = ({
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange
}) => {
    // No mostrar paginación si solo hay una página
    if (totalPages <= 1) {
        return null;
    }

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        onPageChange(page);
    };

    return (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-700">
                Mostrando {startItem} a {endItem} de {totalCount} propiedades
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={handlePrevious}
                >
                    Anterior
                </Button>

                <div className="flex space-x-1">
                    {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;

                        // Mostrar: primera página, última página, y páginas cercanas a la actual
                        if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageClick(page)}
                                    className="min-w-[2.5rem]"
                                >
                                    {page}
                                </Button>
                            );
                        } else if (
                            page === currentPage - 3 ||
                            page === currentPage + 3
                        ) {
                            // Mostrar elipsis para indicar páginas ocultas
                            return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={handleNext}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
