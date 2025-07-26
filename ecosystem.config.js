// Load environment variables
require('dotenv').config();

module.exports = {
    apps: [{
        name: process.env.PROJECT_NAME || 'mpesa-callback',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',

        // Production environment
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
            LOG_LEVEL: 'info'
        },

        // Development environment
        env_development: {
            NODE_ENV: 'development',
            PORT: 5000,
            LOG_LEVEL: 'debug'
        },

        // PM2 configuration
        watch: false,
        ignore_watch: ['node_modules', 'logs', '.git'],

        // Logging
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

        // Auto restart configuration
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '500M',

        // Advanced features
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 10000,

        // Health monitoring
        health_check_grace_period: 3000,

        // Environment variables that should not be logged
        filter_env: ['FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64', 'MPESA_CONSUMER_SECRET']
    }]
};