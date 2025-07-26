# M-Pesa Callback Service - Reusability Guide

## 🎯 Overview

This M-Pesa callback service is designed to be completely reusable across different projects. You can deploy it for multiple applications by simply changing environment variables.

## 🚀 Quick Deployment for New Projects

### Option 1: Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/lxmwaniky/mpesa-callback.git
cd mpesa-callback

# 2. Set up for your specific project
./scripts/setup-project.sh my-project-name ecommerce-store

# 3. Navigate to your new project
cd ../my-project-name-mpesa-callback

# 4. Install and deploy
npm install

# Deploy with Docker (recommended)
./scripts/deploy.sh docker

# OR Deploy with PM2 (traditional)
./scripts/deploy.sh pm2
```

### Option 2: Manual Configuration

```bash
# 1. Clone and install
git clone https://github.com/lxmwaniky/mpesa-callback.git
cd mpesa-callback
npm install

# 2. Create your .env file
cp example.env .env

# 3. Update .env with your project details
# 4. Deploy
npm run deploy
```

##  Configuration Variables

### Project Identity

```env
PROJECT_NAME=your-project-name
PROJECT_DESCRIPTION=Your Project Description
DOCUMENTATION_URL=https://docs.yourproject.com
SUPPORT_EMAIL=support@yourproject.com
```

### Database Collections

```env
TRANSACTIONS_COLLECTION=yourTransactions
LOGS_COLLECTION=yourLogs
ENABLE_CALLBACK_LOGGING=true
```

### Security & Performance

```env
ALLOWED_ORIGINS=https://yourapp.com,https://admin.yourapp.com
RATE_LIMIT_MAX=100
CALLBACK_RATE_LIMIT_MAX=60
```

## 🏗️ Multi-Project Deployment

### Scenario: Deploy for 3 different projects

```bash
# Project 1: E-commerce Store
./scripts/setup-project.sh fashion-store ecommerce-store
cd ../fashion-store-mpesa-callback
# Configure .env for fashion store
./scripts/deploy.sh

# Project 2: SaaS Platform
./scripts/setup-project.sh crm-platform saas-platform
cd ../crm-platform-mpesa-callback
# Configure .env for CRM platform
./scripts/deploy.sh

# Project 3: Mobile App
./scripts/setup-project.sh fitness-app mobile-app
cd ../fitness-app-mpesa-callback
# Configure .env for fitness app
./scripts/deploy.sh
```

Each deployment will:

- Use separate Firestore collections
- Have different rate limits
- Show project-specific API info
- Use project-specific PM2 process names

## 🔄 Environment-Specific Deployments

### Development

```env
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug
MPESA_ENVIRONMENT=sandbox
```

### Staging

```env
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
MPESA_ENVIRONMENT=sandbox
```

### Production

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
MPESA_ENVIRONMENT=production
```

## 📊 Monitoring Multiple Deployments

```bash
# Check all PM2 processes
pm2 list

# Monitor specific project
pm2 logs fashion-store-mpesa-callback

# Health check for specific project
curl https://payments.fashionstore.com/health
```

## 🔐 Security Best Practices

1. **Separate Firebase Projects**: Use different Firebase projects for different applications
2. **Unique Service Accounts**: Generate separate service accounts for each project
3. **Environment Isolation**: Never share .env files between projects
4. **Domain Restrictions**: Set specific ALLOWED_ORIGINS for each project
5. **Rate Limiting**: Adjust rate limits based on expected traffic

## 🚀 Deployment Strategies

### Single Server, Multiple Projects

```bash
# Different ports for different projects
# Project 1: Port 3001
# Project 2: Port 3002
# Project 3: Port 3003
# Use nginx to route based on domain
```

### Separate Servers

```bash
# Each project on its own server/container
# Easier to scale and manage independently
```

### Docker Deployment

```bash
# Build image for each project
docker build -t fashion-store-mpesa .
docker run -d --env-file .env -p 3001:3000 fashion-store-mpesa
```

## 🔧 Customization Points

### 1. Database Schema

- Modify `src/services/database.service.js` for custom fields
- Add project-specific metadata to transactions

### 2. Business Logic

- Extend `src/services/mpesa.service.js` for custom processing
- Add project-specific validation rules

### 3. API Responses

- Customize `src/utils/response.js` for project-specific formats
- Add custom endpoints in `src/routes/`

### 4. Logging

- Modify `src/utils/logger.js` for project-specific log formats
- Add custom log destinations

## 📝 Checklist for New Project

- [ ] Clone repository
- [ ] Copy example.env to .env
- [ ] Update PROJECT_NAME and description
- [ ] Configure Firebase service account
- [ ] Set up M-Pesa credentials
- [ ] Configure database collections
- [ ] Set allowed origins
- [ ] Adjust rate limits
- [ ] Update callback URL in M-Pesa dashboard
- [ ] Test in development
- [ ] Deploy to production
- [ ] Set up monitoring
- [ ] Document project-specific configurations

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Change PORT in .env
2. **Collection conflicts**: Use unique collection names
3. **PM2 name conflicts**: Ensure unique PROJECT_NAME
4. **Firebase permissions**: Use separate service accounts

### Debug Commands

```bash
# Check environment variables
npm run health

# View detailed logs
npm run logs

# Monitor processes
npm run monitor

# Restart specific project
pm2 restart your-project-name
```

## 🐳 Docker Deployment Options

### Quick Docker Deployment
```bash
# Development
npm run docker:dev

# Production
npm run docker:prod

# Custom deployment
./scripts/docker-deploy.sh production
```

### Docker Benefits for Multi-Project
- **Isolation**: Each project runs in its own container
- **Consistency**: Same environment across dev/staging/production
- **Scaling**: Easy horizontal scaling with Docker Swarm/Kubernetes
- **Updates**: Zero-downtime deployments
- **Monitoring**: Built-in health checks and metrics

### VPS Docker Deployment

#### Option 1: Git-based (Recommended)
```bash
# On your VPS
git clone https://github.com/yourusername/my-project-mpesa-callback.git
cd my-project-mpesa-callback

# Configure for production
cp example.env .env
nano .env  # Add production credentials

# Deploy with Docker
./scripts/docker-deploy.sh production

# Monitor
docker-compose logs -f mpesa-callback
```

#### Option 2: Docker Hub
```bash
# Publish locally
docker tag mpesa-callback:latest yourusername/mpesa-callback:latest
docker push yourusername/mpesa-callback:latest

# Deploy on VPS
docker pull yourusername/mpesa-callback:latest
docker run -d --name mpesa-callback --env-file .env -p 3000:3000 yourusername/mpesa-callback:latest
```

This reusable architecture allows you to deploy the same robust M-Pesa callback service across unlimited projects with minimal configuration changes!
