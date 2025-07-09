const admin = require("firebase-admin");
const config = require('./environment');

let db = null;

const initializeFirebase = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = {
        type: "service_account",
        project_id: config.firebase.projectId,
        private_key_id: config.firebase.privateKeyId,
        private_key: config.firebase.privateKey,
        client_email: config.firebase.clientEmail,
        client_id: config.firebase.clientId,
        auth_uri: config.firebase.authUri,
        token_uri: config.firebase.tokenUri,
        auth_provider_x509_cert_url: config.firebase.authProviderCertUrl,
        client_x509_cert_url: config.firebase.clientCertUrl,
    };

    const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    return app;
};

const getFirestore = () => {
    if (!db) {
        initializeFirebase();
    }
    return db;
};

const getTimestamp = () => admin.firestore.Timestamp.now();

module.exports = {
    initializeFirebase,
    getFirestore,
    getTimestamp,
    admin
};