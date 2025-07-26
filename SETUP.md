# Quick Setup Guide

## 1. Firebase Configuration (Required)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Follow the setup wizard

### Step 2: Enable Firestore
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)

### Step 3: Generate Service Account Key
1. Go to Project Settings (gear icon) → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)

### Step 4: Configure Environment
**Option A: Base64 Encoding (Recommended)**
```bash
# Encode the JSON file to base64
base64 -i path/to/your-service-account.json

# Add to .env
FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...
```

**Option B: Individual Fields**
Open the JSON file and copy values to .env:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# ... etc
```

## 2. M-Pesa Configuration (Optional for testing)

### Step 1: Get M-Pesa Credentials
1. Go to https://developer.safaricom.co.ke
2. Create an account and app
3. Get your Consumer Key, Consumer Secret, and Passkey

### Step 2: Configure Callback URL
In your M-Pesa app settings, set callback URL to:
- **Local testing**: `https://your-ngrok-url.ngrok.io/api/mpesa/callback`
- **Production**: `https://yourdomain.com/api/mpesa/callback`

### Step 3: Add to Environment
```env
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_ENVIRONMENT=sandbox
```

## 3. Start the Server

```bash
# Install dependencies
npm install

# Copy environment file
cp example.env .env

# Edit .env with your values
# Then start the server
npm run dev
```

## 4. Test the Setup

### Test Callback Endpoint
```bash
curl -X POST http://localhost:5000/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "ws_CO_test123",
        "ResultCode": 0,
        "ResultDesc": "Success",
        "CallbackMetadata": {
          "Item": [
            {"Name": "Amount", "Value": 1000},
            {"Name": "MpesaReceiptNumber", "Value": "TEST123"},
            {"Name": "PhoneNumber", "Value": 254722123456}
          ]
        }
      }
    }
  }'
```

### Check Transaction Status
```bash
curl http://localhost:5000/api/mpesa/transaction/ws_CO_test123
```

## 5. Production Deployment

1. Set `NODE_ENV=production` in .env
2. Use PM2 for process management:
   ```bash
   npm run pm2-start
   npm run pm2-save
   ```
3. Set up HTTPS (required for M-Pesa callbacks)
4. Configure your domain in M-Pesa dashboard

## Troubleshooting

### Firebase Connection Issues
- Verify your service account JSON is valid
- Check that Firestore is enabled
- Ensure your project ID is correct

### Callback Not Working
- Verify your URL is publicly accessible
- Check that you're using HTTPS
- Review server logs: `npm run pm2-logs`

### Transaction Not Found
- Check the checkout request ID format
- Verify the callback was processed successfully
- Check Firestore collections: `mpesaTransactions` and `mpesaLogs`

## Next Steps

- Set up monitoring and alerts
- Configure Firestore security rules
- Implement rate limiting
- Set up backup strategy
- Add custom business logic for your use case