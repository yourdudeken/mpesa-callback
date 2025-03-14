require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/mpesa-callback', (req, res) => {
    console.log('M-Pesa Callback Received:', req.body);

    // Extract callback data
    const callbackData = req.body.Body?.stkCallback;
    
    if (!callbackData) {
        return res.status(400).json({ message: 'Invalid callback format' });
    }

    if (callbackData.ResultCode === 0) {
        console.log('✅ Payment Successful:', callbackData);
        // Save to database (if needed)
    } else {
        console.log('❌ Payment Failed:', callbackData.ResultDesc);
    }

    res.status(200).json({ message: 'Callback received' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}/mpesa-callback`);
});

