const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// IP-based rate limiting with Redis support (optional)
const createAdvancedRateLimit = (options) => {
    const {
        windowMs = 15 * 60 * 1000,
        max = 100,
        message = 'Too many requests',
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        skipFailedRequests,
        skip: (req) => {
            // Skip rate limiting for health checks
            return req.originalUrl === '/health' || req.originalUrl === '/ready';
        },
        onLimitReached: (req, res, options) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                method: req.method
            });
        }
    });
};

// Request size limiting
const requestSizeLimit = (req, res, next) => {
    const maxSize = process.env.MAX_REQUEST_SIZE || '10mb';
    const contentLength = req.get('content-length');
    
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
        logger.warn('Request size exceeded', {
            ip: req.ip,
            contentLength,
            maxSize,
            url: req.originalUrl
        });
        
        return res.status(413).json({
            success: false,
            error: 'Request entity too large',
            maxSize
        });
    }
    
    next();
};

// Parse size string to bytes
const parseSize = (size) => {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * units[unit]);
};

// IP whitelist/blacklist
const ipFilter = (req, res, next) => {
    const clientIP = req.ip;
    const whitelist = process.env.IP_WHITELIST?.split(',') || [];
    const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
        logger.warn('Blocked IP attempted access', {
            ip: clientIP,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl
        });
        
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
        logger.warn('Non-whitelisted IP attempted access', {
            ip: clientIP,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl
        });
        
        return res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    }
    
    next();
};

// Request timeout
const requestTimeout = (timeout = 30000) => {
    return (req, res, next) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                logger.error('Request timeout', {
                    ip: req.ip,
                    url: req.originalUrl,
                    method: req.method,
                    timeout
                });
                
                res.status(408).json({
                    success: false,
                    error: 'Request timeout'
                });
            }
        }, timeout);
        
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));
        
        next();
    };
};

module.exports = {
    createAdvancedRateLimit,
    requestSizeLimit,
    ipFilter,
    requestTimeout
};