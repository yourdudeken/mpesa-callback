const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./src/config/environment');
const { initializeFirebase } = require('./src/config/firebase');
const routes = require('./src/routes');
const { 
    requestLogger, 
    securityHeaders, 
    corsConfig,
    generalRateLimit,
    callbackRateLimit
} = require('./src/middleware/request.middleware');
const { 
    notFound, 
    errorHandler 
} = require('./src/middleware/error.middleware');
const logger = require('./src/utils/logger');

const app = express();

// Initialize Firebase
initializeFirebase();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Production security middleware
if (config.nodeEnv === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    
    // HTTP request logging for production
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
} else {
    // Development logging
    app.use(morgan('dev'));
}

// Compression middleware
app.use(compression());

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsConfig));

// Rate limiting
app.use('/api/mpesa/callback', callbackRateLimit);
app.use('/api', generalRateLimit);

// Body parsing middleware
app.use(bodyParser.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoints (before rate limiting)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/ready', async (req, res) => {
    try {
        // Check Firebase connection
        const { getFirestore } = require('./src/config/firebase');
        const db = getFirestore();
        await db.collection('health').limit(1).get();
        
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            services: {
                firebase: 'connected',
                server: 'running'
            }
        });
    } catch (error) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: 'Service dependencies not available'
        });
    }
});

// Metrics endpoint (protected)
app.get('/metrics', (req, res) => {
    const metricsCollector = require('./src/utils/metrics');
    const healthStatus = metricsCollector.getHealthStatus();
    
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
});

// API routes
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
    logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        pid: process.pid,
        nodeVersion: process.version
    });
    
    // Signal PM2 that the app is ready
    if (process.send) {
        process.send('ready');
    }
});

const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

module.exports = app;