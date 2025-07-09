const config = require('../config/environment');

class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.currentLevel = this.levels[process.env.LOG_LEVEL] || this.levels.info;
        this.colors = {
            error: '\x1b[31m',
            warn: '\x1b[33m',
            info: '\x1b[36m',
            debug: '\x1b[37m',
            reset: '\x1b[0m'
        };
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const colorCode = this.colors[level] || '';
        const resetCode = this.colors.reset;
        
        const baseLog = {
            timestamp,
            level: level.toUpperCase(),
            message,
            environment: config.nodeEnv,
            ...meta
        };

        if (config.nodeEnv === 'development') {
            const coloredLevel = `${colorCode}${level.toUpperCase()}${resetCode}`;
            console.log(`[${timestamp}] ${coloredLevel}: ${message}`);
            
            if (Object.keys(meta).length > 0) {
                console.log(`${colorCode}Meta:${resetCode}`, JSON.stringify(meta, null, 2));
            }
        } else {
            console.log(JSON.stringify(baseLog));
        }

        return baseLog;
    }

    error(message, meta = {}) {
        if (this.currentLevel >= this.levels.error) {
            return this.formatMessage('error', message, meta);
        }
    }

    warn(message, meta = {}) {
        if (this.currentLevel >= this.levels.warn) {
            return this.formatMessage('warn', message, meta);
        }
    }

    info(message, meta = {}) {
        if (this.currentLevel >= this.levels.info) {
            return this.formatMessage('info', message, meta);
        }
    }

    debug(message, meta = {}) {
        if (this.currentLevel >= this.levels.debug) {
            return this.formatMessage('debug', message, meta);
        }
    }

    transaction(action, transactionId, meta = {}) {
        return this.info(`Transaction ${action}`, {
            transactionId,
            action,
            ...meta
        });
    }

    mpesa(event, data = {}) {
        return this.info(`M-Pesa: ${event}`, {
            event,
            mpesa: true,
            ...data
        });
    }

    database(operation, collection, meta = {}) {
        return this.debug(`Database ${operation}`, {
            operation,
            collection,
            database: true,
            ...meta
        });
    }

    api(method, endpoint, statusCode, duration, meta = {}) {
        const level = statusCode >= 400 ? 'error' : 'info';
        return this[level](`API ${method} ${endpoint}`, {
            method,
            endpoint,
            statusCode,
            duration,
            api: true,
            ...meta
        });
    }
}

const logger = new Logger();

module.exports = logger;