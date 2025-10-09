// Configuración de API para la aplicación
// Base URL dinámica por entorno
// - Desarrollo (npm run dev): usa el proxy de Vite → "/api"
// - Producción interna (Linux, LAN): http://192.168.0.222:4173/api
// - Producción externa (Linux, dominio): https://chequeos.grupozafra.com.ar:4173/api
//
// URLs fijas que funcionaban antes (CON puerto 4173)

// Función helper para formatear fechas en zona horaria de Argentina
export const formatArgentinaDate = (dateString) => {
  if (!dateString) return '';
  try {
    // If already in target format YYYY-MM-DD HH:MM:SS, return as-is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Try to parse the incoming value into a Date.
    // Accept ISO strings, strings with space, or timestamps.
    let d = new Date(dateString);
    if (isNaN(d.getTime())) {
      // Attempt a fallback: replace space with 'T' and append 'Z' to treat as UTC
      if (typeof dateString === 'string' && dateString.includes(' ')) {
        const iso = dateString.replace(' ', 'T') + 'Z';
        d = new Date(iso);
      }
    }
    if (isNaN(d.getTime())) return String(dateString);

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
  } catch (err) {
    return String(dateString);
  }
};
const BASE_URL_LAN = 'http://192.168.0.222:4173/api';
const BASE_URL_DOMAIN = 'https://chequeos.grupozafra.com.ar:4173/api';

const isDev = import.meta && import.meta.env && import.meta.env.DEV;
const isInternalNetwork = typeof window !== 'undefined' && window.location.hostname === '192.168.0.222';
const baseUrl = isDev ? '/api' : (isInternalNetwork ? BASE_URL_LAN : BASE_URL_DOMAIN);

const API_CONFIG = {
  // URL base de la API usando detección automática
  BASE_URL: import.meta.env.VITE_API_URL || baseUrl,
  
  // Endpoints específicos
  ENDPOINTS: {
    LOGIN: '/login',
    TIPOS_MAQUINAS: '/tipos-maquinas',
    MODELOS_MAQUINAS: '/modelos-maquinas',
    CHEQUEOS_MAQUINA: '/chequeos-maquina',
    CHEQUEOS_TIPO_MAQUINA: '/chequeos-tipo-maquina',
    CLIENTES: '/clientes',
    SESIONES: '/sesiones',
    RESPUESTAS: '/respuestas',
    TIPOS_CHEQUEOS: '/tipos-chequeos',
    HISTORIAL: '/historial-chequeos',
    UPLOAD_IMAGES: '/upload-images',
    IMAGES: (idSesion) => `/images/${idSesion}`,
    IMAGE: (fileName) => `/image/${fileName}`,
    UPLOAD_DOCS: '/upload-docs',
    DOCS: (idSesion) => `/docs/${idSesion}`,
    DOCUMENT: (fileName) => `/document/${fileName}`,
    SESION_DETALLE: (idSesion) => `/sesiones/${idSesion}`,
    SESION_RESPUESTAS: (idSesion) => `/sesiones/${idSesion}/respuestas`
  }
};

// Función helper para construir URLs completas
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// URLs específicas exportadas
export const API_URLS = {
  LOGIN: getApiUrl(API_CONFIG.ENDPOINTS.LOGIN),
  TIPOS_MAQUINAS: getApiUrl(API_CONFIG.ENDPOINTS.TIPOS_MAQUINAS),
  MODELOS_MAQUINAS: (idTipoMaquina) => getApiUrl(`${API_CONFIG.ENDPOINTS.MODELOS_MAQUINAS}/${idTipoMaquina}`),
  CHEQUEOS_MAQUINA: (idModeloMaquina) => getApiUrl(`${API_CONFIG.ENDPOINTS.CHEQUEOS_MAQUINA}/${idModeloMaquina}`),
  CHEQUEOS_TIPO_MAQUINA: (idTipoMaquina) => getApiUrl(`${API_CONFIG.ENDPOINTS.CHEQUEOS_TIPO_MAQUINA}/${idTipoMaquina}`),
  SESIONES: getApiUrl(API_CONFIG.ENDPOINTS.SESIONES),
  RESPUESTAS: getApiUrl(API_CONFIG.ENDPOINTS.RESPUESTAS),
  TIPOS_CHEQUEOS: getApiUrl(API_CONFIG.ENDPOINTS.TIPOS_CHEQUEOS),
  HISTORIAL: getApiUrl(API_CONFIG.ENDPOINTS.HISTORIAL),
  CLIENTES: getApiUrl(API_CONFIG.ENDPOINTS.CLIENTES),
  UPLOAD_IMAGES: getApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_IMAGES),
  IMAGES: (idSesion) => getApiUrl(API_CONFIG.ENDPOINTS.IMAGES(idSesion)),
  IMAGE: (fileName) => getApiUrl(API_CONFIG.ENDPOINTS.IMAGE(fileName)),
  UPLOAD_DOCS: getApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_DOCS),
  DOCS: (idSesion) => getApiUrl(API_CONFIG.ENDPOINTS.DOCS(idSesion)),
  DOCUMENT: (fileName) => getApiUrl(API_CONFIG.ENDPOINTS.DOCUMENT(fileName)),
  SESION_DETALLE: (idSesion) => getApiUrl(API_CONFIG.ENDPOINTS.SESION_DETALLE(idSesion)),
  SESION_RESPUESTAS: (idSesion) => getApiUrl(API_CONFIG.ENDPOINTS.SESION_RESPUESTAS(idSesion))
};

export default API_CONFIG;

