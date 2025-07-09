const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const config = require('./src/config/environment');
const { initializeFirebase } = require('./src/config/firebase');
const routes = require('./src/routes');
const { 
    requestLogger, 
    securityHeaders, 
    corsConfig 
} = require('./src/middleware/request.middleware');
const { 
    notFound, 
    errorHandler 
} = require('./src/middleware/error.middleware');
const logger = require('./src/utils/logger');

const app = express();

initializeFirebase();

app.use(securityHeaders);
app.use(cors(corsConfig));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
    logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString()
    });
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