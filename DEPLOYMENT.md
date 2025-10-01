# Despliegue de FormularioApp en Linux (Nginx + Node + MySQL)

Guía paso a paso de todo lo realizado: preparación, build, subida, permisos, Nginx (SPA y proxy API), DNS/puertos, CORS, SSL en 4173 y verificación.

## 1) Prerrequisitos
- Servidor Linux (Ubuntu/Debian) en la LAN: 192.168.0.222 (usuario: `zafraapps`)
- IP pública y router con Port Forwarding 4173 externo → 192.168.0.222:4173 interno
- Dominio: `chequeos.grupozafra.com.ar` apuntando a la IP pública
- Node.js 20+, Nginx, MySQL

## 2) Preparación del servidor
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server unzip curl git

# Abrir puerto 4173 (si se usa UFW)
sudo ufw allow 4173/tcp
sudo ufw reload

# Directorios del proyecto
sudo mkdir -p /var/www/chequeos.grupozafra.com.ar/cliente/dist
sudo mkdir -p /var/www/chequeos.grupozafra.com.ar/servidor

# Propietario temporal para subir con scp
sudo chown -R zafraapps:zafraapps /var/www/chequeos.grupozafra.com.ar/
sudo chmod -R 755 /var/www/chequeos.grupozafra.com.ar/
```

## 3) Base de datos MySQL
```bash
sudo systemctl enable --now mysql
sudo mysql -u root

CREATE DATABASE IF NOT EXISTS chequeos_maquinas;
CREATE USER IF NOT EXISTS 'root1'@'localhost' IDENTIFIED BY 'Lava3005$%&';
GRANT ALL PRIVILEGES ON chequeos_maquinas.* TO 'root1'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4) Backend (Node) – configuración
Archivo `/var/www/chequeos.grupozafra.com.ar/servidor/config.env`:
```
DB_HOST=192.168.0.222
DB_USER=root1
DB_PASSWORD=Lava3005$%&
DB_NAME=chequeos_maquinas
DB_PORT=3306

PORT=5002
NODE_ENV=production

# CORS (interno + externo HTTPS en 4173)
CORS_ORIGIN=http://192.168.0.222:4173,https://chequeos.grupozafra.com.ar:4173
```

Arranque del backend (modo manual):
```bash
cd /var/www/chequeos.grupozafra.com.ar/servidor
node bd.js
```

Probar API directamente en el servidor:
```bash
curl http://127.0.0.1:5002/api/tipos-maquinas
```

## 5) Frontend (Vite/React) – build y subida
En Windows (proyecto local):
```powershell
cd C:\Users\Maximiliano\Documents\Github\FormularioApp\cliente
npm install
npm run build

cd ..\..
scp -r cliente\dist\* zafraapps@192.168.0.222:/var/www/chequeos.grupozafra.com.ar/cliente/dist/
```

Permisos para Nginx (en Linux):
```bash
sudo chown -R www-data:www-data /var/www/chequeos.grupozafra.com.ar/cliente/dist/
sudo chmod -R 755 /var/www/chequeos.grupozafra.com.ar/cliente/dist/
```

## 6) Configuración de Nginx (SPA + proxy API, puerto 4173)
Archivo `/etc/nginx/sites-available/chequeos.grupozafra.com.ar`:
```nginx
server {
    listen 4173;
    server_name chequeos.grupozafra.com.ar;
    root /var/www/chequeos.grupozafra.com.ar/cliente/dist;
    index index.html;

    # MIME para JS
    location ~* \.(js|mjs)$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a backend Node (5002)
    location /api/ {
        proxy_pass http://127.0.0.1:5002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ @fallback;
    }

    location @fallback {
        rewrite ^.*$ /index.html last;
    }
}
```

Habilitar sitio y recargar:
```bash
sudo ln -sf /etc/nginx/sites-available/chequeos.grupozafra.com.ar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Pruebas desde la LAN:
```bash
curl http://192.168.0.222:4173/
curl http://192.168.0.222:4173/api/tipos-maquinas
```

## 7) DNS y acceso interno/externo
- Externo: A `chequeos.grupozafra.com.ar` → IP pública
- Interno temporal: usar `http://192.168.0.222:4173` (hasta tener DNS interno)

## 8) Frontend – selección dinámica de API (interno/externo)
Archivo `cliente/src/config/api.js` (resumen):
```js
const isInternalNetwork = window.location.hostname === '192.168.0.222';
const baseUrl = isInternalNetwork
  ? 'http://192.168.0.222:4173/api'
  : 'https://chequeos.grupozafra.com.ar:4173/api';
```

## 9) SSL con Certbot en puerto 4173
1) Bloque temporal HTTP para validación y redirección a 4173 (archivo Nginx):
```nginx
server {
    listen 80;
    server_name chequeos.grupozafra.com.ar;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$server_name:4173$request_uri; }
}
```

2) Bloque HTTPS en 4173 con SSL:
```nginx
server {
    listen 4173 ssl;
    server_name chequeos.grupozafra.com.ar;
    root /var/www/chequeos.grupozafra.com.ar/cliente/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/chequeos.grupozafra.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chequeos.grupozafra.com.ar/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # (resto igual al bloque de 4173 sin SSL)
}
```

3) Crear carpeta de validación y recargar Nginx:
```bash
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html
sudo nginx -t && sudo systemctl reload nginx
```

4) Solicitar certificado:
```bash
sudo certbot --nginx -d chequeos.grupozafra.com.ar
sudo certbot certificates
```

5) Renovación automática (crontab root):
```bash
sudo crontab -e
# añadir al final:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 10) Icono (favicon)
- Reemplazado el favicon por `cliente/public/favicon.svg`
- En `cliente/index.html`:
```
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

## 11) Problemas frecuentes y soluciones
- 403 al servir assets: permisos del `dist` (usar `chown www-data` + `chmod 755`).
- MIME incorrecto JS: añadir bloque `location ~* \.(js|mjs)$`.
- SPA rota al refrescar: usar `try_files ... @fallback` + `rewrite /index.html`.
- CORS bloquea login: ajustar `CORS_ORIGIN` en `servidor/config.env` para orígenes interno/externo.
- DNS externo ok, interno no: usar IP interna o configurar DNS interno/router.
- `ERR_CERT_COMMON_NAME_INVALID`: asegurar que el frontend apunte a `https://chequeos.grupozafra.com.ar:4173/api` cuando se usa el dominio.

## 12) Verificación final
```bash
# Frontend
curl -I http://192.168.0.222:4173/
curl -I https://chequeos.grupozafra.com.ar:4173/

# Backend vía Nginx
curl https://chequeos.grupozafra.com.ar:4173/api/tipos-maquinas -k

# Backend directo
curl http://127.0.0.1:5002/api/tipos-maquinas
```

Listo: acceso interno con IP y externo con dominio (HTTPS:4173), con renovación SSL automática y app servida como SPA detrás de Nginx.
