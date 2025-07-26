#!/bin/bash

# M-Pesa Callback Service Docker Deployment Script
# Usage: ./scripts/docker-deploy.sh [production|development]

set -e

ENVIRONMENT=${1:-"development"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🐳 Starting Docker deployment for $ENVIRONMENT environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create backup of current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup.$TIMESTAMP"
    cp .env .env.backup.$TIMESTAMP
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📋 Creating .env from example.env"
    cp example.env .env
    echo "⚠️  Please update the .env file with your actual credentials"
    echo "📝 Edit .env file now? (y/n)"
    read -r edit_env
    if [ "$edit_env" = "y" ]; then
        ${EDITOR:-nano} .env
    fi
fi

# Set environment in .env file
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔧 Configuring for production environment..."
    sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
    sed -i 's/PORT=.*/PORT=3000/' .env
    sed -i 's/LOG_LEVEL=.*/LOG_LEVEL=warn/' .env
else
    echo "🔧 Configuring for development environment..."
    sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env
    sed -i 's/PORT=.*/PORT=5000/' .env
    sed -i 's/LOG_LEVEL=.*/LOG_LEVEL=debug/' .env
fi

# Validate environment variables
echo "🔍 Validating environment configuration..."
source .env

required_vars=(
    "PROJECT_NAME"
    "FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64"
    "MPESA_CONSUMER_KEY"
    "MPESA_CONSUMER_SECRET"
    "MPESA_PASSKEY"
    "MPESA_SHORTCODE"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"your-"* ]]; then
        echo "❌ Missing or placeholder value for required environment variable: $var"
        exit 1
    fi
done

echo "✅ Environment validation passed"

# Create necessary directories
mkdir -p logs

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f 2>/dev/null || true

# Build and start containers
echo "🔨 Building and starting containers..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    docker-compose up -d --build
fi

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 15

# Health check
echo "🏥 Performing health check..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:${PORT:-3000}/health >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "📋 Container logs:"
        docker-compose logs --tail=50 mpesa-callback
        exit 1
    fi
    
    echo "⏳ Health check attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
    sleep 2
    ((attempt++))
done

echo "✅ Docker deployment completed successfully!"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "🔧 Useful Commands:"
echo "📋 View logs: docker-compose logs -f mpesa-callback"
echo "🔍 Monitor: docker stats"
echo "🛑 Stop: docker-compose down"
echo "🔄 Restart: docker-compose restart"
echo "🌐 Health check: curl http://localhost:${PORT:-3000}/health"
echo "📊 API info: curl http://localhost:${PORT:-3000}/api/"

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "🚀 Production Deployment Notes:"
    echo "- Update your M-Pesa callback URL to: https://yourdomain.com/api/mpesa/callback"
    echo "- Ensure SSL certificate is configured"
    echo "- Monitor logs regularly: docker-compose logs -f"
    echo "- Set up log rotation for production"
fi