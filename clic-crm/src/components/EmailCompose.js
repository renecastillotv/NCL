import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Paperclip, Users, Search, Building, 
  Video, FileText, Image, Plus, Trash2, 
  ChevronDown, ChevronUp, Contact, AtSign, Check
} from 'lucide-react';

// Componente WYSIWYG simplificado para email
const WYSIWYGEmailEditor = ({ value, onChange, placeholder }) => {
  const [content, setContent] = useState(value || '');
  const [showSource, setShowSource] = useState(false);
  const editorRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (onChange) {
      onChange(content);
    }
  }, [content, onChange]);

  useEffect(() => {
    if (value !== content) {
      setContent(value || '');
      if (editorRef.current && !showSource) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current && !showSource) {
      editorRef.current.innerHTML = content;
    }
  }, [showSource]);

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

  const applyCustomFormat = (format) => {
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

  const toggleSourceView = () => {
    if (showSource) {
      const sourceContent = sourceRef.current.value;
      setContent(sourceContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceContent;
      }
    } else {
      updateContent();
    }
    setShowSource(!showSource);
  };

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

  const getPlainText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const plainText = getPlainText(content);
  const stats = {
    words: plainText.split(/\s+/).filter(word => word.length > 0).length,
    chars: content.length,
    plainChars: plainText.length
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar compacto */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => applyCustomFormat('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200 text-sm font-bold"
          title="Negrita"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyCustomFormat('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200 text-sm italic"
          title="Cursiva"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => applyCustomFormat('link')}
          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200"
          title="Enlace"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => applyCustomFormat('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200"
          title="Lista"
        >
          •
        </button>
        <div className="w-px h-4 bg-gray-300 mx-2"></div>
        <button
          type="button"
          onClick={toggleSourceView}
          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200"
          title={showSource ? "Vista Visual" : "Ver HTML"}
        >
          {showSource ? 'Visual' : 'HTML'}
        </button>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-500">
          {stats.words} palabras • {stats.plainChars} caracteres
        </div>
      </div>

      {/* Editor con altura completa */}
      <div className="flex-1 relative">
        {showSource ? (
          <textarea
            ref={sourceRef}
            defaultValue={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full px-4 py-3 border-0 focus:outline-none resize-none font-mono text-sm"
            placeholder="Código HTML..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            className="w-full h-full px-4 py-3 focus:outline-none prose max-w-none overflow-y-auto"
            style={{
              outline: 'none',
              lineHeight: '1.6'
            }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder || 'Escribe tu mensaje aquí...'}
          />
        )}
        
        {!showSource && !content.trim() && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder || 'Escribe tu mensaje aquí...'}
          </div>
        )}
      </div>
    </div>
  );
};

const EmailCompose = ({ 
  isOpen, 
  onClose, 
  currentAccount,
  onSend,
  initialData = {},
  mode = 'new' // 'new', 'reply', 'replyAll', 'forward'
}) => {
  const [emailData, setEmailData] = useState({
    recipients: [], // Array de contactos seleccionados
    manualEmails: '', // Emails escritos manualmente
    subject: '',
    htmlContent: '',
    attachments: [],
    ...initialData
  });

  // Reset completo cuando se abre/cierra - FORZAR LIMPIEZA
  useEffect(() => {
    if (isOpen) {
      console.log('Abriendo composer con datos iniciales:', initialData);
      // Reset completo primero
      const cleanData = {
        recipients: [],
        manualEmails: '',
        subject: '',
        htmlContent: '',
        attachments: []
      };
      
      // Luego aplicar datos iniciales si existen
      const finalData = {
        ...cleanData,
        ...initialData
      };
      
      setEmailData(finalData);
      setSelectedContacts(finalData.recipients || []);
    } else {
      // Cuando se cierra, limpiar completamente
      console.log('Cerrando composer, limpiando datos');
      resetForm();
    }
  }, [isOpen]);

  // También limpiar cuando cambian los initialData
  useEffect(() => {
    if (isOpen && initialData) {
      console.log('Datos iniciales cambiaron:', initialData);
      const cleanData = {
        recipients: [],
        manualEmails: '',
        subject: '',
        htmlContent: '',
        attachments: []
      };
      
      const finalData = {
        ...cleanData,
        ...initialData
      };
      
      setEmailData(finalData);
      setSelectedContacts(finalData.recipients || []);
    }
  }, [initialData]);

  // Función para reset completo
  const resetForm = () => {
    setEmailData({
      recipients: [],
      manualEmails: '',
      subject: '',
      htmlContent: '',
      attachments: []
    });
    setSelectedContacts([]);
    setContactSearchTerm('');
    setShowContactModal(false);
    setShowAttachmentsModal(false);
    setShowContentModal(false);
    setShowPropertyModal(false);
    setShowVideoModal(false);
  };

  const [contacts, setContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);

  // Mock data para contactos
  const mockContacts = [
    { id: 1, name: 'Juan Pérez', email: 'juan.perez@email.com', company: 'Inmobiliaria ABC' },
    { id: 2, name: 'María García', email: 'maria.garcia@email.com', company: 'Constructora XYZ' },
    { id: 3, name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', company: 'Bienes Raíces DR' },
    { id: 4, name: 'Ana Martínez', email: 'ana.martinez@email.com', company: 'Propiedades Premium' },
    { id: 5, name: 'Luis Fernández', email: 'luis.fernandez@email.com', company: 'Real Estate Pro' },
    { id: 6, name: 'Carmen Jiménez', email: 'carmen.jimenez@email.com', company: 'Inversiones DR' },
  ];

  // Mock data para contenido
  const mockArticles = [
    { id: 1, title: 'Guía completa para comprar tu primera casa', type: 'article' },
    { id: 2, title: 'Tendencias del mercado inmobiliario 2024', type: 'article' },
    { id: 3, title: 'Cómo invertir en bienes raíces', type: 'article' },
  ];

  const mockVideos = [
    { id: 1, title: 'Tour virtual: Apartamento en Piantini', type: 'video' },
    { id: 2, title: 'Consejos para negociar el precio de una propiedad', type: 'video' },
    { id: 3, title: 'Proceso de compra paso a paso', type: 'video' },
  ];

  const mockProperties = [
    { id: 1, title: 'Apartamento 3 hab. Piantini', price: '$350,000', image: '/api/placeholder/150/100' },
    { id: 2, title: 'Casa 4 hab. Naco', price: '$280,000', image: '/api/placeholder/150/100' },
    { id: 3, title: 'Penthouse Bella Vista', price: '$750,000', image: '/api/placeholder/150/100' },
  ];

  useEffect(() => {
    setContacts(mockContacts);
    setSelectedContacts(emailData.recipients || []);
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAttachFiles = (files) => {
    const newAttachments = Array.from(files).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const toggleContactSelection = (contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.find(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        // Límite de 99 contactos
        if (prev.length >= 99) {
          alert('Máximo 99 contactos permitidos');
          return prev;
        }
        return [...prev, contact];
      }
    });
  };

  const selectAllContacts = () => {
    const availableContacts = filteredContacts.slice(0, 99); // Máximo 99
    setSelectedContacts(availableContacts);
  };

  const clearAllSelection = () => {
    setSelectedContacts([]);
  };

  const confirmContactSelection = () => {
    setEmailData(prev => ({ ...prev, recipients: selectedContacts }));
    setShowContactModal(false);
  };

  const getTotalRecipients = () => {
    const contactCount = emailData.recipients ? emailData.recipients.length : 0;
    
    // Mejorar validación de emails manuales
    const manualEmailCount = emailData.manualEmails
      ? emailData.manualEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => {
            // Validación básica de email
            return email.length > 0 && email.includes('@') && email.includes('.');
          }).length
      : 0;
    
    const total = contactCount + manualEmailCount;
    
    console.log('Debug getTotalRecipients:', {
      contactCount,
      manualEmailCount,
      total,
      manualEmails: emailData.manualEmails,
      recipients: emailData.recipients
    });
    
    return total;
  };

  const isValidToSend = () => {
    const hasRecipients = getTotalRecipients() > 0;
    const hasSubject = emailData.subject && emailData.subject.trim().length > 0;
    
    console.log('Validación envío:', {
      hasRecipients,
      hasSubject,
      totalRecipients: getTotalRecipients(),
      subject: emailData.subject,
      recipients: emailData.recipients,
      manualEmails: emailData.manualEmails
    });
    
    return hasRecipients && hasSubject;
  };

  const insertContent = (content, type) => {
    let htmlToInsert = '';
    
    switch (type) {
      case 'article':
        htmlToInsert = `
          <div style="border: 1px solid #e5e7eb; padding: 16px; margin: 16px 0; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">📄 ${content.title}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Artículo incluido en este email</p>
            <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Leer artículo completo →</a>
          </div>
        `;
        break;
      case 'video':
        htmlToInsert = `
          <div style="border: 1px solid #e5e7eb; padding: 16px; margin: 16px 0; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">🎥 ${content.title}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Video incluido en este email</p>
            <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Ver video →</a>
          </div>
        `;
        break;
      case 'property':
        htmlToInsert = `
          <div style="border: 1px solid #e5e7eb; padding: 16px; margin: 16px 0; border-radius: 8px; background-color: #f9fafb; display: flex; align-items: center;">
            <div style="margin-right: 16px;">
              <img src="${content.image}" alt="${content.title}" style="width: 100px; height: 67px; object-fit: cover; border-radius: 4px;" />
            </div>
            <div>
              <h3 style="margin: 0 0 4px 0; color: #1f2937;">🏠 ${content.title}</h3>
              <p style="margin: 0 0 4px 0; color: #059669; font-weight: bold;">${content.price}</p>
              <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Ver detalles →</a>
            </div>
          </div>
        `;
        break;
    }

    const currentContent = emailData.htmlContent;
    setEmailData(prev => ({
      ...prev,
      htmlContent: currentContent + htmlToInsert
    }));
    
    setShowContentModal(false);
    setShowPropertyModal(false);
    setShowVideoModal(false);
  };

  const handleSend = async () => {
    const totalRecipients = getTotalRecipients();
    
    if (totalRecipients === 0 || !emailData.subject.trim()) {
      alert('Por favor selecciona al menos un destinatario y completa el asunto');
      return;
    }

    setSending(true);
    try {
      // Enviar a contactos seleccionados
      for (const recipient of emailData.recipients) {
        const individualEmail = {
          ...emailData,
          to: recipient.email,
          toName: recipient.name
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (onSend) {
          onSend(individualEmail);
        }
      }
      
      // Enviar a emails manuales
      const manualEmails = emailData.manualEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0 && email.includes('@'));
      
      for (const email of manualEmails) {
        const individualEmail = {
          ...emailData,
          to: email,
          toName: email
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (onSend) {
          onSend(individualEmail);
        }
      }
      
      // Reset completo después del envío
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error enviando emails:', error);
      alert('Error enviando los emails');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  // Separar contactos seleccionados y no seleccionados para el modal
  const selectedContactsInModal = filteredContacts.filter(contact => 
    selectedContacts.find(c => c.id === contact.id)
  );
  const unselectedContactsInModal = filteredContacts.filter(contact => 
    !selectedContacts.find(c => c.id === contact.id)
  );
  const orderedContactsForModal = [...selectedContactsInModal, ...unselectedContactsInModal];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header fijo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'reply' ? 'Responder Email' : 
             mode === 'replyAll' ? 'Responder a Todos' :
             mode === 'forward' ? 'Reenviar Email' : 
             'Redactar Email'}
          </h1>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel principal */}
        <div className="flex-1 flex flex-col">
          {/* Campos de email - COMPACTOS */}
          <div className="p-4 space-y-3 border-b border-gray-200 bg-gray-50">
            {/* De - MÁS PEQUEÑO */}
            <div className="flex items-center space-x-3">
              <label className="w-12 text-sm font-medium text-gray-700 flex-shrink-0">De:</label>
              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700">
                {currentAccount || 'Sin cuenta seleccionada'}
              </div>
            </div>
            
            {/* Para - MOSTRAR SELECTOR EN REENVIAR TAMBIÉN */}
            {(mode === 'new' || mode === 'forward') && (
              <div className="flex items-center space-x-3">
                <label className="w-12 text-sm font-medium text-gray-700 flex-shrink-0">Para:</label>
                <div className="flex-1 flex items-center space-x-2">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {emailData.recipients.length > 0 
                        ? `${emailData.recipients.length} Contacto${emailData.recipients.length !== 1 ? 's' : ''} Seleccionado${emailData.recipients.length !== 1 ? 's' : ''}`
                        : 'Seleccionar Contactos'
                      }
                    </span>
                  </button>
                  <input
                    type="text"
                    value={emailData.manualEmails}
                    onChange={(e) => setEmailData(prev => ({ ...prev, manualEmails: e.target.value }))}
                    placeholder="Correos no registrados (separados por coma)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  {getTotalRecipients() > 0 && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Total: {getTotalRecipients()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Para fijo solo en responder/responder a todos */}
            {(mode === 'reply' || mode === 'replyAll') && (
              <div className="flex items-center space-x-3">
                <label className="w-12 text-sm font-medium text-gray-700 flex-shrink-0">Para:</label>
                <div className="flex-1 space-y-2">
                  {emailData.recipients.map(contact => (
                    <div key={contact.id} className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                        <div className="text-xs text-gray-600">{contact.email}</div>
                      </div>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={emailData.manualEmails}
                    onChange={(e) => setEmailData(prev => ({ ...prev, manualEmails: e.target.value }))}
                    placeholder="Agregar más destinatarios (separados por coma)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Asunto */}
            <div className="flex items-center space-x-3">
              <label className="w-12 text-sm font-medium text-gray-700 flex-shrink-0">Asunto:</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Asunto del email"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Barra de herramientas de inserción */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Paperclip className="w-4 h-4" />
                <span>Adjuntar</span>
              </button>
              <button
                onClick={() => setShowContentModal(true)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>Artículo</span>
              </button>
              <button
                onClick={() => setShowVideoModal(true)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
              <button
                onClick={() => setShowPropertyModal(true)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Building className="w-4 h-4" />
                <span>Propiedad</span>
              </button>
              
              {/* Adjuntos en línea */}
              {emailData.attachments.length > 0 && (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-gray-600">
                    {emailData.attachments.length} archivo{emailData.attachments.length !== 1 ? 's' : ''}:
                  </span>
                  {emailData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                      <span>{attachment.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleAttachFiles(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Editor - ALTURA FIJA PARA GARANTIZAR VISIBILIDAD */}
          <div className="bg-white" style={{ height: 'calc(100vh - 320px)' }}>
            <WYSIWYGEmailEditor
              value={emailData.htmlContent}
              onChange={(content) => setEmailData(prev => ({ ...prev, htmlContent: content }))}
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>

          {/* Botones de acción fijos */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sending || emailData.recipients.length === 0 || !emailData.subject.trim()}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #e03f07 0%, #c73307 100%)' }}
              >
                {sending ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando a {emailData.recipients.length} contacto{emailData.recipients.length !== 1 ? 's' : ''}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar{emailData.recipients.length > 1 ? ` (${emailData.recipients.length})` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selección de contactos */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl w-full max-w-2xl h-[70vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Seleccionar Contactos</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllContacts}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    onClick={clearAllSelection}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  placeholder="Buscar contactos..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {selectedContacts.length > 0 && (
                <div className="mt-2 text-sm text-orange-600">
                  {selectedContacts.length}/99 contactos seleccionados
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {orderedContactsForModal.map(contact => {
                  const isSelected = selectedContacts.find(c => c.id === contact.id) !== undefined;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact)}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        isSelected 
                          ? 'bg-orange-50 border-2 border-orange-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Manejado por el onClick del div
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                        isSelected ? 'bg-orange-500' : 'bg-gray-400'
                      }`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                          {contact.name}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>
                          {contact.email}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                          {contact.company}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-orange-500">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedContacts.length} contacto{selectedContacts.length !== 1 ? 's' : ''} seleccionado{selectedContacts.length !== 1 ? 's' : ''}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmContactSelection}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                  >
                    Confirmar Selección
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de adjuntos */}
      {showAttachmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl w-full max-w-lg h-[60vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Gestionar Adjuntos</h4>
                <button
                  onClick={() => setShowAttachmentsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Más Archivos</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {emailData.attachments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay archivos adjuntos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{attachment.name}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(attachment.size)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {emailData.attachments.length} archivo{emailData.attachments.length !== 1 ? 's' : ''} adjunto{emailData.attachments.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowAttachmentsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales de inserción de contenido (simplificados) */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Insertar Artículo</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mockArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => insertContent(article, 'article')}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="font-medium text-gray-900">{article.title}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowContentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Insertar Video</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mockVideos.map(video => (
                <div
                  key={video.id}
                  onClick={() => insertContent(video, 'video')}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="font-medium text-gray-900">{video.title}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h4 className="text-lg font-semibold mb-4">Insertar Propiedad</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {mockProperties.map(property => (
                <div
                  key={property.id}
                  onClick={() => insertContent(property, 'property')}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{property.title}</div>
                    <div className="text-sm text-green-600 font-semibold">{property.price}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowPropertyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCompose;