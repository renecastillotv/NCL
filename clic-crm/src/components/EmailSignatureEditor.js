import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Briefcase, Building, Globe,
  MapPin, Facebook, Instagram, Linkedin, Twitter,
  Youtube, MessageCircle, Award, Hash, Camera,
  Save, Eye, EyeOff, Palette, Type, Image
} from 'lucide-react';

// FASE 1: Supabase centralizado
import { supabase } from '../services/api';

const EmailSignatureEditor = ({ userId, onSave, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Estados para los datos
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [signatureData, setSignatureData] = useState({
    // Personal Info
    display_name: '',
    job_title: '',
    department: '',
    photo_url: '',
    
    // Contact
    direct_phone: '',
    mobile_phone: '',
    extension: '',
    personal_email: '',
    
    // Social
    personal_facebook: '',
    personal_instagram: '',
    personal_linkedin: '',
    personal_twitter: '',
    personal_whatsapp: '',
    
    // Professional
    license_number: '',
    certifications: '',
    personal_message: '',
    
    // Visual Override
    override_background_color: '',
    override_text_color: '',
    override_accent_color: '',
    
    // Custom HTML
    use_custom_html: false,
    custom_html: ''
  });

  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    loadSignatureData();
  }, [userId]);

  useEffect(() => {
    if (selectedTemplateId || signatureData) {
      generatePreview();
    }
  }, [selectedTemplateId, signatureData]);

  const loadSignatureData = async () => {
    try {
      setLoading(true);

      // Cargar plantillas disponibles
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_signature_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (!templatesError && templatesData) {
        setTemplates(templatesData);
        
        // Seleccionar la plantilla por defecto
        const defaultTemplate = templatesData.find(t => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      }

      // Cargar firma existente del usuario
      const { data: userSignature, error: signatureError } = await supabase
        .from('user_email_signatures')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!signatureError && userSignature) {
        setSignatureData(userSignature);
        if (userSignature.template_id) {
          setSelectedTemplateId(userSignature.template_id);
        }
      }

    } catch (error) {
      console.error('Error loading signature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      const { data: preview } = await supabase.functions.invoke('get-email-signature', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (preview?.success && preview?.data) {
        // Generar HTML de preview basado en los datos actuales
        const template = templates.find(t => t.id === selectedTemplateId) || {};
        const mockData = {
          user: { ...signatureData },
          template: { ...template }
        };
        
        // Aquí podrías llamar a una función para generar el HTML
        // Por ahora, usamos un preview básico
        setPreviewHtml(generateSignatureHtml(mockData));
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const generateSignatureHtml = (data) => {
    const { user, template } = data;
    const backgroundColor = user.override_background_color || template.background_color || '#1e3a5f';
    const textColor = user.override_text_color || template.text_color || '#ffffff';
    const accentColor = user.override_accent_color || template.accent_color || '#4a90e2';
    
    return `
      <div style="background: linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%); padding: 20px; border-radius: 10px; color: ${textColor}; font-family: Arial, sans-serif;">
        <div style="display: flex; align-items: center;">
          ${user.photo_url ? `<img src="${user.photo_url}" style="width: 80px; height: 80px; border-radius: 50%; margin-right: 20px;">` : ''}
          <div>
            <h3 style="margin: 0; color: ${textColor};">${user.display_name || 'Tu Nombre'}</h3>
            <p style="margin: 5px 0; opacity: 0.9;">${user.job_title || 'Tu Cargo'}</p>
            <p style="margin: 5px 0; opacity: 0.8;">${template.company_name || 'Empresa'}</p>
          </div>
        </div>
      </div>
    `;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const dataToSave = {
        ...signatureData,
        user_id: userId,
        template_id: selectedTemplateId,
        is_active: true
      };

      // Verificar si ya existe una firma
      const { data: existing } = await supabase
        .from('user_email_signatures')
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;
      if (existing) {
        // Actualizar
        result = await supabase
          .from('user_email_signatures')
          .update(dataToSave)
          .eq('user_id', userId);
      } else {
        // Insertar
        result = await supabase
          .from('user_email_signatures')
          .insert([dataToSave]);
      }

      if (result.error) {
        throw result.error;
      }

      alert('Firma guardada exitosamente');
      if (onSave) onSave();

    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error al guardar la firma');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSignatureData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Editor de Firma de Email</h2>
          <p className="text-gray-600 mt-1">Personaliza tu firma profesional para los correos</p>
        </div>

        <div className="flex">
          {/* Sidebar con tabs */}
          <div className="w-64 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  activeTab === 'personal' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Información Personal</span>
              </button>
              
              <button
                onClick={() => setActiveTab('contact')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  activeTab === 'contact' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Contacto</span>
              </button>
              
              <button
                onClick={() => setActiveTab('social')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  activeTab === 'social' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Redes Sociales</span>
              </button>
              
              <button
                onClick={() => setActiveTab('professional')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  activeTab === 'professional' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Profesional</span>
              </button>
              
              <button
                onClick={() => setActiveTab('design')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  activeTab === 'design' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Diseño</span>
              </button>
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? 'Ocultar' : 'Ver'} Preview</span>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-6">
            {/* Template selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla Base
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar plantilla...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.is_default && '(Por defecto)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Form sections */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={signatureData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={signatureData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Asesor Inmobiliario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={signatureData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Ventas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Foto
                  </label>
                  <input
                    type="url"
                    value={signatureData.photo_url}
                    onChange={(e) => handleInputChange('photo_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Directo
                  </label>
                  <input
                    type="tel"
                    value={signatureData.direct_phone}
                    onChange={(e) => handleInputChange('direct_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="+1 (809) 555-0123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Móvil
                  </label>
                  <input
                    type="tel"
                    value={signatureData.mobile_phone}
                    onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="+1 (829) 555-0123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extensión
                  </label>
                  <input
                    type="text"
                    value={signatureData.extension}
                    onChange={(e) => handleInputChange('extension', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Personal/Directo
                  </label>
                  <input
                    type="email"
                    value={signatureData.personal_email}
                    onChange={(e) => handleInputChange('personal_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociales</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={signatureData.personal_whatsapp}
                    onChange={(e) => handleInputChange('personal_whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="+1 (829) 555-0123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={signatureData.personal_linkedin}
                    onChange={(e) => handleInputChange('personal_linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://linkedin.com/in/usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={signatureData.personal_facebook}
                    onChange={(e) => handleInputChange('personal_facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://facebook.com/usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={signatureData.personal_instagram}
                    onChange={(e) => handleInputChange('personal_instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://instagram.com/usuario"
                  />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Profesional</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    value={signatureData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: RE-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificaciones
                  </label>
                  <input
                    type="text"
                    value={signatureData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: CRS, ABR, GRI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje Personal / Slogan
                  </label>
                  <textarea
                    value={signatureData.personal_message}
                    onChange={(e) => handleInputChange('personal_message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    placeholder="Ej: Tu hogar de ensueño te está esperando"
                  />
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalización Visual</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color de Fondo (Override)
                  </label>
                  <input
                    type="color"
                    value={signatureData.override_background_color || '#1e3a5f'}
                    onChange={(e) => handleInputChange('override_background_color', e.target.value)}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color de Texto (Override)
                  </label>
                  <input
                    type="color"
                    value={signatureData.override_text_color || '#ffffff'}
                    onChange={(e) => handleInputChange('override_text_color', e.target.value)}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color de Acento (Override)
                  </label>
                  <input
                    type="color"
                    value={signatureData.override_accent_color || '#4a90e2'}
                    onChange={(e) => handleInputChange('override_accent_color', e.target.value)}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={signatureData.use_custom_html}
                      onChange={(e) => handleInputChange('use_custom_html', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Usar HTML personalizado</span>
                  </label>
                </div>

                {signatureData.use_custom_html && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HTML Personalizado
                    </label>
                    <textarea
                      value={signatureData.custom_html}
                      onChange={(e) => handleInputChange('custom_html', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                      rows="10"
                      placeholder="<div>Tu HTML personalizado aquí...</div>"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {showPreview && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Firma</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSignatureEditor;