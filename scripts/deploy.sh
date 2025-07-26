#!/bin/bash

# M-Pesa Callback Service Deployment Script
# Usage: ./scripts/deploy.sh [docker|pm2]

set -e

DEPLOYMENT_TYPE=${1:-"pm2"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Starting deployment with $DEPLOYMENT_TYPE"

# Create backup of current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup.$TIMESTAMP"
    cp .env .env.backup.$TIMESTAMP
fi

# Check if .env exists, if not copy from example.env
if [ ! -f ".env" ]; then
    echo "📋 Creating .env from example.env"
    cp example.env .env
    echo "⚠️  Please update the .env file with your actual credentials before continuing"
    echo "📝 Edit .env file now? (y/n)"
    read -r edit_env
    if [ "$edit_env" = "y" ]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "📋 Using existing .env file"
    if [ ! -f ".env" ]; then
        cp example.env .env
        echo "⚠️  Please update the .env file with your actual credentials"
        exit 1
    fi
fi

# Validate required environment variables
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
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

echo "✅ Environment validation passed"

# Deploy based on type
if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
    echo "🐳 Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Build and start containers
    echo "🔨 Building and starting containers..."
    docker-compose up -d --build
    
    # Wait for containers to be ready
    echo "⏳ Waiting for containers to be ready..."
    sleep 10
    
    echo "✅ Docker deployment completed successfully!"
    echo "📊 Check status: docker-compose ps"
    echo "📋 View logs: docker-compose logs -f mpesa-callback"
    echo "🔍 Monitor: docker stats"
    echo "🌐 Health check: curl http://localhost:${PORT:-3000}/health"
    
elif [ "$DEPLOYMENT_TYPE" = "pm2" ]; then
    echo "⚡ Deploying with PM2..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm ci --production
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing PM2 process if running
    echo "🛑 Stopping existing processes..."
    npm run pm2-stop 2>/dev/null || true
    
    # Start with PM2
    echo "🚀 Starting application with PM2..."
    npm run pm2-start
    
    # Save PM2 configuration
    npm run pm2-save
    
    echo "✅ PM2 deployment completed successfully!"
    echo "📊 Check status: npm run pm2-status"
    echo "📋 View logs: npm run logs"
    echo "🔍 Monitor: npm run monitor"
    echo "🌐 Health check: curl http://localhost:${PORT:-3000}/health"
    
else
    echo "❌ Invalid deployment type: $DEPLOYMENT_TYPE"
    echo "Usage: ./scripts/deploy.sh [docker|pm2]"
    exit 1
fi