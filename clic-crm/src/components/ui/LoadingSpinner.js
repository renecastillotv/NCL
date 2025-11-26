import React from 'react';

/**
 * LoadingSpinner - Componente de carga único para CLIC CRM
 *
 * Diseños disponibles:
 * - 'pulse': Efecto de pulso con múltiples barras (moderno)
 * - 'dots': Tres puntos que saltan (minimalista)
 * - 'bars': Barras ondulantes (elegante)
 * - 'square': Cuadrados giratorios (único)
 */

export const LoadingSpinner = ({
    variant = 'pulse',
    size = 'md',
    text = 'Cargando...',
    color = 'orange'
}) => {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    const colors = {
        orange: 'bg-orange-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        gray: 'bg-gray-500'
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    const colorClass = colors[color] || colors.orange;
    const sizeClass = sizes[size] || sizes.md;
    const textSizeClass = textSizes[size] || textSizes.md;

    // Estilo 1: Pulse Bars (Barras con efecto pulse)
    if (variant === 'pulse') {
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="flex space-x-2">
                    <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`} style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                    <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`} style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                    <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`} style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                    <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`} style={{ animationDelay: '450ms', animationDuration: '1s' }}></div>
                </div>
                {text && (
                    <p className={`text-gray-600 mt-4 ${textSizeClass}`}>{text}</p>
                )}
            </div>
        );
    }

    // Estilo 2: Bouncing Dots (Puntos que saltan)
    if (variant === 'dots') {
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="flex space-x-3">
                    <div
                        className={`w-3 h-3 ${colorClass} rounded-full`}
                        style={{
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.32s'
                        }}
                    ></div>
                    <div
                        className={`w-3 h-3 ${colorClass} rounded-full`}
                        style={{
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.16s'
                        }}
                    ></div>
                    <div
                        className={`w-3 h-3 ${colorClass} rounded-full`}
                        style={{
                            animation: 'bounce 1.4s infinite ease-in-out both'
                        }}
                    ></div>
                </div>
                {text && (
                    <p className={`text-gray-600 mt-4 ${textSizeClass}`}>{text}</p>
                )}
                <style jsx>{`
                    @keyframes bounce {
                        0%, 80%, 100% {
                            transform: scale(0);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Estilo 3: Wave Bars (Barras ondulantes)
    if (variant === 'bars') {
        const barHeights = size === 'sm' ? [16, 24, 20, 28, 24] :
                          size === 'lg' ? [32, 48, 40, 56, 48] :
                          [24, 36, 30, 42, 36];

        return (
            <div className="flex flex-col items-center justify-center">
                <div className="flex items-end space-x-1.5">
                    {barHeights.map((height, index) => (
                        <div
                            key={index}
                            className={`w-2 ${colorClass} rounded-full`}
                            style={{
                                height: `${height}px`,
                                animation: 'wave 1.2s ease-in-out infinite',
                                animationDelay: `${index * 0.1}s`
                            }}
                        ></div>
                    ))}
                </div>
                {text && (
                    <p className={`text-gray-600 mt-4 ${textSizeClass}`}>{text}</p>
                )}
                <style jsx>{`
                    @keyframes wave {
                        0%, 100% {
                            transform: scaleY(0.5);
                            opacity: 0.7;
                        }
                        50% {
                            transform: scaleY(1);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Estilo 4: Rotating Squares (Cuadrados giratorios - ÚNICO)
    if (variant === 'square') {
        return (
            <div className="flex flex-col items-center justify-center">
                <div className={`relative ${sizeClass}`}>
                    <div
                        className={`absolute inset-0 ${colorClass} rounded-lg`}
                        style={{
                            animation: 'rotateSquare1 2s infinite ease-in-out'
                        }}
                    ></div>
                    <div
                        className={`absolute inset-2 bg-orange-400 rounded-lg`}
                        style={{
                            animation: 'rotateSquare2 2s infinite ease-in-out',
                            animationDelay: '-0.5s'
                        }}
                    ></div>
                    <div
                        className={`absolute inset-4 bg-orange-300 rounded-lg`}
                        style={{
                            animation: 'rotateSquare1 2s infinite ease-in-out',
                            animationDelay: '-1s'
                        }}
                    ></div>
                </div>
                {text && (
                    <p className={`text-gray-600 mt-6 ${textSizeClass}`}>{text}</p>
                )}
                <style jsx>{`
                    @keyframes rotateSquare1 {
                        0%, 100% {
                            transform: rotate(0deg) scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: rotate(180deg) scale(0.8);
                            opacity: 0.7;
                        }
                    }
                    @keyframes rotateSquare2 {
                        0%, 100% {
                            transform: rotate(0deg) scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: rotate(-180deg) scale(0.8);
                            opacity: 0.7;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex space-x-2">
                <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`}></div>
                <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`}></div>
                <div className={`w-2 ${sizeClass} ${colorClass} rounded-full animate-pulse`}></div>
            </div>
            {text && (
                <p className={`text-gray-600 mt-4 ${textSizeClass}`}>{text}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
