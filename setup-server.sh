#!/bin/bash

# Script de configuración inicial del servidor Linux
# Uso: ./setup-server.sh

echo "🔧 Configurando servidor Linux para FormularioApp..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (versión LTS)
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Apache
echo "🌐 Instalando Apache..."
sudo apt install -y apache2

# Instalar MySQL
echo "🗄️ Instalando MySQL..."
sudo apt install -y mysql-server

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot..."
sudo apt install -y certbot python3-certbot-apache

# Instalar herramientas adicionales
echo "🛠️ Instalando herramientas adicionales..."
sudo apt install -y curl wget git unzip

# Habilitar módulos de Apache necesarios
echo "⚙️ Habilitando módulos de Apache..."
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4173/tcp
sudo ufw --force enable

# Crear usuario para la aplicación
echo "👤 Creando usuario de aplicación..."
sudo useradd -m -s /bin/bash formularioapp
sudo usermod -aG www-data formularioapp

# Configurar MySQL
echo "🗄️ Configurando MySQL..."
sudo mysql_secure_installation

echo "✅ Configuración inicial completada!"
echo "📋 Próximos pasos:"
echo "   1. Configurar base de datos MySQL"
echo "   2. Ejecutar deploy.sh"
echo "   3. Configurar virtual host de Apache"
echo "   4. Obtener certificado SSL"
echo "   5. Configurar DNS"
