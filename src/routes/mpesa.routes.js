const express = require('express');
const MpesaController = require('../controllers/mpesa.controller');
const { 
    validateMpesaCallback, 
    validateTransactionQuery, 
    validatePhoneNumber,
    validatePagination 
} = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();
const mpesaController = new MpesaController();

router.post(
    '/callback',
    validateMpesaCallback,
    asyncHandler(async (req, res) => {
        await mpesaController.handleCallback(req, res);
    })
);

router.get(
    '/transaction/:checkoutRequestID',
    validateTransactionQuery,
    asyncHandler(async (req, res) => {
        await mpesaController.getTransactionStatus(req, res);
    })
);

router.get(
    '/history/:phoneNumber',
    validatePhoneNumber,
    validatePagination,
    asyncHandler(async (req, res) => {
        await mpesaController.getTransactionHistory(req, res);
    })
);

router.get(
    '/stats',
    asyncHandler(async (req, res) => {
        await mpesaController.getTransactionStats(req, res);
    })
);

router.get(
    '/health',
    asyncHandler(async (req, res) => {
        await mpesaController.healthCheck(req, res);
    })
);

module.exports = router;