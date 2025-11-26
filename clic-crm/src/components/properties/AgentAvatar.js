import React from 'react';

/**
 * Componente de avatar del agente/asesor
 * Muestra foto de perfil o iniciales del agente
 */
const AgentAvatar = ({ agent }) => {
    console.log('🎭 DEBUG AgentAvatar - Datos recibidos:', agent);

    if (!agent) {
        console.log('❌ DEBUG AgentAvatar - No hay datos de agente');
        return null;
    }

    const firstName = agent.first_name || '';
    const lastName = agent.last_name || '';
    const profilePhoto = agent.profile_photo_url;

    console.log('🔤 DEBUG - Datos del agente extraídos:', {
        firstName,
        lastName,
        profilePhoto,
        originalAgent: agent
    });

    if (!firstName && !lastName) {
        console.log('❌ DEBUG AgentAvatar - No se pudo extraer nombre del agente');
        return null;
    }

    const getInitials = (first, last) => {
        const firstInitial = first ? first.charAt(0).toUpperCase() : '';
        const lastInitial = last ? last.charAt(0).toUpperCase() : '';
        const initials = firstInitial + lastInitial || '?';
        console.log('🔤 DEBUG - Iniciales generadas:', initials, 'de', first, last);
        return initials;
    };

    const initials = getInitials(firstName, lastName);
    const fullName = `${firstName} ${lastName}`.trim();

    console.log('✅ DEBUG AgentAvatar - Renderizando avatar:', {
        initials,
        fullName,
        hasPhoto: !!profilePhoto
    });

    return (
        <div className="absolute -bottom-3 left-4 z-20 group">
            <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg bg-orange-100 flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                {profilePhoto ? (
                    <>
                        <img
                            src={profilePhoto}
                            alt={fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error('❌ Error cargando foto de perfil:', profilePhoto);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <span className="text-xs font-bold text-orange-600 hidden w-full h-full items-center justify-center">
                            {initials}
                        </span>
                    </>
                ) : (
                    <span className="text-xs font-bold text-orange-600">
                        {initials}
                    </span>
                )}
            </div>

            <div className="absolute bottom-full left-3 mb-1 px-1.5 py-0.5 bg-gray-800 bg-opacity-90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-sm">
                {fullName}
            </div>
        </div>
    );
};

export default AgentAvatar;
