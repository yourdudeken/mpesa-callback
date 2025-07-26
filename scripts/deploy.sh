#!/bin/bash

# M-Pesa Callback Service Deployment Script
# Usage: ./scripts/deploy.sh [project-template]

set -e

PROJECT_TEMPLATE=${1:-"default"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Starting deployment for: $PROJECT_TEMPLATE"

# Create backup of current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup.$TIMESTAMP"
    cp .env .env.backup.$TIMESTAMP
fi

# Copy template if specified
if [ "$PROJECT_TEMPLATE" != "default" ] && [ -f "templates/$PROJECT_TEMPLATE.env" ]; then
    echo "📋 Using template: templates/$PROJECT_TEMPLATE.env"
    cp "templates/$PROJECT_TEMPLATE.env" .env
    echo "⚠️  Please update the .env file with your actual credentials before continuing"
    echo "📝 Edit .env file now? (y/n)"
    read -r edit_env
    if [ "$edit_env" = "y" ]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "📋 Using existing .env file or example.env"
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

echo "✅ Deployment completed successfully!"
echo "📊 Check status: npm run pm2-status"
echo "📋 View logs: npm run logs"
echo "🔍 Monitor: npm run monitor"
echo "🌐 Health check: curl http://localhost:${PORT:-3000}/health"