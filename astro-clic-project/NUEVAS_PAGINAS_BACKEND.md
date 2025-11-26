# Nuevas Páginas - Documentación para Backend

## Resumen
Se han creado 3 nuevos layouts para páginas faltantes en el sitio. Actualmente están funcionando con datos demo y necesitan handlers en la edge function de Supabase para devolver contenido real.

## Páginas Creadas

### 1. **Ubicaciones** (`/ubicaciones`)
- **Layout:** `src/layouts/LocationsLayout.astro`
- **Rutas multiidioma:**
  - ES: `/ubicaciones`
  - EN: `/en/locations`
  - FR: `/fr/emplacements`
- **pageType esperado:** `locations-main`

**Estructura de datos que debe devolver el backend:**
```json
{
  "pageType": "locations-main",
  "language": "es",
  "seo": {
    "title": "Ubicaciones Disponibles | CLIC",
    "description": "Explora todas las ciudades y sectores donde tenemos propiedades disponibles",
    "h1": "Explora Ubicaciones",
    "h2": "Encuentra propiedades en las mejores zonas",
    "keywords": "ubicaciones, ciudades, sectores, zonas, República Dominicana",
    "canonical_url": "/ubicaciones",
    "breadcrumbs": [
      {"name": "Inicio", "url": "/"},
      {"name": "Ubicaciones", "url": "/ubicaciones"}
    ]
  },
  "locations": {
    "countries": [
      {
        "name": "República Dominicana",
        "slug": "republica-dominicana",
        "count": 5000
      }
    ],
    "cities": [
      {
        "name": "Santo Domingo",
        "slug": "santo-domingo",
        "count": 1234,
        "image": "/images/cities/santo-domingo.jpg"
      },
      {
        "name": "Santiago",
        "slug": "santiago",
        "count": 567,
        "image": "/images/cities/santiago.jpg"
      }
    ],
    "sectors": [
      {
        "name": "Piantini",
        "city": "Santo Domingo",
        "slug": "piantini",
        "count": 345
      },
      {
        "name": "Naco",
        "city": "Santo Domingo",
        "slug": "naco",
        "count": 234
      }
    ]
  },
  "stats": {
    "totalCities": 10,
    "totalSectors": 150,
    "totalProperties": 5000
  },
  "featuredLocations": [],
  "popularSearches": [],
  "globalConfig": {},
  "country": {},
  "trackingString": ""
}
```

---

### 2. **Tipos de Propiedades** (`/propiedades`)
- **Layout:** `src/layouts/PropertyTypesLayout.astro`
- **Rutas multiidioma:**
  - ES: `/propiedades`
  - EN: `/en/property-types`
  - FR: `/fr/types-de-proprietes`
- **pageType esperado:** `property-types-main`

**Estructura de datos que debe devolver el backend:**
```json
{
  "pageType": "property-types-main",
  "language": "es",
  "seo": {
    "title": "Tipos de Propiedades | CLIC",
    "description": "Explora todos los tipos de propiedades disponibles: apartamentos, casas, villas, terrenos y más",
    "h1": "Tipos de Propiedades",
    "h2": "Encuentra el inmueble perfecto para ti",
    "keywords": "tipos de propiedades, apartamentos, casas, villas, terrenos",
    "canonical_url": "/propiedades",
    "breadcrumbs": [
      {"name": "Inicio", "url": "/"},
      {"name": "Tipos de Propiedades", "url": "/propiedades"}
    ]
  },
  "propertyTypes": [
    {
      "type": "Apartamentos",
      "slug": "apartamentos",
      "count": 1234,
      "icon": "🏢",
      "description": "Modernos espacios urbanos",
      "image": "/images/types/apartamentos.jpg"
    },
    {
      "type": "Casas",
      "slug": "casas",
      "count": 567,
      "icon": "🏠",
      "description": "Espacios familiares amplios"
    },
    {
      "type": "Villas",
      "slug": "villas",
      "count": 234,
      "icon": "🏰",
      "description": "Lujo y exclusividad"
    }
  ],
  "featuredByType": {
    "apartamentos": [
      // Array de propiedades (mismo formato que property-list)
    ],
    "casas": [
      // Array de propiedades
    ]
  },
  "globalConfig": {},
  "country": {},
  "trackingString": ""
}
```

---

### 3. **Términos y Condiciones** (`/terminos-y-condiciones`)
- **Layout:** `src/layouts/LegalLayout.astro` (reutilizable)
- **Rutas multiidioma:**
  - ES: `/terminos-y-condiciones`
  - EN: `/en/terms-and-conditions`
  - FR: `/fr/termes-et-conditions`
- **pageType esperado:** `legal-terms`

