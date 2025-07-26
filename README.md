# M-Pesa Callback Service

A production-ready, **reusable** M-Pesa callback processing service built with Node.js, Express, and Firebase. Designed for easy deployment across multiple projects with just environment variable changes.

## 🚀 Reusability Features

- **Project-agnostic**: Configure for any project via environment variables
- **Flexible database**: Configurable Firestore collections
- **Simple setup**: Easy configuration with example.env template
- **One-click deployment**: Automated setup scripts
- **Multi-environment**: Separate configs for dev/staging/production

## Features

- **Secure callback processing** with validation and error handling
- **Transaction management** with status tracking and history
- **Comprehensive logging** with structured output
- **Input validation** and sanitization
- **Phone number privacy** with automatic masking
- **Health monitoring** endpoints
- **Graceful shutdown** handling
- **Modular architecture** for easy reuse

## 🚀 Quick Start for New Projects

### Method 1: Use Setup Script (Recommended)
```bash
# Clone the repository
git clone https://github.com/lxmwaniky/mpesa-callback.git
cd mpesa-callback

# Set up for your project
./scripts/setup-project.sh my-ecommerce-store
cd ../my-ecommerce-store-mpesa-callback

# Install dependencies and configure
npm install
# Edit .env with your credentials
./scripts/deploy.sh
```

### Method 2: Manual Setup
```bash
git clone https://github.com/lxmwaniky/mpesa-callback.git
cd mpesa-callback
npm install

# Copy environment file
cp example.env .env

# Edit .env with your project details
npm run dev
```

### Prerequisites

- Node.js 16+ 
- Firebase project with Firestore enabled
- M-Pesa developer account

### Environment Setup

```bash
cp example.env .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Firebase - Option 1: Base64 encoded service account (Recommended)
FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=your-base64-encoded-service-account-json

# M-Pesa
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_ENVIRONMENT=sandbox
```

### Start Development

```bash
npm run dev
```

### Production Deployment

```bash
npm run pm2-start
npm run pm2-save
```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/mpesa/callback` | Process M-Pesa callbacks |
| `GET` | `/api/mpesa/transaction/:id` | Get transaction status |
| `GET` | `/api/mpesa/history/:phone` | Get transaction history |
| `GET` | `/api/mpesa/health` | Service health check |

### Example Requests

#### M-Pesa Callback (Automated)
```bash
curl -X POST http://localhost:5000/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "29115-34620561-1",
        "CheckoutRequestID": "ws_CO_191220191020363925",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            {"Name": "Amount", "Value": 1000},
            {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV"},
            {"Name": "PhoneNumber", "Value": 254722123456}
          ]
        }
      }
    }
  }'
```

#### Get Transaction Status
```bash
curl http://localhost:5000/api/mpesa/transaction/ws_CO_191220191020363925
```

#### Get Transaction History
```bash
curl http://localhost:5000/api/mpesa/history/254722123456?limit=5
```

## Project Structure

```
mpesa-callback/
├── src/
│   ├── config/
│   │   ├── environment.js      # Environment configuration
│   │   └── firebase.js         # Firebase initialization
│   ├── services/
│   │   ├── database.service.js # Database operations
│   │   └── mpesa.service.js    # M-Pesa business logic
│   ├── controllers/
│   │   └── mpesa.controller.js # Request handlers
│   ├── routes/
│   │   ├── index.js           # Route orchestration
│   │   └── mpesa.routes.js    # M-Pesa endpoints
│   ├── middleware/
│   │   ├── validation.middleware.js # Input validation
│   │   ├── error.middleware.js      # Error handling
│   │   └── request.middleware.js    # Request processing
│   └── utils/
│       ├── logger.js          # Structured logging
│       ├── response.js        # Response formatting
│       └── helpers.js         # Utility functions
├── server.js                  # Application entry point
├── package.json
└── example.env
```

## Configuration

### Firebase Setup

1. **Create a Firebase project** at https://console.firebase.google.com
2. **Enable Firestore** in Database section
3. **Generate a service account key**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
4. **Configure Firebase in .env**:
   
   **Option 1 (Recommended): Base64 encode the entire JSON file**
   ```bash
   # On Linux/Mac
   base64 -i path/to/serviceAccountKey.json
   
   # On Windows
   certutil -encode path/to/serviceAccountKey.json temp.txt && findstr /v /c:- temp.txt
   ```
   Then add to `.env`:
   ```env
   FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
   ```
   
   **Option 2: Individual fields** (uncomment in example.env and fill values from JSON)

### M-Pesa Callback URL Configuration

Your callback endpoint is automatically configured at `/api/mpesa/callback`. To set this up:

1. **For local testing**: Use ngrok to expose your local server
   ```bash
   ngrok http 5000
   # Use the HTTPS URL: https://abc123.ngrok.io/api/mpesa/callback
   ```

2. **For production**: Use your domain with HTTPS
   ```
   https://yourdomain.com/api/mpesa/callback
   ```

3. **Configure in M-Pesa Dashboard**:
   - Login to Safaricom Developer Portal
   - Go to your app settings
   - Set the callback URL to your endpoint
   - Ensure the URL is publicly accessible and uses HTTPS

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No (default: development) |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64` | Base64 encoded service account JSON | Yes* |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes* |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Yes* |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Yes* |
| `MPESA_CONSUMER_KEY` | M-Pesa consumer key | No |
| `MPESA_CONSUMER_SECRET` | M-Pesa consumer secret | No |
| `MPESA_PASSKEY` | M-Pesa passkey | No |
| `MPESA_SHORTCODE` | M-Pesa shortcode | No |
| `MPESA_ENVIRONMENT` | M-Pesa environment (sandbox/production) | No |

