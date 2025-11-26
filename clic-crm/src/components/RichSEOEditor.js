import React, { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, Link, List, ListOrdered, Heading, 
    Eye, Code, MapPin, Home, ExternalLink, Zap
} from 'lucide-react';
import { Button, Card } from './ui';

// Componente Editor Rico para Contenido SEO
const RichSEOEditor = ({ value, onChange, placeholder, cities = [], propertyTypes = [] }) => {
    const [content, setContent] = useState(value || '');
    const [showPreview, setShowPreview] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const editorRef = useRef(null);
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

    useEffect(() => {
        if (onChange) {
            onChange(content);
        }
    }, [content, onChange]);

    // Sincronizar con el valor externo
    useEffect(() => {
        if (value !== content) {
            setContent(value || '');
        }
    }, [value]);

    // Funciones de formateo
    const applyFormat = (format) => {
        const textarea = editorRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        let formattedText = '';
        let newCursorPos = start;

        switch (format) {
            case 'bold':
                formattedText = `<strong>${selectedText || 'texto en negrita'}</strong>`;
                newCursorPos = start + (selectedText ? 9 : 9); // length of '<strong>'
                break;
            case 'italic':
                formattedText = `<em>${selectedText || 'texto en cursiva'}</em>`;
                newCursorPos = start + (selectedText ? 4 : 4); // length of '<em>'
                break;
            case 'link':
                const url = prompt('Ingresa la URL:');
                if (url) {
                    formattedText = `<a href="${url}">${selectedText || 'texto del enlace'}</a>`;
                    newCursorPos = start + formattedText.length;
                }
                break;
            case 'h2':
                formattedText = `<h2>${selectedText || 'Título H2'}</h2>`;
                newCursorPos = start + 4; // length of '<h2>'
                break;
            case 'h3':
                formattedText = `<h3>${selectedText || 'Título H3'}</h3>`;
                newCursorPos = start + 4; // length of '<h3>'
                break;
            case 'ul':
                formattedText = `<ul>\n<li>${selectedText || 'Elemento de lista'}</li>\n</ul>`;
                newCursorPos = start + 9; // length of '<ul>\n<li>'
                break;
            case 'ol':
                formattedText = `<ol>\n<li>${selectedText || 'Elemento numerado'}</li>\n</ol>`;
                newCursorPos = start + 9; // length of '<ol>\n<li>'
                break;
            default:
                return;
        }

        if (formattedText) {
            const newContent = content.substring(0, start) + formattedText + content.substring(end);
            setContent(newContent);
            
            // Restaurar posición del cursor
            setTimeout(() => {
                textarea.selectionStart = newCursorPos;
                textarea.selectionEnd = newCursorPos;
                textarea.focus();
            }, 0);
        }
    };

    // Funciones de auto-enlaces
    const createLocationLink = (location) => {
        const slug = location.toLowerCase().replace(/\s+/g, '-');
        return `<a href="/ubicaciones/${slug}" class="location-link">${location}</a>`;
    };

    const createPropertyTypeLink = (type) => {
        const slug = type.toLowerCase().replace(/\s+/g, '-');
        return `<a href="/tipos/${slug}" class="property-type-link">${type}</a>`;
    };

    // Detectar y sugerir auto-enlaces
    const detectAutoLinks = (text) => {
        const suggestions = [];
        
        // Detectar ciudades
        cities.forEach(city => {
            const cityName = city.value || city.name || city.label || city;
            if (typeof cityName === 'string' && cityName.length > 0) {
                const regex = new RegExp(`\\b${cityName}\\b`, 'gi');
                if (regex.test(text) && !text.includes(`href="/ubicaciones/${cityName.toLowerCase().replace(/\s+/g, '-')}`)) {
                    suggestions.push({
                        type: 'location',
                        text: cityName,
                        action: () => autoReplaceText(cityName, createLocationLink(cityName))
                    });
                }
            }
        });

        // Detectar tipos de propiedades
        propertyTypes.forEach(type => {
            if (typeof type === 'string' && type.length > 0) {
                const regex = new RegExp(`\\b${type}\\b`, 'gi');
                if (regex.test(text) && !text.includes(`href="/tipos/${type.toLowerCase().replace(/\s+/g, '-')}`)) {
                    suggestions.push({
                        type: 'property',
                        text: type,
                        action: () => autoReplaceText(type, createPropertyTypeLink(type))
                    });
                }
            }
        });

        return suggestions;
    };

    const autoReplaceText = (searchText, replacement) => {
        const regex = new RegExp(`\\b${searchText}\\b`, 'gi');
        const newContent = content.replace(regex, replacement);
        setContent(newContent);
        setShowSuggestions(false);
    };

    // Verificar sugerencias cuando cambie el contenido
    useEffect(() => {
        if (content.trim().length > 0) {
            const suggestions = detectAutoLinks(content);
            setSuggestions(suggestions.slice(0, 5)); // Máximo 5 sugerencias
        } else {
            setSuggestions([]);
        }
    }, [content, cities, propertyTypes]);

    // Función para limpiar HTML para preview
    const getPlainText = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    // Contar palabras y caracteres
    const stats = {
        words: getPlainText(content).split(/\s+/).filter(word => word.length > 0).length,
        chars: content.length,
        charsNoSpaces: content.replace(/\s/g, '').length
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-t-lg">
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('bold')}
                        title="Negrita (Ctrl+B)"
                        className="hover:bg-gray-200"
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('italic')}
                        title="Cursiva (Ctrl+I)"
                        className="hover:bg-gray-200"
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('link')}
                        title="Enlace (Ctrl+K)"
                        className="hover:bg-gray-200"
                    >
                        <Link className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('h2')}
                        title="Título H2"
                        className="hover:bg-gray-200"
                    >
                        <Heading className="w-4 h-4" />
                        <span className="text-xs ml-1">H2</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('h3')}
                        title="Título H3"
                        className="hover:bg-gray-200"
                    >
                        <Heading className="w-4 h-4" />
                        <span className="text-xs ml-1">H3</span>
                    </Button>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('ul')}
                        title="Lista con viñetas"
                        className="hover:bg-gray-200"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat('ol')}
                        title="Lista numerada"
                        className="hover:bg-gray-200"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    title="Vista previa"
                    className="hover:bg-gray-200"
                >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs ml-1">{showPreview ? 'Editor' : 'Preview'}</span>
                </Button>

                {suggestions.length > 0 && (
                    <>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Zap className="w-4 h-4 mr-1" />
                            <span className="text-xs">{suggestions.length} sugerencias SEO</span>
                        </Button>
                    </>
                )}
            </div>

            {/* Sugerencias de auto-enlaces */}
            {showSuggestions && suggestions.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Sugerencias de Enlaces SEO
                    </h4>
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                    {suggestion.type === 'location' ? (
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Home className="w-4 h-4 text-green-600" />
                                    )}
                                    <span className="text-sm">
                                        Convertir "<strong>{suggestion.text}</strong>" en enlace
                                        {suggestion.type === 'location' ? ' de ubicación' : ' de tipo de propiedad'}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={suggestion.action}
                                    className="text-xs"
                                >
                                    Aplicar
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(false)}
                        className="mt-2 text-gray-500"
                    >
                        Cerrar sugerencias
                    </Button>
                </Card>
            )}

            {/* Editor / Preview */}
            <div className="relative">
                {showPreview ? (
                    <div className="min-h-[300px] p-4 border border-gray-300 rounded-b-lg bg-white">
                        <div className="text-sm text-gray-500 mb-3 pb-2 border-b border-gray-200">
                            Vista previa del contenido:
                        </div>
                        <div 
                            className="prose max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                        {!content.trim() && (
                            <div className="text-gray-400 italic">
                                El contenido aparecerá aquí cuando escribas en el editor...
                            </div>
                        )}
                    </div>
                ) : (
                    <textarea
                        ref={editorRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onSelect={(e) => {
                            setSelectionStart(e.target.selectionStart);
                            setSelectionEnd(e.target.selectionEnd);
                        }}
                        placeholder={placeholder || 'Escribe tu contenido SEO aquí...\n\nUsa la barra de herramientas para formatear el texto.\nTambién puedes escribir HTML directamente.\n\nEjemplo:\n<strong>Santo Domingo</strong> es la capital...\n<h2>Mejores Zonas</h2>\n<ul>\n<li>Zona Colonial</li>\n<li>Piantini</li>\n</ul>'}
                        className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm leading-relaxed"
                    />
                )}
            </div>

            {/* Estadísticas y Métricas SEO */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                <div className="flex items-center space-x-4">
                    <span className="font-medium">{stats.words} palabras</span>
                    <span>{stats.chars} caracteres</span>
                    <span>{stats.charsNoSpaces} sin espacios</span>
                </div>
                <div className="flex items-center space-x-3">
                    {content.includes('<a href=') && (
                        <span className="flex items-center text-green-600 font-medium">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Con enlaces
                        </span>
                    )}
                    {(content.includes('<h2>') || content.includes('<h3>')) && (
                        <span className="flex items-center text-blue-600 font-medium">
                            <Heading className="w-3 h-3 mr-1" />
                            Con títulos
                        </span>
                    )}
                    {(content.includes('<strong>') || content.includes('<b>')) && (
                        <span className="flex items-center text-purple-600 font-medium">
                            <Bold className="w-3 h-3 mr-1" />
                            Con negritas
                        </span>
                    )}
                </div>
            </div>

            {/* Consejos SEO */}
            <Card className="p-3 bg-green-50 border-green-200">
                <h5 className="font-medium text-green-900 mb-2 text-sm flex items-center">
                    💡 Consejos SEO
                </h5>
                <ul className="text-xs text-green-800 space-y-1">
                    <li>• Usa <strong>palabras clave</strong> en negritas para dar énfasis</li>
                    <li>• Incluye enlaces internos a páginas relevantes de ubicaciones y tipos</li>
                    <li>• Estructura el contenido con títulos H2 y H3 para mejor legibilidad</li>
                    <li>• Mantén párrafos cortos (2-3 líneas) para facilitar la lectura</li>
                    <li>• Incluye ubicaciones específicas como Santo Domingo, Piantini, etc.</li>
                    <li>• Menciona tipos de propiedades para activar auto-enlaces</li>
                </ul>
            </Card>
        </div>
    );
};

export default RichSEOEditor;