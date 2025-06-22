#!/bin/sh

# Default values
SSL_ENABLED=${SSL_ENABLED:-false}
SSL_CERT_PATH=${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}
SSL_KEY_PATH=${SSL_KEY_PATH:-/etc/nginx/ssl/key.pem}

echo "🔧 Configuring nginx..."
echo "SSL_ENABLED: $SSL_ENABLED"

if [ "$SSL_ENABLED" = "true" ]; then
    echo "🔒 SSL enabled - using HTTPS configuration"
    
    # Check if SSL certificates exist
    if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
        echo "❌ ERROR: SSL certificates not found!"
        echo "Expected cert: $SSL_CERT_PATH"
        echo "Expected key: $SSL_KEY_PATH"
        echo "Please mount your SSL certificates to the container"
        exit 1
    fi
    
    # Use SSL configuration
    cp /etc/nginx/nginx-ssl.conf /etc/nginx/nginx.conf
    echo "✅ Using SSL configuration with HTTPS redirect"
    
    # Expose port 443
    echo "🌐 Nginx will serve on ports 80 (redirect) and 443 (HTTPS)"
else
    echo "🔓 SSL disabled - using HTTP configuration"
    cp /etc/nginx/nginx-http.conf /etc/nginx/nginx.conf
    echo "✅ Using HTTP configuration"
    echo "🌐 Nginx will serve on port 80 (HTTP only)"
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🚀 Starting nginx..."
    exec nginx -g 'daemon off;'
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi 