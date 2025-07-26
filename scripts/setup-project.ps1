# M-Pesa Callback Service Project Setup Script (PowerShell)
# Usage: .\scripts\setup-project.ps1 <project-name> [template]

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [string]$Template = "default"
)

$ErrorActionPreference = "Stop"

if (-not $ProjectName) {
    Write-Host "❌ Usage: .\scripts\setup-project.ps1 <project-name> [template]" -ForegroundColor Red
    Write-Host "📋 Available templates: ecommerce-store, saas-platform, mobile-app" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Setting up M-Pesa callback service for: $ProjectName" -ForegroundColor Green

# Create project directory
$ProjectDir = "..\$ProjectName-mpesa-callback"
Write-Host "📁 Creating project directory: $ProjectDir" -ForegroundColor Blue

if (Test-Path $ProjectDir) {
    Write-Host "⚠️  Directory already exists. Remove it? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y") {
        Remove-Item -Recurse -Force $ProjectDir
    } else {
        exit 1
    }
}

New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null

# Copy all files except excluded ones
Write-Host "📋 Copying project files..." -ForegroundColor Blue

$ExcludePatterns = @("node_modules", "logs", ".env*", ".git", "*.log")

Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($item.Name -like $pattern -or $item.FullName -like "*\$pattern\*") {
            $shouldExclude = $true
            break
        }
    }
    -not $shouldExclude
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destinationPath = Join-Path $ProjectDir $relativePath
    $destinationDir = Split-Path $destinationPath -Parent
    
    if (-not (Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    
    if ($_.PSIsContainer -eq $false) {
        Copy-Item $_.FullName $destinationPath -Force
    }
}

# Navigate to project directory
Set-Location $ProjectDir

# Use template if specified
$envFile = ".env"
if ($Template -ne "default" -and (Test-Path "templates\$Template.env")) {
    Write-Host "📋 Using template: $Template" -ForegroundColor Blue
    Copy-Item "templates\$Template.env" $envFile
    
    # Update PROJECT_NAME in .env
    (Get-Content $envFile) -replace "PROJECT_NAME=.*", "PROJECT_NAME=$ProjectName-mpesa-callback" | Set-Content $envFile
} else {
    Write-Host "📋 Using default template" -ForegroundColor Blue
    Copy-Item "example.env" $envFile
    (Get-Content $envFile) -replace "PROJECT_NAME=.*", "PROJECT_NAME=$ProjectName-mpesa-callback" | Set-Content $envFile
}

# Create logs directory
New-Item -ItemType Directory -Path "logs" -Force | Out-Null

# Initialize git repository
Write-Host "🔧 Initializing git repository..." -ForegroundColor Blue
git init
git add .
git commit -m "Initial commit: M-Pesa callback service for $ProjectName"

Write-Host "✅ Project setup completed!" -ForegroundColor Green
Write-Host "📁 Project location: $ProjectDir" -ForegroundColor Blue
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set-Location $ProjectDir"
Write-Host "2. Edit .env file with your credentials"
Write-Host "3. npm install"
Write-Host "4. npm run dev (for development) or .\scripts\deploy.ps1 (for production)"
Write-Host ""
Write-Host "📋 Don't forget to:" -ForegroundColor Yellow
Write-Host "- Update Firebase service account credentials"
Write-Host "- Update M-Pesa API credentials"
Write-Host "- Configure your callback URL in M-Pesa dashboard"