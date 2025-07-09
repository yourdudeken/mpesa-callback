const logger = require('../utils/logger');

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (error, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.message;

    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(error.errors).map(val => val.message).join(', ');
    }

    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (error.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value';
    }

    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    const errorResponse = {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    logger.error('Error occurred:', {
        error: message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });

    res.status(statusCode).json(errorResponse);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const rateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: req.rateLimit?.resetTime || '1 minute'
    });
};

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    rateLimitHandler
};