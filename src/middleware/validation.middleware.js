const validateMpesaCallback = (req, res, next) => {
    try {
        const { body } = req;

        if (!body) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required'
            });
        }

        if (!body.Body) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request structure: Missing Body'
            });
        }

        if (!body.Body.stkCallback) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request structure: Missing stkCallback'
            });
        }

        const { stkCallback } = body.Body;
        const requiredFields = ['MerchantRequestID', 'CheckoutRequestID', 'ResultCode'];
        
        const missingFields = requiredFields.filter(field => 
            stkCallback[field] === undefined || stkCallback[field] === null
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        if (typeof stkCallback.ResultCode !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'ResultCode must be a number'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const validateTransactionQuery = (req, res, next) => {
    try {
        const { checkoutRequestID } = req.params;

        if (!checkoutRequestID) {
            return res.status(400).json({
                success: false,
                error: 'CheckoutRequestID is required'
            });
        }

        if (typeof checkoutRequestID !== 'string' || checkoutRequestID.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'CheckoutRequestID must be a valid string'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const validatePhoneNumber = (req, res, next) => {
    try {
        const { phoneNumber } = req.params;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const phoneRegex = /^254\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Phone number must be in format 254XXXXXXXXX'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const validatePagination = (req, res, next) => {
    try {
        const { limit } = req.query;

        if (limit !== undefined) {
            const limitNum = parseInt(limit);
            
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Limit must be a number between 1 and 100'
                });
            }

            req.query.limit = limitNum;
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validateMpesaCallback,
    validateTransactionQuery,
    validatePhoneNumber,
    validatePagination
};