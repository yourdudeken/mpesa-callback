require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json");

app.use(cors());
app.use(bodyParser.json());

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5000;

app.post("/mpesa-callback", async (req, res) => {
    try {
        const { Body } = req.body;
        if (!Body || !Body.stkCallback) {
            return res.status(400).json({ error: "Invalid callback data" });
        }

        const callbackData = Body.stkCallback;

        // Extract transaction details
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

        // If transaction is successful, extract more details
        if (resultCode === 0) {
            const items = callbackData.CallbackMetadata?.Item || [];
            items.forEach((item) => {
                if (item.Name === "Amount") transaction.amount = item.Value;
                if (item.Name === "MpesaReceiptNumber") transaction.receiptNumber = item.Value;
                if (item.Name === "TransactionDate") transaction.transactionDate = item.Value;
                if (item.Name === "PhoneNumber") transaction.phoneNumber = item.Value;
            });
        }

        // Save transaction to Firestore
        await db.collection("mpesaTransactions").doc(checkoutRequestID).set(transaction);

        console.log("Transaction saved:", transaction);

        res.status(200).json({ message: "Transaction saved successfully" });
    } catch (error) {
        console.error("Error saving transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}/mpesa-callback`);
});

