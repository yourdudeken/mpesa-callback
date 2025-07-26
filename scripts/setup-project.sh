#!/bin/bash

# M-Pesa Callback Service Project Setup Script
# Usage: ./scripts/setup-project.sh <project-name>

set -e

PROJECT_NAME=${1}

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Usage: ./scripts/setup-project.sh <project-name>"
    echo "� Example: ./scripts/setup-project.sh my-ecommerce-store"
    exit 1
fi

echo "🚀 Setting up M-Pesa callback service for: $PROJECT_NAME"

# Create project directory
PROJECT_DIR="../$PROJECT_NAME-mpesa-callback"
echo "📁 Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"

# Copy all files except node_modules, logs, and .env files
echo "📋 Copying project files..."

# Windows-compatible file copying
if command -v rsync >/dev/null 2>&1; then
    # Use rsync if available (Linux/Mac/WSL)
    rsync -av --exclude='node_modules' --exclude='logs' --exclude='.env*' --exclude='.git' . "$PROJECT_DIR/"
else
    # Use cp for basic copying (works on Git Bash)
    cp -r . "$PROJECT_DIR/"
    # Remove excluded directories/files if they exist
    rm -rf "$PROJECT_DIR/node_modules" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/logs" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/.git" 2>/dev/null || true
    rm -f "$PROJECT_DIR/.env"* 2>/dev/null || true
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Copy example.env and update project name
echo "📋 Setting up environment configuration"
cp example.env .env
sed -i "s/PROJECT_NAME=.*/PROJECT_NAME=$PROJECT_NAME-mpesa-callback/" .env

# Create logs directory
mkdir -p logs

# Initialize git repository
echo "🔧 Initializing git repository..."
git init
git add .
git commit -m "Initial commit: M-Pesa callback service for $PROJECT_NAME"

echo "✅ Project setup completed!"
echo "📁 Project location: $PROJECT_DIR"
echo ""
echo "🔧 Next steps:"
echo "1. cd $PROJECT_DIR"
echo "2. Edit .env file with your credentials"
echo "3. npm install"
echo "4. npm run dev (for development) or ./scripts/deploy.sh (for production)"
echo ""
echo "📋 Don't forget to:"
echo "- Update Firebase service account credentials"
echo "- Update M-Pesa API credentials"
echo "- Configure your callback URL in M-Pesa dashboard"