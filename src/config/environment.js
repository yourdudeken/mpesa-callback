require('dotenv').config();

const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI,
        tokenUri: process.env.FIREBASE_TOKEN_URI,
        authProviderCertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
    },

    mpesa: {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        passkey: process.env.MPESA_PASSKEY,
        shortcode: process.env.MPESA_SHORTCODE,
        environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
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