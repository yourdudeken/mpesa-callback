const express = require('express');
const mpesaRoutes = require('./mpesa.routes');
const response = require('../utils/response');

const router = express.Router();

router.use('/mpesa', mpesaRoutes);

router.get('/', (req, res) => {
    const apiInfo = {
        name: 'M-Pesa Callback API',
        version: '1.0.0',
        description: 'Secure M-Pesa callback processing service',
        endpoints: {
            callback: 'POST /api/mpesa/callback',
            transactionStatus: 'GET /api/mpesa/transaction/:checkoutRequestID',
            transactionHistory: 'GET /api/mpesa/history/:phoneNumber',
            stats: 'GET /api/mpesa/stats',
            health: 'GET /api/mpesa/health'
        },
        documentation: 'https://developer.safaricom.co.ke/docs',
        support: 'support@yourcompany.com'
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