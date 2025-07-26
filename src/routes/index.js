const express = require('express');
const mpesaRoutes = require('./mpesa.routes');
const response = require('../utils/response');

const router = express.Router();

router.use('/mpesa', mpesaRoutes);

router.get('/', (req, res) => {
    const config = require('../config/environment');
    const packageJson = require('../../package.json');
    
    const apiInfo = {
        name: process.env.PROJECT_NAME || 'M-Pesa Callback API',
        version: packageJson.version,
        description: process.env.PROJECT_DESCRIPTION || 'Secure M-Pesa callback processing service',
        project: process.env.PROJECT_NAME || 'mpesa-callback',
        environment: config.nodeEnv,
        endpoints: {
            callback: 'POST /api/mpesa/callback',
            transactionStatus: 'GET /api/mpesa/transaction/:checkoutRequestID',
            transactionHistory: 'GET /api/mpesa/history/:phoneNumber',
            stats: 'GET /api/mpesa/stats',
            health: 'GET /api/mpesa/health'
        },
        collections: {
            transactions: config.database.transactionsCollection,
            logs: config.database.logsCollection
        },
        documentation: process.env.DOCUMENTATION_URL || 'https://developer.safaricom.co.ke/docs',
        support: process.env.SUPPORT_EMAIL || 'support@yourcompany.com'
    };

    return response.success(res, apiInfo, 'API Information');
});

router.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };

    return response.success(res, health, 'Service is running');
});

module.exports = router;