<h1 align="center">FormularioApp</h1>

<p align="center">
  <b>FormularioApp</b> es una solución integral para la gestión de chequeos, informes y revisiones técnicas de maquinaria agrícola, desarrollada para el Grupo Zafra. Permite a técnicos y personal autorizado registrar, consultar e imprimir informes de mantenimiento y control de equipos, integrando frontend moderno, backend robusto y una base de datos relacional.
</p>

<hr>

<h2>🛠️ Tecnologías utilizadas</h2>
<ul>
  <li><b>Frontend:</b>
    <ul>
      <li><a href="https://react.dev/">React</a> 18 (con <a href="https://vitejs.dev/">Vite</a> para desarrollo y build)</li>
      <li><a href="https://tailwindcss.com/">Tailwind CSS</a> para estilos rápidos y responsivos</li>
      <li><a href="https://www.framer.com/motion/">Framer Motion</a> para animaciones</li>
      <li><a href="https://reactrouter.com/">React Router DOM</a> para navegación SPA</li>
      <li>Estructura modular de componentes (por tipo de chequeo, historial, login, etc.)</li>
    </ul>
  </li>
  <li><b>Backend:</b>
    <ul>
      <li><a href="https://nodejs.org/">Node.js</a> (Express)</li>
      <li><a href="https://www.mysql.com/">MySQL</a> como base de datos relacional</li>
      <li><a href="https://www.npmjs.com/package/mysql2">mysql2</a> para conexión eficiente</li>
      <li><a href="https://www.npmjs.com/package/dotenv">dotenv</a> para configuración por entorno</li>
      <li><a href="https://www.npmjs.com/package/cors">CORS</a> seguro y configurable</li>
    </ul>
  </li>
  <li><b>Infraestructura y despliegue:</b>
    <ul>
      <li><a href="https://nginx.org/">Nginx</a> como servidor web y proxy inverso (SPA + API)</li>
      <li><a href="https://httpd.apache.org/">Apache</a> (opcional, ejemplo de virtual host)</li>
      <li><a href="https://certbot.eff.org/">Certbot</a> para SSL automático (Let's Encrypt)</li>
      <li>Scripts de despliegue y setup para Linux (Ubuntu/Debian)</li>
      <li>Soporte para acceso interno (LAN) y externo (dominio con HTTPS)</li>
    </ul>
  </li>
</ul>

<h2>🚀 Funcionalidades principales</h2>
<ul>
  <li><b>Autenticación de usuarios:</b>
    <ul>
      <li>Login seguro con validación de credenciales y persistencia de sesión.</li>
    </ul>
  </li>
  <li><b>Chequeos y formularios dinámicos:</b>
    <ul>
      <li>Chequeos de presión, funcionamiento general, neumáticos, inyectores/turbo, e informes generales de tractor.</li>
      <li>Formularios adaptativos según el tipo de máquina y chequeo.</li>
      <li>Inputs validados, radios, selects y campos de observaciones.</li>
      <li>Guardado de respuestas en lote y control de sesiones.</li>
    </ul>
  </li>
  <li><b>Historial y detalle de sesiones:</b>
    <ul>
      <li>Búsqueda y filtrado por cliente, modelo, tipo de chequeo, fechas, etc.</li>
      <li>Visualización detallada de cada sesión, con respuestas y datos asociados.</li>
      <li>Modo solo-lectura para historial, con inputs bloqueados y vista optimizada para impresión.</li>
    </ul>
  </li>
  <li><b>Impresión profesional:</b>
    <ul>
      <li>Estilos específicos para impresión en A4.</li>
      <li>Sección de firmas para cliente y técnico.</li>
      <li>Botón de impresión y ocultación de elementos auxiliares.</li>
    </ul>
  </li>
  <li><b>Configuración flexible:</b>
    <ul>
      <li>Selección automática de API según entorno (LAN o dominio).</li>
      <li>Variables de entorno para base de datos, CORS y puertos.</li>
      <li>Scripts para setup inicial, despliegue y backup.</li>
    </ul>
  </li>
</ul>

<h2>📁 Estructura del proyecto</h2>
<pre>
cliente/         # Frontend React + Vite
  public/        # Assets públicos (favicon, logos)
  src/           # Código fuente (componentes, estilos, config)
  index.html     # Entrada principal SPA
  vite.config.js # Configuración Vite y proxy API
servidor/        # Backend Node.js + Express
  bd.js          # Lógica principal de API y conexión MySQL
  config.env     # Variables de entorno para producción
DEPLOYMENT.md    # Guía completa de despliegue y configuración
setup-server.sh  # Script de setup inicial para Linux
deploy.sh        # Script de despliegue y backup
apache-virtualhost.conf # Ejemplo de configuración Apache
</pre>

<h2>📝 Instalación y despliegue</h2>
<p>
Ver <code>DEPLOYMENT.md</code> para instrucciones detalladas de instalación, configuración de base de datos, despliegue en Linux, setup de Nginx/Apache, SSL y solución de problemas.
</p>

<h2>🔒 Licencia</h2>
<p>
Este proyecto es propiedad de Grupo Zafra S.A. y su uso está restringido a fines internos.
</p>
