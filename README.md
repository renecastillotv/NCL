# NCL - Repositorio de Proyectos CLIC

Este repositorio contiene los proyectos principales de CLIC Inmobiliaria.

## Estructura del Repositorio

```
NCL/
├── clic-crm/           # Sistema CRM multi-tenant con React + Supabase
└── astro-clic-project/ # Plataforma web pública con Astro
```

## Proyectos

### 1. CLIC CRM (`/clic-crm`)

Sistema de gestión CRM multi-tenant desarrollado con React y Supabase.

**Características:**
- Sistema multi-tenant con gestión de roles y permisos
- Gestión de propiedades, contactos, usuarios y deals
- Edge functions para autenticación y autorización
- Arquitectura modular con hooks personalizados
- Integración completa con Supabase

**Tecnologías:**
- React 18
- Supabase (Base de datos + Auth + Edge Functions)
- Sistema de permisos granular
- UI Components personalizados

**Documentación:**
- Ver [clic-crm/START-HERE.md](clic-crm/START-HERE.md) para comenzar
- Arquitectura: [clic-crm/ARCHITECTURE_OVERVIEW.md](clic-crm/ARCHITECTURE_OVERVIEW.md)
- Deploy: [clic-crm/DEPLOYMENT-CHECKLIST.md](clic-crm/DEPLOYMENT-CHECKLIST.md)

---

### 2. Astro CLIC (`/astro-clic-project`)

Plataforma web pública para visualización de propiedades desarrollada con Astro.

**Características:**
- Sitio web estático/SSR con Astro
- Búsqueda y filtrado de propiedades
- SEO optimizado
- Integración con Supabase para contenido dinámico
- Optimización de imágenes

**Tecnologías:**
- Astro
- Supabase
- Tailwind CSS
- Edge Functions

**Documentación:**
- Ver [astro-clic-project/README.md](astro-clic-project/README.md) para instalación
- Deploy: [astro-clic-project/DEPLOY-INSTRUCTIONS.md](astro-clic-project/DEPLOY-INSTRUCTIONS.md)

---

## Instalación Rápida

### CLIC CRM
```bash
cd clic-crm
npm install
# Configurar .env según .env.example
npm start
```

### Astro CLIC
```bash
cd astro-clic-project
npm install
# Configurar .env según .env.example
npm run dev
```

## Contribución

Ambos proyectos están en desarrollo activo. Para contribuir, ver la documentación específica de cada proyecto.

## Licencia

Propiedad de CLIC Inmobiliaria
