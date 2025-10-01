#!/bin/bash

# Script de despliegue para Linux
# Uso: ./deploy.sh

echo "🚀 Iniciando despliegue de FormularioApp..."

# Variables
APP_DIR="/var/www/chequeos.grupozafra.com.ar"
BACKUP_DIR="/var/backups/formularioapp"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorios si no existen
echo "📁 Creando directorios..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $BACKUP_DIR

# Backup de la versión anterior si existe
if [ -d "$APP_DIR/cliente" ] || [ -d "$APP_DIR/servidor" ]; then
    echo "💾 Creando backup de la versión anterior..."
    sudo tar -czf "$BACKUP_DIR/formularioapp_backup_$DATE.tar.gz" -C $APP_DIR .
fi

# Copiar archivos de la aplicación
echo "📦 Copiando archivos de la aplicación..."
sudo cp -r cliente/ $APP_DIR/
sudo cp -r servidor/ $APP_DIR/

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd $APP_DIR/servidor
sudo npm install --production

# Instalar dependencias del frontend y hacer build
echo "🏗️ Construyendo aplicación frontend..."
cd $APP_DIR/cliente
sudo npm install
sudo npm run build

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Crear servicio systemd para el backend
echo "⚙️ Configurando servicio systemd..."
sudo tee /etc/systemd/system/formularioapp-backend.service > /dev/null <<EOF
[Unit]
Description=FormularioApp Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/servidor
ExecStart=/usr/bin/node bd.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable formularioapp-backend
sudo systemctl restart formularioapp-backend

# Verificar estado del servicio
echo "✅ Verificando estado del servicio..."
sudo systemctl status formularioapp-backend --no-pager

echo "🎉 Despliegue completado!"
echo "📋 Próximos pasos:"
echo "   1. Configurar Apache virtual host"
echo "   2. Configurar SSL con Let's Encrypt"
echo "   3. Configurar firewall para puerto 5174"
echo "   4. Verificar conectividad de base de datos"