*Either use `FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64` OR the individual Firebase fields

## Database Schema

### Transactions Collection (`mpesaTransactions`)

```javascript
{
  merchantRequestID: "29115-34620561-1",
  checkoutRequestID: "ws_CO_191220191020363925", // Document ID
  resultCode: 0,
  resultDesc: "Success",
  status: "success", // success|failed|timeout|cancelled
  amount: 1000,
  receiptNumber: "NLJ7RT61SV",
  phoneNumber: "254722123456",
  transactionDate: 20191219102938,
  timestamp: FirebaseTimestamp,
  updatedAt: FirebaseTimestamp
}
```

### Logs Collection (`mpesaLogs`)

```javascript
{
  data: { /* original callback data */ },
  status: "processed", // received|processed|failed
  timestamp: FirebaseTimestamp
}
```

## Development

### Scripts

```bash
npm run dev        # Start development server
npm run start      # Start production server
npm run pm2-start  # Start with PM2
npm run pm2-stop   # Stop PM2 process
npm run pm2-logs   # View PM2 logs
```

### Adding New Features

1. **New Service**: Add to `src/services/`
2. **New Route**: Add to `src/routes/`
3. **New Controller**: Add to `src/controllers/`
4. **New Middleware**: Add to `src/middleware/`

### Testing Callbacks

Use ngrok for local testing:

```bash
ngrok http 5000
# Use the HTTPS URL as your callback URL in M-Pesa
```

## Production Deployment

### Process Management

```bash
# Start with PM2
npm run pm2-start

# Monitor
npm run pm2-status
npm run pm2-logs

# Auto-restart on server reboot
npm run pm2-save
pm2 startup
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure proper logging level
3. Set up monitoring and alerts
4. Configure backup strategy for Firestore

## Security Considerations

- Input validation on all endpoints
- Rate limiting (implement as needed)
- HTTPS in production
- Environment variable security
- Phone number masking in logs
- Error message sanitization

## Monitoring

### Health Endpoints

- `GET /api/health` - Quick health check
- `GET /api/mpesa/health` - Detailed service health

### Logging

Structured JSON logs with:
- Request/response tracking
- Error context
- Performance metrics
- Security events

## Troubleshooting

### Common Issues

1. **Firebase Connection Failed**
   - Check service account credentials
   - Verify project ID
   - Ensure Firestore is enabled

2. **Callback Not Received**
   - Verify URL accessibility
   - Check M-Pesa configuration
   - Review server logs

3. **Transaction Not Found**
   - Check checkout request ID format
   - Verify database permissions
   - Review callback processing logs

### Debug Mode

```bash
LOG_LEVEL=debug npm run dev
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use the provided utilities and helpers

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:
- Check the logs: `npm run pm2-logs`
- Review the troubleshooting section
- Open an issue with detailed context