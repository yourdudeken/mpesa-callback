require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");

const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/mpesa-callback", async (req, res) => {
    try {
        const { Body } = req.body;
        if (!Body?.stkCallback) {
            return res.status(400).json({ error: "Invalid callback data" });
        }

        const callbackData = Body.stkCallback;
        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

        let transaction = {
            merchantRequestID: MerchantRequestID,
            checkoutRequestID: CheckoutRequestID,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
            timestamp: admin.firestore.Timestamp.now(),
        };

        if (ResultCode === 0) {
            CallbackMetadata?.Item?.forEach((item) => {
                if (item.Name === "Amount") transaction.amount = item.Value;
                if (item.Name === "MpesaReceiptNumber") transaction.receiptNumber = item.Value;
                if (item.Name === "TransactionDate") transaction.transactionDate = item.Value;
                if (item.Name === "PhoneNumber") transaction.phoneNumber = item.Value;
            });
        }

        await db.collection("mpesaTransactions").doc(CheckoutRequestID).set(transaction);
        res.status(200).json({ message: "Transaction saved successfully" });
    } catch (error) {
        console.error("🚨 Error processing M-Pesa callback:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
