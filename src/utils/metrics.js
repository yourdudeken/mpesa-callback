const logger = require('./logger');

class MetricsCollector {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                callbacks: 0
            },
            response_times: [],
            errors: [],
            uptime: process.uptime()
        };
        
        // Reset metrics every hour
        setInterval(() => this.resetHourlyMetrics(), 60 * 60 * 1000);
    }

    recordRequest(method, url, statusCode, duration) {
        this.metrics.requests.total++;
        
        if (statusCode >= 200 && statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }
        
        if (url.includes('/callback')) {
            this.metrics.requests.callbacks++;
        }
        
        this.metrics.response_times.push({
            method,
            url,
            statusCode,
            duration,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 response times
        if (this.metrics.response_times.length > 1000) {
            this.metrics.response_times = this.metrics.response_times.slice(-1000);
        }
    }

    recordError(error, context = {}) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }
    }

    getMetrics() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        // Filter recent response times
        const recentResponses = this.metrics.response_times.filter(
            r => new Date(r.timestamp).getTime() > oneHourAgo
        );
        
        // Calculate average response time
        const avgResponseTime = recentResponses.length > 0
            ? recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length
            : 0;
        
        // Calculate success rate
        const successRate = this.metrics.requests.total > 0
            ? (this.metrics.requests.success / this.metrics.requests.total) * 100
            : 100;
        
        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            requests: this.metrics.requests,
            performance: {
                avgResponseTime: Math.round(avgResponseTime),
                successRate: Math.round(successRate * 100) / 100,
                recentRequests: recentResponses.length
            },
            errors: {
                total: this.metrics.errors.length,
                recent: this.metrics.errors.filter(
                    e => new Date(e.timestamp).getTime() > oneHourAgo
                ).length
            }
        };
    }

    resetHourlyMetrics() {
        logger.info('Resetting hourly metrics', this.getMetrics());
        
        this.metrics.requests = {
            total: 0,
            success: 0,
            errors: 0,
            callbacks: 0
        };
    }

    // Health check based on metrics
    getHealthStatus() {
        const metrics = this.getMetrics();
        const issues = [];
        
        // Check success rate
        if (metrics.performance.successRate < 95) {
            issues.push(`Low success rate: ${metrics.performance.successRate}%`);
        }
        
        // Check average response time
        if (metrics.performance.avgResponseTime > 5000) {
            issues.push(`High response time: ${metrics.performance.avgResponseTime}ms`);
        }
        
        // Check memory usage
        const memoryUsage = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
        if (memoryUsage > 90) {
            issues.push(`High memory usage: ${Math.round(memoryUsage)}%`);
        }
        
        // Check recent errors
        if (metrics.errors.recent > 10) {
            issues.push(`High error rate: ${metrics.errors.recent} errors in last hour`);
        }
        
        return {
            status: issues.length === 0 ? 'healthy' : 'degraded',
            issues,
            metrics
        };
    }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;