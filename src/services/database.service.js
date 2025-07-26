const { getFirestore, getTimestamp } = require('../config/firebase');
const config = require('../config/environment');

class DatabaseService {
    constructor() {
        this.db = getFirestore();
        this.collections = {
            transactions: config.database.transactionsCollection,
            logs: config.database.logsCollection
        };
    }

    async saveTransaction(transactionData) {
        try {
            const docRef = this.db.collection(this.collections.transactions)
                .doc(transactionData.checkoutRequestID);
            
            const transaction = {
                ...transactionData,
                timestamp: getTimestamp(),
                updatedAt: getTimestamp()
            };

            await docRef.set(transaction);
            return { success: true, id: transactionData.checkoutRequestID };
        } catch (error) {
            throw new Error(`Failed to save transaction: ${error.message}`);
        }
    }

    async getTransaction(checkoutRequestID) {
        try {
            const doc = await this.db.collection(this.collections.transactions)
                .doc(checkoutRequestID).get();
            
            if (!doc.exists) {
                return null;
            }

            return { id: doc.id, ...doc.data() };
        } catch (error) {
            throw new Error(`Failed to get transaction: ${error.message}`);
        }
    }

    async updateTransaction(checkoutRequestID, updateData) {
        try {
            const docRef = this.db.collection(this.collections.transactions)
                .doc(checkoutRequestID);
            
            const update = {
                ...updateData,
                updatedAt: getTimestamp()
            };

            await docRef.update(update);
            return { success: true, id: checkoutRequestID };
        } catch (error) {
            throw new Error(`Failed to update transaction: ${error.message}`);
        }
    }

    async getTransactionsByPhone(phoneNumber, limit = 10) {
        try {
            const query = this.db.collection(this.collections.transactions)
                .where('phoneNumber', '==', phoneNumber)
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            const snapshot = await query.get();
            const transactions = [];
            
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });

            return transactions;
        } catch (error) {
            throw new Error(`Failed to get transactions by phone: ${error.message}`);
        }
    }

    async logCallback(callbackData, status = 'received') {
        // Skip logging if disabled
        if (!config.database.enableLogging) {
            return { success: true };
        }
        
        try {
            const logRef = this.db.collection(this.collections.logs);
            
            const logEntry = {
                data: callbackData,
                status,
                timestamp: getTimestamp(),
                project: config.projectName || 'mpesa-callback'
            };

            await logRef.add(logEntry);
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to log callback: ${error.message}`);
        }
    }
}

module.exports = DatabaseService;