const logger = require('./logger');

class ResponseFormatter {
    constructor() {
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-API-Version': '1.0'
        };
    }

    success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            ...(data && { data })
        };

        this.setHeaders(res);
        
        logger.api(
            res.req?.method || 'UNKNOWN',
            res.req?.originalUrl || 'UNKNOWN',
            statusCode,
            this.getRequestDuration(res.req)
        );

        return res.status(statusCode).json(response);
    }

    error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
            ...(errors && { errors })
        };

        this.setHeaders(res);

        logger.api(
            res.req?.method || 'UNKNOWN',
            res.req?.originalUrl || 'UNKNOWN',
            statusCode,
            this.getRequestDuration(res.req),
            { error: message }
        );

        return res.status(statusCode).json(response);
    }

    created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    updated(res, data = null, message = 'Resource updated successfully') {
        return this.success(res, data, message, 200);
    }

    deleted(res, message = 'Resource deleted successfully') {
        return this.success(res, null, message, 200);
    }

    notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, 401);
    }

    forbidden(res, message = 'Access forbidden') {
        return this.error(res, message, 403);
    }

    conflict(res, message = 'Resource conflict') {
        return this.error(res, message, 409);
    }

    validationError(res, errors) {
        const message = Array.isArray(errors) 
            ? errors.join(', ')
            : 'Validation failed';
            
        return this.error(res, message, 422, errors);
    }

    mpesaCallback(res, transactionId, status, message = 'Callback processed') {
        const data = {
            transactionId,
            status,
            processed: true
        };

        logger.mpesa('Callback processed', { transactionId, status });
        return this.success(res, data, message);
    }

    transactionStatus(res, transaction) {
        if (!transaction || !transaction.found) {
            return this.notFound(res, 'Transaction not found');
        }

        const data = {
            checkoutRequestID: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            receiptNumber: transaction.receiptNumber,
            phoneNumber: transaction.phoneNumber,
            timestamp: transaction.timestamp
        };

        return this.success(res, data, 'Transaction status retrieved');
    }

    transactionHistory(res, transactions, phoneNumber) {
        const data = {
            phoneNumber,
            count: transactions.length,
            transactions
        };

        return this.success(res, data, 'Transaction history retrieved');
    }

    pagination(res, data, page, limit, total, message = 'Data retrieved') {
        const totalPages = Math.ceil(total / limit);
        
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        this.setHeaders(res);
        return res.status(200).json(response);
    }

    setHeaders(res) {
        Object.entries(this.defaultHeaders).forEach(([key, value]) => {
            res.set(key, value);
        });
    }

    getRequestDuration(req) {
        if (req && req.startTime) {
            return `${Date.now() - req.startTime}ms`;
        }
        return 'unknown';
    }
}

const responseFormatter = new ResponseFormatter();

module.exports = responseFormatter;