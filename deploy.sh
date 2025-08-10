#!/bin/bash

# Debian Server Setup Script for Angular Application
# This script helps configure your Debian server to handle Angular routing

echo "🚀 Setting up Debian server for Angular routing..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

# Detect web server
if command -v nginx &> /dev/null; then
    WEB_SERVER="nginx"
    echo "✅ Detected nginx"
elif command -v apache2 &> /dev/null; then
    WEB_SERVER="apache"
    echo "✅ Detected Apache"
else
    echo "❌ No web server detected. Please install nginx or Apache first."
    exit 1
fi

# Create web directory
WEB_DIR="/var/www/brainfryer.com"
echo "📁 Creating web directory: $WEB_DIR"
mkdir -p $WEB_DIR

# Copy your Angular build files
echo "📦 Copying Angular build files..."
# Adjust this path to match your build output
cp -r dist/auction-frontend/browser/* $WEB_DIR/

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR

if [ "$WEB_SERVER" = "nginx" ]; then
    echo "🔧 Configuring nginx..."
    
    # Copy nginx configuration
    cp nginx.conf /etc/nginx/sites-available/brainfryer.com
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/brainfryer.com /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm /etc/nginx/sites-enabled/default
    fi
    
    # Test nginx configuration
    echo "🧪 Testing nginx configuration..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ nginx configuration is valid"
        systemctl reload nginx
        echo "🔄 nginx reloaded"
    else
        echo "❌ nginx configuration test failed"
        exit 1
    fi
    
elif [ "$WEB_SERVER" = "apache" ]; then
    echo "🔧 Configuring Apache..."
    
    # Copy .htaccess file
    cp .htaccess $WEB_DIR/
    
    # Enable required Apache modules
    echo "🔧 Enabling Apache modules..."
    a2enmod rewrite
    a2enmod headers
    a2enmod expires
    a2enmod deflate
    
    # Create Apache virtual host
    cat > /etc/apache2/sites-available/brainfryer.com.conf << 'EOF'
<VirtualHost *:80>
    ServerName brainfryer.com
    ServerAlias www.brainfryer.com
    DocumentRoot /var/www/brainfryer.com
    
    <Directory /var/www/brainfryer.com>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/brainfryer.com_error.log
    CustomLog ${APACHE_LOG_DIR}/brainfryer.com_access.log combined
</VirtualHost>
EOF
    
    # Enable the site
    a2ensite brainfryer.com.conf
    
    # Disable default site
    a2dissite 000-default.conf
    
    # Test Apache configuration
    echo "🧪 Testing Apache configuration..."
    apache2ctl configtest
    
    if [ $? -eq 0 ]; then
        echo "✅ Apache configuration is valid"
        systemctl reload apache2
        echo "🔄 Apache reloaded"
    else
        echo "❌ Apache configuration test failed"
        exit 1
    fi
fi

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your DNS to point brainfryer.com to this server"
echo "2. Install SSL certificate (Let's Encrypt recommended)"
echo "3. Test your site: https://brainfryer.com"
echo ""
echo "🔧 For SSL with Let's Encrypt:"
echo "   certbot --$WEB_SERVER -d brainfryer.com -d www.brainfryer.com"
echo ""
echo "📁 Your files are located at: $WEB_DIR"
