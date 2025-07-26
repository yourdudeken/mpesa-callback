# M-Pesa Callback Service Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🚀 Starting deployment" -ForegroundColor Green

# Create backup of current .env if it exists
if (Test-Path ".env") {
    Write-Host "📦 Backing up current .env to .env.backup.$Timestamp" -ForegroundColor Blue
    Copy-Item ".env" ".env.backup.$Timestamp"
}

# Check if .env exists, if not copy from example.env
if (-not (Test-Path ".env")) {
    Write-Host "📋 Creating .env from example.env" -ForegroundColor Blue
    Copy-Item "example.env" ".env"
    Write-Host "⚠️  Please update the .env file with your actual credentials before continuing" -ForegroundColor Yellow
    Write-Host "📝 Edit .env file now? (y/n)" -ForegroundColor Yellow
    $editEnv = Read-Host
    if ($editEnv -eq "y") {
        notepad .env
    }
} else {
    Write-Host "📋 Using existing .env file" -ForegroundColor Blue
} else {
    Write-Host "📋 Using existing .env file or example.env" -ForegroundColor Blue
    if (-not (Test-Path ".env")) {
        Copy-Item "example.env" ".env"
        Write-Host "⚠️  Please update the .env file with your actual credentials" -ForegroundColor Yellow
        exit 1
    }
}

# Validate required environment variables
Write-Host "🔍 Validating environment configuration..." -ForegroundColor Blue

# Load .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

$requiredVars = @(
    "PROJECT_NAME",
    "FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64",
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_PASSKEY",
    "MPESA_SHORTCODE"
)

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if (-not $value -or $value -eq "your-$($var.ToLower().Replace('_', '-'))") {
        Write-Host "❌ Missing or placeholder value for required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment validation passed" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm ci --production

# Create logs directory
New-Item -ItemType Directory -Path "logs" -Force | Out-Null

# Stop existing PM2 process if running
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Blue
try {
    npm run pm2-stop 2>$null
} catch {
    # Ignore if process doesn't exist
}

# Start with PM2
Write-Host "🚀 Starting application with PM2..." -ForegroundColor Blue
npm run pm2-start

# Save PM2 configuration
npm run pm2-save

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 Check status: npm run pm2-status" -ForegroundColor Blue
Write-Host "📋 View logs: npm run logs" -ForegroundColor Blue
Write-Host "🔍 Monitor: npm run monitor" -ForegroundColor Blue

$port = [Environment]::GetEnvironmentVariable("PORT", "Process")
if (-not $port) { $port = "3000" }
Write-Host "🌐 Health check: curl http://localhost:$port/health" -ForegroundColor Blue