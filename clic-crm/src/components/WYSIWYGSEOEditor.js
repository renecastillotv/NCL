import React, { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, Link, List, ListOrdered, Heading, 
    Eye, Code, MapPin, Home, ExternalLink, Zap, Type
} from 'lucide-react';
import { Button, Card } from './ui';

// Editor WYSIWYG mejorado para contenido SEO con mejor manejo de biografías
const WYSIWYGSEOEditor = ({ value, onChange, placeholder, cities = [], propertyTypes = [] }) => {
    const [content, setContent] = useState(value || '');
    const [showSource, setShowSource] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const editorRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        if (onChange) {
            onChange(content);
        }
    }, [content, onChange]);

    // Sincronizar con el valor externo
    useEffect(() => {
        if (value !== content) {
            setContent(value || '');
            if (editorRef.current && !showSource) {
                editorRef.current.innerHTML = value || '';
            }
        }
    }, [value]);

    // Configurar el editor contentEditable
    useEffect(() => {
        if (editorRef.current && !showSource) {
            editorRef.current.innerHTML = content;
        }
    }, [showSource]);

    // Funciones de formateo usando execCommand
    const execCommand = (command, value = null) => {
        try {
            document.execCommand(command, false, value);
            updateContent();
        } catch (error) {
            console.warn('Error ejecutando comando:', command, error);
        }
    };

    const updateContent = () => {
        if (editorRef.current) {
            const newContent = cleanHTML(editorRef.current.innerHTML);
            setContent(newContent);
        }
    };

    const handleInput = () => {
        updateContent();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        updateContent();
    };

    // Aplicar formato personalizado
    const applyCustomFormat = (format) => {
        const selection = window.getSelection();
        
        switch (format) {
            case 'h2':
                execCommand('formatBlock', '<h2>');
                break;
            case 'h3':
                execCommand('formatBlock', '<h3>');
                break;
            case 'p':
                execCommand('formatBlock', '<p>');
                break;
            case 'link':
                const url = prompt('Ingresa la URL:');
                if (url) {
                    execCommand('createLink', url);
                }
                break;
            default:
                execCommand(format);
        }
    };

    // Funciones de auto-enlaces
    const createLocationLink = (location) => {
        const slug = location.toLowerCase().replace(/\s+/g, '-');
        return `<a href="/ubicaciones/${slug}" class="location-link text-blue-600 hover:underline">${location}</a>`;
    };

    const createPropertyTypeLink = (type) => {
        const slug = type.toLowerCase().replace(/\s+/g, '-');
        return `<a href="/tipos/${slug}" class="property-type-link text-green-600 hover:underline">${type}</a>`;
    };

    // Detectar y sugerir auto-enlaces
    const detectAutoLinks = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        const suggestions = [];
        
        // Detectar ciudades
        cities.forEach(city => {
            const cityName = typeof city === 'string' ? city : (city.value || city.name || city.label);
            if (typeof cityName === 'string' && cityName.length > 0) {
                const regex = new RegExp(`\\b${cityName}\\b`, 'gi');
                if (regex.test(text) && !html.includes(`href="/ubicaciones/${cityName.toLowerCase().replace(/\s+/g, '-')}`)) {
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
                if (regex.test(text) && !html.includes(`href="/tipos/${type.toLowerCase().replace(/\s+/g, '-')}`)) {
                    suggestions.push({
                        type: 'property',
                        text: type,
                        action: () => autoReplaceText(type, createPropertyTypeLink(type))
                    });
                }
            }
        });

        return suggestions.slice(0, 5);
    };

    const autoReplaceText = (searchText, replacement) => {
        const regex = new RegExp(`\\b${searchText}\\b(?![^<]*>)`, 'gi');
        const newContent = content.replace(regex, replacement);
        setContent(newContent);
        if (editorRef.current) {
            editorRef.current.innerHTML = newContent;
        }
        setShowSuggestions(false);
    };

    // Verificar sugerencias cuando cambie el contenido
    useEffect(() => {
        if (content.trim().length > 0 && cities.length > 0 && propertyTypes.length > 0) {
            const suggestions = detectAutoLinks(content);
            setSuggestions(suggestions);
        } else {
            setSuggestions([]);
        }
    }, [content, cities, propertyTypes]);

    // Función para limpiar HTML para estadísticas
    const getPlainText = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    // Limpiar HTML para guardado
    const cleanHTML = (html) => {
        return html
            .replace(/<div>/g, '<p>')
            .replace(/<\/div>/g, '</p>')
            .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>')
            .replace(/<p><\/p>/g, '')
            .replace(/style="[^"]*"/g, '')
            .replace(/class=""/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Toggle entre vista visual y código fuente
    const toggleSourceView = () => {
        if (showSource) {
            // Cambiando de código a visual
            const sourceContent = sourceRef.current.value;
            setContent(sourceContent);
            if (editorRef.current) {
                editorRef.current.innerHTML = sourceContent;
            }
        } else {
            // Cambiando de visual a código
            updateContent();
        }
        setShowSource(!showSource);
    };

    // Estadísticas
    const plainText = getPlainText(content);
    const stats = {
        words: plainText.split(/\s+/).filter(word => word.length > 0).length,
        chars: content.length,
        plainChars: plainText.length
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
                        onClick={() => applyCustomFormat('bold')}
                        title="Negrita (Ctrl+B)"
                        className="hover:bg-gray-200"
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyCustomFormat('italic')}
                        title="Cursiva (Ctrl+I)"
                        className="hover:bg-gray-200"
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyCustomFormat('link')}
                        title="Enlace"
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
                        onClick={() => applyCustomFormat('h2')}
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
                        onClick={() => applyCustomFormat('h3')}
                        title="Título H3"
                        className="hover:bg-gray-200"
                    >
                        <Heading className="w-4 h-4" />
                        <span className="text-xs ml-1">H3</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyCustomFormat('p')}
                        title="Párrafo normal"
                        className="hover:bg-gray-200"
                    >
                        <Type className="w-4 h-4" />
                        <span className="text-xs ml-1">P</span>
                    </Button>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyCustomFormat('insertUnorderedList')}
                        title="Lista con viñetas"
                        className="hover:bg-gray-200"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyCustomFormat('insertOrderedList')}
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
                    onClick={toggleSourceView}
                    title={showSource ? "Vista Visual" : "Ver Código HTML"}
                    className="hover:bg-gray-200"
                >
                    <Code className="w-4 h-4" />
                    <span className="text-xs ml-1">{showSource ? 'Visual' : 'HTML'}</span>
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

            {/* Editor */}
            <div className="relative">
                {showSource ? (
                    // Vista de código HTML
                    <textarea
                        ref={sourceRef}
                        defaultValue={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm"
                        placeholder="Código HTML..."
                    />
                ) : (
                    // Vista visual WYSIWYG
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onPaste={handlePaste}
                        className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y prose max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0"
                        style={{
                            outline: 'none',
                            lineHeight: '1.6'
                        }}
                        suppressContentEditableWarning={true}
                        data-placeholder={placeholder || 'Escribe tu contenido aquí...'}
                    />
                )}
                
                {/* Placeholder cuando está vacío */}
                {!showSource && !content.trim() && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-sm">
                        {placeholder || 'Escribe tu contenido aquí... Usa la barra de herramientas para formatear.'}
                    </div>
                )}
            </div>

            {/* Estadísticas */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                <div className="flex items-center space-x-4">
                    <span className="font-medium">{stats.words} palabras</span>
                    <span>{stats.plainChars} caracteres</span>
                    <span>{stats.chars} con HTML</span>
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

            {/* Consejos de uso */}
            <Card className="p-3 bg-green-50 border-green-200">
                <h5 className="font-medium text-green-900 mb-2 text-sm flex items-center">
                    💡 Consejos para Biografías Profesionales
                </h5>
                <ul className="text-xs text-green-800 space-y-1">
                    <li>• <strong>Resalta logros</strong> y experiencia relevante en el sector inmobiliario</li>
                    <li>• <strong>Menciona ubicaciones</strong> donde tiene experiencia (Piantini, Naco, etc.)</li>
                    <li>• <strong>Incluye especialidades</strong> en tipos de propiedades</li>
                    <li>• <strong>Usa H2/H3</strong> para organizar: "Experiencia", "Especialidades", "Logros"</li>
                    <li>• <strong>Mantén un tono profesional</strong> pero cercano y confiable</li>
                </ul>
            </Card>
        </div>
    );
};

export default WYSIWYGSEOEditor;