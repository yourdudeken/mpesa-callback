const crypto = require('crypto');

class Helpers {
    static generateId(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    static generateTimestamp() {
        return Math.floor(Date.now() / 1000);
    }

    static formatPhoneNumber(phone) {
        if (!phone) return null;
        
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1);
        } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
            cleaned = '254' + cleaned;
        } else if (!cleaned.startsWith('254')) {
            return null;
        }
        
        if (cleaned.length !== 12) {
            return null;
        }
        
        return cleaned;
    }

    static formatAmount(amount) {
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        
        if (isNaN(amount)) {
            return null;
        }
        
        return Math.round(amount * 100) / 100;
    }

    static formatCurrency(amount, currency = 'KES') {
        const formatted = this.formatAmount(amount);
        if (formatted === null) return null;
        
        return `${currency} ${formatted.toLocaleString()}`;
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .trim()
            .replace(/[<>]/g, '')
            .replace(/script/gi, '')
            .substring(0, 255);
    }

    static maskPhoneNumber(phone) {
        if (!phone || phone.length < 8) return phone;
        
        const start = phone.substring(0, 3);
        const end = phone.substring(phone.length - 4);
        const middle = '*'.repeat(phone.length - 7);
        
        return `${start}${middle}${end}`;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidKenyanPhone(phone) {
        const phoneRegex = /^254[17]\d{8}$/;
        return phoneRegex.test(phone);
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static retry(fn, retries = 3, delay = 1000) {
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    const result = await fn();
                    resolve(result);
                    return;
                } catch (error) {
                    if (i === retries) {
                        reject(error);
                        return;
                    }
                    await this.sleep(delay * Math.pow(2, i));
                }
            }
        });
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    static omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
        });
        return result;
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    static generateReference(prefix = 'REF') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }
}

module.exports = Helpers;