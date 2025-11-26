const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

// Configuración de firma institucional por defecto
const DEFAULT_SIGNATURE = {
  company: "Clic Inmobiliaria",
  website: "www.clicinmobiliaria.com",
  phone: "+1 (829) 514-8080",
  email: "info@clicinmobiliaria.com",
  address: "Erik Leonard Ekman #34, Santo Domingo, República Dominicana"
};

// Función para generar firma HTML profesional
function generateSignature(signatureData = {}) {
  // Si tiene HTML personalizado y está habilitado, usarlo directamente
  if (signatureData.user?.use_custom_html && signatureData.user?.custom_html) {
    return signatureData.user.custom_html;
  }

  // Si tiene plantilla HTML personalizada
  if (signatureData.template?.html_template) {
    // Reemplazar variables en la plantilla
    let html = signatureData.template.html_template;
    
    // Reemplazar variables del usuario
    if (signatureData.user) {
      Object.keys(signatureData.user).forEach(key => {
        const regex = new RegExp(`{{user.${key}}}`, 'g');
        html = html.replace(regex, signatureData.user[key] || '');
      });
    }
    
    // Reemplazar variables de la plantilla
    if (signatureData.template) {
      Object.keys(signatureData.template).forEach(key => {
        const regex = new RegExp(`{{template.${key}}}`, 'g');
        html = html.replace(regex, signatureData.template[key] || '');
      });
    }
    
    return html;
  }

  // Generar firma por defecto con diseño profesional
  const user = signatureData.user || {};
  const template = signatureData.template || DEFAULT_SIGNATURE;
  
  const backgroundColor = template.background_color || '#1e3a5f';
  const textColor = template.text_color || '#ffffff';
  const accentColor = template.accent_color || '#4a90e2';
  const fontFamily = template.font_family || 'Arial, sans-serif';
  
  // Construir HTML de redes sociales
  const socialLinks = [];
  
  // Redes de empresa
  if (template.facebook_url) {
    socialLinks.push(`<a href="${template.facebook_url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 20px; height: 20px;"></a>`);
  }
  if (template.instagram_url) {
    socialLinks.push(`<a href="${template.instagram_url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width: 20px; height: 20px;"></a>`);
  }
  if (template.linkedin_url) {
    socialLinks.push(`<a href="${template.linkedin_url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124011.png" alt="LinkedIn" style="width: 20px; height: 20px;"></a>`);
  }
  if (template.twitter_url) {
    socialLinks.push(`<a href="${template.twitter_url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124021.png" alt="Twitter" style="width: 20px; height: 20px;"></a>`);
  }
  if (template.youtube_url) {
    socialLinks.push(`<a href="${template.youtube_url}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124015.png" alt="YouTube" style="width: 20px; height: 20px;"></a>`);
  }
  
  // WhatsApp personal
  if (user.personal_whatsapp) {
    const whatsappLink = `https://wa.me/${user.personal_whatsapp.replace(/[^0-9]/g, '')}`;
    socialLinks.push(`<a href="${whatsappLink}" style="text-decoration: none; margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/512/124/124034.png" alt="WhatsApp" style="width: 20px; height: 20px;"></a>`);
  }
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px; width: 100%; max-width: 600px; font-family: ${fontFamily};">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background: linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%); border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding: 20px;">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                  <tr>
                    <!-- Logo y foto del usuario -->
                    <td style="width: 120px; vertical-align: top; padding-right: 20px;">
                      ${user.photo_url ? 
                        `<img src="${user.photo_url}" alt="${user.display_name}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${textColor}; margin-bottom: 10px; display: block;">` : 
                        ''
                      }
                      ${template.company_logo ? 
                        `<img src="${template.company_logo}" alt="${template.company_name}" style="max-width: 100px; max-height: 40px; display: block;">` : 
                        ''
                      }
                    </td>
                    
                    <!-- Información principal -->
                    <td style="vertical-align: top; color: ${textColor};">
                      <!-- Nombre y cargo -->
                      <div style="margin-bottom: 10px;">
                        <strong style="font-size: 18px; color: ${textColor}; display: block;">${user.display_name || 'Agente'}</strong>
                        ${user.job_title ? `<span style="font-size: 14px; color: ${textColor}; opacity: 0.9;">${user.job_title}</span>` : ''}
                        ${user.department ? `<span style="font-size: 12px; color: ${textColor}; opacity: 0.8;"> | ${user.department}</span>` : ''}
                      </div>
                      
                      <!-- Empresa -->
                      <div style="margin-bottom: 10px;">
                        <strong style="font-size: 16px; color: ${textColor}; display: block;">${template.company_name}</strong>
                      </div>
                      
                      <!-- Información de contacto -->
                      <div style="font-size: 13px; line-height: 1.6;">
                        ${user.direct_phone || user.mobile_phone || template.company_phone ? 
                          `<div style="margin-bottom: 3px;">
                            📞 ${user.direct_phone || user.mobile_phone || template.company_phone}
                            ${user.extension ? ` ext. ${user.extension}` : ''}
                          </div>` : ''
                        }
                        
                        ${user.personal_email || template.company_email ? 
                          `<div style="margin-bottom: 3px;">
                            📧 <a href="mailto:${user.personal_email || template.company_email}" style="color: ${textColor}; text-decoration: none;">
                              ${user.personal_email || template.company_email}
                            </a>
                          </div>` : ''
                        }
                        
                        ${template.company_website ? 
                          `<div style="margin-bottom: 3px;">
                            🌐 <a href="https://${template.company_website}" style="color: ${textColor}; text-decoration: none;">
                              ${template.company_website}
                            </a>
                          </div>` : ''
                        }
                        
                        ${template.company_address ? 
                          `<div style="margin-bottom: 3px;">
                            📍 ${template.company_address}
                          </div>` : ''
                        }
                      </div>
                      
                      <!-- Licencia y certificaciones -->
                      ${user.license_number ? 
                        `<div style="margin-top: 8px; font-size: 12px; color: ${textColor}; opacity: 0.9;">
                          <strong>Lic. #${user.license_number}</strong>
                          ${user.certifications ? ` | ${user.certifications}` : ''}
                        </div>` : ''
                      }
                      
                      <!-- Mensaje personal -->
                      ${user.personal_message ? 
                        `<div style="margin-top: 10px; font-size: 13px; font-style: italic; color: ${textColor}; opacity: 0.9;">
                          "${user.personal_message}"
                        </div>` : ''
                      }
                      
                      <!-- Redes sociales -->
                      ${socialLinks.length > 0 ? 
                        `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
                          ${socialLinks.join('')}
                        </div>` : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Disclaimer legal (opcional) -->
          <div style="margin-top: 10px; padding: 10px; font-size: 11px; color: #666; text-align: center; line-height: 1.4;">
            Este correo electrónico y cualquier archivo adjunto son confidenciales y para uso exclusivo del destinatario. 
            Si usted no es el destinatario, por favor notifique al remitente y elimine este mensaje.
          </div>
        </td>
      </tr>
    </table>
  `;
}

// Función principal para Google Cloud Functions
exports.handler = async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { action, data } = req.body || {};
  
  if (!action || !data) {
    return res.status(400).json({ error: "Missing action or data" });
  }

  try {
    // ===============================
    // OBTENER BANDEJA DE ENTRADA
    // ===============================
    if (action === 'get_inbox') {
      const { 
        host, 
        port = 993, 
        email, 
        password, 
        folder = 'INBOX', 
        max = 50,
        includeContent = false,
        includeAttachments = false 
      } = data;

      console.log(`Conectando a IMAP: ${host}:${port} con usuario ${email}`);

      const client = new ImapFlow({
        host, port,
        secure: port === 993,
        auth: { user: email, pass: password },
        tls: { rejectUnauthorized: false },
        logger: false,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 45000
      });

      let connectTimeout;
      try {
        connectTimeout = setTimeout(() => {
          if (client.usable) client.close();
          throw new Error('Timeout de conexión IMAP');
        }, 30000);

        await client.connect();
        clearTimeout(connectTimeout);
        console.log('Conectado exitosamente a IMAP');

        let lock = await client.getMailboxLock(folder);
        let messages = [];

        try {
          const mailbox = client.mailbox;
          console.log(`Mailbox: ${mailbox.exists} mensajes totales en ${folder}`);

          if (mailbox.exists === 0) {
            const folders = await client.list();
            console.log('Folders disponibles:', folders.map(f => f.path));
            
            lock.release();
            await client.logout();
            return res.status(200).json({ 
              success: true, 
              emails: [],
              total: 0,
              message: "No hay mensajes en la bandeja",
              availableFolders: folders.map(f => f.path)
            });
          }

          // Obtener todos los mensajes (limitado por max)
          const totalToFetch = Math.min(max, mailbox.exists);
          const startUid = Math.max(1, mailbox.exists - totalToFetch + 1);
          const sequence = `${startUid}:${mailbox.exists}`;
          
          console.log(`Obteniendo mensajes: ${sequence} de ${mailbox.exists} totales`);

          let messageArray = [];
          const fetchOptions = { 
            envelope: true, 
            flags: true, 
            uid: true,
            bodyStructure: true
          };
          
          // Si se solicita contenido completo, incluir source
          if (includeContent) {
            fetchOptions.source = true;
          }

          for await (let msg of client.fetch(sequence, fetchOptions)) {
            try {
              console.log(`Procesando mensaje UID: ${msg.uid}`);
              
              // Verificar si flags es array o Set
              let isUnread = false;
              let isStarred = false;
              
              if (Array.isArray(msg.flags)) {
                isUnread = !msg.flags.includes('\\Seen');
                isStarred = msg.flags.includes('\\Flagged');
              } else if (msg.flags && typeof msg.flags.has === 'function') {
                isUnread = !msg.flags.has('\\Seen');
                isStarred = msg.flags.has('\\Flagged');
              }

              let messageData = {
                uid: msg.uid,
                subject: msg.envelope?.subject || 'Sin asunto',
                from: msg.envelope?.from?.[0]?.address || 'Desconocido',
                fromName: msg.envelope?.from?.[0]?.name || '',
                to: msg.envelope?.to?.[0]?.address || '',
                cc: msg.envelope?.cc?.map(addr => addr.address) || [],
                date: msg.envelope?.date || new Date(),
                unread: isUnread,
                starred: isStarred,
                hasAttachments: msg.bodyStructure?.childNodes?.some(node => 
                  node.disposition === 'attachment' || 
                  (node.disposition === 'inline' && node.parameters?.filename)
                ) || false,
                size: msg.size || 0,
                snippet: 'Vista previa no disponible'
              };

              // Si se solicita contenido completo, parsearlo
              if (includeContent && msg.source) {
                try {
                  let parsed = await simpleParser(msg.source);
                  messageData.snippet = (parsed.text?.slice(0, 200) || 
                                       parsed.html?.replace(/<[^>]*>/g, '').slice(0, 200) || 
                                       'Sin contenido').trim();
                  messageData.html = parsed.html || '';
                  messageData.text = parsed.text || '';
                  
                  // Procesar adjuntos
                  if (includeAttachments && parsed.attachments && parsed.attachments.length > 0) {
                    console.log(`Email UID ${msg.uid} tiene ${parsed.attachments.length} adjuntos`);
                    messageData.attachments = parsed.attachments.map((att, index) => {
                      const attachmentInfo = {
                        filename: att.filename || `attachment_${index + 1}`,
                        contentType: att.contentType,
                        size: att.size,
                        cid: att.cid,
                        partID: String(index) // IMPORTANTE: Asegurar que sea string del índice
                      };
                      console.log(`Adjunto ${index}: ${attachmentInfo.filename}, partID: ${attachmentInfo.partID}`);
                      return attachmentInfo;
                    });
                    messageData.hasAttachments = true;
                  } else {
                    messageData.attachments = [];
                  }
                } catch (parseError) {
                  console.error('Error parseando contenido:', parseError.message);
                }
              }

              messageArray.push(messageData);
              
            } catch (msgError) {
              console.error('Error procesando mensaje:', msgError.message);
            }
          }

          // Ordenar por fecha descendente (más recientes primero)
          messages = messageArray.sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log(`Procesados ${messages.length} mensajes exitosamente`);

        } catch (fetchError) {
          console.error('Error durante fetch:', fetchError.message);
          throw fetchError;
        } finally {
          if (lock) lock.release();
        }

        await client.logout();
        console.log('Desconectado de IMAP exitosamente');

        return res.status(200).json({ 
          success: true, 
          emails: messages,
          total: messages.length,
          folder: folder
        });

      } catch (imapError) {
        if (connectTimeout) clearTimeout(connectTimeout);
        if (client.usable) {
          try { await client.logout(); } catch (e) {}
        }
        throw imapError;
      }
    }

    // ===============================
    // OBTENER ADJUNTO ESPECÍFICO - VERSIÓN OPTIMIZADA
    // ===============================
    if (action === 'get_attachment') {
      const { 
        host, 
        port = 993, 
        email, 
        password, 
        uid, 
        partID,
        folder = 'INBOX',
        method = 'auto' // 'auto', 'inline', 'stream'
      } = data;

      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 DIAGNÓSTICO DE ADJUNTO`);
      console.log(`${'='.repeat(50)}`);
      console.log(`📧 Email: ${email}`);
      console.log(`📁 Folder: ${folder}`);
      console.log(`🔢 UID: ${uid}`);
      console.log(`📎 PartID: ${partID} (tipo: ${typeof partID})`);
      console.log(`⚙️ Método: ${method}`);
      console.log(`${'='.repeat(50)}\n`);

      const client = new ImapFlow({
        host, port,
        secure: port === 993,
        auth: { user: email, pass: password },
        tls: { rejectUnauthorized: false },
        logger: false,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 45000
      });

      await client.connect();
      console.log('✅ Conectado a IMAP');
      
      let lock = await client.getMailboxLock(folder);
      console.log('🔒 Lock obtenido en carpeta:', folder);

      try {
        let attachmentContent = null;
        let attachmentInfo = null;

        // PASO 1: Obtener información del adjunto sin descargar todo
        console.log('\n📊 PASO 1: Analizando estructura del mensaje...');
        
        for await (let msg of client.fetch(uid, { 
          uid: true, 
          bodyStructure: true 
        }, { uid: true })) {
          console.log('📨 Mensaje encontrado, analizando estructura...');
          
          // Función recursiva para buscar partes
          const findAttachments = (struct, parts = []) => {
            if (struct.childNodes) {
              struct.childNodes.forEach((node, index) => {
                if (node.disposition === 'attachment' || 
                    (node.disposition === 'inline' && node.parameters?.filename)) {
                  parts.push({
                    index: parts.length,
                    filename: node.parameters?.filename || node.disposition?.params?.filename || `file_${parts.length}`,
                    type: node.type,
                    size: node.size,
                    encoding: node.encoding
                  });
                }
                if (node.childNodes) {
                  findAttachments(node, parts);
                }
              });
            }
            return parts;
          };
          
          const attachments = findAttachments(msg.bodyStructure);
          console.log(`📎 Adjuntos encontrados en estructura: ${attachments.length}`);
          attachments.forEach((att, idx) => {
            console.log(`  [${idx}] ${att.filename} - ${att.type} - ${att.size} bytes`);
          });
          
          break;
        }

        // PASO 2: Obtener el mensaje completo y parsear
        console.log('\n📥 PASO 2: Descargando mensaje completo...');
        const startTime = Date.now();
        
        for await (let msg of client.fetch(uid, { 
          uid: true, 
          source: true 
        }, { uid: true })) {
          
          const sourceSize = msg.source?.length || 0;
          console.log(`📦 Tamaño del source: ${sourceSize} bytes (${(sourceSize / 1024).toFixed(2)} KB)`);
          
          // Parsear el mensaje
          console.log('🔄 Parseando mensaje con mailparser...');
          let parsed = await simpleParser(msg.source);
          
          // Convertir partID a número para el índice del array
          const attachmentIndex = parseInt(partID, 10);
          
          console.log(`\n📋 RESUMEN DE ADJUNTOS:`);
          console.log(`  Total adjuntos parseados: ${parsed.attachments?.length || 0}`);
          
          if (parsed.attachments && parsed.attachments.length > 0) {
            console.log('  Lista de adjuntos:');
            parsed.attachments.forEach((att, idx) => {
              const contentLength = att.content?.length || 0;
              console.log(`    [${idx}] ${att.filename}`);
              console.log(`        - Tipo: ${att.contentType}`);
              console.log(`        - Tamaño: ${att.size} bytes`);
              console.log(`        - Contenido buffer: ${contentLength} bytes`);
              console.log(`        - Base64 estimado: ${(contentLength * 1.33 / 1024).toFixed(2)} KB`);
            });
            
            if (attachmentIndex >= 0 && attachmentIndex < parsed.attachments.length) {
              const attachment = parsed.attachments[attachmentIndex];
              console.log(`\n✅ Adjunto seleccionado: ${attachment.filename}`);
              
              // DIAGNÓSTICO DE TAMAÑOS
              const bufferSize = attachment.content?.length || 0;
              const base64Size = bufferSize ? Math.ceil(bufferSize * 1.33) : 0;
              const jsonSize = base64Size ? JSON.stringify({ content: 'x'.repeat(base64Size) }).length : 0;
              
              console.log('\n📏 ANÁLISIS DE TAMAÑOS:');
              console.log(`  Buffer original: ${bufferSize} bytes (${(bufferSize / 1024).toFixed(2)} KB)`);
              console.log(`  Base64 estimado: ${base64Size} bytes (${(base64Size / 1024).toFixed(2)} KB)`);
              console.log(`  JSON estimado: ${jsonSize} bytes (${(jsonSize / 1024).toFixed(2)} KB)`);
              console.log(`  Factor de expansión: ${(jsonSize / bufferSize).toFixed(2)}x`);
              
              // DECIDIR MÉTODO SEGÚN TAMAÑO
              let responseMethod = method;
              if (method === 'auto') {
                if (base64Size < 200 * 1024) { // < 200 KB en base64
                  responseMethod = 'inline';
                  console.log('📌 Método seleccionado: INLINE (archivo pequeño)');
                } else if (base64Size < 5 * 1024 * 1024) { // < 5 MB
                  responseMethod = 'stream';
                  console.log('📌 Método seleccionado: STREAM (archivo mediano)');
                } else {
                  responseMethod = 'chunked';
                  console.log('📌 Método seleccionado: CHUNKED (archivo grande)');
                }
              }
              
              // PREPARAR RESPUESTA SEGÚN MÉTODO
              if (responseMethod === 'inline') {
                // Método inline: enviar base64 en JSON
                attachmentContent = attachment.content?.toString('base64');
                attachmentInfo = {
                  filename: attachment.filename || `attachment_${attachmentIndex + 1}`,
                  contentType: attachment.contentType,
                  size: attachment.size,
                  method: 'inline'
                };
                
                console.log('\n📤 Enviando inline:');
                console.log(`  Tamaño base64: ${attachmentContent.length} bytes`);
                console.log(`  Tamaño JSON final: ${JSON.stringify({ ...attachmentInfo, content: attachmentContent }).length} bytes`);
                
              } else if (responseMethod === 'stream') {
                // Método stream: enviar archivo directamente (no JSON)
                console.log('\n📤 Preparando streaming directo...');
                
                lock.release();
                await client.logout();
                
                const downloadTime = Date.now() - startTime;
                console.log(`⏱️ Tiempo de descarga: ${downloadTime}ms`);
                
                // Configurar headers para streaming
                res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
                res.setHeader('Content-Length', attachment.size);
                
                // Enviar el archivo directamente (no JSON)
                console.log('🚀 Enviando archivo como stream binario...');
                return res.send(attachment.content);
                
              } else if (responseMethod === 'chunked') {
                // Método chunked: dividir en partes
                console.log('\n📤 Preparando respuesta en chunks...');
                
                const CHUNK_SIZE = 500 * 1024; // 500 KB por chunk
                const base64Content = attachment.content?.toString('base64') || '';
                const chunks = [];
                
                for (let i = 0; i < base64Content.length; i += CHUNK_SIZE) {
                  chunks.push(base64Content.slice(i, i + CHUNK_SIZE));
                }
                
                console.log(`  Total chunks: ${chunks.length}`);
                console.log(`  Tamaño por chunk: ${CHUNK_SIZE} bytes`);
                
                attachmentInfo = {
                  filename: attachment.filename,
                  contentType: attachment.contentType,
                  size: attachment.size,
                  method: 'chunked',
                  totalChunks: chunks.length,
                  chunkSize: CHUNK_SIZE
                };
                
                // Para chunked, devolver info para que el cliente pida cada chunk
                attachmentContent = null; // No enviar contenido ahora
              }
              
            } else {
              console.log(`❌ Índice ${attachmentIndex} fuera de rango (0-${parsed.attachments.length - 1})`);
            }
          } else {
            console.log('❌ No se encontraron adjuntos en este mensaje');
          }
          
          break;
        }

        const totalTime = Date.now() - startTime;
        console.log(`\n⏱️ Tiempo total de procesamiento: ${totalTime}ms`);

        lock.release();
        await client.logout();
        console.log('🔓 Conexión IMAP cerrada');

        if (!attachmentContent && !attachmentInfo) {
          console.log('\n❌ FALLO: No se pudo obtener el adjunto');
          return res.status(404).json({ 
            success: false, 
            error: `Adjunto no encontrado. PartID: ${partID}, Índice: ${attachmentIndex}` 
          });
        }

        // Si llegamos aquí con método inline o chunked, devolver JSON
        if (attachmentInfo && attachmentInfo.method !== 'stream') {
          console.log('\n✅ ÉXITO: Enviando respuesta JSON');
          const response = { 
            success: true,
            ...attachmentInfo
          };
          
          if (attachmentContent) {
            response.content = attachmentContent;
          }
          
          const finalSize = JSON.stringify(response).length;
          console.log(`📊 Tamaño final de respuesta: ${finalSize} bytes (${(finalSize / 1024).toFixed(2)} KB)`);
          
          return res.status(200).json(response);
        }

      } catch (error) {
        console.error('\n❌ ERROR EN GET_ATTACHMENT:', error);
        console.error('Stack:', error.stack);
        
        if (lock) lock.release();
        if (client.usable) {
          try { await client.logout(); } catch (e) {}
        }
        throw error;
      }
    }

    // ===============================
    // OBTENER CHUNK DE ADJUNTO (para archivos grandes)
    // ===============================
    if (action === 'get_attachment_chunk') {
      const { uid, partID, chunkIndex, folder = 'INBOX' } = data;
      
      console.log(`Obteniendo chunk ${chunkIndex} del adjunto ${partID} del mensaje ${uid}`);
      
      // Aquí implementarías la lógica para obtener un chunk específico
      // Por ahora, devolver error indicando que se debe usar otro método
      
      return res.status(200).json({
        success: false,
        error: 'Chunked download not implemented yet. Use streaming for large files.'
      });
    }

    // ===============================
    // TEST DE LÍMITES (para diagnóstico)
    // ===============================
    if (action === 'test_limits') {
      console.log('\n🧪 TEST DE LÍMITES DE RESPUESTA');
      
      const sizes = [100, 500, 1024, 2048, 5120, 10240]; // KB
      const results = [];
      
      for (const sizeKB of sizes) {
        try {
          const testData = 'A'.repeat(sizeKB * 1024);
          const testResponse = {
            success: true,
            size: sizeKB,
            content: testData
          };
          
          const jsonSize = JSON.stringify(testResponse).length;
          console.log(`Testing ${sizeKB} KB: JSON size = ${jsonSize} bytes`);
          
          results.push({
            sizeKB: sizeKB,
            jsonBytes: jsonSize,
            status: 'OK'
          });
          
        } catch (error) {
          results.push({
            sizeKB: sizeKB,
            error: error.message,
            status: 'FAILED'
          });
          break;
        }
      }
      
      return res.status(200).json({
        success: true,
        test: 'response_limits',
        results: results
      });
    }

    // ... [RESTO DE ACCIONES: mark_read, toggle_star, etc. - sin cambios]

    // Si llegamos aquí, la acción no fue reconocida
    return res.status(400).json({ 
      success: false,
      error: "Acción no reconocida: " + action 
    });
    
  } catch (error) {
    console.error('Error detallado:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    let userMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      userMessage = 'No se pudo conectar al servidor';
    } else if (error.code === 'EAUTH' || error.message.includes('auth')) {
      userMessage = 'Error de autenticación';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Timeout de conexión';
    }

    return res.status(500).json({ 
      error: userMessage,
      code: error.code,
      success: false
    });
  }
};