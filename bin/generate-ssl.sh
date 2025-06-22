#!/bin/bash

# Simple SSL Certificate Generator for Let's Encrypt
# Usage: ./generate-ssl.sh yourdomain.com

DOMAIN=${1:-"localhost"}

if [ "$DOMAIN" = "localhost" ]; then
    echo "⚠️  No domain provided, generating self-signed certificate for localhost"
    echo "Usage: $0 yourdomain.com"
    echo "Continuing with localhost..."
fi

echo "🔒 Generating SSL certificate for: $DOMAIN"

# Create ssl directory
mkdir -p ssl

if [ "$DOMAIN" = "localhost" ]; then
    # Generate self-signed certificate for localhost/development
    echo "📝 Creating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    echo "✅ Self-signed certificate generated!"
    echo "⚠️  Browser will show security warning (normal for self-signed)"
    
else
    # Generate Let's Encrypt certificate for real domain
    echo "🌐 Generating Let's Encrypt certificate..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y certbot
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install certbot
        fi
    fi
    
    # Stop containers to free port 80
    echo "🛑 Stopping containers..."
    docker-compose down 2>/dev/null || true
    
    # Generate certificate
    sudo certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN
    
    # Copy certificates
    echo "📋 Copying certificates..."
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
    sudo chown $(whoami):$(whoami) ssl/cert.pem ssl/key.pem
    
    echo "✅ Let's Encrypt certificate generated!"
fi

# Set permissions
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

echo ""
echo "📁 Certificates created:"
echo "   - ssl/cert.pem"
echo "   - ssl/key.pem"
echo ""
echo "🚀 To enable SSL:"
echo "   1. Set SSL_ENABLED=true in your .env file"
echo "   2. Run: docker-compose up -d"
echo ""
if [ "$DOMAIN" != "localhost" ]; then
    echo "🔄 To renew certificate later:"
    echo "   sudo certbot renew && sudo cp /etc/letsencrypt/live/$DOMAIN/*.pem ssl/"
fi
