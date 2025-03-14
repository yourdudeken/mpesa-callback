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
    console.log("🔹 Received M-Pesa Callback:", JSON.stringify(req.body, null, 2));

    try {
        const { Body } = req.body;
        if (!Body || !Body.stkCallback) {
            console.error("❌ Invalid callback data");
            return res.status(400).json({ error: "Invalid callback data" });
        }

        const callbackData = Body.stkCallback;
        console.log("✅ STK Callback Data:", callbackData);

        const merchantRequestID = callbackData.MerchantRequestID;
        const checkoutRequestID = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;
        const resultDesc = callbackData.ResultDesc;

        let transaction = {
            merchantRequestID,
            checkoutRequestID,
            resultCode,
            resultDesc,
            timestamp: admin.firestore.Timestamp.now(),
        };

        if (resultCode === 0) {
            const items = callbackData.CallbackMetadata?.Item || [];
            items.forEach((item) => {
                if (item.Name === "Amount") transaction.amount = item.Value;
                if (item.Name === "MpesaReceiptNumber") transaction.receiptNumber = item.Value;
                if (item.Name === "TransactionDate") transaction.transactionDate = item.Value;
                if (item.Name === "PhoneNumber") transaction.phoneNumber = item.Value;
            });
        }

        console.log("📌 Saving transaction to Firestore:", transaction);
        await db.collection("mpesaTransactions").doc(checkoutRequestID).set(transaction);
        console.log("✅ Transaction saved successfully!");

        res.status(200).json({ message: "Transaction saved successfully" });
    } catch (error) {
        console.error("🚨 Error saving transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}/mpesa-callback`);
});
