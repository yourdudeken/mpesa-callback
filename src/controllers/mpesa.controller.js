const MpesaService = require('../services/mpesa.service');
const response = require('../utils/response');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

class MpesaController {
    constructor() {
        this.mpesaService = new MpesaService();
    }

    async handleCallback(req, res) {
        try {
            logger.mpesa('Callback received', { 
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const result = await this.mpesaService.processCallback(req.body);

            logger.transaction('processed', result.transactionId, {
                status: result.status,
                success: result.success
            });

            return response.mpesaCallback(
                res, 
                result.transactionId, 
                result.status, 
                result.message
            );

        } catch (error) {
            logger.error('Callback processing failed', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            return response.error(
                res, 
                'Failed to process callback', 
                500
            );
        }
    }

    async getTransactionStatus(req, res) {
        try {
            const { checkoutRequestID } = req.params;

            logger.info('Transaction status requested', { 
                checkoutRequestID,
                ip: req.ip
            });

            const transaction = await this.mpesaService.getTransactionStatus(checkoutRequestID);

            if (!transaction.found) {
                return response.notFound(res, 'Transaction not found');
            }

            return response.transactionStatus(res, transaction);

        } catch (error) {
            logger.error('Transaction status query failed', {
                error: error.message,
                checkoutRequestID: req.params.checkoutRequestID
            });

            return response.error(
                res, 
                'Failed to get transaction status', 
                500
            );
        }
    }

    async getTransactionHistory(req, res) {
        try {
            const { phoneNumber } = req.params;
            const limit = req.query.limit || 10;

            const formattedPhone = Helpers.formatPhoneNumber(phoneNumber);
            if (!formattedPhone) {
                return response.badRequest(res, 'Invalid phone number format');
            }

            logger.info('Transaction history requested', {
                phoneNumber: Helpers.maskPhoneNumber(formattedPhone),
                limit,
                ip: req.ip
            });

            const transactions = await this.mpesaService.getTransactionHistory(
                formattedPhone, 
                limit
            );

            const sanitizedTransactions = transactions.map(transaction => ({
                ...transaction,
                phoneNumber: Helpers.maskPhoneNumber(transaction.phoneNumber || '')
            }));

            return response.transactionHistory(
                res, 
                sanitizedTransactions, 
                Helpers.maskPhoneNumber(formattedPhone)
            );

        } catch (error) {
            logger.error('Transaction history query failed', {
                error: error.message,
                phoneNumber: Helpers.maskPhoneNumber(req.params.phoneNumber)
            });

            return response.error(
                res, 
                'Failed to get transaction history', 
                500
            );
        }
    }

    async healthCheck(req, res) {
        try {
            const health = {
                service: 'M-Pesa Callback Service',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };

            return response.success(res, health, 'Service is healthy');

        } catch (error) {
            logger.error('Health check failed', { error: error.message });
            return response.error(res, 'Health check failed', 500);
        }
    }

    async getTransactionStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return response.badRequest(
                    res, 
                    'Start date and end date are required (YYYY-MM-DD format)'
                );
            }

            logger.info('Transaction stats requested', {
                startDate,
                endDate,
                ip: req.ip
            });

            return response.success(
                res, 
                { message: 'Stats endpoint - coming soon' }, 
                'Feature under development'
            );

        } catch (error) {
            logger.error('Transaction stats query failed', {
                error: error.message,
                query: req.query
            });

            return response.error(
                res, 
                'Failed to get transaction stats', 
                500
            );
        }
    }
}

module.exports = MpesaController;