**Estructura de datos que debe devolver el backend:**
```json
{
  "pageType": "legal-terms",
  "language": "es",
  "legalType": "terms",
  "seo": {
    "title": "Términos y Condiciones | CLIC",
    "description": "Lee nuestros términos y condiciones de uso",
    "h1": "Términos y Condiciones",
    "h2": "Condiciones de uso del sitio web y servicios",
    "robots": "noindex, follow",
    "canonical_url": "/terminos-y-condiciones"
  },
  "content": {
    "sections": [
      {
        "title": "1. Aceptación de los Términos",
        "content": "Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones..."
      },
      {
        "title": "2. Uso del Sitio",
        "content": "Este sitio web y su contenido son para su información general y uso personal..."
      },
      {
        "title": "3. Propiedad Intelectual",
        "content": "Este sitio web contiene material que es propiedad de CLIC Inmobiliaria..."
      }
    ]
  },
  "lastUpdated": "2025-01-15",
  "jurisdiction": "República Dominicana",
  "globalConfig": {},
  "country": {},
  "trackingString": ""
}
```

---

### 4. **Políticas de Privacidad** (`/politicas-de-privacidad`)
- **Layout:** `src/layouts/LegalLayout.astro` (mismo que términos)
- **Rutas multiidioma:**
  - ES: `/politicas-de-privacidad`
  - EN: `/en/privacy-policy`
  - FR: `/fr/politique-de-confidentialite`
- **pageType esperado:** `legal-privacy`

**Estructura de datos que debe devolver el backend:**
```json
{
  "pageType": "legal-privacy",
  "language": "es",
  "legalType": "privacy",
  "seo": {
    "title": "Política de Privacidad | CLIC",
    "description": "Conoce cómo protegemos tu información personal",
    "h1": "Política de Privacidad",
    "h2": "Cómo manejamos y protegemos tu información",
    "robots": "noindex, follow",
    "canonical_url": "/politicas-de-privacidad"
  },
  "content": {
    "sections": [
      {
        "title": "1. Recopilación de Información",
        "content": "Recopilamos información que usted nos proporciona directamente cuando crea una cuenta..."
      },
      {
        "title": "2. Uso de la Información",
        "content": "Utilizamos la información que recopilamos para proporcionar, mantener y mejorar nuestros servicios..."
      },
      {
        "title": "3. Protección de Datos",
        "content": "Implementamos medidas de seguridad técnicas y organizativas apropiadas..."
      }
    ]
  },
  "lastUpdated": "2025-01-15",
  "jurisdiction": "República Dominicana",
  "globalConfig": {},
  "country": {},
  "trackingString": ""
}
```

---

## Cambios en el Router

### Archivo: `src/pages/[...slug].astro`

**Rutas especiales agregadas:**
```javascript
const SPECIAL_ROUTES = [
  // ... rutas existentes ...
  'ubicaciones','propiedades','terminos-y-condiciones','politicas-de-privacidad',
  'locations','property-types','terms-and-conditions','privacy-policy',
  'emplacements','types-de-proprietes','termes-et-conditions','politique-de-confidentialite'
];
```

**pageTypes agregados:**
```javascript
const showLocationsMain = pageType === 'locations-main';
const showPropertyTypesMain = pageType === 'property-types-main';
const showLegalTerms = pageType === 'legal-terms';
const showLegalPrivacy = pageType === 'legal-privacy';
```

---

## Navegación Actual

Las páginas ahora están accesibles en:
- `http://localhost:4321/ubicaciones`
- `http://localhost:4321/propiedades`
- `http://localhost:4321/terminos-y-condiciones`
- `http://localhost:4321/politicas-de-privacidad`

Y en inglés/francés con prefijos `/en/` y `/fr/`.

**Nota:** Actualmente muestran contenido demo. Cuando el backend devuelva los pageTypes correctos con datos reales, las páginas se renderizarán con ese contenido.

---

## Próximos Pasos (Backend)

1. **Crear handlers en content-backend** para cada una de estas rutas
2. **Detectar la ruta** y devolver el `pageType` correspondiente
3. **Generar contenido dinámico** basado en:
   - Datos de la base de datos (ubicaciones, tipos de propiedades)
   - Configuración por franquicia (términos legales)
   - Idioma del usuario
4. **Implementar SEO dinámico** para cada página según el país/idioma

---

## Notas Importantes

- Todas las páginas siguen el mismo esquema visual que el resto del sitio (hero + contenido + CTA)
- Todas soportan multiidioma (es/en/fr)
- LegalLayout es reutilizable para cualquier contenido legal futuro
- Los layouts tienen datos demo hardcodeados que se pueden ver funcionando inmediatamente
- Las rutas están configuradas para usar `content-backend` (no `main-backend`)
