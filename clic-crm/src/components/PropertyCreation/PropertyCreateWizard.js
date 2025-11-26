import React from 'react';

const PropertyCreateModal = ({ isOpen, onClose }) => {
    console.log('🟢 MODAL RENDERIZADO - isOpen:', isOpen);

    if (!isOpen) {
        console.log('🔴 Modal cerrado, no renderizando');
        return null;
    }

    console.log('🟢 Modal abierto, renderizando contenido');

    return (
        <div
            className="fixed inset-0 bg-red-500 flex items-center justify-center"
            style={{ zIndex: 9999 }}
        >
            <div className="bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold mb-4">TEST MODAL</h1>
                <p className="mb-4">Si ves esto, el modal funciona!</p>
                <button
                    onClick={() => {
                        console.log('🟢 Botón cerrar clickeado');
                        onClose();
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default PropertyCreateModal;