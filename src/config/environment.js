require('dotenv').config();

// Parse Firebase service account from base64 if provided
const getFirebaseConfig = () => {
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64) {
        try {
            const serviceAccount = JSON.parse(
                Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
            );
            return {
                projectId: serviceAccount.project_id,
                privateKeyId: serviceAccount.private_key_id,
                privateKey: serviceAccount.private_key,
                clientEmail: serviceAccount.client_email,
                clientId: serviceAccount.client_id,
                authUri: serviceAccount.auth_uri,
                tokenUri: serviceAccount.token_uri,
                authProviderCertUrl: serviceAccount.auth_provider_x509_cert_url,
                clientCertUrl: serviceAccount.client_x509_cert_url,
            };
        } catch (error) {
            throw new Error('Invalid FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64: ' + error.message);
        }
    }
    
    // Fallback to individual environment variables
    return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI,
        tokenUri: process.env.FIREBASE_TOKEN_URI,
        authProviderCertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
    };
};

const config = {
    port: parseInt(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Project configuration
    projectName: process.env.PROJECT_NAME || 'mpesa-callback',
    projectDescription: process.env.PROJECT_DESCRIPTION || 'M-Pesa Callback Service',
    
    // Security
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    
    firebase: getFirebaseConfig(),
    
    // Database configuration
    database: {
        transactionsCollection: process.env.TRANSACTIONS_COLLECTION || 'mpesaTransactions',
        logsCollection: process.env.LOGS_COLLECTION || 'mpesaLogs',
        enableLogging: process.env.ENABLE_CALLBACK_LOGGING !== 'false'
    },

    mpesa: {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        passkey: process.env.MPESA_PASSKEY,
        shortcode: process.env.MPESA_SHORTCODE,
        environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        callbackMax: parseInt(process.env.CALLBACK_RATE_LIMIT_MAX) || 60
    }
};

const validateConfig = () => {
    const requiredFirebaseFields = [
        'projectId', 'privateKey', 'clientEmail'
    ];
    
    const missingFields = requiredFirebaseFields.filter(
        field => !config.firebase[field]
    );
    
    if (missingFields.length > 0) {
        throw new Error(`Missing Firebase config: ${missingFields.join(', ')}`);
    }
};

if (config.nodeEnv !== 'test') {
    validateConfig();
}

module.exports = config;